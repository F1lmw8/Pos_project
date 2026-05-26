'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function SalesLogsPage() {
  const [timeframe, setTimeframe] = useState('monthly'); // Default to monthly as requested to test day-filters!
  const [selectedDate, setSelectedDate] = useState('2026-05-26');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState(''); // Empty string means "All Days"

  // Fetch sales report logs
  const fetchReportData = async (tf, dt) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/reports?timeframe=${tf}&date=${dt}`);
      const result = await response.json();
      if (result.success) {
        setReportData(result);
      } else {
        console.error('Failed to fetch sales logs:', result.error);
      }
    } catch (error) {
      console.error('Error fetching sales logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(timeframe, selectedDate);
    setSelectedDayFilter(''); // Reset day filter on timeframe/date change
  }, [timeframe, selectedDate]);

  // Extract raw sales logs
  const salesLogs = useMemo(() => {
    if (!reportData || !reportData.data || !reportData.data.sales_logs) return [];
    return reportData.data.sales_logs;
  }, [reportData]);

  // Client-side helper to determine reporting day number (1-31) of a transaction based on 10:00 PM cutoff rule
  const getReportingDayNum = (transactionDateStr) => {
    const d = new Date(transactionDateStr);
    const localTime = new Date(d.getTime() + 7 * 60 * 60 * 1000); // Bangkok UTC+7
    const year = localTime.getUTCFullYear();
    const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localTime.getUTCDate()).padStart(2, '0');
    const hour = localTime.getUTCHours();
    
    let reportDate = new Date(`${year}-${month}-${day}`);
    if (hour >= 22) {
      reportDate.setDate(reportDate.getDate() + 1);
    }
    return reportDate.getDate();
  };

  // Extract all unique reporting days available in the current monthly dataset
  const uniqueDays = useMemo(() => {
    if (timeframe !== 'monthly' || salesLogs.length === 0) return [];
    const daysSet = new Set();
    salesLogs.forEach(sale => {
      daysSet.add(getReportingDayNum(sale.transaction_date));
    });
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [salesLogs, timeframe]);

  // Apply dynamic client-side filters (Day filter for monthly timeframe)
  const filteredSalesLogs = useMemo(() => {
    if (timeframe !== 'monthly' || !selectedDayFilter) return salesLogs;
    const dayNum = parseInt(selectedDayFilter, 10);
    return salesLogs.filter(sale => getReportingDayNum(sale.transaction_date) === dayNum);
  }, [salesLogs, timeframe, selectedDayFilter]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
            📜 ประวัติธุรกรรมการขายสินค้า <span className="brand-badge">Audit Logs</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            ดูรายละเอียดข้อมูลบิลจำหน่ายประเภทยาสามัญ การคีย์แคชเชียร์หน้าร้าน และหมายเลขล็อตสินค้า (FEFO) ย้อนหลัง
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
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          📊 สรุปวิเคราะห์ยอดขาย
        </Link>
        <Link 
          href="/dashboard/sales-logs" 
          style={{ textDecoration: 'none', background: '#0d9488', color: '#ffffff', border: '1px solid #0d9488', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
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

      {/* Main filter selector card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#ffffff', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Daily / Monthly Timeframe Switch tabs */}
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setTimeframe('daily')}
              style={{ border: 'none', background: timeframe === 'daily' ? '#ffffff' : 'transparent', color: timeframe === 'daily' ? '#0d9488' : '#64748b', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: timeframe === 'daily' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
            >
              📅 ประวัติตัดยอดรายวัน (Daily)
            </button>
            <button
              onClick={() => setTimeframe('monthly')}
              style={{ border: 'none', background: timeframe === 'monthly' ? '#ffffff' : 'transparent', color: timeframe === 'monthly' ? '#0d9488' : '#64748b', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: timeframe === 'monthly' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
            >
              📆 ประวัติตัดยอดรายเดือน (Monthly)
            </button>
          </div>

          {/* Time range info */}
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            {reportData && reportData.time_range && (
              <span>
                🕰️ ข้อมูลบิลในช่วงเวลา: <strong style={{ color: '#0f172a' }}>{reportData.time_range.start_local}</strong> ถึง <strong style={{ color: '#0f172a' }}>{reportData.time_range.end_local}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic client-side DAY FILTER (ฟิลเตอร์กรองวัน) - Only shown in Monthly View! */}
        {timeframe === 'monthly' && uniqueDays.length > 0 && (
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📅 กรองเฉพาะวันขายในเดือนนี้:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedDayFilter('')}
                style={{ border: '1px solid #cbd5e1', background: selectedDayFilter === '' ? 'var(--color-primary)' : '#ffffff', color: selectedDayFilter === '' ? '#ffffff' : '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                แสดงทั้งหมด ({salesLogs.length} บิล)
              </button>
              {uniqueDays.map(day => {
                const count = salesLogs.filter(sale => getReportingDayNum(sale.transaction_date) === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(String(day))}
                    style={{ border: '1px solid #cbd5e1', background: selectedDayFilter === String(day) ? 'var(--color-primary)' : '#ffffff', color: selectedDayFilter === String(day) ? '#ffffff' : '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    วันที่ {day} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main sales logs card table container */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📜 ตารางรายงานประวัติบิลการขายยา ({timeframe === 'daily' ? 'รายวัน' : `รายเดือน - กรองวันที่ ${selectedDayFilter || 'ทั้งหมด'}`})
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>กำลังประมวลผลข้อมูลธุรกรรม...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
                  <th style={{ padding: '12px 10px' }}>วัน-เวลาทำรายการ</th>
                  <th style={{ padding: '12px 10px' }}>เลขที่บิล (TX-ID)</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>ช่องทางชำระเงิน</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>พนักงานคีย์</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>ส่วนลด (฿)</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>ยอดชำระสุทธิ (฿)</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesLogs.length > 0 ? (
                  filteredSalesLogs.map((sale) => {
                    const isExpanded = expandedSaleId === sale.id;
                    const formattedDate = new Date(sale.transaction_date).toLocaleString('th-TH');
                    const pMethodLabel = sale.payment_method === 'cash' ? '💵 เงินสด' : sale.payment_method === 'qr_promptpay' ? '📱 PromptPay QR' : '💳 บัตรเครดิต';
                    
                    return (
                      <React.Fragment key={sale.id}>
                        <tr style={{ borderBottom: '1px solid #f1f5f9', background: isExpanded ? '#f8fafc' : 'transparent', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '12px 10px', color: '#475569', fontWeight: '500' }}>{formattedDate}</td>
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b' }}>{sale.id}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '600', color: 'var(--color-primary)' }}>{pMethodLabel}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', color: '#64748b', fontWeight: '500' }}>{sale.staff_id}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#f59e0b', fontWeight: 'bold' }}>฿{sale.discount.toFixed(2)}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>฿{sale.total_amount.toFixed(2)}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button
                              onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                              style={{ background: isExpanded ? '#64748b' : '#0d9488', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {isExpanded ? '✕ ปิด' : '🔍 รายละเอียด'}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expandable Items Breakdown table */}
                        {isExpanded && (
                          <tr key={`${sale.id}-expanded`}>
                            <td colSpan="7" style={{ padding: '16px 20px', background: '#fafbfd', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', background: '#ffffff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                <div style={{ background: '#f1f5f9', padding: '10px 16px', fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>📦 รายการสินค้าเวชภัณฑ์ที่ขาย (บิล {sale.id})</span>
                                  <span>ตัดยอดสต็อกตามระบบล็อต FEFO</span>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 'bold' }}>
                                      <th style={{ padding: '8px 16px' }}>ตัวยา / รหัส TMT</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'center' }}>ขนาด/รูปแบบ</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'center' }}>ล็อตที่ใช้ (Lot No.)</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'center' }}>จำนวน</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'right' }}>ราคาหน่วยละ (฿)</th>
                                      <th style={{ padding: '8px 16px', textAlign: 'right' }}>ราคารวม (฿)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sale.items && sale.items.length > 0 ? (
                                      sale.items.map((item, itemIdx) => (
                                        <tr key={itemIdx} style={{ borderBottom: '1px dashed #f1f5f9' }}>
                                          <td style={{ padding: '10px 16px', fontWeight: 'bold', color: '#1e293b' }}>
                                            {item.trade_name}
                                            <span style={{ display: 'block', fontSize: '9px', color: '#94a3b8', fontWeight: 'normal' }}>TMT-{item.drug_id}</span>
                                          </td>
                                          <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b' }}>{item.strength} {item.unit}</td>
                                          <td style={{ padding: '10px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: '600', color: '#64748b' }}>
                                            <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{item.lot_number}</span>
                                          </td>
                                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 'bold', color: '#0d9488' }}>{item.quantity}</td>
                                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#475569' }}>฿{item.unit_price.toFixed(2)}</td>
                                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 'bold' }}>฿{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>ไม่พบรายละเอียดรายการจำหน่ายในบิลนี้</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '32px 10px', textAlign: 'center', color: '#94a3b8' }}>
                      ไม่พบประวัติธุรกรรมจำหน่ายย้อนหลังในช่วงเวลานี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
