# RDU Pharmacy POS — Prototype โปรเจคจบ

ระบบขายหน้าร้าน (Point of Sale) และจัดการร้านขายยา ที่ออกแบบตามแนวคิด **RDU (Rational Drug Use)** และมาตรฐาน **GPP (Good Pharmacy Practice)** สำหรับร้านยาในประเทศไทย

> **สถานะโปรเจค:** Prototype
> repo นี้คือ prototype แรกของโปรเจคจบ เดิมตั้งใจจะทำเป็นระบบ POS ร้านยาแบบเต็มรูปแบบ พัฒนาไปแล้วราว 40–50% ของขอบเขตทั้งหมด ต่อมาได้เปลี่ยนหัวข้อโปรเจคจบไปเป็น **Pharmacy Label System** ([chalakya.in.th](https://chalakya.in.th)) แต่ฟังก์ชันที่ทำเสร็จในนี้ยังใช้งานได้จริงตามที่อธิบายด้านล่าง

---

## ฟีเจอร์หลัก

### 🛒 หน้าขาย POS
- ค้นหายาได้ทั้งชื่อการค้า ชื่อสามัญ และ **ชื่อภาษาไทยแบบสะกดตามเสียง** (เช่น "พารา", "อะม็อกซี่" → paracetamol, amoxicillin)
- ฐานข้อมูลยาอ้างอิงรหัส **TMT (Thai Medicines Terminology)** รวมมากกว่า 35,000 รายการ
- ป้ายประเภทยาตามกฎหมาย: ยาสามัญประจำบ้าน / ยาอันตราย (ข.ย. 11) / ยาควบคุมพิเศษ (ข.ย. 10)
- เลือกผู้ป่วยที่ลงทะเบียนไว้ ระบบ **แจ้งเตือนเมื่อสั่งยาที่ผู้ป่วยแพ้** และบันทึกอาการหรือเหตุผลการจ่ายยาเมื่อตะกร้ามียาอันตรายหรือยาควบคุม
- ชำระเงินด้วยเงินสดหรือ **PromptPay QR** (สร้าง payload ตามมาตรฐาน EMVCo เอง) พร้อมใบเสร็จ
- ตัดสต็อกแบบ **FEFO (First-Expire, First-Out)** ขายล็อตที่หมดอายุก่อนเสมอ และไม่ขายล็อตที่หมดอายุแล้ว

### 🤖 AI Clinical Assistant
- แชทบอทสำหรับ **เภสัชกร** (ไม่ใช่ผู้ป่วย) ใช้ Vercel AI SDK กับ Google Gemini
- ดึงข้อมูลจริงจาก **RxNorm** (หา RxCUI) และ **openFDA Drug Label** (ข้อห้ามใช้ คำเตือน) แล้วสรุปเป็นภาษาไทย
- ตั้ง guardrail แบบ **zero-hallucination** ให้ตอบจากข้อมูล API เท่านั้น ถ้าไม่พบข้อมูลก็แจ้งตรง ๆ
- รู้สต็อกจริงของร้านจาก PostgreSQL เมื่อแนะนำยาตามอาการจะเสนอยาที่มีในร้านก่อน

### 📦 คลังสินค้า
- **สินค้าคงเหลือ**: ดูสต็อกแยกตามล็อตและวันหมดอายุ มีจุดสั่งซื้อซ้ำ (reorder point) และแจ้งเตือนยาใกล้หมดหรือใกล้หมดอายุ
- **เพิ่มสินค้าใหม่**: ค้นข้อมูลทะเบียนยาจากฐานข้อมูลของ อย. แล้วกรอกให้อัตโนมัติ
- **ใบรับสินค้า (GRN)**: รับล็อตยาเข้าคลังด้วยการสแกนบาร์โค้ด คำนวณ VAT และส่วนลด
- **Import / Export Excel**: นำเข้าสต็อกและล็อตจากไฟล์ `.xlsx` และส่งออก Stock Card (มีไฟล์ตัวอย่างใน `public/`)

### 📊 รายงานและเอกสาร
- **Dashboard**: สรุปยอดขาย กำไร และสินค้าขายดี แสดงเป็นกราฟด้วย Recharts
- **ประวัติธุรกรรม**: รายการขายทั้งหมด แยกตามรายการยา ล็อต เภสัชกร และลูกค้า
- **รายงาน GPP**: บัญชี ข.ย. 9 (ซื้อยา), ข.ย. 10 (ขายยาควบคุมพิเศษ), ข.ย. 11 (ขายยาอันตราย)
- **ภาษี**: คำนวณ ภ.พ. 30 และออกใบกำกับภาษีตาม ม.86 แห่งประมวลรัษฎากร ส่งออกเป็น Excel ได้

### 👤 อื่น ๆ
- **ทะเบียนผู้ป่วย**: ข้อมูลผู้ป่วย ประวัติแพ้ยา และประวัติการซื้อยา
- **ตั้งค่าร้าน**: ชื่อร้านและเภสัชกรผู้ปฏิบัติการ
- โหมดสว่าง/มืด (Light / Dark)

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Database | PostgreSQL (`pg`) |
| AI | Vercel AI SDK, Google Gemini |
| External APIs | RxNorm (NLM), openFDA, ฐานข้อมูลผลิตภัณฑ์ อย. |
| UI | CSS, lucide-react, Recharts |
| อื่น ๆ | SheetJS (`xlsx`), `qrcode` (PromptPay) |

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── page.jsx               # หน้าขาย POS
│   ├── drug/[id]/             # รายละเอียดยา + RDU
│   ├── dashboard/             # หลังบ้าน: ยอดขาย, สต็อก, GRN, GPP, ภาษี, ผู้ป่วย, ตั้งค่า
│   └── api/                   # products, sales, customers, chat, fda/lookup, dashboard/*
├── components/                # ChatbotWidget, ReceiptModal, ExcelImportModal, ...
├── utils/                     # safetyEngine, rduMatcher, promptpay, excelStockHelper, db
└── data/                      # ข้อมูลยา (TMT) และ monograph
db/                            # schema.sql, seed scripts, migrations
```

## เริ่มต้นใช้งาน

**สิ่งที่ต้องมี:** Node.js 20+ และ PostgreSQL

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ตั้งค่า environment
cp .env.example .env
#    แก้ DATABASE_URL และ GOOGLE_GENERATIVE_AI_API_KEY

# 3. สร้างตาราง (seed.cjs รัน schema.sql ให้) และใส่ข้อมูลตัวอย่าง
node db/seed.cjs
node db/seed_lots.cjs

# 4. รัน dev server
npm run dev
```

เปิด http://localhost:3000 (หน้าขาย POS) และ http://localhost:3000/dashboard (หลังบ้าน)

## ข้อจำกัดของ Prototype

- ยังไม่มีระบบ login หรือแยกสิทธิ์ผู้ใช้
- ยังไม่ได้ deploy ขึ้น production
- PromptPay ID ยังกำหนดตายตัวในโค้ด (`src/app/page.jsx`) ยังไม่ได้ย้ายไปไว้ในหน้าตั้งค่า
- ชำระเงินด้วย PromptPay ได้แค่สร้าง QR ยังไม่ได้เชื่อมระบบยืนยันการโอนอัตโนมัติ
- คำตอบของ AI ใช้ประกอบการตัดสินใจของเภสัชกรเท่านั้น ไม่ใช่คำแนะนำทางการแพทย์

## โปรเจคที่ต่อยอด

แนวคิดและข้อมูลยาจาก prototype นี้ถูกนำไปพัฒนาต่อเป็นโปรเจคจบ **Pharmacy Label System** ระบบพิมพ์ฉลากยา 3 ภาษา (ไทย / อังกฤษ / จีน) ที่ส่งฉลากดิจิทัลผ่าน LINE OA ได้
👉 [chalakya.in.th](https://chalakya.in.th)

---

พัฒนาโดย **Apichai Chomthong (F1lmw8)** นักศึกษาสาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้
