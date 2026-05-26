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
               d.popularity_score, i.stock_quantity, i.price
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        ORDER BY d.popularity_score DESC, i.stock_quantity DESC, d.trade_name ASC
        LIMIT 50
      `);
    } else {
      // Support phonetics via the original project's safetyEngine
      const mappedGenerics = mapThaiToEnglishGeneric(queryStr);
      let querySql = `
        SELECT d.tmt_id, d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form,
               d.popularity_score, i.stock_quantity, i.price
        FROM drugs d
        LEFT JOIN inventory i ON d.tmt_id = i.drug_id
        WHERE LOWER(d.trade_name) LIKE $1 
           OR LOWER(d.active_ingredient) LIKE $1 
           OR d.tmt_id LIKE $1
      `;
      
      const queryParams = [`%${queryStr}%`];

      // Add phonetically mapped generic search keywords
      if (mappedGenerics.length > 0) {
        mappedGenerics.forEach((gen, index) => {
          queryParams.push(`%${gen.toLowerCase()}%`);
          querySql += ` OR LOWER(d.active_ingredient) LIKE $${queryParams.length}`;
        });
      }

      querySql += `
        ORDER BY d.popularity_score DESC, i.stock_quantity DESC, d.trade_name ASC
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
