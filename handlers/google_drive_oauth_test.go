package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"school-cms/models"
	"strings"
	"testing"
)

func TestGoogleDriveOAuthEndpoints(t *testing.T) {
	database, err := db.InitTestDB()
	if err != nil {
		t.Fatalf("Failed to init test db: %v", err)
	}

	// 1. Seed storage-google-drive extension
	driveCfg := map[string]interface{}{
		"client_id":       "my-test-client-id.apps.googleusercontent.com",
		"client_secret":   "my-test-secret",
		"folder_name":     "School-CMS-Uploads",
		"connected_email": "admin@school.ac.th",
	}
	cfgBytes, _ := json.Marshal(driveCfg)
	ext := models.Extension{
		ID:        "storage-google-drive",
		Name:      "Google Drive Storage (OAuth 2.0)",
		Category:  "storage",
		Installed: true,
		Enabled:   false,
		Config:    string(cfgBytes),
	}
	database.Save(&ext)

	// 2. Test GetGoogleDriveOAuthURL
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/extensions/google-drive/oauth/url?redirect_uri=https://example.com/callback", nil)
	rr := httptest.NewRecorder()
	GetGoogleDriveOAuthURL(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("GetGoogleDriveOAuthURL returned code %d: %s", rr.Code, rr.Body.String())
	}

	var urlResp struct {
		AuthURL string `json:"auth_url"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &urlResp); err != nil {
		t.Fatalf("Failed to parse auth url response: %v", err)
	}

	if !strings.Contains(urlResp.AuthURL, "accounts.google.com/o/oauth2/v2/auth") {
		t.Errorf("Expected Google OAuth URL, got %s", urlResp.AuthURL)
	}
	if !strings.Contains(urlResp.AuthURL, "my-test-client-id.apps.googleusercontent.com") {
		t.Errorf("Expected Client ID in auth URL, got %s", urlResp.AuthURL)
	}

	// 3. Test DisconnectGoogleDrive
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/extensions/google-drive/disconnect", nil)
	rr = httptest.NewRecorder()
	DisconnectGoogleDrive(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("DisconnectGoogleDrive returned code %d: %s", rr.Code, rr.Body.String())
	}

	// Verify connected_email was removed
	var updated models.Extension
	database.First(&updated, "id = ?", "storage-google-drive")
	var updatedCfg map[string]interface{}
	_ = json.Unmarshal([]byte(updated.Config), &updatedCfg)
	if updatedCfg["connected_email"] != nil && updatedCfg["connected_email"] != "" {
		t.Errorf("Expected connected_email to be cleared, got %v", updatedCfg["connected_email"])
	}
}
