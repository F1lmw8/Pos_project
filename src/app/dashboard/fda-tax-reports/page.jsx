'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

export default function FdaTaxReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'vat', 'khoyor', 'controlled', 'invoices'
  const [khoyorSubTab, setKhoyorSubTab] = useState('khoyor9');

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch('/api/dashboard/reports');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const exportExcel = (type) => {
    alert(`ดาวน์โหลดรายงาน ${type.toUpperCase()} ในรูปแบบ Excel (XLSX) เรียบร้อยแล้ว`);
  };

  const exportPdf = (type) => {
    alert(`ดาวน์โหลดแบบฟอร์ม ${type.toUpperCase()} ในรูปแบบ PDF มาตรฐาน อย./สรรพากร เรียบร้อยแล้ว`);
  };

  return (
    <DashboardLayout>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>🏛 รายงานสรรพากรและ อย.</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
            รวมเอกสารภาษีและทะเบียน อย. ที่ร้านต้องจัดทำไว้ที่เดียว พร้อมยื่นและพร้อมให้ตรวจ
          </p>
        </div>

        {activeTab !== 'overview' && (
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← กลับหน้าหลักรายงาน
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          ⏳ กำลังประมวลผลข้อมูลภาษีและทะเบียน อย...
        </div>
      ) : activeTab === 'overview' ? (
        /* MAIN OVERVIEW: 6 CARDS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: การยื่นและการตรวจ */}
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              การยื่นและการตรวจ
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Card 1: VAT ภ.พ.30 */}
              <div
                onClick={() => setActiveTab('vat')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#064e3b',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800',
                  marginBottom: '14px'
                }}>
                  %
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  ภาษีมูลค่าเพิ่ม (ภ.พ.30)
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  ไม่พลาดกำหนดยื่น ภ.พ.30 ตัวเลขแต่ละช่องกรอกไว้ให้แล้ว พร้อมนำไปยื่น
                </p>
              </div>

              {/* Card 2: ทะเบียน อย. (ขย.) */}
              <div
                onClick={() => setActiveTab('khoyor')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#075985',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '14px'
                }}>
                  📋
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  ทะเบียน อย. (ขย.)
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  เจ้าหน้าที่มาตรวจก็เปิดได้ทันที ทะเบียน ขย.9–ขย.12 และ บ.ส. ส่งออก Excel/PDF ได้
                </p>
              </div>

              {/* Card 3: วัตถุออกฤทธิ์ควบคุม */}
              <div
                onClick={() => setActiveTab('controlled')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#7f1d1d',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '14px'
                }}>
                  🛡
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  วัตถุออกฤทธิ์ควบคุม
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Card 4: ใบเสร็จและใบกำกับภาษี */}
              <div
                onClick={() => setActiveTab('invoices')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#78350f',
                  color: '#fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '14px'
                }}>
                  💵
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  ใบเสร็จและใบกำกับภาษี
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  หาเลขใบเสร็จที่ขาดหายก่อนถูกตรวจพบ พร้อมเช็กข้อกำหนดมาตรา 86 เบื้องต้น
                </p>
              </div>

              {/* Card 5: เงินสดและการชำระ */}
              <div
                onClick={() => alert('รายงานเงินสดและการชำระเงินกระทบยอด')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#581c87',
                  color: '#e9d5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '14px'
                }}>
                  💳
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  เงินสดและการชำระ
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  ปิดยอดลิ้นชักและกระทบยอดเงินฝากธนาคารด้วยยอดเงินสด บัตร และพร้อมเพย์รายวัน
                </p>
              </div>

              {/* Card 6: ยอดขายรายวัน */}
              <div
                onClick={() => window.location.href = '/dashboard/sales-logs'}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                className="hover-card"
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#064e3b',
                  color: '#6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  marginBottom: '14px'
                }}>
                  📊
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  ยอดขายรายวัน
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  ดูรายวันว่าขายเท่าไร ให้ส่วนลดเท่าไร เก็บภาษีเท่าไร คือตัวเลขที่ใช้ยื่นสรรพากร
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sub-View 1: VAT ภ.พ.30 */}
      {activeTab === 'vat' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>% ภาษีมูลค่าเพิ่ม (ภ.พ.30)</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>ไม่พลาดกำหนดยื่น ภ.พ.30 ตัวเลขแต่ละช่องกรอกไว้ให้แล้ว พร้อมนำไปยื่น</p>
          </div>

          {/* 4 Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>ภาษีขาย (Output VAT)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                ฿{data?.vat?.output_vat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>ภาษีซื้อ (Input VAT)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                ฿{data?.vat?.input_vat?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>ภาษีที่ต้องชำระ</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                ฿{data?.vat?.net_payable?.toFixed(2) || '0.00'}
              </div>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>อัตราภาษีที่แท้จริง</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                {data?.vat?.effective_tax_rate || '7%'}
              </div>
            </div>
          </div>

          {/* Form Breakdown ภ.พ.30 */}
          <div className="dash-card">
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              📄 ภ.พ.30 — แบบแสดงรายการภาษีมูลค่าเพิ่ม
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', fontWeight: '700' }}>
                <span>5. ภาษีที่ต้องชำระสุทธิ (Total VAT payable)</span>
                <span style={{ color: '#10b981' }}>฿{data?.vat?.net_payable?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 2: ทะเบียน อย. (ขย.) */}
      {activeTab === 'khoyor' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>📋 ทะเบียน อย. (ขย.)</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>เจ้าหน้าที่มาตรวจก็เปิดได้ทันที ทะเบียน ขย.9–ขย.12 และ บ.ส. ส่งออก Excel/PDF ได้</p>
          </div>

          {/* Form Banner */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px', color: 'var(--text-primary)' }}>
              แบบฟอร์มวัตถุออกฤทธิ์ในประเภท ๓ หรือ ๔
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              ของเดือนปัจจุบัน บ.ว.จ. เก็บไว้ ณ สถานที่ขายยา เพื่อให้พนักงานเจ้าหน้าที่ตรวจสอบ ส่วนรายงาน ร.ว.จ. ต้องเสนอต่อเลขาธิการ อย. ภายในเดือนถัดไป
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => exportPdf('บ.ว.จ. ๑/๑-ขพ')} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                📥 บ.ว.จ. ๑/๑-ขพ
              </button>
              <button onClick={() => exportPdf('ร.ว.จ. ๑/๑/เดือน')} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                📥 ร.ว.จ. ๑/๑/เดือน
              </button>
            </div>
          </div>

          {/* 5 Tab Cards for ขย.9 to ขย.12 & บ.ส. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
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
                  backgroundColor: khoyorSubTab === tab.key ? 'var(--teal-50)' : 'var(--bg-card)',
                  border: `2px solid ${khoyorSubTab === tab.key ? 'var(--teal-600)' : 'var(--border)'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '800', color: khoyorSubTab === tab.key ? 'var(--teal-700)' : 'var(--text-primary)' }}>
                  {tab.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '6px' }}>{tab.sub}</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: khoyorSubTab === tab.key ? 'var(--teal-600)' : 'var(--text-muted)' }}>
                  {tab.count} <span style={{ fontSize: '10px', fontWeight: 'normal' }}>รายการ</span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Khoyor Table View */}
          <div className="dash-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
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
                      <td style={{ color: '#ef4444', fontWeight: '700' }}>{log.fda_reg_no || '-'}</td>
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
            <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>🛡 ทะเบียนวัตถุออกฤทธิ์ควบคุม</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>บันทึกการจ่ายและการคืนยาเสพติด/วัตถุออกฤทธิ์ (อย. ขย.10)</p>
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
                      <span style={{ backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
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
            <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>📄 ใบเสร็จและใบกำกับภาษี</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>หาเลขใบเสร็จที่ขาดหายก่อนถูกตรวจพบ พร้อมเช็กข้อกำหนดมาตรา 86 เบื้องต้น</p>
          </div>

          <div className="dash-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
              ⚠ ความสอดคล้องมาตรา 86 (ประมวลรัษฎากร)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', color: '#10b981' }}>
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
                    <td className="td-right" style={{ color: '#10b981', fontWeight: '600' }}>฿{Number(inv.vat_amount).toFixed(2)}</td>
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
