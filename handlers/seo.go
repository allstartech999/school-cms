package handlers

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"io/fs"
	"net/http"
	"os"
	"regexp"
	"school-cms/db"
	"school-cms/models"
	"strconv"
	"strings"
	"time"
)

var (
	htmlTagRegex       = regexp.MustCompile(`<[^>]*>`)
	extraSpacesRegex   = regexp.MustCompile(`\s+`)
	titleTagRegex      = regexp.MustCompile(`(?i)<title>.*?</title>`)
	existingDescRegex  = regexp.MustCompile(`(?i)<meta\s+name=["']description["'][^>]*>`)
	existingCanonRegex = regexp.MustCompile(`(?i)<link\s+rel=["']canonical["'][^>]*>`)
)

type PageMeta struct {
	Title                  string
	Description            string
	Keywords               string
	CanonicalURL           string
	OgType                 string // "website" or "article"
	OgImage                string
	SiteName               string
	GoogleSiteVerification string
	JSONLD                 string
	NotFound               bool
}

// GetBaseURL resolves the canonical base domain for the current request
func GetBaseURL(r *http.Request) string {
	scheme := "http"
	if r != nil {
		if r.TLS != nil || strings.HasPrefix(strings.ToLower(r.Header.Get("X-Forwarded-Proto")), "https") || r.Header.Get("X-Forwarded-Ssl") == "on" {
			scheme = "https"
		}

		host := r.Host
		if fHost := r.Header.Get("X-Forwarded-Host"); fHost != "" {
			// In case of multiple comma-separated proxy hosts, pick the first
			host = strings.TrimSpace(strings.Split(fHost, ",")[0])
		}
		// If request has a valid host that is not a local dev port, use it directly
		if host != "" && !strings.HasPrefix(host, "localhost") && !strings.HasPrefix(host, "127.0.0.1") {
			return scheme + "://" + host
		}
	}

	if siteURL := strings.TrimRight(os.Getenv("SITE_URL"), "/"); siteURL != "" {
		return siteURL
	}
	if appURL := strings.TrimRight(os.Getenv("APP_URL"), "/"); appURL != "" {
		return appURL
	}

	if r != nil && r.Host != "" {
		return scheme + "://" + r.Host
	}

	return scheme + "://localhost:8080"
}

// ToAbsoluteURL ensures the given URL or path is fully qualified with domain
func ToAbsoluteURL(baseURL, raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return raw
	}
	if !strings.HasPrefix(raw, "/") {
		raw = "/" + raw
	}
	return strings.TrimRight(baseURL, "/") + raw
}

// CleanText strips HTML tags, unescapes entities and normalizes whitespace
func CleanText(input string, maxLen int) string {
	text := htmlTagRegex.ReplaceAllString(input, " ")
	text = html.UnescapeString(text)
	text = strings.TrimSpace(extraSpacesRegex.ReplaceAllString(text, " "))
	if maxLen > 0 && len([]rune(text)) > maxLen {
		return string([]rune(text)[:maxLen]) + "..."
	}
	return text
}

