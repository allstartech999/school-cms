package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"school-cms/db"
	"school-cms/models"
	"school-cms/storage"
	"strings"
	"time"
)

// DefaultExtensionCatalog returns the preset extensions available in the marketplace
func DefaultExtensionCatalog() []models.ExtensionCatalogItem {
	return []models.ExtensionCatalogItem{
		{
			ID:          "storage-filo",
			Name:        "Filo Storage (ระบบจัดเก็บไฟล์ Filo Storage)",
			Category:    "storage",
			Description: "บริการ Filo Storage ไมโครเซอร์วิสจัดเก็บไฟล์ความเร็วสูง รองรับการต่อท่อตรงเข้า Google Drive (BYOS OAuth 2.0) แยกโฟลเดอร์ตามโปรเจกต์ และสร้าง CDN ลิงก์ตรง",
			Version:     "1.3.0",
			Author:      "Filo Storage Team",
			Icon:        "HardDrive",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"filo_endpoint":   "http://localhost:8081",
				"filo_api_key":    "",
				"filo_project_key": "school-cms",
				"client_id":       "",
				"client_secret":   "",
				"folder_name":     "School-CMS-Uploads",
				"folder_id":       "",
				"connected_email": "",
				"connected_name":  "",
				"refresh_token":   "",
				"access_token":    "",
				"token_expiry":    0,
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "folder_name",
					Label:       "ชื่อโฟลเดอร์สำหรับจัดเก็บใน Google Drive",
					Type:        "text",
					Default:     "School-CMS-Uploads",
					Required:    false,
					Description: "ชื่อโฟลเดอร์ที่จะให้ Filo Storage สร้างและจัดเก็บไฟล์ใน Google Drive ของคุณ",
				},
			},
		},
		{
			ID:          "storage-local",
			Name:        "Local Disk Storage (ระบบจัดเก็บในเครื่อง)",
			Category:    "storage",
			Description: "จัดเก็บไฟล์ภาพและเอกสารไว้ในเซิร์ฟเวอร์หลักของโรงเรียน (/uploads) รวดเร็วและไม่เสียค่าบริการภายนอก",
			Version:     "1.2.0",
			Author:      "School CMS Core",
			Icon:        "HardDrive",
			Installed:   true,
			Enabled:     true,
			Config: map[string]interface{}{
				"upload_dir":        "./uploads",
				"max_file_size_mb": 25,
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "upload_dir",
					Label:       "Upload Directory Path",
					Type:        "text",
					Default:     "./uploads",
					Required:    true,
					Description: "โฟลเดอร์สำหรับจัดเก็บไฟล์อัปโหลดในเซิร์ฟเวอร์ (ค่าเริ่มต้น: ./uploads)",
				},
				{
					Key:         "max_file_size_mb",
					Label:       "Max File Size (MB)",
					Type:        "number",
					Default:     "25",
					Required:    true,
					Description: "ขนาดไฟล์อัปโหลดสูงสุดต่อไฟล์ในหน่วยเมกะไบต์",
				},
			},
		},
		{
			ID:          "storage-r2",
			Name:        "Cloudflare R2 Object Storage",
			Category:    "storage",
			Description: "บริการจัดเก็บไฟล์บน Cloudflare R2 เร็วระดับโลก ไม่มีค่าทราฟฟิกดาวน์โหลด (Zero Egress Fees) รองรับ S3 API",
			Version:     "1.1.0",
			Author:      "Cloudflare / Community",
			Icon:        "Cloud",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"account_id":        "",
				"access_key_id":     "",
				"secret_access_key": "",
				"bucket_name":       "",
				"public_url_prefix": "",
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "account_id",
					Label:       "Cloudflare Account ID",
					Type:        "text",
					Required:    true,
					Description: "Account ID จากแดชบอร์ด Cloudflare เพื่อสร้าง Endpoint R2 อัตโนมัติ",
				},
				{
					Key:         "bucket_name",
					Label:       "R2 Bucket Name",
					Type:        "text",
					Required:    true,
					Placeholder: "school-media-bucket",
					Description: "ชื่อ Bucket บน Cloudflare R2 ที่สร้างไว้สำหรับโรงเรียน",
				},
				{
					Key:         "access_key_id",
					Label:       "Access Key ID",
					Type:        "text",
					Required:    true,
					Description: "R2 API Token Access Key ID",
				},
				{
					Key:         "secret_access_key",
					Label:       "Secret Access Key",
					Type:        "password",
					Required:    true,
					Description: "R2 API Token Secret Access Key (ระบบจะเข้ารหัสเก็บรักษาอย่างปลอดภัย)",
				},
				{
					Key:         "public_url_prefix",
					Label:       "Public URL / Custom Domain",
					Type:        "text",
					Required:    false,
					Placeholder: "https://cdn.myschool.ac.th หรือ https://pub-xxx.r2.dev",
					Description: "โดเมนสาธารณะหรือ R2.dev URL สำหรับแสดงรูปภาพไปยังผู้เข้าชม",
				},
			},
		},
		{
			ID:          "storage-s3",
			Name:        "Amazon S3 Object Storage",
			Category:    "storage",
			Description: "จัดเก็บไฟล์บน AWS Simple Storage Service (S3) มาตรฐานความปลอดภัยสูงระดับ Enterprise พร้อมเชื่อมต่อ CloudFront CDN",
			Version:     "1.0.2",
			Author:      "Amazon Web Services",
			Icon:        "Server",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"region":            "ap-southeast-1",
				"bucket_name":       "",
				"access_key_id":     "",
				"secret_access_key": "",
				"public_url_prefix": "",
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "region",
					Label:       "AWS Region",
					Type:        "text",
					Default:     "ap-southeast-1",
					Required:    true,
					Description: "AWS Region ที่สร้าง Bucket (เช่น ap-southeast-1 สำหรับสิงคโปร์)",
				},
				{
					Key:         "bucket_name",
					Label:       "S3 Bucket Name",
					Type:        "text",
					Required:    true,
					Placeholder: "school-media-s3",
					Description: "ชื่อ S3 Bucket",
				},
				{
					Key:         "access_key_id",
					Label:       "AWS Access Key ID",
					Type:        "text",
					Required:    true,
					Description: "IAM User Access Key ID ที่มีสิทธิ์ s3:PutObject และ s3:DeleteObject",
				},
				{
					Key:         "secret_access_key",
					Label:       "AWS Secret Access Key",
					Type:        "password",
					Required:    true,
					Description: "IAM User Secret Access Key",
				},
				{
					Key:         "public_url_prefix",
					Label:       "CloudFront / Public Domain",
					Type:        "text",
					Required:    false,
					Placeholder: "https://d1234.cloudfront.net",
					Description: "โดเมน CloudFront CDN หรือ S3 Website URL สำหรับเรียกดูไฟล์",
				},
			},
		},
		{
			ID:          "storage-minio",
			Name:        "MinIO Self-Hosted Storage",
			Category:    "storage",
			Description: "พื้นที่จัดเก็บไฟล์บน MinIO Server ภายในโรงเรียนหรือเครือข่ายส่วนตัว รองรับ S3 API เต็มรูปแบบ",
			Version:     "1.0.0",
			Author:      "MinIO Open Source",
			Icon:        "Database",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"endpoint":          "",
				"bucket_name":       "",
				"access_key_id":     "",
				"secret_access_key": "",
				"public_url_prefix": "",
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "endpoint",
					Label:       "MinIO Server Endpoint",
					Type:        "text",
					Required:    true,
					Placeholder: "https://minio.school.ac.th",
					Description: "URL ของเซิร์ฟเวอร์ MinIO",
				},
				{
					Key:         "bucket_name",
					Label:       "Bucket Name",
					Type:        "text",
					Required:    true,
					Placeholder: "school-uploads",
					Description: "ชื่อ Bucket บน MinIO",
				},
				{
					Key:         "access_key_id",
					Label:       "Access Key",
					Type:        "text",
					Required:    true,
					Description: "MinIO Access Key / Username",
				},
				{
					Key:         "secret_access_key",
					Label:       "Secret Key",
					Type:        "password",
					Required:    true,
					Description: "MinIO Secret Key / Password",
				},
				{
					Key:         "public_url_prefix",
					Label:       "Public Access URL",
					Type:        "text",
					Required:    false,
					Placeholder: "https://files.school.ac.th",
					Description: "URL สาธารณะสำหรับเข้าถึงไฟล์",
				},
			},
		},
		{
			ID:          "storage-google-drive",
			Name:        "Google Drive Storage (OAuth 2.0)",
			Category:    "storage",
			Description: "เชื่อมต่อพื้นที่จัดเก็บไฟล์เข้ากับบัญชี Google Drive ของผู้ใช้งานผ่าน OAuth 2.0 จัดเก็บรูปภาพและเอกสารลงใน Google Drive อัตโนมัติ",
			Version:     "1.2.0",
			Author:      "Google Drive Integration",
			Icon:        "HardDrive",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"client_id":       "",
				"client_secret":   "",
				"folder_name":     "School-CMS-Uploads",
				"folder_id":       "",
				"connected_email": "",
				"connected_name":  "",
				"refresh_token":   "",
				"access_token":    "",
				"token_expiry":    0,
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "client_id",
					Label:       "Google OAuth 2.0 Client ID",
					Type:        "text",
					Required:    true,
					Placeholder: "xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com",
					Description: "OAuth 2.0 Client ID จาก Google Cloud Console (APIs & Services > Credentials)",
				},
				{
					Key:         "client_secret",
					Label:       "Google OAuth 2.0 Client Secret",
					Type:        "password",
					Required:    true,
					Description: "OAuth 2.0 Client Secret จาก Google Cloud Console",
				},
				{
					Key:         "folder_name",
					Label:       "ชื่อโฟลเดอร์ใน Google Drive",
					Type:        "text",
					Default:     "School-CMS-Uploads",
					Required:    true,
					Description: "ชื่อโฟลเดอร์ที่จะให้ระบบสร้างและจัดเก็บไฟล์ใน Google Drive ของคุณ",
				},
				{
					Key:         "folder_id",
					Label:       "Folder ID (กำหนดเอง - ไม่บังคับ)",
					Type:        "text",
					Required:    false,
					Placeholder: "เว้นว่างไว้เพื่อให้ระบบค้นหาหรือสร้างให้อัตโนมัติ",
					Description: "Folder ID จาก URL โฟลเดอร์ใน Drive หากต้องการเจาะจงโฟลเดอร์ที่มีอยู่แล้ว",
				},
			},
		},
		{
			ID:          "analytics-google",
			Name:        "Google Analytics 4 & Meta Pixel",
			Category:    "analytics",
			Description: "วัดสถิติผู้เข้าชมเว็บไซต์โรงเรียนและประสิทธิภาพแคมเปญประชาสัมพันธ์ รองรับ GA4 Measurement ID และ Facebook Pixel",
			Version:     "1.1.0",
			Author:      "Google & Meta Integrations",
			Icon:        "Activity",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"ga_measurement_id": "",
				"meta_pixel_id":     "",
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "ga_measurement_id",
					Label:       "Google Analytics 4 Measurement ID",
					Type:        "text",
					Placeholder: "G-XXXXXXXXXX",
					Description: "Measurement ID จาก Google Analytics 4",
				},
				{
					Key:         "meta_pixel_id",
					Label:       "Meta (Facebook) Pixel ID",
					Type:        "text",
					Placeholder: "123456789012345",
					Description: "Pixel ID สำหรับการโฆษณาและติดตามผลกิจกรรมโรงเรียน",
				},
			},
		},
		{
			ID:          "seo-booster",
			Name:        "School OpenGraph & Educational Schema Booster",
			Category:    "seo",
			Description: "ปรับแต่ง EducationalOrganization Schema.org, OpenGraph Cards และ Twitter Cards สำหรับโรงเรียนอัตโนมัติเพื่อผลการค้นหาอันดับดีเยี่ยม",
			Version:     "1.0.5",
			Author:      "EdTech SEO",
			Icon:        "Sparkles",
			Installed:   false,
			Enabled:     false,
			Config: map[string]interface{}{
				"school_type":       "SecondarySchool",
				"school_code":       "1044012012",
				"educational_stage": "มัธยมศึกษาปีที่ 1-6",
			},
			ConfigSchema: []models.ExtensionFieldSchema{
				{
					Key:         "school_type",
					Label:       "ประเภทสถานศึกษา (Schema.org)",
					Type:        "text",
					Default:     "SecondarySchool",
					Description: "เช่น SecondarySchool, HighSchool, ElementarySchool",
				},
				{
					Key:         "school_code",
					Label:       "รหัสสถานศึกษา 10 หลัก",
					Type:        "text",
					Placeholder: "1044012012",
					Description: "รหัสประจำสถานศึกษาตามฐานข้อมูลกระทรวงศึกษาธิการ",
				},
				{
					Key:         "educational_stage",
					Label:       "ระดับการศึกษาที่เปิดสอน",
					Type:        "text",
					Default:     "มัธยมศึกษาปีที่ 1-6",
					Description: "ระบุระดับชั้นการศึกษา เช่น มัธยมศึกษาปีที่ 1-6",
				},
			},
		},
	}
}

