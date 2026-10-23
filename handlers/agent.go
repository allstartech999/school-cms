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

// AgentListPages handles GET /api/v1/agent/pages
func AgentListPages(w http.ResponseWriter, r *http.Request) {
	var pages []models.Page
	if err := db.DB.Order("id ASC").Find(&pages).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"agent_context": "School Static Pages for AI Agent",
		"total_count":   len(pages),
		"pages":         pages,
	})
}

// AgentCreateOrUpdatePage handles POST /api/v1/agent/pages
// AI can create a new page with block layout or update existing one
func AgentCreateOrUpdatePage(w http.ResponseWriter, r *http.Request) {
	var req models.AgentCreatePageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	if strings.TrimSpace(req.Title) == "" {
		WriteError(w, http.StatusBadRequest, "Title is required")
		return
	}

	slug := req.Slug
	if slug == "" {
		slug = GenerateSlug(req.Title)
	}

	layoutType := req.LayoutType
	if layoutType == "" {
		layoutType = "blocks"
	}

	var layoutDataStr string
	if req.LayoutData != nil {
		switch v := req.LayoutData.(type) {
		case string:
			layoutDataStr = v
		default:
			b, err := json.Marshal(v)
			if err != nil {
				WriteError(w, http.StatusBadRequest, "Failed to marshal layout_data: "+err.Error())
				return
			}
			layoutDataStr = string(b)
		}
	}

	status := "draft"
	if req.Publish {
		status = "published"
	}

	agentName := req.AgentName
	if agentName == "" {
		agentName = "AI Layout Designer"
	}

	var existing models.Page
	res := db.DB.Where("slug = ?", slug).First(&existing)
	if res.Error == nil {
		// Update existing
		existing.Title = req.Title
		existing.LayoutType = layoutType
		existing.LayoutData = layoutDataStr
		if req.Content != "" {
			existing.Content = req.Content
		}
		existing.Status = status
		existing.CreatedByAgent = true
		existing.AgentName = agentName
		existing.UpdatedAt = time.Now()

		if err := db.DB.Save(&existing).Error; err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to update page: "+err.Error())
			return
		}

		WriteJSON(w, http.StatusOK, map[string]any{
			"message":          "Page updated successfully by AI",
			"id":               existing.ID,
			"slug":             existing.Slug,
			"status":           existing.Status,
			"created_by_agent": true,
			"agent_name":       agentName,
		})
		return
	}

	// Create new page
	content := req.Content
	if content == "" {
		content = req.Title // Fallback text
	}

	page := models.Page{
		Title:          req.Title,
		Slug:           slug,
		LayoutType:     layoutType,
		LayoutData:     layoutDataStr,
		Content:        content,
		Status:         status,
		CreatedByAgent: true,
		AgentName:      agentName,
	}

	if err := db.DB.Create(&page).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create page: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]any{
		"message":          "Page created successfully by AI",
		"id":               page.ID,
		"slug":             page.Slug,
		"status":           page.Status,
		"created_by_agent": true,
		"agent_name":       agentName,
	})
}
