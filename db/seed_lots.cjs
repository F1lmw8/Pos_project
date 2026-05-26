// D:\project_69\Pos_project\db\seed_lots.cjs
// Run this script to seed inventory lots, set reorder points, and create transaction logs

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
const pool = new Pool({ connectionString });

async function seedLotsAndTransactions() {
  const client = await pool.connect();
  try {
    console.log("Seeding Inventory Lots and Sales Logs...");
    await client.query('BEGIN');

    // 1. Fetch 20 random drugs that exist in inventory
    const drugsRes = await client.query(`
      SELECT d.tmt_id, i.price, i.stock_quantity
      FROM drugs d
      JOIN inventory i ON d.tmt_id = i.drug_id
      LIMIT 30
    `);

    if (drugsRes.rows.length === 0) {
      console.log("No drugs found in database. Run db/seed.cjs first.");
      await client.query('ROLLBACK');
      return;
    }

    console.log(`Setting reorder points and seeding lots for ${drugsRes.rows.length} drugs...`);
    
    // Clear previous lots to avoid duplicates during testing
    await client.query('TRUNCATE TABLE inventory_lots CASCADE');

    const staffMembers = ['STAFF-001', 'STAFF-002', 'STAFF-003'];
    const lotNumberPrefixes = ['LOT-A', 'LOT-B', 'LOT-C'];

    for (let i = 0; i < drugsRes.rows.length; i++) {
      const drug = drugsRes.rows[i];
      const price = parseFloat(drug.price);
      
      // Update reorder point randomly between 10 and 50
      const reorderPoint = Math.floor(Math.random() * 40) + 10;
      await client.query(
        'UPDATE drugs SET reorder_point = $1 WHERE tmt_id = $2',
        [reorderPoint, drug.tmt_id]
      );

      // Create 2 lots per drug
      // Lot 1: Expiring soon (15 to 45 days)
      const qty1 = Math.floor(Math.random() * 20) + 5;
      const cost1 = parseFloat((price * 0.65).toFixed(2));
      const expDays1 = Math.floor(Math.random() * 30) + 10; // 10 to 40 days
      const expDate1 = new Date();
      expDate1.setDate(expDate1.getDate() + expDays1);
      
      const lotRes1 = await client.query(
        `INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date, received_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '5 days') RETURNING id`,
        [drug.tmt_id, `${lotNumberPrefixes[0]}${1000 + i}`, qty1, cost1, expDate1]
      );
      const lot1Id = lotRes1.rows[0].id;

      // Lot 2: Expiring later (70 to 120 days)
      const qty2 = Math.floor(Math.random() * 80) + 20;
      const cost2 = parseFloat((price * 0.6).toFixed(2));
      const expDays2 = Math.floor(Math.random() * 50) + 70; // 70 to 120 days
      const expDate2 = new Date();
      expDate2.setDate(expDate2.getDate() + expDays2);

      const lotRes2 = await client.query(
        `INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date, received_at)
         VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 days') RETURNING id`,
        [drug.tmt_id, `${lotNumberPrefixes[1]}${1000 + i}`, qty2, cost2, expDate2]
      );
      const lot2Id = lotRes2.rows[0].id;

      // Sync stock_quantity in inventory table with total lots
      const totalStock = qty1 + qty2;
      await client.query(
        'UPDATE inventory SET stock_quantity = $1 WHERE drug_id = $2',
        [totalStock, drug.tmt_id]
      );

      // Now create some sales transactions spanning across our cutoff windows
      // We will create sales for "Today's report" and "Yesterday's report"
      // Reminder: reporting day May 26 is (May 25 22:00:01 to May 26 22:00:00)
      // Let's create transactions on May 26 (local Bangkok) at 10:00 AM (Today)
      // and May 25 at 23:30 PM (which belongs to May 26 report too!)
      // and May 25 at 14:00 PM (which belongs to May 25 report)
      
      const saleQty = Math.floor(Math.random() * 4) + 1;
      const subtotal = saleQty * price;
      const discount = parseFloat((subtotal * 0.05).toFixed(2));
      const totalAmount = subtotal - discount;

      // Transaction 1: Today 10:00 AM (Belongs to today's report)
      const tx1Id = `TX-${Date.now()}-A-${i}`;
      const tx1Time = new Date(); // e.g. 10:47 AM today
      tx1Time.setHours(10, 0, 0, 0);

      await client.query(
        `INSERT INTO sales (id, transaction_date, total_amount, payment_method, staff_id, discount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx1Id, tx1Time, totalAmount, 'cash', staffMembers[i % 3], discount]
      );

      await client.query(
        `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal, lot_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx1Id, drug.tmt_id, saleQty, price, subtotal, lot1Id]
      );

      // Transaction 2: Yesterday 23:30 PM (Belongs to today's report since it is after 22:00 yesterday)
      const tx2Id = `TX-${Date.now()}-B-${i}`;
      const tx2Time = new Date();
      tx2Time.setDate(tx2Time.getDate() - 1);
      tx2Time.setHours(23, 30, 0, 0);

      await client.query(
        `INSERT INTO sales (id, transaction_date, total_amount, payment_method, staff_id, discount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx2Id, tx2Time, totalAmount, 'qr_promptpay', staffMembers[(i + 1) % 3], discount]
      );

      await client.query(
        `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal, lot_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx2Id, drug.tmt_id, saleQty, price, subtotal, lot2Id]
      );

      // Transaction 3: Yesterday 14:00 PM (Belongs to YESTERDAY'S report since it is before 22:00 yesterday)
      const tx3Id = `TX-${Date.now()}-C-${i}`;
      const tx3Time = new Date();
      tx3Time.setDate(tx3Time.getDate() - 1);
      tx3Time.setHours(14, 0, 0, 0);

      await client.query(
        `INSERT INTO sales (id, transaction_date, total_amount, payment_method, staff_id, discount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx3Id, tx3Time, totalAmount, 'credit_card', staffMembers[(i + 2) % 3], discount]
      );

      await client.query(
        `INSERT INTO sale_items (sale_id, drug_id, quantity, unit_price, subtotal, lot_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tx3Id, drug.tmt_id, saleQty, price, subtotal, lot2Id]
      );
    }

    await client.query('COMMIT');
    console.log("✅ SUCCESS: Successfully seeded inventory lots and sales transactions!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR: Failed to seed lots and transactions:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedLotsAndTransactions();
