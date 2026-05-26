const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables if available
const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
console.log("=========================================");
console.log("PHARMACY POS DATABASE DIAGNOSTIC TOOL");
console.log("=========================================");
console.log(`Target database: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 4000
});

async function runDiagnostics() {
  console.log("\n1. Testing Database Connection Pool...");
  let client;
  try {
    client = await pool.connect();
    console.log("✅ SUCCESS: Successfully established connection with PostgreSQL database!");

    // Check table counts
    console.log("\n2. Checking Table Structures & Row Counts...");
    
    const tables = ['drugs', 'inventory', 'sales', 'sale_items'];
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table "${table}": EXISTS (Row count: ${res.rows[0].count})`);
      } catch (err) {
        console.log(`❌ Table "${table}": DOES NOT EXIST or query failed (Error: ${err.message})`);
      }
    }

    // Try a sample product search
    console.log("\n3. Testing Product Search Query Performance...");
    try {
      const start = Date.now();
      const res = await client.query(`
        SELECT d.tmt_id, d.trade_name, i.stock_quantity, i.price
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        WHERE LOWER(d.trade_name) LIKE '%algycon%' OR LOWER(d.active_ingredient) LIKE '%algycon%'
        LIMIT 5
      `);
      const duration = Date.now() - start;
      console.log(`✅ Search query completed in ${duration}ms.`);
      console.log(`   Found ${res.rows.length} sample results:`);
      res.rows.forEach(r => {
        console.log(`   - TMT-${r.tmt_id} | ${r.trade_name} | Stock: ${r.stock_quantity} | Price: ฿${r.price}`);
      });
    } catch (err) {
      console.log(`❌ Search query failed: ${err.message}`);
    }

    // Test transaction safety and rollback logic
    console.log("\n4. Testing SQL Transaction & Automatic Rollback Integrity...");
    try {
      // Find a drug with stock
      const stockRes = await client.query(`
        SELECT drug_id, stock_quantity 
        FROM inventory 
        WHERE stock_quantity > 0 
        LIMIT 1
      `);

      if (stockRes.rows.length > 0) {
        const testDrug = stockRes.rows[0].drug_id;
        const initialStock = stockRes.rows[0].stock_quantity;
        console.log(`   Selected test drug TMT-${testDrug} with initial stock: ${initialStock}`);

        // Start transaction
        await client.query('BEGIN');

        // Decrement stock
        await client.query('UPDATE inventory SET stock_quantity = stock_quantity - 5 WHERE drug_id = $1', [testDrug]);
        
        // Force an error inside the transaction to test rollback
        console.log("   Simulating a failure (attempting invalid insert) to force rollback...");
        try {
          await client.query('INSERT INTO sales (id, total_amount, payment_method) VALUES (NULL, -100, NULL)');
        } catch (err) {
          console.log(`   Expected error caught successfully inside transaction: ${err.message.substring(0, 50)}...`);
        }

        // Rollback transaction
        await client.query('ROLLBACK');
        console.log("   Executed ROLLBACK. Verifying stock level restored...");

        const verifyRes = await client.query('SELECT stock_quantity FROM inventory WHERE drug_id = $1', [testDrug]);
        const finalStock = verifyRes.rows[0].stock_quantity;
        
        if (finalStock === initialStock) {
          console.log(`✅ SUCCESS: Transaction successfully rolled back! Stock restored perfectly to ${finalStock}.`);
        } else {
          console.log(`❌ FAILURE: Stock was modified despite rollback! Stock is now: ${finalStock}.`);
        }
      } else {
        console.log("⚠️ SKIPPED: Cannot run rollback test because no inventory rows currently have stock (database may be unseeded).");
      }
    } catch (err) {
      console.log(`❌ Rollback diagnostics failed: ${err.message}`);
    }

  } catch (error) {
    console.error("❌ ERROR: Connection failed!", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log("   - Make sure your PostgreSQL server is active and running.");
    console.log("   - Verify that database name, username, and password in .env are correct.");
    console.log("   - If the target database doesn't exist, create it in pgAdmin or psql first.");
  } finally {
    if (client) client.release();
    await pool.end();
    console.log("\n=========================================");
    console.log("Diagnostics finished.");
    console.log("=========================================");
  }
}

runDiagnostics();
