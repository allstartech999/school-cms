package db

import (
	"fmt"
	"log"
	"os"
	"school-cms/models"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes PostgreSQL connection exclusively
func InitDB() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "server.krufame.work"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "school_cms"
		}
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "school_cms"
		}
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}
		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Bangkok",
			host, port, user, password, dbname, sslmode)
	}

	log.Printf("Connecting to PostgreSQL at %s (%s)...", os.Getenv("DB_HOST"), os.Getenv("DB_NAME"))

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	sqlDB, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get generic database object: %w", err)
	}

	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrate tables on PostgreSQL
	if err := database.AutoMigrate(&models.Post{}, &models.Page{}, &models.Setting{}); err != nil {
		return nil, fmt.Errorf("failed to migrate tables: %w", err)
	}

	DB = database

	// Seed initial data if empty
	seedInitialData(database)

	return database, nil
}

func seedInitialData(database *gorm.DB) {
	var postCount int64
	database.Model(&models.Post{}).Count(&postCount)

	if postCount == 0 {
		initialPosts := []models.Post{
			{
				Title:          "ยินดีต้อนรับสู่ปีการศึกษาใหม่ ก้าวสู่ความเป็นเลิศทางวิชาการและคุณธรรม",
				Slug:           "welcome-new-semester",
				Category:       "วิชาการ",
				Summary:        "โรงเรียนยินดีต้อนรับนักเรียนและผู้ปกครองทุกท่านสู่การเปิดภาคเรียนใหม่ ด้วยหลักสูตรที่ทันสมัยและสภาพแวดล้อมที่เอื้อต่อการเรียนรู้",
				Content:        "โรงเรียนมีความพร้อมในทุกด้านสำหรับการเปิดภาคเรียนใหม่ ทั้งด้านอาคารสถานที่ สื่อการเรียนรู้ดิจิทัล และทีมคุณครูผู้เชี่ยวชาญ ขอให้นักเรียนทุกคนตั้งใจศึกษาเล่าเรียนและมีความสุขกับการเรียนรู้ตลอดปีการศึกษานี้",
				ImageURL:       "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80",
				Author:         "ฝ่ายวิชาการ",
				CreatedByAgent: false,
				Status:         "published",
			},
			{
				Title:          "ประกาศการแข่งขันโครงงานวิทยาศาสตร์และเทคโนโลยีประจำปีการศึกษา",
				Slug:           "science-fair-announcement",
				Category:       "กิจกรรม",
				Summary:        "ขอเชิญชวนนักเรียนทุกระดับชั้นเข้าร่วมส่งผลงานสิ่งประดิษฐ์และโครงงานวิทยาศาสตร์ ชิงทุนการศึกษาและเกียรติบัตร",
				Content:        "เพื่อส่งเสริมความคิดสร้างสรรค์และทักษะด้าน STEM และนวัตกรรม ทางกลุ่มสาระวิทยาศาสตร์ขอเชิญชวนนักเรียนที่สนใจ ส่งหัวข้อโครงงานได้ตั้งแต่วันนี้ถึงสิ้นเดือน ณ ห้องปฏิบัติการวิทยาศาสตร์",
				ImageURL:       "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&auto=format&fit=crop&q=80",
				Author:         "กลุ่มสาระวิทยาศาสตร์",
				CreatedByAgent: false,
				Status:         "published",
			},
		}
		database.Create(&initialPosts)
	}

	var pageCount int64
	database.Model(&models.Page{}).Count(&pageCount)
	if pageCount == 0 {
		initialPages := []models.Page{
			{
				Title:   "เกี่ยวกับโรงเรียน",
				Slug:    "about",
				Content: "โรงเรียนสาธิตนวัตกรรมวิทยาการ ก่อตั้งขึ้นเพื่อมุ่งเน้นการพัฒนาผู้เรียนให้มีความรู้คู่คุณธรรม มีทักษะในศตวรรษที่ 21 และก้าวทันเทคโนโลยีปัญญาประดิษฐ์ (AI)",
				Status:  "published",
			},
			{
				Title:   "ติดต่อเรา",
				Slug:    "contact",
				Content: "ที่อยู่: 123 ถนนวิทยพัฒน์ แขวงการศึกษา เขตนวัตกรรม กรุงเทพฯ 10100\nโทรศัพท์: 02-123-4567\nอีเมล: contact@school-demo.ac.th",
				Status:  "published",
			},
		}
		database.Create(&initialPages)
	}

	// Seed settings if not present
	defaultSettings := []models.Setting{
		{Key: "admin_password", Value: "admin123"},
		{Key: "agent_key", Value: "agent-school-secret-key-2026"},
		{Key: "school_name", Value: "โรงเรียนสาธิตนวัตกรรมวิทยาการ"},
	}

	for _, s := range defaultSettings {
		var existing models.Setting
		if err := database.Where("key = ?", s.Key).First(&existing).Error; err != nil {
			database.Create(&s)
		}
	}
}
