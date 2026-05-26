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

        // Decrement stock
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

        processedItems.push({
          drug_id,
          trade_name: tradeName,
          unit: drugInfo.rows[0]?.unit || 'tablet',
          strength: drugInfo.rows[0]?.strength || '',
          quantity,
          unit_price,
          subtotal
        });
      }

      // 3. Save Sales main record
      await client.query(
        `INSERT INTO sales (id, total_amount, payment_method)
         VALUES ($1, $2, $3)`,
        [txId, calculatedTotal, payment_method]
      );

      // 4. Save Sales line-items & increment popularity score
      for (const item of processedItems) {
        await client.query(
          `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [txId, item.drug_id, item.quantity, item.unit_price, item.subtotal]
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
          total: calculatedTotal,
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