const MaskedSecretPlaceholder = "••••••••••••"

func isSecretKey(key string) bool {
	lower := strings.ToLower(key)
	return strings.Contains(lower, "secret") ||
		strings.Contains(lower, "password") ||
		strings.Contains(lower, "key_id") == false && strings.Contains(lower, "key") ||
		strings.Contains(lower, "token")
}

func maskConfigSecrets(cfg map[string]interface{}) map[string]interface{} {
	masked := make(map[string]interface{}, len(cfg))
	for k, v := range cfg {
		if strVal, ok := v.(string); ok && strVal != "" && isSecretKey(k) {
			masked[k] = MaskedSecretPlaceholder
		} else {
			masked[k] = v
		}
	}
	return masked
}

// GetActiveStorageExtensionID returns the ID of currently active storage extension
func GetActiveStorageExtensionID() string {
	var setting models.Setting
	if err := db.DB.Where("key = ?", "active_storage_extension").First(&setting).Error; err == nil && setting.Value != "" {
		return setting.Value
	}
	return "storage-local"
}

// ListExtensions handles GET /api/v1/extensions
func ListExtensions(w http.ResponseWriter, r *http.Request) {
	// Query all installed extensions from DB
	var dbExts []models.Extension
	if err := db.DB.Find(&dbExts).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to load extensions: "+err.Error())
		return
	}

	dbExtMap := make(map[string]models.Extension, len(dbExts))
	for _, ext := range dbExts {
		dbExtMap[ext.ID] = ext
	}

	activeStorageID := GetActiveStorageExtensionID()
	catalog := DefaultExtensionCatalog()
	result := make([]models.ExtensionCatalogItem, 0, len(catalog)+len(dbExts))

	catalogIDs := make(map[string]bool)
	for _, item := range catalog {
		catalogIDs[item.ID] = true
		if dbExt, exists := dbExtMap[item.ID]; exists {
			item.Installed = dbExt.Installed
			item.Enabled = dbExt.Enabled
			item.CreatedAt = &dbExt.CreatedAt
			item.UpdatedAt = &dbExt.UpdatedAt

			// Merge config from DB
			if dbExt.Config != "" {
				var cfg map[string]interface{}
				if err := json.Unmarshal([]byte(dbExt.Config), &cfg); err == nil {
					// Mask secret fields
					item.Config = maskConfigSecrets(cfg)
				}
			}
		} else if item.ID == "storage-local" {
			// storage-local is always installed and enabled by default if not yet recorded
			item.Installed = true
			item.Enabled = true
		}

		item.IsActiveStorage = (item.Category == "storage" && item.ID == activeStorageID && item.Enabled)
		result = append(result, item)
	}

	// Add any custom extensions from DB that are not in default catalog
	for _, dbExt := range dbExts {
		if catalogIDs[dbExt.ID] {
			continue
		}

		var cfg map[string]interface{}
		if dbExt.Config != "" {
			_ = json.Unmarshal([]byte(dbExt.Config), &cfg)
		}

		var schema []models.ExtensionFieldSchema
		if dbExt.ConfigSchema != "" {
			_ = json.Unmarshal([]byte(dbExt.ConfigSchema), &schema)
		}

		item := models.ExtensionCatalogItem{
			ID:              dbExt.ID,
			Name:            dbExt.Name,
			Category:        dbExt.Category,
			Description:     dbExt.Description,
			Version:         dbExt.Version,
			Author:          dbExt.Author,
			Icon:            dbExt.Icon,
			Installed:       dbExt.Installed,
			Enabled:         dbExt.Enabled,
			IsActiveStorage: (dbExt.Category == "storage" && dbExt.ID == activeStorageID && dbExt.Enabled),
			Config:          maskConfigSecrets(cfg),
			ConfigSchema:    schema,
			CreatedAt:       &dbExt.CreatedAt,
			UpdatedAt:       &dbExt.UpdatedAt,
		}
		result = append(result, item)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"extensions":             result,
		"active_storage_engine": activeStorageID,
	})
}

