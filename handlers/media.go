package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"
	"time"
)

const (
	UploadBaseDir = "./uploads"
	MaxFileSize   = 25 << 20 // 25 MB
)

// EnsureUploadDir creates the directory if not exists
func EnsureUploadDir() string {
	now := time.Now()
	subDir := fmt.Sprintf("%d/%02d", now.Year(), now.Month())
	targetDir := filepath.Join(UploadBaseDir, subDir)
	_ = os.MkdirAll(targetDir, 0755)
	return subDir
}

// SaveMediaFromURL downloads a file from external URL and stores it permanently
func SaveMediaFromURL(sourceURL, altText, agentName string) (*models.Media, error) {
	if strings.TrimSpace(sourceURL) == "" {
		return nil, fmt.Errorf("source_url is required")
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(sourceURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch image from URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("remote server returned status: %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	ext := ".jpg"
	if extensions, _ := mime.ExtensionsByType(contentType); len(extensions) > 0 {
		ext = extensions[0]
	} else if strings.HasSuffix(strings.ToLower(sourceURL), ".png") {
		ext = ".png"
	} else if strings.HasSuffix(strings.ToLower(sourceURL), ".webp") {
		ext = ".webp"
	} else if strings.HasSuffix(strings.ToLower(sourceURL), ".pdf") {
		ext = ".pdf"
	}

	subDir := EnsureUploadDir()
	uniqueName := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), "ai", ext)
	diskPath := filepath.Join(UploadBaseDir, subDir, uniqueName)

	out, err := os.Create(diskPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create local file: %w", err)
	}
	defer out.Close()

	size, err := io.Copy(out, resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to save media content: %w", err)
	}

	publicURL := fmt.Sprintf("/uploads/%s/%s", filepath.ToSlash(subDir), uniqueName)

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
		WriteError(w, http.StatusBadRequest, "File too large or invalid multipart form")
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Missing 'file' field in form")
		return
	}
	defer file.Close()

	altText := r.FormValue("alt_text")
	agentName := r.FormValue("agent_name")
	createdByAgent := agentName != ""

	ext := filepath.Ext(handler.Filename)
	if ext == "" {
		ext = ".bin"
	}

	subDir := EnsureUploadDir()
	uniqueName := fmt.Sprintf("%d-%s%s", time.Now().UnixNano(), "upload", ext)
	diskPath := filepath.Join(UploadBaseDir, subDir, uniqueName)

	dst, err := os.Create(diskPath)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save file on disk: "+err.Error())
		return
	}
	defer dst.Close()

	size, err := io.Copy(dst, file)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to write file data: "+err.Error())
		return
	}

	mimeType := handler.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = mime.TypeByExtension(ext)
	}

	publicURL := fmt.Sprintf("/uploads/%s/%s", filepath.ToSlash(subDir), uniqueName)

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