// BuildPageMeta analyzes the request path and queries the DB to build appropriate SEO & OG meta tags
func BuildPageMeta(r *http.Request) PageMeta {
	settings := GetSiteSettingsInternal()
	baseURL := GetBaseURL(r)

	path := r.URL.Path
	if path == "" {
		path = "/"
	}

	// Base defaults from SiteSettings
	siteTitle := settings.SeoTitle
	if strings.TrimSpace(siteTitle) == "" {
		siteTitle = settings.SchoolName + " – " + settings.SchoolSubtitle
	}

	siteDesc := settings.SeoDescription
	if strings.TrimSpace(siteDesc) == "" {
		siteDesc = settings.SchoolSubtitle
	}

	meta := PageMeta{
		Title:                  siteTitle,
		Description:            siteDesc,
		Keywords:               settings.SeoKeywords,
		CanonicalURL:           ToAbsoluteURL(baseURL, path),
		OgType:                 "website",
		OgImage:                ToAbsoluteURL(baseURL, settings.OgDefaultImage),
		SiteName:               settings.SchoolName,
		GoogleSiteVerification: settings.GoogleSiteVerification,
	}

	// Fallback image if og_default_image is empty
	if meta.OgImage == "" {
		meta.OgImage = ToAbsoluteURL(baseURL, settings.LogoURL)
	}

	// Route 1: Post detail (/posts/:id, /post/:id)
	if strings.HasPrefix(path, "/posts/") || strings.HasPrefix(path, "/post/") {
		identifier := strings.TrimPrefix(path, "/posts/")
		if identifier == path {
			identifier = strings.TrimPrefix(path, "/post/")
		}
		identifier = strings.Trim(identifier, "/")

		if identifier != "" && db.DB != nil {
			var post models.Post
			var err error
			if idNum, parseErr := strconv.ParseUint(identifier, 10, 64); parseErr == nil {
				err = db.DB.Where("id = ? AND status = 'published'", idNum).First(&post).Error
			} else {
				err = db.DB.Where("slug = ? AND status = 'published'", identifier).First(&post).Error
			}

			if err == nil && post.ID > 0 {
				meta.Title = post.Title + " | " + settings.SchoolName
				if strings.TrimSpace(post.Summary) != "" {
					meta.Description = CleanText(post.Summary, 200)
				} else {
					meta.Description = CleanText(post.Content, 200)
				}
				if post.Category != "" {
					if meta.Keywords != "" {
						meta.Keywords = meta.Keywords + ", " + post.Category
					} else {
						meta.Keywords = post.Category
					}
				}
				meta.OgType = "article"
				if strings.TrimSpace(post.ImageURL) != "" {
					meta.OgImage = ToAbsoluteURL(baseURL, post.ImageURL)
				}
				meta.CanonicalURL = ToAbsoluteURL(baseURL, fmt.Sprintf("/posts/%d", post.ID))

				// Structured Data: NewsArticle schema
				articleSchema := map[string]any{
					"@context":      "https://schema.org",
					"@type":         "NewsArticle",
					"headline":      post.Title,
					"description":   meta.Description,
					"datePublished": post.CreatedAt.Format(time.RFC3339),
					"dateModified":  post.UpdatedAt.Format(time.RFC3339),
					"publisher": map[string]any{
						"@type": "EducationalOrganization",
						"name":  settings.SchoolName,
					},
					"mainEntityOfPage": map[string]any{
						"@type": "WebPage",
						"@id":   meta.CanonicalURL,
					},
				}
				if strings.TrimSpace(post.Author) != "" {
					articleSchema["author"] = map[string]any{
						"@type": "Person",
						"name":  strings.TrimSpace(post.Author),
					}
				} else {
					articleSchema["author"] = map[string]any{
						"@type": "Organization",
						"name":  settings.SchoolName,
					}
				}
				if logoURL := ToAbsoluteURL(baseURL, settings.LogoURL); logoURL != "" {
					articleSchema["publisher"].(map[string]any)["logo"] = map[string]any{
						"@type": "ImageObject",
						"url":   logoURL,
					}
				}
				if meta.OgImage != "" {
					articleSchema["image"] = []string{meta.OgImage}
				}
				if jsonBytes, err := json.Marshal(articleSchema); err == nil {
					meta.JSONLD = string(jsonBytes)
				}
				return meta
			}

			// Post ID or Slug was specified but not found in DB
			meta.NotFound = true
			meta.Title = "ไม่พบเนื้อหา | " + settings.SchoolName
			meta.Description = "ขออภัย ไม่พบหน้าที่คุณต้องการ"
			return meta
		}
	}

	// Route 2: Page detail (/pages/:slug, /page/:slug)
	if strings.HasPrefix(path, "/pages/") || strings.HasPrefix(path, "/page/") {
		identifier := strings.TrimPrefix(path, "/pages/")
		if identifier == path {
			identifier = strings.TrimPrefix(path, "/page/")
		}
		identifier = strings.Trim(identifier, "/")

		if identifier != "" && db.DB != nil {
			var page models.Page
			var err error
			if idNum, parseErr := strconv.ParseUint(identifier, 10, 64); parseErr == nil {
				err = db.DB.Where("id = ? AND status = 'published'", idNum).First(&page).Error
			} else {
				err = db.DB.Where("slug = ? AND status = 'published'", identifier).First(&page).Error
			}

			if err == nil && page.ID > 0 {
				meta.Title = page.Title + " | " + settings.SchoolName
				if strings.TrimSpace(page.Content) != "" {
					cleaned := CleanText(page.Content, 200)
					if cleaned != "" {
						meta.Description = cleaned
					}
				}
				meta.CanonicalURL = ToAbsoluteURL(baseURL, "/pages/"+page.Slug)

				pageSchema := map[string]any{
					"@context":    "https://schema.org",
					"@type":       "WebPage",
					"name":        page.Title,
					"description": meta.Description,
					"url":         meta.CanonicalURL,
					"publisher": map[string]any{
						"@type": "EducationalOrganization",
						"name":  settings.SchoolName,
						"url":   baseURL,
					},
				}
				if logoURL := ToAbsoluteURL(baseURL, settings.LogoURL); logoURL != "" {
					pageSchema["publisher"].(map[string]any)["logo"] = logoURL
				}
				if jsonBytes, err := json.Marshal(pageSchema); err == nil {
					meta.JSONLD = string(jsonBytes)
				}
				return meta
			}

			// Page was specified but not found in DB
			meta.NotFound = true
			meta.Title = "ไม่พบหน้า | " + settings.SchoolName
			meta.Description = "ขออภัย ไม่พบหน้าที่คุณต้องการ"
			return meta
		}
	}

	// Route 3: Static navigation sections
	cleanTrimmed := strings.Trim(path, "/")
	switch cleanTrimmed {
	case "about":
		meta.Title = "เกี่ยวกับโรงเรียน | " + settings.SchoolName
		meta.CanonicalURL = ToAbsoluteURL(baseURL, "/about")
	case "history", "history-vision":
		meta.Title = "ประวัติความเป็นมาและวิสัยทัศน์ | " + settings.SchoolName
		meta.CanonicalURL = ToAbsoluteURL(baseURL, "/history")
	case "eservice":
		meta.Title = "ระบบบริการออนไลน์ (E-Service) | " + settings.SchoolName
		meta.CanonicalURL = ToAbsoluteURL(baseURL, "/eservice")
	case "news", "posts":
		meta.Title = "ข่าวสารและกิจกรรม | " + settings.SchoolName
		meta.CanonicalURL = ToAbsoluteURL(baseURL, "/news")
	case "contact":
		meta.Title = "ติดต่อเรา | " + settings.SchoolName
		meta.CanonicalURL = ToAbsoluteURL(baseURL, "/contact")
	}

	// Default Structured Data: EducationalOrganization schema
	orgSchema := map[string]any{
		"@context":    "https://schema.org",
		"@type":       "EducationalOrganization",
		"name":        settings.SchoolName,
		"description": meta.Description,
		"url":         baseURL,
	}
	if strings.TrimSpace(settings.SchoolNameEn) != "" {
		orgSchema["alternateName"] = strings.TrimSpace(settings.SchoolNameEn)
	}
	if logoURL := ToAbsoluteURL(baseURL, settings.LogoURL); logoURL != "" {
		orgSchema["logo"] = logoURL
	}
	if jsonBytes, err := json.Marshal(orgSchema); err == nil {
		meta.JSONLD = string(jsonBytes)
	}

	return meta
}

