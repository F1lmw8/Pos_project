import { NextResponse } from 'next/server';
import pool from '../../../utils/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  try {
    let result;
    if (!q) {
      result = await pool.query(`
        SELECT id, name, id_card, phone, allergies, medical_conditions, current_medications, created_at
        FROM customers
        ORDER BY created_at DESC
        LIMIT 50
      `);
    } else {
      result = await pool.query(
        `
        SELECT id, name, id_card, phone, allergies, medical_conditions, current_medications, created_at
        FROM customers
        WHERE LOWER(name) LIKE $1 OR phone LIKE $1 OR id_card LIKE $1
        ORDER BY name ASC
        LIMIT 50
      `,
        [`%${q.toLowerCase()}%`]
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, id_card, phone, allergies, medical_conditions, current_medications } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const allergiesArr = Array.isArray(allergies)
      ? allergies
      : allergies
      ? allergies.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const result = await pool.query(
      `
      INSERT INTO customers (name, id_card, phone, allergies, medical_conditions, current_medications)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, id_card, phone, allergies, medical_conditions, current_medications, created_at
    `,
      [name, id_card || '', phone || '', allergiesArr, medical_conditions || '', current_medications || '']
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
