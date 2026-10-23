package handlers

import (
	"encoding/json"
	"net/http"
	"school-cms/db"
	"school-cms/models"
)

// AdminLogin handles POST /api/v1/admin/login
func AdminLogin(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	var setting models.Setting
	storedPassword := "admin123"
	if err := db.DB.Where("key = ?", "admin_password").First(&setting).Error; err == nil && setting.Value != "" {
		storedPassword = setting.Value
	}

	if req.Password != storedPassword {
		WriteError(w, http.StatusUnauthorized, "รหัสผ่านไม่ถูกต้อง")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"token":   "authenticated-admin",
		"message": "เข้าสู่ระบบสำเร็จ",
	})
}

// GetStats handles GET /api/v1/stats
func GetStats(w http.ResponseWriter, r *http.Request) {
	var totalPosts, totalPages, agentPosts int64
	db.DB.Model(&models.Post{}).Count(&totalPosts)
	db.DB.Model(&models.Page{}).Count(&totalPages)
	db.DB.Model(&models.Post{}).Where("created_by_agent = ?", true).Count(&agentPosts)

	settings := GetSiteSettingsInternal()

	var agentKeySetting models.Setting
	var agentKey string
	if err := db.DB.Where("key = ?", "agent_key").First(&agentKeySetting).Error; err == nil {
		agentKey = agentKeySetting.Value
	}

	previewKey := "agent-school-***"
	if len(agentKey) > 12 {
		previewKey = agentKey[:12] + "..."
	}

	stats := models.SystemStats{
		TotalPosts:      totalPosts,
		TotalPages:      totalPages,
		AgentPosts:      agentPosts,
		SchoolName:      settings.SchoolName,
		SchoolNameEn:    settings.SchoolNameEn,
		SchoolSubtitle:  settings.SchoolSubtitle,
		LogoURL:         settings.LogoURL,
		FaviconURL:      settings.FaviconURL,
		AgentKeyPreview: previewKey,
	}

	WriteJSON(w, http.StatusOK, stats)
}
