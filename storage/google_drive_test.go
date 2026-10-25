package storage

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestGoogleDriveProvider(t *testing.T) {
	// Mock Google APIs
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.Contains(r.URL.Path, "/oauth2/v2/userinfo"):
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"email": "teacher@school.ac.th",
				"name":  "Kru Fame",
			})
		case strings.Contains(r.URL.Path, "/drive/v3/about"):
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"user": map[string]interface{}{
					"emailAddress": "teacher@school.ac.th",
				},
			})
		case r.Method == http.MethodGet && strings.Contains(r.URL.Path, "/drive/v3/files"):
			// Search folder
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"files": []map[string]interface{}{
					{"id": "folder_12345", "name": "School-CMS-Uploads"},
				},
			})
		case r.Method == http.MethodPost && strings.Contains(r.URL.Path, "/upload/drive/v3/files"):
			// Multipart upload
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"id":   "mock_drive_file_abc999",
				"name": "photo.jpg",
			})
		case strings.Contains(r.URL.Path, "/permissions"):
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"id":   "anyoneWithLink",
				"role": "reader",
			})
		case r.Method == http.MethodDelete:
			w.WriteHeader(http.StatusNoContent)
		default:
			w.WriteHeader(http.StatusOK)
		}
	}))
	defer mockServer.Close()

	cfg := map[string]interface{}{
		"client_id":       "mock-client-id",
		"client_secret":   "mock-client-secret",
		"refresh_token":   "mock-refresh-token",
		"access_token":    "mock-valid-access-token",
		"token_expiry":    float64(time.Now().Add(2 * time.Hour).Unix()),
		"folder_id":       "folder_12345",
		"folder_name":     "School-CMS-Uploads",
		"connected_email": "teacher@school.ac.th",
	}

	p, err := NewGoogleDriveProvider(cfg)
	if err != nil {
		t.Fatalf("Failed to initialize Google Drive provider: %v", err)
	}

	if p.ID() != "storage-google-drive" {
		t.Errorf("Expected ID storage-google-drive, got %s", p.ID())
	}

	// Override HTTP client to use mock server
	p.client = mockServer.Client()

	// Test EnsureValidAccessToken with unexpired token
	token, err := p.EnsureValidAccessToken(context.Background())
	if err != nil {
		t.Fatalf("EnsureValidAccessToken failed: %v", err)
	}
	if token != "mock-valid-access-token" {
		t.Errorf("Expected mock-valid-access-token, got %s", token)
	}
}
