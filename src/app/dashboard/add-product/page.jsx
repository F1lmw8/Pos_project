'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

export default function AddProductPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fdaResults, setFdaResults] = useState([]);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('fda'); // 'fda', 'manual'

  // Manual Form State
  const [tradeName, setTradeName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [dosageForm, setDosageForm] = useState('tablet');
  const [strength, setStrength] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [fdaRegNo, setFdaRegNo] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [barcode, setBarcode] = useState('');
  const [drugType, setDrugType] = useState('general');

  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Live FDA Search Handler
  const handleFdaSearch = async (e) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setFdaLoading(true);
    setFdaResults([]);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/fda/lookup?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFdaResults(json.data);
      } else {
        setFdaResults([]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ อย.');
    } finally {
      setFdaLoading(false);
      setSearched(true);
    }
  };

  // Add FDA Item to Inventory
  const handleAddFdaItem = async (fdaItem) => {
    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const trade = fdaItem.product_name_th !== '-' ? fdaItem.product_name_th : fdaItem.product_name_en;
    const active = fdaItem.product_name_en !== '-' ? fdaItem.product_name_en : trade;

    const payload = {
      tmt_id: fdaItem.newcode || `FDA-${(fdaItem.license_no || '').replace(/\s+/g, '')}`,
      trade_name: trade,
      active_ingredient: active,
      dosage_form: 'ยาแผนปัจจุบัน',
      fda_reg_no: fdaItem.license_no || '-',
      fda_status: fdaItem.status === 'คงอยู่' ? 'verified' : 'unverified',
      manufacturer: fdaItem.company_name || '-',
      drug_type: 'general',
      sku: `FDA-${(fdaItem.license_no || '').replace(/\s+/g, '')}`,
      price: 0,
      stock_quantity: 0
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`เพิ่มสินค้า "${trade}" (อย. ${fdaItem.license_no}) เข้าคลังเรียบร้อยแล้ว!`);
      } else {
        setErrorMsg(json.error || 'เพิ่มสินค้าไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกสินค้า');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Manual Add Form
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!tradeName.trim()) {
      setErrorMsg('กรุณากรอกชื่อสินค้า/ชื่อการค้า');
      return;
    }

    setFormLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      trade_name: tradeName,
      active_ingredient: activeIngredient || tradeName,
      dosage_form: dosageForm,
      strength: strength,
      price: parseFloat(price) || 0,
      stock_quantity: parseInt(stockQty, 10) || 0,
      fda_reg_no: fdaRegNo,
      manufacturer: manufacturer,
      barcode: barcode,
      drug_type: drugType
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`เพิ่มสินค้า "${tradeName}" ลงคลังเรียบร้อยแล้ว!`);
        setTradeName('');
        setActiveIngredient('');
        setPrice('');
        setStockQty('');
        setFdaRegNo('');
        setBarcode('');
        setManufacturer('');
      } else {
        setErrorMsg(json.error || 'เพิ่มสินค้าไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกสินค้า');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>เพิ่มสินค้าใหม่ (Add Product & FDA Lookup)</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>สืบค้นทะเบียนยาจาก อย. กระทรวงสาธารณสุขสดๆ หรือลงทะเบียนสินค้าใหม่เข้าคลังร้าน</p>
        </div>

        <Link
          href="/dashboard/stock"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--teal-600)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📦</span> ไปที่หน้าคลังสินค้า
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div style={{
          backgroundColor: 'var(--teal-50)',
          border: '1px solid var(--teal-600)',
          color: 'var(--teal-700)',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>✓ {successMsg}</div>
          <Link href="/dashboard/stock" style={{ color: 'var(--teal-700)', fontWeight: '700', textDecoration: 'underline', fontSize: '13px' }}>
            ดูสินค้าในคลัง →
          </Link>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: '#450a0a',
          border: '1px solid #dc2626',
          color: '#fca5a5',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Main Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        backgroundColor: 'var(--bg-card)',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        maxWidth: '500px'
      }}>
        <button
          onClick={() => setActiveTab('fda')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'fda' ? '#10b981' : 'transparent',
            color: activeTab === 'fda' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'fda' ? '700' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span>🏛️</span> 1. ค้นหาจากฐานข้อมูล อย. สด
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'manual' ? '#10b981' : 'transparent',
            color: activeTab === 'manual' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: activeTab === 'manual' ? '700' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <span>✍️</span> 2. กรอกข้อมูลสินค้าเอง
        </button>
      </div>

      {/* TAB 1: LIVE FDA LOOKUP */}
      {activeTab === 'fda' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            สืบค้นข้อมูลผลิตภัณฑ์สุขภาพสดจาก อย. (porta.fda.moph.go.th)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            พิมพ์ **ชื่อยาภาษาไทย/อังกฤษ** (เช่น BENZAC, SARA, พารา) หรือ **เลขทะเบียน อย.** (เช่น G762/47, 1A 1289/28) เพื่อดึงข้อมูลจริงจาก อย.
          </p>

          <form onSubmit={handleFdaSearch} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์เลขทะเบียน อย. หรือชื่อยา..."
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '14px 18px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={fdaLoading}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: fdaLoading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {fdaLoading ? '⏳ กำลังค้นหา...' : '🔍 ค้นหา อย. สด'}
            </button>
          </form>

          {/* Barcode & FDA Guide Cards (Matching User Specification) */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
              คุณสามารถระบุสินค้าด้วยรหัสที่พิมพ์อยู่นอกกล่อง:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* EAN Barcode Card */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#1e40af', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                    EAN-13 / EAN-8
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    บาร์โค้ด EAN
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#fffbe3',
                  color: '#0f172a',
                  border: '1px solid #fef08a',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Adalat CR</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>30 mg · 30 tablets</div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    <div style={{ fontSize: '20px', letterSpacing: '-1px', lineHeight: 1, color: '#0f172a' }}>||||||||||||||||</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '3px', color: '#1e293b' }}>4057598015370</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  บาร์โค้ด 1D (8 หรือ 13 หลัก) ด้านข้างหรือด้านหลังกล่อง
                </div>
              </div>

              {/* FDA Reg No Card */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#065f46', color: '#ffffff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                    FDA Reg. No.
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    เลขทะเบียน อย.
                  </span>
                </div>
                <div style={{
                  backgroundColor: '#ecfdf5',
                  color: '#064e3b',
                  border: '1px solid #a7f3d0',
                  padding: '16px',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#064e3b' }}>BLACKMORES</div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>EXEC B'S · 60 tablets</div>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#dc2626', marginTop: '8px' }}>
                    Reg.No. 2C 45/43
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  เช่น "Reg.No. 2C 45/43" — พิมพ์ในส่วนข้อกำหนด
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          {fdaLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#10b981', fontWeight: '600', fontSize: '15px' }}>
              ⏳ กำลังสืบค้นข้อมูลตรงจากเซิร์ฟเวอร์ อย. กระทรวงสาธารณสุข...
            </div>
          )}

          {fdaResults.length > 0 && !fdaLoading && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', marginBottom: '14px' }}>
                🏛️ พบข้อมูลจากฐานข้อมูล อย. ({fdaResults.length} รายการ):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {fdaResults.map((item, idx) => (
                  <div
                    key={`${item.newcode || 'fda'}-${idx}`}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {item.product_name_th !== '-' ? item.product_name_th : item.product_name_en}
                        </span>
                        {item.product_name_en && item.product_name_en !== '-' && item.product_name_th !== item.product_name_en && (
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>({item.product_name_en})</span>
                        )}
                        <span style={{
                          backgroundColor: item.status === 'คงอยู่' ? '#065f46' : '#7f1d1d',
                          color: item.status === 'คงอยู่' ? '#6ee7b7' : '#fca5a5',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 10px',
                          borderRadius: '12px'
                        }}>
                          {item.status === 'คงอยู่' ? '✓ คงอยู่' : `✕ ${item.status}`}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        เลขทะเบียน อย.: <strong style={{ color: '#ef4444' }}>{item.license_no}</strong> · หมวดประเภท: <span style={{ color: '#38bdf8' }}>{item.type}</span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ผู้รับอนุญาต/บริษัท: <span style={{ color: 'var(--text-primary)' }}>{item.company_name}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddFdaItem(item)}
                      disabled={formLoading}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: formLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + เพิ่มลงคลังสินค้า
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searched && fdaResults.length === 0 && !fdaLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              ไม่พบข้อมูลที่ตรงกับคำค้นหา "{searchQuery}" ในระบบ อย.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL FORM */}
      {activeTab === 'manual' && (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
            กรอกข้อมูลลงทะเบียนสินค้าเข้าคลังเอง
          </h2>

          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ชื่อการค้า (Trade Name)*</label>
                <input
                  type="text"
                  required
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="เช่น BENZAC AC 5%, SARA 500 MG..."
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ชื่อตัวยาสามัญ (Active Ingredient)</label>
                <input
                  type="text"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  placeholder="เช่น benzoyl peroxide, paracetamol..."
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ราคาขายหน้าร้าน (บาท)</label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: '#10b981', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>จำนวนสต็อกตั้งต้น</label>
                <input
                  type="number"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  placeholder="0"
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: '#38bdf8', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>เลขทะเบียน อย.</label>
                <input
                  type="text"
                  value={fdaRegNo}
                  onChange={(e) => setFdaRegNo(e.target.value)}
                  placeholder="เช่น 1A 848/65, G762/47"
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: '#ef4444', fontWeight: '700', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ประเภทกลุ่มยา</label>
                <select
                  value={drugType}
                  onChange={(e) => setDrugType(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                >
                  <option value="general">ทั่วไป (General)</option>
                  <option value="dangerous">ยาอันตราย (ข.ย. 11)</option>
                  <option value="special_controlled">ยาควบคุมพิเศษ (ข.ย. 10)</option>
                  <option value="household">ยาสามัญประจำบ้าน (HHR)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>ผู้ผลิต / แบรนด์</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="เช่น บริษัท ยาอินไทย จำกัด"
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>บาร์โค้ด</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="เช่น 8858821630354"
                  style={{ width: '100%', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: formLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {formLoading ? '⏳ กำลังบันทึก...' : '💾 บันทึกสินค้าเข้าคลัง'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
