package handlers

import (
	"crypto/sha256"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

// Allowed standard widths (aligned with Next.js device sizes)
var allowedDeviceWidths = []int{16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840}

// mutex per cache key to prevent dog-piling / stampede
var (
	processingLocks   = make(map[string]*sync.Mutex)
	processingLocksMu sync.Mutex
)

func getLockForKey(key string) *sync.Mutex {
	processingLocksMu.Lock()
	defer processingLocksMu.Unlock()
	mu, exists := processingLocks[key]
	if !exists {
		mu = &sync.Mutex{}
		processingLocks[key] = mu
	}
	return mu
}

func isDevMode() bool {
	env := strings.ToLower(os.Getenv("APP_ENV"))
	if env == "" {
		env = strings.ToLower(os.Getenv("ENV"))
	}
	return env != "production"
}

func getCacheDir() string {
	cacheDir := filepath.Join(UploadBaseDir, ".cache")
	_ = os.MkdirAll(cacheDir, 0755)
	return cacheDir
}

// Clean and validate path against allowed root directories to prevent directory traversal
func resolveImagePath(rawPath string) (string, error) {
	clean := strings.TrimSpace(rawPath)
	clean = strings.TrimPrefix(clean, "/")
	clean = filepath.Clean(clean)

	if strings.Contains(clean, "..") {
		return "", fmt.Errorf("invalid path traversal attempt")
	}

	var candidatePaths []string

	if strings.HasPrefix(clean, "uploads"+string(filepath.Separator)) || strings.HasPrefix(clean, "uploads/") {
		rel := strings.TrimPrefix(clean, "uploads"+string(filepath.Separator))
		rel = strings.TrimPrefix(rel, "uploads/")
		candidatePaths = append(candidatePaths, filepath.Join(UploadBaseDir, rel))
	} else if strings.HasPrefix(clean, "images"+string(filepath.Separator)) || strings.HasPrefix(clean, "images/") {
		candidatePaths = append(candidatePaths,
			filepath.Join("frontend", "public", clean),
			filepath.Join("dist", clean),
		)
	} else {
		// Default check inside uploads
		candidatePaths = append(candidatePaths, filepath.Join(UploadBaseDir, clean))
		// Also fallback check in frontend/public
		candidatePaths = append(candidatePaths,
			filepath.Join("frontend", "public", clean),
			filepath.Join("dist", clean),
		)
	}

	for _, cand := range candidatePaths {
		absCand, err := filepath.Abs(cand)
		if err != nil {
			continue
		}
		if info, err := os.Stat(absCand); err == nil && !info.IsDir() {
			return absCand, nil
		}
	}

	return "", fmt.Errorf("file not found: %s", rawPath)
}

// Normalize width parameter
func normalizeWidth(rawW string) int {
	if rawW == "" {
		return 0
	}
	w, err := strconv.Atoi(rawW)
	if err != nil || w <= 0 {
		return 0
	}
	// Clamp width between 16 and 3840
	if w > 3840 {
		w = 3840
	}
	if w < 16 {
		w = 16
	}
	return w
}

// Normalize quality parameter (10 - 100, default 75)
func normalizeQuality(rawQ string) int {
	if rawQ == "" {
		return 75
	}
	q, err := strconv.Atoi(rawQ)
	if err != nil || q < 10 {
		return 75
	}
	if q > 100 {
		return 100
	}
	return q
}

// Determine best output format
func determineFormat(r *http.Request, explicitFormat, srcExt string) string {
	explicit := strings.ToLower(strings.TrimSpace(explicitFormat))
	if explicit == "webp" || explicit == "jpeg" || explicit == "jpg" || explicit == "png" {
		if explicit == "jpg" {
			return "jpeg"
		}
		return explicit
	}

	// SVG should stay SVG
	if srcExt == ".svg" {
		return "svg"
	}
	// GIF without explicit conversion stays GIF
	if srcExt == ".gif" {
		return "gif"
	}

	// Auto format negotiation based on Accept header
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "image/webp") {
		return "webp"
	}

	if srcExt == ".png" {
		return "png"
	}
	return "jpeg"
}

// ServeOptimizedUpload handles GET /uploads/* with optional optimization queries
// e.g. /uploads/2026/10/photo.jpg?w=800&q=75&format=webp
func ServeOptimizedUpload(w http.ResponseWriter, r *http.Request) {
	relPath := r.URL.Path

	w.Header().Set("X-Content-Type-Options", "nosniff")

	// If no image processing queries are present, serve directly with caching headers
	q := r.URL.Query()
	if q.Get("w") == "" && q.Get("width") == "" && q.Get("q") == "" && q.Get("quality") == "" && q.Get("format") == "" {
		if isDevMode() {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=86400")
		}
		fileServer := http.StripPrefix("/uploads/", http.FileServer(http.Dir(UploadBaseDir)))
		fileServer.ServeHTTP(w, r)
		return
	}

	processAndServeImage(w, r, relPath)
}

// OptimizeImageEndpoint handles Next.js-style GET /api/v1/images?url=...&w=...&q=...
func OptimizeImageEndpoint(w http.ResponseWriter, r *http.Request) {
	rawURL := r.URL.Query().Get("url")
	if rawURL == "" {
		WriteError(w, http.StatusBadRequest, "Missing 'url' query parameter")
		return
	}

	// Parse URL
	parsed, err := url.Parse(rawURL)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid image URL")
		return
	}

	processAndServeImage(w, r, parsed.Path)
}

