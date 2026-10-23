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

// ListPages handles GET /api/v1/pages
func ListPages(w http.ResponseWriter, r *http.Request) {
	var pages []models.Page
	if err := db.DB.Order("id ASC").Find(&pages).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to query pages: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, pages)
}

// GetPage handles GET /api/v1/pages/{slug}
func GetPage(w http.ResponseWriter, r *http.Request) {
	slugOrID := r.PathValue("slug")
	if slugOrID == "" {
		WriteError(w, http.StatusBadRequest, "Missing page slug")
		return
	}

	var p models.Page
	var err error

	if id, parseErr := strconv.ParseUint(slugOrID, 10, 64); parseErr == nil {
		err = db.DB.Where("id = ?", id).First(&p).Error
	} else {
		err = db.DB.Where("slug = ?", slugOrID).First(&p).Error
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Page not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	WriteJSON(w, http.StatusOK, p)
}

// CreatePage handles POST /api/v1/pages (Admin only)
func CreatePage(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePageRequest
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
	if req.Status == "" {
		req.Status = "published"
	}

	page := models.Page{
		Title:   req.Title,
		Slug:    req.Slug,
		Content: req.Content,
		Status:  req.Status,
	}

	if err := db.DB.Create(&page).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create page: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]any{
		"message": "Page created successfully",
		"id":      page.ID,
		"slug":    page.Slug,
	})
}

// UpdatePage handles PUT /api/v1/pages/{id} (Admin only)
func UpdatePage(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid page ID")
		return
	}

	var page models.Page
	if err := db.DB.First(&page, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Page not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	var req models.CreatePageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	updates := map[string]any{
		"title":      req.Title,
		"content":    req.Content,
		"status":     req.Status,
		"updated_at": time.Now(),
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}

	if err := db.DB.Model(&page).Updates(updates).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update page: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Page updated successfully",
	})
}

// DeletePage handles DELETE /api/v1/pages/{id} (Admin only)
func DeletePage(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid page ID")
		return
	}

	res := db.DB.Delete(&models.Page{}, id)
	if res.Error != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete page: "+res.Error.Error())
		return
	}
	if res.RowsAffected == 0 {
		WriteError(w, http.StatusNotFound, "Page not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message": "Page deleted successfully",
	})
}
