'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Package, ClipboardList, Printer, RefreshCw, Settings, X, Save } from 'lucide-react';

export default function GppReportsPage() {
  // Tabs ordered strictly: Khor Yor 9 -> Khor Yor 10 -> Khor Yor 11
  const [reportType, setReportType] = useState('khor_yor_9');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pharmacy Store Settings State
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'ร้านยารู้เรื่องยา RDU',
    licenseNo: 'กท. 12345/2569',
    pharmacistName: 'ภก. สมชาย มีสุข (ภ. 12345)'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Form fields inside settings modal
  const [tempStoreName, setTempStoreName] = useState('');
  const [tempLicenseNo, setTempLicenseNo] = useState('');
  const [tempPharmacistName, setTempPharmacistName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('pharmacy_store_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName) setStoreSettings(parsed);
      } catch (e) {
        console.error('Failed to parse store settings:', e);
      }
    }
  }, []);

  const openSettingsModal = () => {
    setTempStoreName(storeSettings.storeName);
    setTempLicenseNo(storeSettings.licenseNo);
    setTempPharmacistName(storeSettings.pharmacistName);
    setShowSettingsModal(true);
  };

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    const updated = {
      storeName: tempStoreName || 'ร้านยารู้เรื่องยา RDU',
      licenseNo: tempLicenseNo || 'กท. 12345/2569',
      pharmacistName: tempPharmacistName || 'ภก. สมชาย มีสุข (ภ. 12345)'
    };
    setStoreSettings(updated);
    localStorage.setItem('pharmacy_store_settings', JSON.stringify(updated));
    setShowSettingsModal(false);
  };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ type: reportType });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/dashboard/gpp-reports?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setReportData(json.data || []);
      } else {
        setError(json.error || 'ไม่สามารถโหลดรายงานได้');
      }
    } catch (err) {
      console.error('Failed to load GPP report:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  // Dynamic Print & PDF File Naming (e.g. ข.ย. 11_2026-08-05.pdf)
  const handlePrint = () => {
    const originalTitle = document.title;
    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let reportCode = 'ข.ย. 9';
    if (reportType === 'khor_yor_10') reportCode = 'ข.ย. 10';
    if (reportType === 'khor_yor_11') reportCode = 'ข.ย. 11';

    const pdfTitle = `${reportCode}_${dateFormatted}`;
    document.title = pdfTitle;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const getReportTitle = () => {
    if (reportType === 'khor_yor_9') return 'รายงาน ข.ย. 9: บัญชีการซื้อยา';
    if (reportType === 'khor_yor_10') return 'รายงาน ข.ย. 10: บัญชีการขายยาควบคุมพิเศษ';
    return 'รายงาน ข.ย. 11: บัญชีการขายยาอันตราย';
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header & Action Controls (Hidden on Print) */}
        <div className="stock-header print-hidden" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px', fontWeight: 800 }}>
              <ClipboardList size={26} style={{ color: 'var(--teal-600)' }} /> รายงานมาตรฐาน GPP อย.
            </h1>
            <p className="dashboard-subtitle" style={{ marginTop: '4px', fontSize: '13px' }}>
              แบบรายงานบัญชีซื้อ-ขายยาควบคุมตามกฎหมายกระทรวงสาธารณสุข
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchReport}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} /> รีเฟรช
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> พิมพ์ / ส่งออก PDF
            </button>
          </div>
        </div>

        {/* Tab & Date Filter Controls (Hidden on Print) */}
        <div
          className="print-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Report Type Selector Tabs - Strictly Ordered: Khor Yor 9 -> 10 -> 11 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <button
              onClick={() => setReportType('khor_yor_9')}
              className={`filter-badge ${reportType === 'khor_yor_9' ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                ...(reportType === 'khor_yor_9' ? { backgroundColor: '#0d9488', color: '#ffffff', borderColor: '#0d9488' } : {})
              }}
            >
              <Package size={14} /> ข.ย. 9 (บัญชีการซื้อยา)
            </button>
            <button
              onClick={() => setReportType('khor_yor_10')}
              className={`filter-badge ${reportType === 'khor_yor_10' ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                ...(reportType === 'khor_yor_10' ? { backgroundColor: '#d97706', color: '#ffffff', borderColor: '#d97706' } : {})
              }}
            >
              <ClipboardList size={14} /> ข.ย. 10 (ขายยาควบคุมพิเศษ)
            </button>
            <button
              onClick={() => setReportType('khor_yor_11')}
              className={`filter-badge ${reportType === 'khor_yor_11' ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                ...(reportType === 'khor_yor_11' ? { backgroundColor: '#dc2626', color: '#ffffff', borderColor: '#dc2626' } : {})
              }}
            >
              <ClipboardList size={14} /> ข.ย. 11 (ขายยาอันตราย)
            </button>
          </div>

          {/* Date Range Filter Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchReport();
            }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '13px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ตั้งแต่วันที่:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ถึงวันที่:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 600 }}
            >
              🔍 กรองตามวันที่
            </button>
          </form>
        </div>

        {/* Printable Official Document Sheet (Pure White Print Class: print-sheet) */}
        <div
          className="print-sheet"
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '28px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {/* Printable Header Title */}
          <div style={{ textAlign: 'center', paddingBottom: '16px', marginBottom: '20px', borderBottom: '1.5px solid var(--border)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {getReportTitle()}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              ตามกฎกระทรวงสาธารณสุข มาตรฐาน GPP ร้านขายยาแผนปัจจุบัน
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              ชื่อสถานประกอบการ: {storeSettings.storeName} (ใบอนุญาตเลขที่: {storeSettings.licenseNo})
            </div>
          </div>

          {loading ? (
            <div className="loading-center" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              <span>กำลังโหลดข้อมูลรายงาน GPP...</span>
            </div>
          ) : error ? (
            <div className="error-banner" style={{ textAlign: 'center' }}>
              ⚠ {error}
            </div>
          ) : reportData.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 0' }}>
              <div className="empty-icon">📋</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                ไม่พบรายการข้อมูลในรายงานประเภทนี้ในช่วงเวลาที่เลือก
              </div>
            </div>
          ) : reportType === 'khor_yor_9' ? (
            /* Table for Khor Yor 9 (Purchases) */
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px', textAlign: 'center' }}>ลำดับ</th>
                    <th>วัน/เดือน/ปี ที่รับ</th>
                    <th>ชื่อยา/ความแรง/รูปแบบ</th>
                    <th>เลขทะเบียน อย.</th>
                    <th>เลขที่ล็อต (Lot)</th>
                    <th>วันหมดอายุ</th>
                    <th style={{ textAlign: 'center' }}>จำนวนรับ</th>
                    <th style={{ textAlign: 'right' }}>ราคาต้นทุน (฿)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>{new Date(row.received_at).toLocaleDateString('th-TH')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.trade_name} {row.strength ? `(${row.strength})` : ''}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{row.fda_reg_no || '-'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{row.lot_number || '-'}</td>
                      <td>{row.expiry_date ? new Date(row.expiry_date).toLocaleDateString('th-TH') : '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.quantity} {row.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {Number(row.cost_price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Table for Khor Yor 10 / Khor Yor 11 (Controlled & Dangerous Drug Sales) */
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>ลำดับ</th>
                    <th>วัน/เดือน/ปี ที่ขาย</th>
                    <th>ชื่อยา/ความแรง (Lot)</th>
                    <th style={{ textAlign: 'center' }}>จำนวน</th>
                    <th>ชื่อ-นามสกุล ผู้รับยา/ผู้ป่วย</th>
                    <th>เลขบัตรประชาชน</th>
                    <th>เภสัชกรส่งมอบ</th>
                    <th>เหตุผลในการจ่าย</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={row.log_id || idx}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>{new Date(row.transaction_date || row.log_date).toLocaleDateString('th-TH')}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.trade_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          Lot: {row.lot_number || '-'} | อย.: {row.fda_reg_no || '-'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.quantity} {row.unit}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {row.patient_name || 'ลูกค้าทั่วไป'}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{row.patient_id_card || '-'}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '500' }}>{row.pharmacist_name || storeSettings.pharmacistName}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{row.purpose || 'บรรเทาปวด/รักษาอาการป่วยเบื้องต้น'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Printable Signature Footer (Shown only when printing) */}
          <div className="print-only" style={{ display: 'none', justifyContent: 'space-between', marginTop: '40px', fontSize: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '30px' }}>ลงชื่อ..........................................................ผู้รายงาน</p>
              <p>( {storeSettings.pharmacistName} )</p>
              <p>เภสัชกรผู้มีหน้าที่ปฏิบัติการ</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '30px' }}>ลงชื่อ..........................................................ผู้รับรอง</p>
              <p>( .......................................................... )</p>
              <p>ผู้รับอนุญาตขายยา</p>
            </div>
          </div>
        </div>

        {/* Store Settings Modal */}
        {showSettingsModal && (
          <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <header className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
                  <Settings size={18} style={{ color: 'var(--teal-600)' }} /> ตั้งค่าข้อมูลร้านยา & ใบอนุญาต
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </header>

              <form onSubmit={handleSaveStoreSettings}>
                <div className="modal-body" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                      ชื่อสถานประกอบการ (ร้านยา):
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      value={tempStoreName}
                      onChange={(e) => setTempStoreName(e.target.value)}
                      placeholder="เช่น ร้านยารู้เรื่องยา RDU"
                      required
                      style={{ height: '38px', padding: '0 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                      เลขที่ใบอนุญาตขายยา:
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      value={tempLicenseNo}
                      onChange={(e) => setTempLicenseNo(e.target.value)}
                      placeholder="เช่น กท. 12345/2569"
                      required
                      style={{ height: '38px', padding: '0 12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                      ชื่อเภสัชกรผู้มีหน้าที่ปฏิบัติการ:
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      value={tempPharmacistName}
                      onChange={(e) => setTempPharmacistName(e.target.value)}
                      placeholder="เช่น ภก. สมชาย มีสุข (ภ. 12345)"
                      required
                      style={{ height: '38px', padding: '0 12px' }}
                    />
                  </div>
                </div>

                <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Save size={14} /> บันทึกการตั้งค่า
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