func processAndServeImage(w http.ResponseWriter, r *http.Request, relPath string) {
	diskPath, err := resolveImagePath(relPath)
	if err != nil {
		WriteError(w, http.StatusNotFound, err.Error())
		return
	}

	fileInfo, err := os.Stat(diskPath)
	if err != nil {
		WriteError(w, http.StatusNotFound, "Image not found")
		return
	}

	if fileInfo.IsDir() {
		WriteError(w, http.StatusBadRequest, "Target is a directory")
		return
	}

	srcExt := strings.ToLower(filepath.Ext(diskPath))

	// SVGs do not need bitmap resizing/conversion
	if srcExt == ".svg" {
		w.Header().Set("Content-Type", "image/svg+xml")
		if isDevMode() {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		} else {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}
		http.ServeFile(w, r, diskPath)
		return
	}

	queryParams := r.URL.Query()
	widthParam := queryParams.Get("w")
	if widthParam == "" {
		widthParam = queryParams.Get("width")
	}
	targetWidth := normalizeWidth(widthParam)

	qualityParam := queryParams.Get("q")
	if qualityParam == "" {
		qualityParam = queryParams.Get("quality")
	}
	targetQuality := normalizeQuality(qualityParam)

	targetFormat := determineFormat(r, queryParams.Get("format"), srcExt)

	// Build Cache Key based on file modification time, size, and transformation parameters
	keyRaw := fmt.Sprintf("%s:%d:%d:%d:%d:%s",
		diskPath,
		fileInfo.ModTime().UnixNano(),
		fileInfo.Size(),
		targetWidth,
		targetQuality,
		targetFormat,
	)
	hasher := sha256.New()
	hasher.Write([]byte(keyRaw))
	cacheHash := fmt.Sprintf("%x", hasher.Sum(nil))

	etag := fmt.Sprintf(`"%s"`, cacheHash)
	w.Header().Set("ETag", etag)
	if isDevMode() {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	} else {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	}
	w.Header().Set("X-Image-Optimizer", "school-cms-engine/1.0")

	// If browser sent matching ETag, return 304 Not Modified immediately
	if match := r.Header.Get("If-None-Match"); match != "" {
		if strings.Contains(match, cacheHash) {
			w.WriteHeader(http.StatusNotModified)
			return
		}
	}

	cacheFile := filepath.Join(getCacheDir(), fmt.Sprintf("%s.%s", cacheHash, targetFormat))

	// Check if already in disk cache (bypass disk cache in dev mode so updates reflect immediately)
	if !isDevMode() {
		if _, err := os.Stat(cacheFile); err == nil {
			serveCachedFile(w, r, cacheFile, targetFormat)
			return
		}
	}

	// Acquire lock for this specific cache key to prevent concurrent duplicate processing
	lock := getLockForKey(cacheHash)
	lock.Lock()
	defer lock.Unlock()

	// Double check cache after lock acquired
	if !isDevMode() {
		if _, err := os.Stat(cacheFile); err == nil {
			serveCachedFile(w, r, cacheFile, targetFormat)
			return
		}
	}

	// Decode source image
	srcImg, err := imaging.Open(diskPath, imaging.AutoOrientation(true))
	if err != nil {
		log.Printf("Image Optimizer: failed to decode %s: %v", diskPath, err)
		http.ServeFile(w, r, diskPath)
		return
	}

	// Resize if targetWidth is requested and smaller than original width
	origBounds := srcImg.Bounds()
	origWidth := origBounds.Dx()

	var finalImg image.Image = srcImg
	if targetWidth > 0 && targetWidth < origWidth {
		finalImg = imaging.Resize(srcImg, targetWidth, 0, imaging.Lanczos)
	}

	// Write to temporary cache file first to ensure atomic write
	tmpCacheFile := fmt.Sprintf("%s.tmp-%d", cacheFile, os.Getpid())
	out, err := os.Create(tmpCacheFile)
	if err != nil {
		log.Printf("Image Optimizer: failed to create cache file: %v", err)
		http.ServeFile(w, r, diskPath)
		return
	}

	var encodeErr error
	switch targetFormat {
	case "webp":
		encodeErr = webp.Encode(out, finalImg, &webp.Options{
			Lossless: false,
			Quality:  float32(targetQuality),
		})
	case "jpeg":
		encodeErr = jpeg.Encode(out, finalImg, &jpeg.Options{
			Quality: targetQuality,
		})
	case "png":
		encodeErr = png.Encode(out, finalImg)
	default:
		encodeErr = jpeg.Encode(out, finalImg, &jpeg.Options{
			Quality: targetQuality,
		})
	}

	out.Close()

	if encodeErr != nil {
		_ = os.Remove(tmpCacheFile)
		log.Printf("Image Optimizer: failed to encode image to %s: %v", targetFormat, encodeErr)
		http.ServeFile(w, r, diskPath)
		return
	}

	// Rename temp file to final cache file
	if err := os.Rename(tmpCacheFile, cacheFile); err != nil {
		_ = os.Remove(tmpCacheFile)
		log.Printf("Image Optimizer: rename cache file failed: %v", err)
	}

	serveCachedFile(w, r, cacheFile, targetFormat)
}

func serveCachedFile(w http.ResponseWriter, r *http.Request, cachePath, format string) {
	switch format {
	case "webp":
		w.Header().Set("Content-Type", "image/webp")
	case "jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case "png":
		w.Header().Set("Content-Type", "image/png")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	f, err := os.Open(cachePath)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to read cached image")
		return
	}
	defer f.Close()

	if stat, err := f.Stat(); err == nil {
		w.Header().Set("Content-Length", strconv.FormatInt(stat.Size(), 10))
	}

	_, _ = io.Copy(w, f)
}
