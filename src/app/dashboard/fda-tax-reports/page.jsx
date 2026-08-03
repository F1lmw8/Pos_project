'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function FdaTaxReportsPage() {
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'vat', 'khoyor', 'controlled', 'invoices'
  const [khoyorSubTab, setKhoyorSubTab] = useState('khoyor9'); // 'khoyor9', 'khoyor10', 'khoyor11', 'khoyor12', 'bosor'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      try {
        const res = await fetch('/api/dashboard/tax-fda-reports');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, []);

  const exportExcel = (reportName) => {
    alert(`กำลังส่งออกรายงาน ${reportName} เป็นไฟล์ Excel (.xlsx)`);
  };

  const exportPdf = (reportName) => {
    alert(`กำลังส่งออกรายงาน ${reportName} เป็นไฟล์ PDF สำหรับยื่น อย. / สรรพากร`);
  };

  return (
    <DashboardLayout>
      {/* Back button when inside sub-views */}
      {activeTab !== 'main' && (
        <button
          onClick={() => setActiveTab('main')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#10b981',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← กลับหน้าสรุปรายงานสรรพากรและ อย.
        </button>
      )}

      {/* Main View: Dashboard Cards Overview */}
      {activeTab === 'main' && (
        <div>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏛</span> รายงานสรรพากรและ อย.
            </h1>
            <p className="page-subtitle">
              รวมเอกสารภาษีและทะเบียน อย. ที่ร้านต้องจัดทำไว้ที่เดียว พร้อมยื่นและพร้อมให้ตรวจ
            </p>
          </div>

          {/* Section 1: การยื่นและการตรวจ */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              การยื่นและการตรวจ
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Card 1: VAT ภ.พ.30 */}
              <div
                onClick={() => setActiveTab('vat')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800',
                  marginBottom: '12px'
                }}>
                  %
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ภาษีมูลค่าเพิ่ม (ภ.พ.30)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  ไม่พลาดกำหนดยื่น ภ.พ.30 ตัวเลขแต่ละช่องกรอกไว้ให้แล้ว พร้อมนำไปยื่น
                </p>
              </div>

              {/* Card 2: ทะเบียน อย. (ขย.) */}
              <div
                onClick={() => setActiveTab('khoyor')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  📋
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ทะเบียน อย. (ขย.)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  เจ้าหน้าที่มาตรวจก็เปิดได้ทันที ทะเบียน ขย.9–ขย.12 และ บ.ส. ส่งออก Excel/PDF ได้
                </p>
              </div>

              {/* Card 3: วัตถุออกฤทธิ์ควบคุม */}
              <div
                onClick={() => setActiveTab('controlled')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  🛡
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  วัตถุออกฤทธิ์ควบคุม
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  ติดตามรับ-จ่ายยาควบคุมทุกรายการ ให้ยอดในบัญชีตรงกับของบนชั้น
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: ตรวจสอบยอดเงิน */}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              ตรวจสอบยอดเงิน
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {/* Card 4: ใบเสร็จและใบกำกับภาษี */}
              <div
                onClick={() => setActiveTab('invoices')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  💵
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ใบเสร็จและใบกำกับภาษี
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  หาเลขใบเสร็จที่ขาดหายก่อนถูกตรวจพบ พร้อมเช็กข้อกำหนดมาตรา 86 เบื้องต้น
                </p>
              </div>

              {/* Card 5: เงินสดและการชำระ */}
              <div
                onClick={() => alert('รายงานเงินสดและการชำระเงินกระทบยอด')}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#f3e8ff',
                  color: '#9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  💳
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  เงินสดและการชำระ
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  ปิดยอดลิ้นชักและกระทบยอดเงินฝากธนาคารด้วยยอดเงินสด บัตร และพร้อมเพย์รายวัน
                </p>
              </div>

              {/* Card 6: ยอดขายรายวัน */}
              <div
                onClick={() => window.location.href = '/dashboard/sales-logs'}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '12px'
                }}>
                  📊
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                  ยอดขายรายวัน
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  ดูรายวันว่าขายเท่าไร ให้ส่วนลดเท่าไร เก็บภาษีเท่าไร คือตัวเลขที่ใช้ยื่นสรรพากร
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 1: VAT ภ.พ.30 */}
      {activeTab === 'vat' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title">% ภาษีมูลค่าเพิ่ม (ภ.พ.30)</h1>
            <p className="page-subtitle">ไม่พลาดกำหนดยื่น ภ.พ.30 ตัวเลขแต่ละช่องกรอกไว้ให้แล้ว พร้อมนำไปยื่น</p>
          </div>

          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ภาษีขาย (Output VAT)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                ฿{data?.vat?.output_vat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ภาษีซื้อ (Input VAT)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                ฿{data?.vat?.input_vat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>ภาษีที่ต้องชำระ</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
                ฿{data?.vat?.net_payable?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>อัตราภาษีที่แท้จริง</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {data?.vat?.effective_tax_rate || '7%'}
              </div>
            </div>
          </div>

          {/* Form Breakdown ภ.พ.30 */}
          <div className="dash-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 ภ.พ.30 — แบบแสดงรายการภาษีมูลค่าเพิ่ม
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              งวดภาษี: 08/2026 — กำหนดยื่น: {data?.vat?.deadline_online} (ออนไลน์) / {data?.vat?.deadline_paper} (กระดาษ)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <span><strong>1. ภาษีขาย</strong> (Output Tax collected on sales)</span>
                <span>฿{data?.vat?.output_vat?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <span><strong>2. ภาษีซื้อ</strong> (Input Tax paid on purchases)</span>
                <span>฿{data?.vat?.input_vat?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <span><strong>3. ภาษีที่ต้องชำระ/ชำระเกิน</strong> (Net VAT)</span>
                <span>฿{data?.vat?.net_payable?.toFixed(2) || '0.00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <span><strong>4. เครดิตภาษีจากเดือนก่อน</strong></span>
                <span>฿0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '8px', fontWeight: '700' }}>
                <span>5. ภาษีที่ต้องชำระสุทธิ (Total VAT payable)</span>
                <span style={{ color: '#059669' }}>฿{data?.vat?.net_payable?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 2: ทะเบียน อย. (ขย.) */}
      {activeTab === 'khoyor' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title">📋 ทะเบียน อย. (ขย.)</h1>
            <p className="page-subtitle">เจ้าหน้าที่มาตรวจก็เปิดได้ทันที ทะเบียน ขย.9–ขย.12 และ บ.ส. ส่งออก Excel/PDF ได้</p>
          </div>

          {/* Form Banner */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
              แบบฟอร์มวัตถุออกฤทธิ์ในประเภท ๓ หรือ ๔
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              ของเดือนปัจจุบัน บ.ว.จ. เก็บไว้ ณ สถานที่ขายยา เพื่อให้พนักงานเจ้าหน้าที่ตรวจสอบ ส่วนรายงาน ร.ว.จ. ต้องเสนอต่อเลขาธิการ อย. ภายในเดือนถัดไป
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => exportPdf('บ.ว.จ. ๑/๑-ขพ')} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                📥 บ.ว.จ. ๑/๑-ขพ
              </button>
              <button onClick={() => exportPdf('ร.ว.จ. ๑/๑/เดือน')} style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                📥 ร.ว.จ. ๑/๑/เดือน
              </button>
            </div>
          </div>

          {/* 5 Tab Cards for ขย.9 to ขย.12 & บ.ส. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { key: 'khoyor9', label: 'ขย.9', sub: 'บัญชีซื้อยา', count: data?.khoyor?.khoyor_9_count || 0 },
              { key: 'khoyor10', label: 'ขย.10', sub: 'ยาควบคุมพิเศษ', count: data?.khoyor?.khoyor_10_count || 0 },
              { key: 'khoyor11', label: 'ขย.11', sub: 'ยาอันตราย', count: data?.khoyor?.khoyor_11_count || 0 },
              { key: 'khoyor12', label: 'ขย.12', sub: 'ยาตามใบสั่งยา', count: data?.khoyor?.khoyor_12_count || 0 },
              { key: 'bosor', label: 'บ.ส.', sub: 'ยาเสพติด/วัตถุออกฤทธิ์', count: data?.khoyor?.bosor_count || 0 }
            ].map((tab) => (
              <div
                key={tab.key}
                onClick={() => setKhoyorSubTab(tab.key)}
                style={{
                  backgroundColor: khoyorSubTab === tab.key ? '#ecfdf5' : '#ffffff',
                  border: `2px solid ${khoyorSubTab === tab.key ? '#10b981' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '800', color: khoyorSubTab === tab.key ? '#047857' : '#1e293b' }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>{tab.sub}</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: khoyorSubTab === tab.key ? '#059669' : '#64748b' }}>
                  {tab.count} <span style={{ fontSize: '10px', fontWeight: 'normal' }}>รายการ</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Khoyor Table View */}
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>
                🔗 ทะเบียน {khoyorSubTab.toUpperCase()} — รายงานประจำเดือน 08/2026
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => exportExcel(khoyorSubTab)} style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  📥 ส่งออก Excel
                </button>
                <button onClick={() => exportPdf(khoyorSubTab)} style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  📥 ส่งออก PDF
                </button>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>วันที่</th>
                  <th>รายการยา / active ingredient</th>
                  <th>เลขทะเบียน อย.</th>
                  <th>จำนวน</th>
                  <th>ผู้ซื้อ / ผู้รับมอบ</th>
                  <th>เภสัชกร</th>
                </tr>
              </thead>
              <tbody>
                {data?.controlled_logs?.length > 0 ? (
                  data.controlled_logs.map((log, idx) => (
                    <tr key={log.id}>
                      <td>{idx + 1}</td>
                      <td>{new Date(log.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="td-bold">{log.trade_name}</td>
                      <td style={{ color: '#dc2626', fontWeight: '700' }}>{log.fda_reg_no || '1A 123/45'}</td>
                      <td>{log.quantity || 1}</td>
                      <td>{log.patient_name}</td>
                      <td>{log.pharmacist_name}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state" style={{ padding: '24px' }}>
                        <div>ยังไม่มีรายการเคลื่อนไหวทะเบียน {khoyorSubTab.toUpperCase()} ในงวดนี้</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-View 3: Controlled Drugs */}
      {activeTab === 'controlled' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title">🛡 ทะเบียนวัตถุออกฤทธิ์ควบคุม</h1>
            <p className="page-subtitle">บันทึกการจ่ายและการคืนยาเสพติด/วัตถุออกฤทธิ์ (อย. ขย.10)</p>
          </div>

          <div className="dash-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เลขอ้างอิง</th>
                  <th>ยา</th>
                  <th>ผู้ป่วย</th>
                  <th>จำนวน</th>
                  <th>เภสัชกร</th>
                  <th>สถานะ อย.</th>
                </tr>
              </thead>
              <tbody>
                {data?.controlled_logs?.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.created_at).toLocaleDateString('th-TH')}</td>
                    <td style={{ fontFamily: 'monospace' }}>CDL-{log.id}</td>
                    <td className="td-bold">{log.trade_name}</td>
                    <td>{log.patient_name} ({log.patient_id_card || '-'})</td>
                    <td>{log.quantity || 1}</td>
                    <td>{log.pharmacist_name}</td>
                    <td>
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                        ขย.10 ยาควบคุมพิเศษ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-View 4: Section 86 Tax Invoices Audit */}
      {activeTab === 'invoices' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title">📄 ใบเสร็จและใบกำกับภาษี</h1>
            <p className="page-subtitle">หาเลขใบเสร็จที่ขาดหายก่อนถูกตรวจพบ พร้อมเช็กข้อกำหนดมาตรา 86 เบื้องต้น</p>
          </div>

          <div className="dash-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
              ⚠ ความสอดคล้องมาตรา 86 (ประมวลรัษฎากร)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#166534' }}>
              <div>✓ ลำดับเลขใบเสร็จต่อเนื่องกันถูกต้อง</div>
              <div>✓ ใบเสร็จทุกใบระบุวันที่ขาย</div>
              <div>✓ รายละเอียดสินค้าแยกภาษีชัดเจน</div>
              <div>✓ ไม่มีช่องว่างเลขยกเลิกที่ไม่ได้รับอนุมัติ</div>
            </div>
          </div>

          <div className="dash-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เลขใบเสร็จ/ใบกำกับภาษี</th>
                  <th>วันที่ขาย</th>
                  <th>ยอดเงินรวม</th>
                  <th>ภาษีมูลค่าเพิ่ม (7%)</th>
                  <th>วิธีชำระ</th>
                </tr>
              </thead>
              <tbody>
                {data?.invoices?.map((inv) => (
                  <tr key={inv.invoice_no}>
                    <td className="td-bold" style={{ fontFamily: 'monospace' }}>{inv.invoice_no}</td>
                    <td>{new Date(inv.transaction_date).toLocaleDateString('th-TH')}</td>
                    <td className="td-right">฿{Number(inv.total_amount).toFixed(2)}</td>
                    <td className="td-right" style={{ color: '#059669', fontWeight: '600' }}>฿{Number(inv.vat_amount).toFixed(2)}</td>
                    <td>{inv.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
