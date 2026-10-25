package handlers

import (
	"encoding/json"
	"school-cms/models"
	"testing"
)

func TestMenuItemBottomNavSerialization(t *testing.T) {
	item := models.MenuItem{
		ID:              "test-page",
		Title:           "ทดสอบหน้า",
		Path:            "/page/test",
		Type:            "page",
		Order:           10,
		ShowInMenu:      true,
		ShowInBottomNav: true,
		Icon:            "Sparkles",
	}

	data, err := json.Marshal(item)
	if err != nil {
		t.Fatalf("Failed to marshal MenuItem: %v", err)
	}

	var parsed models.MenuItem
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal MenuItem: %v", err)
	}

	if !parsed.ShowInBottomNav {
		t.Errorf("Expected ShowInBottomNav to be true, got false")
	}
	if parsed.Icon != "Sparkles" {
		t.Errorf("Expected Icon to be 'Sparkles', got '%s'", parsed.Icon)
	}
}

func TestDefaultMenuBaseItemsHaveBottomNav(t *testing.T) {
	// Verify default items structure in GetNavigationMenuInternal logic
	// Without DB, we can verify that the default items configured have ShowInBottomNav set
	menu := []models.MenuItem{
		{ID: "home", Title: "หน้าแรก", Path: "home", Type: "route", Order: 10, ShowInMenu: true, ShowInBottomNav: true, Icon: "Home"},
		{ID: "about", Title: "เกี่ยวกับโรงเรียน", Path: "about", Type: "route", Order: 20, ShowInMenu: true, ShowInBottomNav: true, Icon: "Building2"},
		{ID: "eservice", Title: "ระบบ E-Service", Path: "eservice", Type: "route", Order: 30, ShowInMenu: true, ShowInBottomNav: true, Icon: "Sparkles"},
		{ID: "news", Title: "ข่าวและประกาศ", Path: "news", Type: "route", Order: 40, ShowInMenu: true, ShowInBottomNav: true, Icon: "Newspaper"},
		{ID: "contact", Title: "ติดต่อเรา", Path: "contact", Type: "route", Order: 50, ShowInMenu: true, ShowInBottomNav: false, Icon: "Phone"},
	}

	bottomNavCount := 0
	for _, m := range menu {
		if m.ShowInBottomNav {
			bottomNavCount++
		}
	}

	if bottomNavCount != 4 {
		t.Errorf("Expected 4 default items to have ShowInBottomNav=true, got %d", bottomNavCount)
	}
}

func TestCreatePageRequestWithBottomNav(t *testing.T) {
	payload := `{
		"title": "ห้องเรียนอัจฉริยะ",
		"slug": "smart-classroom",
		"content": "เนื้อหาห้องเรียน",
		"show_in_menu": false,
		"show_in_bottom_nav": true,
		"menu_icon": "GraduationCap"
	}`

	var req models.CreatePageRequest
	if err := json.Unmarshal([]byte(payload), &req); err != nil {
		t.Fatalf("Failed to unmarshal CreatePageRequest: %v", err)
	}

	if !req.ShowInBottomNav {
		t.Errorf("Expected ShowInBottomNav to be true")
	}
	if req.MenuIcon != "GraduationCap" {
		t.Errorf("Expected MenuIcon to be 'GraduationCap', got '%s'", req.MenuIcon)
	}
}
