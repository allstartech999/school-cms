package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"
)

// GoogleDriveProvider implements Provider for Google Drive via OAuth 2.0
type GoogleDriveProvider struct {
	clientID       string
	clientSecret   string
	refreshToken   string
	accessToken    string
	tokenExpiry    time.Time
	folderID       string
	folderName     string
	connectedEmail string
	tokenMu        sync.Mutex
	client         *http.Client
}

// NewGoogleDriveProvider initializes a GoogleDriveProvider from extension config
func NewGoogleDriveProvider(cfg map[string]interface{}) (*GoogleDriveProvider, error) {
	clientID, _ := cfg["client_id"].(string)
	clientSecret, _ := cfg["client_secret"].(string)
	if clientID == "" {
		clientID = os.Getenv("GOOGLE_CLIENT_ID")
	}
	if clientSecret == "" {
		clientSecret = os.Getenv("GOOGLE_CLIENT_SECRET")
	}
	refreshToken, _ := cfg["refresh_token"].(string)
	accessToken, _ := cfg["access_token"].(string)
	folderID, _ := cfg["folder_id"].(string)
	folderName, _ := cfg["folder_name"].(string)
	connectedEmail, _ := cfg["connected_email"].(string)

	if folderName == "" {
		folderName = "School-CMS-Uploads"
	}

	var expiry time.Time
	if exp, ok := cfg["token_expiry"].(float64); ok && exp > 0 {
		expiry = time.Unix(int64(exp), 0)
	}

	if refreshToken == "" {
		return nil, fmt.Errorf("Google Drive ยังไม่ได้เชื่อมต่อบัญชีผ่าน OAuth 2.0 (กรุณากด 'เชื่อมต่อ Google Drive' ในหน้าตั้งค่า)")
	}

	return &GoogleDriveProvider{
		clientID:       clientID,
		clientSecret:   clientSecret,
		refreshToken:   refreshToken,
		accessToken:    accessToken,
		tokenExpiry:    expiry,
		folderID:       folderID,
		folderName:     folderName,
		connectedEmail: connectedEmail,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}, nil
}

func (p *GoogleDriveProvider) ID() string {
	return "storage-google-drive"
}

func (p *GoogleDriveProvider) Name() string {
	return "Google Drive Storage (OAuth 2.0)"
}

// EnsureValidAccessToken refreshes access_token if expired
func (p *GoogleDriveProvider) EnsureValidAccessToken(ctx context.Context) (string, error) {
	p.tokenMu.Lock()
	defer p.tokenMu.Unlock()

	// If token is still valid for at least 60 seconds, reuse it
	if p.accessToken != "" && time.Now().Before(p.tokenExpiry.Add(-60*time.Second)) {
		return p.accessToken, nil
	}

	if p.refreshToken == "" {
		return "", fmt.Errorf("refresh_token is missing. Please re-authenticate Google Drive OAuth")
	}

	form := url.Values{}
	form.Set("client_id", p.clientID)
	form.Set("client_secret", p.clientSecret)
	form.Set("refresh_token", p.refreshToken)
	form.Set("grant_type", "refresh_token")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://oauth2.googleapis.com/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to refresh Google OAuth token: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Google OAuth token refresh failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
		TokenType   string `json:"token_type"`
	}
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", fmt.Errorf("failed to parse Google token response: %w", err)
	}

	p.accessToken = tokenResp.AccessToken
	if tokenResp.ExpiresIn > 0 {
		p.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	} else {
		p.tokenExpiry = time.Now().Add(55 * time.Minute)
	}

	return p.accessToken, nil
}

// EnsureFolderID checks if target folder exists or creates it
func (p *GoogleDriveProvider) EnsureFolderID(ctx context.Context, token string) (string, error) {
	if p.folderID != "" {
		return p.folderID, nil
	}

	// 1. Search for existing folder by name
	escapedName := strings.ReplaceAll(p.folderName, "'", "\\'")
	query := fmt.Sprintf("name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false", escapedName)
	searchURL := fmt.Sprintf("https://www.googleapis.com/drive/v3/files?q=%s&fields=files(id,name)", url.QueryEscape(query))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, searchURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := p.client.Do(req)
	if err == nil && resp.StatusCode == http.StatusOK {
		var listResp struct {
			Files []struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"files"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&listResp); err == nil && len(listResp.Files) > 0 {
			resp.Body.Close()
			p.folderID = listResp.Files[0].ID
			return p.folderID, nil
		}
		resp.Body.Close()
	}

	// 2. Create folder if not found
	createPayload, _ := json.Marshal(map[string]interface{}{
		"name":     p.folderName,
		"mimeType": "application/vnd.google-apps.folder",
	})
	createReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://www.googleapis.com/drive/v3/files", bytes.NewReader(createPayload))
	if err != nil {
		return "", err
	}
	createReq.Header.Set("Authorization", "Bearer "+token)
	createReq.Header.Set("Content-Type", "application/json")

	createResp, err := p.client.Do(createReq)
	if err != nil {
		return "", fmt.Errorf("failed to create Google Drive folder: %w", err)
	}
	defer createResp.Body.Close()

	if createResp.StatusCode < 200 || createResp.StatusCode >= 300 {
		b, _ := io.ReadAll(createResp.Body)
		return "", fmt.Errorf("failed to create Google Drive folder (HTTP %d): %s", createResp.StatusCode, string(b))
	}

	var created struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(createResp.Body).Decode(&created); err != nil || created.ID == "" {
		return "", fmt.Errorf("failed to parse created folder response")
	}

	p.folderID = created.ID
	return p.folderID, nil
}