// InstallExtension handles POST /api/v1/extensions/install
func InstallExtension(w http.ResponseWriter, r *http.Request) {
	var req models.ExtensionInstallRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.ID == "" && req.ManifestJSON == "" {
		WriteError(w, http.StatusBadRequest, "Extension ID or Manifest is required")
		return
	}

	// If ManifestJSON provided, parse custom extension
	if req.ManifestJSON != "" {
		var manifest models.ExtensionCatalogItem
		if err := json.Unmarshal([]byte(req.ManifestJSON), &manifest); err != nil {
			WriteError(w, http.StatusBadRequest, "Invalid manifest JSON: "+err.Error())
			return
		}
		req.ID = manifest.ID
		req.Name = manifest.Name
		req.Category = manifest.Category
		req.Description = manifest.Description
		req.Version = manifest.Version
		req.Author = manifest.Author
		req.Icon = manifest.Icon
		req.Config = manifest.Config
		req.ConfigSchema = manifest.ConfigSchema
	}

	// Check if already in DB
	var ext models.Extension
	err := db.DB.Where("id = ?", req.ID).First(&ext).Error

	if err == nil {
		// Existing extension - mark installed
		ext.Installed = true
		if req.Name != "" {
			ext.Name = req.Name
		}
		if req.Category != "" {
			ext.Category = req.Category
		}
		if req.Description != "" {
			ext.Description = req.Description
		}
		if req.Version != "" {
			ext.Version = req.Version
		}
		if req.Author != "" {
			ext.Author = req.Author
		}
		if req.Icon != "" {
			ext.Icon = req.Icon
		}
		if err := db.DB.Save(&ext).Error; err != nil {
			WriteError(w, http.StatusInternalServerError, "Failed to update extension: "+err.Error())
			return
		}
		WriteJSON(w, http.StatusOK, map[string]interface{}{
			"message":   "Extension installed successfully",
			"extension": ext,
		})
		return
	}

	// Search in default catalog if not custom
	catalog := DefaultExtensionCatalog()
	var catalogItem *models.ExtensionCatalogItem
	for i := range catalog {
		if catalog[i].ID == req.ID {
			catalogItem = &catalog[i]
			break
		}
	}

	if catalogItem != nil {
		cfgBytes, _ := json.Marshal(catalogItem.Config)
		schemaBytes, _ := json.Marshal(catalogItem.ConfigSchema)

		ext = models.Extension{
			ID:           catalogItem.ID,
			Name:         catalogItem.Name,
			Category:     catalogItem.Category,
			Description:  catalogItem.Description,
			Version:      catalogItem.Version,
			Author:       catalogItem.Author,
			Icon:         catalogItem.Icon,
			Installed:    true,
			Enabled:      false,
			Config:       string(cfgBytes),
			ConfigSchema: string(schemaBytes),
		}
	} else {
		// Custom extension
		if req.Name == "" {
			req.Name = req.ID
		}
		if req.Category == "" {
			req.Category = "utility"
		}
		if req.Icon == "" {
			req.Icon = "Puzzle"
		}
		cfgBytes, _ := json.Marshal(req.Config)
		schemaBytes, _ := json.Marshal(req.ConfigSchema)

		ext = models.Extension{
			ID:           req.ID,
			Name:         req.Name,
			Category:     req.Category,
			Description:  req.Description,
			Version:      req.Version,
			Author:       req.Author,
			Icon:         req.Icon,
			Installed:    true,
			Enabled:      false,
			Config:       string(cfgBytes),
			ConfigSchema: string(schemaBytes),
		}
	}

	if err := db.DB.Create(&ext).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to create extension record: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"message":   "Extension installed successfully",
		"extension": ext,
	})
}

