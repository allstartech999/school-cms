package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"school-cms/db"
	"school-cms/handlers"
	schoolmcp "school-cms/mcp"
	"school-cms/middleware"
	"school-cms/models"
	"strings"
	"testing"

	"github.com/joho/godotenv"
)

func setupTestApp(t *testing.T) http.Handler {
	_ = os.Setenv("APP_ENV", "test")
	_ = godotenv.Load()

	_, err := db.InitTestDB()
	if err != nil {
		t.Fatalf("failed to initialize test database: %v", err)
		return nil
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/posts", handlers.ListPosts)
	mux.HandleFunc("POST /api/v1/posts", middleware.AdminAuth(handlers.CreatePost))
	mux.HandleFunc("GET /api/v1/posts/{id}", handlers.GetPost)
	mux.HandleFunc("GET /api/v1/pages/{slug}", handlers.GetPage)
	mux.HandleFunc("GET /api/v1/homepage", handlers.GetHomepageConfig)
	mux.HandleFunc("GET /api/v1/menu", handlers.GetNavigationMenu)
	mux.HandleFunc("GET /api/v1/settings", handlers.GetSiteSettings)
	mux.HandleFunc("PUT /api/v1/settings", middleware.AgentOrAdminAuth(handlers.UpdateSiteSettings))
	mux.HandleFunc("POST /api/v1/admin/login", handlers.AdminLogin)
	mux.HandleFunc("POST /api/v1/admin/verify", middleware.AdminAuth(handlers.AdminVerify))
	mux.HandleFunc("POST /api/v1/admin/change-password", middleware.AdminAuth(handlers.AdminChangePassword))
	mux.HandleFunc("GET /api/v1/stats", handlers.GetStats)
	mux.HandleFunc("GET /api/v1/users", middleware.AdminAuth(handlers.ListUsers))
	mux.HandleFunc("POST /api/v1/users", middleware.AdminAuth(handlers.CreateUser))
	mux.HandleFunc("PUT /api/v1/users/{id}", middleware.AdminAuth(handlers.UpdateUser))
	mux.HandleFunc("DELETE /api/v1/users/{id}", middleware.AdminAuth(handlers.DeleteUser))
	mux.HandleFunc("GET /api/v1/agent-keys", middleware.AdminAuth(handlers.ListAgentKeys))
	mux.HandleFunc("POST /api/v1/agent-keys", middleware.AdminAuth(handlers.CreateAgentKey))
	mux.HandleFunc("POST /api/v1/agent/posts", middleware.AgentAuth(handlers.AgentCreatePost))
	mux.HandleFunc("GET /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentListPages))
	mux.HandleFunc("POST /api/v1/agent/pages", middleware.AgentAuth(handlers.AgentCreateOrUpdatePage))
	mux.HandleFunc("GET /api/v1/media", handlers.ListMedia)
	mux.HandleFunc("GET /sitemap.xml", handlers.GetSitemapXML)
	mux.HandleFunc("GET /robots.txt", handlers.GetRobotsTxt)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			handlers.WriteError(w, http.StatusNotFound, "API endpoint not found")
			return
		}
		handlers.ServeSEOPage(w, r, os.DirFS("dist"))
	})

	return middleware.CORS(mux)
}

