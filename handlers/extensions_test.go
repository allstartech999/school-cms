package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"school-cms/models"
	"testing"
)

func TestExtensionLifecycle(t *testing.T) {
	_, err := db.InitTestDB()
	if err != nil {
		t.Fatalf("Failed to init test db: %v", err)
	}

	// 1. List extensions
	req, _ := http.NewRequest(http.MethodGet, "/api/v1/extensions", nil)
	rr := httptest.NewRecorder()
	ListExtensions(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("ListExtensions returned code %d: %s", rr.Code, rr.Body.String())
	}

	var listResp struct {
		Extensions          []models.ExtensionCatalogItem `json:"extensions"`
		ActiveStorageEngine string                        `json:"active_storage_engine"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &listResp); err != nil {
		t.Fatalf("Failed to decode list response: %v", err)
	}

	if len(listResp.Extensions) == 0 {
		t.Errorf("Expected catalog extensions, got 0")
	}

	if listResp.ActiveStorageEngine != "storage-local" {
		t.Errorf("Expected initial active storage engine to be storage-local, got %s", listResp.ActiveStorageEngine)
	}

	// 2. Install storage-r2
	installPayload := []byte(`{"id":"storage-r2"}`)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/extensions/install", bytes.NewReader(installPayload))
	rr = httptest.NewRecorder()
	InstallExtension(rr, req)

	if rr.Code != http.StatusOK && rr.Code != http.StatusCreated {
		t.Fatalf("InstallExtension returned code %d: %s", rr.Code, rr.Body.String())
	}

	// 3. Update Config with secrets
	configPayload := []byte(`{
		"config": {
			"account_id": "cf_account_12345",
			"bucket_name": "school-bucket",
			"access_key_id": "r2_key_xyz",
			"secret_access_key": "super_secret_r2_key_999",
			"public_url_prefix": "https://cdn.school.ac.th"
		}
	}`)
	req, _ = http.NewRequest(http.MethodPut, "/api/v1/extensions/storage-r2/config", bytes.NewReader(configPayload))
	req.SetPathValue("id", "storage-r2")
	rr = httptest.NewRecorder()
	UpdateExtensionConfig(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("UpdateExtensionConfig returned code %d: %s", rr.Code, rr.Body.String())
	}

	var updateResp struct {
		Config map[string]interface{} `json:"config"`
	}
	_ = json.Unmarshal(rr.Body.Bytes(), &updateResp)
	if updateResp.Config["secret_access_key"] != MaskedSecretPlaceholder {
		t.Errorf("Expected secret_access_key to be masked, got %v", updateResp.Config["secret_access_key"])
	}

	// 4. Toggle storage-r2 to active
	req, _ = http.NewRequest(http.MethodPut, "/api/v1/extensions/storage-r2/toggle", nil)
	req.SetPathValue("id", "storage-r2")
	rr = httptest.NewRecorder()
	ToggleExtension(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("ToggleExtension returned code %d: %s", rr.Code, rr.Body.String())
	}

	if GetActiveStorageExtensionID() != "storage-r2" {
		t.Errorf("Expected active storage to be storage-r2, got %s", GetActiveStorageExtensionID())
	}

	// 5. Custom extension install via manifest
	customManifest := `{
		"id": "custom-sftp",
		"name": "Custom SFTP Storage",
		"category": "storage",
		"version": "1.0.0",
		"description": "SFTP connection",
		"icon": "FolderArchive"
	}`
	installCustomReq := []byte(`{"manifest_json": ` + string(mustJSON(customManifest)) + `}`)
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/extensions/install", bytes.NewReader(installCustomReq))
	rr = httptest.NewRecorder()
	InstallExtension(rr, req)

	if rr.Code != http.StatusOK && rr.Code != http.StatusCreated {
		t.Fatalf("Install Custom Extension returned code %d: %s", rr.Code, rr.Body.String())
	}

	// 6. Uninstall storage-r2 -> active storage should revert to storage-local
	req, _ = http.NewRequest(http.MethodPost, "/api/v1/extensions/storage-r2/uninstall", nil)
	req.SetPathValue("id", "storage-r2")
	rr = httptest.NewRecorder()
	UninstallExtension(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("UninstallExtension returned code %d: %s", rr.Code, rr.Body.String())
	}

	if GetActiveStorageExtensionID() != "storage-local" {
		t.Errorf("Expected active storage to revert to storage-local, got %s", GetActiveStorageExtensionID())
	}
}

func mustJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
