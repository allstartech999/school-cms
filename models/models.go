package models

import "time"

type Post struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Title          string    `gorm:"not null" json:"title"`
	Slug           string    `gorm:"uniqueIndex;not null" json:"slug"`
	Category       string    `gorm:"default:'ทั่วไป'" json:"category"`
	Summary        string    `json:"summary"`
	Content        string    `gorm:"not null" json:"content"`
	ImageURL       string    `json:"image_url"`
	Author         string    `gorm:"default:'โรงเรียน'" json:"author"`
	CreatedByAgent bool      `gorm:"default:false" json:"created_by_agent"`
	AgentName      string    `json:"agent_name,omitempty"`
	Status         string    `gorm:"default:'published'" json:"status"` // 'published', 'draft'
	Views          int64     `gorm:"default:0" json:"views"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"uniqueIndex;not null" json:"name"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CategoryResponse struct {
	ID         uint      `json:"id"`
	Name       string    `json:"name"`
	Slug       string    `json:"slug"`
	PostsCount int64     `json:"posts_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Page struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Title          string    `gorm:"not null" json:"title"`
	Slug           string    `gorm:"uniqueIndex;not null" json:"slug"`
	LayoutType     string    `gorm:"default:'blocks'" json:"layout_type"` // 'standard', 'blocks'
	LayoutData     string    `gorm:"type:text" json:"layout_data"`       // JSON Array of blocks
	Content        string    `gorm:"not null" json:"content"`            // fallback/searchable text
	Status         string    `gorm:"default:'published'" json:"status"`
	ShowInMenu      bool      `gorm:"default:false" json:"show_in_menu"`
	MenuTitle       string    `json:"menu_title"`                         // Label shown on navbar
	MenuOrder       int       `gorm:"default:0" json:"menu_order"`        // Sorting order
	MenuParent      string    `json:"menu_parent"`                        // Parent dropdown grouping (optional)
	ShowInBottomNav bool      `gorm:"default:false" json:"show_in_bottom_nav"`
	MenuIcon        string    `json:"menu_icon"`
	CreatedByAgent  bool      `gorm:"default:false" json:"created_by_agent"`
	AgentName       string    `json:"agent_name,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Media struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	Filename       string    `gorm:"not null" json:"filename"`
	OriginalName   string    `json:"original_name"`
	URL            string    `gorm:"not null" json:"url"`
	MimeType       string    `json:"mime_type"`
	SizeBytes      int64     `json:"size_bytes"`
	AltText        string    `json:"alt_text"`
	CreatedByAgent bool      `gorm:"default:false" json:"created_by_agent"`
	AgentName      string    `json:"agent_name,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type Setting struct {
	Key   string `gorm:"primaryKey" json:"key"`
	Value string `gorm:"not null" json:"value"`
}