func TestListPosts(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	var existingCount int64
	db.DB.Model(&models.Post{}).Count(&existingCount)
	if existingCount < 2 {
		tp1 := models.Post{Title: "Seed Test 1", Content: "Content 1", Slug: "seed-test-1", Status: "published"}
		tp2 := models.Post{Title: "Seed Test 2", Content: "Content 2", Slug: "seed-test-2", Status: "published"}
		db.DB.Create(&tp1)
		db.DB.Create(&tp2)
		t.Cleanup(func() {
			db.DB.Delete(&models.Post{}, tp1.ID)
			db.DB.Delete(&models.Post{}, tp2.ID)
		})
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

	// Create test agent key in DB
	testKeyVal := "ppk_agent_test_key_1234567890abcdef"
	testKey := models.AgentKey{
		Name:     "Test Automated Agent",
		Key:      testKeyVal,
		IsActive: true,
	}
	db.DB.Create(&testKey)
	t.Cleanup(func() {
		db.DB.Delete(&models.AgentKey{}, testKey.ID)
	})

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

	// 2. Test with old removed default key -> expect 401 Unauthorized!
	reqOldKey := httptest.NewRequest("POST", "/api/v1/agent/posts", bytes.NewReader(body))
	reqOldKey.Header.Set("X-Agent-Key", "agent-school-secret-key-2026")
	wOldKey := httptest.NewRecorder()
	app.ServeHTTP(wOldKey, reqOldKey)
	if wOldKey.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for removed default key, got %d", wOldKey.Code)
	}

	// 3. Test with valid generated key -> expect 201 Created
	reqAuthorized := httptest.NewRequest("POST", "/api/v1/agent/posts", bytes.NewReader(body))
	reqAuthorized.Header.Set("X-Agent-Key", testKeyVal)
	wAuthorized := httptest.NewRecorder()
	app.ServeHTTP(wAuthorized, reqAuthorized)
	if wAuthorized.Code != http.StatusCreated {
		t.Fatalf("expected 201 created, got %d. Body: %s", wAuthorized.Code, wAuthorized.Body.String())
	}

	var createdPost models.Post
	if err := json.Unmarshal(wAuthorized.Body.Bytes(), &createdPost); err == nil && createdPost.ID != 0 {
		t.Cleanup(func() {
			db.DB.Delete(&models.Post{}, createdPost.ID)
		})
	}
}

func TestAgentCreatePageWithLayout(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	testKeyVal := "ppk_agent_test_page_key_9876543210"
	testKey := models.AgentKey{
		Name:     "Test Page Agent",
		Key:      testKeyVal,
		IsActive: true,
	}
	db.DB.Create(&testKey)
	t.Cleanup(func() {
		db.DB.Delete(&models.AgentKey{}, testKey.ID)
	})

	testSlug := "ai-robotics-curriculum-test"
	t.Cleanup(func() {
		db.DB.Where("slug = ?", testSlug).Delete(&models.Page{})
	})

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
	req.Header.Set("X-Agent-Key", testKeyVal)
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
	testKeyVal := "ppk_agent_settings_test_key_abc"
	testKey := models.AgentKey{
		Name:     "Test Settings Agent",
		Key:      testKeyVal,
		IsActive: true,
	}
	db.DB.Create(&testKey)
	t.Cleanup(func() {
		db.DB.Delete(&models.AgentKey{}, testKey.ID)
	})

	updatePayload := []byte(`{
		"logo_url": "/images/ppk-emblem-2d.png",
		"favicon_url": "/images/ppk-emblem-2d.png"
	}`)
	reqPut := httptest.NewRequest("PUT", "/api/v1/settings", bytes.NewReader(updatePayload))
	reqPut.Header.Set("X-Agent-Key", testKeyVal)
	wPut := httptest.NewRecorder()
	app.ServeHTTP(wPut, reqPut)

	if wPut.Code != http.StatusOK {
		t.Fatalf("expected 200 from PUT /api/v1/settings, got %d. Body: %s", wPut.Code, wPut.Body.String())
	}
}

func getTestAdminToken(t *testing.T, app http.Handler) string {
	loginJSON := `{"username":"admin","password":"` + handlers.GetAdminDefaultPassword() + `"}`
	req := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader([]byte(loginJSON)))
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("failed to login test admin: %d, body: %s", w.Code, w.Body.String())
	}
	var res map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &res)
	token, ok := res["token"].(string)
	if !ok || token == "" {
		t.Fatalf("failed to get valid JWT token from login: %v", res)
	}
	return token
}

