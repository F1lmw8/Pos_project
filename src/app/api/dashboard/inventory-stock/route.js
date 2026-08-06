import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const mode = searchParams.get('mode') || 'available';

    const params = [];
    const filters = [];

    if (q) {
      params.push(`%${q}%`);
      filters.push(`(
        LOWER(d.trade_name) LIKE $${params.length}
        OR LOWER(d.active_ingredient) LIKE $${params.length}
        OR LOWER(d.tmt_id) LIKE $${params.length}
        OR LOWER(d.barcode) LIKE $${params.length}
        OR LOWER(d.sku) LIKE $${params.length}
        OR LOWER(d.fda_reg_no) LIKE $${params.length}
      )`);
    }

    if (mode === 'available') {
      filters.push('COALESCE(stock.sellable_quantity, 0) > 0');
    } else if (mode === 'low') {
      filters.push('COALESCE(stock.sellable_quantity, 0) > 0');
      filters.push('COALESCE(stock.sellable_quantity, 0) <= COALESCE(d.reorder_point, 10)');
    } else if (mode === 'expiring') {
      filters.push('COALESCE(stock.expiring_90_quantity, 0) > 0');
    }

    // Exclude discontinued / soft-deleted products
    filters.push("(d.fda_status IS NULL OR d.fda_status <> 'discontinued')");

    const whereSql = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const result = await pool.query(`
      SELECT
        d.tmt_id,
        d.trade_name,
        d.active_ingredient,
        d.unit,
        d.strength,
        d.dosage_form,
        d.drug_type,
        d.fda_reg_no,
        COALESCE(d.fda_status, 'unverified') AS fda_status,
        d.sku,
        d.barcode,
        d.manufacturer,
        COALESCE(d.reorder_point, 10) AS reorder_point,
        COALESCE(i.stock_quantity, 0) AS system_stock,
        COALESCE(i.price, 0) AS price,
        COALESCE(stock.sellable_quantity, 0) AS sellable_quantity,
        COALESCE(stock.total_lot_quantity, 0) AS total_lot_quantity,
        COALESCE(stock.expiring_30_quantity, 0) AS expiring_30_quantity,
        COALESCE(stock.expiring_90_quantity, 0) AS expiring_90_quantity,
        COALESCE(stock.expired_quantity, 0) AS expired_quantity,
        stock.nearest_expiry_date,
        COALESCE(stock.lot_count, 0) AS lot_count
      FROM drugs d
      LEFT JOIN inventory i ON d.tmt_id = i.drug_id
      LEFT JOIN LATERAL (
        SELECT
          SUM(CASE WHEN il.quantity > 0 AND il.expiry_date >= CURRENT_DATE THEN il.quantity ELSE 0 END) AS sellable_quantity,
          SUM(CASE WHEN il.quantity > 0 THEN il.quantity ELSE 0 END) AS total_lot_quantity,
          SUM(CASE WHEN il.quantity > 0 AND il.expiry_date >= CURRENT_DATE AND il.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN il.quantity ELSE 0 END) AS expiring_30_quantity,
          SUM(CASE WHEN il.quantity > 0 AND il.expiry_date >= CURRENT_DATE AND il.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN il.quantity ELSE 0 END) AS expiring_90_quantity,
          SUM(CASE WHEN il.quantity > 0 AND il.expiry_date < CURRENT_DATE THEN il.quantity ELSE 0 END) AS expired_quantity,
          MIN(CASE WHEN il.quantity > 0 AND il.expiry_date >= CURRENT_DATE THEN il.expiry_date END) AS nearest_expiry_date,
          COUNT(*) FILTER (WHERE il.quantity > 0) AS lot_count
        FROM inventory_lots il
        WHERE il.drug_id = d.tmt_id
      ) stock ON TRUE
      ${whereSql}
      ORDER BY
        COALESCE(stock.sellable_quantity, 0) ASC,
        stock.nearest_expiry_date ASC NULLS LAST,
        d.trade_name ASC
      LIMIT 300
    `, params);

    const rows = result.rows.map((row) => ({
      ...row,
      reorder_point: Number(row.reorder_point),
      system_stock: Number(row.system_stock),
      price: Number(row.price),
      sellable_quantity: Number(row.sellable_quantity),
      total_lot_quantity: Number(row.total_lot_quantity),
      expiring_30_quantity: Number(row.expiring_30_quantity),
      expiring_90_quantity: Number(row.expiring_90_quantity),
      expired_quantity: Number(row.expired_quantity),
      lot_count: Number(row.lot_count)
    }));

    return NextResponse.json({
      success: true,
      data: rows,
      summary: {
        item_count: rows.length,
        sellable_units: rows.reduce((sum, row) => sum + row.sellable_quantity, 0),
        low_stock_count: rows.filter((row) => row.sellable_quantity > 0 && row.sellable_quantity <= row.reorder_point).length,
        expiring_90_units: rows.reduce((sum, row) => sum + row.expiring_90_quantity, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stock monitor:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory stock monitor' },
      { status: 500 }
    );
  }
}
