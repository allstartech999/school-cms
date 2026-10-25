package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"school-cms/db"
	"school-cms/models"
	"school-cms/storage"
	"strconv"
	"strings"
	"time"
)

const (
	UploadBaseDir = "./uploads"
	MaxFileSize   = 25 << 20 // 25 MB
)

// Allowed upload file extensions and their canonical MIME types
var allowedUploadExtensions = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
	".pdf":  "application/pdf",
}

// EnsureUploadDir creates the directory if not exists
func EnsureUploadDir() string {
	now := time.Now()
	subDir := fmt.Sprintf("%d/%02d", now.Year(), now.Month())
	targetDir := filepath.Join(UploadBaseDir, subDir)
	_ = os.MkdirAll(targetDir, 0755)
	return subDir
}

// isSafeURL validates a URL to prevent SSRF attacks targeting localhost, private LAN, or cloud metadata services
func isSafeURL(rawURL string) (*url.URL, error) {
	parsed, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}

	scheme := strings.ToLower(parsed.Scheme)
	if scheme != "http" && scheme != "https" {
		return nil, fmt.Errorf("unsupported protocol: %s (only http and https allowed)", scheme)
	}

	hostname := parsed.Hostname()
	if hostname == "" {
		return nil, fmt.Errorf("missing host in URL")
	}

	// Block loopback aliases and internal domain suffixes
	lowerHost := strings.ToLower(hostname)
	if lowerHost == "localhost" || strings.HasSuffix(lowerHost, ".localhost") || strings.HasSuffix(lowerHost, ".local") || strings.HasSuffix(lowerHost, ".internal") {
		return nil, fmt.Errorf("requests to internal host (%s) are blocked", hostname)
	}

	// Resolve host IPs to detect loopback/private/metadata destinations
	ips, err := net.LookupIP(hostname)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve host %s: %w", hostname, err)
	}

	for _, ip := range ips {
		if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
			return nil, fmt.Errorf("access to internal/private IP address (%s) is prohibited", ip.String())
		}
	}

	return parsed, nil
}

// SaveMediaFromURL downloads a file from external URL and stores it permanently with SSRF protection
func SaveMediaFromURL(sourceURL, altText, agentName string) (*models.Media, error) {
	if strings.TrimSpace(sourceURL) == "" {
		return nil, fmt.Errorf("source_url is required")
	}

	// Validate target against SSRF (reject private IPs, metadata IP, localhost)
	if _, err := isSafeURL(sourceURL); err != nil {
		return nil, fmt.Errorf("security policy rejected URL: %w", err)
	}

	client := &http.Client{
		Timeout: 20 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return fmt.Errorf("too many redirects")
			}
			if _, err := isSafeURL(req.URL.String()); err != nil {
				return fmt.Errorf("security policy rejected redirect URL: %w", err)
			}
			return nil
		},
	}

	resp, err := client.Get(sourceURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch image from URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("remote server returned status: %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	// Clean contentType (e.g. "image/jpeg; charset=utf-8")
	if semi := strings.Index(contentType, ";"); semi != -1 {
		contentType = strings.TrimSpace(contentType[:semi])
	}

	var ext string
	switch strings.ToLower(contentType) {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	case "image/gif":
		ext = ".gif"
	case "application/pdf":
		ext = ".pdf"
	default:
		// Attempt fallback by source URL extension if allowed
		sourceExt := strings.ToLower(filepath.Ext(sourceURL))
		if safeMime, ok := allowedUploadExtensions[sourceExt]; ok {
			ext = sourceExt
			contentType = safeMime
		} else {
			return nil, fmt.Errorf("unsupported remote media type: %s", contentType)
		}
	}

	uniqueName := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), "ai", ext)
	provider := storage.GetActiveProvider()

	// Read limited bytes to prevent DoS via huge downloads
	limitReader := io.LimitReader(resp.Body, MaxFileSize)
	publicURL, size, err := provider.Save(context.Background(), uniqueName, limitReader, resp.ContentLength, contentType)
	if err != nil {
		return nil, fmt.Errorf("failed to save media content: %w", err)
	}

	if altText == "" {
		altText = "ภาพประกอบจาก AI Agent"
	}

	media := models.Media{
		Filename:       uniqueName,
		OriginalName:   filepath.Base(sourceURL),
		URL:            publicURL,
		MimeType:       contentType,
		SizeBytes:      size,
		AltText:        altText,
		CreatedByAgent: true,
		AgentName:      agentName,
	}

	if err := db.DB.Create(&media).Error; err != nil {
		return nil, fmt.Errorf("failed to record media in database: %w", err)
	}

	return &media, nil
}

