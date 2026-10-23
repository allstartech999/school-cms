package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"school-cms/handlers"
	schoolmcp "school-cms/mcp"
	"school-cms/middleware"
	"testing"

	"github.com/joho/godotenv"
	"github.com/mark3labs/mcp-go/mcp"
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
	mux.HandleFunc("GET /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentListPages))
	mux.HandleFunc("POST /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentCreateOrUpdatePage))
	mux.HandleFunc("GET /api/v1/media", handlers.ListMedia)

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

func TestAgentCreatePageWithLayout(t *testing.T) {
	app := setupTestApp(t)

	pageJSON := `{
		"title": "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์",
		"slug": "ai-robotics-curriculum-test",
		"layout_type": "blocks",
		"layout_data": [
			{
				"type": "hero_banner",
				"props": {
					"variant": "split",
					"badge": "เปิดรับสมัครปี 2026",
					"heading": "เรียนรู้ AI และ Robotics สู่ระดับสากล",
					"subheading": "หลักสูตรเข้มข้นสำหรับนักเรียนที่มีความสนใจด้านเทคโนโลยี"
				}
			},
			{
				"type": "stats_bar",
				"props": {
					"items": [
						{"value": "100%", "label": "อัตราการศึกษาต่อ"},
						{"value": "1:1", "label": "อุปกรณ์ต่อผู้เรียน"}
					]
				}
			}
		],
		"content": "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์ สำหรับนักเรียนระดับมัธยม",
		"agent_name": "Claude Robotics Architect",
		"publish": true
	}`

	req := httptest.NewRequest("POST", "/api/v1/agent/pages", bytes.NewReader([]byte(pageJSON)))
	req.Header.Set("X-Agent-Key", "agent-school-secret-key-2026")
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("expected 201 or 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify reading it back
	reqGet := httptest.NewRequest("GET", "/api/v1/pages/ai-robotics-curriculum-test", nil)
	wGet := httptest.NewRecorder()
	app.ServeHTTP(wGet, reqGet)
	if wGet.Code != http.StatusOK {
		t.Fatalf("expected 200 reading page, got %d", wGet.Code)
	}

	var pageResp map[string]any
	if err := json.Unmarshal(wGet.Body.Bytes(), &pageResp); err != nil {
		t.Fatalf("failed to decode page json: %v", err)
	}

	if pageResp["layout_type"] != "blocks" {
		t.Fatalf("expected layout_type 'blocks', got %v", pageResp["layout_type"])
	}
}

func TestMCPServerTools(t *testing.T) {
	_ = godotenv.Load()
	_, err := db.InitDB()
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}

	server := schoolmcp.NewSchoolMCPServer()
	if server == nil {
		t.Fatal("expected non-nil MCP server")
	}

	// Call list_recent_posts tool
	tool := server.GetTool("list_recent_posts")
	if tool == nil {
		t.Fatal("expected tool 'list_recent_posts' to exist")
	}

	callReq := mcp.CallToolRequest{}
	callReq.Params.Name = "list_recent_posts"
	callReq.Params.Arguments = map[string]any{"limit": 5}

	res, err := tool.Handler(context.Background(), callReq)
	if err != nil {
		t.Fatalf("failed calling list_recent_posts tool: %v", err)
	}

	if res.IsError {
		t.Fatalf("tool returned error: %v", res)
	}

	if len(res.Content) == 0 {
		t.Fatal("expected non-empty content from MCP tool")
	}
}
