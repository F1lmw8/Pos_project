import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

// GET single product details
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const res = await pool.query(`
      SELECT d.*, 
             COALESCE(i.stock_quantity, 0) AS stock_quantity, 
             COALESCE(i.price, 0.00) AS price
      FROM drugs d
      LEFT JOIN inventory i ON d.tmt_id = i.drug_id
      WHERE d.tmt_id = $1 OR d.sku = $1 OR d.barcode = $1
      LIMIT 1
    `, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json({ success: false, error: 'Database query error' }, { status: 500 });
  }
}

// PUT update product details
export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      trade_name,
      active_ingredient,
      strength,
      dosage_form,
      drug_type,
      fda_reg_no,
      barcode,
      manufacturer,
      price,
      stock_quantity
    } = body;

    const rawId = decodeURIComponent(id);
    const targetRes = await pool.query('SELECT tmt_id FROM drugs WHERE tmt_id = $1 OR sku = $1 OR barcode = $1 LIMIT 1', [rawId]);
    const targetTmtId = targetRes.rows.length > 0 ? targetRes.rows[0].tmt_id : rawId;

    // 1. Update drugs table
    await pool.query(`
      UPDATE drugs
      SET trade_name = COALESCE($1, trade_name),
          active_ingredient = COALESCE($2, active_ingredient),
          strength = COALESCE($3, strength),
          dosage_form = COALESCE($4, dosage_form),
          drug_type = COALESCE($5, drug_type),
          fda_reg_no = COALESCE($6, fda_reg_no),
          barcode = COALESCE($7, barcode),
          manufacturer = COALESCE($8, manufacturer)
      WHERE tmt_id = $9 OR sku = $9
    `, [
      trade_name,
      active_ingredient,
      strength,
      dosage_form,
      drug_type,
      fda_reg_no,
      barcode,
      manufacturer,
      targetTmtId
    ]);

    // 2. Upsert inventory table
    if (price !== undefined || stock_quantity !== undefined) {
      const numPrice = price !== undefined ? parseFloat(price) : 0;
      const numStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : 0;

      await pool.query(`
        INSERT INTO inventory (drug_id, stock_quantity, price)
        VALUES ($1, $2, $3)
        ON CONFLICT (drug_id) DO UPDATE
        SET price = EXCLUDED.price,
            stock_quantity = EXCLUDED.stock_quantity,
            updated_at = CURRENT_TIMESTAMP
      `, [targetTmtId, numStock, numPrice]);

      // 3. Ensure a lot exists in inventory_lots for stock monitoring
      if (numStock > 0) {
        await pool.query(`
          INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date)
          VALUES ($1, 'LOT-EDIT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), $2, $3 * 0.7, CURRENT_DATE + INTERVAL '2 years')
          ON CONFLICT DO NOTHING
        `, [targetTmtId, numStock, numPrice]);

        await pool.query(`
          UPDATE inventory_lots
          SET quantity = $2,
              expiry_date = GREATEST(expiry_date, CURRENT_DATE + INTERVAL '1 year')
          WHERE drug_id = $1
        `, [targetTmtId, numStock]);
      }
    }

    // Fetch updated product
    const updatedRes = await pool.query(`
      SELECT d.*, 
             COALESCE(i.stock_quantity, 0) AS stock_quantity, 
             COALESCE(i.price, 0.00) AS price
      FROM drugs d
      LEFT JOIN inventory i ON d.tmt_id = i.drug_id
      WHERE d.tmt_id = $1 OR d.sku = $1
      LIMIT 1
    `, [targetTmtId]);

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสินค้าเรียบร้อยแล้ว',
      data: updatedRes.rows[0] || null
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product (GPP & Accounting Audit Compliant: Soft-delete if sales history exists)
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    // 1. Find target drug tmt_id
    const drugRes = await pool.query('SELECT tmt_id FROM drugs WHERE tmt_id = $1 OR sku = $1 LIMIT 1', [id]);
    if (drugRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบรายการสินค้าที่ต้องการลบ' }, { status: 404 });
    }
    const tmtId = drugRes.rows[0].tmt_id;

    // 2. Check if product has sales history (sale_items)
    const salesCheck = await pool.query('SELECT COUNT(*)::int AS count FROM sale_items WHERE drug_id = $1', [tmtId]);
    const hasSalesHistory = salesCheck.rows[0].count > 0;

    if (hasSalesHistory) {
      // Soft Delete: Mark as discontinued & zero out active stock to protect GPP & Tax history
      await pool.query("UPDATE drugs SET fda_status = 'discontinued' WHERE tmt_id = $1", [tmtId]);
      await pool.query("UPDATE inventory SET stock_quantity = 0 WHERE drug_id = $1", [tmtId]);
      return NextResponse.json({
        success: true,
        message: 'ยกเลิกการจำหน่ายยารายการนี้แล้ว (คงประวัติการขายและรายงาน GPP ตามกฎหมายเรียบร้อย)'
      });
    }

    // 3. If no sales history exists (newly created test item), safe hard delete
    await pool.query('DELETE FROM controlled_drug_logs WHERE drug_id = $1', [tmtId]);
    await pool.query('DELETE FROM inventory_lots WHERE drug_id = $1', [tmtId]);
    await pool.query('DELETE FROM inventory WHERE drug_id = $1', [tmtId]);
    await pool.query('DELETE FROM drugs WHERE tmt_id = $1', [tmtId]);

    return NextResponse.json({ success: true, message: 'ลบสินค้าออกจากระบบเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'ไม่สามารถลบสินค้าได้: ' + error.message }, { status: 500 });
  }
}
