'use client';

import React, { useState } from 'react';

export default function ControlledDrugModal({ controlledItems, customer, onConfirm, onCancel }) {
  const [patientName, setPatientName] = useState(customer?.name || '');
  const [patientIdCard, setPatientIdCard] = useState(customer?.id_card || '');
  const [prescriberName, setPrescriberName] = useState('ภก. เภสัชกรผู้สั่งใช้ยา');
  const [pharmacistName, setPharmacistName] = useState('ภก. สมชาย มีสุข (ภ. 12345)');
  const [purpose, setPurpose] = useState('บรรเทาอาการป่วยตามข้อบ่งใช้');
  const [errorMsg, setErrorMsg] = useState('');

  if (!controlledItems || controlledItems.length === 0) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล ผู้รับยา/ผู้ป่วย (ตามข้อกำหนด GPP อย.)');
      return;
    }
    setErrorMsg('');
    onConfirm({
      patient_name: patientName.trim(),
      patient_id_card: patientIdCard.trim(),
      prescriber_name: prescriberName.trim(),
      pharmacist_name: pharmacistName.trim(),
      purpose: purpose.trim()
    });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: '520px', border: '2px solid #f59e0b' }}>
        <div className="modal-header" style={{ backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
          <div className="modal-icon" style={{ backgroundColor: '#fde68a', color: '#92400e' }}>⚠️</div>
          <div className="modal-title" style={{ color: '#78350f' }}>แจ้งเตือนยาควบคุมพิเศษ / ยาอันตราย (GPP)</div>
          <div className="modal-subtitle" style={{ color: '#92400e' }}>บันทึกข้อมูลผู้สั่งใช้และผู้รับยาตามกฎกระทรวง อย.</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
              <strong>🛡️ ข้อกำหนดมาตรฐาน GPP อย. (Force Data Entry):</strong><br />
              คำสั่งซื้อนี้มีรายการยาควบคุมพิเศษหรือยาอันตราย (ข.ย. 10 / ข.ย. 11)
              ระบบจำเป็นต้องบันทึกข้อมูลผู้ป่วยเพื่อจัดทำบัญชีรายงานตามกฎหมาย
            </div>

            {/* Controlled items list */}
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                รายการยาควบคุมในตะกร้า:
              </div>
              {controlledItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <span>🔴 {item.trade_name} ({item.drug_type === 'special_controlled' ? 'ยาควบคุมพิเศษ' : 'ยาอันตราย'})</span>
                  <span>x{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="error-banner" style={{ margin: 0 }}>
                ⚠ {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                ชื่อ-นามสกุล ผู้ป่วย / ผู้รับยา <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="cash-input"
                style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                placeholder="ระบุชื่อ-นามสกุล ผู้ป่วย..."
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  เลขบัตรประชาชน / Passport
                </label>
                <input
                  type="text"
                  className="cash-input"
                  style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                  placeholder="13 หลัก..."
                  value={patientIdCard}
                  onChange={(e) => setPatientIdCard(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  เภสัชกรผู้ส่งมอบยา
                </label>
                <input
                  type="text"
                  className="cash-input"
                  style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                อาการป่วย / เหตุผลในการจ่ายยา
              </label>
              <input
                type="text"
                className="cash-input"
                style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                placeholder="ระบุอาการป่วย..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
            >
              ยกเลิกคำสั่งซื้อ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: '#d97706' }}
            >
              บันทึกข้อมูล GPP & ปิดการขาย
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
