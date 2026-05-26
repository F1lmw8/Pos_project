-- Drop existing tables if they exist to allow clean seeding
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS drugs CASCADE;

-- 1. Drugs Table (Standard National TMT Database)
CREATE TABLE drugs (
    tmt_id VARCHAR(50) PRIMARY KEY,        -- TPUCode/TMT ID (matches 'c' in drugs.json)
    trade_name TEXT NOT NULL,              -- Trade name (matches 't')
    active_ingredient TEXT,                -- Active generic ingredients (matches 'a')
    unit VARCHAR(100),                     -- Package Unit (matches 'u')
    strength TEXT,                         -- Strength (matches 's')
    dosage_form TEXT,                      -- Dosage form (matches 'd')
    popularity_score INTEGER DEFAULT 0,    -- Popularity metric (Best-seller boost)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize search indexing on drugs
CREATE INDEX idx_drugs_trade_name ON drugs (trade_name);
CREATE INDEX idx_drugs_active_ingredient ON drugs (active_ingredient);

-- 2. Inventory Table (Store Stock levels)
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    drug_id VARCHAR(50) UNIQUE REFERENCES drugs(tmt_id) ON DELETE CASCADE,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0.00),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for stock availability checks
CREATE INDEX idx_inventory_drug_id ON inventory (drug_id);

-- 3. Sales Table (Sales Transactions)
CREATE TABLE sales (
    id VARCHAR(50) PRIMARY KEY,           -- Transaction ID (we will generate UUID/ShortID in JS)
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0.00),
    payment_method VARCHAR(50) NOT NULL,  -- 'cash', 'qr_promptpay', 'credit_card'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Sale Items Table (Sales Line-Items)
CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    drug_id VARCHAR(50) NOT NULL REFERENCES drugs(tmt_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0.00),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimize analytics query lookups
CREATE INDEX idx_sale_items_sale_id ON sale_items (sale_id);
CREATE INDEX idx_sale_items_drug_id ON sale_items (drug_id);
