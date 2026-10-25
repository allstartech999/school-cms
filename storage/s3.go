package storage

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

// S3Config holds the configuration for S3-compatible object storage
type S3Config struct {
	Endpoint        string // e.g. "https://<account_id>.r2.cloudflarestorage.com" or "https://s3.ap-southeast-1.amazonaws.com"
	Region          string // e.g. "auto" (R2) or "ap-southeast-1" (AWS)
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	PublicURLPrefix string // e.g. "https://pub-xxxx.r2.dev" or "https://cdn.school.ac.th"
}

// S3CompatibleProvider implements Provider for S3-compatible cloud storage
type S3CompatibleProvider struct {
	id     string
	name   string
	cfg    S3Config
	client *http.Client
}

// NewS3Provider creates a new S3-compatible storage provider
func NewS3Provider(id, name string, cfg S3Config) (*S3CompatibleProvider, error) {
	if cfg.Endpoint == "" && id == "storage-r2" {
		return nil, fmt.Errorf("endpoint or account_id is required for Cloudflare R2")
	}
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("bucket_name is required")
	}
	if cfg.AccessKeyID == "" {
		return nil, fmt.Errorf("access_key_id is required")
	}
	if cfg.SecretAccessKey == "" {
		return nil, fmt.Errorf("secret_access_key is required")
	}
	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}

	// Normalize endpoint URL
	if !strings.HasPrefix(cfg.Endpoint, "http://") && !strings.HasPrefix(cfg.Endpoint, "https://") {
		cfg.Endpoint = "https://" + cfg.Endpoint
	}
	cfg.Endpoint = strings.TrimRight(cfg.Endpoint, "/")

	return &S3CompatibleProvider{
		id:   id,
		name: name,
		cfg:  cfg,
		client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}, nil
}

func (p *S3CompatibleProvider) ID() string {
	return p.id
}

func (p *S3CompatibleProvider) Name() string {
	return p.name
}

// Save uploads a file to S3-compatible bucket
func (p *S3CompatibleProvider) Save(ctx context.Context, uniqueName string, r io.Reader, size int64, contentType string) (string, int64, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", 0, fmt.Errorf("failed to read file content: %w", err)
	}

	key := uniqueName
	reqURL := fmt.Sprintf("%s/%s/%s", p.cfg.Endpoint, p.cfg.Bucket, key)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, reqURL, bytes.NewReader(data))
	if err != nil {
		return "", 0, fmt.Errorf("failed to create PUT request: %w", err)
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}
	req.Header.Set("Content-Type", contentType)

	// Sign request with AWS SigV4
	p.signV4(req, data)

	resp, err := p.client.Do(req)
	if err != nil {
		return "", 0, fmt.Errorf("storage request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return "", 0, fmt.Errorf("storage upload rejected (HTTP %d): %s", resp.StatusCode, string(body))
	}

	// Determine public URL
	publicURL := ""
	if p.cfg.PublicURLPrefix != "" {
		prefix := strings.TrimRight(p.cfg.PublicURLPrefix, "/")
		publicURL = fmt.Sprintf("%s/%s", prefix, key)
	} else {
		// Fallback to endpoint/bucket/key
		publicURL = fmt.Sprintf("%s/%s/%s", p.cfg.Endpoint, p.cfg.Bucket, key)
	}

	return publicURL, int64(len(data)), nil
}

// Delete removes a file from S3-compatible storage
func (p *S3CompatibleProvider) Delete(ctx context.Context, fileURL string) error {
	key := path.Base(fileURL)
	if key == "" || key == "." || key == "/" {
		return nil
	}

	reqURL := fmt.Sprintf("%s/%s/%s", p.cfg.Endpoint, p.cfg.Bucket, key)
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, reqURL, nil)
	if err != nil {
		return err
	}

	p.signV4(req, nil)
	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// TestConnection writes and deletes a small test ping object to verify bucket read & write permissions
func (p *S3CompatibleProvider) TestConnection(ctx context.Context) error {
	testKey := fmt.Sprintf(".test_connection_%d.txt", time.Now().UnixNano())
	testPayload := []byte("school-cms storage connection check OK")

	// 1. Test Write (PUT)
	reqURL := fmt.Sprintf("%s/%s/%s", p.cfg.Endpoint, p.cfg.Bucket, testKey)
	putReq, err := http.NewRequestWithContext(ctx, http.MethodPut, reqURL, bytes.NewReader(testPayload))
	if err != nil {
		return fmt.Errorf("failed to construct test request: %w", err)
	}
	putReq.Header.Set("Content-Type", "text/plain")
	p.signV4(putReq, testPayload)

	putResp, err := p.client.Do(putReq)
	if err != nil {
		return fmt.Errorf("failed to contact storage endpoint %s: %w", p.cfg.Endpoint, err)
	}
	defer putResp.Body.Close()

	if putResp.StatusCode < 200 || putResp.StatusCode >= 300 {
		body, _ := io.ReadAll(putResp.Body)
		return fmt.Errorf("bucket write test rejected (HTTP %d): %s", putResp.StatusCode, string(body))
	}

	// 2. Clean up test object (DELETE)
	delReq, _ := http.NewRequestWithContext(ctx, http.MethodDelete, reqURL, nil)
	if delReq != nil {
		p.signV4(delReq, nil)
		if delResp, err := p.client.Do(delReq); err == nil {
			_ = delResp.Body.Close()
		}
	}

	return nil
}

// signV4 calculates and attaches AWS Signature Version 4 headers to the HTTP request
func (p *S3CompatibleProvider) signV4(req *http.Request, payload []byte) {
	now := time.Now().UTC()
	amzDate := now.Format("20060102T150405Z")
	dateStamp := now.Format("20060102")

	// Payload hash
	payloadHash := sha256Hex(payload)
	req.Header.Set("x-amz-date", amzDate)
	req.Header.Set("x-amz-content-sha256", payloadHash)

	u := req.URL
	host := u.Host
	if host == "" {
		host = req.Header.Get("Host")
	}

	// Canonical headers
	canonicalHeaders := fmt.Sprintf("host:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n",
		host, payloadHash, amzDate)
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"

	canonicalURI := u.EscapedPath()
	if canonicalURI == "" {
		canonicalURI = "/"
	}

	canonicalQuery := u.RawQuery

	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		req.Method,
		canonicalURI,
		canonicalQuery,
		canonicalHeaders,
		signedHeaders,
		payloadHash,
	)

	credentialScope := fmt.Sprintf("%s/%s/s3/aws4_request", dateStamp, p.cfg.Region)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\n%s",
		amzDate,
		credentialScope,
		sha256Hex([]byte(canonicalRequest)),
	)

	signingKey := getSignatureKey(p.cfg.SecretAccessKey, dateStamp, p.cfg.Region, "s3")
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	authHeader := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		p.cfg.AccessKeyID,
		credentialScope,
		signedHeaders,
		signature,
	)

	req.Header.Set("Authorization", authHeader)
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func hmacSHA256(key []byte, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func getSignatureKey(key, dateStamp, regionName, serviceName string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+key), []byte(dateStamp))
	kRegion := hmacSHA256(kDate, []byte(regionName))
	kService := hmacSHA256(kRegion, []byte(serviceName))
	kSigning := hmacSHA256(kService, []byte("aws4_request"))
	return kSigning
}

// BuildMockURL parses URL without error check helper
func parseURL(raw string) *url.URL {
	u, _ := url.Parse(raw)
	return u
}
