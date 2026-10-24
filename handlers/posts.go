package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// ListPosts handles GET /api/v1/posts
// Query params: category, status, limit, page, search, paginate
func ListPosts(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	limitStr := r.URL.Query().Get("limit")
	pageStr := r.URL.Query().Get("page")

	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	query := db.DB.Model(&models.Post{})

	if category != "" && category != "ทั้งหมด" {
		query = query.Where("category = ?", category)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		// By default public API only shows published posts unless admin
		isAdmin := r.Header.Get("X-Admin-Token") == "authenticated-admin"
		if !isAdmin {
			query = query.Where("status = ?", "published")
		}
	}

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR summary LIKE ? OR content LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	var total int64
	query.Count(&total)

	page := 1
	if pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	totalPages := 0
	if limit > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	// Set pagination response headers
	w.Header().Set("X-Total-Count", strconv.FormatInt(total, 10))
	w.Header().Set("X-Total-Pages", strconv.Itoa(totalPages))
	w.Header().Set("X-Current-Page", strconv.Itoa(page))
	w.Header().Set("X-Page-Size", strconv.Itoa(limit))

	posts := make([]models.Post, 0)
	execQuery := query.Order("created_at DESC")
	if pageStr != "" {
		offset := (page - 1) * limit
		execQuery = execQuery.Offset(offset)
	}
	if err := execQuery.Limit(limit).Find(&posts).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to query posts: "+err.Error())
		return
	}

	// If page parameter or paginate=true was requested, return structured envelope
	if pageStr != "" || r.URL.Query().Get("paginate") == "true" {
		WriteJSON(w, http.StatusOK, map[string]any{
			"data": posts,
			"pagination": map[string]any{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
			},
		})
		return
	}

	WriteJSON(w, http.StatusOK, posts)
}

// GetPost handles GET /api/v1/posts/{id}
func GetPost(w http.ResponseWriter, r *http.Request) {
	idOrSlug := r.PathValue("id")
	if idOrSlug == "" {
		WriteError(w, http.StatusBadRequest, "Missing post identifier")
		return
	}

	var post models.Post
	var err error

	if id, parseErr := strconv.ParseUint(idOrSlug, 10, 64); parseErr == nil {
		err = db.DB.Where("id = ?", id).First(&post).Error
	} else {
		err = db.DB.Where("slug = ?", idOrSlug).First(&post).Error
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Post not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	// Increment view count asynchronously
	go func(postID uint) {
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("views", gorm.Expr("views + ?", 1))
	}(post.ID)

	post.Views++
	WriteJSON(w, http.StatusOK, post)
}

// CreatePost handles POST /api/v1/posts (Admin only)
func CreatePost(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		WriteError(w, http.StatusBadRequest, "Title and Content are required")
		return
	}

	if req.Slug == "" {
		req.Slug = GenerateSlug(req.Title)
	}
	if req.Category == "" {
		req.Category = "ทั่วไป"
	}
	if req.Author == "" {
		req.Author = "โรงเรียน"
	}
	if req.Status == "" {
		req.Status = "published"
	}

	post := models.Post{
		Title:          req.Title,
		Slug:           req.Slug,
		Category:       req.Category,
		Summary:        req.Summary,
		Content:        req.Content,
		ImageURL:       req.ImageURL,
		Author:         req.Author,
		CreatedByAgent: false,
		Status:         req.Status,
	}

	if err := db.DB.Create(&post).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create post: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]any{
		"message": "Post created successfully",
		"id":      post.ID,
		"slug":    post.Slug,
	})
}

// UpdatePost handles PUT /api/v1/posts/{id} (Admin only)
func UpdatePost(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := db.DB.First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Post not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	var req models.CreatePostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	updates := map[string]any{
		"title":      req.Title,
		"category":   req.Category,
		"summary":    req.Summary,
		"content":    req.Content,
		"image_url":  req.ImageURL,
		"author":     req.Author,
		"status":     req.Status,
		"updated_at": time.Now(),
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}

	if err := db.DB.Model(&post).Updates(updates).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update post: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Post updated successfully",
	})
}

// DeletePost handles DELETE /api/v1/posts/{id} (Admin only)
func DeletePost(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid post ID")
		return
	}

	res := db.DB.Delete(&models.Post{}, id)
	if res.Error != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete post: "+res.Error.Error())
		return
	}
	if res.RowsAffected == 0 {
		WriteError(w, http.StatusNotFound, "Post not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Post deleted successfully",
	})
}

