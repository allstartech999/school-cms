package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"school-cms/db"
	"school-cms/models"
	"sync"
)

// Provider defines the interface for media file storage engines
type Provider interface {
	ID() string
	Name() string
	Save(ctx context.Context, uniqueName string, r io.Reader, size int64, contentType string) (publicURL string, writtenSize int64, err error)
	Delete(ctx context.Context, fileURL string) error
	TestConnection(ctx context.Context) error
}

var (
	activeProviderLock sync.RWMutex
	cachedProvider     Provider
)

// InvalidateProviderCache clears the cached storage provider
func InvalidateProviderCache() {
	activeProviderLock.Lock()
	defer activeProviderLock.Unlock()
	cachedProvider = nil
}

// GetActiveProvider returns the currently active storage provider.
// Defaults to LocalStorageProvider if no external storage extension is enabled.
func GetActiveProvider() Provider {
	activeProviderLock.RLock()
	if cachedProvider != nil {
		p := cachedProvider
		activeProviderLock.RUnlock()
		return p
	}
	activeProviderLock.RUnlock()

	activeProviderLock.Lock()
	defer activeProviderLock.Unlock()

	// Double check after acquiring write lock
	if cachedProvider != nil {
		return cachedProvider
	}

	p := resolveActiveProvider()
	cachedProvider = p
	return p
}

func resolveActiveProvider() Provider {
	if db.DB == nil {
		return NewLocalStorage()
	}

	// 1. Check setting "active_storage_extension"
	var setting models.Setting
	activeExtID := "storage-local"
	if err := db.DB.Where("key = ?", "active_storage_extension").First(&setting).Error; err == nil && setting.Value != "" {
		activeExtID = setting.Value
	}

	if activeExtID == "storage-local" || activeExtID == "" {
		return NewLocalStorage()
	}

	// 2. Fetch the extension configuration
	var ext models.Extension
	if err := db.DB.Where("id = ? AND installed = true AND enabled = true", activeExtID).First(&ext).Error; err != nil {
		// Fallback to local storage if extension not found or disabled
		return NewLocalStorage()
	}

	var cfg map[string]interface{}
	if ext.Config != "" {
		_ = json.Unmarshal([]byte(ext.Config), &cfg)
	}

	provider, err := CreateProviderFromConfig(ext.ID, cfg)
	if err != nil {
		log.Printf("[STORAGE] Failed to initialize provider %s: %v, falling back to local storage", ext.ID, err)
		return NewLocalStorage()
	}

	return provider
}

// CreateProviderFromConfig creates an instance of a storage provider from configuration map
func CreateProviderFromConfig(id string, cfg map[string]interface{}) (Provider, error) {
	switch id {
	case "storage-local":
		uploadDir := "./uploads"
		if d, ok := cfg["upload_dir"].(string); ok && d != "" {
			uploadDir = d
		}
		return &LocalStorageProvider{baseDir: uploadDir}, nil

	case "storage-r2":
		accountID, _ := cfg["account_id"].(string)
		accessKey, _ := cfg["access_key_id"].(string)
		secretKey, _ := cfg["secret_access_key"].(string)
		bucket, _ := cfg["bucket_name"].(string)
		publicURL, _ := cfg["public_url_prefix"].(string)

		endpoint := ""
		if accountID != "" {
			endpoint = fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID)
		}
		if ep, ok := cfg["endpoint"].(string); ok && ep != "" {
			endpoint = ep
		}

		return NewS3Provider("storage-r2", "Cloudflare R2 Storage", S3Config{
			Endpoint:        endpoint,
			Region:          "auto",
			Bucket:          bucket,
			AccessKeyID:     accessKey,
			SecretAccessKey: secretKey,
			PublicURLPrefix: publicURL,
		})

	case "storage-s3":
		region, _ := cfg["region"].(string)
		if region == "" {
			region = "ap-southeast-1"
		}
		accessKey, _ := cfg["access_key_id"].(string)
		secretKey, _ := cfg["secret_access_key"].(string)
		bucket, _ := cfg["bucket_name"].(string)
		publicURL, _ := cfg["public_url_prefix"].(string)
		endpoint, _ := cfg["endpoint"].(string)
		if endpoint == "" {
			endpoint = fmt.Sprintf("https://s3.%s.amazonaws.com", region)
		}

		return NewS3Provider("storage-s3", "Amazon S3 Storage", S3Config{
			Endpoint:        endpoint,
			Region:          region,
			Bucket:          bucket,
			AccessKeyID:     accessKey,
			SecretAccessKey: secretKey,
			PublicURLPrefix: publicURL,
		})

	case "storage-minio":
		endpoint, _ := cfg["endpoint"].(string)
		accessKey, _ := cfg["access_key_id"].(string)
		secretKey, _ := cfg["secret_access_key"].(string)
		bucket, _ := cfg["bucket_name"].(string)
		publicURL, _ := cfg["public_url_prefix"].(string)

		return NewS3Provider("storage-minio", "MinIO Object Storage", S3Config{
			Endpoint:        endpoint,
			Region:          "us-east-1",
			Bucket:          bucket,
			AccessKeyID:     accessKey,
			SecretAccessKey: secretKey,
			PublicURLPrefix: publicURL,
		})

	case "storage-filo":
		return NewFiloStorageProvider(cfg)

	case "storage-google-drive":
		return NewGoogleDriveProvider(cfg)

	default:
		return nil, fmt.Errorf("unknown storage provider ID: %s", id)
	}
}
