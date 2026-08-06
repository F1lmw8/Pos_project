import { NextResponse } from 'next/server';
import pool from '../../../utils/db';
import { mapThaiToEnglishGeneric } from '../../../utils/safetyEngine';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const queryStr = q.trim().toLowerCase();

  try {
    let result;

    if (!queryStr || queryStr.length < 2) {
      // Return top 50 drugs sorted by popularity score first
      result = await pool.query(`
        SELECT d.tmt_id, d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form,
               d.drug_type, d.fda_reg_no, d.fda_status, d.sku, d.barcode, d.manufacturer, d.popularity_score,
               LEAST(COALESCE(i.stock_quantity, 0), COALESCE(lot_stock.sellable_quantity, 0)) AS stock_quantity,
               i.price
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        LEFT JOIN LATERAL (
          SELECT SUM(il.quantity) AS sellable_quantity
          FROM inventory_lots il
          WHERE il.drug_id = d.tmt_id
            AND il.quantity > 0
            AND il.expiry_date >= CURRENT_DATE
        ) lot_stock ON TRUE
        ORDER BY
          CASE WHEN LEAST(COALESCE(i.stock_quantity, 0), COALESCE(lot_stock.sellable_quantity, 0)) > 0 THEN 0 ELSE 1 END,
          d.popularity_score DESC,
          i.stock_quantity DESC,
          d.trade_name ASC
        LIMIT 50
      `);
    } else {
      // Support phonetics via the original project's safetyEngine
      const mappedGenerics = mapThaiToEnglishGeneric(queryStr);
      const queryParams = [`%${queryStr}%`];
      const matchClauses = [
        'LOWER(trade_name) LIKE $1',
        'LOWER(active_ingredient) LIKE $1',
        'LOWER(tmt_id) LIKE $1',
        'LOWER(barcode) LIKE $1',
        'LOWER(sku) LIKE $1',
        'LOWER(fda_reg_no) LIKE $1'
      ];

      // Add phonetically mapped generic search keywords
      if (mappedGenerics.length > 0) {
        mappedGenerics.forEach((gen) => {
          queryParams.push(`%${gen.toLowerCase()}%`);
          matchClauses.push(`LOWER(active_ingredient) LIKE $${queryParams.length}`);
        });
      }

      const directMatchSql = matchClauses.join(' OR ');
      const querySql = `
        WITH direct_matches AS (
          SELECT *
          FROM drugs
          WHERE ${directMatchSql}
        ),
        candidates AS (
          SELECT direct_matches.*, 0 AS match_rank
          FROM direct_matches

          UNION ALL

          SELECT d.*, 1 AS match_rank
          FROM drugs d
          JOIN (
            SELECT DISTINCT LOWER(active_ingredient) AS active_ingredient_key
            FROM direct_matches
            WHERE active_ingredient IS NOT NULL AND active_ingredient <> ''
          ) matched_ingredients
            ON LOWER(d.active_ingredient) = matched_ingredients.active_ingredient_key
          WHERE NOT EXISTS (
            SELECT 1
            FROM direct_matches dm
            WHERE dm.tmt_id = d.tmt_id
          )

          UNION ALL

          SELECT d.*, 2 AS match_rank
          FROM drugs d
          JOIN (
            SELECT DISTINCT TRIM(part) AS ingredient_part
            FROM direct_matches dm
            CROSS JOIN LATERAL regexp_split_to_table(LOWER(dm.active_ingredient), '\\s*\\+\\s*') AS part
            WHERE dm.active_ingredient IS NOT NULL
              AND dm.active_ingredient <> ''
              AND LENGTH(TRIM(part)) >= 4
          ) ingredient_parts
            ON LOWER(d.active_ingredient) LIKE '%' || ingredient_parts.ingredient_part || '%'
          WHERE NOT EXISTS (
            SELECT 1
            FROM direct_matches dm
            WHERE dm.tmt_id = d.tmt_id
          )
        ),
        ranked_candidates AS (
          SELECT DISTINCT ON (tmt_id) *
          FROM candidates
          ORDER BY tmt_id, match_rank
        )
        SELECT d.tmt_id, d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form,
               d.drug_type, d.fda_reg_no, d.fda_status, d.sku, d.barcode, d.manufacturer, d.popularity_score,
               LEAST(COALESCE(i.stock_quantity, 0), COALESCE(lot_stock.sellable_quantity, 0)) AS stock_quantity,
               i.price
        FROM ranked_candidates d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        LEFT JOIN LATERAL (
          SELECT SUM(il.quantity) AS sellable_quantity
          FROM inventory_lots il
          WHERE il.drug_id = d.tmt_id
            AND il.quantity > 0
            AND il.expiry_date >= CURRENT_DATE
        ) lot_stock ON TRUE
        ORDER BY
          CASE WHEN LEAST(COALESCE(i.stock_quantity, 0), COALESCE(lot_stock.sellable_quantity, 0)) > 0 THEN 0 ELSE 1 END,
          d.match_rank ASC,
          d.popularity_score DESC,
          i.stock_quantity DESC,
          d.trade_name ASC
        LIMIT 50
      `;

      result = await pool.query(querySql, queryParams);
    }

    return NextResponse.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    );
  }
}

