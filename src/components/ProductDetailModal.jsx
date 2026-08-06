'use client';

import React, { useState, useEffect } from 'react';

export default function ProductDetailModal({ isOpen, onClose, product, onUpdateSuccess }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form state
  const [tradeName, setTradeName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [fdaRegNo, setFdaRegNo] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [drugType, setDrugType] = useState('general');
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    if (product) {
      setTradeName(product.trade_name || '');
      setActiveIngredient(product.active_ingredient || '');
      setPrice(product.price !== undefined ? product.price : '0');
      setStockQuantity(
        product.stock_quantity !== undefined 
          ? product.stock_quantity 
          : (product.sellable_quantity !== undefined ? product.sellable_quantity : '0')
      );
      setFdaRegNo(product.fda_reg_no || '');
      setManufacturer(product.manufacturer || '');
      setDrugType(product.drug_type || 'general');
      setBarcode(product.barcode || '');
      setIsEditing(false);
      setError('');
      setSuccessMsg('');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const classificationMap = {
    household: { label: 'ยาสามัญประจำบ้าน (HHR)', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
    dangerous: { label: 'ยาอันตราย (ข.ย. 11)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    special_controlled: { label: 'ยาควบคุมพิเศษ (ข.ย. 10)', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    general: { label: 'ทั่วไป (General)', color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' }
  };

  const currentClass = classificationMap[drugType] || classificationMap.general;

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const productId = product.tmt_id || product.sku;
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_name: tradeName,
          active_ingredient: activeIngredient,
          price: parseFloat(price) || 0,
          stock_quantity: parseInt(stockQuantity, 10) || 0,
          fda_reg_no: fdaRegNo,
          manufacturer: manufacturer,
          drug_type: drugType,
          barcode: barcode
        })
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('บันทึกการแก้ไขและอัปเดตสต็อกเรียบร้อยแล้ว');
        setIsEditing(false);
        if (onUpdateSuccess) onUpdateSuccess();
      } else {
        setError(json.error || 'ไม่สามารถบันทึกการแก้ไขได้');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!confirm(`คุณต้องการลบสินค้า "${product.trade_name}" ออกจากคลังใช่หรือไม่?`)) return;

    setLoading(true);
    setError('');
    try {
      const productId = product.tmt_id || product.sku;
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });

      const json = await res.json();
      if (json.success) {
        if (onUpdateSuccess) onUpdateSuccess();
        onClose();
      } else {
        setError(json.error || 'ไม่สามารถลบสินค้าได้');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            {isEditing ? '✏️ แก้ไขข้อมูลสินค้า' : 'รายละเอียดสินค้า'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div style={{ backgroundColor: '#065f46', border: '1px solid #10b981', color: '#a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ✓ {successMsg}
          </div>
        )}

        {/* MODE 1: EDIT FORM */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ชื่อการค้า (Trade Name)*</label>
                <input
                  type="text"
                  required
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ชื่อตัวยาสามัญ (Active Ingredient)</label>
                <input
                  type="text"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ราคาขาย (บาท)*</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: '#10b981', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>จำนวนคงเหลือในคลัง*</label>
                <input
                  type="number"
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1.5px solid var(--teal-600)', borderRadius: '8px', padding: '10px 12px', color: 'var(--teal-600)', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>เลขทะเบียน อย.</label>
                <input
                  type="text"
                  value={fdaRegNo}
                  onChange={(e) => setFdaRegNo(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: '#ef4444', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ประเภทกลุ่มยา</label>
                <select
                  value={drugType}
                  onChange={(e) => setDrugType(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                >
                  <option value="general">ทั่วไป (General)</option>
                  <option value="dangerous">ยาอันตราย (ข.ย. 11)</option>
                  <option value="special_controlled">ยาควบคุมพิเศษ (ข.ย. 10)</option>
                  <option value="household">ยาสามัญประจำบ้าน (HHR)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>ผู้ผลิต / แบรนด์</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>บาร์โค้ด</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                ✕ ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                {loading ? '⏳ กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        ) : (
          /* MODE 2: VIEW DETAILS */
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
              backgroundColor: 'var(--bg-surface)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>ชื่อสินค้า</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{product.trade_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{product.active_ingredient} ({product.strength || '-'})</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>SKU</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981', fontFamily: 'monospace' }}>{product.sku || product.tmt_id || 'P-001'}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>หมวดหมู่</div>
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
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>แบรนด์ / ผู้ผลิต</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{product.manufacturer || '-'}</div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>สถานะ</div>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: '20px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  ✓ ใช้งาน
                </span>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>การจำแนกประเภท</div>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: currentClass.bg,
                  color: currentClass.color,
                  border: `1px solid ${currentClass.border}`,
                  borderRadius: '20px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {currentClass.label}
                </span>
              </div>
            </div>

            {/* Inventory & Pricing */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                บรรจุภัณฑ์และราคา
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ราคาขายหน้าร้าน</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                    ฿{Number(product.price || 0).toFixed(2)}
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>สต็อกคงเหลือ</div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>
                    {product.stock_quantity !== undefined ? product.stock_quantity : (product.sellable_quantity || 0)} หน่วย
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>บาร์โค้ด</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {product.barcode || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* FDA Reg No Section */}
            <div style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                ทะเบียน อย.
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#ef4444' }}>
                {product.fda_reg_no || '-'}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ปิด
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={loading}
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
                🗑 ลบสินค้า
              </button>
              <button
                onClick={() => setIsEditing(true)}
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
        )}
      </div>
    </div>
  );
}
