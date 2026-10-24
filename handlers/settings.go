package handlers

import (
	"encoding/json"
	"net/http"
	"school-cms/db"
	"school-cms/models"
	"strings"
)

const (
	DefaultSchoolName     = "โรงเรียนโพนงามพิทยานุกูล"
	DefaultSchoolNameEn   = "Phon-ngam Pittayanukun School"
	DefaultSchoolSubtitle = "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม"
	DefaultLogoURL        = "/images/ppk-emblem-2d.png"
	DefaultFaviconURL     = "/images/ppk-emblem-2d.png"
	DefaultSeoTitle       = "โรงเรียนโพนงามพิทยานุกูล – สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม"
	DefaultSeoDescription = "เว็บไซต์อย่างเป็นทางการของโรงเรียนโพนงามพิทยานุกูล สพม.มหาสารคาม เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ"
	DefaultSeoKeywords    = "โรงเรียนโพนงามพิทยานุกูล, สพม.มหาสารคาม, มหาสารคาม, การศึกษา, โรงเรียนมัธยม"
	DefaultOgDefaultImage = "/images/hero-banner.jpg"
)

// GetSiteSettingsInternal retrieves current site identity settings with fallback to defaults
func GetSiteSettingsInternal() models.SiteSettings {
	cfg := models.SiteSettings{
		SchoolName:             DefaultSchoolName,
		SchoolNameEn:           DefaultSchoolNameEn,
		SchoolSubtitle:         DefaultSchoolSubtitle,
		LogoURL:                DefaultLogoURL,
		FaviconURL:             DefaultFaviconURL,
		SeoTitle:               DefaultSeoTitle,
		SeoDescription:         DefaultSeoDescription,
		SeoKeywords:            DefaultSeoKeywords,
		OgDefaultImage:         DefaultOgDefaultImage,
		GoogleSiteVerification: "",
	}

	var settings []models.Setting
	if err := db.DB.Where("key IN ?", []string{
		"school_name",
		"school_name_en",
		"school_subtitle",
		"logo_url",
		"favicon_url",
		"seo_title",
		"seo_description",
		"seo_keywords",
		"og_default_image",
		"google_site_verification",
	}).Find(&settings).Error; err == nil {
		for _, s := range settings {
			val := strings.TrimSpace(s.Value)
			if val == "" {
				continue
			}
			switch s.Key {
			case "school_name":
				cfg.SchoolName = val
			case "school_name_en":
				cfg.SchoolNameEn = val
			case "school_subtitle":
				cfg.SchoolSubtitle = val
			case "logo_url":
				cfg.LogoURL = val
			case "favicon_url":
				cfg.FaviconURL = val
			case "seo_title":
				cfg.SeoTitle = val
			case "seo_description":
				cfg.SeoDescription = val
			case "seo_keywords":
				cfg.SeoKeywords = val
			case "og_default_image":
				cfg.OgDefaultImage = val
			case "google_site_verification":
				cfg.GoogleSiteVerification = val
			}
		}
	}

	return cfg
}

// SaveSiteSettingsInternal saves site settings keys into the settings table
func SaveSiteSettingsInternal(req models.UpdateSiteSettingsRequest) (models.SiteSettings, error) {
	pairs := map[string]*string{
		"school_name":              req.SchoolName,
		"school_name_en":            req.SchoolNameEn,
		"school_subtitle":          req.SchoolSubtitle,
		"logo_url":                 req.LogoURL,
		"favicon_url":              req.FaviconURL,
		"seo_title":                req.SeoTitle,
		"seo_description":          req.SeoDescription,
		"seo_keywords":             req.SeoKeywords,
		"og_default_image":         req.OgDefaultImage,
		"google_site_verification": req.GoogleSiteVerification,
	}

	for key, valPtr := range pairs {
		if valPtr != nil {
			trimmed := strings.TrimSpace(*valPtr)
			setting := models.Setting{
				Key:   key,
				Value: trimmed,
			}
			if err := db.DB.Save(&setting).Error; err != nil {
				return GetSiteSettingsInternal(), err
			}
		}
	}

	return GetSiteSettingsInternal(), nil
}

// GetSiteSettings handles GET /api/v1/settings
func GetSiteSettings(w http.ResponseWriter, r *http.Request) {
	settings := GetSiteSettingsInternal()
	WriteJSON(w, http.StatusOK, settings)
}

// UpdateSiteSettings handles PUT /api/v1/settings (Admin or Agent)
func UpdateSiteSettings(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateSiteSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid JSON payload: "+err.Error())
		return
	}

	updated, err := SaveSiteSettingsInternal(req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save settings: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]any{
		"message":  "Site settings updated successfully",
		"settings": updated,
	})
}
