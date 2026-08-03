import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'all'; // 'all', 'vat', 'khoyor', 'controlled', 'tax_invoice'

    // 1. VAT (ภ.พ.30) Calculation
    const vatResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COALESCE(SUM(total_amount * 0.07 / 1.07), 0) AS output_vat,
        COALESCE(SUM(total_amount * 0.65 * 0.07), 0) AS input_vat
      FROM sales
      WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const vatData = vatResult.rows[0];
    const outputVat = Number(vatData.output_vat);
    const inputVat = Number(vatData.input_vat);
    const netVatPayable = Math.max(0, outputVat - inputVat);

    // 2. ข.ย. Counts & Items
    const khoyorCounts = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE drug_type = 'general' OR drug_type = 'household') AS khoyor_9_count,
        COUNT(*) FILTER (WHERE drug_type = 'special_controlled') AS khoyor_10_count,
        COUNT(*) FILTER (WHERE drug_type = 'dangerous') AS khoyor_11_count,
        COUNT(*) FILTER (WHERE drug_type = 'prescription') AS khoyor_12_count,
        COUNT(*) FILTER (WHERE drug_type = 'narcotic' OR drug_type = 'psychotropic') AS bosor_count
      FROM drugs
    `);

    // 3. Controlled Drug Logs (ข.ย. 10 / บ.ส.)
    const controlledLogsResult = await pool.query(`
      SELECT 
        cdl.id,
        cdl.created_at,
        cdl.patient_name,
        cdl.patient_id_card,
        cdl.pharmacist_name,
        cdl.prescriber_name,
        cdl.purpose,
        d.trade_name,
        d.drug_type,
        d.fda_reg_no,
        si.quantity
      FROM controlled_drug_logs cdl
      JOIN drugs d ON cdl.drug_id = d.tmt_id
      LEFT JOIN sale_items si ON cdl.sale_item_id = si.id
      ORDER BY cdl.created_at DESC
      LIMIT 100
    `);

    // 4. Sales Tax Invoices Check (มาตรา 86)
    const salesAuditResult = await pool.query(`
      SELECT 
        id AS invoice_no,
        transaction_date,
        total_amount,
        (total_amount * 0.07 / 1.07) AS vat_amount,
        payment_method
      FROM sales
      ORDER BY transaction_date DESC
      LIMIT 50
    `);

    return NextResponse.json({
      success: true,
      data: {
        vat: {
          period: '08/2026',
          deadline_online: '2026-09-15',
          deadline_paper: '2026-09-07',
          output_vat: outputVat,
          input_vat: inputVat,
          net_payable: netVatPayable,
          effective_tax_rate: totalSalesRate(vatData.total_sales, outputVat)
        },
        khoyor: khoyorCounts.rows[0],
        controlled_logs: controlledLogsResult.rows,
        invoices: salesAuditResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching FDA & Tax report data:', error);
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
      { status: 500 }
    );
  }
}

function totalSalesRate(totalSales, outputVat) {
  if (!totalSales || totalSales <= 0) return '7%';
  return `${((outputVat / totalSales) * 100).toFixed(1)}%`;
}
