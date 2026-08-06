import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการข้อมูลยาในไฟล์ Excel' }, { status: 400 });
    }

    let insertedCount = 0;

    for (const item of items) {
      const tradeName = (item.trade_name || item['รายการยาและเวชภัณฑ์'] || item.drug_name || item['ชื่อยา'] || '').trim();
      if (!tradeName) continue;

      const activeIngredient = (item.active_ingredient || item.generic_name || tradeName).trim();
      const strength = (item.strength || item['ความแรง'] || '').trim();
      const dosageForm = (item.dosage_form || item['รูปแบบยา'] || item['กลุ่มยา'] || 'tablet').trim();
      const unit = (item.unit || item['ขนาดบรรจุ'] || 'กล่อง').trim();
      const fdaRegNo = (item.fda_reg_no || item['เลข อย.'] || item['เลขทะเบียน อย.'] || '').trim();
      const lotNumber = (item.lot_number || item.batch_no || item['รหัสล็อต (Batch/Lot No.)'] || item['รหัสยา / ล็อต'] || item['ล็อต'] || `LOT-${Date.now()}`).trim();

      // Expiry Date Parsing
      let expiryDateVal = item.expiry_date || item['วันหมดอายุ (YYYY-MM-DD)'] || item['วันหมดอายุ'] || null;
      let validExpiry = null;
      if (expiryDateVal) {
        const d = new Date(expiryDateVal);
        if (!isNaN(d.getTime())) {
          validExpiry = d.toISOString().slice(0, 10);
        }
      }
      if (!validExpiry) {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        validExpiry = d.toISOString().slice(0, 10);
      }

      const quantity = Math.max(0, parseInt(item.quantity || item['จำนวนรับเข้า'] || item['จำนวนคงเหลือ'] || 0, 10));
      const price = Math.max(0, parseFloat(item.price || item.unit_price || item['ราคาขาย (บาท)'] || item['ราคาขาย'] || 0));
      const costPrice = Math.max(0, parseFloat(item.cost_price || item['ราคาต้นทุน (บาท)'] || item['ราคาต้นทุน'] || 0));
      const manufacturer = (item.manufacturer || item.supplier_name || item['ชื่อผู้ขาย'] || item['ผู้ผลิต'] || '').trim();

      // Check if drug exists in drugs table by trade_name or fda_reg_no or tmt_id
      let targetTmtId = item.tmt_id || item.sku || null;

      if (!targetTmtId) {
        const existingDrug = await pool.query(
          `SELECT tmt_id FROM drugs WHERE LOWER(trade_name) = LOWER($1) OR (fda_reg_no <> '' AND LOWER(fda_reg_no) = LOWER($2)) LIMIT 1`,
          [tradeName, fdaRegNo]
        );
        if (existingDrug.rows.length > 0) {
          targetTmtId = existingDrug.rows[0].tmt_id;
        } else {
          targetTmtId = `DRUG-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        }
      }

      const sku = item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // 1. Upsert Drugs Table
      await pool.query(`
        INSERT INTO drugs (
          tmt_id, trade_name, active_ingredient, unit, strength, dosage_form,
          drug_type, fda_reg_no, fda_status, sku, manufacturer
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'verified', $9, $10)
        ON CONFLICT (tmt_id) DO UPDATE
        SET trade_name = EXCLUDED.trade_name,
            active_ingredient = EXCLUDED.active_ingredient,
            strength = COALESCE(NULLIF(EXCLUDED.strength, ''), drugs.strength),
            fda_status = 'verified',
            fda_reg_no = COALESCE(NULLIF(EXCLUDED.fda_reg_no, ''), drugs.fda_reg_no),
            manufacturer = COALESCE(NULLIF(EXCLUDED.manufacturer, ''), drugs.manufacturer)
      `, [
        targetTmtId,
        tradeName,
        activeIngredient,
        unit,
        strength,
        dosageForm,
        'general',
        fdaRegNo,
        sku,
        manufacturer
      ]);

      // 2. Insert into inventory_lots
      if (quantity > 0 || lotNumber) {
        await pool.query(`
          INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          targetTmtId,
          lotNumber,
          quantity,
          costPrice,
          validExpiry
        ]);
      }

      // 3. Upsert into inventory
      await pool.query(`
        INSERT INTO inventory (drug_id, stock_quantity, price)
        VALUES ($1, $2, $3)
        ON CONFLICT (drug_id) DO UPDATE
        SET stock_quantity = inventory.stock_quantity + EXCLUDED.stock_quantity,
            price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE inventory.price END,
            updated_at = CURRENT_TIMESTAMP
      `, [targetTmtId, quantity, price]);

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `นำเข้าข้อมูลคลังยาและล็อตยาจาก Excel เรียบร้อยแล้ว (${insertedCount} รายการ)`,
      importedCount: insertedCount
    });
  } catch (error) {
    console.error('Error bulk importing Excel stock:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel: ' + error.message },
      { status: 500 }
    );
  }
}
