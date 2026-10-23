package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

// GenerateSecureKey creates a cryptographically strong API key
func GenerateSecureKey() (string, error) {
	bytes := make([]byte, 20)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return "ppk_agent_" + hex.EncodeToString(bytes), nil
}

// ListAgentKeys handles GET /api/v1/agent-keys (AdminAuth)
func ListAgentKeys(w http.ResponseWriter, r *http.Request) {
	var keys []models.AgentKey
	if err := db.DB.Order("created_at desc").Find(&keys).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to fetch agent keys: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, keys)
}

// CreateAgentKey handles POST /api/v1/agent-keys (AdminAuth)
func CreateAgentKey(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAgentKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		WriteError(w, http.StatusBadRequest, "กรุณาระบุชื่อเรียกสำหรับ API Key (เช่น Claude Code, Gemini Bot)")
		return
	}

	rawKey, err := GenerateSecureKey()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to generate secure key: "+err.Error())
		return
	}

	agentKey := models.AgentKey{
		Name:        name,
		Key:         rawKey,
		Description: strings.TrimSpace(req.Description),
		IsActive:    true,
	}

	if err := db.DB.Create(&agentKey).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "ไม่สามารถสร้าง API Key ได้: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]any{
		"message": "สร้าง API Key สำหรับ AI Agent สำเร็จ",
		"key":     agentKey,
	})
}

// DeleteAgentKey handles DELETE /api/v1/agent-keys/{id} (AdminAuth)
func DeleteAgentKey(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid key ID")
		return
	}

	var agentKey models.AgentKey
	if err := db.DB.First(&agentKey, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "ไม่พบ API Key ที่ระบุ")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	if err := db.DB.Delete(&agentKey).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete agent key: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "ลบ API Key สำเร็จแล้ว",
	})
}

// ToggleAgentKey handles PUT /api/v1/agent-keys/{id}/toggle (AdminAuth)
func ToggleAgentKey(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid key ID")
		return
	}

	var agentKey models.AgentKey
	if err := db.DB.First(&agentKey, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "ไม่พบ API Key ที่ระบุ")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	agentKey.IsActive = !agentKey.IsActive
	if err := db.DB.Save(&agentKey).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update agent key: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, agentKey)
}