type Extension struct {
	ID           string    `gorm:"primaryKey" json:"id"` // e.g. "storage-local", "storage-r2", "storage-s3"
	Name         string    `gorm:"not null" json:"name"`
	Category     string    `gorm:"not null;default:'storage'" json:"category"` // "storage", "analytics", "seo", "utility"
	Description  string    `json:"description"`
	Version      string    `json:"version"`
	Author       string    `json:"author"`
	Icon         string    `json:"icon"` // icon name e.g. "HardDrive", "Cloud", "Server"
	Installed    bool      `gorm:"default:false" json:"installed"`
	Enabled      bool      `gorm:"default:false" json:"enabled"`
	Config       string    `gorm:"type:text" json:"config"`        // JSON string of config key-values
	ConfigSchema string    `gorm:"type:text" json:"config_schema"` // JSON string of field definitions
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ExtensionCatalogItem struct {
	ID              string                 `json:"id"`
	Name            string                 `json:"name"`
	Category        string                 `json:"category"`
	Description     string                 `json:"description"`
	Version         string                 `json:"version"`
	Author          string                 `json:"author"`
	Icon            string                 `json:"icon"`
	Installed       bool                   `json:"installed"`
	Enabled         bool                   `json:"enabled"`
	IsActiveStorage bool                   `json:"is_active_storage"`
	Config          map[string]interface{} `json:"config"`
	ConfigSchema    []ExtensionFieldSchema `json:"config_schema"`
	CreatedAt       *time.Time             `json:"created_at,omitempty"`
	UpdatedAt       *time.Time             `json:"updated_at,omitempty"`
}

type ExtensionFieldSchema struct {
	Key         string   `json:"key"`
	Label       string   `json:"label"`
	Type        string   `json:"type"` // "text", "password", "number", "select", "textarea", "boolean"
	Placeholder string   `json:"placeholder,omitempty"`
	Description string   `json:"description,omitempty"`
	Required    bool     `json:"required"`
	Default     string   `json:"default,omitempty"`
	Options     []string `json:"options,omitempty"`
}

type ExtensionInstallRequest struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name,omitempty"`
	Category     string                 `json:"category,omitempty"`
	Description  string                 `json:"description,omitempty"`
	Version      string                 `json:"version,omitempty"`
	Author       string                 `json:"author,omitempty"`
	Icon         string                 `json:"icon,omitempty"`
	Config       map[string]interface{} `json:"config,omitempty"`
	ConfigSchema []ExtensionFieldSchema `json:"config_schema,omitempty"`
	ManifestJSON string                 `json:"manifest_json,omitempty"`
}

type ExtensionConfigUpdateRequest struct {
	Config  map[string]interface{} `json:"config"`
	Enabled *bool                  `json:"enabled,omitempty"`
}

type ExtensionTestRequest struct {
	Config map[string]interface{} `json:"config"`
}

type ExtensionTestResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"uniqueIndex;not null" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	Role      string    `gorm:"default:'admin'" json:"role"` // 'admin', 'editor', 'teacher'
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

type UpdateUserRequest struct {
	Name     string `json:"name"`
	Role     string `json:"role"`
	Password string `json:"password,omitempty"`
}

