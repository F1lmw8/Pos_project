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

    // 2. Insert Sample Customers with Allergy Data
    console.log("Seeding sample customers...");
    const sampleCustomers = [
      {
        name: 'ลุงเค (เค รุ่งเรือง)',
        id_card: '1100200300999',
        phone: '0819998877',
        allergies: ['Penicillin', 'Sulfa'],
        medical_conditions: 'เบาหวาน, ความดันโลหิตสูง',
        current_medications: 'Metformin 500mg, Amlodipine 5mg'
      },
      {
        name: 'นาย สมชาย ใจดี',
        id_card: '1100200300401',
        phone: '0812345678',
        allergies: ['Amoxicillin', 'Penicillin'],
        medical_conditions: 'ความดันโลหิตสูง',
        current_medications: 'Losartan 50mg'
      },
      {
        name: 'นางสาว สมหญิง มีสุข',
        id_card: '1100200300402',
        phone: '0898765432',
        allergies: ['Aspirin', 'Ibuprofen'],
        medical_conditions: 'โรคหอบหืด',
        current_medications: 'Salbutamol Inhaler'
      }
    ];

    for (const c of sampleCustomers) {
      await client.query(
        `INSERT INTO customers (name, id_card, phone, allergies, medical_conditions, current_medications)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [c.name, c.id_card, c.phone, c.allergies, c.medical_conditions, c.current_medications]
      );
    }
    console.log("Sample customers seeded!");

    // 3. Read drugs.json from the original project
    const drugsJsonPath = path.join(__dirname, '..', 'src', 'data', 'drugs.json');
    if (!fs.existsSync(drugsJsonPath)) {
      throw new Error(`Standard drugs.json file not found at: ${drugsJsonPath}`);
    }

    console.log("Reading and parsing drugs.json...");
    const drugsData = JSON.parse(fs.readFileSync(drugsJsonPath, 'utf8'));
    console.log(`Successfully parsed ${drugsData.length} drug records!`);

    // 4. Batch insert drugs & inventory
    console.log("Inserting drugs, inventory, and FEFO lots (batch processing)...");
    
    const BATCH_SIZE = 500;
    let count = 0;

    for (let i = 0; i < drugsData.length; i += BATCH_SIZE) {
      const batch = drugsData.slice(i, i + BATCH_SIZE);
      
      await client.query('BEGIN');
      
      for (const item of batch) {
        const tmtId = item.c;
        const tradeName = item.t || 'Unknown Drug';
        const activeIngredient = item.a || '';
        const unit = item.u || 'tablet';
        const strength = item.s || '';
        const dosageForm = item.d || '';
        
        if (!tmtId) continue;

        // Classify drug_type based on active ingredients and GPP rules
        const ingLower = activeIngredient.toLowerCase();
        const tradeLower = tradeName.toLowerCase();

        let drugType = 'general';
        if (ingLower.includes('tramadol') || ingLower.includes('zolpidem') || ingLower.includes('pseudoephedrine') || ingLower.includes('alprazolam') || tradeLower.includes('tramadol')) {
          drugType = 'special_controlled'; // ยาควบคุมพิเศษ (ข.ย. 10)
        } else if (ingLower.includes('amoxicillin') || ingLower.includes('ciprofloxacin') || ingLower.includes('azithromycin') || ingLower.includes('ibuprofen') || ingLower.includes('diclofenac') || ingLower.includes('prednisolone') || ingLower.includes('dexamethasone') || ingLower.includes('norfloxacin')) {
          drugType = 'dangerous'; // ยาอันตราย (ข.ย. 11)
        } else if (ingLower.includes('paracetamol') || tradeLower.includes('tylenol') || tradeLower.includes('sara') || tradeLower.includes('decolgen')) {
          drugType = 'household'; // ยาสามัญประจำบ้าน
        }

        // Mock FDA registration number, Barcode (EAN-13), SKU, Manufacturer, and FDA Status
        const fdaRegNo = item.t && item.t.toLowerCase().includes('blackmores') ? '2C 45/43' : `1A ${Math.floor(Math.random() * 800) + 100}/${Math.floor(Math.random() * 20) + 50}`;
        const fdaStatus = (i % 3 === 0) ? 'verified' : (i % 5 === 0) ? 'not_specified' : 'unverified';
        
        // EAN-13 barcode starting with 885 (Thailand prefix) or 405
        const barcodeBase = (i % 2 === 0) ? '885' : '405';
        const barcode = (item.t && item.t.toLowerCase().includes('adalat')) ? '4057598015370' : `${barcodeBase}${String(Math.floor(Math.random() * 1000000000)).padStart(10, '0')}`;
        
        const sku = `P-${String(i + 1).padStart(3, '0')}`;
        
        const mfgList = ['Bayer AG', 'Blackmores Ltd.', 'Siam Pharmaceutical', 'GPO Thailand', 'Pfizer Inc.', 'AstraZeneca', 'Novartis Thailand', 'Osothinter', 'T.O. Pharma'];
        const manufacturer = item.m || mfgList[i % mfgList.length];

        const popularKeywords = ['tylenol', 'sara', 'algycon', 'gaviscon', 'nexium', 'amoxil', 'iprofen', 'viagra', 'lipitor', 'omeprazole', 'panadol', 'decil', 'roche', 'ponstan', 'cravit', 'norvasc', 'plavix', 'singulair', 'paracetamol', 'adalat', 'blackmores'];
        const isPopular = popularKeywords.some(kw => tradeLower.includes(kw) || ingLower.includes(kw));
        const popularityScore = isPopular ? Math.floor(Math.random() * 401) + 100 : 0;

        // Insert drug with GPP drug_type, FDA reg no, SKU, barcode, manufacturer, fda_status
        await client.query(`
          INSERT INTO drugs (tmt_id, trade_name, active_ingredient, unit, strength, dosage_form, drug_type, fda_reg_no, fda_status, sku, barcode, manufacturer, popularity_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (tmt_id) DO NOTHING
        `, [tmtId, tradeName, activeIngredient, unit, strength, dosageForm, drugType, fdaRegNo, fdaStatus, sku, barcode, manufacturer, popularityScore]);

        const stockQty = Math.floor(Math.random() * 136) + 15;
        
        let rawPrice = 15.00;
        const form = dosageForm.toLowerCase();
        const unitName = unit.toLowerCase();
        
        if (form.includes('tablet') || form.includes('capsule') || form.includes('cap') || form.includes('pill')) {
          rawPrice = (Math.random() * 16.5) + 1.5; 
        } else if (unitName.includes('bottle') || form.includes('syrup') || form.includes('suspension') || form.includes('liquid')) {
          rawPrice = (Math.random() * 95) + 25;
        } else if (form.includes('cream') || form.includes('ointment') || form.includes('gel')) {
          rawPrice = (Math.random() * 145) + 35;
        } else if (form.includes('inject') || form.includes('vial') || form.includes('ampoule')) {
          rawPrice = (Math.random() * 205) + 45;
        } else {
          rawPrice = (Math.random() * 85) + 10;
        }
        
        const price = Math.round(rawPrice * 2) / 2;

        await client.query(`
          INSERT INTO inventory (drug_id, stock_quantity, price)
          VALUES ($1, $2, $3)
          ON CONFLICT (drug_id) DO NOTHING
        `, [tmtId, stockQty, price]);

        // Insert mock lot for FEFO ledger
        const costPrice = Math.round((price * 0.65) * 100) / 100;
        const lotNumber = `LOT-${Math.floor(Math.random() * 89999) + 10000}`;
        
        // Random expiry date between 3 months and 2 years in future
        const futureDays = Math.floor(Math.random() * 600) + 90;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + futureDays);

        await client.query(`
          INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date)
          VALUES ($1, $2, $3, $4, $5)
        `, [tmtId, lotNumber, stockQty, costPrice, expiryDate.toISOString().split('T')[0]]);
      }

      await client.query('COMMIT');
      count += batch.length;
      console.log(`  Processed ${count} / ${drugsData.length} records...`);
    }

    console.log(`Successfully seeded ${count} drug, inventory, and FEFO lot records in PostgreSQL!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
