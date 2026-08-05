import { NextResponse } from 'next/server';
import pool from '../../../../../utils/db';

export async function GET(request, { params }) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid customer ID' },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch Customer Info
    const custRes = await pool.query(
      `SELECT id, name, id_card, phone, age, gender, weight, height, allergies, medical_conditions, current_medications, created_at
       FROM customers
       WHERE id = $1`,
      [customerId]
    );

    if (custRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = custRes.rows[0];

    // 2. Fetch Sales History with Line Items and Drug Details
    const salesRes = await pool.query(
      `SELECT 
        s.id AS sale_id,
        s.transaction_date,
        s.total_amount,
        s.payment_method,
        s.staff_id,
        si.id AS item_id,
        si.quantity,
        si.unit_price,
        si.subtotal,
        d.tmt_id AS drug_id,
        d.trade_name,
        d.active_ingredient,
        d.strength,
        d.dosage_form,
        d.drug_type,
        d.fda_reg_no,
        il.lot_number
       FROM sales s
       JOIN sale_items si ON s.id = si.sale_id
       JOIN drugs d ON si.drug_id = d.tmt_id
       LEFT JOIN inventory_lots il ON si.lot_id = il.id
       WHERE s.customer_id = $1
       ORDER BY s.transaction_date DESC, si.id ASC`,
      [customerId]
    );

    // Group rows by transaction/sale_id
    const salesMap = new Map();
    const now = new Date();

    salesRes.rows.forEach((row) => {
      if (!salesMap.has(row.sale_id)) {
        salesMap.set(row.sale_id, {
          sale_id: row.sale_id,
          transaction_date: row.transaction_date,
          total_amount: Number(row.total_amount),
          payment_method: row.payment_method,
          staff_id: row.staff_id || 'ภก. ผู้สั่งจ่ายยา',
          items: []
        });
      }

      const sale = salesMap.get(row.sale_id);
      sale.items.push({
        item_id: row.item_id,
        drug_id: row.drug_id,
        trade_name: row.trade_name,
        active_ingredient: row.active_ingredient,
        strength: row.strength,
        dosage_form: row.dosage_form,
        drug_type: row.drug_type,
        fda_reg_no: row.fda_reg_no,
        lot_number: row.lot_number || '-',
        quantity: Number(row.quantity),
        unit_price: Number(row.unit_price),
        subtotal: Number(row.subtotal)
      });
    });

    const historyList = Array.from(salesMap.values());

    // 3. Expanded Clinical Analysis Engine for Pharmacist Decision Support
    const clinicalAlerts = [];
    const allergiesList = customer.allergies || [];

    // RULE 1: Drug Allergy & Cross-Reaction Check against patient registered allergies
    historyList.forEach((sale) => {
      sale.items.forEach((item) => {
        const active = (item.active_ingredient || '').toLowerCase();
        const trade = (item.trade_name || '').toLowerCase();

        allergiesList.forEach((allergy) => {
          const alg = allergy.toLowerCase().trim();
          if (!alg) return;

          const isDirectAllergy = active.includes(alg) || trade.includes(alg);
          const isPenicillinCross = (alg.includes('penicillin') || alg.includes('amoxicillin')) && (active.includes('amoxicillin') || active.includes('ampicillin') || active.includes('penicillin'));
          const isNsaidCross = (alg.includes('aspirin') || alg.includes('ibuprofen')) && /ibuprofen|naproxen|mefenamic|diclofenac|celecoxib/i.test(active);

          if (isDirectAllergy || isPenicillinCross || isNsaidCross) {
            // Avoid duplicate alert cards for same drug
            if (!clinicalAlerts.some(a => a.drug_name === item.trade_name && a.level === 'danger')) {
              clinicalAlerts.push({
                level: 'danger',
                title: `🚨 สกัดกั้นอันตราย: ตรวจพบยาที่มีประวัติแพ้ (${allergy})`,
                drug_name: item.trade_name,
                message: `ผู้ป่วยมีประวัติแพ้ยาในกลุ่ม "${allergy}" และเคยได้รับยา "${item.trade_name}" เภสัชกรต้องซักประวัติเพิ่มและห้ามจ่ายยาแพ้ซ้ำเด็ดขาด!`,
                days_ago: 0
              });
            }
          }
        });
      });
    });

    // RULE 2-7: Categorization & Continuous Use / Duplication / High-Risk Detection
    const recentPurchaseMap = new Map();

    historyList.forEach((sale) => {
      const saleDate = new Date(sale.transaction_date);
      const diffTime = Math.abs(now - saleDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      sale.items.forEach((item) => {
        const key = item.active_ingredient || item.trade_name;
        const activeLower = (item.active_ingredient || item.trade_name).toLowerCase();

        const isNSAID = /ibuprofen|naproxen|mefenamic|diclofenac|celecoxib|etoricoxib|indomethacin|piroxicam/i.test(activeLower);
        const isAntibiotic = /amoxicillin|penicillin|clindamycin|azithromycin|ciprofloxacin|norfloxacin|doxycycline|clarithromycin|cefdinir|cephalexin/i.test(activeLower);
        const isSteroid = /dexamethasone|prednisolone|triamcinolone|betamethasone|hydrocortisone|methylprednisolone/i.test(activeLower);
        const isAcneRetinoid = /isotretinoin|roaccutane|acnotin/i.test(activeLower);
        const isSedative = /chlorpheniramine|diphenhydramine|hydroxyzine|triprolidine|diazepam|alprazolam|lorazepam|clonazepam|zolpidem/i.test(activeLower);

        if (diffDays <= 30) {
          if (!recentPurchaseMap.has(key)) {
            recentPurchaseMap.set(key, {
              trade_name: item.trade_name,
              active_ingredient: key,
              days_ago: diffDays,
              total_qty: item.quantity,
              isNSAID,
              isAntibiotic,
              isSteroid,
              isAcneRetinoid,
              isSedative
            });
          } else {
            const existing = recentPurchaseMap.get(key);
            existing.total_qty += item.quantity;
            if (diffDays < existing.days_ago) existing.days_ago = diffDays;
          }
        }
      });
    });

    // Generate alerts from categorization map
    recentPurchaseMap.forEach((info) => {
      if (info.isNSAID && info.days_ago <= 14) {
        clinicalAlerts.push({
          level: 'warning',
          title: '⚠️ เฝ้าระวังการใช้ยา NSAIDs ติดต่อกัน',
          drug_name: info.trade_name,
          message: `ผู้ป่วยซื้อยาแก้ปวดกลุ่ม NSAIDs (${info.trade_name}) ไปเมื่อ ${info.days_ago} วันที่แล้ว (สะสม ${info.total_qty} รายการ) หากรับประทานติดต่อกันเสี่ยงต่อการเกิดแผลในกระเพาะอาหาร/พิษต่อไต เภสัชกรควรสอบถามอาการก่อนจ่ายยาเพิ่ม`,
          days_ago: info.days_ago
        });
      }

      if (info.isAntibiotic && info.days_ago <= 14) {
        clinicalAlerts.push({
          level: 'info',
          title: '💊 ประวัติการรับยาปฏิชีวนะ (ติดตามคอร์สยา/ป้องกันเชื้อดื้อยา)',
          drug_name: info.trade_name,
          message: `ผู้ป่วยได้รับยาฆ่าเชื้อ/ยาปฏิชีวนะ (${info.trade_name}) เมื่อ ${info.days_ago} วันที่แล้ว เภสัชกรควรติดตามผลการรักษา การทานยาครบตามคอร์ส และประเมินอาการดื้อยา`,
          days_ago: info.days_ago
        });
      }

      if (info.isSteroid && info.days_ago <= 30) {
        clinicalAlerts.push({
          level: 'warning',
          title: '🛑 เฝ้าระวังการใช้ยาสเตียรอยด์ (Steroid Warning)',
          drug_name: info.trade_name,
          message: `ผู้ป่วยมีการรับยาสเตียรอยด์ (${info.trade_name}) เมื่อ ${info.days_ago} วันที่แล้ว การใช้ติดต่อกันเสี่ยงต่อภาวะ Cushing Syndrome, หน้าบวม, ความดันสูง, แผลในกระเพาะอาหาร และกดภูมิคุ้มกัน เภสัชกรควรตรวจสอบใบสั่งแพทย์`,
          days_ago: info.days_ago
        });
      }

      if (info.isAcneRetinoid && info.days_ago <= 30) {
        clinicalAlerts.push({
          level: 'danger',
          title: '🚫 ยาควบคุมพิเศษเสี่ยงสูง (Isotretinoin / ยารักษาสิว)',
          drug_name: info.trade_name,
          message: `ผู้ป่วยรับยารักษาสิวกลุ่ม Isotretinoin (${info.trade_name}) เมื่อ ${info.days_ago} วันที่แล้ว ยานี้มีพิษต่อทารกในครรภ์ร้ายแรง (Teratogenic) และมีพิษต่อตับ เภสัชกรต้องยืนยันการตรวจครรภ์/ค่าตับและซักประวัติอย่างเข้มงวด`,
          days_ago: info.days_ago
        });
      }

      if (info.isSedative && info.days_ago <= 14) {
        clinicalAlerts.push({
          level: 'info',
          title: '😴 ยาเสี่ยงง่วงซึมสะสม (Sedatives / Sedating Antihistamines)',
          drug_name: info.trade_name,
          message: `ผู้ป่วยรับยาที่มีฤทธิ์กดประสาท/ง่วงซึม (${info.trade_name}) เมื่อ ${info.days_ago} วันที่แล้ว เภสัชกรควรเตือนเรื่องการขับขี่ยานพาหนะและการทำงานกับเครื่องจักรกล`,
          days_ago: info.days_ago
        });
      }
    });

    // Check Therapeutic Duplication (e.g. 2 different NSAIDs in last 14 days)
    const nsaidCount = Array.from(recentPurchaseMap.values()).filter(x => x.isNSAID && x.days_ago <= 14).length;
    if (nsaidCount >= 2) {
      clinicalAlerts.unshift({
        level: 'warning',
        title: '⚡ ตรวจพบการใช้ยาซ้ำซ้อนในกลุ่มบำบัดเดียวกัน (Therapeutic Duplication)',
        drug_name: 'กลุ่มยา NSAIDs ซ้ำซ้อน',
        message: `ผู้ป่วยได้รับยาแก้ปวดอักเสบกลุ่ม NSAIDs มากกว่า 1 รายการย้อนหลังใน 14 วัน การใช้ NSAIDs ร่วมกันไม่เพิ่มผลแก้ปวดแต่เพิ่มพิษต่อไตและกระเพาะอาหารเป็น 2 เท่า!`,
        days_ago: 0
      });
    }

    return NextResponse.json({
      success: true,
      customer,
      history: historyList,
      clinical_alerts: clinicalAlerts
    });
  } catch (error) {
    console.error('Error fetching customer sales history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer history' },
      { status: 500 }
    );
  }
}