func TestUserManagement(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	testUsername := "test_teacher_2026"
	t.Cleanup(func() {
		db.DB.Where("username = ?", testUsername).Delete(&models.User{})
	})

	adminToken := getTestAdminToken(t, app)

	// 1. Create User
	createUserJSON := `{
		"username": "test_teacher_2026",
		"password": "teacherpass123",
		"name": "ครูทดสอบ ระบบสารสนเทศ",
		"role": "editor"
	}`
	reqCreate := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader([]byte(createUserJSON)))
	reqCreate.Header.Set("X-Admin-Token", adminToken)
	wCreate := httptest.NewRecorder()
	app.ServeHTTP(wCreate, reqCreate)

	if wCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 created for user, got %d. Body: %s", wCreate.Code, wCreate.Body.String())
	}

	// 2. List Users
	reqList := httptest.NewRequest("GET", "/api/v1/users", nil)
	reqList.Header.Set("X-Admin-Token", adminToken)
	wList := httptest.NewRecorder()
	app.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("expected 200 for list users, got %d", wList.Code)
	}

	// 3. Login with newly created user
	loginJSON := `{
		"username": "test_teacher_2026",
		"password": "teacherpass123"
	}`
	reqLogin := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader([]byte(loginJSON)))
	wLogin := httptest.NewRecorder()
	app.ServeHTTP(wLogin, reqLogin)

	if wLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 login for new user, got %d. Body: %s", wLogin.Code, wLogin.Body.String())
	}
}

func TestAgentKeyManagement(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	adminToken := getTestAdminToken(t, app)

	// 1. Create new Agent Key
	createKeyJSON := `{
		"name": "Integration Test Key",
		"description": "API key created during automated test"
	}`
	reqCreate := httptest.NewRequest("POST", "/api/v1/agent-keys", bytes.NewReader([]byte(createKeyJSON)))
	reqCreate.Header.Set("X-Admin-Token", adminToken)
	wCreate := httptest.NewRecorder()
	app.ServeHTTP(wCreate, reqCreate)

	if wCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 for creating agent key, got %d. Body: %s", wCreate.Code, wCreate.Body.String())
	}

	var res map[string]any
	if err := json.Unmarshal(wCreate.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	keyObj, ok := res["key"].(map[string]any)
	if !ok || keyObj["key"] == "" {
		t.Fatalf("expected generated key in response, got %v", res)
	}

	generatedKeyID := uint(keyObj["id"].(float64))
	t.Cleanup(func() {
		db.DB.Delete(&models.AgentKey{}, generatedKeyID)
	})

	// 2. List Agent Keys
	reqList := httptest.NewRequest("GET", "/api/v1/agent-keys", nil)
	reqList.Header.Set("X-Admin-Token", adminToken)
	wList := httptest.NewRecorder()
	app.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("expected 200 for listing agent keys, got %d", wList.Code)
	}
}

