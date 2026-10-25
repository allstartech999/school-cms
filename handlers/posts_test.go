package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"school-cms/db"
	"testing"
)

func TestListPostsPaginationLogic(t *testing.T) {
	// Simple sanity test for query params parsing and headers
	req := httptest.NewRequest("GET", "/api/v1/posts?page=2&limit=5", nil)
	w := httptest.NewRecorder()

	// If DB is initialized in test environment
	if dbTest := testDBAvailable(); dbTest {
		ListPosts(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", w.Code)
		}
		if w.Header().Get("X-Current-Page") != "2" {
			t.Errorf("expected X-Current-Page header 2, got %s", w.Header().Get("X-Current-Page"))
		}
		if w.Header().Get("X-Page-Size") != "5" {
			t.Errorf("expected X-Page-Size header 5, got %s", w.Header().Get("X-Page-Size"))
		}

		var res struct {
			Data       []any `json:"data"`
			Pagination struct {
				Page       int   `json:"page"`
				Limit      int   `json:"limit"`
				Total      int64 `json:"total"`
				TotalPages int   `json:"total_pages"`
			} `json:"pagination"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
			t.Fatalf("failed to decode json: %v", err)
		}
		if res.Pagination.Page != 2 {
			t.Errorf("expected page 2, got %d", res.Pagination.Page)
		}
		if res.Pagination.Limit != 5 {
			t.Errorf("expected limit 5, got %d", res.Pagination.Limit)
		}
	}
}

func testDBAvailable() bool {
	if db.DB != nil {
		return true
	}
	_, err := db.InitTestDB()
	return err == nil
}
