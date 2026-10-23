package handlers

import (
	"encoding/json"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"
	"time"
)

// AgentCreatePost handles POST /api/v1/agent/posts
// Protected by X-Agent-Key header
func AgentCreatePost(w http.ResponseWriter, r *http.Request) {
	var req models.AgentCreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		WriteError(w, http.StatusBadRequest, "Title and Content are required")
		return
	}

	if req.Category == "" {
		req.Category = "ข่าวสาร AI"
	}
	if req.AgentName == "" {
		req.AgentName = "AI Editorial Assistant"
	}

	status := "draft"
	if req.Publish {
		status = "published"
	}

	slug := GenerateSlug(req.Title) + "-ai-" + strconv.FormatInt(time.Now().Unix(), 10)

	post := models.Post{
		Title:          req.Title,
		Slug:           slug,
		Category:       req.Category,
		Summary:        req.Summary,
		Content:        req.Content,
		ImageURL:       req.ImageURL,
		Author:         req.AgentName,
		CreatedByAgent: true,
		AgentName:      req.AgentName,
		Status:         status,
	}

	if err := db.DB.Create(&post).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to insert agent post: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]any{
		"message":          "AI Post processed successfully",
		"id":               post.ID,
		"slug":             slug,
		"status":           status,
		"created_by_agent": true,
		"agent_name":       req.AgentName,
	})
}

// AgentListPosts handles GET /api/v1/agent/posts
// Allows AI agents to read the current context of news to avoid duplicates or to summarize
func AgentListPosts(w http.ResponseWriter, r *http.Request) {
	var posts []models.Post
	if err := db.DB.Order("created_at DESC").Limit(30).Find(&posts).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"agent_context": "School News Feed for AI Agent",
		"total_count":   len(posts),
		"posts":         posts,
	})
}