func TestMultiUserAuthAndSecurity(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	// 1. Verify that settings table has NO legacy plaintext password keys
	var legacyPassCount int64
	db.DB.Model(&models.Setting{}).Where("key IN ?", []string{"admin_password", "admin_password_changed"}).Count(&legacyPassCount)
	if legacyPassCount > 0 {
		t.Fatalf("expected 0 legacy password settings in database, found %d", legacyPassCount)
	}

	// 2. Test login with non-existent user
	invalidUserBody := []byte(`{"username": "non_existent_user_999", "password": "any"}`)
	reqInvUser := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(invalidUserBody))
	wInvUser := httptest.NewRecorder()
	app.ServeHTTP(wInvUser, reqInvUser)
	if wInvUser.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for non-existent user, got %d", wInvUser.Code)
	}

	// 3. Test login with admin and wrong password
	wrongPassBody := []byte(`{"username": "admin", "password": "wrongpassword"}`)
	reqWrong := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(wrongPassBody))
	wWrong := httptest.NewRecorder()
	app.ServeHTTP(wWrong, reqWrong)
	if wWrong.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for wrong password, got %d", wWrong.Code)
	}

	// 4. Test login with correct admin password (44012012)
	adminLoginBody := []byte(`{"username": "admin", "password": "44012012"}`)
	reqAdmin := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(adminLoginBody))
	wAdmin := httptest.NewRecorder()
	app.ServeHTTP(wAdmin, reqAdmin)
	if wAdmin.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid admin login, got %d. Body: %s", wAdmin.Code, wAdmin.Body.String())
	}
	var loginRes map[string]any
	if err := json.Unmarshal(wAdmin.Body.Bytes(), &loginRes); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}
	adminToken := loginRes["token"].(string)
	if adminToken == "" || strings.Count(adminToken, ".") != 2 {
		t.Fatalf("expected valid 3-part signed JWT token, got %s", adminToken)
	}

	// 5. Test token verification with valid admin token
	reqVerify := httptest.NewRequest("POST", "/api/v1/admin/verify", nil)
	reqVerify.Header.Set("X-Admin-Token", adminToken)
	wVerify := httptest.NewRecorder()
	app.ServeHTTP(wVerify, reqVerify)
	if wVerify.Code != http.StatusOK {
		t.Fatalf("expected 200 for verify token, got %d", wVerify.Code)
	}

	// 6. Test token verification with forged / unknown user tokens -> must strictly be 401
	bogusTokens := []string{
		"authenticated-admin",
		"authenticated-nonexistentuser",
		"authenticated-",
		"random_token_12345",
		"invalid",
		"Bearer invalid",
	}
	for _, fakeToken := range bogusTokens {
		reqFakeVerify := httptest.NewRequest("POST", "/api/v1/admin/verify", nil)
		reqFakeVerify.Header.Set("X-Admin-Token", fakeToken)
		wFakeVerify := httptest.NewRecorder()
		app.ServeHTTP(wFakeVerify, reqFakeVerify)
		if wFakeVerify.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for forged/invalid token '%s', got %d", fakeToken, wFakeVerify.Code)
		}

		// Also verify protected endpoint (POST /api/v1/posts) rejects bogus token
		reqPost := httptest.NewRequest("POST", "/api/v1/posts", bytes.NewReader([]byte(`{"title":"fake"}`)))
		reqPost.Header.Set("X-Admin-Token", fakeToken)
		wPost := httptest.NewRecorder()
		app.ServeHTTP(wPost, reqPost)
		if wPost.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for AdminAuth on posts with bogus token '%s', got %d", fakeToken, wPost.Code)
		}
	}

	// 7. Test multi-user lifecycle: create user, login, change user's own password
	testUsername := "multiuser_test_runner"
	db.DB.Where("username = ?", testUsername).Delete(&models.User{})
	t.Cleanup(func() {
		db.DB.Where("username = ?", testUsername).Delete(&models.User{})
	})

	createReq := []byte(`{
		"username": "multiuser_test_runner",
		"password": "initialPass999",
		"name": "ทดสอบระบบหลายผู้ใช้",
		"role": "editor"
	}`)
	reqCreate := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(createReq))
	reqCreate.Header.Set("X-Admin-Token", adminToken)
	wCreate := httptest.NewRecorder()
	app.ServeHTTP(wCreate, reqCreate)
	if wCreate.Code != http.StatusCreated {
		t.Fatalf("expected 201 for user creation, got %d. Body: %s", wCreate.Code, wCreate.Body.String())
	}

	// Login with new user
	userLoginBody := []byte(`{"username": "multiuser_test_runner", "password": "initialPass999"}`)
	reqUserLogin := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(userLoginBody))
	wUserLogin := httptest.NewRecorder()
	app.ServeHTTP(wUserLogin, reqUserLogin)
	if wUserLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 for new user login, got %d. Body: %s", wUserLogin.Code, wUserLogin.Body.String())
	}
	var userLoginRes map[string]any
	_ = json.Unmarshal(wUserLogin.Body.Bytes(), &userLoginRes)
	userToken := userLoginRes["token"].(string)

	// 8. Test role restriction: Non-admin ('editor') cannot create other users (must return 403 Forbidden)
	unauthCreateUser := []byte(`{"username": "forbidden_user", "password": "pass123", "name": "Fake", "role": "editor"}`)
	reqForbiddenUser := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(unauthCreateUser))
	reqForbiddenUser.Header.Set("X-Admin-Token", userToken)
	wForbiddenUser := httptest.NewRecorder()
	app.ServeHTTP(wForbiddenUser, reqForbiddenUser)
	if wForbiddenUser.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-admin user creation, got %d", wForbiddenUser.Code)
	}

	// 9. Test role restriction: Non-admin ('editor') cannot create agent keys (must return 403 Forbidden)
	unauthCreateKey := []byte(`{"name": "Forbidden Key", "description": "Should fail"}`)
	reqForbiddenKey := httptest.NewRequest("POST", "/api/v1/agent-keys", bytes.NewReader(unauthCreateKey))
	reqForbiddenKey.Header.Set("X-Admin-Token", userToken)
	wForbiddenKey := httptest.NewRecorder()
	app.ServeHTTP(wForbiddenKey, reqForbiddenKey)
	if wForbiddenKey.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-admin agent key creation, got %d", wForbiddenKey.Code)
	}

	// 10. Change password for this user (allowed for own account)
	changePassBody := []byte(`{"old_password": "initialPass999", "new_password": "updatedPass999"}`)
	reqChange := httptest.NewRequest("POST", "/api/v1/admin/change-password", bytes.NewReader(changePassBody))
	reqChange.Header.Set("X-Admin-Token", userToken)
	wChange := httptest.NewRecorder()
	app.ServeHTTP(wChange, reqChange)
	if wChange.Code != http.StatusOK {
		t.Fatalf("expected 200 for changing password, got %d. Body: %s", wChange.Code, wChange.Body.String())
	}

	// Old password should fail
	reqOldFail := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(userLoginBody))
	wOldFail := httptest.NewRecorder()
	app.ServeHTTP(wOldFail, reqOldFail)
	if wOldFail.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 when logging in with old password, got %d", wOldFail.Code)
	}

	// New password should succeed
	newLoginBody := []byte(`{"username": "multiuser_test_runner", "password": "updatedPass999"}`)
	reqNewLogin := httptest.NewRequest("POST", "/api/v1/admin/login", bytes.NewReader(newLoginBody))
	wNewLogin := httptest.NewRecorder()
	app.ServeHTTP(wNewLogin, reqNewLogin)
	if wNewLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 when logging in with new password, got %d", wNewLogin.Code)
	}

	// Confirm settings table still has zero legacy password keys
	db.DB.Model(&models.Setting{}).Where("key IN ?", []string{"admin_password", "admin_password_changed"}).Count(&legacyPassCount)
	if legacyPassCount > 0 {
		t.Fatalf("expected 0 legacy password settings in database after user operations, found %d", legacyPassCount)
	}
}

