'use client';

import React, { useEffect, useState } from 'react';
import {
  History,
  User,
  Phone,
  CreditCard,
  AlertTriangle,
  Activity,
  ShoppingBag,
  Pill,
  X,
  Banknote,
  QrCode,
  Calendar,
  ShieldAlert
} from 'lucide-react';

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getPaymentLabel(method) {
  switch (method) {
    case 'cash':
      return { label: 'เงินสด', icon: Banknote, bg: '#065f46', color: '#a7f3d0' };
    case 'qr_promptpay':
      return { label: 'PromptPay', icon: QrCode, bg: '#1e3a8a', color: '#93c5fd' };
    case 'credit_card':
      return { label: 'บัตรเครดิต', icon: CreditCard, bg: '#581c87', color: '#e9d5ff' };
    default:
      return { label: method || 'เงินสด', icon: Banknote, bg: '#334155', color: '#cbd5e1' };
  }
}

export default function PatientHistoryModal({ isOpen, onClose, customerId, customerName }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && customerId) {
      setLoading(true);
      setError('');
      fetch(`/api/customers/${customerId}/history`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setData(json);
          } else {
            setError(json.error || 'ไม่สามารถโหลดประวัติการซื้อยาได้');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  const cust = data?.customer || {};
  const history = data?.history || [];
  const alerts = data?.clinical_alerts || [];

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
          padding: 0
        }}
      >
        {/* Modal Header with Curved Matching Top Corners */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '18px',
            borderTopRightRadius: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--teal-50)',
                color: 'var(--teal-700)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <History size={22} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                ประวัติการซื้อยา & ประวัติการรับยาของคนไข้
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ผู้ป่วย: <strong style={{ color: 'var(--teal-600)' }}>{customerName || cust.name || 'ไม่ระบุชื่อ'}</strong> (รหัสสมาชิก: #{customerId})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div className="loading-center" style={{ padding: '60px 0' }}>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              <span>กำลังโหลดประวัติการซื้อยาของคนไข้...</span>
            </div>
          )}

          {error && (
            <div className="error-banner" style={{ marginBottom: '20px' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Patient Profile Card */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '18px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> ชื่อ-นามสกุล
                    </span>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '2px', display: 'block' }}>{cust.name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} /> เบอร์โทรศัพท์
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--teal-600)', fontWeight: 600, marginTop: '2px', display: 'block' }}>{cust.phone || '-'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={12} /> เลขบัตรประชาชน / Passport
                    </span>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>{cust.id_card || '-'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block' }}>อายุ / เพศ / น้ำหนัก / ส่วนสูง</span>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                      {cust.age ? `${cust.age} ปี` : '-'} | {cust.gender || '-'} | {cust.weight ? `${cust.weight} kg` : '-'} | {cust.height ? `${cust.height} cm` : '-'}
                    </span>
                  </div>
                </div>

                {/* Health & Allergy Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cust.allergies && cust.allergies.length > 0 && (
                    <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={16} /> ประวัติการแพ้ยา: {cust.allergies.join(', ')}
                    </div>
                  )}

                  {cust.medical_conditions && (
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px' }}>
                      🏥 โรคประจำตัว: {cust.medical_conditions}
                    </div>
                  )}

                  {cust.current_medications && (
                    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: '10px', fontSize: '13px' }}>
                      💊 ยาที่ใช้ประจำ: {cust.current_medications}
                    </div>
                  )}
                </div>
              </div>

              {/* Pharmacist Clinical Decision Alerts */}
              {alerts.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#d97706', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={18} /> การประเมินและข้อแนะนำทางเภสัชกรรม (Pharmacist Clinical Decision):
                  </div>
                  {alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: alert.level === 'danger' ? '#fee2e2' : alert.level === 'warning' ? '#fef3c7' : '#e0f2fe',
                        border: alert.level === 'danger' ? '1.5px solid #ef4444' : alert.level === 'warning' ? '1px solid #f59e0b' : '1px solid #0284c7',
                        color: alert.level === 'danger' ? '#991b1b' : alert.level === 'warning' ? '#92400e' : '#075985',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '10px',
                        lineHeight: '1.5',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={16} /> {alert.title}
                      </div>
                      <div>{alert.message}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Purchase History Timeline */}
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={18} style={{ color: 'var(--teal-600)' }} /> ประวัติการสั่งซื้อยาทั้งหมด ({history.length} รายการธุรกรรม)
                  </span>
                </div>

                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    ยังไม่มีประวัติการซื้อยาในระบบสำหรับผู้ป่วยรายนี้
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {history.map((tx) => {
                      const pay = getPaymentLabel(tx.payment_method);
                      const PayIcon = pay.icon;
                      return (
                        <div
                          key={tx.sale_id}
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '14px',
                            padding: '18px'
                          }}
                        >
                          {/* Transaction Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Calendar size={15} style={{ color: 'var(--text-secondary)' }} />
                              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginRight: '8px' }}>
                                {formatDate(tx.transaction_date)}
                              </span>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                (รหัสใบเสร็จ: <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{tx.sale_id}</span>)
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span
                                style={{
                                  backgroundColor: pay.bg,
                                  color: pay.color,
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <PayIcon size={13} /> {pay.label}
                              </span>

                              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--teal-600)' }}>
                                ฿{tx.total_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* Purchased Items List */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {tx.items.map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid var(--border)',
                                  padding: '12px 14px',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '12px'
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Pill size={14} style={{ color: 'var(--teal-600)' }} /> {item.trade_name}
                                    {item.strength && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({item.strength})</span>}
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                    ตัวยาสามัญ: <span style={{ color: 'var(--teal-600)', fontWeight: 600 }}>{item.active_ingredient || '-'}</span> | เลข อย.: {item.fda_reg_no || '-'} | ล็อต: {item.lot_number || '-'}
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--teal-600)' }}>
                                    x {item.quantity} {item.dosage_form || 'ชิ้น'}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                                    (฿{item.unit_price.toFixed(2)}/หน่วย = ฿{item.subtotal.toFixed(2)})
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '10px', textAlign: 'right' }}>
                            ผู้สั่งจ่ายยา: {tx.staff_id}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            borderBottomLeftRadius: '18px',
            borderBottomRightRadius: '18px'
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            style={{
              borderRadius: '10px',
              padding: '8px 24px',
              fontSize: '13.5px',
              fontWeight: '700'
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
