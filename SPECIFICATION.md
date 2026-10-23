# 🏫 School CMS (School Website with AI Agent Integration)
## เอกสารข้อกำหนดระบบและแผนการพัฒนา (System Specification & Roadmap)

**วันที่มีผล:** 23 ตุลาคม 2026  
**ที่ตั้งโปรเจกต์:** `d:\coding-project\school-cms`  
**สถานะปัจจุบัน:** Phase 1 เสร็จสมบูรณ์ (Backend & SQLite & Tests ผ่าน 100%)

---

## 1. บทนำและวัตถุประสงค์ (Overview & Goals)
โครงการพัฒนาระบบเว็บไซต์โรงเรียนขนาดกะทัดรัด พร้อมใช้งานได้จริงอย่างเร่งด่วน โดยมีฟีเจอร์หลักคือ:
1. **ระบบสร้างและจัดการข่าวสาร (Post / News):** ประชาสัมพันธ์กิจกรรม ข่าววิชาการ ประกาศด่วน พร้อมระบบจัดหมวดหมู่และตัวนับยอดการเข้าชม
2. **ระบบสร้างหน้าเนื้อหาทั่วไป (Page):** สำหรับข้อมูลเฉพาะของโรงเรียน เช่น ประวัติ, หลักสูตร, การติดต่อ
3. **โหมดเชื่อมต่อ AI Agent (AI Agent-Ready Mode):** เปิดช่องทางให้โมเดล AI หรือบอทภายนอกสามารถเข้ามาดึงข้อมูลบริบทของโรงเรียน และส่งร่างข่าวสารเข้ามาในระบบได้ผ่าน API Key
4. **ธีมการออกแบบ:** สไตล์ **Clean Green & White (เขียว-ขาว สะอาด มินิมอล)** ให้ความรู้สึกเป็นมิตรและทันสมัยสำหรับสถาบันการศึกษา
5. **Zero Node.js on Production Server:** ตัวเซิร์ฟเวอร์ปลายทางรันด้วยไฟล์ **Go Single Binary เพียงไฟล์เดียว** ไม่ต้องติดตั้ง Node.js หรือ dependency เสริมใดๆ บน Server

---

## 2. สถาปัตยกรรมทางเทคนิค (Technical Architecture)

```
[ Clients & Users ]
  ├── นักเรียน / ผู้ปกครอง (Public Web - เขียว-ขาว Clean Style)
  ├── คุณครู / เจ้าหน้าที่ (Admin Management Dashboard)
  └── AI Agent / Chatbot (API Call พร้อม X-Agent-Key)
           │
           ▼ (HTTP Port 8080)
┌─────────────────────────────────────────────────────────────┐
│                 Go Native Backend (1.26+)                   │
│  ├── Standard Library net/http (ไม่ใช้ Gin หรือ Fiber)         │
│  ├── Go Native Enhanced Routing (GET /api/v1/posts/{id})    │
│  ├── Single Binary Static Embedding (//go:embed all:dist)   │
│  └── Middlewares: CORS, Request Logger, AdminAuth, AgentAuth│
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                 SQLite Database (Pure Go)                   │
│  ├── Driver: modernc.org/sqlite (Zero CGO)                  │
│  └── File: school.db (เก็บข้อมูล Post, Page, Settings ครบ)   │
└─────────────────────────────────────────────────────────────┘
```

| องค์ประกอบ | เทคโนโลยีที่เลือกใช้ | เหตุผลและข้อกำหนด |
| :--- | :--- | :--- |
| **Backend** | **Go 1.26 (Native `net/http`)** | ใช้ Standard Library 100% สำหรับ Routing ไม่พึ่งพา Gin หรือ Fiber ได้ความเร็วสูงสุดและ Clean Architecture |
| **ORM & DB** | **GORM + PostgreSQL (Remote `fame_vps`)** | ใช้งาน GORM เชื่อมต่อไปยัง PostgreSQL 16 บน `server.krufame.work:5432` ฐานข้อมูล `school_cms` 100% ปราศจาก SQLite |
| **Dev Tool** | **Air (`air`) Hot Reload** | บิลด์และรีสตาร์ทเซิร์ฟเวอร์อัตโนมัติเมื่อแก้โค้ด Go ผ่านไฟล์คอนฟิก `.air.toml` |
| **Frontend** | **React (Vite) + Tailwind CSS** | พัฒนาง่าย แยก Component ชัดเจน ตอน Build จะ Compile เป็น HTML/JS/CSS ใส่ไว้ในโฟลเดอร์ `dist/` |
| **Server Runtime** | **Single Go Binary** | ใช้เทคนิค `//go:embed` ฝัง Frontend เข้าไปใน Go ทำให้บน Server ปลายทางมีแค่ Go รันได้เลย **ไม่ต้องมี Node.js** |
| **Color Theme** | **Clean Green & White** | สีเขียวมรกต (`emerald-600` / `green-700`) พื้นหลังขาว สไตล์โปร่ง คลีน สบายตา |

