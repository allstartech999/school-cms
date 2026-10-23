package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"school-cms/db"
	"school-cms/models"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// GetAdminDefaultPassword retrieves the default admin password from .env
func GetAdminDefaultPassword() string {
	pass := os.Getenv("ADMIN_DEFAULT_PASSWORD")
	if pass == "" {
		pass = os.Getenv("ADMIN_PASSWORD")
	}
	if pass == "" {
		pass = "admin123"
	}
	return pass
}

// IsPasswordChangeRequired checks if the administrator has changed their initial password
func IsPasswordChangeRequired() bool {
	var changed models.Setting
	if err := db.DB.Where("key = ?", "admin_password_changed").First(&changed).Error; err == nil {
		return changed.Value != "true"
	}

	var passSetting models.Setting
	defaultPass := GetAdminDefaultPassword()
	if err := db.DB.Where("key = ?", "admin_password").First(&passSetting).Error; err == nil && passSetting.Value != "" {
		return passSetting.Value == defaultPass
	}

	return true
}

// AdminLogin handles POST /api/v1/admin/login
func AdminLogin(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	username := strings.TrimSpace(req.Username)
	if username == "" {
		username = "admin"
	}

	password := strings.TrimSpace(req.Password)
	if password == "" {
		WriteError(w, http.StatusBadRequest, "กรุณากรอกรหัสผ่าน")
		return
	}

	// 1. Try finding user in users table
	var user models.User
	err := db.DB.Where("LOWER(username) = LOWER(?)", username).First(&user).Error
	if err == nil {
		// Verify bcrypt hash
		matchErr := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if matchErr != nil {
			// Fallback check if stored password is plain text
			if user.Password == password {
				// Upgrade to bcrypt
				if hashed, hErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost); hErr == nil {
					user.Password = string(hashed)
					_ = db.DB.Save(&user)
				}
			} else {
				WriteError(w, http.StatusUnauthorized, "รหัสผ่านไม่ถูกต้อง")
				return
			}
		}

		mustChange := IsPasswordChangeRequired()
		token := "authenticated-" + user.Username

		WriteJSON(w, http.StatusOK, map[string]any{
			"token":                token,
			"message":              "เข้าสู่ระบบสำเร็จ",
			"must_change_password": mustChange,
			"user": map[string]any{
				"id":       user.ID,
				"username": user.Username,
				"name":     user.Name,
				"role":     user.Role,
			},
		})
		return
	}

	// 2. Fallback for legacy admin if user not found and username is admin
	if strings.EqualFold(username, "admin") {
		defaultPassword := GetAdminDefaultPassword()
		storedPassword := defaultPassword

		var setting models.Setting
		if err := db.DB.Where("key = ?", "admin_password").First(&setting).Error; err == nil && setting.Value != "" {
			storedPassword = setting.Value
		}

		if password == storedPassword {
			// Auto create the admin user with bcrypt
			hashedPass, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			newUser := models.User{
				Username: "admin",
				Password: string(hashedPass),
				Name:     "ผู้ดูแลระบบ (Super Admin)",
				Role:     "admin",
			}
			_ = db.DB.Create(&newUser)

			mustChange := IsPasswordChangeRequired()
			WriteJSON(w, http.StatusOK, map[string]any{
				"token":                "authenticated-admin",
				"message":              "เข้าสู่ระบบสำเร็จ",
				"must_change_password": mustChange,
				"user": map[string]any{
					"id":       newUser.ID,
					"username": newUser.Username,
					"name":     newUser.Name,
					"role":     newUser.Role,
				},
			})
			return
		}
	}

	WriteError(w, http.StatusUnauthorized, "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
}

// AdminVerify handles POST /api/v1/admin/verify (Protected by AdminAuth)
func AdminVerify(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]any{
		"valid":                true,
		"message":              "Token is valid",
		"must_change_password": IsPasswordChangeRequired(),
	})
}

