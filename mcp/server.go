package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"school-cms/db"
	"school-cms/handlers"
	"school-cms/models"
	"strconv"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

const (
	BlockCatalogJSON = `{
  "description": "Block Layout Components Catalog for School CMS (Clean Green & White Theme)",
  "blocks": {
    "hero_banner": {
      "description": "Top hero banner. Supports centered full-width or split 2-columns (text on left, image on right).",
      "required": ["heading"],
      "props": {
        "variant": "split | centered (default: split)",
        "badge": "Short announcement badge text (e.g. 'หลักสูตรใหม่ปี 2026')",
        "heading": "Main headline title",
        "subheading": "Supporting subtitle or tagline",
        "ctaText": "Label for Call-To-Action button (e.g. 'สมัครเรียนออนไลน์')",
        "ctaUrl": "Target URL for CTA button",
        "imageUrl": "Image URL (recommend using upload_media_by_url to obtain a permanent school URL)"
      }
    },
    "stats_bar": {
      "description": "Showcase 3-4 key school statistics in clean emerald cards.",
      "required": ["items"],
      "props": {
        "title": "Optional section header",
        "items": [
          { "value": "100%", "label": "อัตราการศึกษาต่อ" },
          { "value": "15+", "label": "รางวัลระดับชาติ" },
          { "value": "1:1", "label": "แล็ปท็อปต่อผู้เรียน" }
        ]
      }
    },
    "feature_grid": {
      "description": "Grid of feature or curriculum cards (2, 3, or 4 columns).",
      "required": ["title", "items"],
      "props": {
        "title": "Section Title",
        "subtitle": "Brief explanatory subtitle",
        "columns": "2, 3, or 4 (default: 3)",
        "items": [
          {
            "icon": "Brain | Sparkles | Rocket | Trophy | Book | Cpu | Shield | Users",
            "title": "Card title",
            "desc": "Card description"
          }
        ]
      }
    },
    "two_columns": {
      "description": "Side-by-side section with text on one side and a prominent image on the other.",
      "required": ["heading", "content"],
      "props": {
        "badge": "Optional topic badge",
        "heading": "Section Heading",
        "content": "Detailed paragraphs (Markdown supported)",
        "imageUrl": "Image URL",
        "imagePosition": "left | right (default: right)"
      }
    },
    "accordion_faq": {
      "description": "Frequently Asked Questions expandable accordion.",
      "required": ["title", "items"],
      "props": {
        "title": "FAQ Title",
        "subtitle": "Subtitle",
        "items": [
          { "q": "Question text?", "a": "Answer explanation." }
        ]
      }
    }
  }
}`

	WritingGuidelines = `# แนวทางและข้อกำหนดการสื่อสารของโรงเรียน (School Editorial Guidelines)
1. **โทนเสียง (Tone of Voice):** เป็นมิตร สร้างสรรค์ สุภาพ ให้เกียรติ และถูกต้องตามหลักวิชาการ
2. **การอ้างอิงและรูปภาพ:** ใช้รูปภาพที่เป็นลิขสิทธิ์ถูกต้อง หรืออัปโหลดผ่านเครื่องมือ upload_media_by_url
3. **การจัด Layout หน้าเพจ:**
   - ควรเริ่มด้วย Hero Banner เสมอเพื่อดึงดูดความสนใจ
   - ตามด้วยข้อมูลสรุปแบบรวดเร็ว (Stats Bar หรือ Feature Grid)
   - ปิดท้ายด้วย FAQ หรือข้อมูลช่องทางการติดต่อ
4. **ความถูกต้องของข้อมูล:** ตรวจสอบชื่อหลักสูตร วันเวลา และรายละเอียดกิจกรรมให้ชัดเจน`
)

// NewSchoolMCPServer creates and configures the School CMS MCP Server
func NewSchoolMCPServer() *server.MCPServer {
	s := server.NewMCPServer(
		"School CMS Agent Engine",
		"1.0.0",
		server.WithToolCapabilities(true),
		server.WithResourceCapabilities(true, false),
		server.WithPromptCapabilities(false),
	)

	registerTools(s)
	registerResources(s)

	return s
}

