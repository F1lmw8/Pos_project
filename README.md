# 🏥 POS & RDU Pharmacy Web Application

ระบบจัดการร้านขายยาและข้อมูลยา RDU (Rational Drug Use) พัฒนาด้วย Next.js (App Router), React และ PostgreSQL

---

## 🚀 ขั้นตอนการติดตั้งและรันโปรเจกต์สำหรับทีมงาน (Team Getting Started)

ทำตามขั้นตอนง่ายๆ ด้านล่างนี้เพื่อรันโปรเจกต์บนเครื่องของคุณ:

### 1. เตรียมโปรแกรมที่ต้องใช้ (Prerequisites)
- [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน 18 ขึ้นไป)
- [PostgreSQL](https://www.postgresql.org/) (สำหรับฐานข้อมูล local)
- [SourceTree](https://www.sourcetreeapp.com/) (สำหรับใช้งาน Git)

---

### 2. ดาวน์โหลดโปรเจกต์และติดตั้ง Dependencies
1. Clone โปรเจกต์ผ่าน SourceTree หรือใช้คำสั่ง:
   ```bash
   git clone <URL_REPOSITORY>
   ```
2. เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่งติดตั้งแพ็กเกจ:
   ```bash
   npm install
   ```

---

### 3. ตั้งค่าไฟล์ Environment Variables (`.env`)
1. คัดลอกไฟล์ `.env.example` แล้วเปลี่ยนชื่อเป็น `.env`:
   ```bash
   cp .env.example .env
   ```
2. เปิดไฟล์ `.env` แล้วแก้ไขข้อมูลให้ตรงกับเครื่องของคุณ:
   - `DATABASE_URL`: URL สำหรับเชื่อมต่อ PostgreSQL (เช่น `postgresql://postgres:password@localhost:5432/pos_db`)
   - `GOOGLE_GENERATIVE_AI_API_KEY`: API Key ของ Gemini (สอบถาม key จากเพื่อนในทีม)

> ⚠️ **คำเตือน**: ห้าม Commit หรือ Push ไฟล์ `.env` ขึ้น Git เด็ดขาดเพื่อความปลอดภัย!

---

### 4. Setup ฐานข้อมูล (Database Setup)
รันไฟล์ Script เพื่อสร้าง Schema และสร้างข้อมูลเริ่มต้น (Seed Data):

```bash
# 1. รันไฟล์สร้างตารางใน PostgreSQL
psql -U postgres -d your_db_name -f db/schema.sql

# 2. รันไฟล์สคริปต์ลงข้อมูลตัวอย่าง (Seed Data)
node db/seed.cjs
```

---

### 5. เริ่มรันโปรเจกต์ (Run Development Server)
รันคำสั่ง:
```bash
npm run dev
```
จากนั้นเปิดเบราว์เซอร์ไปที่: [http://localhost:3000](http://localhost:3000)

---

## 🌳 แนวทางการใช้ SourceTree ร่วมกันในทีม (Git Guidelines)

1. **Pull ทุกครั้งก่อนเริ่มงาน**: กดปุ่ม **Pull** ใน SourceTree เพื่อดึงโค้ดล่าสุดจากเพื่อนร่วมทีมเสมอ
2. **สร้าง Branch แยกในการทำแต่ละงาน (Feature Branch)**:
   - ไม่ควรทำงานลงบน Branch `main` โดยตรง
   - ให้สร้าง Branch ใหม่ เช่น `feature/add-product-form` หรือ `fix/stock-bug`
3. **Commit งานอย่างสม่ำเสมอ**:
   - ตรวจสอบไฟล์ในช่อง **Unstaged files** บน SourceTree
   - ย้ายเฉพาะไฟล์ที่เราแก้ไขจริงๆ ไปที่ **Staged files**
   - เขียน Commit Message ให้เข้าใจง่าย เช่น `feat: เพิ่มหน้าจัดการสต็อกยา` หรือ `fix: แก้ไขบั๊กคำนวณราคายา`
4. **Push ขึ้น Remote & สร้าง Pull Request (PR)**: เมื่อทำ Feature เสร็จแล้ว ให้ Push Branch ของคุณขึ้นไป แล้วแจ้งเพื่อนในทีมเพื่อตรวจเช็คก่อน Merge เข้า `main`

---

## 📁 โครงสร้างโปรเจกต์เบื้องต้น (Project Structure)

```text
├── src/
│   ├── app/                 # หน้าต่าง ๆ ของเว็บ (Next.js App Router)
│   │   ├── page.jsx         # หน้าหลัก POS
│   │   ├── drug/[id]/       # หน้ารายละเอียดข้อมูลยา
│   │   ├── dashboard/       # หน้าแดชบอร์ดจัดการสต็อก/ยอดขาย
│   │   └── api/             # API Routes สำหรับเชื่อมต่อ Database & AI
│   ├── components/          # React Components ที่ใช้ร่วมกัน
│   └── utils/               # ฟังก์ชันช่วยเหลือต่าง ๆ
├── db/                      # Schema และ Seed Script ของ PostgreSQL
└── public/                  # รูปภาพและไฟล์ Static ต่างๆ
```

---

## 🛠 คำสั่งที่ใช้งานบ่อย (Available Scripts)

- `npm run dev` : รันเซิร์ฟเวอร์สำหรับพัฒนา (Development Mode)
- `npm run build` : บิลด์โปรเจกต์สำหรับนำขึ้น Production
- `npm run start` : รันระบบที่ผ่านการบิลด์แล้ว
- `npm run lint` : ตรวจสอบความถูกต้องของโค้ด
