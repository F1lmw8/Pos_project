import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, payment_method } = body;

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

    // Connect a client from pool to handle transaction
    const client = await pool.connect();
    
    try {
      // 1. Start Database Transaction
      await client.query('BEGIN');

      // Generate a clean human-readable transaction ID (TX-timestamp-rand)
      const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
      let calculatedTotal = 0;
      const processedItems = [];

      // 2. Loop items, verify stock levels with Row Locking (FOR UPDATE)
      for (const item of items) {
        const { drug_id, quantity, unit_price } = item;

        if (!drug_id || !quantity || quantity <= 0) {
          throw new Error(`Invalid item details: ${JSON.stringify(item)}`);
        }

        // Lock row in inventory to prevent concurrency race conditions
        const stockResult = await client.query(
          'SELECT stock_quantity, price FROM inventory WHERE drug_id = $1 FOR UPDATE',
          [drug_id]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Drug ID "${drug_id}" not found in inventory.`);
        }

        const currentStock = stockResult.rows[0].stock_quantity;
        
        // Stock validation
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

        // Fetch drug name for transaction logging
        const drugInfo = await client.query(
          'SELECT trade_name, unit, strength FROM drugs WHERE tmt_id = $1',
          [drug_id]
        );

        const tradeName = drugInfo.rows[0]?.trade_name || 'Unknown Drug';
        const subtotal = quantity * unit_price;
        calculatedTotal += subtotal;

        consumedLots.forEach((lot) => {
          processedItems.push({
            drug_id,
            trade_name: tradeName,
            unit: drugInfo.rows[0]?.unit || 'tablet',
            strength: drugInfo.rows[0]?.strength || '',
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

      // 3. Save Sales main record
      await client.query(
        `INSERT INTO sales (id, total_amount, payment_method)
         VALUES ($1, $2, $3)`,
        [txId, totalDue, payment_method]
      );

      // 4. Save Sales line-items & increment popularity score
      for (const item of processedItems) {
        await client.query(
          `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal, lot_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [txId, item.drug_id, item.quantity, item.unit_price, item.subtotal, item.lot_id]
        );

        // Dynamic Popularity: Boost score by the quantity sold
        await client.query(
          `UPDATE drugs SET popularity_score = popularity_score + $1 WHERE tmt_id = $2`,
          [item.quantity, item.drug_id]
        );
      }

      // 5. Commit Transaction
      await client.query('COMMIT');

      // Return successful receipt details
      return NextResponse.json({
        success: true,
        transaction: {
          id: txId,
          subtotal: calculatedTotal,
          vat,
          total: totalDue,
          payment_method,
          date: new Date().toISOString(),
          items: processedItems
        }
      });

    } catch (txError) {
      // Rollback transaction if any error occurs
      await client.query('ROLLBACK');
      
      // Parse insufficient stock message
      if (txError.message.startsWith('INSUFFICIENT_STOCK:')) {
        const [, drugId, current, requested] = txError.message.split(':');
        
        // Fetch drug name to return a clean, friendly error
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
