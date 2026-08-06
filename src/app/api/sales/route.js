import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, payment_method, customer_id, patient_info } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No checkout items provided' },
        { status: 400 }
      );
    }

    if (!payment_method) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    if (!['cash', 'qr_promptpay', 'credit_card'].includes(payment_method)) {
      return NextResponse.json(
        { success: false, error: 'Payment method is not supported' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // 1. Start Database Transaction
      await client.query('BEGIN');

      const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      let calculatedTotal = 0;
      const processedItems = [];

      // 2. Loop items, verify stock levels with Row Locking (FOR UPDATE)
      for (const item of items) {
        const { drug_id, quantity, unit_price } = item;

        if (!drug_id || !quantity || quantity <= 0) {
          throw new Error(`Invalid item details: ${JSON.stringify(item)}`);
        }

        const stockResult = await client.query(
          'SELECT stock_quantity, price FROM inventory WHERE drug_id = $1 FOR UPDATE',
          [drug_id]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Drug ID "${drug_id}" not found in inventory.`);
        }

        const currentStock = stockResult.rows[0].stock_quantity;

        if (currentStock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${drug_id}:${currentStock}:${quantity}`);
        }

        const lotResult = await client.query(
          `SELECT id, lot_number, quantity, cost_price, expiry_date
           FROM inventory_lots
           WHERE drug_id = $1 AND quantity > 0 AND expiry_date >= CURRENT_DATE
           ORDER BY expiry_date ASC, received_at ASC, id ASC
           FOR UPDATE`,
          [drug_id]
        );

        let remainingQty = Number(quantity);
        const consumedLots = [];

        for (const lot of lotResult.rows) {
          if (remainingQty <= 0) break;

          const lotQty = Number(lot.quantity);
          const consumeQty = Math.min(remainingQty, lotQty);

          await client.query(
            'UPDATE inventory_lots SET quantity = quantity - $1 WHERE id = $2',
            [consumeQty, lot.id]
          );

          consumedLots.push({
            lot_id: lot.id,
            lot_number: lot.lot_number,
            quantity: consumeQty,
            cost_price: Number(lot.cost_price)
          });

          remainingQty -= consumeQty;
        }

        if (remainingQty > 0) {
          throw new Error(`INSUFFICIENT_LOT_STOCK:${drug_id}:${quantity - remainingQty}:${quantity}`);
        }

        await client.query(
          'UPDATE inventory SET stock_quantity = stock_quantity - $1 WHERE drug_id = $2',
          [quantity, drug_id]
        );

        const drugInfo = await client.query(
          'SELECT trade_name, active_ingredient, unit, strength, drug_type, fda_reg_no FROM drugs WHERE tmt_id = $1',
          [drug_id]
        );

        const drugRow = drugInfo.rows[0] || {};
        const tradeName = drugRow.trade_name || 'Unknown Drug';
        const subtotal = quantity * unit_price;
        calculatedTotal += subtotal;

        consumedLots.forEach((lot) => {
          processedItems.push({
            drug_id,
            trade_name: tradeName,
            active_ingredient: drugRow.active_ingredient || '',
            unit: drugRow.unit || 'tablet',
            strength: drugRow.strength || '',
            drug_type: drugRow.drug_type || 'general',
            fda_reg_no: drugRow.fda_reg_no || '',
            quantity: lot.quantity,
            unit_price,
            subtotal: lot.quantity * unit_price,
            lot_id: lot.lot_id,
            lot_number: lot.lot_number
          });
        });
      }

      const vat = Number((calculatedTotal * 0.07).toFixed(2));
      const totalDue = Number((calculatedTotal + vat).toFixed(2));

      // 3. Save Sales main record with customer_id
      await client.query(
        `INSERT INTO sales (id, customer_id, total_amount, payment_method)
         VALUES ($1, $2, $3, $4)`,
        [txId, customer_id || null, totalDue, payment_method]
      );

      // 4. Save Sales line-items & controlled_drug_logs
      for (const item of processedItems) {
        const itemResult = await client.query(
          `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal, lot_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [txId, item.drug_id, item.quantity, item.unit_price, item.subtotal, item.lot_id]
        );

        const saleItemId = itemResult.rows[0].id;

        // Dynamic Popularity
        await client.query(
          `UPDATE drugs SET popularity_score = popularity_score + $1 WHERE tmt_id = $2`,
          [item.quantity, item.drug_id]
        );

        // If drug is controlled or dangerous, log into controlled_drug_logs (GPP compliance ข.ย. 10 / ข.ย. 11)
        if (['special_controlled', 'dangerous'].includes(item.drug_type) || patient_info?.patient_name) {
          await client.query(
            `INSERT INTO controlled_drug_logs
             (sale_item_id, drug_id, customer_id, patient_name, patient_id_card, prescriber_name, pharmacist_name, purpose)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              saleItemId,
              item.drug_id,
              customer_id || null,
              patient_info?.patient_name || 'ลูกค้าทั่วไป',
              patient_info?.patient_id_card || '',
              patient_info?.prescriber_name || 'ภก. ผู้สั่งใช้ยา',
              patient_info?.pharmacist_name || 'ภก. อภิโช โลมทอง (ภ. 34152)',
              patient_info?.purpose || 'รักษาอาการป่วยเบื้องต้น'
            ]
          );
        }
      }

      // 5. Commit Transaction
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        transaction: {
          id: txId,
          subtotal: calculatedTotal,
          vat,
          total: totalDue,
          payment_method,
          customer_id: customer_id || null,
          date: new Date().toISOString(),
          items: processedItems
        }
      });
    } catch (txError) {
      await client.query('ROLLBACK');

      if (txError.message.startsWith('INSUFFICIENT_STOCK:')) {
        const [, drugId, current, requested] = txError.message.split(':');
        const drugResult = await client.query('SELECT trade_name FROM drugs WHERE tmt_id = $1', [drugId]);
        const tradeName = drugResult.rows[0]?.trade_name || 'Unknown Drug';

        return NextResponse.json({
          success: false,
          error: `ยารายการ "${tradeName}" มีจำนวนคงคลังไม่เพียงพอ (สต็อกปัจจุบัน: ${current} ชิ้น, ต้องการ: ${requested} ชิ้น)`
        }, { status: 400 });
      }

      if (txError.message.startsWith('INSUFFICIENT_LOT_STOCK:')) {
        const [, drugId, current, requested] = txError.message.split(':');
        const drugResult = await client.query('SELECT trade_name FROM drugs WHERE tmt_id = $1', [drugId]);
        const tradeName = drugResult.rows[0]?.trade_name || 'Unknown Drug';

        return NextResponse.json({
          success: false,
          error: `ยา "${tradeName}" ไม่มีล็อตที่ขายได้ตาม FEFO เพียงพอ (ล็อตพร้อมขาย: ${current} ชิ้น, ต้องการ: ${requested} ชิ้น) กรุณานำเข้าล็อตสินค้า/ตรวจวันหมดอายุก่อนขาย`
        }, { status: 400 });
      }

      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error recording sales transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sales transaction failed' },
      { status: 500 }
    );
  }
}
