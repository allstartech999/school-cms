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
* `agent_key`: API Key สำหรับ AI Agent (ค่าเริ่มต้น: `agent-school-secret-key-2026`)
* `school_name`: ชื่อโรงเรียนที่แสดงบนหัวเว็บ

---

## 4. ข้อกำหนด API (API Specification)

### 4.1 หมวดหมู่ทั่วไป (Public Endpoints)
* `GET /api/v1/posts`: ดึงรายการข่าวสาร (รองรับ Query Params: `category`, `search`, `limit`)
* `GET /api/v1/posts/{id}`: ดึงรายละเอียดข่าวตาม ID หรือ Slug (พร้อมนับ View อัตโนมัติ)
* `GET /api/v1/pages`: ดึงรายการหน้าเพจทั้งหมด
* `GET /api/v1/pages/{slug}`: ดึงเนื้อหาหน้าเพจตาม Slug (เช่น `/page/about`)
* `GET /api/v1/stats`: ข้อมูลสรุปจำนวนข่าว, หน้าเพจ, และข่าวที่ AI สร้าง

### 4.2 หมวดหมู่ Admin (ต้องส่ง Header `X-Admin-Token: authenticated-admin`)
* `POST /api/v1/admin/login`: ยืนยันรหัสผ่านเพื่อรับสิทธิ์เข้าสู่ระบบ
* `POST /api/v1/posts`: สร้างข่าวใหม่
* `PUT /api/v1/posts/{id}`: แก้ไขข่าว
* `DELETE /api/v1/posts/{id}`: ลบข่าว
* `POST /api/v1/pages`: สร้างหน้าเพจใหม่
* `PUT /api/v1/pages/{id}`: แก้ไขหน้าเพจ
* `DELETE /api/v1/pages/{id}`: ลบหน้าเพจ

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

### [x] Phase 1: Go Native Backend & SQLite Engine (เสร็จสมบูรณ์)
- [x] โครงสร้างโฟลเดอร์ Go Native (`db`, `handlers`, `middleware`, `models`)
- [x] Database Schema พร้อมระบบ Auto Seed ข้อมูลตั้งต้น
- [x] Implement API ครบทุกตัว (Posts, Pages, Admin, AI Agent)
- [x] เขียน Unit Test (`main_test.go`) ตรวจสอบความถูกต้องและสิทธิ์ของ Agent Key (ผล: PASS 100%)

### [ ] Phase 2: Frontend (React + Tailwind Clean Green-White Theme) (ขั้นตอนถัดไป)
- [ ] ติดตั้ง React + Vite ในโฟลเดอร์ `frontend/`
- [ ] ตั้งค่า Tailwind CSS โทนสีเขียว-ขาว (Emerald Green & Clean White)
- [ ] ทำ Navbar & Header โรงเรียน
- [ ] ทำ Hero Section & การ์ดข่าวสารล่าสุด (พร้อม Badge แยกข่าว AI)
- [ ] ทำหน้าอ่านข่าวเดี่ยว (`/news/:id`) และหน้าอ่านเพจ (`/page/:slug`)
- [ ] ทำ Admin Dashboard แบบด่วน (เข้าด้วยรหัสผ่าน, ฟอร์มสร้างข่าว/เพจ, ดู Agent Key)

### [ ] Phase 3: AI Agent Integration Testing
- [ ] เขียนสคริปต์ตัวอย่างจำลอง AI Agent เชื่อมต่อผ่าน API
- [ ] ทดสอบการยิงข่าวโดย Agent และตรวจสอบการอัปเดตบนหน้าเว็บแบบ Realtime

### [ ] Phase 4: Single Binary Packaging & Production Verification
- [ ] สั่ง Build Frontend ออกมาเป็น Static Assets ลงโฟลเดอร์ `dist/`
- [ ] ทำ Go Embedding ด้วย `//go:embed all:dist`
- [ ] ทดสอบรันไฟล์ Go Binary ตัวเดียว เพื่อยืนยันว่าทำงานได้ 100% โดยไม่มี Node.js ในระบบ
