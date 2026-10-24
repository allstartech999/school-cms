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

// GetAuthenticatedUser extracts the User from X-Admin-Token or Authorization header
func GetAuthenticatedUser(r *http.Request) *models.User {
	token := r.Header.Get("X-Admin-Token")
	if token == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			token = authHeader
		}
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return nil
	}

	var username string
	if token == "authenticated" || token == "authenticated-admin" {
		username = "admin"
	} else if strings.HasPrefix(token, "authenticated-") {
		username = strings.TrimPrefix(token, "authenticated-")
	} else {
		return nil
	}

	username = strings.TrimSpace(username)
	if username == "" {
		return nil
	}

	var user models.User
	if err := db.DB.Where("LOWER(username) = LOWER(?)", username).First(&user).Error; err == nil {
		return &user
	}
	return nil
}

// IsPasswordChangeRequiredForUser checks if the user is still using the default system password
func IsPasswordChangeRequiredForUser(user *models.User) bool {
	if user == nil {
		return false
	}
	defaultPass := GetAdminDefaultPassword()
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(defaultPass)) == nil || user.Password == defaultPass {
		return true
	}
	return false
}

// IsPasswordChangeRequired checks if the default admin user is still using the default system password
func IsPasswordChangeRequired() bool {
	var adminUser models.User
	if err := db.DB.Where("LOWER(username) = LOWER(?)", "admin").First(&adminUser).Error; err == nil {
		return IsPasswordChangeRequiredForUser(&adminUser)
	}
	return false
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

	// Find user in users table
	var user models.User
	err := db.DB.Where("LOWER(username) = LOWER(?)", username).First(&user).Error
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
		return
	}

	// Verify password
	matchErr := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if matchErr != nil {
		// Fallback check if stored password is plain text
		if user.Password == password {
			// Upgrade to bcrypt
			if hashed, hErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost); hErr == nil {
				user.Password = string(hashed)
				_ = db.DB.Save(&user)
				matchErr = nil
			}
		}

		if matchErr != nil {
			WriteError(w, http.StatusUnauthorized, "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง")
			return
		}
	}

	mustChange := IsPasswordChangeRequiredForUser(&user)
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
}

// AdminVerify handles POST /api/v1/admin/verify (Protected by AdminAuth)
func AdminVerify(w http.ResponseWriter, r *http.Request) {
	user := GetAuthenticatedUser(r)
	mustChange := false
	if user != nil {
		mustChange = IsPasswordChangeRequiredForUser(user)
	} else {
		mustChange = IsPasswordChangeRequired()
	}

	resp := map[string]any{
		"valid":                true,
		"message":              "Token is valid",
		"must_change_password": mustChange,
	}
	if user != nil {
		resp["user"] = map[string]any{
			"id":       user.ID,
			"username": user.Username,
			"name":     user.Name,
			"role":     user.Role,
		}
	}

	WriteJSON(w, http.StatusOK, resp)
}

// ChangePasswordRequest represents the payload for changing user password
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

	user := GetAuthenticatedUser(r)
	if user == nil {
		WriteError(w, http.StatusUnauthorized, "ไม่พบข้อมูลผู้ใช้ในระบบหรือยังไม่ได้เข้าสู่ระบบ")
		return
	}

	// Check if old password matches
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)) != nil && user.Password != req.OldPassword {
		WriteError(w, http.StatusUnauthorized, "รหัสผ่านเดิมไม่ถูกต้อง")
		return
	}

	defaultPassword := GetAdminDefaultPassword()
	if newPassword == defaultPassword {
		WriteError(w, http.StatusBadRequest, "รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านเริ่มต้นของระบบ")
		return
	}

	// Hash and save new password to users table
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถบันทึกรหัสผ่านใหม่ได้: "+err.Error())
		return
	}

	user.Password = string(hashed)
	if err := db.DB.Save(user).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถบันทึกรหัสผ่านใหม่ได้: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message":              "เปลี่ยนรหัสผ่านสำเร็จแล้ว",
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

	// Check if requester is authenticated user
	user := GetAuthenticatedUser(r)
	isAdmin := user != nil

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

	mustChange := false
	if user != nil {
		mustChange = IsPasswordChangeRequiredForUser(user)
	} else {
		mustChange = IsPasswordChangeRequired()
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
		"must_change_password": mustChange,
	}

	WriteJSON(w, http.StatusOK, stats)
}