// ChangePasswordRequest represents the payload for changing admin password
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// AdminChangePassword handles POST /api/v1/admin/change-password (Protected by AdminAuth)
func AdminChangePassword(w http.ResponseWriter, r *http.Request) {
	var req ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	newPassword := strings.TrimSpace(req.NewPassword)
	if len(newPassword) < 4 {
		WriteError(w, http.StatusBadRequest, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร")
		return
	}

	defaultPassword := GetAdminDefaultPassword()
	storedPassword := defaultPassword

	var setting models.Setting
	if err := db.DB.Where("key = ?", "admin_password").First(&setting).Error; err == nil && setting.Value != "" {
		storedPassword = setting.Value
	}

	// Check if old password matches setting or admin user
	oldMatches := req.OldPassword == storedPassword
	var adminUser models.User
	if !oldMatches {
		if err := db.DB.Where("username = ?", "admin").First(&adminUser).Error; err == nil {
			if bcrypt.CompareHashAndPassword([]byte(adminUser.Password), []byte(req.OldPassword)) == nil || adminUser.Password == req.OldPassword {
				oldMatches = true
			}
		}
	}

	if !oldMatches {
		WriteError(w, http.StatusUnauthorized, "รหัสผ่านเดิมไม่ถูกต้อง")
		return
	}

	if newPassword == defaultPassword {
		WriteError(w, http.StatusBadRequest, "รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านเริ่มต้นของระบบ")
		return
	}

	// Update admin password in database
	setting.Key = "admin_password"
	setting.Value = newPassword
	if err := db.DB.Save(&setting).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถบันทึกรหัสผ่านใหม่ได้: "+err.Error())
		return
	}

	// Also update admin user if exists
	if adminUser.ID == 0 {
		_ = db.DB.Where("username = ?", "admin").First(&adminUser)
	}
	if adminUser.ID != 0 {
		if hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost); err == nil {
			adminUser.Password = string(hashed)
			_ = db.DB.Save(&adminUser)
		}
	}

	// Mark password as changed
	changedSetting := models.Setting{
		Key:   "admin_password_changed",
		Value: "true",
	}
	_ = db.DB.Save(&changedSetting)

	WriteJSON(w, http.StatusOK, map[string]any{
		"message":              "เปลี่ยนรหัสผ่านแอดมินสำเร็จแล้ว",
		"must_change_password": false,
	})
}

// GetStats handles GET /api/v1/stats
func GetStats(w http.ResponseWriter, r *http.Request) {
	var totalPosts, totalPages, agentPosts, totalViews int64
	db.DB.Model(&models.Post{}).Count(&totalPosts)
	db.DB.Model(&models.Page{}).Count(&totalPages)
	db.DB.Model(&models.Post{}).Where("created_by_agent = ?", true).Count(&agentPosts)
	db.DB.Model(&models.Post{}).Select("COALESCE(SUM(views), 0)").Scan(&totalViews)

	settings := GetSiteSettingsInternal()

	// Get count of active agent keys
	var activeKeyCount int64
	db.DB.Model(&models.AgentKey{}).Where("is_active = ?", true).Count(&activeKeyCount)

	// Check if requester is Admin
	token := r.Header.Get("X-Admin-Token")
	authHeader := r.Header.Get("Authorization")
	isAdmin := token == "authenticated-admin" || strings.HasPrefix(token, "authenticated-") ||
		strings.HasSuffix(authHeader, "authenticated-admin") || strings.Contains(authHeader, "authenticated-")

	previewKey := ""
	fullKey := ""

	// Fetch most recent active agent key
	var firstActiveKey models.AgentKey
	if err := db.DB.Where("is_active = ?", true).Order("created_at desc").First(&firstActiveKey).Error; err == nil {
		if isAdmin {
			fullKey = firstActiveKey.Key
			previewKey = firstActiveKey.Key
		} else if len(firstActiveKey.Key) > 12 {
			previewKey = firstActiveKey.Key[:12] + "..."
		}
	}

	stats := map[string]any{
		"total_posts":          totalPosts,
		"total_pages":          totalPages,
		"agent_posts":          agentPosts,
		"total_views":          totalViews,
		"school_name":          settings.SchoolName,
		"school_name_en":       settings.SchoolNameEn,
		"school_subtitle":      settings.SchoolSubtitle,
		"logo_url":             settings.LogoURL,
		"favicon_url":          settings.FaviconURL,
		"agent_keys_count":     activeKeyCount,
		"agent_key_preview":    previewKey,
		"agent_key":            fullKey,
		"must_change_password": IsPasswordChangeRequired(),
	}

	WriteJSON(w, http.StatusOK, stats)
}
