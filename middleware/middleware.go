package middleware

import (
	"log"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strings"
	"time"
)

// Logging middleware logs the incoming requests
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s (%v)", r.Method, r.URL.Path, time.Since(start))
	})
}

// CORS middleware handles Cross-Origin Resource Sharing
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token, X-Agent-Key")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// AdminAuth middleware verifies that the user is an authorized admin
func AdminAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("X-Admin-Token")
		authHeader := r.Header.Get("Authorization")

		if token == "authenticated-admin" || strings.HasPrefix(token, "authenticated-") ||
			strings.HasSuffix(authHeader, "authenticated-admin") || strings.Contains(authHeader, "authenticated-") {
			next(w, r)
			return
		}

		http.Error(w, `{"error": "Unauthorized: Admin access required"}`, http.StatusUnauthorized)
	}
}

// ExtractAgentKey extracts the agent key from headers or query parameters
func ExtractAgentKey(r *http.Request) string {
	key := r.Header.Get("X-Agent-Key")
	if key == "" {
		key = r.URL.Query().Get("key")
	}
	if key == "" {
		key = r.URL.Query().Get("agent_key")
	}
	if key == "" {
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			key = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}
	return key
}

// ValidateAgentKey checks if the provided key is valid and active in database.
// Default legacy key 'agent-school-secret-key-2026' is explicitly disallowed.
func ValidateAgentKey(key string) bool {
	if key == "" || key == "agent-school-secret-key-2026" {
		return false
	}

	// 1. Check in AgentKey table
	var agentKey models.AgentKey
	if err := db.DB.Where("key = ? AND is_active = ?", key, true).First(&agentKey).Error; err == nil {
		go func(id uint) {
			now := time.Now()
			_ = db.DB.Model(&models.AgentKey{}).Where("id = ?", id).Update("last_used_at", &now)
		}(agentKey.ID)
		return true
	}

	// 2. Check in legacy settings if custom and not the default
	var setting models.Setting
	if err := db.DB.Where("key = ?", "agent_key").First(&setting).Error; err == nil && setting.Value != "" && setting.Value != "agent-school-secret-key-2026" {
		return key == setting.Value
	}

	return false
}

// AgentAuth middleware verifies the X-Agent-Key (from header, query param, or Bearer auth)
func AgentAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := ExtractAgentKey(r)
		if key == "" {
			http.Error(w, `{"error": "Unauthorized: Missing Agent Key (Header X-Agent-Key, Bearer token, or ?key= param)"}`, http.StatusUnauthorized)
			return
		}

		if !ValidateAgentKey(key) {
			http.Error(w, `{"error": "Unauthorized: Invalid or revoked Agent Key"}`, http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

// AgentOrAdminAuth allows either Admin token or Agent Key
func AgentOrAdminAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("X-Admin-Token")
		authHeader := r.Header.Get("Authorization")
		if token == "authenticated-admin" || strings.HasPrefix(token, "authenticated-") ||
			strings.HasSuffix(authHeader, "authenticated-admin") || strings.Contains(authHeader, "authenticated-") {
			next(w, r)
			return
		}

		// Check Agent Key
		key := ExtractAgentKey(r)
		if key != "" && ValidateAgentKey(key) {
			next(w, r)
			return
		}

		http.Error(w, `{"error": "Unauthorized: Admin or Agent authorization required"}`, http.StatusUnauthorized)
	}
}