// UninstallExtension handles POST /api/v1/extensions/{id}/uninstall
func UninstallExtension(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "Missing extension ID")
		return
	}

	if id == "storage-local" {
		WriteError(w, http.StatusBadRequest, "Local Disk Storage cannot be uninstalled as it is the core fallback storage engine")
		return
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", id).First(&ext).Error; err != nil {
		WriteError(w, http.StatusNotFound, "Extension not found")
		return
	}

	ext.Installed = false
	ext.Enabled = false
	if err := db.DB.Save(&ext).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to uninstall extension: "+err.Error())
		return
	}

	// If this was the active storage engine, revert back to local storage
	activeStorageID := GetActiveStorageExtensionID()
	if activeStorageID == id {
		_ = db.DB.Save(&models.Setting{Key: "active_storage_extension", Value: "storage-local"}).Error
		storage.InvalidateProviderCache()
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Extension uninstalled successfully",
		"id":      id,
	})
}

// ToggleExtension handles PUT /api/v1/extensions/{id}/toggle
func ToggleExtension(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "Missing extension ID")
		return
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", id).First(&ext).Error; err != nil {
		// If it's a default catalog item not yet in DB, check catalog
		catalog := DefaultExtensionCatalog()
		var found *models.ExtensionCatalogItem
		for _, item := range catalog {
			if item.ID == id {
				found = &item
				break
			}
		}
		if found == nil {
			WriteError(w, http.StatusNotFound, "Extension not found")
			return
		}
		// Create and install first
		cfgBytes, _ := json.Marshal(found.Config)
		schemaBytes, _ := json.Marshal(found.ConfigSchema)
		ext = models.Extension{
			ID:           found.ID,
			Name:         found.Name,
			Category:     found.Category,
			Description:  found.Description,
			Version:      found.Version,
			Author:       found.Author,
			Icon:         found.Icon,
			Installed:    true,
			Enabled:      false,
			Config:       string(cfgBytes),
			ConfigSchema: string(schemaBytes),
		}
		db.DB.Create(&ext)
	}

	if !ext.Installed {
		WriteError(w, http.StatusBadRequest, "Extension is not installed. Please install it first.")
		return
	}

	// Toggle enabled state
	newEnabled := !ext.Enabled

	// Special handling for storage extensions
	if ext.Category == "storage" {
		if newEnabled {
			// Disable any other storage extension so only one is active at a time
			_ = db.DB.Model(&models.Extension{}).
				Where("category = ? AND id != ?", "storage", ext.ID).
				Update("enabled", false).Error

			ext.Enabled = true
			if err := db.DB.Save(&ext).Error; err != nil {
				WriteError(w, http.StatusInternalServerError, "Failed to toggle extension: "+err.Error())
				return
			}

			// Set active storage setting
			_ = db.DB.Save(&models.Setting{Key: "active_storage_extension", Value: ext.ID}).Error
			storage.InvalidateProviderCache()

			WriteJSON(w, http.StatusOK, map[string]interface{}{
				"message":               fmt.Sprintf("เปิดใช้งานส่วนเสริม %s และตั้งเป็นระบบจัดเก็บไฟล์หลักเรียบร้อยแล้ว", ext.Name),
				"enabled":               true,
				"active_storage_engine": ext.ID,
			})
			return
		} else {
			// Disabling storage extension - revert active storage to storage-local
			ext.Enabled = false
			if err := db.DB.Save(&ext).Error; err != nil {
				WriteError(w, http.StatusInternalServerError, "Failed to toggle extension: "+err.Error())
				return
			}

			_ = db.DB.Save(&models.Setting{Key: "active_storage_extension", Value: "storage-local"}).Error
			_ = db.DB.Model(&models.Extension{}).Where("id = ?", "storage-local").Update("enabled", true).Error
			storage.InvalidateProviderCache()

			WriteJSON(w, http.StatusOK, map[string]interface{}{
				"message":               fmt.Sprintf("ปิดการใช้งาน %s ระบบกลับไปใช้ Local Disk Storage เรียบร้อยแล้ว", ext.Name),
				"enabled":               false,
				"active_storage_engine": "storage-local",
			})
			return
		}
	}

	// Non-storage extension toggle
	ext.Enabled = newEnabled
	if err := db.DB.Save(&ext).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to toggle extension: "+err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("Updated %s enabled status to %v", ext.Name, ext.Enabled),
		"enabled": ext.Enabled,
	})
}

