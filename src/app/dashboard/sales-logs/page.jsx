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
                            <td colSpan="8" style={{ padding: '8px 12px 14px' }}>
                              <div className="expanded-inner" style={{ margin: 0, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <div className="expanded-header" style={{ marginBottom: '8px', padding: '8px 12px', borderRadius: '6px' }}>
                                  <span>รายการยาในบิล {sale.id} · ผู้ป่วย: <strong>{custName}</strong> · เภสัชกร: <strong>{pharmName}</strong></span>
                                  <span>จัดยาล็อต FEFO</span>
                                </div>
                                <table className="data-table" style={{ fontSize: '12px', width: '100%', tableLayout: 'fixed' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ width: '42%', paddingLeft: '12px' }}>ตัวยา / TMT</th>
                                      <th className="td-center" style={{ width: '14%' }}>ขนาด</th>
                                      <th className="td-center" style={{ width: '16%' }}>ล็อต</th>
                                      <th className="td-center" style={{ width: '10%' }}>จำนวน</th>
                                      <th className="td-right" style={{ width: '10%' }}>ราคา/หน่วย</th>
                                      <th className="td-right" style={{ width: '8%', paddingRight: '12px' }}>รวม</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sale.items && sale.items.length > 0 ? (
                                      sale.items.map((item, itemIdx) => (
                                        <tr key={itemIdx}>
                                          <td style={{ paddingLeft: '12px' }}>
                                            <div className="td-bold" style={{ fontSize: '12.5px' }}>{item.trade_name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TMT-{String(item.drug_id).replace(/^TMT-/, '')}</div>
                                          </td>
                                          <td className="td-center" style={{ color: 'var(--text-secondary)' }}>{item.strength} {item.unit}</td>
                                          <td className="td-center">
                                            <span className="badge badge-gray td-mono">{item.lot_number || 'LOT-DEFAULT'}</span>
                                          </td>
                                          <td className="td-center" style={{ fontWeight: 700, color: 'var(--teal-600)' }}>{item.quantity}</td>
                                          <td className="td-right" style={{ color: 'var(--text-secondary)' }}>฿{item.unit_price.toFixed(2)}</td>
                                          <td className="td-right td-bold" style={{ paddingRight: '12px' }}>฿{item.subtotal.toFixed(2)}</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan="6">
                                          <div className="empty-state" style={{ padding: '16px 0' }}>
                                            <div style={{ fontSize: '11px' }}>ไม่พบรายละเอียด</div>
                                          </div>
                                        </td>
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
