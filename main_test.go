package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"school-cms/handlers"
	"school-cms/middleware"
	"testing"

	"github.com/joho/godotenv"
)

func setupTestApp(t *testing.T) http.Handler {
	_ = godotenv.Load()

	_, err := db.InitDB()
	if err != nil {
		t.Fatalf("failed to init database: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/posts", handlers.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{id}", handlers.GetPost)
	mux.HandleFunc("GET /api/v1/pages/{slug}", handlers.GetPage)
	mux.HandleFunc("POST /api/v1/admin/login", handlers.AdminLogin)
	mux.HandleFunc("POST /api/v1/agent/posts", middleware.AgentAuth(handlers.AgentCreatePost))

	return middleware.CORS(mux)
}

func TestListPosts(t *testing.T) {
	app := setupTestApp(t)

	req := httptest.NewRequest("GET", "/api/v1/posts", nil)
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var posts []map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &posts); err != nil {
		t.Fatalf("failed to parse json response: %v", err)
	}

	if len(posts) < 2 {
		t.Fatalf("expected at least 2 seeded posts, got %d", len(posts))
	}
}

func TestAgentPostAuth(t *testing.T) {
	app := setupTestApp(t)

	body := []byte(`{
		"title": "ข่าวจาก AI สรุปสาระสำคัญกิจกรรมห้องสมุด",
		"content": "เนื้อหาข่าวสรุปโดยโมเดล AI ส่งผ่าน API",
		"publish": true
	}`)

	// 1. Test without key -> expect 401
	reqUnauthorized := httptest.NewRequest("POST", "/api/v1/agent/posts", bytes.NewReader(body))
	wUnauthorized := httptest.NewRecorder()
	app.ServeHTTP(wUnauthorized, reqUnauthorized)
	if wUnauthorized.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 unauthorized, got %d", wUnauthorized.Code)
	}

	// 2. Test with valid key -> expect 201 Created
	reqAuthorized := httptest.NewRequest("POST", "/api/v1/agent/posts", bytes.NewReader(body))
	reqAuthorized.Header.Set("X-Agent-Key", "agent-school-secret-key-2026")
	wAuthorized := httptest.NewRecorder()
	app.ServeHTTP(wAuthorized, reqAuthorized)
	if wAuthorized.Code != http.StatusCreated {
		t.Fatalf("expected 201 created, got %d. Body: %s", wAuthorized.Code, wAuthorized.Body.String())
	}
}