// UpdateExtensionConfig handles PUT /api/v1/extensions/{id}/config
func UpdateExtensionConfig(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "Missing extension ID")
		return
	}

	var req models.ExtensionConfigUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", id).First(&ext).Error; err != nil {
		// If in default catalog, create entry
		catalog := DefaultExtensionCatalog()
		var found *models.ExtensionCatalogItem
		for _, item := range catalog {
			if item.ID == id {
				found = &item
				break
			}
		}
		if found == nil {
			WriteError(w, http.StatusNotFound, "Extension not found")
			return
		}
		schemaBytes, _ := json.Marshal(found.ConfigSchema)
		ext = models.Extension{
			ID:           found.ID,
			Name:         found.Name,
			Category:     found.Category,
			Description:  found.Description,
			Version:      found.Version,
			Author:       found.Author,
			Icon:         found.Icon,
			Installed:    true,
			Enabled:      false,
			Config:       "{}",
			ConfigSchema: string(schemaBytes),
		}
		db.DB.Create(&ext)
	}

	// Load existing config to preserve masked secrets
	var existingCfg map[string]interface{}
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &existingCfg)
	}
	if existingCfg == nil {
		existingCfg = make(map[string]interface{})
	}

	// Merge incoming config
	for k, v := range req.Config {
		if strVal, ok := v.(string); ok && strVal == MaskedSecretPlaceholder {
			// Value was not modified by admin, keep existing secret
			continue
		}
		existingCfg[k] = v
	}

	updatedConfigBytes, err := json.Marshal(existingCfg)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Failed to serialize config")
		return
	}

	ext.Config = string(updatedConfigBytes)
	if req.Enabled != nil {
		ext.Enabled = *req.Enabled
	}

	if err := db.DB.Save(&ext).Error; err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to save configuration: "+err.Error())
		return
	}

	// Invalidate cache if active storage provider config changed
	if ext.Category == "storage" {
		storage.InvalidateProviderCache()
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message":   "บันทึกการตั้งค่าส่วนเสริมเรียบร้อยแล้ว",
		"config":    maskConfigSecrets(existingCfg),
		"extension": ext,
	})
}