// InjectMetaTags parses the raw HTML and inserts all SEO & Open Graph meta tags into <head>
func InjectMetaTags(rawHTML []byte, meta PageMeta) []byte {
	htmlStr := string(rawHTML)

	// Clean out any pre-existing description or canonical tags to avoid duplicates
	htmlStr = existingDescRegex.ReplaceAllString(htmlStr, "")
	htmlStr = existingCanonRegex.ReplaceAllString(htmlStr, "")

	// 1. Replace or insert <title>
	escapedTitle := html.EscapeString(meta.Title)
	newTitleTag := "<title>" + escapedTitle + "</title>"
	hasTitle := titleTagRegex.MatchString(htmlStr)
	if hasTitle {
		htmlStr = titleTagRegex.ReplaceAllString(htmlStr, newTitleTag)
	}

	// 2. Build injection block for meta tags
	var sb strings.Builder
	sb.WriteString("\n    <!-- SEO & Social Open Graph Tags -->\n")
	if !hasTitle && meta.Title != "" {
		sb.WriteString("    " + newTitleTag + "\n")
	}
	if meta.NotFound {
		sb.WriteString("    <meta name=\"robots\" content=\"noindex, nofollow\" />\n")
	}
	if meta.Description != "" {
		sb.WriteString(fmt.Sprintf("    <meta name=\"description\" content=\"%s\" />\n", html.EscapeString(meta.Description)))
	}
	if meta.Keywords != "" {
		sb.WriteString(fmt.Sprintf("    <meta name=\"keywords\" content=\"%s\" />\n", html.EscapeString(meta.Keywords)))
	}
	if meta.CanonicalURL != "" {
		sb.WriteString(fmt.Sprintf("    <link rel=\"canonical\" href=\"%s\" />\n", html.EscapeString(meta.CanonicalURL)))
	}

	// Open Graph (Facebook, Line, Discord, etc.)
	sb.WriteString(fmt.Sprintf("    <meta property=\"og:type\" content=\"%s\" />\n", html.EscapeString(meta.OgType)))
	sb.WriteString(fmt.Sprintf("    <meta property=\"og:site_name\" content=\"%s\" />\n", html.EscapeString(meta.SiteName)))
	sb.WriteString(fmt.Sprintf("    <meta property=\"og:title\" content=\"%s\" />\n", html.EscapeString(meta.Title)))
	sb.WriteString(fmt.Sprintf("    <meta property=\"og:description\" content=\"%s\" />\n", html.EscapeString(meta.Description)))
	sb.WriteString(fmt.Sprintf("    <meta property=\"og:url\" content=\"%s\" />\n", html.EscapeString(meta.CanonicalURL)))
	if meta.OgImage != "" {
		sb.WriteString(fmt.Sprintf("    <meta property=\"og:image\" content=\"%s\" />\n", html.EscapeString(meta.OgImage)))
		if strings.HasPrefix(meta.OgImage, "https://") {
			sb.WriteString(fmt.Sprintf("    <meta property=\"og:image:secure_url\" content=\"%s\" />\n", html.EscapeString(meta.OgImage)))
		}
		sb.WriteString("    <meta property=\"og:image:width\" content=\"1200\" />\n")
		sb.WriteString("    <meta property=\"og:image:height\" content=\"630\" />\n")
		if strings.HasSuffix(strings.ToLower(meta.OgImage), ".png") {
			sb.WriteString("    <meta property=\"og:image:type\" content=\"image/png\" />\n")
		} else {
			sb.WriteString("    <meta property=\"og:image:type\" content=\"image/jpeg\" />\n")
		}
		if meta.Title != "" {
			sb.WriteString(fmt.Sprintf("    <meta property=\"og:image:alt\" content=\"%s\" />\n", html.EscapeString(meta.Title)))
		}
	}
	sb.WriteString("    <meta property=\"og:locale\" content=\"th_TH\" />\n")

	// Twitter Cards
	sb.WriteString("    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n")
	sb.WriteString(fmt.Sprintf("    <meta name=\"twitter:title\" content=\"%s\" />\n", html.EscapeString(meta.Title)))
	sb.WriteString(fmt.Sprintf("    <meta name=\"twitter:description\" content=\"%s\" />\n", html.EscapeString(meta.Description)))
	if meta.OgImage != "" {
		sb.WriteString(fmt.Sprintf("    <meta name=\"twitter:image\" content=\"%s\" />\n", html.EscapeString(meta.OgImage)))
	}

	// Google Site Verification
	if strings.TrimSpace(meta.GoogleSiteVerification) != "" {
		sb.WriteString(fmt.Sprintf("    <meta name=\"google-site-verification\" content=\"%s\" />\n", html.EscapeString(meta.GoogleSiteVerification)))
	}

	// Schema.org JSON-LD Structured Data
	if strings.TrimSpace(meta.JSONLD) != "" {
		sb.WriteString(fmt.Sprintf("    <script type=\"application/ld+json\">\n    %s\n    </script>\n", meta.JSONLD))
	}

	// Inject before </head>
	headEndIdx := strings.Index(strings.ToLower(htmlStr), "</head>")
	if headEndIdx != -1 {
		return []byte(htmlStr[:headEndIdx] + sb.String() + htmlStr[headEndIdx:])
	}

	// Fallback: append
	return []byte(htmlStr + sb.String())
}