// UploadMedia handles POST /api/v1/media/upload (Multipart form)
func UploadMedia(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(MaxFileSize); err != nil {
		WriteError(w, http.StatusBadRequest, "File too large or invalid multipart form (max 25MB)")
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Missing 'file' field in form")
		return
	}
	defer file.Close()

	// 1. Validate file extension against strict whitelist
	ext := strings.ToLower(filepath.Ext(handler.Filename))
	expectedMime, allowed := allowedUploadExtensions[ext]
	if !allowed {
		WriteError(w, http.StatusBadRequest, "ประเภทไฟล์ไม่ได้รับอนุญาต (รองรับเฉพาะ JPG, PNG, WEBP, GIF, PDF)")
		return
	}

	// 2. MIME Sniffing: verify magic bytes to prevent HTML/SVG/executable disguise
	sniffBuf := make([]byte, 512)
	n, readErr := file.Read(sniffBuf)
	if readErr != nil && readErr != io.EOF {
		WriteError(w, http.StatusBadRequest, "ไม่สามารถอ่านเนื้อหาไฟล์ได้")
		return
	}
	detectedMime := http.DetectContentType(sniffBuf[:n])

	// Disallow scripts / HTML disguised as images
	if strings.HasPrefix(detectedMime, "text/html") ||
		strings.HasPrefix(detectedMime, "text/xml") ||
		strings.HasPrefix(detectedMime, "application/javascript") ||
		strings.HasPrefix(detectedMime, "application/x-executable") {
		WriteError(w, http.StatusBadRequest, "ไฟล์ที่อัปโหลดไม่ปลอดภัยหรือมีเนื้อหาไม่ตรงกับนามสกุลไฟล์")
		return
	}

	// Reset read pointer after sniffing
	if seeker, ok := file.(io.Seeker); ok {
		if _, err := seeker.Seek(0, io.SeekStart); err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to rewind file buffer")
			return
		}
	}

	altText := r.FormValue("alt_text")
	agentName := r.FormValue("agent_name")
	createdByAgent := agentName != ""

	uniqueName := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), "upload", ext)
	mimeType := expectedMime

	provider := storage.GetActiveProvider()
	publicURL, size, err := provider.Save(r.Context(), uniqueName, file, handler.Size, mimeType)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save media: "+err.Error())
		return
	}

	media := models.Media{
		Filename:       uniqueName,
		OriginalName:   handler.Filename,
		URL:            publicURL,
		MimeType:       mimeType,
		SizeBytes:      size,
		AltText:        altText,
		CreatedByAgent: createdByAgent,
		AgentName:      agentName,
	}

	if err := db.DB.Create(&media).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save media metadata: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, media)
}

// AgentFetchMedia handles POST /api/v1/agent/media/fetch
func AgentFetchMedia(w http.ResponseWriter, r *http.Request) {
	var req models.AgentFetchMediaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if req.AgentName == "" {
		req.AgentName = "AI Media Assistant"
	}

	media, err := SaveMediaFromURL(req.SourceURL, req.AltText, req.AgentName)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, media)
}

// ListMedia handles GET /api/v1/media
func ListMedia(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if lStr := r.URL.Query().Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	var media []models.Media
	if err := db.DB.Order("created_at DESC").Limit(limit).Find(&media).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to query media: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, media)
}

// DeleteMedia handles DELETE /api/v1/media/{id}
func DeleteMedia(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "Missing media id")
		return
	}

	var media models.Media
	if err := db.DB.First(&media, "id = ?", id).Error; err != nil {
		WriteError(w, http.StatusNotFound, "Media not found")
		return
	}

	// Delete file using storage provider
	provider := storage.GetActiveProvider()
	_ = provider.Delete(r.Context(), media.URL)

	// Fallback delete from local disk if it was stored locally
	if strings.HasPrefix(media.URL, "/uploads/") {
		trimmed := strings.TrimPrefix(media.URL, "/uploads/")
		localPath := filepath.Join(UploadBaseDir, filepath.FromSlash(trimmed))
		_ = os.Remove(localPath)
	}

	if err := db.DB.Delete(&media).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete media record: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Media deleted successfully",
		"id":      media.ID,
	})
}
