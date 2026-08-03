'use client';

import React, { useState, useEffect } from 'react';

export default function AddProductModal({ isOpen, onClose, onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'name', 'photo'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSearched(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < (activeTab === 'code' ? 4 : 2)) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.data || []);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

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
        backgroundColor: '#121e1a',
        color: '#e2e8f0',
        border: '1px solid #1e3a34',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>เพิ่มสินค้าใหม่</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          backgroundColor: '#0a1411',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid #1a2e28',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'code' ? '#10b981' : 'transparent',
              color: activeTab === 'code' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'code' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>🔍</span> 1. ค้นหาด้วยรหัส
          </button>
          <button
            onClick={() => setActiveTab('name')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'name' ? '#10b981' : 'transparent',
              color: activeTab === 'name' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'name' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>T</span> 2. ค้นหาด้วยชื่อ
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'photo' ? '#10b981' : 'transparent',
              color: activeTab === 'photo' ? '#ffffff' : '#94a3b8',
              fontWeight: activeTab === 'photo' ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span>📷</span> 3. เพิ่มจากภาพถ่าย
          </button>
        </div>

        {/* Tab 1: Code Search */}
        {activeTab === 'code' && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              ค้นหาด้วยรหัส
            </div>
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="EAN, FDA Reg.No, รหัส TPU, SKU..."
                style={{
                  width: '100%',
                  backgroundColor: '#0d1815',
                  border: '1px solid #1a3830',
                  borderRadius: '10px',
                  padding: '12px 16px 12px 42px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                🔍
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '20px' }}>
              ค้นหาอัตโนมัติเริ่มต้นหลังจาก 4 ตัวอักษร
            </div>

            {/* Live FDA API Lookup Test Banner */}
            <div style={{
              backgroundColor: '#052e16',
              border: '1px solid #15803d',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ fontSize: '12px', color: '#86efac' }}>
                🟢 <strong>เชื่อมต่อ live FDA API แล้ว:</strong> ค้นหาผู้ได้รับอนุญาตผลิตยา ผย1 / ผยบ จาก อย. กระทรวงสาธารณสุข
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch(`/api/fda/lookup?q=${encodeURIComponent(searchQuery || 'มิลลิเมด')}`);
                    const json = await res.json();
                    if (json.success && json.data.length > 0) {
                      alert(`พบข้อมูลจาก อย. (${json.data.length} รายการ):\n\n` + json.data.slice(0, 3).map(r => `• ${r.company_name}\n  เลขใบอนุญาต: ${r.license_no} (${r.type})\n  สถานะ: ${r.status}`).join('\n\n'));
                    } else {
                      alert('ไม่พบข้อมูลจาก FDA API');
                    }
                  } catch (e) {
                    alert('เกิดข้อผิดพลาดในการดึงข้อมูล อย.');
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🔍 ตรวจกับ อย. สด
              </button>
            </div>

            {/* Default Guidance Cards when no active search */}
            {!searched && !searchQuery && (
              <div style={{
                backgroundColor: '#091310',
                border: '1px solid #142923',
                borderRadius: '12px',
                padding: '18px'
              }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                  คุณสามารถระบุสินค้าด้วยรหัสที่พิมพ์อยู่บนกล่อง:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Yellow Barcode Example */}
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: '10px',
                    padding: '14px',
                    color: '#78350f'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ backgroundColor: '#2563eb', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        EAN-13 / EAN-8
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                        บาร์โค้ด EAN
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '2px' }}>
                      Adalat CR
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                      30 mg · 30 tablets
                    </div>

                    {/* SVG Mock Barcode */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '6px', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', gap: '2px', height: '32px', alignItems: 'center' }}>
                        {[2,1,3,1,2,1,4,1,2,3,1,2,1,3,2,1,2,1].map((w, idx) => (
                          <div key={idx} style={{ width: `${w}px`, height: '100%', backgroundColor: '#000000' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: '700', color: '#000000', marginTop: '2px' }}>
                        4057598015370
                      </div>
                    </div>
                  </div>

                  {/* Mint Green FDA Example */}
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '14px',
                    color: '#065f46'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ backgroundColor: '#10b981', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        FDA Reg. No.
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>
                        เลขทะเบียน อย.
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#065f46', marginBottom: '2px' }}>
                      BLACKMORES
                    </div>
                    <div style={{ fontSize: '11px', color: '#047857', marginBottom: '12px' }}>
                      EXEC B'S · 60 tablets
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626', marginTop: '16px' }}>
                      Reg.No. 2C 45/43
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '14px' }}>
                  เช่น "Reg.No. 2C 45/43" — พิมพ์ในส่วนข้อกำหนด
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Name Search */}
        {activeTab === 'name' && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              ค้นหาด้วยชื่อยา / active ingredient
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อการค้า หรือ ชื่อตัวยาสามัญ (ภาษาไทย/อังกฤษ)..."
              style={{
                width: '100%',
                backgroundColor: '#0d1815',
                border: '1px solid #1a3830',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />
          </div>
        )}

        {/* Tab 3: Photo Scan */}
        {activeTab === 'photo' && (
          <div style={{ textAlign: 'center', padding: '30px 16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '8px' }}>สแกนจากกล้อง หรือ ถ่ายภาพฉลากยา</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '380px', margin: '0 auto 20px' }}>
              ระบบสามารถอ่านบาร์โค้ดและเลขทะเบียน อย. จากภาพถ่ายฉลากกล่องยาได้โดยอัตโนมัติ
            </p>
            <button
              onClick={() => alert('ฟีเจอร์กล้องสแกนพร้อมใช้งานเมื่อเชื่อมต่อเว็บบอร์ดกล้อง')}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              เปิดกล้องสแกน
            </button>
          </div>
        )}

        {/* Search Results List */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            กำลังค้นหาข้อมูล...
          </div>
        )}

        {searched && searchResults.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            ไม่พบยาหรือสินค้าที่ตรงกับคำค้นหา "{searchQuery}"
          </div>
        )}

        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px', maxHeight: '280px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
              พบรายการสินค้า ({searchResults.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((item) => (
                <div
                  key={item.tmt_id}
                  onClick={() => {
                    if (onSelectProduct) onSelectProduct(item);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#0a1613',
                    border: '1px solid #162c26',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '14px' }}>
                      {item.trade_name} <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px' }}>{item.sku}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {item.active_ingredient} · {item.strength || '-'} · อย. <span style={{ color: '#ef4444', fontWeight: '600' }}>{item.fda_reg_no || '-'}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Barcode: {item.barcode || '-'} · TPU: {item.tmt_id}
                    </div>
                  </div>
                  <button style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    เลือก
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