// ServeSEOPage handles serving index.html with dynamic SEO & OG tags injected
func ServeSEOPage(w http.ResponseWriter, r *http.Request, distFS fs.FS) {
	var rawHTML []byte
	var err error

	if distFS != nil {
		f, openErr := distFS.Open("index.html")
		if openErr == nil {
			rawHTML, err = io.ReadAll(f)
			f.Close()
		} else {
			err = openErr
		}
	}

	// Fallback template if index.html is not yet available
	if err != nil || len(rawHTML) == 0 {
		rawHTML = []byte(`<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>School CMS</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`)
	}

	meta := BuildPageMeta(r)
	injected := InjectMetaTags(rawHTML, meta)

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	if meta.NotFound {
		w.WriteHeader(http.StatusNotFound)
	} else {
		w.WriteHeader(http.StatusOK)
	}
	w.Write(injected)
}

// GetSitemapXML handles GET /sitemap.xml
func GetSitemapXML(w http.ResponseWriter, r *http.Request) {
	baseURL := GetBaseURL(r)
	today := time.Now().Format("2006-01-02")

	var posts []models.Post
	if db.DB != nil {
		_ = db.DB.Select("id, slug, updated_at, created_at").
			Where("status = ?", "published").
			Order("updated_at DESC").
			Find(&posts).Error
	}

	var pages []models.Page
	if db.DB != nil {
		_ = db.DB.Select("id, slug, updated_at, created_at").
			Where("status = ?", "published").
			Order("updated_at DESC").
			Find(&pages).Error
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")
	sb.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` + "\n")

	// Static routes
	staticRoutes := []struct {
		Path       string
		Priority   string
		ChangeFreq string
	}{
		{"/", "1.0", "daily"},
		{"/news", "0.9", "daily"},
		{"/about", "0.8", "monthly"},
		{"/history", "0.8", "monthly"},
		{"/eservice", "0.8", "weekly"},
		{"/contact", "0.7", "monthly"},
	}

	for _, sr := range staticRoutes {
		loc := html.EscapeString(strings.TrimRight(baseURL, "/") + sr.Path)
		sb.WriteString("  <url>\n")
		sb.WriteString(fmt.Sprintf("    <loc>%s</loc>\n", loc))
		sb.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", today))
		sb.WriteString(fmt.Sprintf("    <changefreq>%s</changefreq>\n", sr.ChangeFreq))
		sb.WriteString(fmt.Sprintf("    <priority>%s</priority>\n", sr.Priority))
		sb.WriteString("  </url>\n")
	}

	// Dynamic Published Posts
	for _, p := range posts {
		lastmod := p.UpdatedAt.Format("2006-01-02")
		if lastmod == "0001-01-01" {
			lastmod = today
		}
		loc := html.EscapeString(fmt.Sprintf("%s/posts/%d", strings.TrimRight(baseURL, "/"), p.ID))
		sb.WriteString("  <url>\n")
		sb.WriteString(fmt.Sprintf("    <loc>%s</loc>\n", loc))
		sb.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", lastmod))
		sb.WriteString("    <changefreq>weekly</changefreq>\n")
		sb.WriteString("    <priority>0.7</priority>\n")
		sb.WriteString("  </url>\n")
	}

	// Dynamic Published Pages
	for _, p := range pages {
		lastmod := p.UpdatedAt.Format("2006-01-02")
		if lastmod == "0001-01-01" {
			lastmod = today
		}
		loc := html.EscapeString(fmt.Sprintf("%s/pages/%s", strings.TrimRight(baseURL, "/"), p.Slug))
		sb.WriteString("  <url>\n")
		sb.WriteString(fmt.Sprintf("    <loc>%s</loc>\n", loc))
		sb.WriteString(fmt.Sprintf("    <lastmod>%s</lastmod>\n", lastmod))
		sb.WriteString("    <changefreq>monthly</changefreq>\n")
		sb.WriteString("    <priority>0.6</priority>\n")
		sb.WriteString("  </url>\n")
	}

	sb.WriteString("</urlset>\n")

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(sb.String()))
}

// GetRobotsTxt handles GET /robots.txt
func GetRobotsTxt(w http.ResponseWriter, r *http.Request) {
	baseURL := GetBaseURL(r)
	txt := fmt.Sprintf(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /mcp/

Sitemap: %s/sitemap.xml
`, baseURL)

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(txt))
}
