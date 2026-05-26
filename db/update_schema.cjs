const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
console.log("Connecting to:", connectionString.replace(/:([^:@]+)@/, ':****@'));

const pool = new Pool({ connectionString });

async function applyUpdates() {
  const sqlPath = path.join(__dirname, 'update_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  const client = await pool.connect();
  try {
    console.log("Applying database updates...");
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log("✅ SUCCESS: Database schema updated successfully!");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ ERROR: Failed to apply schema updates:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyUpdates();