---

## 3. โครงสร้างฐานข้อมูล (Data Schema)

ระบบใช้ฐานข้อมูล SQLite (`school.db`) ประกอบด้วย 3 ตารางหลัก:

### 3.1 ตาราง `posts` (ข่าวสารและประกาศ)
| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | INTEGER PK AUTOINCREMENT | รหัสข่าว |
| `title` | TEXT NOT NULL | หัวข้อข่าว |
| `slug` | TEXT UNIQUE NOT NULL | Slug ภาษาอังกฤษ/ตัวเลข สำหรับ URL ที่สวยงาม |
| `category` | TEXT DEFAULT 'ทั่วไป' | หมวดหมู่ เช่น วิชาการ, กิจกรรม, ข่าวสาร AI |
| `summary` | TEXT | สรุปย่อของข่าวสำหรับแสดงในการ์ดหน้าแรก |
| `content` | TEXT NOT NULL | เนื้อหาข่าวฉบับเต็ม |
| `image_url` | TEXT | URL รูปภาพปกข่าว |
| `author` | TEXT DEFAULT 'โรงเรียน' | ชื่อผู้เขียน (ชื่อครู หรือชื่อ AI) |
| `created_by_agent` | INTEGER DEFAULT 0 | `1` หากสร้างโดย AI Agent, `0` หากสร้างโดยมนุษย์ |
| `agent_name` | TEXT | ชื่อโมเดลหรือ Agent ที่สร้างข่าว |
| `status` | TEXT DEFAULT 'published' | สถานะข่าว: `published` หรือ `draft` |
| `views` | INTEGER DEFAULT 0 | จำนวนครั้งที่เปิดอ่านข่าว |
| `created_at` | DATETIME | วันเวลาที่สร้างข่าว |
| `updated_at` | DATETIME | วันเวลาที่แก้ไขล่าสุด |

### 3.2 ตาราง `pages` (หน้าเนื้อหาอิสระ)
| คอลัมน์ | ชนิดข้อมูล | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | INTEGER PK AUTOINCREMENT | รหัสหน้าเพจ |
| `title` | TEXT NOT NULL | ชื่อหน้า เช่น เกี่ยวกับโรงเรียน, ติดต่อเรา |
| `slug` | TEXT UNIQUE NOT NULL | Slug เช่น `about`, `contact`, `curriculum` |
| `content` | TEXT NOT NULL | เนื้อหาของหน้านั้นๆ |
| `status` | TEXT DEFAULT 'published' | สถานะ `published` หรือ `draft` |
| `created_at` | DATETIME | วันเวลาที่สร้าง |
| `updated_at` | DATETIME | วันเวลาที่แก้ไข |

### 3.3 ตาราง `settings` (การตั้งค่าระบบ)
* `admin_password`: รหัสผ่านสำหรับเข้าสู่ระบบแอดมิน (ค่าเริ่มต้น: `admin123`)
* `school_name`: ชื่อโรงเรียนที่แสดงบนหัวเว็บ

### 3.4 ตาราง `users` (ผู้ใช้งานระบบ)
| ฟิลด์ | ประเภท | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | INTEGER PK AUTOINCREMENT | รหัสผู้ใช้งาน |
| `username` | TEXT UNIQUE NOT NULL | ชื่อบัญชีเข้าสู่ระบบ |
| `password` | TEXT NOT NULL | รหัสผ่านเข้ารหัสด้วย bcrypt |
| `name` | TEXT NOT NULL | ชื่อ-นามสกุล หรือชื่อแสดง |
| `role` | TEXT DEFAULT 'admin' | สิทธิ์ผู้ใช้ (`admin`, `editor`, `teacher`) |
| `created_at` | DATETIME | วันเวลาที่สร้าง |
| `updated_at` | DATETIME | วันเวลาที่แก้ไข |

