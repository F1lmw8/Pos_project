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
               d.drug_type, d.fda_reg_no, d.popularity_score,
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
        'tmt_id LIKE $1'
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
               d.drug_type, d.fda_reg_no, d.popularity_score,
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
