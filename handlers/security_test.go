package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"school-cms/auth"
	"school-cms/db"
	"school-cms/models"
	"testing"
	"time"
)

func TestSecurity_UploadFileTypeValidation(t *testing.T) {
	_, err := db.InitTestDB()
	if err != nil {
		t.Fatalf("InitTestDB failed: %v", err)
	}

	// 1. Test uploading malicious HTML file -> must be rejected
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", "exploit.html")
	if err != nil {
		t.Fatalf("CreateFormFile failed: %v", err)
	}
	part.Write([]byte("<script>alert('xss')</script>"))
	writer.Close()

	req := httptest.NewRequest("POST", "/api/v1/media/upload", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	UploadMedia(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for .html upload, got %d", w.Code)
	}

	// 2. Test uploading disguised executable with .jpg extension -> MIME sniff must reject
	body.Reset()
	writer = multipart.NewWriter(&body)
	part, err = writer.CreateFormFile("file", "fake_image.jpg")
	if err != nil {
		t.Fatalf("CreateFormFile failed: %v", err)
	}
	// Write HTML / script tag content into fake .jpg
	part.Write([]byte("<html><head><script>alert(1)</script></head><body>evil</body></html>"))
	writer.Close()

	req = httptest.NewRequest("POST", "/api/v1/media/upload", &body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w = httptest.NewRecorder()

	UploadMedia(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for disguised HTML in .jpg, got %d", w.Code)
	}
}

func TestSecurity_SSRFProtection(t *testing.T) {
	maliciousURLs := []string{
		"http://127.0.0.1/admin",
		"http://localhost:8080/api/v1/users",
		"http://169.254.169.254/latest/meta-data/",
		"http://10.0.0.1/private",
		"http://192.168.1.1/router",
		"http://172.16.0.1/internal",
		"file:///etc/passwd",
		"ftp://malicious.host/data",
	}

	for _, badURL := range maliciousURLs {
		_, err := isSafeURL(badURL)
		if err == nil {
			t.Errorf("expected isSafeURL to reject SSRF target '%s', but it allowed it", badURL)
		}
	}
}

func TestSecurity_StatsAPIAgentKeyLeak(t *testing.T) {
	_, err := db.InitTestDB()
	if err != nil {
		t.Fatalf("InitTestDB failed: %v", err)
	}

	// Create test agent key in DB
	testKey := models.AgentKey{
		Name:     "Secret Agent Key",
		Key:      "ppk_agent_super_secret_test_key_123456",
		IsActive: true,
	}
	db.DB.Create(&testKey)
	t.Cleanup(func() {
		db.DB.Delete(&testKey)
	})

	// 1. Unauthenticated request to /api/v1/stats
	reqPub := httptest.NewRequest("GET", "/api/v1/stats", nil)
	wPub := httptest.NewRecorder()
	GetStats(wPub, reqPub)

	if wPub.Code != http.StatusOK {
		t.Fatalf("expected 200 from stats, got %d", wPub.Code)
	}

	var pubStats map[string]any
	if err := json.Unmarshal(wPub.Body.Bytes(), &pubStats); err != nil {
		t.Fatalf("failed to parse json: %v", err)
	}

	// Agent key and preview must be EMPTY for public requests
	if pubStats["agent_key"] != "" {
		t.Errorf("expected empty agent_key for unauthenticated request, got %v", pubStats["agent_key"])
	}
	if pubStats["agent_key_preview"] != "" {
		t.Errorf("expected empty agent_key_preview for unauthenticated request, got %v", pubStats["agent_key_preview"])
	}

	// 2. Request with forged token "authenticated-admin" -> must still NOT return agent key
	reqForged := httptest.NewRequest("GET", "/api/v1/stats", nil)
	reqForged.Header.Set("X-Admin-Token", "authenticated-admin")
	wForged := httptest.NewRecorder()
	GetStats(wForged, reqForged)

	var forgedStats map[string]any
	_ = json.Unmarshal(wForged.Body.Bytes(), &forgedStats)
	if forgedStats["agent_key"] != "" || forgedStats["agent_key_preview"] != "" {
		t.Errorf("expected forged token to NOT leak agent key, got key=%v, preview=%v", forgedStats["agent_key"], forgedStats["agent_key_preview"])
	}

	// 3. Request with real signed JWT
	validToken, err := auth.GenerateToken(1, "admin", "admin", 1*time.Hour)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	reqAuth := httptest.NewRequest("GET", "/api/v1/stats", nil)
	reqAuth.Header.Set("Authorization", "Bearer "+validToken)
	wAuth := httptest.NewRecorder()
	GetStats(wAuth, reqAuth)

	var authStats map[string]any
	_ = json.Unmarshal(wAuth.Body.Bytes(), &authStats)
	if authStats["agent_key"] != testKey.Key {
		t.Errorf("expected authenticated admin to receive agent_key %s, got %v", testKey.Key, authStats["agent_key"])
	}
}
