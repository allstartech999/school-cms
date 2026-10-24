package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInjectMetaTags(t *testing.T) {
	rawHTML := []byte(`<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>Old Title</title>
</head>
<body>
  <h1>Hello</h1>
</body>
</html>`)

	meta := PageMeta{
		Title:                  "ข่าวประชาสัมพันธ์ใหม่ | โรงเรียนโพนงามพิทยานุกูล",
		Description:            "รายละเอียดข่าวประชาสัมพันธ์กิจกรรมโรงเรียน",
		Keywords:               "ข่าวสาร, กิจกรรม, โพนงาม",
		CanonicalURL:           "https://ppks.ac.th/posts/42",
		OgType:                 "article",
		OgImage:                "https://ppks.ac.th/uploads/banner.jpg",
		SiteName:               "โรงเรียนโพนงามพิทยานุกูล",
		GoogleSiteVerification: "google-test-token-12345",
		JSONLD:                 `{"@context":"https://schema.org","@type":"NewsArticle","headline":"ข่าวประชาสัมพันธ์ใหม่"}`,
	}

	result := string(InjectMetaTags(rawHTML, meta))

	// Verify title was replaced
	if !strings.Contains(result, "<title>ข่าวประชาสัมพันธ์ใหม่ | โรงเรียนโพนงามพิทยานุกูล</title>") {
		t.Errorf("Expected title replacement, got: %s", result)
	}
	if strings.Contains(result, "Old Title") {
		t.Errorf("Old title was not replaced")
	}

	// Verify meta description and keywords
	if !strings.Contains(result, `<meta name="description" content="รายละเอียดข่าวประชาสัมพันธ์กิจกรรมโรงเรียน" />`) {
		t.Errorf("Meta description missing")
	}
	if !strings.Contains(result, `<meta name="keywords" content="ข่าวสาร, กิจกรรม, โพนงาม" />`) {
		t.Errorf("Meta keywords missing")
	}

	// Verify Canonical Link
	if !strings.Contains(result, `<link rel="canonical" href="https://ppks.ac.th/posts/42" />`) {
		t.Errorf("Canonical link missing")
	}

	// Verify Open Graph tags
	if !strings.Contains(result, `<meta property="og:type" content="article" />`) {
		t.Errorf("og:type missing")
	}
	if !strings.Contains(result, `<meta property="og:title" content="ข่าวประชาสัมพันธ์ใหม่ | โรงเรียนโพนงามพิทยานุกูล" />`) {
		t.Errorf("og:title missing")
	}
	if !strings.Contains(result, `<meta property="og:image" content="https://ppks.ac.th/uploads/banner.jpg" />`) {
		t.Errorf("og:image missing")
	}
	if !strings.Contains(result, `<meta property="og:url" content="https://ppks.ac.th/posts/42" />`) {
		t.Errorf("og:url missing")
	}

	// Verify Twitter card
	if !strings.Contains(result, `<meta name="twitter:card" content="summary_large_image" />`) {
		t.Errorf("twitter:card missing")
	}

	// Verify Google verification
	if !strings.Contains(result, `<meta name="google-site-verification" content="google-test-token-12345" />`) {
		t.Errorf("google-site-verification missing")
	}

	// Verify JSON-LD Structured Data
	if !strings.Contains(result, `<script type="application/ld+json">`) || !strings.Contains(result, `NewsArticle`) {
		t.Errorf("JSON-LD missing or incorrect")
	}
}

func TestGetRobotsTxt(t *testing.T) {
	req := httptest.NewRequest("GET", "https://ppks.ac.th/robots.txt", nil)
	w := httptest.NewRecorder()

	GetRobotsTxt(w, req)
	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "text/plain") {
		t.Errorf("Expected text/plain content type, got: %s", contentType)
	}

	body := w.Body.String()
	if !strings.Contains(body, "User-agent: *") {
		t.Errorf("User-agent wildcard missing in robots.txt")
	}
	if !strings.Contains(body, "Disallow: /admin") {
		t.Errorf("Admin disallow directive missing in robots.txt")
	}
	if !strings.Contains(body, "Sitemap: https://ppks.ac.th/sitemap.xml") {
		t.Errorf("Sitemap directive missing or wrong URL: %s", body)
	}
}

func TestCleanText(t *testing.T) {
	htmlInput := "<p>นี่คือ <strong>ข้อความทดสอบ</strong> &amp; &quot;Active Learning&quot; &nbsp;&nbsp; ช่องว่างเกิน</p>"
	cleaned := CleanText(htmlInput, 60)
	if strings.Contains(cleaned, "<p>") || strings.Contains(cleaned, "<strong>") {
		t.Errorf("HTML tags not stripped: %s", cleaned)
	}
	if strings.Contains(cleaned, "&amp;") || strings.Contains(cleaned, "&quot;") || strings.Contains(cleaned, "&nbsp;") {
		t.Errorf("HTML entities were not unescaped in CleanText: %s", cleaned)
	}
	if !strings.Contains(cleaned, `"Active Learning"`) {
		t.Errorf("Expected unescaped quotes in CleanText, got: %s", cleaned)
	}
}

func TestToAbsoluteURL(t *testing.T) {
	baseURL := "https://example.com"
	if ToAbsoluteURL(baseURL, "/uploads/photo.jpg") != "https://example.com/uploads/photo.jpg" {
		t.Errorf("Failed absolute resolution for relative path")
	}
	if ToAbsoluteURL(baseURL, "uploads/photo.jpg") != "https://example.com/uploads/photo.jpg" {
		t.Errorf("Failed absolute resolution for path without leading slash")
	}
	if ToAbsoluteURL(baseURL, "https://other.com/pic.png") != "https://other.com/pic.png" {
		t.Errorf("Failed absolute resolution for full external URL")
	}
	// BaseURL with trailing slash
	if ToAbsoluteURL("https://example.com/", "/uploads/photo.jpg") != "https://example.com/uploads/photo.jpg" {
		t.Errorf("Failed absolute resolution when baseURL has trailing slash")
	}
}

func TestInjectMetaTags_NotFoundAndNoTitle(t *testing.T) {
	rawHTML := []byte(`<!doctype html>
<html>
<head>
</head>
<body><h1>404</h1></body>
</html>`)

	meta := PageMeta{
		Title:       "ไม่พบเนื้อหา | โรงเรียนโพนงามพิทยานุกูล",
		Description: "ขออภัย ไม่พบหน้าที่คุณต้องการ",
		NotFound:    true,
	}

	result := string(InjectMetaTags(rawHTML, meta))
	if !strings.Contains(result, "<title>ไม่พบเนื้อหา | โรงเรียนโพนงามพิทยานุกูล</title>") {
		t.Errorf("Title should be inserted even if html lacked <title> tag")
	}
	if !strings.Contains(result, `<meta name="robots" content="noindex, nofollow" />`) {
		t.Errorf("Robots noindex tag should be injected for NotFound pages")
	}
}