### 3.5 ตาราง `agent_keys` (API Keys สำหรับ AI Agent)
| ฟิลด์ | ประเภท | คำอธิบาย |
| :--- | :--- | :--- |
| `id` | INTEGER PK AUTOINCREMENT | รหัสคีย์ |
| `name` | TEXT NOT NULL | ชื่อเรียกของคีย์ (เช่น Claude, Gemini) |
| `key` | TEXT UNIQUE NOT NULL | API Key สุ่มปลอดภัย (`ppk_agent_...`) |
| `description` | TEXT | คำอธิบายการใช้งาน |
| `is_active` | BOOLEAN DEFAULT true | สถานะเปิด/ปิดใช้งาน |
| `last_used_at` | DATETIME | วันเวลาที่ใช้งานล่าสุด |
| `created_at` | DATETIME | วันเวลาที่สร้าง |

---

## 4. ข้อกำหนด API (API Specification)

### 4.1 หมวดหมู่ทั่วไป (Public Endpoints)
* `GET /api/v1/posts`: ดึงรายการข่าวสาร (รองรับ Query Params: `category`, `search`, `limit`)
* `GET /api/v1/posts/{id}`: ดึงรายละเอียดข่าวตาม ID หรือ Slug (พร้อมนับ View อัตโนมัติ)
* `GET /api/v1/pages`: ดึงรายการหน้าเพจทั้งหมด
* `GET /api/v1/pages/{slug}`: ดึงเนื้อหาหน้าเพจตาม Slug (เช่น `/page/about`)
* `GET /api/v1/stats`: ข้อมูลสรุปจำนวนข่าว, หน้าเพจ, และข่าวที่ AI สร้าง

### 4.2 หมวดหมู่ Admin (ต้องส่ง Header `X-Admin-Token: authenticated-admin`)
* `POST /api/v1/admin/login`: ยืนยันชื่อผู้ใช้และรหัสผ่านเพื่อรับสิทธิ์เข้าสู่ระบบ
* `POST /api/v1/posts`: สร้างข่าวใหม่
* `PUT /api/v1/posts/{id}`: แก้ไขข่าว
* `DELETE /api/v1/posts/{id}`: ลบข่าว
* `POST /api/v1/pages`: สร้างหน้าเพจใหม่
* `PUT /api/v1/pages/{id}`: แก้ไขหน้าเพจ
* `DELETE /api/v1/pages/{id}`: ลบหน้าเพจ
* `GET /api/v1/users`: ดูรายชื่อผู้ใช้งานทั้งหมด
* `POST /api/v1/users`: สร้างผู้ใช้งานใหม่ พร้อมกำหนดสิทธิ์และรหัสผ่าน
* `PUT /api/v1/users/{id}`: แก้ไขข้อมูลผู้ใช้ สิทธิ์ และรีเซ็ตรหัสผ่าน
* `DELETE /api/v1/users/{id}`: ลบผู้ใช้งาน (ป้องกันการลบแอดมินคนสุดท้าย)
* `GET /api/v1/agent-keys`: ดูรายการ API Keys สำหรับ AI Agent ทั้งหมด
* `POST /api/v1/agent-keys`: สร้าง API Key สุ่มความปลอดภัยสูง (`ppk_agent_...`)
* `PUT /api/v1/agent-keys/{id}/toggle`: เปิด/ระงับการใช้งาน API Key ชั่วคราว
* `DELETE /api/v1/agent-keys/{id}`: ลบและเพิกถอน API Key อย่างถาวร

