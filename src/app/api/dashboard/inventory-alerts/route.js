import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

// 1. GET Method: Retrieve alerts (low stock, expiring lots, stock-in history)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let responseData = {};

    // A. Fetch Low Stock Alerts
    if (type === 'all' || type === 'low-stock') {
      const lowStockRes = await pool.query(`
        SELECT d.tmt_id, d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form,
               COALESCE(i.stock_quantity, 0) as current_stock,
               COALESCE(d.reorder_point, 10) as reorder_point
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        WHERE COALESCE(i.stock_quantity, 0) < COALESCE(d.reorder_point, 10)
        ORDER BY current_stock ASC
      `);
      
      responseData.low_stock_alerts = lowStockRes.rows;
    }

    // B. Fetch Expiry Alerts (Expiring within 30, 60, and 90 days)
    if (type === 'all' || type === 'expiry') {
      const expiryRes = await pool.query(`
        SELECT il.id as lot_id, il.lot_number, il.quantity, il.expiry_date, 
               d.tmt_id, d.trade_name, d.unit, d.strength, d.dosage_form,
               (il.expiry_date - CURRENT_DATE) as days_until_expiry
        FROM inventory_lots il
        JOIN drugs d ON il.drug_id = d.tmt_id
        WHERE il.expiry_date >= CURRENT_DATE AND il.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
        ORDER BY il.expiry_date ASC
      `);

      const expiring_30_days = [];
      const expiring_60_days = [];
      const expiring_90_days = [];

      expiryRes.rows.forEach(lot => {
        const days = parseInt(lot.days_until_expiry, 10);
        if (days <= 30) {
          expiring_30_days.push(lot);
        } else if (days <= 60) {
          expiring_60_days.push(lot);
        } else if (days <= 90) {
          expiring_90_days.push(lot);
        }
      });

      responseData.expiry_alerts = {
        expiring_30_days,
        expiring_60_days,
        expiring_90_days
      };
    }

    // C. Fetch Stock-In History
    if (type === 'all' || type === 'history') {
      const historyRes = await pool.query(`
        SELECT il.id as lot_id, il.lot_number, il.quantity, il.cost_price, il.expiry_date, il.received_at,
               d.tmt_id, d.trade_name, d.unit, d.strength, d.dosage_form
        FROM inventory_lots il
        JOIN drugs d ON il.drug_id = d.tmt_id
        ORDER BY il.received_at DESC
        LIMIT 50
      `);

      responseData.stock_in_history = historyRes.rows.map(row => ({
        ...row,
        cost_price: parseFloat(row.cost_price),
        quantity: parseInt(row.quantity, 10)
      }));
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}

// 2. POST Method: Process incoming lots (Stock-In) and increment inventory levels
export async function POST(request) {
  let client;
  try {
    const body = await request.json();
    const { drug_id, lot_number, quantity, cost_price, expiry_date } = body;

    // A. Input validation
    if (!drug_id || !lot_number || !quantity || !cost_price || !expiry_date) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน (รหัสยา TMT, หมายเลขล็อต, จำนวนนำเข้า, ต้นทุน, วันหมดอายุ)' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    const cost = parseFloat(cost_price);

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'จำนวนนำเข้าต้องเป็นตัวเลขจำนวนเต็มที่มากกว่า 0' },
        { status: 400 }
      );
    }

    if (isNaN(cost) || cost < 0) {
      return NextResponse.json(
        { success: false, error: 'ราคาต้นทุนคลังต้องไม่ต่ำกว่า 0.00 บาท' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // B. Start Database Transaction to guarantee FEFO and inventory sync
    await client.query('BEGIN');

    // 1. Verify that drug exists in drugs table
    const drugCheck = await client.query('SELECT trade_name FROM drugs WHERE tmt_id = $1', [drug_id]);
    if (drugCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: `ไม่พบรหัสยา TMT-ID "${drug_id}" ในระบบสารสนเทศเวชภัณฑ์` },
        { status: 400 }
      );
    }

    const tradeName = drugCheck.rows[0].trade_name;

    // 2. Insert new lot into inventory_lots
    const insertLotRes = await client.query(`
      INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [drug_id, lot_number, qty, cost, expiry_date]);
    
    const lotId = insertLotRes.rows[0].id;

    // 3. Upsert into inventory table (Increment stock level & auto-calculate a retail price if new)
    // Dynamic Pricing Default: 30% markup on cost if no retail price currently exists
    const defaultRetailPrice = parseFloat((cost * 1.30).toFixed(2));

    await client.query(`
      INSERT INTO inventory (drug_id, stock_quantity, price)
      VALUES ($1, $2, $3)
      ON CONFLICT (drug_id) DO UPDATE 
      SET 
        stock_quantity = inventory.stock_quantity + EXCLUDED.stock_quantity,
        price = CASE WHEN inventory.price = 0.00 THEN EXCLUDED.price ELSE inventory.price END,
        updated_at = CURRENT_TIMESTAMP
    `, [drug_id, qty, defaultRetailPrice]);

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `นำเข้าล็อตเวชภัณฑ์ "${tradeName}" เรียบร้อยแล้ว`,
      data: {
        lot_id: lotId,
        drug_id,
        trade_name: tradeName,
        quantity: qty,
        cost_price: cost
      }
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error stocking in lot:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'การนำเข้าล็อตยาล้มเหลว' },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
