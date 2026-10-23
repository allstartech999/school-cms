# 🏫 School CMS (School Website with AI Agent Integration)

ระบบเว็บไซต์และแพลตฟอร์มบริหารจัดการเนื้อหาโรงเรียนขนาดกะทัดรัด สไตล์ **News Portal (Clean Green & White Theme)** ที่ขับเคลื่อนด้วย **Go 1.26 Native Backend**, ฐานข้อมูล **PostgreSQL 16 (GORM)** และ **React (Vite + Tailwind CSS)** พร้อมระบบ **AI Agent-Ready Mode** รองรับการส่งข่าวสารอัตโนมัติจากโมเดลภายนอก

---

## ✨ คุณสมบัติเด่น (Key Features)

- 📰 **หน้าแรกสไตล์เว็บข่าว (News Portal):** 
  - แถบข่าวด่วน (Breaking News Ticker) ด้านบนสุด
  - สไลเดอร์ข่าวเด่น (Featured News Slider) พร้อมสลับภาพอัตโนมัติและระบบสัมผัส/ลูกศร
  - คอลัมน์ข่าวยอดนิยมประจำสัปดาห์ (Trending Stories)
  - ตัวกรองหมวดหมู่ข่าว (วิชาการ, กิจกรรม, ข่าวสาร AI) พร้อมระบบค้นหาแบบ Real-time
  - หน้าต่างอ่านข่าวฉบับเต็ม (Full Article Reader Modal) ที่นับยอดวิวแบบเรียลไทม์
- 🤖 **AI Agent-Ready Mode:**
  - มี REST API พิเศษ (`/api/v1/agent/posts`) พร้อมยืนยันตัวตนด้วย Header `X-Agent-Key`
  - รองรับ AI Agents (เช่น Claude, ChatGPT, Typhoon) ให้สามารถดึงบริบทข่าว และส่งร่างข่าวเข้ามาเผยแพร่ในระบบได้โดยตรง
- 🍃 **Clean Green & White Design:**
  - ธีมสีเขียวมรกต (`emerald`) ตัดกับขาว สบายตา เหมาะกับสถาบันการศึกษา
  - รองรับภาษาไทยสมบูรณ์แบบด้วยฟอนต์ `Prompt` พร้อมปรับ Line-height ให้อ่านง่าย
  - Fully Responsive 100% รองรับทั้งสมาร์ทโฟน แท็บเล็ต และเดสก์ท็อป
- ⚡ **High Performance & Single Binary Packaging:**
  - Backend เขียนด้วย Go Standard Library (`net/http`) ผสาน GORM ต่อ PostgreSQL
  - ใช้เทคนิค `//go:embed all:dist` รวม Frontend และ Backend เข้าเป็นไฟล์ Execute เดียว จบในตัว ไม่ต้องมี Node.js บน Server ปลายทาง
- 🔄 **Developer Experience:**
  - พัฒนา Go ด้วย Hot Reload ผ่าน `air`
  - จัดการฐานข้อมูลผ่าน GORM AutoMigrate และ Connection Pooling

---

## 🛠️ สถาปัตยกรรมทางเทคนิค (Tech Stack)

| ส่วนของระบบ | เทคโนโลยีที่เลือกใช้ |
| :--- | :--- |
| **Backend** | Go 1.26 (`net/http` Native Routing + Graceful Shutdown) |
| **ORM & Database** | GORM (`gorm.io/gorm`) + PostgreSQL 16 Driver (`gorm.io/driver/postgres`) |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons |
| **Dev Tool** | Air (`air`) สำหรับ Hot Reload โค้ด Go |
| **Typography** | Google Fonts `Prompt` |

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. โคลนโปรเจกต์
```bash
git clone https://github.com/allstartech999/school-cms.git
cd school-cms
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ตัวอย่าง `.env.example` เป็น `.env` และกำหนดค่าเชื่อมต่อฐานข้อมูล PostgreSQL:
```bash
cp .env.example .env
```
```env
PORT=8080
DB_HOST=server.krufame.work
DB_PORT=5432
DB_USER=school_cms
DB_PASSWORD=your_password
DB_NAME=school_cms
DB_SSLMODE=disable
```

### 3. รันโปรเจกต์ (Development Mode)
- **รัน Go Backend ด้วย Air Hot Reload:**
  ```bash
  air
  ```
- **รัน Vite Frontend (หากต้องการแก้ไข UI ควบคู่):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

### 4. บิลด์เป็น Single Binary (Production)
```bash
# 1. บิลด์ Frontend ลงโฟลเดอร์ dist/
cd frontend
npm run build
cd ..

# 2. บิลด์ไฟล์ Go Executable รวม Frontend ในตัว
go build -o school-cms .

# 3. รันไฟล์ไบนารีเดียวพร้อมใช้งานได้ทันที (ไม่ต้องพึ่ง Node.js)
./school-cms
```

---

## 📡 สรุป API Endpoints

### ข้อมูลสาธารณะ (Public APIs)
- `GET /api/v1/posts` - ดึงรายการข่าวสาร (Query: `category`, `search`, `limit`)
- `GET /api/v1/posts/{id}` - ดึงรายละเอียดข่าวตาม ID หรือ Slug (เพิ่มยอดเข้าชมอัตโนมัติ)
- `GET /api/v1/pages` - ดึงรายการหน้าเพจทั้งหมด
- `GET /api/v1/pages/{slug}` - ดึงเนื้อหาหน้าเพจตาม Slug (เช่น `about`, `contact`)
- `GET /api/v1/stats` - ข้อมูลสรุปจำนวนข่าว, หน้าเพจ, และข่าวที่สร้างโดย AI

### ระบบแอดมิน (Admin APIs - Header: `X-Admin-Token`)
- `POST /api/v1/admin/login` - ยืนยันรหัสผ่านเพื่อรับ Token
- `POST /api/v1/posts` - สร้างข่าวใหม่
- `PUT /api/v1/posts/{id}` - แก้ไขข่าว
- `DELETE /api/v1/posts/{id}` - ลบข่าว

### โหมด AI Agent (Header: `X-Agent-Key`)
- `GET /api/v1/agent/posts` - ดึงประวัติข่าวล่าสุดไปประมวลผลหรือสรุปความ
- `POST /api/v1/agent/posts` - ให้ AI Agent ส่งข่าวเข้ามาบันทึกในระบบ

---

## 📄 ใบอนุญาต (License)
MIT License © 2026 School CMS Project
