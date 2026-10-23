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

type Page struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"not null" json:"title"`
	Slug      string    `gorm:"uniqueIndex;not null" json:"slug"`
	Content   string    `gorm:"not null" json:"content"`
	Status    string    `gorm:"default:'published'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Setting struct {
	Key   string `gorm:"primaryKey" json:"key"`
	Value string `gorm:"not null" json:"value"`
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
	Title   string `json:"title"`
	Slug    string `json:"slug"`
	Content string `json:"content"`
	Status  string `json:"status"`
}

type LoginRequest struct {
	Password string `json:"password"`
}

type SystemStats struct {
	TotalPosts      int64  `json:"total_posts"`
	TotalPages      int64  `json:"total_pages"`
	AgentPosts      int64  `json:"agent_posts"`
	SchoolName      string `json:"school_name"`
	AgentKeyPreview string `json:"agent_key_preview"`
}
