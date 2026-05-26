-- D:\project_69\Pos_project\db\update_schema.sql
-- Run this SQL script to apply database updates for Smart Inventory & Shifts

-- 1. Create inventory_lots table to support FEFO (First Expire, First Out)
CREATE TABLE IF NOT EXISTS inventory_lots (
    id SERIAL PRIMARY KEY,
    drug_id VARCHAR(50) NOT NULL REFERENCES drugs(tmt_id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    cost_price DECIMAL(10, 2) NOT NULL CHECK (cost_price >= 0.00),
    expiry_date DATE NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index lot fields for optimal search and expiration check
CREATE INDEX IF NOT EXISTS idx_inventory_lots_drug ON inventory_lots(drug_id);
CREATE INDEX IF NOT EXISTS idx_inventory_lots_expiry ON inventory_lots(expiry_date);

-- 2. Add reorder_point to drugs table for low stock alerts
ALTER TABLE drugs ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10 CHECK (reorder_point >= 0);

-- 3. Add staff_id and discount to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50) DEFAULT 'STAFF-001';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0.00 CHECK (discount >= 0.00);

-- 4. Add lot_id reference and discount/cost fields in sale_items for precision reporting
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS lot_id INTEGER REFERENCES inventory_lots(id) ON DELETE SET NULL;
