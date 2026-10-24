package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// ListCategories handles GET /api/v1/categories
func ListCategories(w http.ResponseWriter, r *http.Request) {
	var categories []models.Category
	if err := db.DB.Order("id ASC").Find(&categories).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to fetch categories: "+err.Error())
		return
	}

	// Count posts for each category
	type PostCount struct {
		Category string
		Count    int64
	}
	var counts []PostCount
	db.DB.Model(&models.Post{}).Select("category, count(*) as count").Group("category").Scan(&counts)

	countMap := make(map[string]int64)
	for _, c := range counts {
		countMap[c.Category] = c.Count
	}

	result := make([]models.CategoryResponse, len(categories))
	for i, cat := range categories {
		result[i] = models.CategoryResponse{
			ID:         cat.ID,
			Name:       cat.Name,
			Slug:       cat.Slug,
			PostsCount: countMap[cat.Name],
			CreatedAt:  cat.CreatedAt,
			UpdatedAt:  cat.UpdatedAt,
		}
	}

	WriteJSON(w, http.StatusOK, result)
}

// CreateCategory handles POST /api/v1/categories (Admin only)
func CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		WriteError(w, http.StatusBadRequest, "Category name is required")
		return
	}

	// Check if already exists
	var existing models.Category
	if err := db.DB.Where("name = ?", req.Name).First(&existing).Error; err == nil {
		WriteError(w, http.StatusConflict, "หมวดหมู่ '"+req.Name+"' มีอยู่ในระบบแล้ว")
		return
	}

	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = GenerateSlug(req.Name)
		if slug == "post" || slug == "" {
			slug = fmt.Sprintf("cat-%d", time.Now().Unix())
		}
	}

	// Ensure unique slug
	var existingSlug models.Category
	if err := db.DB.Where("slug = ?", slug).First(&existingSlug).Error; err == nil {
		slug = fmt.Sprintf("%s-%d", slug, time.Now().Unix()%1000)
	}

	cat := models.Category{
		Name: req.Name,
		Slug: slug,
	}

	if err := db.DB.Create(&cat).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create category: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, models.CategoryResponse{
		ID:         cat.ID,
		Name:       cat.Name,
		Slug:       cat.Slug,
		PostsCount: 0,
		CreatedAt:  cat.CreatedAt,
		UpdatedAt:  cat.UpdatedAt,
	})
}

// UpdateCategory handles PUT /api/v1/categories/{id} (Admin only)
func UpdateCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var cat models.Category
	if err := db.DB.First(&cat, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Category not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	var req models.UpdateCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		WriteError(w, http.StatusBadRequest, "Category name is required")
		return
	}

	// Check if another category has the same name
	var duplicate models.Category
	if err := db.DB.Where("name = ? AND id != ?", req.Name, id).First(&duplicate).Error; err == nil {
		WriteError(w, http.StatusConflict, "หมวดหมู่ '"+req.Name+"' มีอยู่ในระบบแล้ว")
		return
	}

	oldName := cat.Name
	cat.Name = req.Name
	if strings.TrimSpace(req.Slug) != "" {
		cat.Slug = strings.TrimSpace(req.Slug)
	}

	if err := db.DB.Save(&cat).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to update category: "+err.Error())
		return
	}

	// If name changed, update all posts referencing the old name
	if oldName != cat.Name {
		db.DB.Model(&models.Post{}).Where("category = ?", oldName).Update("category", cat.Name)
	}

	var postCount int64
	db.DB.Model(&models.Post{}).Where("category = ?", cat.Name).Count(&postCount)

	WriteJSON(w, http.StatusOK, models.CategoryResponse{
		ID:         cat.ID,
		Name:       cat.Name,
		Slug:       cat.Slug,
		PostsCount: postCount,
		CreatedAt:  cat.CreatedAt,
		UpdatedAt:  cat.UpdatedAt,
	})
}

// DeleteCategory handles DELETE /api/v1/categories/{id} (Admin only)
func DeleteCategory(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid category ID")
		return
	}

	var cat models.Category
	if err := db.DB.First(&cat, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			WriteError(w, http.StatusNotFound, "Category not found")
		} else {
			WriteError(w, http.StatusInternalServerError, err.Error())
		}
		return
	}

	if cat.Name == "ทั่วไป" {
		WriteError(w, http.StatusBadRequest, "ไม่สามารถลบหมวดหมู่เริ่มต้น 'ทั่วไป' ได้")
		return
	}

	// Reassign posts of this category to "ทั่วไป"
	db.DB.Model(&models.Post{}).Where("category = ?", cat.Name).Update("category", "ทั่วไป")

	if err := db.DB.Delete(&cat).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to delete category: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{
		"message": "Category deleted successfully",
	})
}
