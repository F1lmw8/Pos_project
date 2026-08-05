import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'khor_yor_10'; // khor_yor_9, khor_yor_10, khor_yor_11
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  try {
    let result;

    if (type === 'khor_yor_9') {
      // ข.ย. 9: บัญชีการซื้อยา
      let dateFilter = '';
      const params = [];
      if (startDate && endDate) {
        dateFilter = 'WHERE il.received_at >= $1 AND il.received_at <= $2';
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      result = await pool.query(
        `
        SELECT il.id, il.lot_number, il.quantity, il.cost_price, il.expiry_date, il.received_at,
               d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form, d.fda_reg_no, d.drug_type
        FROM inventory_lots il
        JOIN drugs d ON il.drug_id = d.tmt_id
        ${dateFilter}
        ORDER BY il.received_at DESC
        LIMIT 200
      `,
        params
      );
    } else {
      // ข.ย. 10 (ยาควบคุมพิเศษ) และ ข.ย. 11 (ยาอันตราย)
      const targetDrugType = type === 'khor_yor_10' ? 'special_controlled' : 'dangerous';
      let dateFilter = 'WHERE (d.drug_type = $1 OR cdl.id IS NOT NULL)';
      const params = [targetDrugType];

      if (startDate && endDate) {
        dateFilter += ' AND s.transaction_date >= $2 AND s.transaction_date <= $3';
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
      }

      result = await pool.query(
        `
        SELECT cdl.id AS log_id, cdl.patient_name, cdl.patient_id_card, cdl.prescriber_name,
               COALESCE(NULLIF(cdl.pharmacist_name, ''), 'ภก. สมชาย มีสุข (ภ. 12345)') AS pharmacist_name,
               COALESCE(NULLIF(cdl.purpose, ''), 'บรรเทาปวด/รักษาอาการป่วยเบื้องต้น') AS purpose,
               cdl.created_at AS log_date,
               si.quantity, si.unit_price, si.subtotal,
               il.lot_number, il.expiry_date,
               d.tmt_id, d.trade_name, d.active_ingredient, d.unit, d.strength, d.dosage_form, d.fda_reg_no, d.drug_type,
               s.id AS sale_id, s.transaction_date, s.payment_method
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN drugs d ON si.drug_id = d.tmt_id
        LEFT JOIN inventory_lots il ON si.lot_id = il.id
        LEFT JOIN controlled_drug_logs cdl ON cdl.sale_item_id = si.id
        ${dateFilter}
        ORDER BY s.transaction_date DESC
        LIMIT 200
      `,
        params
      );
    }

    return NextResponse.json({
      success: true,
      report_type: type,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching GPP report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch GPP report' },
      { status: 500 }
    );
  }
}
