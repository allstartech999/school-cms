package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserSafeResponse represents safe user data returned in API
type UserSafeResponse struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func toUserSafeResponse(u models.User) UserSafeResponse {
	return UserSafeResponse{
		ID:        u.ID,
		Username:  u.Username,
		Name:      u.Name,
		Role:      u.Role,
		CreatedAt: u.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: u.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ListUsers handles GET /api/v1/users (AdminAuth)
func ListUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	if err := db.DB.Order("id asc").Find(&users).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to fetch users: "+err.Error())
		return
	}

	result := make([]UserSafeResponse, len(users))
	for i, u := range users {
		result[i] = toUserSafeResponse(u)
	}

	WriteJSON(w, http.StatusOK, result)
}

// CreateUser handles POST /api/v1/users (AdminAuth)
func CreateUser(w http.ResponseWriter, r *http.Request) {
	requester := GetAuthenticatedUser(r)
	if requester == nil || requester.Role != "admin" {
		WriteError(w, http.StatusForbidden, "สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น")
		return
	}

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	username := strings.TrimSpace(req.Username)
	if len(username) < 3 {
		WriteError(w, http.StatusBadRequest, "ชื่อผู้ใช้งาน (Username) ต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		WriteError(w, http.StatusBadRequest, "กรุณากรอกชื่อ-นามสกุล หรือชื่อแสดงของผู้ใช้")
		return
	}

	password := strings.TrimSpace(req.Password)
	if len(password) < 4 {
		WriteError(w, http.StatusBadRequest, "รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร")
		return
	}

	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = "admin"
	}

	// Check if username already exists
	var existing models.User
	if err := db.DB.Where("LOWER(username) = LOWER(?)", username).First(&existing).Error; err == nil {
		WriteError(w, http.StatusConflict, "ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น")
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Hash password
	hashedPass, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	newUser := models.User{
		Username: username,
		Password: string(hashedPass),
		Name:     name,
		Role:     role,
	}

	if err := db.DB.Create(&newUser).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถสร้างผู้ใช้ได้: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, toUserSafeResponse(newUser))
}

// UpdateUser handles PUT /api/v1/users/{id} (AdminAuth)
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	requester := GetAuthenticatedUser(r)
	if requester == nil {
		WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "ไม่พบผู้ใช้ที่ระบุ")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	// Non-admin can only update themselves and cannot change their role
	if requester.Role != "admin" && requester.ID != user.ID {
		WriteError(w, http.StatusForbidden, "สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น")
		return
	}

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if name := strings.TrimSpace(req.Name); name != "" {
		user.Name = name
	}
	if role := strings.TrimSpace(req.Role); role != "" {
		if requester.Role != "admin" && role != user.Role {
			WriteError(w, http.StatusForbidden, "คุณไม่มีสิทธิ์เปลี่ยนระดับสิทธิ์ของผู้ใช้งาน")
			return
		}

		if role != user.Role {
			// Protection 1: Super Admin username="admin" cannot be demoted
			if strings.EqualFold(user.Username, "admin") && role != "admin" {
				WriteError(w, http.StatusBadRequest, "ไม่สามารถลดระดับสิทธิ์ของบัญชีผู้ดูแลระบบหลัก (Super Admin) ได้")
				return
			}

			// Protection 2: Admin cannot demote their own account
			if user.Role == "admin" && requester.ID == user.ID && role != "admin" {
				WriteError(w, http.StatusBadRequest, "ไม่สามารถลดระดับสิทธิ์ของบัญชีตนเองได้")
				return
			}

			// Protection 3: Cannot demote the last remaining admin
			if user.Role == "admin" && role != "admin" {
				var adminCount int64
				db.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
				if adminCount <= 1 {
					WriteError(w, http.StatusBadRequest, "ไม่สามารถลดระดับสิทธิ์ของผู้ดูแลระบบคนสุดท้ายได้")
					return
				}
			}

			user.Role = role
		}
	}

	if pass := strings.TrimSpace(req.Password); pass != "" {
		if len(pass) < 4 {
			WriteError(w, http.StatusBadRequest, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร")
			return
		}
		hashedPass, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
		if err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to hash password")
			return
		}
		user.Password = string(hashedPass)
	}

	if err := db.DB.Save(&user).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถบันทึกข้อมูลผู้ใช้ได้: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, toUserSafeResponse(user))
}

// DeleteUser handles DELETE /api/v1/users/{id} (AdminAuth)
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	requester := GetAuthenticatedUser(r)
	if requester == nil || requester.Role != "admin" {
		WriteError(w, http.StatusForbidden, "สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น")
		return
	}

	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	if err := db.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "ไม่พบผู้ใช้ที่ระบุ")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	// Protection 1: Cannot delete own account currently logged in
	if requester.ID == user.ID {
		WriteError(w, http.StatusBadRequest, "ไม่สามารถลบบัญชีของตนเองที่กำลังใช้งานอยู่ได้")
		return
	}

	// Protection 2: Root super admin (username "admin") is permanently protected
	if strings.EqualFold(user.Username, "admin") {
		WriteError(w, http.StatusBadRequest, "ไม่สามารถลบบัญชีผู้ดูแลระบบหลัก (Super Admin) ของระบบได้")
		return
	}

	// Protection 3: Prevent deleting if it's the last admin
	var adminCount int64
	db.DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	if user.Role == "admin" && adminCount <= 1 {
		WriteError(w, http.StatusBadRequest, "ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้")
		return
	}

	if err := db.DB.Delete(&user).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete user: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "ลบผู้ใช้สำเร็จแล้ว",
	})
}
