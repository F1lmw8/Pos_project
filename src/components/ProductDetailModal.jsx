'use client';

import React from 'react';

export default function ProductDetailModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  const classificationMap = {
    household: { label: 'Household Remedy (HHR)', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
    dangerous: { label: 'ยาอันตราย (ข.ย. 11)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    special_controlled: { label: 'ยาควบคุมพิเศษ (ข.ย. 10)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    general: { label: 'ทั่วไป (General)', color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' }
  };

  const currentClass = classificationMap[product.drug_type] || classificationMap.general;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#111c18',
        color: '#e2e8f0',
        border: '1px solid #1c352f',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0 }}>รายละเอียดสินค้า</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Basic Information Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: '#0a1411',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #162923'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>ชื่อสินค้า</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>{product.trade_name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{product.active_ingredient} ({product.strength || '-'})</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>SKU</div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>{product.sku || 'P-001'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>หมวดหมู่</div>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#10b981',
              color: '#ffffff',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {product.dosage_form || 'ยาแผนปัจจุบัน'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>แบรนด์ / ผู้ผลิต</div>
            <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>{product.manufacturer || 'Bayer AG'}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>สถานะ</div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#064e3b',
              color: '#34d399',
              border: '1px solid #059669',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              ✓ ใช้งาน
            </span>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>การจำแนกประเภท</div>
            <span style={{
              display: 'inline-block',
              backgroundColor: currentClass.bg,
              color: currentClass.color,
              border: `1px solid ${currentClass.border}`,
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {currentClass.label}
            </span>
          </div>
        </div>

        {/* Packaging & Pricing Section */}
        <div style={{
          backgroundColor: '#0a1411',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #162923',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
            บรรจุภัณฑ์และราคา
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '14px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #162923' }}>
                <th style={{ padding: '8px 4px' }}>บรรจุภัณฑ์</th>
                <th style={{ padding: '8px 4px' }}>จำนวน</th>
                <th style={{ padding: '8px 4px' }}>บาร์โค้ด</th>
                <th style={{ padding: '8px 4px' }}>รหัสผู้ผลิต</th>
                <th style={{ padding: '8px 4px', textAlign: 'right' }}>ค่าเริ่มต้น</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #162923' }}>
                <td style={{ padding: '10px 4px', fontWeight: '600', color: '#ffffff' }}>∨ {product.unit || 'หน่วย'}</td>
                <td style={{ padding: '10px 4px' }}>1</td>
                <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#38bdf8' }}>{product.barcode || '4058172636455'}</td>
                <td style={{ padding: '10px 4px', color: '#64748b' }}>-</td>
                <td style={{ padding: '10px 4px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>ค่าเริ่มต้น</td>
              </tr>
            </tbody>
          </table>

          {/* Pricing Tiers */}
          <div style={{ backgroundColor: '#070e0c', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>ราคาตามประเภทลูกค้า</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#4ade80' }}>🟢 ลูกค้าท้องถิ่น</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>฿{Number(product.price || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f472b6' }}>🩷 ผู้พำนักชาวต่างชาติ</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>฿{Number(product.price || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#60a5fa' }}>🔵 นักท่องเที่ยวประหยัด</span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>฿{Number(product.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#94a3b8' }}>
            <div>อัตราภาษีมูลค่าเพิ่ม: <strong style={{ color: '#ffffff' }}>7%</strong></div>
            <div>ต้นทุน: <strong style={{ color: '#ffffff' }}>฿{Number((product.price || 0) * 0.65).toFixed(2)}</strong></div>
          </div>
        </div>

        {/* Stock Settings Section */}
        <div style={{
          backgroundColor: '#0a1411',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #162923',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
            การตั้งค่าสต็อก
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#070e0c', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>สต็อกคงเหลือ</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{product.stock_quantity || product.sellable_quantity || 0}</div>
            </div>
            <div style={{ backgroundColor: '#070e0c', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>สต็อกขั้นต่ำ</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>10</div>
            </div>
            <div style={{ backgroundColor: '#070e0c', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>ระดับสั่งซื้อใหม่</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>15</div>
            </div>
            <div style={{ backgroundColor: '#070e0c', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>สต็อกสูงสุด</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#a855f7' }}>200</div>
            </div>
          </div>
        </div>

        {/* FDA Registration Section */}
        <div style={{
          backgroundColor: '#0a1411',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #162923',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
            ทะเบียน อย.
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>เลขทะเบียน อย.</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>{product.fda_reg_no || 'ไม่ระบุ'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>สถานะการตรวจสอบ</div>
              <div style={{ fontSize: '12px', color: product.fda_status === 'verified' ? '#10b981' : '#94a3b8', fontWeight: '600' }}>
                {product.fda_status === 'verified' ? '✓ ตรวจสอบแล้ว' : 'ⓘ ไม่ได้กำหนด'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ปิด
          </button>
          <button
            onClick={() => alert(`ดูประวัติการเคลื่อนไหวสต็อกของ ${product.trade_name}`)}
            style={{
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⚡ ดูการเคลื่อนไหว
          </button>
          <button
            onClick={() => alert('ยืนยันลบรายการสินค้า?')}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            🗑 ลบ
          </button>
          <button
            onClick={() => alert(`แก้ไขสินค้า ${product.trade_name}`)}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✎ แก้ไขสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}