func TestAdminUserProtections(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	adminToken := getTestAdminToken(t, app)

	var rootAdmin models.User
	if err := db.DB.Where("LOWER(username) = LOWER(?)", "admin").First(&rootAdmin).Error; err != nil {
		t.Fatalf("root admin user not found: %v", err)
	}

	// 1. Attempt to delete root admin (should fail with 400 Bad Request)
	reqDeleteRoot := httptest.NewRequest("DELETE", fmt.Sprintf("/api/v1/users/%d", rootAdmin.ID), nil)
	reqDeleteRoot.Header.Set("X-Admin-Token", adminToken)
	wDeleteRoot := httptest.NewRecorder()
	app.ServeHTTP(wDeleteRoot, reqDeleteRoot)
	if wDeleteRoot.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request when deleting root admin, got %d. Body: %s", wDeleteRoot.Code, wDeleteRoot.Body.String())
	}

	// 2. Attempt to demote root admin role to editor (should fail with 400 Bad Request)
	demoteJSON := []byte(`{"name": "Admin", "role": "editor"}`)
	reqDemoteRoot := httptest.NewRequest("PUT", fmt.Sprintf("/api/v1/users/%d", rootAdmin.ID), bytes.NewReader(demoteJSON))
	reqDemoteRoot.Header.Set("X-Admin-Token", adminToken)
	wDemoteRoot := httptest.NewRecorder()
	app.ServeHTTP(wDemoteRoot, reqDemoteRoot)
	if wDemoteRoot.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request when demoting root admin, got %d. Body: %s", wDemoteRoot.Code, wDemoteRoot.Body.String())
	}
}

