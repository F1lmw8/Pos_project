// Migration: Update old pharmacist_name values in controlled_drug_logs
// Run: node db/migrate_pharmacist_name.js

import pg from 'pg';
import { config } from 'dotenv';
config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE controlled_drug_logs
      SET pharmacist_name = 'ภก. อภิโช โลมทอง (ภ. 34152)'
      WHERE pharmacist_name = 'ภก. สมชาย มีสุข (ภ. 12345)'
         OR pharmacist_name IS NULL
         OR pharmacist_name = ''
    `);
    console.log(`✅ Updated ${result.rowCount} controlled_drug_logs rows to new pharmacist name.`);

    // Also update schema default for future inserts
    await client.query(`
      ALTER TABLE controlled_drug_logs
      ALTER COLUMN pharmacist_name SET DEFAULT 'ภก. อภิโช โลมทอง (ภ. 34152)'
    `);
    console.log('✅ Updated DEFAULT value on controlled_drug_logs.pharmacist_name');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
