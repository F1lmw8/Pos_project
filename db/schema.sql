-- Drop existing tables if they exist to allow clean seeding
DROP TABLE IF EXISTS controlled_drug_logs CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS inventory_lots CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS drugs CASCADE;

-- 1. Drugs Table (Standard National TMT Database + GPP classification)
CREATE TABLE drugs (
    tmt_id VARCHAR(50) PRIMARY KEY,        -- TPUCode/TMT ID (matches 'c' in drugs.json)
    trade_name TEXT NOT NULL,              -- Trade name (matches 't')
    active_ingredient TEXT,                -- Active generic ingredients (matches 'a')
    unit VARCHAR(100),                     -- Package Unit (matches 'u')
    strength TEXT,                         -- Strength (matches 's')
    dosage_form TEXT,                      -- Dosage form (matches 'd')
    drug_type VARCHAR(50) DEFAULT 'general', -- 'general', 'household', 'dangerous' (ยาอันตราย), 'special_controlled' (ยาควบคุมพิเศษ)
    fda_reg_no VARCHAR(50),                -- เลขทะเบียน อย. (เช่น 1A 123/45)
    reorder_point INTEGER DEFAULT 10 CHECK (reorder_point >= 0),
    popularity_score INTEGER DEFAULT 0,    -- Popularity metric (Best-seller boost)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize search indexing on drugs
CREATE INDEX idx_drugs_trade_name ON drugs (trade_name);
CREATE INDEX idx_drugs_active_ingredient ON drugs (active_ingredient);
CREATE INDEX idx_drugs_drug_type ON drugs (drug_type);

-- 2. Customers / Patients Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    id_card VARCHAR(20),                   -- เลขบัตรประชาชน / Passport
    phone VARCHAR(50),                     -- เบอร์โทรศัพท์
    allergies TEXT[],                      -- รายการยาที่แพ้ (เช่น ['Amoxicillin', 'Aspirin'])
    medical_conditions TEXT,               -- โรคประจำตัว
    current_medications TEXT,              -- ยาที่ใช้ปัจจุบัน
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_id_card ON customers (id_card);

-- 3. Inventory Table (Store Stock levels)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    drug_id VARCHAR(50) UNIQUE REFERENCES drugs(tmt_id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0.00),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for stock availability checks
CREATE INDEX idx_inventory_drug_id ON inventory (drug_id);

-- 4. Sales Table (Sales Transactions)
CREATE TABLE sales (
    id VARCHAR(50) PRIMARY KEY,           -- Transaction ID
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    payment_method VARCHAR(50) NOT NULL,  -- 'cash', 'qr_promptpay', 'credit_card'
    staff_id VARCHAR(50) DEFAULT 'STAFF-001',
    discount DECIMAL(10, 2) DEFAULT 0.00 CHECK (discount >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory Lots Table (FEFO Stock Ledger)
CREATE TABLE inventory_lots (
    id SERIAL PRIMARY KEY,
    drug_id VARCHAR(50) NOT NULL REFERENCES drugs(tmt_id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0.00),
    expiry_date DATE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_lots_drug ON inventory_lots(drug_id);
CREATE INDEX idx_inventory_lots_expiry ON inventory_lots(expiry_date);

-- 6. Sale Items Table (Sales Line-Items)
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    drug_id VARCHAR(50) NOT NULL REFERENCES drugs(tmt_id),
    lot_id INTEGER REFERENCES inventory_lots(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0.00),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale_id ON sale_items (sale_id);
CREATE INDEX idx_sale_items_drug_id ON sale_items (drug_id);

-- 7. Controlled Drug Records Table (ข.ย. 9, ข.ย. 10, ข.ย. 11 Compliance)
CREATE TABLE controlled_drug_logs (
    id SERIAL PRIMARY KEY,
    sale_item_id INTEGER REFERENCES sale_items(id) ON DELETE CASCADE,
    drug_id VARCHAR(50) NOT NULL REFERENCES drugs(tmt_id),
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_id_card VARCHAR(20),
    prescriber_name VARCHAR(255),          -- แพทย์ / เภสัชกรผู้สั่งใช้
    pharmacist_name VARCHAR(255) DEFAULT 'ภก. สมชาย มีสุข (ภ. 12345)', -- เภสัชกรผู้ส่งมอบ
    purpose TEXT,                          -- อาการป่วย / เหตุผลในการจ่าย
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_controlled_logs_drug ON controlled_drug_logs(drug_id);
CREATE INDEX idx_controlled_logs_patient ON controlled_drug_logs(patient_name);