func TestSEORoutesAndSettings(t *testing.T) {
	app := setupTestApp(t)
	if app == nil {
		return
	}

	adminToken := getTestAdminToken(t, app)

	// 1. Test GET /robots.txt
	reqRobots := httptest.NewRequest("GET", "/robots.txt", nil)
	wRobots := httptest.NewRecorder()
	app.ServeHTTP(wRobots, reqRobots)

	if wRobots.Code != http.StatusOK {
		t.Fatalf("expected 200 from GET /robots.txt, got %d", wRobots.Code)
	}
	if !strings.Contains(wRobots.Body.String(), "sitemap.xml") {
		t.Fatalf("robots.txt should reference sitemap.xml, got: %s", wRobots.Body.String())
	}

	// 2. Test GET /sitemap.xml
	reqSitemap := httptest.NewRequest("GET", "/sitemap.xml", nil)
	wSitemap := httptest.NewRecorder()
	app.ServeHTTP(wSitemap, reqSitemap)

	if wSitemap.Code != http.StatusOK {
		t.Fatalf("expected 200 from GET /sitemap.xml, got %d", wSitemap.Code)
	}
	sitemapBody := wSitemap.Body.String()
	if !strings.Contains(sitemapBody, "<urlset") || !strings.Contains(sitemapBody, "<loc>") {
		t.Fatalf("sitemap.xml missing valid xml urlset structure, got: %s", sitemapBody)
	}

	// 3. Test Updating SEO Settings
	seoUpdateJSON := []byte(`{
		"seo_title": "โรงเรียนโพนงามพิทยานุกูล ทดสอบ SEO",
		"seo_description": "คำอธิบาย SEO สำหรับการทดสอบระบบ",
		"seo_keywords": "การศึกษา, ทดสอบ, สพม.มหาสารคาม",
		"og_default_image": "/images/test-og.jpg",
		"google_site_verification": "google-test-token"
	}`)
	reqPutSEO := httptest.NewRequest("PUT", "/api/v1/settings", bytes.NewReader(seoUpdateJSON))
	reqPutSEO.Header.Set("X-Admin-Token", adminToken)
	wPutSEO := httptest.NewRecorder()
	app.ServeHTTP(wPutSEO, reqPutSEO)

	if wPutSEO.Code != http.StatusOK {
		t.Fatalf("expected 200 from PUT /api/v1/settings with SEO fields, got %d. Body: %s", wPutSEO.Code, wPutSEO.Body.String())
	}

	// 4. Verify settings retrieved
	reqGetSEO := httptest.NewRequest("GET", "/api/v1/settings", nil)
	wGetSEO := httptest.NewRecorder()
	app.ServeHTTP(wGetSEO, reqGetSEO)

	var settings map[string]any
	_ = json.Unmarshal(wGetSEO.Body.Bytes(), &settings)
	if settings["seo_title"] != "โรงเรียนโพนงามพิทยานุกูล ทดสอบ SEO" {
		t.Errorf("expected updated seo_title, got: %v", settings["seo_title"])
	}
	if settings["google_site_verification"] != "google-test-token" {
		t.Errorf("expected updated google_site_verification, got: %v", settings["google_site_verification"])
	}

	// 5. Test Web Root HTML serving with injected SEO tags
	reqRoot := httptest.NewRequest("GET", "/", nil)
	wRoot := httptest.NewRecorder()
	app.ServeHTTP(wRoot, reqRoot)
	if wRoot.Code != http.StatusOK {
		t.Fatalf("expected 200 from GET /, got %d", wRoot.Code)
	}
	rootHTML := wRoot.Body.String()
	if !strings.Contains(rootHTML, "โรงเรียนโพนงามพิทยานุกูล ทดสอบ SEO") {
		t.Errorf("expected updated seo_title injected in HTML, got: %s", rootHTML)
	}
	if !strings.Contains(rootHTML, `<meta property="og:title"`) {
		t.Errorf("og:title meta tag missing in root HTML")
	}
	if !strings.Contains(rootHTML, "EducationalOrganization") {
		t.Errorf("JSON-LD EducationalOrganization schema missing in root HTML")
	}

	// 6. Test Non-existent post URL returns 404 with noindex for crawlers
	reqMissingPost := httptest.NewRequest("GET", "/posts/999999", nil)
	wMissingPost := httptest.NewRecorder()
	app.ServeHTTP(wMissingPost, reqMissingPost)
	if wMissingPost.Code != http.StatusNotFound {
		t.Errorf("expected 404 Not Found from GET /posts/999999, got %d", wMissingPost.Code)
	}
	missingHTML := wMissingPost.Body.String()
	if !strings.Contains(missingHTML, `<meta name="robots" content="noindex, nofollow" />`) {
		t.Errorf("expected noindex tag in 404 HTML, got: %s", missingHTML)
	}
}


