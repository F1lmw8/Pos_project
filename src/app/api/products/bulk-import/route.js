import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลรายการยาในไฟล์ Excel' }, { status: 400 });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const tradeName = (item.trade_name || item['รายการยาและเวชภัณฑ์'] || item.drug_name || '').trim();
      if (!tradeName) continue;

      const activeIngredient = (item.active_ingredient || item.generic_name || tradeName).trim();
      const strength = (item.strength || item['ความแรง'] || '').trim();
      const dosageForm = (item.dosage_form || item['กลุ่มยา'] || item.unit || 'tablet').trim();
      const unit = (item.unit || item['ขนาดบรรจุ'] || 'กล่อง').trim();
      const fdaRegNo = (item.fda_reg_no || item['เลข อย.'] || '').trim();
      const lotNumber = (item.lot_number || item.batch_no || item['รหัสยา / ล็อต'] || item['ล็อต'] || `LOT-${Date.now()}`).trim();
      const expiryDate = item.expiry_date || item['วันหมดอายุ'] || null;
      const quantity = parseInt(item.quantity || item['จำนวนรับเข้า'] || item['จำนวนคงเหลือ'] || 0, 10);
      const price = parseFloat(item.price || item.unit_price || item['ราคาขาย'] || 0);
      const costPrice = parseFloat(item.cost_price || item['ราคาต้นทุน'] || 0);
      const manufacturer = (item.manufacturer || item.supplier_name || item['ชื่อผู้ขาย'] || '').trim();

      const tmtId = item.tmt_id || item.sku || `DRUG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const sku = item.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Upsert Drugs
      const drugRes = await pool.query(`
        INSERT INTO drugs (
          tmt_id, trade_name, active_ingredient, unit, strength, dosage_form,
          drug_type, fda_reg_no, fda_status, sku, manufacturer
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'verified', $9, $10)
        ON CONFLICT (tmt_id) DO UPDATE
        SET trade_name = EXCLUDED.trade_name,
            active_ingredient = EXCLUDED.active_ingredient,
            strength = EXCLUDED.strength,
            fda_reg_no = COALESCE(NULLIF(EXCLUDED.fda_reg_no, ''), drugs.fda_reg_no),
            manufacturer = COALESCE(NULLIF(EXCLUDED.manufacturer, ''), drugs.manufacturer)
        RETURNING tmt_id
      `, [
        tmtId,
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

      const insertedTmtId = drugRes.rows[0].tmt_id;

      // 2. Upsert Inventory Stock
      await pool.query(`
        INSERT INTO inventory (drug_id, stock_quantity, price)
        VALUES ($1, $2, $3)
        ON CONFLICT (drug_id) DO UPDATE
        SET stock_quantity = inventory.stock_quantity + EXCLUDED.stock_quantity,
            price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE inventory.price END,
            updated_at = CURRENT_TIMESTAMP
      `, [insertedTmtId, quantity, price]);

      // 3. Insert Inventory Lot if quantity > 0 or lot_number provided
      if (quantity > 0 || lotNumber) {
        await pool.query(`
          INSERT INTO inventory_lots (
            drug_id, lot_number, quantity, initial_quantity, cost_price, expiry_date, received_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
          ON CONFLICT DO NOTHING
        `, [
          insertedTmtId,
          lotNumber,
          quantity,
          quantity,
          costPrice,
          expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 86400000)
        ]);
      }

      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `นำเข้าข้อมูลคลังยาจาก Excel เรียบร้อยแล้ว (${insertedCount} รายการ)`,
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
