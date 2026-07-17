const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables if available
const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
console.log(`Connecting to database: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000
});

async function runSeed() {
  const client = await pool.connect();
  try {
    // 1. Read and execute schema.sql
    console.log("Reading schema.sql...");
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Executing schema migrations...");
    await client.query(schemaSql);
    console.log("Database schema initialized successfully!");

    // 2. Read drugs.json from the original project
    const drugsJsonPath = path.join(__dirname, '..', 'src', 'data', 'drugs.json');
    if (!fs.existsSync(drugsJsonPath)) {
      throw new Error(`Standard drugs.json file not found at: ${drugsJsonPath}`);
    }

    console.log("Reading and parsing drugs.json...");
    const drugsData = JSON.parse(fs.readFileSync(drugsJsonPath, 'utf8'));
    console.log(`Successfully parsed ${drugsData.length} drug records!`);

    // 3. Batch insert drugs & inventory
    console.log("Inserting drugs and inventory records (batch processing)...");
    
    const BATCH_SIZE = 500;
    let count = 0;

    for (let i = 0; i < drugsData.length; i += BATCH_SIZE) {
      const batch = drugsData.slice(i, i + BATCH_SIZE);
      
      // We will perform a transaction for each batch to keep it fast and atomic
      await client.query('BEGIN');
      
      for (const item of batch) {
        // Map fields from JSON: c -> tmt_id, t -> trade_name, a -> active_ingredient, u -> unit, s -> strength, d -> dosage_form
        const tmtId = item.c;
        const tradeName = item.t || 'Unknown Drug';
        const activeIngredient = item.a || '';
        const unit = item.u || 'tablet';
        const strength = item.s || '';
        const dosageForm = item.d || '';
        
        // Skip records without a TMT ID
        if (!tmtId) continue;

        // Define popular drug brands/generic keywords to boost them initially
        const popularKeywords = ['tylenol', 'sara', 'algycon', 'gaviscon', 'nexium', 'amoxil', 'iprofen', 'viagra', 'lipitor', 'omeprazole', 'panadol', 'decil', 'roche', 'ponstan', 'cravit', 'norvasc', 'plavix', 'singulair', 'paracetamol'];
        const isPopular = popularKeywords.some(kw => tradeName.toLowerCase().includes(kw) || activeIngredient.toLowerCase().includes(kw));
        const popularityScore = isPopular ? Math.floor(Math.random() * 401) + 100 : 0; // 100 to 500 for popular, 0 for others

        // Insert drug
        await client.query(`
          INSERT INTO drugs (tmt_id, trade_name, active_ingredient, unit, strength, dosage_form, popularity_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tmt_id) DO NOTHING
        `, [tmtId, tradeName, activeIngredient, unit, strength, dosageForm, popularityScore]);

        // Generate mock inventory: random stock quantity between 15 and 150
        const stockQty = Math.floor(Math.random() * 136) + 15; // 15 to 150
        
        // Generate highly realistic pharmacy prices based on dosage form/unit
        let rawPrice = 15.00; // default fallback
        const form = dosageForm.toLowerCase();
        const unitName = unit.toLowerCase();
        
        if (form.includes('tablet') || form.includes('capsule') || form.includes('cap') || form.includes('pill')) {
          // Tablets/Capsules are sold individually: 1.50 to 18.00 Baht
          rawPrice = (Math.random() * 16.5) + 1.5; 
        } else if (unitName.includes('bottle') || form.includes('syrup') || form.includes('suspension') || form.includes('liquid')) {
          // Bottles of syrup/liquids: 25.00 to 120.00 Baht
          rawPrice = (Math.random() * 95) + 25;
        } else if (form.includes('cream') || form.includes('ointment') || form.includes('gel')) {
          // Creams & Ointments: 35.00 to 180.00 Baht
          rawPrice = (Math.random() * 145) + 35;
        } else if (form.includes('inject') || form.includes('vial') || form.includes('ampoule')) {
          // Injections: 45.00 to 250.00 Baht
          rawPrice = (Math.random() * 205) + 45;
        } else {
          // Default other packaging: 10.00 to 95.00 Baht
          rawPrice = (Math.random() * 85) + 10;
        }
        
        const price = Math.round(rawPrice * 2) / 2; // Round to nearest 0.50 Baht

        // Insert inventory
        await client.query(`
          INSERT INTO inventory (drug_id, stock_quantity, price)
          VALUES ($1, $2, $3)
          ON CONFLICT (drug_id) DO NOTHING
        `, [tmtId, stockQty, price]);
      }

      await client.query('COMMIT');
      count += batch.length;
      console.log(`  Processed ${count} / ${drugsData.length} records...`);
    }

    console.log(`Successfully seeded ${count} drug and inventory records in PostgreSQL!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
