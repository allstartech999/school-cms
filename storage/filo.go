package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"time"
)

// FiloStorageProvider integrates with Filo Storage Service or direct Google Drive
type FiloStorageProvider struct {
	endpoint      string
	apiKey        string
	projectKey    string
	gdrive        *GoogleDriveProvider
	client        *http.Client
}

// NewFiloStorageProvider creates a new FiloStorageProvider instance
func NewFiloStorageProvider(cfg map[string]interface{}) (Provider, error) {
	endpoint, _ := cfg["filo_endpoint"].(string)
	apiKey, _ := cfg["filo_api_key"].(string)
	projectKey, _ := cfg["filo_project_key"].(string)
	if projectKey == "" {
		projectKey = "school-cms"
	}

	endpoint = strings.TrimRight(endpoint, "/")

	// If Filo Service API Key is provided, use Filo Storage Microservice
	if apiKey != "" && endpoint != "" {
		return &FiloStorageProvider{
			endpoint:   endpoint,
			apiKey:     apiKey,
			projectKey: projectKey,
			client: &http.Client{
				Timeout: 60 * time.Second,
			},
		}, nil
	}

	// Otherwise, fallback to Google Drive OAuth provider inside Filo Storage
	gdriveProvider, err := NewGoogleDriveProvider(cfg)
	if err != nil {
		return nil, fmt.Errorf("กรุณากำหนดค่า Filo Storage Service API Key หรือกดเชื่อมต่อบัญชี Google Drive ในการตั้งค่าส่วนเสริม: %w", err)
	}

	return &FiloStorageProvider{
		endpoint:   endpoint,
		apiKey:     apiKey,
		projectKey: projectKey,
		gdrive:     gdriveProvider,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}, nil
}

func (p *FiloStorageProvider) ID() string {
	return "storage-filo"
}

func (p *FiloStorageProvider) Name() string {
	return "Filo Storage"
}

// Save uploads a file to Filo Storage Service or Google Drive
func (p *FiloStorageProvider) Save(ctx context.Context, uniqueName string, r io.Reader, size int64, contentType string) (string, int64, error) {
	// If connecting to Filo Storage Service endpoint
	if p.apiKey != "" && p.endpoint != "" {
		bodyBuf := &bytes.Buffer{}
		writer := multipart.NewWriter(bodyBuf)

		_ = writer.WriteField("owner_id", "school-admin")
		_ = writer.WriteField("path", "school-cms/media")

		part, err := writer.CreateFormFile("file", uniqueName)
		if err != nil {
			return "", 0, fmt.Errorf("failed to create multipart form file: %w", err)
		}

		data, err := io.ReadAll(r)
		if err != nil {
			return "", 0, fmt.Errorf("failed to read file content: %w", err)
		}
		_, _ = part.Write(data)
		_ = writer.Close()

		uploadURL := fmt.Sprintf("%s/api/v1/files", p.endpoint)
		req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, bodyBuf)
		if err != nil {
			return "", 0, err
		}
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("X-API-Key", p.apiKey)

		resp, err := p.client.Do(req)
		if err != nil {
			return "", 0, fmt.Errorf("failed to call Filo Storage Service at %s: %w", p.endpoint, err)
		}
		defer resp.Body.Close()

		respBytes, _ := io.ReadAll(resp.Body)
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return "", 0, fmt.Errorf("Filo Storage upload rejected (HTTP %d): %s", resp.StatusCode, string(respBytes))
		}

		var filoResp struct {
			ID      string `json:"id"`
			URL     string `json:"url"`
			ViewURL string `json:"view_url"`
		}
		if err := json.Unmarshal(respBytes, &filoResp); err != nil {
			return "", 0, fmt.Errorf("failed to parse Filo Storage upload response: %w", err)
		}

		publicURL := filoResp.ViewURL
		if publicURL == "" {
			publicURL = filoResp.URL
		}
		return publicURL, int64(len(data)), nil
	}

	// Direct Google Drive upload via Filo Storage integration
	if p.gdrive != nil {
		return p.gdrive.Save(ctx, uniqueName, r, size, contentType)
	}

	return "", 0, fmt.Errorf("Filo Storage is not configured with an API Key or Google Drive OAuth connection")
}

func (p *FiloStorageProvider) Delete(ctx context.Context, fileURL string) error {
	if p.apiKey != "" && p.endpoint != "" {
		// Filo file deletion
		parts := strings.Split(fileURL, "/")
		fileID := parts[len(parts)-1]
		if fileID != "" && fileID != "view" {
			reqURL := fmt.Sprintf("%s/api/v1/files/%s", p.endpoint, fileID)
			req, _ := http.NewRequestWithContext(ctx, http.MethodDelete, reqURL, nil)
			if req != nil {
				req.Header.Set("X-API-Key", p.apiKey)
				_, _ = p.client.Do(req)
			}
		}
		return nil
	}

	if p.gdrive != nil {
		return p.gdrive.Delete(ctx, fileURL)
	}

	return nil
}

func (p *FiloStorageProvider) TestConnection(ctx context.Context) error {
	if p.apiKey != "" && p.endpoint != "" {
		reqURL := fmt.Sprintf("%s/api/v1/files?limit=1", p.endpoint)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
		if err != nil {
			return err
		}
		req.Header.Set("X-API-Key", p.apiKey)

		resp, err := p.client.Do(req)
		if err != nil {
			return fmt.Errorf("ไม่สามารถติดต่อ Filo Storage Service ที่ %s ได้: %w", p.endpoint, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			return fmt.Errorf("Filo Storage Service ปฏิเสธการเข้าถึง: API Key ไม่ถูกต้อง")
		}
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			body, _ := io.ReadAll(resp.Body)
			return fmt.Errorf("Filo Storage Service ตอบกลับข้อผิดพลาด (HTTP %d): %s", resp.StatusCode, string(body))
		}
		return nil
	}

	if p.gdrive != nil {
		return p.gdrive.TestConnection(ctx)
	}

	return fmt.Errorf("ยังไม่ได้ระบุ API Key ของ Filo Storage หรือยังไม่ได้เชื่อมต่อ Google Drive")
}
