package mcp

import (
	"context"
	"encoding/json"
	"fmt"
	"school-cms/db"
	"school-cms/handlers"
	"school-cms/models"
	"strconv"
	"strings"
	"time"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

const (
	BlockCatalogJSON = `{
  "description": "Block Layout Components Catalog for School CMS (WordPress Gutenberg style - Clean Green & White Theme)",
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
        "ctaUrl": "Target URL for CTA button (e.g. 'news' or external url)",
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
            "icon": "Brain | Sparkles | Rocket | Trophy | Book | Cpu | Shield | Users | Award | Compass",
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
    },
    "person_cards": {
      "description": "Personnel and executive staff directory cards with photo, name, role, department, and quote.",
      "required": ["title", "members"],
      "props": {
        "title": "Section Title (e.g. 'คณะผู้บริหารและหัวหน้ากลุ่มงาน')",
        "subtitle": "Brief subtitle",
        "members": [
          {
            "name": "ชื่อ-นามสกุล",
            "role": "ตำแหน่งหน้าที่ (เช่น ผู้อำนวยการโรงเรียน)",
            "position": "วิทยฐานะ (เช่น ชำนาญการพิเศษ)",
            "photo": "URL รูปถ่าย",
            "group": "กลุ่มบริหารงาน (เช่น กลุ่มบริหารงานวิชาการ)",
            "quote": "คำคมหรือวิสัยทัศน์สั้นๆ"
          }
        ]
      }
    },
    "rich_text": {
      "description": "Editorial rich text block supporting full Markdown headings, paragraphs, lists, and quotes.",
      "required": ["content"],
      "props": {
        "heading": "Optional block heading",
        "content": "Full markdown text content",
        "container": "normal | narrow (default: normal)"
      }
    },
    "image_gallery": {
      "description": "Image gallery grid for school events, facilities, and student activities.",
      "required": ["images"],
      "props": {
        "title": "Gallery Title",
        "columns": "2, 3, or 4 (default: 3)",
        "images": [
          { "url": "Image URL", "caption": "คำบรรยายภาพ", "alt": "Alt text" }
        ]
      }
    }
  }
}`

	WritingGuidelines = `# แนวทางและข้อกำหนดการสื่อสารของโรงเรียน (School Editorial Guidelines)
1. **โทนเสียง (Tone of Voice):** เป็นมิตร สร้างสรรค์ สุภาพ ให้เกียรติ และถูกต้องตามหลักวิชาการ
2. **การอ้างอิงและรูปภาพ:** ใช้รูปภาพที่เป็นลิขสิทธิ์ถูกต้อง หรืออัปโหลดผ่านเครื่องมือ upload_media_by_url
3. **การจัด Layout หน้าเพจ (Full Site Editing):**
   - หน้าเพจควรเริ่มด้วย Hero Banner เสมอเพื่อดึงดูดความสนใจ
   - ตามด้วยข้อมูลสรุปแบบรวดเร็ว (Stats Bar หรือ Feature Grid)
   - ปิดท้ายด้วย FAQ, Person Cards หรือข้อมูลช่องทางการติดต่อ
4. **การนำหน้าเพจขึ้น Navbar (Navigation Menu):**
   - สามารถระบุ show_in_menu=true พร้อม menu_title (ชื่อสั้น) ได้ทันทีเมื่อสร้างเพจ
   - หากต้องการจัดกลุ่มเข้า Dropdown สามารถระบุ menu_parent="about" ได้
5. **ความถูกต้องของข้อมูล:** ตรวจสอบชื่อหลักสูตร วันเวลา และรายละเอียดกิจกรรมให้ชัดเจน`
)

// NewSchoolMCPServer creates and configures the School CMS MCP Server
func NewSchoolMCPServer() *server.MCPServer {
	s := server.NewMCPServer(
		"School CMS WordPress-like Agent Engine",
		"2.0.0",
		server.WithToolCapabilities(true),
		server.WithResourceCapabilities(true, false),
		server.WithPromptCapabilities(false),
	)

	registerTools(s)
	registerResources(s)

	return s
}

func registerTools(s *server.MCPServer) {
	// ==========================================
	// หมวด 1: Media Library (คลังสื่อ)
	// ==========================================

	// 1. Tool: upload_media_by_url
	s.AddTool(
		mcp.NewTool("upload_media_by_url",
			mcp.WithDescription("ดาวน์โหลดรูปภาพจาก URL ภายนอก (เช่น จาก AI Image Generator หรือ Web) มาบันทึกเก็บในคลังสื่อของโรงเรียนถาวร และคืนค่า School URL สำหรับนำไปใช้ในหน้าเว็บ"),
			mcp.WithString("source_url", mcp.Required(), mcp.Description("URL ของไฟล์รูปภาพที่ต้องการดูดมาเก็บ")),
			mcp.WithString("alt_text", mcp.Description("คำบรรยายรูปภาพภาษาไทย เพื่อ Accessibility และ SEO")),
			mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent ผู้เรียกใช้งาน")),
		),
		handleUploadMedia,
	)

	// 2. Tool: list_media
	s.AddTool(
		mcp.NewTool("list_media",
			mcp.WithDescription("ค้นหาและดูรายการรูปภาพในคลังสื่อ (Media Library) เพื่อนำ URL รูปภาพเดิมกลับมาใช้ซ้ำในข่าว หน้าเพจ หรือแบนเนอร์"),
			mcp.WithNumber("limit", mcp.Description("จำนวนรูปภาพที่ต้องการดึง (ค่าเริ่มต้น 20)")),
		),
		handleListMedia,
	)

	// ==========================================
	// หมวด 2: Pages & Block Layouts (หน้าเพจ & เมนู)
	// ==========================================

	// 3. Tool: create_or_update_page
	s.AddTool(
		mcp.NewTool("create_or_update_page",
			mcp.WithDescription("สร้างหรือปรับปรุงหน้าเนื้อหาถาวรของโรงเรียน (Page) พร้อมจัดวาง Layout ด้วย Block สำเร็จรูป (เช่น Hero, Stats, Feature Grid, FAQ, Person Cards) และสามารถสั่งเอาขึ้น Navbar เมนูด้านบนได้ทันที"),
			mcp.WithString("title", mcp.Required(), mcp.Description("ชื่อหน้าเพจ เช่น หลักสูตรความเป็นเลิศปัญญาประดิษฐ์")),
			mcp.WithString("slug", mcp.Description("URL Slug ภาษาอังกฤษ เช่น ai-robotics (หากไม่ระบุจะถูกสร้างอัตโนมัติจาก Title)")),
			mcp.WithString("layout_type", mcp.Description("ประเภทของเลย์เอาต์ เช่น 'blocks' (แนะนำ) หรือ 'standard'")),
			mcp.WithString("layout_data", mcp.Required(), mcp.Description("JSON Array ของ Block Components ตามสเปกใน Resource school://blocks/catalog")),
			mcp.WithString("content", mcp.Description("เนื้อหาฉบับย่อหรือ Plain text fallback สำหรับการค้นหา")),
			mcp.WithBoolean("publish", mcp.Description("เผยแพร่ทันที (true) หรือบันทึกเป็นฉบับร่าง draft (false)")),
			mcp.WithBoolean("show_in_menu", mcp.Description("นำหน้าเพจนี้ขึ้นแสดงบน Navigation Bar ของเว็บไซต์ทันทีหรือไม่ (true/false)")),
			mcp.WithString("menu_title", mcp.Description("ข้อความสั้นบนปุ่มเมนู Navbar (เช่น 'หลักสูตร AI') หากไม่ระบุจะใช้ Title")),
			mcp.WithNumber("menu_order", mcp.Description("ลำดับการแสดงผลบนเมนู (ตัวเลขน้อยแสดงก่อน)")),
			mcp.WithString("menu_parent", mcp.Description("จัดเป็นเมนูย่อย Dropdown ใต้หมวดหมู่ใด (เช่น 'about' หรือเว้นว่างไว้เพื่อเป็นเมนูหลัก)")),
			mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent")),
		),
		handleCreateOrUpdatePage,
	)

	// 4. Tool: get_page
	s.AddTool(
		mcp.NewTool("get_page",
			mcp.WithDescription("ดึงข้อมูลและโค้ดบล็อก (Layout Data) ของหน้าเพจตาม ID หรือ Slug เพื่อนำมาตรวจสอบหรือต่อยอดแก้ไข"),
			mcp.WithString("slug_or_id", mcp.Required(), mcp.Description("Slug หรือ ID ของหน้าเพจ")),
		),
		handleGetPage,
	)

	// 5. Tool: delete_page
	s.AddTool(
		mcp.NewTool("delete_page",
			mcp.WithDescription("ลบหน้าเพจที่ไม่ต้องการออกจากระบบ (ระบบจะปลดออกจาก Navbar อัตโนมัติ)"),
			mcp.WithString("slug_or_id", mcp.Required(), mcp.Description("Slug หรือ ID ของหน้าเพจที่ต้องการลบ")),
		),
		handleDeletePage,
	)

	// 6. Tool: list_pages
	s.AddTool(
		mcp.NewTool("list_pages",
			mcp.WithDescription("ดึงรายการหน้าเพจทั้งหมดของโรงเรียน เพื่อดูโครงสร้าง Slug และสถานะการแสดงผลบน Navbar"),
		),
		handleListPages,
	)

	// ==========================================
	// หมวด 3: Posts & Articles (ข่าวสารและบทความ)
	// ==========================================

	// 7. Tool: create_school_post
	s.AddTool(
		mcp.NewTool("create_school_post",
			mcp.WithDescription("สร้างข่าวสาร ประชาสัมพันธ์ หรือประกาศด่วนของโรงเรียน"),
			mcp.WithString("title", mcp.Required(), mcp.Description("หัวข้อข่าว")),
			mcp.WithString("category", mcp.Description("หมวดหมู่ข่าว เช่น 'วิชาการ', 'กิจกรรม', 'ข่าวสาร AI', 'ทั่วไป'")),
			mcp.WithString("summary", mcp.Description("เนื้อหาสรุปย่อ 2-3 บรรทัดสำหรับการแสดงบนการ์ดหน้าแรก")),
			mcp.WithString("content", mcp.Required(), mcp.Description("เนื้อหาข่าวฉบับเต็ม (รองรับ Markdown)")),
			mcp.WithString("image_url", mcp.Description("URL รูปภาพปกข่าว")),
			mcp.WithBoolean("publish", mcp.Description("เผยแพร่ทันที (true) หรือบันทึกเป็น draft (false)")),
			mcp.WithString("agent_name", mcp.Description("ชื่อของ AI Agent")),
		),
		handleCreatePost,
	)

	// 8. Tool: update_school_post
	s.AddTool(
		mcp.NewTool("update_school_post",
			mcp.WithDescription("แก้ไขเนื้อหา ข้อมูล หรือสถานะของข่าวสารเดิมที่มีอยู่ในระบบ"),
			mcp.WithString("id_or_slug", mcp.Required(), mcp.Description("ID หรือ Slug ของข่าวที่ต้องการแก้ไข")),
			mcp.WithString("title", mcp.Description("หัวข้อข่าวใหม่ (หากต้องการเปลี่ยน)")),
			mcp.WithString("category", mcp.Description("หมวดหมู่ข่าวใหม่")),
			mcp.WithString("summary", mcp.Description("ข้อความสรุปย่อใหม่")),
			mcp.WithString("content", mcp.Description("เนื้อหาข่าวฉบับเต็มใหม่")),
			mcp.WithString("image_url", mcp.Description("URL รูปภาพปกข่าวใหม่")),
			mcp.WithBoolean("publish", mcp.Description("เปลี่ยนสถานะเป็น published (true) หรือ draft (false)")),
		),
		handleUpdatePost,
	)

	// 9. Tool: get_school_post
	s.AddTool(
		mcp.NewTool("get_school_post",
			mcp.WithDescription("อ่านเนื้อหาฉบับเต็มและสถิติของข่าวตาม ID หรือ Slug เพื่อให้ Agent นำข้อมูลไปวิเคราะห์หรือรีไรท์"),
			mcp.WithString("id_or_slug", mcp.Required(), mcp.Description("ID หรือ Slug ของข่าว")),
		),
		handleGetPost,
	)

	// 10. Tool: delete_school_post
	s.AddTool(
		mcp.NewTool("delete_school_post",
			mcp.WithDescription("ลบข่าวสารออกจากระบบตาม ID หรือ Slug"),
			mcp.WithString("id_or_slug", mcp.Required(), mcp.Description("ID หรือ Slug ของข่าวที่ต้องการลบ")),
		),
		handleDeletePost,
	)

	// 11. Tool: list_recent_posts
	s.AddTool(
		mcp.NewTool("list_recent_posts",
			mcp.WithDescription("ดึงรายการข่าวสารล่าสุดของโรงเรียน เพื่อใช้อ่านเป็น Context ในการเขียนข่าวหรือป้องกันการสร้างข่าวซ้ำ"),
			mcp.WithNumber("limit", mcp.Description("จำนวนข่าวที่ต้องการดึง (ค่าเริ่มต้น 10)")),
			mcp.WithString("category", mcp.Description("กรองตามหมวดหมู่ (เช่น 'วิชาการ', 'กิจกรรม')")),
		),
		handleListPosts,
	)

	// ==========================================
	// หมวด 4: Homepage & Site Navigation Customizer
	// ==========================================

	// 12. Tool: get_homepage_config
	s.AddTool(
		mcp.NewTool("get_homepage_config",
			mcp.WithDescription("อ่านโครงสร้างและการตั้งค่าหน้าแรก (Hero Banner, ประกาศข่าวด่วน, Sections ที่เปิดใช้งาน, บล็อกพิเศษ)"),
		),
		handleGetHomepageConfig,
	)

	// 13. Tool: update_homepage_config
	s.AddTool(
		mcp.NewTool("update_homepage_config",
			mcp.WithDescription("ปรับแต่งการแสดงผลของหน้าแรก (Site Editor) เช่น เปลี่ยนพาดหัว Hero Banner, ข้อความประกาศด่วน, หรือเปิด/ปิด Section ต่างๆ"),
			mcp.WithString("hero_heading", mcp.Description("พาดหัวใหญ่ใน Hero Banner")),
			mcp.WithString("hero_subheading", mcp.Description("คำขวัญหรือข้อความสนับสนุน")),
			mcp.WithString("hero_badge", mcp.Description("ข้อความป้าย Badge")),
			mcp.WithString("hero_primary_cta", mcp.Description("ข้อความบนปุ่มกดหลัก")),
			mcp.WithString("hero_primary_url", mcp.Description("ลิงก์ปลายทางของปุ่มกดหลัก")),
			mcp.WithString("hero_image_url", mcp.Description("URL ภาพพื้นหลังหรือภาพแบนเนอร์")),
			mcp.WithString("announcement", mcp.Description("ข้อความแถบวิ่งข่าวด่วน (Ticker)")),
			mcp.WithBoolean("show_ticker", mcp.Description("เปิด/ปิดแถบข่าวด่วน")),
			mcp.WithBoolean("show_slider", mcp.Description("เปิด/ปิดสไลด์ข่าวแนะนำ")),
			mcp.WithBoolean("show_eservices", mcp.Description("เปิด/ปิดพอร์ทัลบริการ E-Service")),
			mcp.WithBoolean("show_recent_news", mcp.Description("เปิด/ปิดเซกชันข่าวล่าสุด")),
			mcp.WithString("custom_blocks", mcp.Description("JSON Array ของ Block พิเศษที่ต้องการแทรกในหน้าแรก")),
		),
		handleUpdateHomepageConfig,
	)

	// 14. Tool: manage_navigation_menu
	s.AddTool(
		mcp.NewTool("manage_navigation_menu",
			mcp.WithDescription("จัดการเมนูนำทาง (Navigation Bar) ของเว็บไซต์: ตรวจสอบเมนู, เพิ่มหน้าเพจเข้าเมนู, ปลดหน้าเพจออก หรือรีเซ็ตเมนู"),
			mcp.WithString("action", mcp.Required(), mcp.Description("การกระทำ: 'get' (ดูเมนูปัจจุบัน), 'add_page' (เพิ่มเพจเข้าเมนู), 'remove_page' (ปลดเพจออกจากเมนู), 'reset' (รีเซ็ตเป็นค่าเริ่มต้น)")),
			mcp.WithString("slug", mcp.Description("Slug ของหน้าเพจ (สำหรับ action 'add_page' หรือ 'remove_page')")),
			mcp.WithString("title", mcp.Description("ชื่อปุ่มเมนูที่ต้องการแสดง")),
			mcp.WithString("parent", mcp.Description("ระบุ Parent Dropdown เช่น 'about'")),
			mcp.WithNumber("order", mcp.Description("ลำดับของเมนู")),
		),
		handleManageNavigationMenu,
	)

	// ==========================================
	// หมวด 5: School Identity & Site Settings (อัตลักษณ์ โลโก้ และ Favicon)
	// ==========================================

	// 15. Tool: get_site_settings
	s.AddTool(
		mcp.NewTool("get_site_settings",
			mcp.WithDescription("อ่านการตั้งค่าอัตลักษณ์และข้อมูลหลักของโรงเรียน (ชื่อโรงเรียน, สังกัด, URL โลโก้ school logo, URL Favicon สำหรับแท็บเบราว์เซอร์)"),
		),
		handleGetSiteSettings,
	)

	// 16. Tool: update_site_settings
	s.AddTool(
		mcp.NewTool("update_site_settings",
			mcp.WithDescription("ปรับปรุงการตั้งค่าอัตลักษณ์และ SEO ของโรงเรียน เช่น โลโก้, Favicon, ชื่อโรงเรียน, สังกัด, SEO Title, Description, Keywords, OG Image, Google Site Verification"),
			mcp.WithString("logo_url", mcp.Description("URL รูปภาพโลโก้/ตราสัญลักษณ์โรงเรียน (เช่น /images/ppk-emblem-2d.png หรือ URL ที่อัปโหลดผ่าน upload_media_by_url)")),
			mcp.WithString("favicon_url", mcp.Description("URL รูปภาพ Favicon สำหรับแท็บเบราว์เซอร์ (เช่น /images/ppk-emblem-2d.png หรือ URL ที่อัปโหลดผ่าน upload_media_by_url)")),
			mcp.WithString("school_name", mcp.Description("ชื่อโรงเรียนภาษาไทย")),
			mcp.WithString("school_name_en", mcp.Description("ชื่อโรงเรียนภาษาอังกฤษ")),
			mcp.WithString("school_subtitle", mcp.Description("ข้อความสังกัดหรือคำขวัญย่อย")),
			mcp.WithString("seo_title", mcp.Description("พาดหัว SEO ประจำเว็บไซต์")),
			mcp.WithString("seo_description", mcp.Description("คำอธิบายเว็บไซต์สำหรับผลการค้นหาบน Search Engine และการแชร์ลิงก์โซเชียล")),
			mcp.WithString("seo_keywords", mcp.Description("คำค้นหาหลัก (Keywords) คั่นด้วยเครื่องหมายจุลภาค")),
			mcp.WithString("og_default_image", mcp.Description("URL รูปภาพเริ่มต้นสำหรับ Open Graph เมื่อแชร์ลิงก์")),
			mcp.WithString("google_site_verification", mcp.Description("รหัสยืนยันตัวตนสำหรับ Google Search Console")),
		),
		handleUpdateSiteSettings,
	)
}

func registerResources(s *server.MCPServer) {
	// Resource 1: school://blocks/catalog
	resBlocks := mcp.NewResource(
		"school://blocks/catalog",
		"School CMS Layout Blocks Catalog",
		mcp.WithResourceDescription("คู่มือระบุโครงสร้าง JSON และ Props ของ Block Components ทั้งหมดสำหรับการจัดหน้าเพจและหน้าแรก"),
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
		mcp.WithResourceDescription("แนวทางการเขียนข่าวและการจัดหน้านโยบายโรงเรียน"),
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

	// Resource 3: school://settings
	resSettings := mcp.NewResource(
		"school://settings",
		"School Identity & Site Settings",
		mcp.WithResourceDescription("การตั้งค่าอัตลักษณ์โรงเรียน เช่น ชื่อโรงเรียน, URL โลโก้, URL Favicon, และสังกัด"),
		mcp.WithMIMEType("application/json"),
	)
	s.AddResource(resSettings, func(ctx context.Context, request mcp.ReadResourceRequest) ([]mcp.ResourceContents, error) {
		settings := handlers.GetSiteSettingsInternal()
		b, _ := json.MarshalIndent(settings, "", "  ")
		return []mcp.ResourceContents{
			mcp.TextResourceContents{
				URI:      "school://settings",
				MIMEType: "application/json",
				Text:     string(b),
			},
		}, nil
	})
}

// ==========================================
// Handlers Implementation
// ==========================================

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

func handleListMedia(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	limit := 20
	if l := request.GetInt("limit", 20); l > 0 && l <= 100 {
		limit = l
	}

	var mediaList []models.Media
	if err := db.DB.Order("created_at DESC").Limit(limit).Find(&mediaList).Error; err != nil {
		return mcp.NewToolResultError("Failed to list media: " + err.Error()), nil
	}

	b, _ := json.MarshalIndent(mediaList, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
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
	showInMenu := request.GetBool("show_in_menu", false)
	menuTitle := request.GetString("menu_title", "")
	menuOrder := request.GetInt("menu_order", 0)
	menuParent := request.GetString("menu_parent", "")
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
		existing.ShowInMenu = showInMenu
		if menuTitle != "" {
			existing.MenuTitle = menuTitle
		}
		if menuOrder != 0 {
			existing.MenuOrder = menuOrder
		}
		if menuParent != "" {
			existing.MenuParent = menuParent
		}
		existing.CreatedByAgent = true
		existing.AgentName = agentName
		existing.UpdatedAt = time.Now()

		if err := db.DB.Save(&existing).Error; err != nil {
			return mcp.NewToolResultError("Failed to update page: " + err.Error()), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Page updated successfully!\nID: %d\nSlug: %s\nStatus: %s\nShowInMenu: %t\nURL: /page/%s", existing.ID, existing.Slug, existing.Status, existing.ShowInMenu, existing.Slug)), nil
	}

	// Create new
	page := models.Page{
		Title:          title,
		Slug:           slug,
		LayoutType:     layoutType,
		LayoutData:     layoutData,
		Content:        content,
		Status:         status,
		ShowInMenu:     showInMenu,
		MenuTitle:      menuTitle,
		MenuOrder:      menuOrder,
		MenuParent:     menuParent,
		CreatedByAgent: true,
		AgentName:      agentName,
	}

	if err := db.DB.Create(&page).Error; err != nil {
		return mcp.NewToolResultError("Failed to create page: " + err.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("Page created successfully!\nID: %d\nSlug: %s\nStatus: %s\nShowInMenu: %t\nURL: /page/%s", page.ID, page.Slug, page.Status, page.ShowInMenu, page.Slug)), nil
}

func handleGetPage(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	slugOrID, err := request.RequireString("slug_or_id")
	if err != nil {
		return mcp.NewToolResultError("slug_or_id is required"), nil
	}

	var page models.Page
	var dbErr error
	if id, err := strconv.ParseUint(slugOrID, 10, 64); err == nil {
		dbErr = db.DB.Where("id = ?", id).First(&page).Error
	} else {
		dbErr = db.DB.Where("slug = ?", slugOrID).First(&page).Error
	}

	if dbErr != nil {
		return mcp.NewToolResultError("Page not found: " + dbErr.Error()), nil
	}

	b, _ := json.MarshalIndent(page, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}

func handleDeletePage(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	slugOrID, err := request.RequireString("slug_or_id")
	if err != nil {
		return mcp.NewToolResultError("slug_or_id is required"), nil
	}

	var res error
	if id, err := strconv.ParseUint(slugOrID, 10, 64); err == nil {
		res = db.DB.Where("id = ?", id).Delete(&models.Page{}).Error
	} else {
		res = db.DB.Where("slug = ?", slugOrID).Delete(&models.Page{}).Error
	}

	if res != nil {
		return mcp.NewToolResultError("Failed to delete page: " + res.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("Page '%s' deleted successfully", slugOrID)), nil
}

func handleListPages(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	var pages []models.Page
	if err := db.DB.Order("menu_order ASC, id ASC").Find(&pages).Error; err != nil {
		return mcp.NewToolResultError("Failed to list pages: " + err.Error()), nil
	}

	b, _ := json.MarshalIndent(pages, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
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

func handleUpdatePost(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	idOrSlug, err := request.RequireString("id_or_slug")
	if err != nil {
		return mcp.NewToolResultError("id_or_slug is required"), nil
	}

	var post models.Post
	var dbErr error
	if id, err := strconv.ParseUint(idOrSlug, 10, 64); err == nil {
		dbErr = db.DB.Where("id = ?", id).First(&post).Error
	} else {
		dbErr = db.DB.Where("slug = ?", idOrSlug).First(&post).Error
	}

	if dbErr != nil {
		return mcp.NewToolResultError("Post not found: " + dbErr.Error()), nil
	}

	if title := request.GetString("title", ""); title != "" {
		post.Title = title
	}
	if category := request.GetString("category", ""); category != "" {
		post.Category = category
	}
	if summary := request.GetString("summary", ""); summary != "" {
		post.Summary = summary
	}
	if content := request.GetString("content", ""); content != "" {
		post.Content = content
	}
	if img := request.GetString("image_url", ""); img != "" {
		post.ImageURL = img
	}

	// Check if publish boolean was supplied
	if args, ok := request.Params.Arguments.(map[string]any); ok {
		if val, exists := args["publish"]; exists {
			if b, ok := val.(bool); ok {
				if b {
					post.Status = "published"
				} else {
					post.Status = "draft"
				}
			}
		}
	}
	post.UpdatedAt = time.Now()

	if err := db.DB.Save(&post).Error; err != nil {
		return mcp.NewToolResultError("Failed to update post: " + err.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("Post updated successfully!\nID: %d\nSlug: %s\nStatus: %s", post.ID, post.Slug, post.Status)), nil
}

func handleGetPost(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	idOrSlug, err := request.RequireString("id_or_slug")
	if err != nil {
		return mcp.NewToolResultError("id_or_slug is required"), nil
	}

	var post models.Post
	var dbErr error
	if id, err := strconv.ParseUint(idOrSlug, 10, 64); err == nil {
		dbErr = db.DB.Where("id = ?", id).First(&post).Error
	} else {
		dbErr = db.DB.Where("slug = ?", idOrSlug).First(&post).Error
	}

	if dbErr != nil {
		return mcp.NewToolResultError("Post not found: " + dbErr.Error()), nil
	}

	b, _ := json.MarshalIndent(post, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}

func handleDeletePost(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	idOrSlug, err := request.RequireString("id_or_slug")
	if err != nil {
		return mcp.NewToolResultError("id_or_slug is required"), nil
	}

	var res error
	if id, err := strconv.ParseUint(idOrSlug, 10, 64); err == nil {
		res = db.DB.Where("id = ?", id).Delete(&models.Post{}).Error
	} else {
		res = db.DB.Where("slug = ?", idOrSlug).Delete(&models.Post{}).Error
	}

	if res != nil {
		return mcp.NewToolResultError("Failed to delete post: " + res.Error()), nil
	}

	return mcp.NewToolResultText(fmt.Sprintf("Post '%s' deleted successfully", idOrSlug)), nil
}

func handleListPosts(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	limit := 10
	if l := request.GetInt("limit", 10); l > 0 && l <= 50 {
		limit = l
	}
	category := request.GetString("category", "")

	query := db.DB.Order("created_at DESC")
	if category != "" {
		query = query.Where("category = ?", category)
	}

	var posts []models.Post
	if err := query.Limit(limit).Find(&posts).Error; err != nil {
		return mcp.NewToolResultError("Failed to list posts: " + err.Error()), nil
	}

	b, _ := json.MarshalIndent(posts, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}

func handleGetHomepageConfig(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	cfg := handlers.GetHomepageConfigInternal()
	b, _ := json.MarshalIndent(cfg, "", "  ")
	return mcp.NewToolResultText(string(b)), nil
}

func handleUpdateHomepageConfig(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	cfg := handlers.GetHomepageConfigInternal()

	if h := request.GetString("hero_heading", ""); h != "" {
		cfg.Hero.Heading = h
	}
	if s := request.GetString("hero_subheading", ""); s != "" {
		cfg.Hero.Subheading = s
	}
	if b := request.GetString("hero_badge", ""); b != "" {
		cfg.Hero.Badge = b
	}
	if cta := request.GetString("hero_primary_cta", ""); cta != "" {
		cfg.Hero.PrimaryCTA = cta
	}
	if url := request.GetString("hero_primary_url", ""); url != "" {
		cfg.Hero.PrimaryURL = url
	}
	if img := request.GetString("hero_image_url", ""); img != "" {
		cfg.Hero.ImageURL = img
	}
	if a := request.GetString("announcement", ""); a != "" {
		cfg.Announcement = a
	}
	args, _ := request.Params.Arguments.(map[string]any)
	if args != nil {
		if val, ok := args["show_ticker"]; ok {
			if b, ok := val.(bool); ok {
				cfg.ShowTicker = b
			}
		}
		if val, ok := args["show_slider"]; ok {
			if b, ok := val.(bool); ok {
				cfg.ShowSlider = b
			}
		}
		if val, ok := args["show_eservices"]; ok {
			if b, ok := val.(bool); ok {
				cfg.ShowEServices = b
			}
		}
		if val, ok := args["show_recent_news"]; ok {
			if b, ok := val.(bool); ok {
				cfg.ShowRecentNews = b
			}
		}
	}
	if cb := request.GetString("custom_blocks", ""); cb != "" {
		cfg.CustomBlocks = cb
	}

	if err := handlers.SaveHomepageConfigInternal(cfg); err != nil {
		return mcp.NewToolResultError("Failed to save homepage config: " + err.Error()), nil
	}

	resJSON, _ := json.MarshalIndent(cfg, "", "  ")
	return mcp.NewToolResultText("Homepage configuration updated successfully!\n" + string(resJSON)), nil
}

func handleManageNavigationMenu(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	action, err := request.RequireString("action")
	if err != nil {
		return mcp.NewToolResultError("action is required ('get', 'add_page', 'remove_page', 'reset')"), nil
	}

	switch strings.ToLower(action) {
	case "reset":
		_ = db.DB.Where("key = ?", "nav_menu").Delete(&models.Setting{})
		return mcp.NewToolResultText("Navigation menu has been reset to dynamic defaults."), nil

	case "add_page":
		slug, err := request.RequireString("slug")
		if err != nil {
			return mcp.NewToolResultError("slug is required for add_page"), nil
		}

		var page models.Page
		if err := db.DB.Where("slug = ?", slug).First(&page).Error; err != nil {
			return mcp.NewToolResultError("Page with slug '" + slug + "' not found"), nil
		}

		page.ShowInMenu = true
		if title := request.GetString("title", ""); title != "" {
			page.MenuTitle = title
		}
		if parent := request.GetString("parent", ""); parent != "" {
			page.MenuParent = parent
		}
		if order := request.GetInt("order", 0); order != 0 {
			page.MenuOrder = order
		}
		if err := db.DB.Save(&page).Error; err != nil {
			return mcp.NewToolResultError("Failed to update page menu flag: " + err.Error()), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Page '%s' (%s) added to navigation menu successfully!", page.Title, page.Slug)), nil

	case "remove_page":
		slug, err := request.RequireString("slug")
		if err != nil {
			return mcp.NewToolResultError("slug is required for remove_page"), nil
		}

		res := db.DB.Model(&models.Page{}).Where("slug = ?", slug).Update("show_in_menu", false)
		if res.Error != nil {
			return mcp.NewToolResultError("Failed to remove page from menu: " + res.Error.Error()), nil
		}

		return mcp.NewToolResultText(fmt.Sprintf("Page '%s' removed from navigation menu.", slug)), nil

	case "get":
		fallthrough
	default:
		// Return current dynamic menu
		var pages []models.Page
		_ = db.DB.Where("show_in_menu = ? AND status = ?", true, "published").Find(&pages)

		res := map[string]any{
			"base_routes": []string{"home", "about", "eservice", "news", "contact"},
			"menu_pages":  pages,
		}
		b, _ := json.MarshalIndent(res, "", "  ")
		return mcp.NewToolResultText(string(b)), nil
	}
}

func handleGetSiteSettings(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	settings := handlers.GetSiteSettingsInternal()
	resJSON, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return mcp.NewToolResultError("Failed to encode settings: " + err.Error()), nil
	}
	return mcp.NewToolResultText(string(resJSON)), nil
}

func handleUpdateSiteSettings(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	req := models.UpdateSiteSettingsRequest{}
	args := request.GetArguments()
	if args != nil {
		if val, ok := args["school_name"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SchoolName = &v
			}
		}
		if val, ok := args["school_name_en"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SchoolNameEn = &v
			}
		}
		if val, ok := args["school_subtitle"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SchoolSubtitle = &v
			}
		}
		if val, ok := args["logo_url"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.LogoURL = &v
			}
		}
		if val, ok := args["favicon_url"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.FaviconURL = &v
			}
		}
		if val, ok := args["seo_title"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SeoTitle = &v
			}
		}
		if val, ok := args["seo_description"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SeoDescription = &v
			}
		}
		if val, ok := args["seo_keywords"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.SeoKeywords = &v
			}
		}
		if val, ok := args["og_default_image"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.OgDefaultImage = &v
			}
		}
		if val, ok := args["google_site_verification"]; ok {
			if s, ok := val.(string); ok && strings.TrimSpace(s) != "" {
				v := strings.TrimSpace(s)
				req.GoogleSiteVerification = &v
			}
		}
	}

	updated, err := handlers.SaveSiteSettingsInternal(req)
	if err != nil {
		return mcp.NewToolResultError("Failed to update site settings: " + err.Error()), nil
	}

	resJSON, _ := json.MarshalIndent(updated, "", "  ")
	return mcp.NewToolResultText("School identity & site settings updated successfully!\n" + string(resJSON)), nil
}
