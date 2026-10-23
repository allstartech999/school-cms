package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"school-cms/handlers"
	schoolmcp "school-cms/mcp"
	"school-cms/middleware"
	"testing"

	"github.com/joho/godotenv"
)

func setupTestApp(t *testing.T) http.Handler {
	_ = godotenv.Load()

	_, err := db.InitDB()
	if err != nil {
		t.Skipf("skipping test: database not reachable: %v", err)
		return nil
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/posts", handlers.ListPosts)
	mux.HandleFunc("GET /api/v1/posts/{id}", handlers.GetPost)
	mux.HandleFunc("GET /api/v1/pages/{slug}", handlers.GetPage)
	mux.HandleFunc("GET /api/v1/homepage", handlers.GetHomepageConfig)
	mux.HandleFunc("GET /api/v1/menu", handlers.GetNavigationMenu)
	mux.HandleFunc("GET /api/v1/settings", handlers.GetSiteSettings)
	mux.HandleFunc("PUT /api/v1/settings", middleware.AgentOrAdminAuth(handlers.UpdateSiteSettings))
	mux.HandleFunc("POST /api/v1/admin/login", handlers.AdminLogin)
	mux.HandleFunc("POST /api/v1/agent/posts", middleware.AgentAuth(handlers.AgentCreatePost))
	mux.HandleFunc("GET /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentListPages))
	mux.HandleFunc("POST /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentCreateOrUpdatePage))
	mux.HandleFunc("GET /api/v1/media", handlers.ListMedia)

	return middleware.CORS(mux)
}

func TestListPosts(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

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
	if app == nil {
		return
	}

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
	if app == nil {
		return
	}

	pageJSON := `{
		"title": "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์",
		"slug": "ai-robotics-curriculum-test",
		"layout_type": "blocks",
		"show_in_menu": true,
		"menu_title": "หลักสูตร AI",
		"layout_data": [
			{
				"type": "hero_banner",
				"props": {
					"variant": "split",
					"badge": "เปิดรับสมัครปี 2026",
					"heading": "หลักสูตร AI & Robotics ภาคเรียนใหม่",
					"subheading": "เรียนรู้ด้วยแล็บล้ำสมัยและโค้ดดิ้งภาคปฏิบัติ",
					"ctaText": "สมัครเลย",
					"ctaUrl": "#apply"
				}
			},
			{
				"type": "stats_bar",
				"props": {
					"title": "จุดเด่นหลักสูตร",
					"items": [
						{ "value": "100%", "label": "นักเรียนมีโครงงานจริง" },
						{ "value": "15+", "label": "รางวัลระดับเขตและชาติ" }
					]
				}
			}
		],
		"content": "หลักสูตรปัญญาประดิษฐ์และหุ่นยนต์",
		"publish": true,
		"agent_name": "Claude AI Architect"
	}`

	req := httptest.NewRequest("POST", "/api/v1/agent/pages", bytes.NewReader([]byte(pageJSON)))
	req.Header.Set("X-Agent-Key", "agent-school-secret-key-2026")
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)

	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("expected 200 or 201 for page creation, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Verify the page can be read back
	reqGet := httptest.NewRequest("GET", "/api/v1/pages/ai-robotics-curriculum-test", nil)
	wGet := httptest.NewRecorder()
	app.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("expected 200 reading created page, got %d", wGet.Code)
	}

	var pageResp map[string]any
	if err := json.Unmarshal(wGet.Body.Bytes(), &pageResp); err != nil {
		t.Fatalf("failed to decode page response: %v", err)
	}

	if pageResp["layout_type"] != "blocks" {
		t.Fatalf("expected layout_type 'blocks', got %v", pageResp["layout_type"])
	}
}

func TestMCPServerToolRegistration(t *testing.T) {
	server := schoolmcp.NewSchoolMCPServer()
	if server == nil {
		t.Fatal("expected non-nil MCP server")
	}

	expectedTools := []string{
		"upload_media_by_url",
		"list_media",
		"create_or_update_page",
		"get_page",
		"delete_page",
		"list_pages",
		"create_school_post",
		"update_school_post",
		"get_school_post",
		"delete_school_post",
		"list_recent_posts",
		"get_homepage_config",
		"update_homepage_config",
		"manage_navigation_menu",
		"get_site_settings",
		"update_site_settings",
	}

	for _, toolName := range expectedTools {
		tool := server.GetTool(toolName)
		if tool == nil {
			t.Errorf("expected tool '%s' to be registered in MCP server", toolName)
		}
	}
}

func TestSiteSettingsAPI(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	// 1. GET /api/v1/settings
	reqGet := httptest.NewRequest("GET", "/api/v1/settings", nil)
	wGet := httptest.NewRecorder()
	app.ServeHTTP(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("expected 200 from GET /api/v1/settings, got %d", wGet.Code)
	}

	var currentSettings map[string]any
	if err := json.Unmarshal(wGet.Body.Bytes(), &currentSettings); err != nil {
		t.Fatalf("failed to decode settings: %v", err)
	}

	if currentSettings["logo_url"] == "" || currentSettings["favicon_url"] == "" {
		t.Fatalf("expected non-empty logo_url and favicon_url, got %v", currentSettings)
	}

	// 2. PUT /api/v1/settings with Agent Auth
	updatePayload := []byte(`{
		"logo_url": "/images/ppk-emblem-2d.png",
		"favicon_url": "/images/ppk-emblem-2d.png"
	}`)
	reqPut := httptest.NewRequest("PUT", "/api/v1/settings", bytes.NewReader(updatePayload))
	reqPut.Header.Set("X-Agent-Key", "agent-school-secret-key-2026")
	wPut := httptest.NewRecorder()
	app.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Fatalf("expected 200 from PUT /api/v1/settings, got %d. Body: %s", wPut.Code, wPut.Body.String())
	}
}
