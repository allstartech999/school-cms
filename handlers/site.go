package handlers

import (
	"encoding/json"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strings"
)

const (
	DefaultHomepageConfig = `{
  "hero": {
    "badge": "โรงเรียนคุณภาพมาตรฐานสากล สพม.มหาสารคาม",
    "heading": "โรงเรียนโพนงามพิทยานุกูล",
    "subheading": "เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ",
    "primary_cta": "ข่าวสารและกิจกรรมล่าสุด",
    "primary_url": "news",
    "image_url": "https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=80"
  },
  "announcement": "ขอเชิญชวนศิษย์เก่าทุกท่านร่วมลงทะเบียนเครือข่ายศิษย์เก่าออนไลน์ (PPK Alumni) เพื่อร่วมพัฒนาโรงเรียน",
  "show_ticker": true,
  "show_slider": true,
  "show_eservices": true,
  "show_recent_news": true,
  "show_trending": true,
  "custom_blocks": "[]"
}`
)

// GetHomepageConfig handles GET /api/v1/homepage
func GetHomepageConfig(w http.ResponseWriter, r *http.Request) {
	var setting models.Setting
	err := db.DB.Where("key = ?", "homepage_config").First(&setting).Error
	if err != nil || strings.TrimSpace(setting.Value) == "" {
		// Return default
		var defCfg models.HomepageConfig
		_ = json.Unmarshal([]byte(DefaultHomepageConfig), &defCfg)
		WriteJSON(w, http.StatusOK, defCfg)
		return
	}

	var cfg models.HomepageConfig
	if err := json.Unmarshal([]byte(setting.Value), &cfg); err != nil {
		var defCfg models.HomepageConfig
		_ = json.Unmarshal([]byte(DefaultHomepageConfig), &defCfg)
		WriteJSON(w, http.StatusOK, defCfg)
		return
	}

	WriteJSON(w, http.StatusOK, cfg)
}

// UpdateHomepageConfig handles PUT /api/v1/homepage (Admin or Agent)
func UpdateHomepageConfig(w http.ResponseWriter, r *http.Request) {
	var req models.HomepageConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	dataBytes, err := json.Marshal(req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to encode homepage config: "+err.Error())
		return
	}

	setting := models.Setting{
		Key:   "homepage_config",
		Value: string(dataBytes),
	}

	if err := db.DB.Save(&setting).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save homepage config: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Homepage configuration updated successfully",
		"config":  req,
	})
}

// GetNavigationMenu handles GET /api/v1/menu
// Combines base site pages with dynamic pages marked show_in_menu=true
func GetNavigationMenu(w http.ResponseWriter, r *http.Request) {
	// 1. Check if there is an explicit nav_menu override
	var customMenuSetting models.Setting
	if err := db.DB.Where("key = ?", "nav_menu").First(&customMenuSetting).Error; err == nil && strings.TrimSpace(customMenuSetting.Value) != "" {
		var customItems []models.MenuItem
		if err := json.Unmarshal([]byte(customMenuSetting.Value), &customItems); err == nil && len(customItems) > 0 {
			WriteJSON(w, http.StatusOK, customItems)
			return
		}
	}

	// 2. Build default navigation menu structure
	menu := []models.MenuItem{
		{
			ID:    "home",
			Title: "หน้าแรก",
			Path:  "home",
			Type:  "route",
			Order: 10,
		},
		{
			ID:    "about",
			Title: "เกี่ยวกับโรงเรียน",
			Path:  "about",
			Type:  "route",
			Order: 20,
			Children: []models.MenuItem{
				{
					ID:    "about-history",
					Title: "ประวัติความเป็นมาและวิสัยทัศน์",
					Path:  "history",
					Type:  "route",
					Order: 1,
				},
				{
					ID:    "about-basic-info",
					Title: "ข้อมูลพื้นฐานโรงเรียน",
					Path:  "/page/basic-info",
					Type:  "page",
					Order: 2,
				},
				{
					ID:    "about-personnel",
					Title: "โครงสร้างและบุคลากร",
					Path:  "about",
					Type:  "route",
					Order: 3,
				},
			},
		},
		{
			ID:    "eservice",
			Title: "ระบบ E-Service",
			Path:  "eservice",
			Type:  "route",
			Order: 30,
		},
		{
			ID:    "news",
			Title: "ข่าวและประกาศ",
			Path:  "news",
			Type:  "route",
			Order: 40,
		},
		{
			ID:    "contact",
			Title: "ติดต่อเรา",
			Path:  "contact",
			Type:  "route",
			Order: 50,
		},
	}

	// 3. Query pages marked with show_in_menu = true
	var dynamicPages []models.Page
	_ = db.DB.Where("show_in_menu = ? AND status = ?", true, "published").
		Order("menu_order ASC, id ASC").
		Find(&dynamicPages).Error

	for _, p := range dynamicPages {
		title := p.MenuTitle
		if strings.TrimSpace(title) == "" {
			title = p.Title
		}

		item := models.MenuItem{
			ID:    "page-" + p.Slug,
			Title: title,
			Path:  "/page/" + p.Slug,
			Type:  "page",
			Order: p.MenuOrder,
		}

		// Check if it belongs to a parent (e.g. "about" or "eservice")
		parentMatched := false
		if p.MenuParent != "" {
			for i := range menu {
				if menu[i].ID == p.MenuParent {
					exists := false
					for _, ch := range menu[i].Children {
						if ch.Path == item.Path {
							exists = true
							break
						}
					}
					if !exists {
						menu[i].Children = append(menu[i].Children, item)
					}
					parentMatched = true
					break
				}
			}
		}

		// If no parent matched, append as top-level menu item before contact
		if !parentMatched {
			// Insert before contact (order around 45)
			if item.Order == 0 {
				item.Order = 35
			}
			menu = append(menu, item)
		}
	}

	WriteJSON(w, http.StatusOK, menu)
}

// UpdateNavigationMenu handles PUT /api/v1/menu (Admin or Agent)
func UpdateNavigationMenu(w http.ResponseWriter, r *http.Request) {
	var items []models.MenuItem
	if err := json.NewDecoder(r.Body).Decode(&items); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	b, err := json.Marshal(items)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to marshal menu items: "+err.Error())
		return
	}

	setting := models.Setting{
		Key:   "nav_menu",
		Value: string(b),
	}

	if err := db.DB.Save(&setting).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save navigation menu: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Navigation menu updated successfully",
		"menu":    items,
	})
}

// ResetNavigationMenu handles POST /api/v1/menu/reset (Clears custom menu override)
func ResetNavigationMenu(w http.ResponseWriter, r *http.Request) {
	_ = db.DB.Where("key = ?", "nav_menu").Delete(&models.Setting{})
	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Navigation menu reset to dynamic default",
	})
}

// Helper function to fetch or update homepage config directly
func SaveHomepageConfigInternal(cfg models.HomepageConfig) error {
	b, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	return db.DB.Save(&models.Setting{
		Key:   "homepage_config",
		Value: string(b),
	}).Error
}

func GetHomepageConfigInternal() models.HomepageConfig {
	var s models.Setting
	if err := db.DB.Where("key = ?", "homepage_config").First(&s).Error; err == nil && strings.TrimSpace(s.Value) != "" {
		var cfg models.HomepageConfig
		if err := json.Unmarshal([]byte(s.Value), &cfg); err == nil {
			return cfg
		}
	}
	var defCfg models.HomepageConfig
	_ = json.Unmarshal([]byte(DefaultHomepageConfig), &defCfg)
	return defCfg
}