// Save uploads a file to user's Google Drive via multipart upload
func (p *GoogleDriveProvider) Save(ctx context.Context, uniqueName string, r io.Reader, size int64, contentType string) (string, int64, error) {
	token, err := p.EnsureValidAccessToken(ctx)
	if err != nil {
		return "", 0, fmt.Errorf("Google Drive authentication failed: %w", err)
	}

	folderID, err := p.EnsureFolderID(ctx, token)
	if err != nil {
		return "", 0, fmt.Errorf("failed to locate or create Drive folder: %w", err)
	}

	data, err := io.ReadAll(r)
	if err != nil {
		return "", 0, fmt.Errorf("failed to read upload payload: %w", err)
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Build multipart/related upload payload
	bodyBuf := &bytes.Buffer{}
	writer := multipart.NewWriter(bodyBuf)

	// Part 1: Metadata JSON
	metaHeader := make(textproto.MIMEHeader)
	metaHeader.Set("Content-Type", "application/json; charset=UTF-8")
	metaPart, err := writer.CreatePart(metaHeader)
	if err != nil {
		return "", 0, err
	}

	metadata := map[string]interface{}{
		"name": uniqueName,
	}
	if folderID != "" {
		metadata["parents"] = []string{folderID}
	}
	_ = json.NewEncoder(metaPart).Encode(metadata)

	// Part 2: File content
	fileHeader := make(textproto.MIMEHeader)
	fileHeader.Set("Content-Type", contentType)
	filePart, err := writer.CreatePart(fileHeader)
	if err != nil {
		return "", 0, err
	}
	_, _ = filePart.Write(data)
	_ = writer.Close()

	uploadURL := "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, uploadURL, bodyBuf)
	if err != nil {
		return "", 0, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "multipart/related; boundary="+writer.Boundary())

	resp, err := p.client.Do(req)
	if err != nil {
		return "", 0, fmt.Errorf("Google Drive upload request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", 0, fmt.Errorf("Google Drive upload failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var uploadResp struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	if err := json.Unmarshal(respBody, &uploadResp); err != nil || uploadResp.ID == "" {
		return "", 0, fmt.Errorf("invalid upload response from Google Drive")
	}

	// Make the file public for viewing on website
	_ = p.makeFilePublic(ctx, token, uploadResp.ID)

	// Use Google UserContent direct CDN URL for fast image delivery
	publicURL := fmt.Sprintf("https://lh3.googleusercontent.com/d/%s", uploadResp.ID)
	return publicURL, int64(len(data)), nil
}

func (p *GoogleDriveProvider) makeFilePublic(ctx context.Context, token, fileID string) error {
	permURL := fmt.Sprintf("https://www.googleapis.com/drive/v3/files/%s/permissions", fileID)
	payload := []byte(`{"role":"reader","type":"anyone"}`)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, permURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

var driveIDRegex = regexp.MustCompile(`/d/([a-zA-Z0-9_-]+)`)

func (p *GoogleDriveProvider) Delete(ctx context.Context, fileURL string) error {
	// Extract Google Drive file ID
	var fileID string
	matches := driveIDRegex.FindStringSubmatch(fileURL)
	if len(matches) > 1 {
		fileID = matches[1]
	} else if strings.Contains(fileURL, "id=") {
		u, err := url.Parse(fileURL)
		if err == nil {
			fileID = u.Query().Get("id")
		}
	}

	if fileID == "" {
		return nil
	}

	token, err := p.EnsureValidAccessToken(ctx)
	if err != nil {
		return err
	}

	deleteURL := fmt.Sprintf("https://www.googleapis.com/drive/v3/files/%s", fileID)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, deleteURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// TestConnection verifies access token and queries Drive about/user information
func (p *GoogleDriveProvider) TestConnection(ctx context.Context) error {
	token, err := p.EnsureValidAccessToken(ctx)
	if err != nil {
		return fmt.Errorf("การยืนยันตัวตน Google Drive ล้มเหลว: %w", err)
	}

	// Query About endpoint to verify API permissions
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/drive/v3/about?fields=user,storageQuota", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("ไม่สามารถติดต่อ Google Drive API ได้: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Google Drive API ตอบกลับข้อผิดพลาด (HTTP %d): %s", resp.StatusCode, string(b))
	}

	return nil
}
