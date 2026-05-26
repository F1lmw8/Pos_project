'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function DashboardPage() {
  // State variables
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' or 'monthly'
  const [selectedDate, setSelectedDate] = useState('2026-05-26'); // Seed date for testing
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration errors on SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch sales reports (Profit & Loss, Top Sellers, Payments, and Charts)
  const fetchReportData = async (tf, dt) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/reports?timeframe=${tf}&date=${dt}`);
      const result = await response.json();
      if (result.success) {
        setReportData(result);
      } else {
        console.error('Report API error:', result.error);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch inventory alerts (low stock, expiring lots)
  const fetchInventoryAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetch('/api/dashboard/inventory-alerts');
      const result = await response.json();
      if (result.success) {
        setInventoryAlerts(result.data);
      } else {
        console.error('Alerts API error:', result.error);
      }
    } catch (error) {
      console.error('Failed to load inventory alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Re-fetch report details when timeframe or selectedDate changes
  useEffect(() => {
    fetchReportData(timeframe, selectedDate);
  }, [timeframe, selectedDate]);

  // Initial load of inventory alerts
  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  // UI styling helpers
  const paymentColors = {
    cash: '#0d9488',          // Teal
    qr_promptpay: '#0284c7',  // Blue
    credit_card: '#8b5cf6'   // Purple
  };

  // Process P&L values
  const pl = useMemo(() => {
    if (!reportData || !reportData.data || !reportData.data.profit_loss) {
      return { gross_sales: 0, total_discounts: 0, net_revenue: 0, cost_of_goods_sold: 0, net_profit: 0, transaction_count: 0 };
    }
    return reportData.data.profit_loss;
  }, [reportData]);

  // Process top sellers
  const topSellers = useMemo(() => {
    if (!reportData || !reportData.data || !reportData.data.top_sellers) return [];
    return reportData.data.top_sellers;
  }, [reportData]);

  // Process payment breakdown for Pie Chart
  const pieData = useMemo(() => {
    if (!reportData || !reportData.data || !reportData.data.payment_methods) return [];
    const pm = reportData.data.payment_methods;
    return [
      { name: 'เงินสด', value: pm.cash.amount, key: 'cash' },
      { name: 'PromptPay QR', value: pm.qr_promptpay.amount, key: 'qr_promptpay' },
      { name: 'บัตรเครดิต', value: pm.credit_card.amount, key: 'credit_card' }
    ].filter(item => item.value > 0);
  }, [reportData]);

  // Process Trend chart data
  const trendData = useMemo(() => {
    if (!reportData || !reportData.data || !reportData.data.chart_data) return [];
    const cd = reportData.data.chart_data;
    if (timeframe === 'daily') {
      if (Array.isArray(cd)) return [];
      return cd.last_7_days || [];
    }
    if (!Array.isArray(cd)) return [];
    return cd;
  }, [reportData, timeframe]);

  // Process Hourly trend chart data
  const hourlyData = useMemo(() => {
    if (timeframe !== 'daily' || !reportData || !reportData.data || !reportData.data.chart_data) return [];
    const cd = reportData.data.chart_data;
    if (Array.isArray(cd)) return [];
    return cd.hourly_trend || [];
  }, [reportData, timeframe]);

  // Dynamic status counts
  const alertStats = useMemo(() => {
    if (!inventoryAlerts) return { lowStockCount: 0, expiringCount: 0 };
    const lowStockCount = inventoryAlerts.low_stock_alerts?.length || 0;
    const expiry = inventoryAlerts.expiry_alerts;
    const expiringCount = 
      (expiry?.expiring_30_days?.length || 0) + 
      (expiry?.expiring_60_days?.length || 0) + 
      (expiry?.expiring_90_days?.length || 0);
    return { lowStockCount, expiringCount };
  }, [inventoryAlerts]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Header bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
            📊 สถิติ & แผงวิเคราะห์รายงาน <span className="brand-badge">รายงานความคล่องตัว</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            วิเคราะห์อัตราผลกำไร ข้อมูลสต็อกยาหมดอายุ และยอดการจ่ายยาแบบเรียลไทม์
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', background: '#ffffff', color: '#0d9488', border: '1px solid #0d9488', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}>
            🛒 เข้าสู่จุดขาย POS
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '6px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>เลือกวันที่:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', fontSize: '13px', outline: 'none', color: 'var(--text-primary)', fontWeight: 'bold' }}
            />
          </div>
        </div>
      </header>

      {/* Modular Dashboard Top Navigation Tab Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>
        <Link 
          href="/dashboard" 
          style={{ textDecoration: 'none', background: '#0d9488', color: '#ffffff', border: '1px solid #0d9488', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
        >
          📊 สรุปวิเคราะห์ยอดขาย
        </Link>
        <Link 
          href="/dashboard/sales-logs" 
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          📜 ประวัติธุรกรรมการขาย
        </Link>
        <Link 
          href="/dashboard/stock-in" 
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          ➕ นำเข้าสต็อกคลังยา
        </Link>
      </div>

      {/* Main switchable selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderRadius: '16px', padding: '12px 24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        {/* Switch tabs */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setTimeframe('daily')}
            style={{ border: 'none', background: timeframe === 'daily' ? '#ffffff' : 'transparent', color: timeframe === 'daily' ? '#0d9488' : '#64748b', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: timeframe === 'daily' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            📅 สรุปยอดรายวัน (Daily)
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            style={{ border: 'none', background: timeframe === 'monthly' ? '#ffffff' : 'transparent', color: timeframe === 'monthly' ? '#0d9488' : '#64748b', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: timeframe === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            📆 สรุปยอดรายเดือน (Monthly)
          </button>
        </div>

        {/* Date coverage log */}
        <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>
          {reportData && reportData.time_range && (
            <span>
              🕰️ ช่วงเวลาประมวลผล ({reportData.timeframe === 'daily' ? 'กะจำหน่ายสี่ทุ่ม' : 'รายงานประจำเดือน'}):
              <strong style={{ color: '#0f172a', marginLeft: '6px' }}>
                {reportData.time_range.start_local} ถึง {reportData.time_range.end_local}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Total Sales Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #0d9488' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ยอดจำหน่ายก่อนหักลด</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#0d9488', fontFamily: 'var(--font-display)' }}>
            ฿{pl.gross_sales.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>รวมราคาตัวยามาตรฐาน</span>
        </div>

        {/* Total Discounts Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ส่วนลดจัดกิจกรรม</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
            ฿{pl.total_discounts.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>ส่วนลดสมนาคุณหน้าร้าน</span>
        </div>

        {/* Net Revenue Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>รายรับสุทธิ (Net Revenue)</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-display)' }}>
            ฿{pl.net_revenue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>ยอดจำหน่ายสุทธิหลังหักส่วนลด</span>
        </div>

        {/* Cost of Goods Sold Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #64748b' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ต้นทุนคลังยาล็อตย่อย</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#64748b', fontFamily: 'var(--font-display)' }}>
            ฿{pl.cost_of_goods_sold.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>COGS แยกคำนวณตามล็อตล็อตจริง</span>
        </div>

        {/* Net Profit Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>ผลกำไรสุทธิ (Net Profit)</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>
            ฿{pl.net_profit.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>กำไรหักค่าใช้จ่ายคลังสะสม</span>
        </div>

        {/* Transaction Count Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>จำนวนธุรกรรมเสร็จสิ้น</span>
          <span style={{ fontSize: '26px', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-display)' }}>
            {pl.transaction_count} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>บิล</span>
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>ยอดจำหน่ายคีย์ใบเสร็จสมบูรณ์</span>
        </div>
      </div>

      {/* Main Charts & Visual Block */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Side: Trends and Hourly Chart */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 แนวโน้มการจำหน่ายและสถิติสะสม ({timeframe === 'daily' ? 'แนวโน้มยอดขายรายชั่วโมง' : 'แนวโน้มยอดขายรายวัน'})
          </h3>

          {mounted && (
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeframe === 'daily' ? hourlyData : trendData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={timeframe === 'daily' ? 'hour' : 'date'} stroke="#64748b" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                  <Tooltip formatter={(value) => `฿${value.toFixed(2)}`} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" name="ยอดจำหน่ายรวม" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="กำไรสุทธิ" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          
          {timeframe === 'daily' && trendData.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>
                🗓️ ดัชนีจำหน่ายเปรียบเทียบย้อนหลัง 7 วันทำการ
              </h4>
              {mounted && (
                <div style={{ width: '100%', height: '120px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                      <Tooltip formatter={(value) => `฿${value.toFixed(2)}`} />
                      <Bar dataKey="sales" name="ยอดขาย" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="กำไร" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Payment Breakdowns (Pie Chart) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifySelf: 'stretch' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
              💳 สัดส่วนช่องทางชำระเงิน
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              วิเคราะห์รายได้ตามประเภทช่องทางรับชำระเงินของลูกค้า
            </p>

            {mounted && pieData.length > 0 ? (
              <div style={{ width: '100%', height: '180px', display: 'flex', justifySelf: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={paymentColors[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `฿${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                ยังไม่มีข้อมูลชำระเงินของช่วงเวลานี้
              </div>
            )}
          </div>

          {/* Legends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '12px' }}>
            {['cash', 'qr_promptpay', 'credit_card'].map(key => {
              const pm = reportData?.data?.payment_methods?.[key] || { count: 0, amount: 0 };
              const label = key === 'cash' ? 'เงินสด' : key === 'qr_promptpay' ? 'PromptPay QR' : 'บัตรเครดิต';
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: paymentColors[key] }}></span>
                    <span style={{ fontWeight: '500' }}>{label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold' }}>฿{pm.amount.toFixed(2)}</span>
                    <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>({pm.count} บิล)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Block: Low Stock Warnings & Top Selling Drugs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Side: Top 10 Best Sellers */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 ยาจำหน่ายยอดนิยม 10 อันดับแรก
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
                  <th style={{ padding: '10px 8px' }}>ชื่อการค้า (TMT)</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>ขนาด/รูปแบบ</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>จำนวนที่ขาย</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>รายรับรวม (฿)</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.length > 0 ? (
                  topSellers.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                        <div>{item.trade_name}</div>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>TMT-{item.tmt_id}</span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>
                        {item.strength} {item.unit}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        {item.total_quantity}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {item.total_revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px 8px', textAlign: 'center', color: '#94a3b8' }}>
                      ยังไม่มีรายการยาจำหน่ายในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Smart Inventory Alerts Panel Only */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ การจัดการระบบคลังยาอัจฉริยะ (FEFO & สต็อก)
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              สถิติเชิงลึกแจ้งเตือนตัวยามีแนวโน้มที่จะหมดอายุและระดับของสต็อกต่ำกว่าจุดวิกฤต
            </p>
          </div>

          {/* Quick summary badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <div>
                <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>สต็อกยาต่ำวิกฤต</div>
                <div style={{ fontSize: '20px', fontWeight: '850', color: '#ef4444' }}>{alertStats.lowStockCount} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>รายการ</span></div>
              </div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>⏳</span>
              <div>
                <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', textTransform: 'uppercase' }}>ยาหมดอายุใน 90 วัน</div>
                <div style={{ fontSize: '20px', fontWeight: '850', color: '#d97706' }}>{alertStats.expiringCount} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>ล็อต</span></div>
              </div>
            </div>
          </div>

          {/* Scrollable list of alerts */}
          <div style={{ flex: 1, maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#fafbfd' }}>
            {alertsLoading ? (
              <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>กำลังดึงข้อมูลสต็อก...</p>
            ) : (
              <>
                {/* Expiring lots warnings */}
                {inventoryAlerts?.expiry_alerts?.expiring_30_days?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold', marginBottom: '6px' }}>🔴 วันหมดอายุวิกฤต (&lt; 30 วัน)</h4>
                    {inventoryAlerts.expiry_alerts.expiring_30_days.map((lot, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: '#fff', padding: '8px 12px', border: '1px solid #fee2e2', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold' }}>{lot.trade_name} <span style={{ fontSize: '9px', color: '#94a3b8' }}>({lot.lot_number})</span></span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>หมดอายุใน {lot.days_until_expiry} วัน!</span>
                      </div>
                    ))}
                  </div>
                )}

                {inventoryAlerts?.expiry_alerts?.expiring_60_days?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '6px' }}>🟠 แจ้งเตือนวันหมดอายุ (&lt; 60 วัน)</h4>
                    {inventoryAlerts.expiry_alerts.expiring_60_days.map((lot, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: '#fff', padding: '8px 12px', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold' }}>{lot.trade_name} <span style={{ fontSize: '9px', color: '#94a3b8' }}>({lot.lot_number})</span></span>
                        <span style={{ color: '#d97706', fontWeight: 'bold' }}>เหลืออีก {lot.days_until_expiry} วัน</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Stock Alerts */}
                {inventoryAlerts?.low_stock_alerts?.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12px', color: '#0284c7', fontWeight: 'bold', marginBottom: '6px' }}>📦 สต็อกต่ำกว่าจุดวิกฤต (Low Stock)</h4>
                    {inventoryAlerts.low_stock_alerts.map((drug, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', background: '#fff', padding: '8px 12px', border: '1px solid #e0f2fe', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold' }}>{drug.trade_name}</span>
                        <span style={{ color: '#0369a1', fontWeight: 'bold' }}>มี {drug.current_stock} {drug.unit} (สั่งเพิ่ม &lt; {drug.reorder_point})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty check */}
                {alertStats.lowStockCount === 0 && alertStats.expiringCount === 0 && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', padding: '24px 0' }}>
                    🟢 คลังยาสมบูรณ์แบบ สต็อกมั่นคง และไม่มีสินค้าหมดอายุใน 90 วัน
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