// POST create new drug in database
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      tmt_id,
      trade_name,
      active_ingredient,
      unit,
      strength,
      dosage_form,
      drug_type,
      fda_reg_no,
      fda_status,
      sku,
      barcode,
      manufacturer,
      price,
      stock_quantity
    } = body;

    const drugId = tmt_id || sku || `DRUG-${Date.now()}`;
    const drugSku = sku || `SKU-${Date.now()}`;

    // 1. Insert into drugs table
    await pool.query(`
      INSERT INTO drugs (
        tmt_id, trade_name, active_ingredient, unit, strength, dosage_form,
        drug_type, fda_reg_no, fda_status, sku, barcode, manufacturer
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (tmt_id) DO UPDATE
      SET trade_name = EXCLUDED.trade_name,
          active_ingredient = EXCLUDED.active_ingredient,
          fda_reg_no = EXCLUDED.fda_reg_no,
          manufacturer = EXCLUDED.manufacturer
    `, [
      drugId,
      trade_name || 'ยาทั่วไป',
      active_ingredient || trade_name || '',
      unit || 'กล่อง',
      strength || '',
      dosage_form || 'tablet',
      drug_type || 'general',
      fda_reg_no || '',
      fda_status || 'verified',
      drugSku,
      barcode || '',
      manufacturer || ''
    ]);

    // 2. Insert into inventory table
    const numPrice = price ? parseFloat(price) : 0.00;
    const numStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : (body.stock_qty ? parseInt(body.stock_qty, 10) : 0);

    await pool.query(`
      INSERT INTO inventory (drug_id, stock_quantity, price)
      VALUES ($1, $2, $3)
      ON CONFLICT (drug_id) DO UPDATE
      SET price = EXCLUDED.price,
          stock_quantity = EXCLUDED.stock_quantity,
          updated_at = CURRENT_TIMESTAMP
    `, [drugId, numStock, numPrice]);

    // 3. Ensure inventory_lots entry
    if (numStock > 0) {
      await pool.query(`
        INSERT INTO inventory_lots (drug_id, lot_number, quantity, cost_price, expiry_date)
        VALUES ($1, 'LOT-ADD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD'), $2, $3 * 0.7, CURRENT_DATE + INTERVAL '2 years')
        ON CONFLICT DO NOTHING
      `, [drugId, numStock, numPrice]);
    }

    // Fetch created product
    const createdRes = await pool.query(`
      SELECT d.*, 
             COALESCE(i.stock_quantity, 0) AS stock_quantity, 
             COALESCE(i.price, 0.00) AS price
      FROM drugs d
      LEFT JOIN inventory i ON d.tmt_id = i.drug_id
      WHERE d.tmt_id = $1
    `, [drugId]);

    return NextResponse.json({
      success: true,
      message: 'เพิ่มสินค้าลงคลังเรียบร้อยแล้ว',
      data: createdRes.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product', message: error.message },
      { status: 500 }
    );
  }
}