// TestExtension handles POST /api/v1/extensions/{id}/test
func TestExtension(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		WriteError(w, http.StatusBadRequest, "Missing extension ID")
		return
	}

	var req models.ExtensionTestRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Fetch existing configuration if available
	var ext models.Extension
	_ = db.DB.Where("id = ?", id).First(&ext).Error

	mergedCfg := make(map[string]interface{})
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &mergedCfg)
	}

	// Merge incoming test config
	for k, v := range req.Config {
		if strVal, ok := v.(string); ok && strVal == MaskedSecretPlaceholder {
			continue // keep existing secret
		}
		mergedCfg[k] = v
	}

	// Test storage provider connectivity
	provider, err := storage.CreateProviderFromConfig(id, mergedCfg)
	if err != nil {
		WriteJSON(w, http.StatusOK, models.ExtensionTestResponse{
			Success: false,
			Message: "ไม่สามารถสร้างการเชื่อมต่อได้: " + err.Error(),
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := provider.TestConnection(ctx); err != nil {
		WriteJSON(w, http.StatusOK, models.ExtensionTestResponse{
			Success: false,
			Message: fmt.Sprintf("ทดสอบการเชื่อมต่อไม่สำเร็จ: %v", err),
			Details: err.Error(),
		})
		return
	}

	WriteJSON(w, http.StatusOK, models.ExtensionTestResponse{
		Success: true,
		Message: fmt.Sprintf("ทดสอบการเชื่อมต่อ %s สำเร็จ! สามารถอ่านและบันทึกไฟล์ได้ปกติ", provider.Name()),
	})
}

// ==========================================
// Google Drive OAuth 2.0 Integration Handlers
// ==========================================

// GetGoogleDriveOAuthURL handles GET /api/v1/extensions/google-drive/oauth/url
func GetGoogleDriveOAuthURL(w http.ResponseWriter, r *http.Request) {
	extID := r.URL.Query().Get("ext_id")
	if extID == "" {
		extID = "storage-filo"
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", extID).First(&ext).Error; err != nil {
		if extID == "storage-filo" {
			_ = db.DB.Where("id = ?", "storage-google-drive").First(&ext).Error
		}
	}

	var cfg map[string]interface{}
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &cfg)
	}

	clientID := r.URL.Query().Get("client_id")
	if clientID == "" && cfg != nil {
		clientID, _ = cfg["client_id"].(string)
	}
	if clientID == "" {
		clientID = os.Getenv("GOOGLE_CLIENT_ID")
	}

	redirectURI := r.URL.Query().Get("redirect_uri")
	if redirectURI == "" {
		scheme := "http"
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		redirectURI = fmt.Sprintf("%s://%s/api/v1/extensions/google-drive/oauth/callback", scheme, r.Host)
	}

	// State preserves redirect URI and extension ID
	stateJSON, _ := json.Marshal(map[string]string{
		"redirect_uri": redirectURI,
		"ext_id":       extID,
	})
	state := base64.URLEncoding.EncodeToString(stateJSON)

	scope := "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
	authURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=consent&state=%s",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape(scope),
		url.QueryEscape(state),
	)

	WriteJSON(w, http.StatusOK, map[string]string{
		"auth_url":     authURL,
		"redirect_uri": redirectURI,
	})
}