func registerTools(s *server.MCPServer) {
	// 1. Tool: upload_media_by_url
	toolUploadMedia := mcp.NewTool("upload_media_by_url",
		mcp.WithDescription("ดาวน์โหลดรูปภาพจาก URL ภายนอก (เช่น จาก AI Image Generator หรือ Web) มาบันทึกเก็บในคลังสื่อของโรงเรียนถาวร และคืนค่า School URL สำหรับนำไปใช้ในหน้าเว็บ"),
		mcp.WithString("source_url", mcp.Required(), mcp.Description("URL ของไฟล์รูปภาพที่ต้องการดูดมาเก็บ")),
		mcp.WithString("alt_text", mcp.Description("คำบรรยายรูปภาพภาษาไทย เพื่อ Accessibility และ SEO")),
		mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent ผู้เรียกใช้งาน")),
	)
	s.AddTool(toolUploadMedia, handleUploadMedia)

	// 2. Tool: create_or_update_page
	toolCreatePage := mcp.NewTool("create_or_update_page",
		mcp.WithDescription("สร้างหรือปรับปรุงหน้าเนื้อหาถาวรของโรงเรียน (Page) พร้อมจัดวาง Layout ด้วย Block สำเร็จรูป (เช่น Hero, Stats, Feature Grid, FAQ)"),
		mcp.WithString("title", mcp.Required(), mcp.Description("ชื่อหน้าเพจ เช่น หลักสูตรความเป็นเลิศปัญญาประดิษฐ์")),
		mcp.WithString("slug", mcp.Description("URL Slug ภาษาอังกฤษ เช่น ai-robotics-curriculum (หากไม่ระบุจะถูกสร้างอัตโนมัติจาก Title)")),
		mcp.WithString("layout_type", mcp.Description("ประเภทของเลย์เอาต์ เช่น 'blocks' (แนะนำ) หรือ 'standard'")),
		mcp.WithString("layout_data", mcp.Required(), mcp.Description("JSON Array ของ Block Components ตามสเปกใน Resource school://blocks/catalog")),
		mcp.WithString("content", mcp.Description("เนื้อหาฉบับย่อหรือ Plain text fallback สำหรับการค้นหา")),
		mcp.WithBoolean("publish", mcp.Description("เผยแพร่ทันที (true) หรือบันทึกเป็นฉบับร่าง draft (false)")),
		mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent")),
	)
	s.AddTool(toolCreatePage, handleCreateOrUpdatePage)

	// 3. Tool: create_school_post
	toolCreatePost := mcp.NewTool("create_school_post",
		mcp.WithDescription("สร้างข่าวสาร ประชาสัมพันธ์ หรือประกาศด่วนของโรงเรียน"),
		mcp.WithString("title", mcp.Required(), mcp.Description("หัวข้อข่าว")),
		mcp.WithString("category", mcp.Description("หมวดหมู่ข่าว เช่น 'วิชาการ', 'กิจกรรม', 'ข่าวสาร AI', 'ทั่วไป'")),
		mcp.WithString("summary", mcp.Description("เนื้อหาสรุปย่อ 2-3 บรรทัดสำหรับการแสดงบนการ์ดหน้าแรก")),
		mcp.WithString("content", mcp.Required(), mcp.Description("เนื้อหาข่าวฉบับเต็ม (รองรับ Markdown)")),
		mcp.WithString("image_url", mcp.Description("URL รูปภาพปกข่าว")),
		mcp.WithBoolean("publish", mcp.Description("เผยแพร่ทันที (true) หรือบันทึกเป็น draft (false)")),
		mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent")),
	)
	s.AddTool(toolCreatePost, handleCreatePost)

	// 4. Tool: list_recent_posts
	toolListPosts := mcp.NewTool("list_recent_posts",
		mcp.WithDescription("ดึงรายการข่าวสารล่าสุดของโรงเรียน เพื่อใช้อ่านเป็น Context ในการเขียนข่าวหรือป้องกันการสร้างข่าวซ้ำ"),
		mcp.WithNumber("limit", mcp.Description("จำนวนข่าวที่ต้องการดึง (ค่าเริ่มต้น 10)")),
	)
	s.AddTool(toolListPosts, handleListPosts)

	// 5. Tool: list_pages
	toolListPages := mcp.NewTool("list_pages",
		mcp.WithDescription("ดึงรายการหน้าเพจทั้งหมดของโรงเรียน เพื่อดูโครงสร้างและ Slug ที่มีอยู่แล้ว"),
	)
	s.AddTool(toolListPages, handleListPages)
}

func registerResources(s *server.MCPServer) {
	// Resource 1: school://blocks/catalog
	resBlocks := mcp.NewResource(
		"school://blocks/catalog",
		"School CMS Layout Blocks Catalog",
		mcp.WithResourceDescription("คู่มือระบุโครงสร้าง JSON และ Props ของ Block Components สำหรับจัดวางหน้าเพจ"),
		mcp.WithMIMEType("application/json"),
	)
	s.AddResource(resBlocks, func(ctx context.Context, request mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "school://blocks/catalog",
				MIMEType: "application/json",
				Text:     BlockCatalogJSON,
			},
		}, nil
	})

	// Resource 2: school://guidelines/writing
	resGuidelines := mcp.NewResource(
		"school://guidelines/writing",
		"School Editorial Guidelines",
		mcp.WithResourceDescription("แนวทางการเขียนข่าวและจัดหน้านโยบายโรงเรียน"),
		mcp.WithMIMEType("text/markdown"),
	)
	s.AddResource(resGuidelines, func(ctx context.Context, request mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "school://guidelines/writing",
				MIMEType: "text/markdown",
				Text:     WritingGuidelines,
			},
		}, nil
	})
}

