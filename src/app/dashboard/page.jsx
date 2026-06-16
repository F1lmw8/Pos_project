'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';


export default function DashboardPage() {
  // State variables
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' or 'monthly'
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
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
    true_wallet: '#f97316',   // Orange
    credit_card: '#8b5cf6'    // Purple
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
      { name: 'TrueWallet PP', value: pm.true_wallet.amount, key: 'true_wallet' },
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
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ภาพรวม &amp; สรุปยอดขาย</h1>
          <p className="page-subtitle">วิเคราะห์ยอดขาย กำไร และสถานะคลังยาแบบเรียลไทม์</p>
        </div>
        <div className="page-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderColor: '#0d9488', color: '#0d9488', borderRadius: '8px', fontWeight: 600 }}>
            <span style={{ fontSize: '18px', lineHeight: 1 }}>←</span> กลับหน้าหลัก
          </Link>
          <div className="tab-group">
            <button
              className={`tab-btn${timeframe === 'daily' ? ' active' : ''}`}
              onClick={() => setTimeframe('daily')}
            >รายวัน</button>
            <button
              className={`tab-btn${timeframe === 'monthly' ? ' active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >รายเดือน</button>
          </div>
          <div className="date-picker-wrap">
            <span className="date-picker-label">วันที่</span>
            <input
              type="date"
              className="date-picker-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Time range info */}
      {reportData?.time_range && (
        <div className="time-range-bar" style={{ marginBottom: 20 }}>
          <span className="time-range-info">
            ช่วงเวลา ({timeframe === 'daily' ? 'กะจำหน่าย' : 'รายเดือน'}):&nbsp;
            <strong>{reportData.time_range.start_local}</strong>
            &nbsp;–&nbsp;
            <strong>{reportData.time_range.end_local}</strong>
          </span>
          {loading && <div className="spinner"></div>}
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-teal">
          <div className="kpi-header">
            <span className="kpi-label">ยอดจำหน่าย</span>
            <div className="kpi-icon">■</div>
          </div>
          <div className="kpi-value">฿{pl.gross_sales.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">ยอดก่อนหักส่วนลด</div>
        </div>

        <div className="kpi-card kpi-yellow">
          <div className="kpi-header">
            <span className="kpi-label">ส่วนลด</span>
            <div className="kpi-icon">−</div>
          </div>
          <div className="kpi-value">฿{pl.total_discounts.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">ส่วนลดสมนาคุณ</div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-header">
            <span className="kpi-label">รายรับสุทธิ์</span>
            <div className="kpi-icon">≡</div>
          </div>
          <div className="kpi-value">฿{pl.net_revenue.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">ยอดหลังหักส่วนลด</div>
        </div>

        <div className="kpi-card kpi-slate">
          <div className="kpi-header">
            <span className="kpi-label">ต้นทุน (COGS)</span>
            <div className="kpi-icon">▽</div>
          </div>
          <div className="kpi-value">฿{pl.cost_of_goods_sold.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">คำนวณตามล็อตจริง</div>
        </div>

        <div className="kpi-card kpi-green">
          <div className="kpi-header">
            <span className="kpi-label">กำไรสุทธิ์</span>
            <div className="kpi-icon">▲</div>
          </div>
          <div className="kpi-value">฿{pl.net_profit.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-sub">ผลกำไรแดงสุทธิ์</div>
        </div>

        <div className="kpi-card kpi-purple">
          <div className="kpi-header">
            <span className="kpi-label">ธุรกรรม</span>
            <div className="kpi-icon">⚑</div>
          </div>
          <div className="kpi-value">{pl.transaction_count}</div>
          <div className="kpi-sub">บิลจำหน่ายสำเร็จ</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Trend chart */}
        <div className="dash-card">
          <div className="dash-card-title">
            <div className="dash-card-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>╱╲</div>
            แนวโน้มยอดขาย ({timeframe === 'daily' ? 'รายชั่วโมง' : 'รายวัน'})
          </div>
          {mounted && (
            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeframe === 'daily' ? hourlyData : trendData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey={timeframe === 'daily' ? 'hour' : 'date'} stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                  <Tooltip
                    formatter={(v) => `฿${v.toFixed(2)}`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="sales" name="ยอดขาย" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" name="กำไร" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {timeframe === 'daily' && trendData.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>7 วันที่ผ่านมา</div>
              {mounted && (
                <div style={{ width: '100%', height: '100px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <Tooltip formatter={(v) => `฿${v.toFixed(2)}`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 11 }} />
                      <Bar dataKey="sales" name="ยอดขาย" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment breakdown */}
        <div className="dash-card">
          <div className="dash-card-title">
            <div className="dash-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>●</div>
            ช่องทางชำระเงิน
          </div>
          {mounted && pieData.length > 0 ? (
            <div style={{ width: '100%', height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={paymentColors[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `฿${v.toFixed(2)}`} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ height: 160, padding: '20px' }}>
              <div style={{ fontSize: '11px' }}>ยังไม่มีข้อมูล</div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '8px' }}>
            {['cash', 'qr_promptpay', 'true_wallet', 'credit_card'].map(key => {
              const pm = reportData?.data?.payment_methods?.[key] || { count: 0, amount: 0 };
              const label = key === 'cash' ? 'เงินสด' : key === 'qr_promptpay' ? 'PromptPay QR' : key === 'true_wallet' ? 'TrueWallet' : 'บัตรเครดิต';
              return (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: paymentColors[key] }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>฿{pm.amount.toFixed(0)}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 5 }}>({pm.count})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Sellers + Inventory Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '16px' }}>
        {/* Top Sellers Table */}
        <div className="dash-card">
          <div className="dash-card-title">
            <div className="dash-card-icon" style={{ background: '#fefce8', color: '#ca8a04' }}>★</div>
            ยาสิบอันดับแรก
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ชื่อการค้า</th>
                  <th className="td-center">ขนาด</th>
                  <th className="td-center">จำนวนขาย</th>
                  <th className="td-right">รายรับ (฿)</th>
                </tr>
              </thead>
              <tbody>
                {topSellers.length > 0 ? (
                  topSellers.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="td-bold">{item.trade_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TMT-{item.tmt_id}</div>
                      </td>
                      <td className="td-center" style={{ color: 'var(--text-secondary)' }}>{item.strength} {item.unit}</td>
                      <td className="td-center" style={{ fontWeight: 700, color: 'var(--teal-600)' }}>{item.total_quantity}</td>
                      <td className="td-right td-bold">{item.total_revenue.toFixed(0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state" style={{ padding: '24px 0' }}>
                        <div style={{ fontSize: '12px' }}>ยังไม่มีรายการ</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="dash-card-title">
            <div className="dash-card-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠</div>
            แจ้งเตือนคลังยา
          </div>

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: 4 }}>สต็อกต่ำ</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626' }}>{alertStats.lowStockCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>รายการ</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 'var(--radius-md)', padding: '12px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginBottom: 4 }}>หมดอายุใน 90 วัน</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706' }}>{alertStats.expiringCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ล็อต</div>
            </div>
          </div>

          {/* Alert list */}
          <div style={{ flex: 1, maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alertsLoading ? (
              <div className="loading-center" style={{ padding: '20px' }}>
                <div className="spinner"></div>
                <span>กำลังโหลด...</span>
              </div>
            ) : (
              <>
                {inventoryAlerts?.expiry_alerts?.expiring_30_days?.map((lot, idx) => (
                  <div key={idx} className="alert-item">
                    <div>
                      <div className="alert-name">{lot.trade_name}</div>
                      <div className="alert-sub">Lot: {lot.lot_number}</div>
                    </div>
                    <div className="alert-stat" style={{ color: '#dc2626' }}>← {lot.days_until_expiry} วัน</div>
                  </div>
                ))}
                {inventoryAlerts?.expiry_alerts?.expiring_60_days?.map((lot, idx) => (
                  <div key={idx} className="alert-item">
                    <div>
                      <div className="alert-name">{lot.trade_name}</div>
                      <div className="alert-sub">Lot: {lot.lot_number}</div>
                    </div>
                    <div className="alert-stat" style={{ color: '#d97706' }}>{lot.days_until_expiry} วัน</div>
                  </div>
                ))}
                {inventoryAlerts?.low_stock_alerts?.map((drug, idx) => (
                  <div key={idx} className="alert-item">
                    <div>
                      <div className="alert-name">{drug.trade_name}</div>
                      <div className="alert-sub">คงเหลือ {drug.current_stock} {drug.unit}</div>
                    </div>
                    <span className="badge badge-blue">สั่งซื้อ</span>
                  </div>
                ))}
                {alertStats.lowStockCount === 0 && alertStats.expiringCount === 0 && (
                  <div className="empty-state" style={{ padding: '24px 0' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-success)' }}>✓ คลังยาสมบูรณ์</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