// HandleGoogleDriveOAuthCallback handles GET /api/v1/extensions/google-drive/oauth/callback
func HandleGoogleDriveOAuthCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	errQuery := r.URL.Query().Get("error")

	if errQuery != "" || code == "" {
		renderOAuthResult(w, false, "เกิดข้อผิดพลาดในการยืนยันตัวตน Google: "+errQuery, "")
		return
	}

	rawState := r.URL.Query().Get("state")
	redirectURI := ""
	extID := "storage-filo"

	if stateBytes, err := base64.URLEncoding.DecodeString(rawState); err == nil {
		var stateObj map[string]string
		if err := json.Unmarshal(stateBytes, &stateObj); err == nil {
			redirectURI = stateObj["redirect_uri"]
			if stateObj["ext_id"] != "" {
				extID = stateObj["ext_id"]
			}
		} else {
			redirectURI = string(stateBytes)
		}
	}
	if redirectURI == "" {
		scheme := "http"
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		redirectURI = fmt.Sprintf("%s://%s/api/v1/extensions/google-drive/oauth/callback", scheme, r.Host)
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", extID).First(&ext).Error; err != nil {
		if err := db.DB.Where("id = ?", "storage-google-drive").First(&ext).Error; err != nil {
			ext = models.Extension{
				ID:        extID,
				Name:      "Filo Storage",
				Category:  "storage",
				Installed: true,
			}
		}
	}

	var cfg map[string]interface{}
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &cfg)
	}
	if cfg == nil {
		cfg = make(map[string]interface{})
	}

	clientID, _ := cfg["client_id"].(string)
	clientSecret, _ := cfg["client_secret"].(string)
	if clientID == "" {
		clientID = os.Getenv("GOOGLE_CLIENT_ID")
	}
	if clientSecret == "" {
		clientSecret = os.Getenv("GOOGLE_CLIENT_SECRET")
	}

	// 1. Exchange authorization code for access_token and refresh_token
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", clientID)
	form.Set("client_secret", clientSecret)
	form.Set("redirect_uri", redirectURI)
	form.Set("grant_type", "authorization_code")

	tokenResp, err := http.PostForm("https://oauth2.googleapis.com/token", form)
	if err != nil {
		renderOAuthResult(w, false, "ไม่สามารถเชื่อมต่อไปยังเซิร์ฟเวอร์ Google OAuth ได้: "+err.Error(), "")
		return
	}
	defer tokenResp.Body.Close()

	tokenBody, _ := io.ReadAll(tokenResp.Body)
	if tokenResp.StatusCode != http.StatusOK {
		renderOAuthResult(w, false, fmt.Sprintf("Google Token Exchange ล้มเหลว (HTTP %d): %s", tokenResp.StatusCode, string(tokenBody)), "")
		return
	}

	var tokenData struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
	}
	if err := json.Unmarshal(tokenBody, &tokenData); err != nil || tokenData.AccessToken == "" {
		renderOAuthResult(w, false, "ไม่สามารถอ่านข้อมูล Access Token จาก Google ได้", "")
		return
	}

	// 2. Fetch User Profile Info
	userInfoReq, _ := http.NewRequest(http.MethodGet, "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	userInfoReq.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)
	userResp, err := http.DefaultClient.Do(userInfoReq)

	var userEmail string
	var userName string
	if err == nil && userResp.StatusCode == http.StatusOK {
		var userProfile struct {
			Email string `json:"email"`
			Name  string `json:"name"`
		}
		if err := json.NewDecoder(userResp.Body).Decode(&userProfile); err == nil {
			userEmail = userProfile.Email
			userName = userProfile.Name
		}
		userResp.Body.Close()
	}

	// Update extension config
	cfg["access_token"] = tokenData.AccessToken
	if tokenData.RefreshToken != "" {
		cfg["refresh_token"] = tokenData.RefreshToken
	}
	if tokenData.ExpiresIn > 0 {
		cfg["token_expiry"] = time.Now().Add(time.Duration(tokenData.ExpiresIn) * time.Second).Unix()
	} else {
		cfg["token_expiry"] = time.Now().Add(55 * time.Minute).Unix()
	}
	if userEmail != "" {
		cfg["connected_email"] = userEmail
	}
	if userName != "" {
		cfg["connected_name"] = userName
	}

	// Automatically ensure target upload folder exists in user's Drive
	folderName, _ := cfg["folder_name"].(string)
	if folderName == "" {
		folderName = "School-CMS-Uploads"
		cfg["folder_name"] = folderName
	}

	tempProvider, err := storage.NewGoogleDriveProvider(cfg)
	if err == nil {
		if folderID, err := tempProvider.EnsureFolderID(r.Context(), tokenData.AccessToken); err == nil && folderID != "" {
			cfg["folder_id"] = folderID
		}
	}

	updatedCfgBytes, _ := json.Marshal(cfg)
	ext.Config = string(updatedCfgBytes)
	ext.Installed = true
	_ = db.DB.Save(&ext).Error

	storage.InvalidateProviderCache()

	renderOAuthResult(w, true, "เชื่อมต่อบัญชี Google Drive สำเร็จเรียบร้อยแล้ว!", userEmail)
}