// Tool Handlers
func handleUploadMedia(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	sourceURL, err := request.RequireString("source_url")
	if err != nil {
		return mcp.NewToolResultError("source_url parameter is required"), nil
	}

	altText := request.GetString("alt_text", "ภาพประกอบจาก AI Agent")
	agentName := request.GetString("agent_name", "School AI Assistant")

	media, err := handlers.SaveMediaFromURL(sourceURL, altText, agentName)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("Failed to fetch and store media: %v", err)), nil
	}

	resJSON, _ := json.MarshalIndent(media, "", "  ")
	return mcp.NewToolResultText(fmt.Sprintf("Media uploaded successfully!\nURL: %s\nID: %d\nDetails:\n%s", media.URL, media.ID, string(resJSON))), nil
}

func handleCreateOrUpdatePage(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	title, err := request.RequireString("title")
	if err != nil {
		return mcp.NewToolResultError("title is required"), nil
	}

	slug := request.GetString("slug", "")
	if slug == "" {
		slug = handlers.GenerateSlug(title)
	}

	layoutType := request.GetString("layout_type", "blocks")
	layoutData := request.GetString("layout_data", "[]")
	content := request.GetString("content", title)
	publish := request.GetBool("publish", false)
	agentName := request.GetString("agent_name", "School AI Architect")

	status := "draft"
	if publish {
		status = "published"
	}

	var existing models.Page
	res := db.DB.Where("slug = ?", slug).First(&existing)
	if res.Error == nil {
		// Update existing
		existing.Title = title
		existing.LayoutType = layoutType
		existing.LayoutData = layoutData
		existing.Content = content
		existing.Status = status
		existing.CreatedByAgent = true
		existing.AgentName = agentName
		existing.UpdatedAt = time.Now()

		if err := db.DB.Save(&existing).Error; err != nil {
			return mcp.NewToolResultError("Failed to update page: " + err.Error()), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Page updated successfully!\nID: %d\nSlug: %s\nStatus: %s\nURL: /page/%s", existing.ID, existing.Slug, existing.Status, existing.Slug)), nil
	}

	// Create new
	page := models.Page{
		Title:          title,
		Slug:           slug,
		LayoutType:     layoutType,
		LayoutData:     layoutData,
		Content:        content,
		Status:         status,
		CreatedByAgent: true,
		AgentName:      agentName,
	}

	if err := db.DB.Create(&page).Error; err != nil {
		return mcp.NewToolResultError("Failed to create page: " + err.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("Page created successfully!\nID: %d\nSlug: %s\nStatus: %s\nURL: /page/%s", page.ID, page.Slug, page.Status, page.Slug)), nil
}

func handleCreatePost(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	title, err := request.RequireString("title")
	if err != nil {
		return mcp.NewToolResultError("title is required"), nil
	}

	content, err := request.RequireString("content")
	if err != nil {
		return mcp.NewToolResultError("content is required"), nil
	}

	category := request.GetString("category", "ข่าวสาร AI")
	summary := request.GetString("summary", "")
	imageURL := request.GetString("image_url", "")
	publish := request.GetBool("publish", false)
	agentName := request.GetString("agent_name", "AI Reporter")

	status := "draft"
	if publish {
		status = "published"
	}

	slug := handlers.GenerateSlug(title) + "-ai-" + strconv.FormatInt(time.Now().Unix(), 10)

	post := models.Post{
		Title:          title,
		Slug:           slug,
		Category:       category,
		Summary:        summary,
		Content:        content,
		ImageURL:       imageURL,
		Author:         agentName,
		CreatedByAgent: true,
		AgentName:      agentName,
		Status:         status,
	}

	if err := db.DB.Create(&post).Error; err != nil {
		return mcp.NewToolResultError("Failed to create post: " + err.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("News post created successfully!\nID: %d\nSlug: %s\nStatus: %s", post.ID, post.Slug, post.Status)), nil
}

func handleListPosts(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	limit := 10
	if l := request.GetInt("limit", 10); l > 0 && l <= 50 {
		limit = l
	}

	var posts []models.Post
	if err := db.DB.Order("created_at DESC").Limit(limit).Find(&posts).Error; err != nil {
		return mcp.NewToolResultError("Failed to list posts: " + err.Error()), nil
	}

	b, _ := json.MarshalIndent(posts, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}

func handleListPages(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var pages []models.Page
	if err := db.DB.Order("id ASC").Find(&pages).Error; err != nil {
		return mcp.NewToolResultError("Failed to list pages: " + err.Error()), nil
	}

	b, _ := json.MarshalIndent(pages, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}
