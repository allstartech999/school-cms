package handlers

import (
	"image"
	"image/color"
	"image/jpeg"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestImageOptimizer(t *testing.T) {
	// 1. Prepare dummy test image in UploadBaseDir
	_ = os.MkdirAll(UploadBaseDir, 0755)
	testFilename := "optimizer_test_sample.jpg"
	testFilePath := filepath.Join(UploadBaseDir, testFilename)

	// Create 800x600 test image
	img := image.NewRGBA(image.Rect(0, 0, 800, 600))
	for y := 0; y < 600; y++ {
		for x := 0; x < 800; x++ {
			img.Set(x, y, color.RGBA{R: uint8(x % 256), G: uint8(y % 256), B: 100, A: 255})
		}
	}

	outFile, err := os.Create(testFilePath)
	if err != nil {
		t.Fatalf("failed to create test image: %v", err)
	}
	if err := jpeg.Encode(outFile, img, &jpeg.Options{Quality: 90}); err != nil {
		outFile.Close()
		t.Fatalf("failed to encode sample jpeg: %v", err)
	}
	outFile.Close()
	defer os.Remove(testFilePath)

	// 2. Test Next.js style /uploads/ request with query params
	t.Run("Optimize on /uploads/ with w=400 and format=webp", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/uploads/"+testFilename+"?w=400&q=80&format=webp", nil)
		w := httptest.NewRecorder()

		ServeOptimizedUpload(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}

		contentType := w.Header().Get("Content-Type")
		if contentType != "image/webp" {
			t.Errorf("expected Content-Type 'image/webp', got '%s'", contentType)
		}

		etag := w.Header().Get("ETag")
		if etag == "" {
			t.Errorf("expected ETag header to be present")
		}

		if w.Body.Len() == 0 {
			t.Errorf("expected non-empty image response body")
		}

		// 3. Test 304 Not Modified caching with If-None-Match
		reqCached := httptest.NewRequest("GET", "/uploads/"+testFilename+"?w=400&q=80&format=webp", nil)
		reqCached.Header.Set("If-None-Match", etag)
		wCached := httptest.NewRecorder()

		ServeOptimizedUpload(wCached, reqCached)

		if wCached.Code != http.StatusNotModified {
			t.Errorf("expected status 304 Not Modified, got %d", wCached.Code)
		}
	})

	// 4. Test /api/v1/images endpoint
	t.Run("Next.js style /api/v1/images endpoint", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/images?url=/uploads/"+testFilename+"&w=250&q=75", nil)
		w := httptest.NewRecorder()

		OptimizeImageEndpoint(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}

		if w.Header().Get("X-Image-Optimizer") == "" {
			t.Errorf("expected X-Image-Optimizer header")
		}
	})
}
