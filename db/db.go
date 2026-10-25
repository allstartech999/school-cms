package db

import (
	"fmt"
	"log"
	"os"
	"school-cms/models"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDB initializes PostgreSQL connection exclusively
func InitDB() (*gorm.DB, error) {
	if isTestEnvironment() && os.Getenv("ALLOW_LIVE_DB_TEST") != "true" {
		log.Println("[SAFETY GUARD] Running in test mode! Diverting InitDB() to isolated In-Memory SQLite to protect live database.")
		return InitTestDB()
	}

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
	if err := database.AutoMigrate(&models.Post{}, &models.Page{}, &models.Setting{}, &models.Media{}, &models.User{}, &models.AgentKey{}, &models.Category{}, &models.Extension{}); err != nil {
		return nil, fmt.Errorf("failed to migrate tables: %w", err)
	}

	DB = database

	// Seed initial data if empty
	seedInitialData(database)

	return database, nil
}

func seedInitialData(database *gorm.DB) {
	// If initial database seed was already executed once, do not re-seed deleted data
	var seedFlag models.Setting
	if err := database.Where("key = ?", "initial_seed_completed").First(&seedFlag).Error; err == nil && seedFlag.Value == "true" {
		return
	}

	var postCount int64
	database.Model(&models.Post{}).Count(&postCount)

	if postCount == 0 {
		initialPosts := []models.Post{
			{
				Title:          "โรงเรียนโพนงามพิทยานุกูล คว้ารางวัลระดับดีเด่น การขับเคลื่อนหลักสูตร ต้านทุจริตศึกษา ปีการศึกษา 2568",
				Slug:           "anti-corruption-curriculum-award-2568",
				Category:       "วิชาการ",
				Summary:        "โรงเรียนโพนงามพิทยานุกูล ได้รับการคัดเลือกและรับรางวัลระดับดีเด่น ในการขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ประจำปีการศึกษา 2568 สพม.มหาสารคาม",
				Content:        "โรงเรียนโพนงามพิทยานุกูล สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม มุ่งมั่นปลูกฝังคุณธรรมและความซื่อสัตย์สุจริตให้แก่นักเรียนอย่างต่อเนื่อง ล่าสุดทางโรงเรียนได้รับรางวัลระดับดีเด่น ในโครงการขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ประจำปีการศึกษา 2568 สะท้อนถึงความมุ่งมั่นของคณะผู้บริหาร คณะครู และนักเรียนในการร่วมกันสร้างสังคมคุณธรรมและโปร่งใส",
				ImageURL:       "/images/hero-banner.jpg",
				Author:         "กลุ่มบริหารงานวิชาการ",
				CreatedByAgent: false,
				Status:         "published",
			},
			{
				Title:          "การบริหารสถานศึกษาแบบมีส่วนร่วมเพื่อยกระดับคุณภาพการศึกษา โดยใช้ PPK SMART Model",
				Slug:           "ppk-smart-model-management",
				Category:       "วิชาการ",
				Summary:        "โรงเรียนโพนงามพิทยานุกูล พัฒนานวัตกรรมการบริหารสถานศึกษาด้วยรูปแบบ PPK SMART Model เพื่อเสริมสร้างประสิทธิภาพการเรียนรู้รอบด้าน",
				Content:        "เพื่อการพัฒนาคุณภาพการศึกษาที่ยั่งยืน โรงเรียนโพนงามพิทยานุกูล ได้นำนวัตกรรมการบริหารแบบมีส่วนร่วม 'PPK SMART Model' มาขับเคลื่อนงานทั้ง 4 กลุ่มงาน (วิชาการ, บุคคล, งบประมาณ, บริหารทั่วไป) สอดคล้องกับวิสัยทัศน์ 'เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ'",
				ImageURL:       "/images/news-smart-model.jpg",
				Author:         "นายวัชรินทร์ ติดวงษา ผู้อำนวยการ",
				CreatedByAgent: false,
				Status:         "published",
			},
			{
				Title:          "การพัฒนาการจัดการเรียนรู้เชิงรุก (Active Learning) ด้วยเกมเป็นฐาน รูปแบบ PM SMART MODEL",
				Slug:           "active-learning-pm-smart-model",
				Category:       "กิจกรรม",
				Summary:        "กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ ขับเคลื่อนการเรียนรู้เชิงรุกโดยใช้เกมเป็นฐาน ส่งเสริมทักษะภาษาอังกฤษของนักเรียน",
				Content:        "คณะครูกลุ่มสาระการเรียนรู้ภาษาต่างประเทศ โรงเรียนโพนงามพิทยานุกูล ได้ดำเนินการพัฒนาการจัดกิจกรรมการเรียนรู้ภาษาอังกฤษเชิงรุก (Active Learning) ด้วยเกมเป็นฐาน ผ่านโมเดล 'PM SMART MODEL' ส่งผลให้นักเรียนเกิดความสนุกสนาน กล้าแสดงออก และมีเจตคติที่ดีต่อการสื่อสารภาษาอังกฤษ",
				ImageURL:       "/images/news-active-learning.jpg",
				Author:         "กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ",
				CreatedByAgent: false,
				Status:         "published",
			},
			{
				Title:          "ขอเชิญชวนศิษย์เก่าโรงเรียนโพนงามพิทยานุกูล ร่วมลงทะเบียนผ่านระบบ PPK Alumni",
				Slug:           "ppk-alumni-network-invitation",
				Category:       "กิจกรรม",
				Summary:        "เปิดให้บริการระบบเครือข่ายทำเนียบศิษย์เก่าออนไลน์ เพื่อเชื่อมความสัมพันธ์และร่วมพัฒนาสถานศึกษา",
				Content:        "โรงเรียนโพนงามพิทยานุกูล ขอเชิญชวนศิษย์เก่าทุกรุ่น ร่วมลงทะเบียนฐานข้อมูลศิษย์เก่าผ่านระบบ E-Service (PPK Alumni) ที่ https://alumni.ppks.ac.th เพื่อสร้างเครือข่ายความร่วมมือ อัพเดตข่าวสาร และร่วมเป็นพลังในการพัฒนาคุณภาพการศึกษาของน้องๆ รุ่นต่อไป",
				ImageURL:       "/images/banner-alumni.png",
				Author:         "งานประชาสัมพันธ์และเครือข่ายศิษย์เก่า",
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
				Content: "โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย จังหวัดมหาสารคาม สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม\nเดิมมีฐานะเป็น 'สาขาโรงเรียนโกสุมวิทยาสรรค์' ก่อตั้งขึ้นเมื่อปี พ.ศ. 2534 โดยนายณรงค์ จันทชุม ผู้อำนวยการโรงเรียนโกสุมวิทยาสรรค์ในขณะนั้น ได้ร่วมกับผู้นำชุมชน นำโดย นายวินัย สมศรีลัย กำนันตำบลโพนงาม พร้อมด้วยผู้ใหญ่บ้าน มีมติเห็นชอบร่วมกันในการใช้พื้นที่ดินสาธารณประโยชน์ 'โคกหนองเรือ' เนื้อที่ 32 ไร่ 3 งาน 72 ตารางวา เป็นสถานที่ตั้งโรงเรียนสาขา\nต่อมาได้รับอนุมัติจากกรมสามัญศึกษาให้ยกฐานะเป็นโรงเรียนเอกเทศอย่างเป็นทางการ เมื่อวันที่ 3 กุมภาพันธ์ พ.ศ. 2538 (คำสั่งกรมสามัญศึกษาที่ 391/2538) และใช้ชื่อว่า 'โรงเรียนโพนงามพิทยานุกูล' (อักษรย่อ พ.พ.ก.)\n\nวิสัยทัศน์: เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ\nคำขวัญ: ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์",
				Status:  "published",
			},
			{
				Title:   "ระบบสารสนเทศ (E-Service)",
				Slug:    "eservice",
				Content: "ระบบบริการอิเล็กทรอนิกส์และสารสนเทศ โรงเรียนโพนงามพิทยานุกูล:\n1. ระบบทำเนียบศิษย์เก่า (PPK Alumni): https://alumni.ppks.ac.th/\n2. ระบบ SGS (Secondary Grading System - ระบบประเมินผลการเรียนออนไลน์ สพฐ.): https://sgs.bopp-obec.info/\n3. ตู้เสมารักษ์ (รับเรื่องร้องเรียนและข้อเสนอแนะออนไลน์): https://www.ppks.ac.th/?page_id=768\n4. ระบบ ปพ.5 ออนไลน์: https://pp5.ppks.ac.th/\n5. ระบบ ปพ.1 ออนไลน์: https://pp1.ppks.ac.th/\n6. ระบบเตรียมความพร้อม PISA สพฐ.: https://pisa.ppks.ac.th/",
				Status:  "published",
			},
			{
				Title:   "ติดต่อเรา",
				Slug:    "contact",
				Content: "โรงเรียนโพนงามพิทยานุกูล\nที่อยู่: เลขที่ 3 หมู่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม 44140\nสังกัด: สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม (สพม. มหาสารคาม)\nโทรศัพท์: 0-4399-6058\nเว็บไซต์: https://www.ppks.ac.th\nอีเมล: 44012012@ppks.ac.th\nเวลาทำการ: จันทร์ - ศุกร์ เวลา 08:30 - 16:30 น.",
				Status:  "published",
			},
		}
		database.Create(&initialPages)
	}

	// Seed settings if not present
	defaultSettings := []models.Setting{
		{Key: "school_name", Value: "โรงเรียนโพนงามพิทยานุกูล"},
		{Key: "school_name_en", Value: "Phon-ngam Pittayanukun School"},
		{Key: "school_area", Value: "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม"},
		{Key: "school_vision", Value: "เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ"},
		{Key: "school_motto", Value: "ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์"},
		{Key: "school_phone", Value: "0-4399-6058"},
		{Key: "school_email", Value: "44012012@ppks.ac.th"},
		{Key: "school_address", Value: "เลขที่ 3 หมู่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม 44140"},
		{Key: "school_website", Value: "https://www.ppks.ac.th"},
	}

	for _, s := range defaultSettings {
		var existing models.Setting
		if err := database.Where("key = ?", s.Key).First(&existing).Error; err != nil {
			database.Create(&s)
		} else if s.Key == "school_name" && existing.Value != "โรงเรียนโพนงามพิทยานุกูล" {
			database.Model(&existing).Update("value", s.Value)
		}
	}

	// Remove default agent key if it exists in settings
	database.Where("key = ? AND value = ?", "agent_key", "agent-school-secret-key-2026").Delete(&models.Setting{})

	// Migrate & clean up legacy plaintext passwords from settings table
	var legacyPassSetting models.Setting
	if err := database.Where("key = ?", "admin_password").First(&legacyPassSetting).Error; err == nil && legacyPassSetting.Value != "" {
		var adminUser models.User
		if uErr := database.Where("LOWER(username) = LOWER(?)", "admin").First(&adminUser).Error; uErr == nil {
			// Ensure admin user password matches before purging
			if bcrypt.CompareHashAndPassword([]byte(adminUser.Password), []byte(legacyPassSetting.Value)) != nil && adminUser.Password != legacyPassSetting.Value {
				if hashed, hErr := bcrypt.GenerateFromPassword([]byte(legacyPassSetting.Value), bcrypt.DefaultCost); hErr == nil {
					adminUser.Password = string(hashed)
					database.Save(&adminUser)
					log.Println("Migrated legacy admin_password from settings into users table.")
				}
			}
		}
	}
	// Delete legacy keys from settings table completely
	database.Where("key IN ?", []string{"admin_password", "admin_password_changed"}).Delete(&models.Setting{})

	// Seed default admin user if users table is empty
	var userCount int64
	database.Model(&models.User{}).Count(&userCount)
	if userCount == 0 {
		adminPass := os.Getenv("ADMIN_DEFAULT_PASSWORD")
		if adminPass == "" {
			adminPass = os.Getenv("ADMIN_PASSWORD")
		}
		if adminPass == "" {
			adminPass = "admin123"
		}

		hashedPass, err := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
		if err == nil {
			adminUser := models.User{
				Username: "admin",
				Password: string(hashedPass),
				Name:     "ผู้ดูแลระบบ (Super Admin)",
				Role:     "admin",
			}
			database.Create(&adminUser)
			log.Println("Created initial default admin user in database.")
		}
	}

	// Seed initial categories if empty
	var catCount int64
	database.Model(&models.Category{}).Count(&catCount)
	if catCount == 0 {
		defaultCategories := []models.Category{
			{Name: "วิชาการ", Slug: "academic"},
			{Name: "กิจกรรม", Slug: "activities"},
			{Name: "ประชาสัมพันธ์", Slug: "announcements"},
			{Name: "ทั่วไป", Slug: "general"},
		}
		database.Create(&defaultCategories)
		log.Println("Created default categories in database.")
	}

	// Mark initial seed as completed so user deletions are respected permanently
	database.Create(&models.Setting{Key: "initial_seed_completed", Value: "true"})
}
