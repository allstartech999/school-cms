package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"school-cms/db"
	schoolmcp "school-cms/mcp"

	"github.com/joho/godotenv"
	"github.com/mark3labs/mcp-go/mcp"
)

func main() {
	if err := godotenv.Load("../.env"); err != nil {
		_ = godotenv.Load(".env")
	}

	_, err := db.InitDB()
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	server := schoolmcp.NewSchoolMCPServer()
	ctx := context.Background()

	fmt.Println("🚀 Testing School CMS MCP Server...")

	// 1. Test upload_media_by_url
	fmt.Println("\n📸 [1/3] Testing Tool: upload_media_by_url...")
	uploadTool := server.GetTool("upload_media_by_url")
	if uploadTool == nil {
		log.Fatalf("Tool upload_media_by_url not found")
	}

	uploadReq := mcp.CallToolRequest{}
	uploadReq.Params.Name = "upload_media_by_url"
	uploadReq.Params.Arguments = map[string]any{
		"source_url": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80",
		"alt_text":   "นักเรียนห้องปฏิบัติการหุ่นยนต์และปัญญาประดิษฐ์",
		"agent_name": "Claude AI Architect",
	}

	uploadRes, err := uploadTool.Handler(ctx, uploadReq)
	if err != nil || uploadRes.IsError {
		log.Fatalf("upload_media_by_url failed: %v", uploadRes)
	}
	fmt.Println("✅ Result:", uploadRes.Content[0])

	// 2. Test create_or_update_page with full Block Layout
	fmt.Println("\n📐 [2/3] Testing Tool: create_or_update_page (Block-Based Layout)...")
	pageTool := server.GetTool("create_or_update_page")
	if pageTool == nil {
		log.Fatalf("Tool create_or_update_page not found")
	}

	blocksJSON := `[
		{
			"type": "hero_banner",
			"props": {
				"variant": "split",
				"badge": "เปิดรับสมัครปีการศึกษา 2569",
				"heading": "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์ (AI & Robotics)",
				"subheading": "บ่มเพาะทักษะนักนวัตกรรมรุ่นเยาว์สู่เวทีการแข่งขันระดับโลก ด้วยแล็บทันสมัย 1:1",
				"ctaText": "สมัครเรียนออนไลน์",
				"ctaUrl": "#apply",
				"imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80"
			}
		},
		{
			"type": "stats_bar",
			"props": {
				"title": "ผลการดำเนินงานและความสำเร็จ",
				"items": [
					{ "value": "100%", "label": "อัตราการศึกษาต่อระดับอุดมศึกษา" },
					{ "value": "18+", "label": "รางวัลหุ่นยนต์และนวัตกรรมระดับชาติ" },
					{ "value": "1:1", "label": "ชุดอุปกรณ์ไมโครบอร์ดต่อผู้เรียน" },
					{ "value": "0 บาท", "label": "ทุนสนับสนุนค่าอุปกรณ์ตลอดหลักสูตร" }
				]
			}
		},
		{
			"type": "feature_grid",
			"props": {
				"title": "3 เสาหลักแห่งการเรียนรู้ (Curriculum Pillars)",
				"subtitle": "โครงสร้างการจัดการเรียนการสอนที่เน้นการลงมือปฏิบัติจริง (Hands-on Active Learning)",
				"columns": 3,
				"items": [
					{
						"icon": "Brain",
						"title": "Fundamental AI & Python",
						"desc": "ปูพื้นฐานการเขียนโปรแกรม การจัดการข้อมูล Data Science และ Machine Learning เบื้องต้น"
					},
					{
						"icon": "Cpu",
						"title": "Hardware & Embedded Systems",
						"desc": "การต่อวงจรไมโครคอนโทรลเลอร์ เซนเซอร์ และระบบควบคุมอัตโนมัติ (IoT & Automation)"
					},
					{
						"icon": "Rocket",
						"title": "Innovation Capstone Project",
						"desc": "พัฒนาโครงงานแก้ปัญหาชุมชนหรือสร้างนวัตกรรมเพื่อส่งแข่งขันระดับประเทศ"
					}
				]
			}
		},
		{
			"type": "accordion_faq",
			"props": {
				"title": "คำถามที่พบบ่อย (FAQ)",
				"subtitle": "ข้อมูลประกอบการตัดสินใจสำหรับผู้ปกครองและนักเรียน",
				"items": [
					{
						"q": "นักเรียนที่ไม่มีพื้นฐานการเขียนโค้ดมาก่อน สามารถเรียนได้หรือไม่?",
						"a": "สามารถเรียนได้อย่างแน่นอน เพราะหลักสูตรมีการจัดค่ายปรับพื้นฐาน Logic และภาษา Python ตั้งแต่เริ่มต้น"
					},
					{
						"q": "การสนับสนุนอุปกรณ์และห้องปฏิบัติการเป็นอย่างไร?",
						"a": "โรงเรียนมีห้องแล็บเฉพาะทางพร้อมเครื่องคอมพิวเตอร์ประสิทธิภาพสูง และบอร์ดทดลอง 1 คนต่อ 1 ชุด"
					}
				]
			}
		}
	]`

	pageReq := mcp.CallToolRequest{}
	pageReq.Params.Name = "create_or_update_page"
	pageReq.Params.Arguments = map[string]any{
		"title":       "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์",
		"slug":        "ai-robotics-curriculum",
		"layout_type": "blocks",
		"layout_data": blocksJSON,
		"content":     "หลักสูตรความเป็นเลิศปัญญาประดิษฐ์และหุ่นยนต์ โรงเรียนโพนงามพิทยานุกูล",
		"publish":     true,
		"agent_name":  "Claude Curriculum Designer",
	}

	pageRes, err := pageTool.Handler(ctx, pageReq)
	if err != nil || pageRes.IsError {
		log.Fatalf("create_or_update_page failed: %v", pageRes)
	}
	fmt.Println("✅ Result:", pageRes.Content[0])

	// 3. Test list_pages
	fmt.Println("\n📋 [3/3] Testing Tool: list_pages...")
	listPagesTool := server.GetTool("list_pages")
	listRes, err := listPagesTool.Handler(ctx, mcp.CallToolRequest{})
	if err != nil || listRes.IsError {
		log.Fatalf("list_pages failed: %v", listRes)
	}
	fmt.Println("✅ Available Pages:\n", listRes.Content[0])

	fmt.Println("\n🎉 All MCP Phase 3 tests completed successfully!")
	os.Exit(0)
}