// DisconnectGoogleDrive handles POST /api/v1/extensions/google-drive/disconnect
func DisconnectGoogleDrive(w http.ResponseWriter, r *http.Request) {
	extID := r.URL.Query().Get("ext_id")
	if extID == "" {
		extID = "storage-filo"
	}

	var ext models.Extension
	if err := db.DB.Where("id = ?", extID).First(&ext).Error; err != nil {
		if err := db.DB.Where("id = ?", "storage-google-drive").First(&ext).Error; err != nil {
			WriteError(w, http.StatusNotFound, "Extension not found")
			return
		}
	}

	var cfg map[string]interface{}
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &cfg)
	}
	if cfg == nil {
		cfg = make(map[string]interface{})
	}

	// Clear OAuth tokens and connected user info
	delete(cfg, "refresh_token")
	delete(cfg, "access_token")
	delete(cfg, "token_expiry")
	delete(cfg, "connected_email")
	delete(cfg, "connected_name")

	cfgBytes, _ := json.Marshal(cfg)
	ext.Config = string(cfgBytes)
	ext.Enabled = false
	_ = db.DB.Save(&ext).Error

	// If disconnected extension was active storage, revert to storage-local
	if GetActiveStorageExtensionID() == ext.ID {
		_ = db.DB.Save(&models.Setting{Key: "active_storage_extension", Value: "storage-local"}).Error
		_ = db.DB.Model(&models.Extension{}).Where("id = ?", "storage-local").Update("enabled", true).Error
	}

	storage.InvalidateProviderCache()

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"message":               "ยกเลิกการเชื่อมต่อบัญชี Google Drive สำเร็จ",
		"active_storage_engine": "storage-local",
	})
}

func renderOAuthResult(w http.ResponseWriter, success bool, message, email string) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	statusColor := "#10b981"
	statusTitle := "เชื่อมต่อ Google Drive สำเร็จ!"
	if !success {
		statusColor = "#ef4444"
		statusTitle = "การเชื่อมต่อล้มเหลว"
	}

	html := fmt.Sprintf(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>%s</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #09090b;
      color: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    h2 { margin: 0 0 12px; color: %s; font-size: 18px; }
    p { color: #a1a1aa; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
    .email-badge {
      display: inline-block;
      background: #27272a;
      border: 1px solid #3f3f46;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      color: #38bdf8;
      margin-bottom: 20px;
      font-weight: 600;
    }
    button {
      background: #27272a;
      color: #fafafa;
      border: 1px solid #3f3f46;
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 12px;
      cursor: pointer;
    }
    button:hover { background: #3f3f46; }
  </style>
</head>
<body>
  <div class="card">
    <h2>%s</h2>
    %s
    <p>%s</p>
    <button onclick="window.close()">ปิดหน้าต่างนี้</button>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: '%s',
        success: %t,
        email: '%s',
        message: '%s'
      }, '*');
    }
    setTimeout(function() {
      window.close();
    }, 2000);
  </script>
</body>
</html>`,
		statusTitle,
		statusColor,
		statusTitle,
		func() string {
			if email != "" {
				return fmt.Sprintf(`<div class="email-badge">บัญชี: %s</div>`, email)
			}
			return ""
		}(),
		message,
		"GOOGLE_DRIVE_OAUTH_SUCCESS",
		success,
		email,
		message,
	)

	_, _ = w.Write([]byte(html))
}
