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
      id
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
      `, [id, numStock, numPrice]);
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
    `, [id]);

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

// DELETE product
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const res = await pool.query('DELETE FROM drugs WHERE tmt_id = $1 OR sku = $1 RETURNING tmt_id', [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'ลบสินค้าเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
