'use client';

import React, { useState, useEffect } from 'react';

export default function AddProductModal({ isOpen, onClose, onSelectProduct }) {
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'name', 'photo'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [fdaResults, setFdaResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fdaLoading, setFdaLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setFdaResults([]);
      setSearched(false);
    }
  }, [isOpen]);

  // Live search in local database
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setFdaResults([]);
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

  // Function to query live FDA API directly
  const fetchLiveFdaData = async (queryToSearch) => {
    const q = (queryToSearch || searchQuery || '').trim();
    if (!q) return;

    setFdaLoading(true);
    setFdaResults([]);
    try {
      const res = await fetch(`/api/fda/lookup?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setFdaResults(json.data);
      } else {
        setFdaResults([]);
      }
    } catch (e) {
      console.error('FDA Lookup error:', e);
      setFdaResults([]);
    } finally {
      setFdaLoading(false);
      setSearched(true);
    }
  };

  // Convert FDA Item to POS product object and select it
  const handleSelectFdaItem = (fdaItem) => {
    const tradeName = fdaItem.product_name_th && fdaItem.product_name_th !== '-' 
      ? fdaItem.product_name_th 
      : (fdaItem.product_name_en || 'ยาทั่วไป');
      
    const activeIng = fdaItem.product_name_en && fdaItem.product_name_en !== '-'
      ? fdaItem.product_name_en 
      : tradeName;

    const formattedProduct = {
      tmt_id: fdaItem.newcode || `FDA-${(fdaItem.license_no || '').replace(/\s+/g, '')}`,
      trade_name: tradeName,
      active_ingredient: activeIng,
      fda_reg_no: fdaItem.license_no || '-',
      manufacturer: fdaItem.company_name || '-',
      drug_type: fdaItem.type || 'ผลิตภัณฑ์สุขภาพ',
      fda_status: fdaItem.status === 'คงอยู่' ? 'verified' : 'unverified',
      sku: `FDA-${(fdaItem.license_no || '').replace(/\s+/g, '')}`,
      price: 0,
      stock_qty: 0,
      detail_url: fdaItem.detail_url || ''
    };

    if (onSelectProduct) {
      onSelectProduct(formattedProduct);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '740px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>เพิ่มสินค้าใหม่ (สืบค้น อย.)</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
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
          backgroundColor: 'var(--bg-surface)',
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
            <span>[||||]</span> 1. ค้นหาด้วยรหัส
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

        {/* TAB 1: CODE SEARCH */}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchLiveFdaData(searchQuery);
                  }
                }}
                placeholder="EAN, FDA Reg.No, รหัส TPU..."
                style={{
                  width: '100%',
                  backgroundColor: '#09120f',
                  border: '1px solid #1d3b31',
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
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              ค้นหาอัตโนมัติเริ่มต้นหลังจาก 4 ตัวอักษร หรือกด Enter เพื่อค้นสดจาก อย.
            </div>

            {/* Sample Barcode & FDA Guide Box (When no search query is entered) */}
            {!searchQuery && (
              <div style={{
                backgroundColor: '#162620',
                border: '1px solid #234338',
                borderRadius: '14px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>
                  คุณสามารถระบุสินค้าด้วยรหัสที่พิมพ์อยู่บนกล่อง:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  {/* EAN Sample Card */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: '#1e3a8a', color: '#93c5fd', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        EAN-13 / EAN-8
                      </span>
                      <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>บาร์โค้ด EAN</span>
                    </div>

                    <div style={{
                      backgroundColor: '#fffbe8',
                      color: '#1e293b',
                      borderRadius: '10px',
                      padding: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>Adalat CR</div>
                        <div style={{ fontSize: '11px', color: '#475569' }}>30 mg · 30 tablets</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', letterSpacing: '-1px' }}>|||||||||||||</div>
                        <div style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: '700' }}>4057598015370</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      บาร์โค้ด 1D (8 หรือ 13 หลัก) ด้านข้างหรือด้านหลังกล่อง
                    </div>
                  </div>

                  {/* FDA Reg Sample Card */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: '#065f46', color: '#a7f3d0', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        FDA Reg. No.
                      </span>
                      <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600' }}>เลขทะเบียน อย.</span>
                    </div>

                    <div style={{
                      backgroundColor: '#e6f4ea',
                      color: '#1e293b',
                      borderRadius: '10px',
                      padding: '14px'
                    }}>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#064e3b' }}>BLACKMORES</div>
                      <div style={{ fontSize: '11px', color: '#047857' }}>EXEC B'S · 60 tablets</div>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#dc2626', marginTop: '4px' }}>Reg.No. 2C 45/43</div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      เช่น "Reg.No. 2C 45/43" — พิมพ์ในส่วนข้อกำหนด
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NAME SEARCH */}
        {activeTab === 'name' && (
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              ค้นหาด้วยชื่อยา / active ingredient
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchLiveFdaData(searchQuery);
                  }
                }}
                placeholder="พิมพ์ชื่อการค้า หรือ ชื่อตัวยาสามัญ (เช่น BURNY GEL, SARA, Paracetamol)..."
                style={{
                  flex: 1,
                  backgroundColor: '#09120f',
                  border: '1px solid #1d3b31',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => fetchLiveFdaData(searchQuery)}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0 16px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                🔍 ค้น อย. สด
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PHOTO SCAN */}
        {activeTab === 'photo' && (
          <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: '#162620', borderRadius: '14px', border: '1px solid #234338', marginBottom: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
            <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '8px' }}>สแกนจากกล้อง หรือ ถ่ายภาพฉลากยา</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', margin: '0 auto 20px' }}>
              ถ่ายภาพฉลากกล่องยาเพื่ออ่านบาร์โค้ดและเลขทะเบียน อย. โดยอัตโนมัติ
            </p>
            <button
              onClick={() => alert('ฟีเจอร์กล้องสแกนพร้อมใช้งานเมื่อเชื่อมต่อเว็บบอร์ดกล้อง')}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              เปิดกล้องสแกน
            </button>
          </div>
        )}

        {/* Loading State */}
        {(loading || fdaLoading) && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#10b981', fontWeight: '600', fontSize: '14px' }}>
            ⏳ กำลังสืบค้นข้อมูลจากฐานข้อมูล...
          </div>
        )}

        {/* Live FDA API Search Results */}
        {fdaResults.length > 0 && !fdaLoading && (
          <div style={{
            marginTop: '16px',
            backgroundColor: '#0a1914',
            border: '1px solid #1c4235',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏛️</span> พบข้อมูลจากระบบ อย. สด ({fdaResults.length} รายการ):
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>porta.fda.moph.go.th</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
              {fdaResults.map((fda, idx) => (
                <div
                  key={`${fda.newcode || 'fda'}-${idx}`}
                  style={{
                    backgroundColor: '#11261f',
                    border: '1px solid #1f4a3b',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '15px' }}>
                        {fda.product_name_th !== '-' ? fda.product_name_th : fda.product_name_en}
                      </span>
                      {fda.product_name_en && fda.product_name_en !== '-' && fda.product_name_th !== fda.product_name_en && (
                        <span style={{ fontSize: '12px', color: '#a7f3d0' }}>({fda.product_name_en})</span>
                      )}
                      <span style={{
                        backgroundColor: fda.status === 'คงอยู่' ? '#065f46' : '#7f1d1d',
                        color: fda.status === 'คงอยู่' ? '#6ee7b7' : '#fca5a5',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        {fda.status === 'คงอยู่' ? '✓ คงอยู่' : `✕ ${fda.status}`}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      เลขทะเบียน อย.: <strong style={{ color: '#ef4444' }}>{fda.license_no}</strong> · ประเภท: <span style={{ color: '#38bdf8' }}>{fda.type}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                      ผู้รับอนุญาต: <span style={{ color: '#cbd5e1' }}>{fda.company_name}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectFdaItem(fda)}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    เลือก
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Local Database Search Results List */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: '16px', maxHeight: '280px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
              พบรายการสินค้าในคลังร้าน ({searchResults.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((item, idx) => (
                <div
                  key={`${item.tmt_id || 'prod'}-${idx}`}
                  onClick={() => {
                    if (onSelectProduct) onSelectProduct(item);
                    onClose();
                  }}
                  style={{
                    backgroundColor: '#11261f',
                    border: '1px solid #1f4a3b',
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

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #1d3b31' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                fetchLiveFdaData(searchQuery);
              } else {
                alert('กรุณากรอกรหัสหรือชื่อยาเพื่อสืบค้น');
              }
            }}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            ค้นหาด้วยชื่อ ›
          </button>
        </div>
      </div>
    </div>
  );
}
