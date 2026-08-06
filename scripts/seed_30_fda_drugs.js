import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connStr = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';

const items = [
  // 1. ยาสามัญประจำบ้าน (10 รายการ)
  { id: 1, name: 'SARA PARACETAMOL 500 MG (ซาร่า พาราเซตามอล)', strength: '500 mg', category: 'ยาสามัญประจำบ้าน', unit: 'แผง (10s)', price: 18, cost: 10, lot: 'LOT-OTC-001', exp: '2029-01-01', qty: 200 },
  { id: 2, name: 'ORS (Oral Rehydration Salts เกลือแร่ผง)', strength: 'ซอง 5.5g', category: 'ยาสามัญประจำบ้าน', unit: 'ซอง', price: 8, cost: 4, lot: 'LOT-OTC-002', exp: '2028-12-31', qty: 150 },
  { id: 3, name: 'ยาธาตุน้ำแดง (Red Mixture Antacid & Carminative)', strength: '180 ml', category: 'ยาสามัญประจำบ้าน', unit: 'ขวด', price: 35, cost: 20, lot: 'LOT-OTC-003', exp: '2028-10-15', qty: 80 },
  { id: 4, name: 'DIMENHYDRINATE 50 MG (ยาแก้เมารถ ไดเมนไฮดริเนท)', strength: '50 mg', category: 'ยาสามัญประจำบ้าน', unit: 'แผง (10s)', price: 15, cost: 8, lot: 'LOT-OTC-004', exp: '2028-08-20', qty: 100 },
  { id: 5, name: 'CALAMINE LOTION (คาลาไมน์โลชั่น ทาแก้ผื่นคัน)', strength: '60 ml', category: 'ยาสามัญประจำบ้าน', unit: 'ขวด', price: 28, cost: 15, lot: 'LOT-OTC-005', exp: '2028-11-10', qty: 60 },
  { id: 6, name: 'ยาหม่องขี้ผึ้งถ้วยทอง (Balm Ointment)', strength: '12 g', category: 'ยาสามัญประจำบ้าน', unit: 'ตลับ', price: 22, cost: 12, lot: 'LOT-OTC-006', exp: '2029-05-01', qty: 120 },
  { id: 7, name: 'SULFACETAMIDE EYE DROPS (ยาหยอดตาซัลฟาเซตาไมด์)', strength: '10%', category: 'ยาสามัญประจำบ้าน', unit: 'ขวด', price: 30, cost: 16, lot: 'LOT-OTC-007', exp: '2027-09-30', qty: 40 },
  { id: 8, name: 'ASPIRIN 81 MG (แอสไพริน ยาสามัญประจำบ้าน)', strength: '81 mg', category: 'ยาสามัญประจำบ้าน', unit: 'แผง (10s)', price: 20, cost: 10, lot: 'LOT-OTC-008', exp: '2028-06-15', qty: 90 },
  { id: 9, name: 'POVIDONE IODINE 10% (เบตาดีน ใส่แผลสด)', strength: '30 ml', category: 'ยาสามัญประจำบ้าน', unit: 'ขวด', price: 55, cost: 32, lot: 'LOT-OTC-009', exp: '2028-10-10', qty: 60 },
  { id: 10, name: 'ANTACID TABLETS (ยาเม็ดลดกรด เคี้ยว)', strength: '500 mg', category: 'ยาสามัญประจำบ้าน', unit: 'แผง (10s)', price: 25, cost: 12, lot: 'LOT-OTC-010', exp: '2029-02-28', qty: 110 },

  // 2. ยาอันตราย (ข.ย. 11) - ต้องจ่ายโดยเภสัชกร (10 รายการ)
  { id: 11, name: 'AMOXYCILLIN 500 MG (แอมม็อกซี่ซิลลิน)', strength: '500 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'กล่อง (10x10s)', price: 180, cost: 120, lot: 'LOT-DAN-011', exp: '2027-12-31', qty: 50 },
  { id: 12, name: 'IBUPROFEN 400 MG (ไอบูโพรเฟน แก้ปวดอักเสบ)', strength: '400 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'แผง (10s)', price: 35, cost: 18, lot: 'LOT-DAN-012', exp: '2028-05-20', qty: 100 },
  { id: 13, name: 'CHLORPHENIRAMINE 4 MG (คลอเฟนิรามีน แก้แพ้)', strength: '4 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'แผง (10s)', price: 12, cost: 5, lot: 'LOT-DAN-013', exp: '2028-12-15', qty: 200 },
  { id: 14, name: 'SALBUTAMOL TABLETS 2 MG (ซาลบีทามอล ขยายหลอดลม)', strength: '2 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'แผง (10s)', price: 20, cost: 9, lot: 'LOT-DAN-014', exp: '2027-11-10', qty: 80 },
  { id: 15, name: 'ROXITHROMYCIN 150 MG (รอกซิโทรมัยซิน)', strength: '150 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'กล่อง (10s)', price: 120, cost: 75, lot: 'LOT-DAN-015', exp: '2028-01-25', qty: 45 },
  { id: 16, name: 'DICLOFENAC 25 MG (ไดโคลฟีแนค แก้ปวดกล้ามเนื้อ)', strength: '25 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'กล่อง (10x10s)', price: 130, cost: 85, lot: 'LOT-DAN-016', exp: '2027-08-30', qty: 40 },
  { id: 17, name: 'METFORMIN 500 MG (เมตฟอร์มิน ยาเบาหวาน)', strength: '500 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'แผง (10s)', price: 25, cost: 12, lot: 'LOT-DAN-017', exp: '2028-09-18', qty: 150 },
  { id: 18, name: 'AMLODIPINE 5 MG (แอมโลดิปีน ยาลดความดัน)', strength: '5 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'แผง (10s)', price: 30, cost: 15, lot: 'LOT-DAN-018', exp: '2028-04-12', qty: 120 },
  { id: 19, name: 'ORLISTAT 120 MG (ออร์ลีสัท ดักจับไขมัน)', strength: '120 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'กล่อง (21s)', price: 650, cost: 450, lot: 'LOT-DAN-019', exp: '2027-10-30', qty: 25 },
  { id: 20, name: 'ITRACONAZOLE 100 MG (อิดราโคนาโซล ต้านเชื้อรา)', strength: '100 mg', category: 'ยาอันตราย (ข.ย. 11)', unit: 'กล่อง (10s)', price: 280, cost: 190, lot: 'LOT-DAN-020', exp: '2028-03-22', qty: 30 },

  // 3. ยาควบคุมพิเศษ (ข.ย. 10) - ต้องมีใบสั่งแพทย์เท่านั้น (10 รายการ)
  { id: 21, name: 'TRAMADOL 50 MG (ทรามาดอล ระงับปวดรุนแรง)', strength: '50 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'แผง (10s)', price: 80, cost: 45, lot: 'LOT-SPC-021', exp: '2027-07-20', qty: 50 },
  { id: 22, name: 'CYCLOSPORINE 100 MG (ไซโคลสปอริน กดภูมิ)', strength: '100 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'กล่อง (50s)', price: 3200, cost: 2400, lot: 'LOT-SPC-022', exp: '2027-06-15', qty: 10 },
  { id: 23, name: 'METHOTREXATE 2.5 MG (เมโทเทร็กเซต เคมีบำบัด)', strength: '2.5 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'กล่อง (100s)', price: 850, cost: 600, lot: 'LOT-SPC-023', exp: '2027-11-30', qty: 15 },
  { id: 24, name: 'WARFARIN 2 MG (วาร์ฟาริน ต้านเกล็ดเลือด)', strength: '2 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'ขวด (100s)', price: 450, cost: 300, lot: 'LOT-SPC-024', exp: '2028-02-14', qty: 20 },
  { id: 25, name: 'PREDNISOLONE 5 MG (เพรดนิโซโลน สเตียรอยด์)', strength: '5 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'กล่อง (500s)', price: 600, cost: 420, lot: 'LOT-SPC-025', exp: '2028-03-15', qty: 15 },
  { id: 26, name: 'INSULIN HUMAN INJECTION (อินซูลินฉีดเบาหวาน)', strength: '100 IU/ml', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'ขวดฉีด 10ml', price: 520, cost: 380, lot: 'LOT-SPC-026', exp: '2027-05-10', qty: 25 },
  { id: 27, name: 'ATAZANAVIR 300 MG (อะทาซานาเวียร์ ยาต้านเอชไอวี)', strength: '300 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'ขวด (30s)', price: 1850, cost: 1350, lot: 'LOT-SPC-027', exp: '2028-01-18', qty: 12 },
  { id: 28, name: 'MIDAZOLAM 15 MG/3ML (มิดาโซแลม ยานอนหลับฉีด)', strength: '15 mg/3ml', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'หลอดฉีด (5s)', price: 950, cost: 700, lot: 'LOT-SPC-028', exp: '2027-08-25', qty: 10 },
  { id: 29, name: 'HALOPERIDOL 2 MG (ฮาโลเพริดอล รักษาจิตเวช)', strength: '2 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'กล่อง (100s)', price: 380, cost: 250, lot: 'LOT-SPC-029', exp: '2028-07-12', qty: 20 },
  { id: 30, name: 'VANCOMYCIN 500 MG (วานโคไมซิน ฆ่าเชื้อขั้นสูง)', strength: '500 mg', category: 'ยาควบคุมพิเศษ (ข.ย. 10)', unit: 'ขวดฉีด', price: 780, cost: 520, lot: 'LOT-SPC-030', exp: '2027-12-01', qty: 18 }
];

const mockRows = items.map(item => ({
  'ลำดับ': item.id,
  'รายการยาและเวชภัณฑ์': item.name,
  'ความแรง': item.strength,
  'ED/N': 'ED',
  'ขนาดบรรจุ': item.unit,
  'บัญชียา': item.category === 'ยาสามัญประจำบ้าน' ? 'ก' : item.category.includes('อันตราย') ? 'ข' : 'ค',
  'กลุ่มยา': item.category,
  'เงื่อนไขการใช้ยา': item.category.includes('ควบคุมพิเศษ') ? 'ต้องมีใบสั่งแพทย์' : item.category.includes('อันตราย') ? 'จ่ายโดยเภสัชกร' : 'ซื้อได้ทั่วไป',
  'รหัสล็อต (Batch/Lot No.)': item.lot,
  'วันหมดอายุ (YYYY-MM-DD)': item.exp,
  'จำนวนรับเข้า': item.qty,
  'จำนวนจ่ายออก': 0,
  'จำนวนคงเหลือ': item.qty,
  'ราคาต้นทุน (บาท)': item.cost,
  'ราคาขาย (บาท)': item.price,
  'ผู้บันทึก': 'ภก.สมชาย ใจดี'
}));

// Build Excel file
const worksheet = XLSX.utils.json_to_sheet(mockRows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'StockCard30Items');

const publicDir = path.join(process.cwd(), 'public');
const targetPublicFile = path.join(publicDir, 'mock_stock_card_30_items.xlsx');
XLSX.writeFile(workbook, targetPublicFile);

const desktopFile = '/Users/filmw8/Desktop/mock_stock_card_30_items.xlsx';
const downloadsFile = '/Users/filmw8/Downloads/mock_stock_card_30_items.xlsx';
const artifactFile = '/Users/filmw8/.gemini/antigravity/brain/afd9b804-9e7a-41ba-acf4-dc5384a290ee/mock_stock_card_30_items.xlsx';

XLSX.writeFile(workbook, desktopFile);
XLSX.writeFile(workbook, downloadsFile);
XLSX.writeFile(workbook, artifactFile);

console.log('Successfully created 30-item Excel file on Desktop, Downloads, Public, and Artifacts!');

// Update PostgreSQL Database
const pool = new pg.Pool({ connectionString: connStr });
try {
  for (const item of items) {
    const tmtId = `TMT-${1000 + item.id}`;
    await pool.query(
      `INSERT INTO drugs (tmt_id, trade_name, active_ingredient, unit, strength, dosage_form, drug_type, fda_status)
       VALUES ($1, $2, $3, $4, $5, 'tablet', $6, 'verified')
       ON CONFLICT (tmt_id) DO UPDATE
       SET trade_name = EXCLUDED.trade_name,
           active_ingredient = EXCLUDED.active_ingredient,
           unit = EXCLUDED.unit,
           strength = EXCLUDED.strength,
           drug_type = EXCLUDED.drug_type,
           fda_status = 'verified'`,
      [tmtId, item.name, item.name, item.unit, item.strength, item.category]
    );

    await pool.query(
      `INSERT INTO inventory (drug_id, stock_quantity, price)
       VALUES ($1, $2, $3)
       ON CONFLICT (drug_id) DO UPDATE
       SET stock_quantity = EXCLUDED.stock_quantity,
           price = EXCLUDED.price`,
      [tmtId, item.qty, item.price]
    );

    await pool.query(
      'INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date) VALUES ($1, $2, $3, $4, $5)',
      [tmtId, item.lot, item.qty, item.cost, item.exp]
    );
  }
  console.log('Successfully updated PostgreSQL database with 30 official FDA drugs!');
} catch (err) {
  console.error('PostgreSQL update error:', err);
} finally {
  await pool.end();
  process.exit();
}
