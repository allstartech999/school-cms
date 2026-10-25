package storage

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestLocalStorageProvider(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "school_test_uploads_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	provider := &LocalStorageProvider{baseDir: tempDir}
	if provider.ID() != "storage-local" {
		t.Errorf("Expected ID storage-local, got %s", provider.ID())
	}

	// Test connection
	if err := provider.TestConnection(context.Background()); err != nil {
		t.Fatalf("TestConnection failed: %v", err)
	}

	// Test Save
	content := []byte("Hello School CMS Storage Test")
	pubURL, size, err := provider.Save(context.Background(), "test-file.txt", bytes.NewReader(content), int64(len(content)), "text/plain")
	if err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	if size != int64(len(content)) {
		t.Errorf("Expected size %d, got %d", len(content), size)
	}

	if !strings.HasPrefix(pubURL, "/uploads/") || !strings.HasSuffix(pubURL, "test-file.txt") {
		t.Errorf("Unexpected public URL format: %s", pubURL)
	}

	// Verify file is on disk
	rel := strings.TrimPrefix(pubURL, "/uploads/")
	diskPath := filepath.Join(tempDir, filepath.FromSlash(rel))
	data, err := os.ReadFile(diskPath)
	if err != nil {
		t.Fatalf("Failed to read saved file from disk: %v", err)
	}
	if string(data) != string(content) {
		t.Errorf("File content mismatch: expected %q, got %q", content, data)
	}

	// Test Delete
	if err := provider.Delete(context.Background(), pubURL); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	if _, err := os.Stat(diskPath); !os.IsNotExist(err) {
		t.Errorf("Expected file to be deleted from disk, but it still exists")
	}
}

func TestS3CompatibleProvider(t *testing.T) {
	var receivedAuth string
	var receivedMethod string
	var receivedPath string
	var receivedBody []byte

	// Mock S3 server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		receivedMethod = r.Method
		receivedPath = r.URL.Path
		receivedAuth = r.Header.Get("Authorization")
		body, _ := io.ReadAll(r.Body)
		receivedBody = body
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	cfg := S3Config{
		Endpoint:        server.URL,
		Region:          "auto",
		Bucket:          "my-school-bucket",
		AccessKeyID:     "AKIAIOSFODNN7EXAMPLE",
		SecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
		PublicURLPrefix: "https://cdn.myschool.ac.th",
	}

	p, err := NewS3Provider("storage-r2", "Cloudflare R2", cfg)
	if err != nil {
		t.Fatalf("Failed to create S3 provider: %v", err)
	}

	// Test Save
	testData := []byte("Cloudflare R2 test payload")
	pubURL, size, err := p.Save(context.Background(), "avatar.png", bytes.NewReader(testData), int64(len(testData)), "image/png")
	if err != nil {
		t.Fatalf("S3 Save failed: %v", err)
	}

	if pubURL != "https://cdn.myschool.ac.th/avatar.png" {
		t.Errorf("Expected CDN URL https://cdn.myschool.ac.th/avatar.png, got %s", pubURL)
	}
	if size != int64(len(testData)) {
		t.Errorf("Expected size %d, got %d", len(testData), size)
	}

	if receivedMethod != http.MethodPut {
		t.Errorf("Expected PUT method, got %s", receivedMethod)
	}
	if receivedPath != "/my-school-bucket/avatar.png" {
		t.Errorf("Expected path /my-school-bucket/avatar.png, got %s", receivedPath)
	}
	if !strings.HasPrefix(receivedAuth, "AWS4-HMAC-SHA256") {
		t.Errorf("Expected AWS4-HMAC-SHA256 in Authorization header, got %s", receivedAuth)
	}
	if string(receivedBody) != string(testData) {
		t.Errorf("Received body mismatch: %s", string(receivedBody))
	}

	// Test Delete
	if err := p.Delete(context.Background(), pubURL); err != nil {
		t.Fatalf("S3 Delete failed: %v", err)
	}
	if receivedMethod != http.MethodDelete {
		t.Errorf("Expected DELETE method, got %s", receivedMethod)
	}
	if receivedPath != "/my-school-bucket/avatar.png" {
		t.Errorf("Expected path /my-school-bucket/avatar.png, got %s", receivedPath)
	}

	// Test TestConnection
	if err := p.TestConnection(context.Background()); err != nil {
		t.Fatalf("S3 TestConnection failed: %v", err)
	}
}