type AgentKey struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Name        string     `gorm:"not null" json:"name"`
	Key         string     `gorm:"uniqueIndex;not null" json:"key"`
	Description string     `json:"description"`
	IsActive    bool       `gorm:"default:true" json:"is_active"`
	LastUsedAt  *time.Time `json:"last_used_at"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateAgentKeyRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type CreatePostRequest struct {
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Category string `json:"category"`
	Summary  string `json:"summary"`
	Content  string `json:"content"`
	ImageURL string `json:"image_url"`
	Author   string `json:"author"`
	Status   string `json:"status"`
}

type UpdatePostRequest struct {
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	Category string `json:"category"`
	Summary  string `json:"summary"`
	Content  string `json:"content"`
	ImageURL string `json:"image_url"`
	Author   string `json:"author"`
	Status   string `json:"status"`
}

type CreateCategoryRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type UpdateCategoryRequest struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type AgentCreatePostRequest struct {
	Title     string `json:"title"`
	Category  string `json:"category"`
	Summary   string `json:"summary"`
	Content   string `json:"content"`
	ImageURL  string `json:"image_url"`
	AgentName string `json:"agent_name"`
	Publish   bool   `json:"publish"` // If false, will create as draft
}

type CreatePageRequest struct {
	Title           string `json:"title"`
	Slug            string `json:"slug"`
	LayoutType      string `json:"layout_type"`
	LayoutData      string `json:"layout_data"`
	Content         string `json:"content"`
	Status          string `json:"status"`
	ShowInMenu      bool   `json:"show_in_menu"`
	MenuTitle       string `json:"menu_title"`
	MenuOrder       int    `json:"menu_order"`
	MenuParent      string `json:"menu_parent"`
	ShowInBottomNav bool   `json:"show_in_bottom_nav"`
	MenuIcon        string `json:"menu_icon"`
}

type AgentCreatePageRequest struct {
	Title           string `json:"title"`
	Slug            string `json:"slug"`
	LayoutType      string `json:"layout_type"`
	LayoutData      any    `json:"layout_data"` // Accepts string or JSON structure
	Content         string `json:"content"`
	AgentName       string `json:"agent_name"`
	Publish         bool   `json:"publish"`
	ShowInMenu      bool   `json:"show_in_menu"`
	MenuTitle       string `json:"menu_title"`
	MenuOrder       int    `json:"menu_order"`
	MenuParent      string `json:"menu_parent"`
	ShowInBottomNav bool   `json:"show_in_bottom_nav"`
	MenuIcon        string `json:"menu_icon"`
}

type AgentFetchMediaRequest struct {
	SourceURL string `json:"source_url"`
	AltText   string `json:"alt_text"`
	AgentName string `json:"agent_name"`
}

type LoginRequest struct {
	Username string `json:"username,omitempty"`
	Password string `json:"password"`
}

type SystemStats struct {
	TotalPosts      int64  `json:"total_posts"`
	TotalPages      int64  `json:"total_pages"`
	AgentPosts      int64  `json:"agent_posts"`
	SchoolName      string `json:"school_name"`
	SchoolNameEn    string `json:"school_name_en"`
	SchoolSubtitle  string `json:"school_subtitle"`
	LogoURL         string `json:"logo_url"`
	FaviconURL      string `json:"favicon_url"`
	AgentKeyPreview string `json:"agent_key_preview"`
}

type SiteSettings struct {
	SchoolName             string `json:"school_name"`
	SchoolNameEn           string `json:"school_name_en"`
	SchoolSubtitle         string `json:"school_subtitle"`
	LogoURL                string `json:"logo_url"`
	FaviconURL             string `json:"favicon_url"`
	SeoTitle               string `json:"seo_title"`
	SeoDescription         string `json:"seo_description"`
	SeoKeywords            string `json:"seo_keywords"`
	OgDefaultImage         string `json:"og_default_image"`
	GoogleSiteVerification string `json:"google_site_verification"`
}

type UpdateSiteSettingsRequest struct {
	SchoolName             *string `json:"school_name,omitempty"`
	SchoolNameEn           *string `json:"school_name_en,omitempty"`
	SchoolSubtitle         *string `json:"school_subtitle,omitempty"`
	LogoURL                *string `json:"logo_url,omitempty"`
	FaviconURL             *string `json:"favicon_url,omitempty"`
	SeoTitle               *string `json:"seo_title,omitempty"`
	SeoDescription         *string `json:"seo_description,omitempty"`
	SeoKeywords            *string `json:"seo_keywords,omitempty"`
	OgDefaultImage         *string `json:"og_default_image,omitempty"`
	GoogleSiteVerification *string `json:"google_site_verification,omitempty"`
}

// Navigation Menu item definition
type MenuItem struct {
	ID              string     `json:"id"`
	Title           string     `json:"title"`
	Path            string     `json:"path"`        // e.g. "home", "about", or "/page/ai-robotics"
	Type            string     `json:"type"`        // "route", "page", "link"
	IsExternal      bool       `json:"is_external"` // if true, opens in new tab
	Order           int        `json:"order"`
	ShowInMenu      bool       `json:"show_in_menu"`
	ShowInBottomNav bool       `json:"show_in_bottom_nav"`
	Icon            string     `json:"icon,omitempty"`
	Children        []MenuItem `json:"children,omitempty"`
}

// Homepage Configuration for AI Site Editor
type HomepageHeroConfig struct {
	Badge       string `json:"badge"`
	Heading     string `json:"heading"`
	Subheading  string `json:"subheading"`
	PrimaryCTA  string `json:"primary_cta"`
	PrimaryURL  string `json:"primary_url"`
	ImageURL    string `json:"image_url"`
}

type HomepageConfig struct {
	Hero           HomepageHeroConfig `json:"hero"`
	Announcement   string             `json:"announcement"`
	ShowTicker     bool               `json:"show_ticker"`
	ShowSlider     bool               `json:"show_slider"`
	ShowEServices  bool               `json:"show_eservices"`
	ShowRecentNews bool               `json:"show_recent_news"`
	ShowTrending   bool               `json:"show_trending"`
	CustomBlocks   string             `json:"custom_blocks"` // JSON array of blocks to render on home
}