### 4.3 หมวดหมู่ AI Agent (ต้องส่ง Header `X-Agent-Key: <AGENT_KEY>`)
* `GET /api/v1/agent/posts`: ดึงประวัติข่าวสารล่าสุดไปประมวลผลหรือสรุปความ
* `POST /api/v1/agent/posts`: ให้ Agent ส่งข่าวเข้ามาบันทึกในระบบ
  * **Payload ตัวอย่าง:**
    ```json
    {
      "title": "สรุปผลการแข่งขันหุ่นยนต์ระดับชาติ ประจำปี 2026",
      "category": "กิจกรรม",
      "summary": "ทีมนักเรียนตัวแทนโรงเรียนคว้ารางวัลชนะเลิศการแข่งขันหุ่นยนต์อัตโนมัติ",
      "content": "รายละเอียดข่าวที่เขียนและสรุปโดย AI...",
      "image_url": "https://example.com/robot.jpg",
      "agent_name": "Claude School Reporter",
      "publish": true
    }
    ```

---

## 5. แผนการดำเนินงาน 4 Phase (Execution Roadmap)

### [x] Phase 1: Go Native Backend & PostgreSQL Engine (เสร็จสมบูรณ์ 100%)
- [x] โครงสร้างโฟลเดอร์ Go Native (`db`, `handlers`, `middleware`, `models`)
- [x] GORM + PostgreSQL เชื่อมต่อเซิร์ฟเวอร์จริง `server.krufame.work:5432`
- [x] AutoMigrate ตาราง `posts`, `pages`, `settings`, `media`
- [x] Implement REST API ครบทุกตัว (Posts, Pages, Admin, Media, AI Agent)

### [x] Phase 2: Frontend News Portal (เสร็จสมบูรณ์ 100%)
- [x] ติดตั้ง React 19 + Vite ในโฟลเดอร์ `frontend/`
- [x] ตั้งค่า Tailwind CSS v4 โทนสีเขียว-ขาว (Emerald Green & Clean White)
- [x] Navbar & Header โรงเรียนโพนงามพิทยานุกูล (พ.พ.ก.)
- [x] Hero Section, E-Services Portal, แถบข่าวด่วน, Slider และ Trending News
- [x] Single Post Reader Modal พร้อม Loading Skeleton & Spinner

### [x] Phase 3: AI Agent Integration with Model Context Protocol (MCP) & Block Layout Engine (เสร็จสมบูรณ์ 100%)
- [x] ติดตั้ง `github.com/mark3labs/mcp-go` รองรับทั้ง **SSE Mode** (`/mcp/sse`) และ **Stdio CLI Mode** (`--mcp-stdio`)
- [x] ยกระดับเป็น **WordPress-like AI Engine** ครบ 14 เครื่องมือ:
  - **Media:** `upload_media_by_url`, `list_media`
  - **Posts (CRUD):** `create_school_post`, `update_school_post`, `get_school_post`, `delete_school_post`, `list_recent_posts`
  - **Pages & Blocks (CRUD):** `create_or_update_page`, `get_page`, `delete_page`, `list_pages` (รองรับการตั้งค่า `show_in_menu`, `menu_title`, `menu_order`, `menu_parent`)
  - **Site Customizer & Menu:** `get_homepage_config`, `update_homepage_config`, `manage_navigation_menu`
- [x] MCP Resources: `school://blocks/catalog` (ขยายบล็อก: `person_cards`, `rich_text`, `image_gallery`) และ `school://guidelines/writing`
- [x] Frontend Dynamic Navbar: ดึงเมนูจาก API พร้อม Dropdown และเรนเดอร์เพจที่ AI สร้างด้วย `BlockRenderer` ทันทีเมื่อคลิก

### [x] Phase 4: Single Binary Packaging & Docker VPS Deployment (เสร็จสมบูรณ์ 100%)
- [x] สั่ง Build Frontend ออกมาเป็น Static Assets ลงโฟลเดอร์ `dist/`
- [x] ทำ Go Embedding ด้วย `//go:embed all:dist`
- [x] สร้าง Multi-stage `Dockerfile` (Node 24 + Go 1.26 CGO LibWebP + Alpine 3.21 Runner)
- [x] สร้าง `docker-compose.yml` รองรับ Host Network Gateway และ Persistent Volume สำหรับ `/uploads`
- [x] Deploy และรัน Service บน `fame_vps` ผ่าน Docker Container (`127.0.0.1:8009`) พร้อม Healthcheck สมบูรณ์
- [x] ติดตั้งและกำหนดค่า Nginx Reverse Proxy (`/etc/nginx/sites-available/school.krufame.work`) พร้อมรองรับ SSE Unbuffered Streaming สำหรับ `/mcp/`
