import { NextResponse } from 'next/server';
import pool from '../../../../utils/db';

// Helper to determine the reporting date of any UTC timestamp in Bangkok local time
function getReportingDay(transactionDateStr) {
  const d = new Date(transactionDateStr);
  // Convert UTC to local Bangkok time (+7 hours)
  const localTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  const hour = localTime.getUTCHours();
  
  let reportDate = new Date(`${year}-${month}-${day}`);
  if (hour >= 22) {
    // If the transaction local hour is 22:00 or later, it belongs to the next day's report
    reportDate.setDate(reportDate.getDate() + 1);
  }
  
  const rYear = reportDate.getFullYear();
  const rMonth = String(reportDate.getMonth() + 1).padStart(2, '0');
  const rDay = String(reportDate.getDate()).padStart(2, '0');
  
  return `${rYear}-${rMonth}-${rDay}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date'); // Target date (e.g. '2026-05-26')
    const timeframe = searchParams.get('timeframe') || 'daily'; // 'daily' or 'monthly'
    const sortBy = searchParams.get('sort_by') === 'revenue' ? 'revenue' : 'quantity';

    // 1. Calculate base target date
    let targetDate;
    if (dateStr) {
      targetDate = new Date(dateStr);
    } else {
      // Determine active reporting date based on Bangkok Local Time (+07:00)
      const now = new Date();
      const bangkokTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const year = bangkokTime.getUTCFullYear();
      const month = String(bangkokTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(bangkokTime.getUTCDate()).padStart(2, '0');
      const hour = bangkokTime.getUTCHours();
      
      let reportDate = new Date(`${year}-${month}-${day}`);
      if (hour >= 22) {
        reportDate.setDate(reportDate.getDate() + 1);
      }
      targetDate = reportDate;
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const targetDateFormatted = `${year}-${month}-${day}`;

    let startTime, endTime;
    let startLocalStr, endLocalStr;

    if (timeframe === 'monthly') {
      // MONTHLY TIMEFRAME BOUNDARY:
      // Start: Last day of the previous month at 22:00:01 local time
      // End: Last day of the target month at 22:00:00 local time
      const firstDayOfTargetMonth = new Date(year, targetDate.getMonth(), 1);
      
      const lastDayOfPrevMonth = new Date(firstDayOfTargetMonth.getTime() - 24 * 60 * 60 * 1000);
      const prevYear = lastDayOfPrevMonth.getFullYear();
      const prevMonth = String(lastDayOfPrevMonth.getMonth() + 1).padStart(2, '0');
      const prevDay = String(lastDayOfPrevMonth.getDate()).padStart(2, '0');
      
      startTime = new Date(`${prevYear}-${prevMonth}-${prevDay}T22:00:00.001+07:00`).toISOString();

      const lastDayOfCurrentMonth = new Date(year, targetDate.getMonth() + 1, 0);
      const currYear = lastDayOfCurrentMonth.getFullYear();
      const currMonth = String(lastDayOfCurrentMonth.getMonth() + 1).padStart(2, '0');
      const currDay = String(lastDayOfCurrentMonth.getDate()).padStart(2, '0');
      
      endTime = new Date(`${currYear}-${currMonth}-${currDay}T22:00:00.000+07:00`).toISOString();

      startLocalStr = `${prevYear}-${prevMonth}-${prevDay} 22:00:01`;
      endLocalStr = `${currYear}-${currMonth}-${currDay} 22:00:00`;
    } else {
      // DAILY TIMEFRAME BOUNDARY:
      // Start: Previous day at 22:00:01 local time
      // End: Target day at 22:00:00 local time
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
      const prevDay = String(prevDate.getDate()).padStart(2, '0');
      
      startTime = new Date(`${prevYear}-${prevMonth}-${prevDay}T22:00:00.001+07:00`).toISOString();
      endTime = new Date(`${targetDateFormatted}T22:00:00.000+07:00`).toISOString();

      startLocalStr = `${prevYear}-${prevMonth}-${prevDay} 22:00:01`;
      endLocalStr = `${targetDateFormatted} 22:00:00`;
    }

    // 2. Fetch Profit & Loss Data
    const plSalesRes = await pool.query(`
      SELECT 
        COALESCE(SUM(si.quantity * si.unit_price), 0.00) as gross_sales,
        COALESCE(SUM(si.quantity * COALESCE(il.cost_price, 0.00)), 0.00) as total_cogs
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN inventory_lots il ON si.lot_id = il.id
      WHERE s.transaction_date > $1 AND s.transaction_date <= $2
    `, [startTime, endTime]);

    const plDiscountsRes = await pool.query(`
      SELECT COALESCE(SUM(discount), 0.00) as total_discounts, COUNT(*)::integer as transaction_count
      FROM sales
      WHERE transaction_date > $1 AND transaction_date <= $2
    `, [startTime, endTime]);

    const grossSales = parseFloat(plSalesRes.rows[0].gross_sales);
    const totalCogs = parseFloat(plSalesRes.rows[0].total_cogs);
    const totalDiscounts = parseFloat(plDiscountsRes.rows[0].total_discounts);
    const transactionCount = parseInt(plDiscountsRes.rows[0].transaction_count, 10);
    
    const netRevenue = grossSales - totalDiscounts;
    const netProfit = netRevenue - totalCogs;

    const profitLoss = {
      gross_sales: grossSales,
      total_discounts: totalDiscounts,
      net_revenue: netRevenue,
      cost_of_goods_sold: totalCogs,
      net_profit: netProfit,
      transaction_count: transactionCount
    };

    // 3. Fetch Top 10 Selling Drugs
    const sortField = sortBy === 'revenue' ? 'total_revenue' : 'total_quantity';
    const topSellersRes = await pool.query(`
      SELECT 
        d.tmt_id, 
        d.trade_name, 
        d.unit,
        d.strength,
        d.dosage_form,
        SUM(si.quantity)::integer as total_quantity,
        SUM(si.subtotal)::numeric as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN drugs d ON si.drug_id = d.tmt_id
      WHERE s.transaction_date > $1 AND s.transaction_date <= $2
      GROUP BY d.tmt_id, d.trade_name, d.unit, d.strength, d.dosage_form
      ORDER BY ${sortField} DESC
      LIMIT 10
    `, [startTime, endTime]);

    const topSellers = topSellersRes.rows.map(row => ({
      ...row,
      total_revenue: parseFloat(row.total_revenue)
    }));

    // 4. Fetch Payment Methods Summary
    const paymentsRes = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*)::integer as transaction_count,
        SUM(total_amount)::numeric as total_amount
      FROM sales
      WHERE transaction_date > $1 AND transaction_date <= $2
      GROUP BY payment_method
    `, [startTime, endTime]);

    const paymentMethodsBreakdown = {
      cash: { count: 0, amount: 0.00 },
      qr_promptpay: { count: 0, amount: 0.00 },
      true_wallet: { count: 0, amount: 0.00 },
      credit_card: { count: 0, amount: 0.00 }
    };

    paymentsRes.rows.forEach(row => {
      const method = row.payment_method;
      if (paymentMethodsBreakdown[method] !== undefined) {
        paymentMethodsBreakdown[method] = {
          count: row.transaction_count,
          amount: parseFloat(row.total_amount)
        };
      }
    });

    // 5. Build Dynamic Chart Data based on selected Timeframe
    let chartData = [];

    if (timeframe === 'monthly') {
      // MONTHLY CHART: Day-by-Day Sales & Profit Breakdown
      // Get all raw transaction subtotals and discounts in the month's boundary
      const monthSalesQuery = await pool.query(`
        SELECT 
          s.transaction_date, 
          s.total_amount,
          COALESCE(s.discount, 0.00) as discount,
          COALESCE(SUM(si.quantity * COALESCE(il.cost_price, 0.00)), 0.00) as cogs
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN inventory_lots il ON si.lot_id = il.id
        WHERE s.transaction_date > $1 AND s.transaction_date <= $2
        GROUP BY s.id, s.transaction_date, s.total_amount, s.discount
      `, [startTime, endTime]);

      // Aggregate by reporting day
      const dailyMap = {};
      
      // Initialize all days of the month to 0 so the chart looks smooth and continuous
      const lastDay = new Date(year, targetDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const formattedDay = `${year}-${month}-${String(i).padStart(2, '0')}`;
        dailyMap[formattedDay] = {
          date: formattedDay,
          sales: 0.00,
          profit: 0.00,
          transactions: 0
        };
      }

      monthSalesQuery.rows.forEach(tx => {
        const reportDay = getReportingDay(tx.transaction_date);
        if (dailyMap[reportDay]) {
          const totalAmount = parseFloat(tx.total_amount);
          const discount = parseFloat(tx.discount);
          const cogs = parseFloat(tx.cogs);
          const profit = totalAmount - cogs;

          dailyMap[reportDay].sales += totalAmount;
          dailyMap[reportDay].profit += profit;
          dailyMap[reportDay].transactions += 1;
        }
      });

      chartData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    } else {
      // DAILY CHART:
      // Part A: Sales by hour inside the 22:00-22:00 boundary
      const hourlyQuery = await pool.query(`
        SELECT 
          s.transaction_date,
          s.total_amount,
          COALESCE(SUM(si.quantity * COALESCE(il.cost_price, 0.00)), 0.00) as cogs
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        LEFT JOIN inventory_lots il ON si.lot_id = il.id
        WHERE s.transaction_date > $1 AND s.transaction_date <= $2
        GROUP BY s.id, s.transaction_date, s.total_amount
      `, [startTime, endTime]);

      const hourlyMap = {};
      // Initialize hours: 22, 23, 00, 01 ... up to 21
      const hoursList = [
        22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
      ];
      hoursList.forEach(hr => {
        const hrStr = `${String(hr).padStart(2, '0')}:00`;
        hourlyMap[hr] = {
          hour: hrStr,
          sales: 0.00,
          profit: 0.00
        };
      });

      hourlyQuery.rows.forEach(tx => {
        const localTime = new Date(new Date(tx.transaction_date).getTime() + 7 * 60 * 60 * 1000);
        const hr = localTime.getUTCHours();
        if (hourlyMap[hr] !== undefined) {
          const sales = parseFloat(tx.total_amount);
          const cogs = parseFloat(tx.cogs);
          const profit = sales - cogs;

          hourlyMap[hr].sales += sales;
          hourlyMap[hr].profit += profit;
        }
      });

      const hourlyTrend = hoursList.map(hr => hourlyMap[hr]);

      // Part B: Last 7 days trend for broader daily context
      const last7DaysTrend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(targetDate);
        d.setDate(d.getDate() - i);
        
        const dYear = d.getFullYear();
        const dMonth = String(d.getMonth() + 1).padStart(2, '0');
        const dDay = String(d.getDate()).padStart(2, '0');
        const dFormatted = `${dYear}-${dMonth}-${dDay}`;

        const dPrev = new Date(d);
        dPrev.setDate(dPrev.getDate() - 1);
        const dPrevFormatted = `${dPrev.getFullYear()}-${String(dPrev.getMonth() + 1).padStart(2, '0')}-${String(dPrev.getDate()).padStart(2, '0')}`;

        const dStart = new Date(`${dPrevFormatted}T22:00:00.001+07:00`).toISOString();
        const dEnd = new Date(`${dFormatted}T22:00:00.000+07:00`).toISOString();

        const trendRes = await pool.query(`
          SELECT 
            COALESCE(SUM(s.total_amount), 0.00) as sales_total,
            COALESCE(SUM(si.quantity * COALESCE(il.cost_price, 0.00)), 0.00) as cogs_total
          FROM sales s
          JOIN sale_items si ON si.sale_id = s.id
          LEFT JOIN inventory_lots il ON si.lot_id = il.id
          WHERE s.transaction_date > $1 AND s.transaction_date <= $2
        `, [dStart, dEnd]);

        const sales = parseFloat(trendRes.rows[0].sales_total);
        const profit = sales - parseFloat(trendRes.rows[0].cogs_total);

        last7DaysTrend.push({
          date: dFormatted,
          sales,
          profit
        });
      }

      chartData = {
        hourly_trend: hourlyTrend,
        last_7_days: last7DaysTrend
      };
    }

    // 6. Fetch Sales Logs (Transactions history with itemized lots & cashier tracking)
    const salesLogsQuery = await pool.query(`
      SELECT 
        s.id, 
        s.transaction_date, 
        s.total_amount::numeric as total_amount, 
        s.payment_method, 
        s.staff_id, 
        s.discount::numeric as discount
      FROM sales s
      WHERE s.transaction_date > $1 AND s.transaction_date <= $2
      ORDER BY s.transaction_date DESC
    `, [startTime, endTime]);

    const salesItemsQuery = await pool.query(`
      SELECT 
        si.sale_id,
        si.drug_id,
        si.quantity,
        si.unit_price::numeric as unit_price,
        si.subtotal::numeric as subtotal,
        d.trade_name,
        d.strength,
        d.unit,
        il.lot_number
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN drugs d ON si.drug_id = d.tmt_id
      LEFT JOIN inventory_lots il ON si.lot_id = il.id
      WHERE s.transaction_date > $1 AND s.transaction_date <= $2
    `, [startTime, endTime]);

    const salesLogsMap = {};
    salesLogsQuery.rows.forEach(s => {
      salesLogsMap[s.id] = {
        id: s.id,
        transaction_date: s.transaction_date,
        total_amount: parseFloat(s.total_amount),
        payment_method: s.payment_method,
        staff_id: s.staff_id,
        discount: parseFloat(s.discount),
        items: []
      };
    });

    salesItemsQuery.rows.forEach(item => {
      if (salesLogsMap[item.sale_id]) {
        salesLogsMap[item.sale_id].items.push({
          drug_id: item.drug_id,
          trade_name: item.trade_name,
          strength: item.strength,
          unit: item.unit,
          quantity: parseInt(item.quantity, 10),
          unit_price: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal),
          lot_number: item.lot_number || 'N/A'
        });
      }
    });

    const salesLogs = Object.values(salesLogsMap).sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

    return NextResponse.json({
      success: true,
      timeframe,
      report_date: targetDateFormatted,
      time_range: {
        start_utc: startTime,
        end_utc: endTime,
        start_local: startLocalStr,
        end_local: endLocalStr
      },
      data: {
        profit_loss: profitLoss,
        top_sellers: topSellers,
        payment_methods: paymentMethodsBreakdown,
        chart_data: chartData,
        sales_logs: salesLogs
      }
    });

  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report analytics' },
      { status: 500 }
    );
  }
}
