package storage

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// LocalStorageProvider stores files on the local filesystem
type LocalStorageProvider struct {
	baseDir string
}

// NewLocalStorage returns a new LocalStorageProvider instance
func NewLocalStorage() *LocalStorageProvider {
	return &LocalStorageProvider{baseDir: "./uploads"}
}

func (l *LocalStorageProvider) ID() string {
	return "storage-local"
}

func (l *LocalStorageProvider) Name() string {
	return "Local Disk Storage"
}

func (l *LocalStorageProvider) ensureSubDir() (string, error) {
	now := time.Now()
	subDir := fmt.Sprintf("%d/%02d", now.Year(), now.Month())
	targetDir := filepath.Join(l.baseDir, subDir)
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory %s: %w", targetDir, err)
	}
	return subDir, nil
}

func (l *LocalStorageProvider) Save(ctx context.Context, uniqueName string, r io.Reader, size int64, contentType string) (string, int64, error) {
	subDir, err := l.ensureSubDir()
	if err != nil {
		return "", 0, err
	}

	diskPath := filepath.Join(l.baseDir, subDir, uniqueName)
	dst, err := os.Create(diskPath)
	if err != nil {
		return "", 0, fmt.Errorf("failed to create local file: %w", err)
	}
	defer dst.Close()

	written, err := io.Copy(dst, r)
	if err != nil {
		_ = os.Remove(diskPath)
		return "", 0, fmt.Errorf("failed to write file content: %w", err)
	}

	publicURL := fmt.Sprintf("/uploads/%s/%s", filepath.ToSlash(subDir), uniqueName)
	return publicURL, written, nil
}

func (l *LocalStorageProvider) Delete(ctx context.Context, fileURL string) error {
	if !strings.HasPrefix(fileURL, "/uploads/") {
		return nil
	}
	relPath := strings.TrimPrefix(fileURL, "/uploads/")
	diskPath := filepath.Join(l.baseDir, filepath.FromSlash(relPath))
	_ = os.Remove(diskPath)
	return nil
}

func (l *LocalStorageProvider) TestConnection(ctx context.Context) error {
	if err := os.MkdirAll(l.baseDir, 0755); err != nil {
		return fmt.Errorf("local upload base directory %s is not accessible: %w", l.baseDir, err)
	}

	testFile := filepath.Join(l.baseDir, fmt.Sprintf(".test_write_%d", time.Now().UnixNano()))
	if err := os.WriteFile(testFile, []byte("ok"), 0644); err != nil {
		return fmt.Errorf("failed to write test file in %s: %w", l.baseDir, err)
	}
	_ = os.Remove(testFile)
	return nil
}
