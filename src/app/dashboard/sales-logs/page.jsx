'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { getStoreSettings } from '../../../utils/storeSettings';

export default function SalesLogsPage() {
  const [storeSettings, setStoreSettings] = useState(() => getStoreSettings());
  const [timeframe, setTimeframe] = useState('monthly'); // Default to monthly as requested to test day-filters!
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
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
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ประวัติธุรกรรมการขาย</h1>
          <p className="page-subtitle">ดูรายละเอียดบิลจำหน่าย เลขที่ล็อต (FEFO) และประวัติการชำระเงินย้อนหลัง</p>
        </div>
        <div className="page-controls">
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

      {/* Time range info + Day filter */}
      <div className="dash-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span className="time-range-info">
            {reportData?.time_range && (
              <>ช่วงเวลา: <strong>{reportData.time_range.start_local}</strong> – <strong>{reportData.time_range.end_local}</strong></>
            )}
          </span>
          {loading && <div className="spinner"></div>}
        </div>

        {/* Day filter chips - monthly only */}
        {timeframe === 'monthly' && uniqueDays.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>กรองวัน:</span>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedDayFilter('')}
                className={`filter-badge${selectedDayFilter === '' ? ' active' : ''}`}
              >
                ทั้งหมด ({salesLogs.length})
              </button>
              {uniqueDays.map(day => {
                const count = salesLogs.filter(sale => getReportingDayNum(sale.transaction_date) === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(String(day))}
                    className={`filter-badge${selectedDayFilter === String(day) ? ' active' : ''}`}
                  >
                    {day} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sales Logs Table */}
      <div className="dash-card">
        <div className="dash-card-title">
          <div className="dash-card-icon" style={{ background: '#f8fafc', color: 'var(--text-secondary)' }}>≡</div>
          ตารางบิลการขาย ({timeframe === 'daily' ? 'รายวัน' : `รายเดือน${selectedDayFilter ? ` · วันที่ ${selectedDayFilter}` : ''}`})
          &nbsp;· 
          <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>{filteredSalesLogs.length} รายการ</span>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner"></div>
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>วัน-เวลา</th>
                  <th>เลขบิล</th>
                  <th>ผู้ป่วย / ลูกค้า</th>
                  <th className="td-center">ช่องทางชำระ</th>
                  <th>เภสัชกร / พนักงาน</th>
                  <th className="td-right">ส่วนลด (฿)</th>
                  <th className="td-right">ยอดชำระ (฿)</th>
                  <th className="td-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesLogs.length > 0 ? (
                  filteredSalesLogs.map((sale) => {
                    const isExpanded = expandedSaleId === sale.id;
                    const formattedDate = new Date(sale.transaction_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
                    const paymentBadgeClass = sale.payment_method === 'cash' ? 'badge-teal' : sale.payment_method === 'qr_promptpay' ? 'badge-blue' : sale.payment_method === 'true_wallet' ? 'badge-orange' : 'badge-purple';
                    const paymentLabel = sale.payment_method === 'cash' ? 'เงินสด' : sale.payment_method === 'qr_promptpay' ? 'PromptPay' : sale.payment_method === 'true_wallet' ? 'TrueWallet' : 'บัตร';
                    const custName = sale.customer_name || sale.patient_name || 'ลูกค้าทั่วไป';
                    const pharmName = storeSettings.pharmacistName || 'ภก. อภิโช โลมทอง (ภ. 34152)';

                    return (
                      <React.Fragment key={sale.id}>
                        <tr style={{ background: isExpanded ? 'var(--bg-muted)' : 'transparent' }}>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                          <td className="td-mono" style={{ fontSize: '11.5px' }}>{sale.id}</td>
                          <td>
                            <span style={{ fontWeight: custName !== 'ลูกค้าทั่วไป' ? 700 : 500, color: custName !== 'ลูกค้าทั่วไป' ? 'var(--teal-600)' : 'var(--text-primary)', fontSize: '12px' }}>
                              {custName}
                            </span>
                          </td>
                          <td className="td-center">
                            <span className={`badge ${paymentBadgeClass}`}>{paymentLabel}</span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>{pharmName}</td>
                          <td className="td-right" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>฿{sale.discount.toFixed(2)}</td>
                          <td className="td-right td-bold">฿{sale.total_amount.toFixed(2)}</td>
                          <td className="td-center">
                            <button
                              onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                              className={`btn btn-sm${isExpanded ? ' btn-ghost' : ' btn-outline'}`}
                            >
                              {isExpanded ? '× ปิด' : 'รายละเอียด'}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded items row */}
                        {isExpanded && (
                          <tr className="expanded-row">
                            <td colSpan="8" style={{ padding: '8px 16px 16px', backgroundColor: 'var(--bg-muted)' }}>
                              <div style={{
                                backgroundColor: 'var(--bg-card)',
                                border: '1.5px solid var(--border)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                boxShadow: 'var(--shadow-sm)'
                              }}>
                                {/* Bill Metadata Header Bar */}
                                <div style={{
                                  display: 'flex',
                                  justify: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '8px',
                                  paddingBottom: '10px',
                                  marginBottom: '12px',
                                  borderBottom: '1px solid var(--border)',
                                  fontSize: '12px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                      รายการยาในบิล #{sale.id}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                      ผู้ป่วย / ลูกค้า: <strong style={{ color: 'var(--teal-600)' }}>{custName}</strong>
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>
                                      เภสัชกร: <strong>{pharmName}</strong>
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal-600)', backgroundColor: 'var(--bg-surface)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                    การจัดยาล็อตมาตรฐาน (FEFO)
                                  </span>
                                </div>

                                {/* Itemized Cards List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {sale.items && sale.items.length > 0 ? (
                                    sale.items.map((item, itemIdx) => (
                                      <div
                                        key={itemIdx}
                                        style={{
                                          display: 'flex',
                                          justify: 'space-between',
                                          alignItems: 'center',
                                          backgroundColor: 'var(--bg-surface)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '8px',
                                          padding: '10px 14px',
                                          fontSize: '12px'
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                            {item.trade_name}
                                          </div>
                                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                              TMT-{String(item.drug_id).replace(/^TMT-/, '')}
                                            </span>
                                            <span>·</span>
                                            <span>ขนาด: {item.strength || '-'} {item.unit}</span>
                                            <span>·</span>
                                            <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-card)', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '10.5px' }}>
                                              ล็อต: {item.lot_number || 'LOT-DEFAULT'}
                                            </span>
                                          </div>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--teal-600)' }}>
                                            ฿{item.subtotal.toFixed(2)}
                                          </div>
                                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {item.quantity} {item.unit} × ฿{item.unit_price.toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                                      ไม่พบรายละเอียดรายการยาในบิลนี้
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <div className="empty-icon">≡</div>
                        <div>ไม่พบประวัติธุรกรรมในช่วงเวลานี้</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
