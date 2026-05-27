'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StockInPage() {
  const [loading, setLoading] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Stock-in Form states
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [selectedStockDrug, setSelectedStockDrug] = useState(null);
  const [lotNumber, setLotNumber] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockCost, setStockCost] = useState('');
  const [stockPrice, setStockPrice] = useState('');
  const [stockExpiry, setStockExpiry] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch inventory alerts and stock-in history
  const fetchInventoryAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetch('/api/dashboard/inventory-alerts');
      const result = await response.json();
      if (result.success) {
        setInventoryAlerts(result.data);
      } else {
        console.error('Alerts API error:', result.error);
      }
    } catch (error) {
      console.error('Failed to load inventory alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  // Handle drug search suggestion for Stock-in form
  const handleStockSearchChange = async (val) => {
    setStockSearchQuery(val);
    if (val.length < 2) {
      setStockSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(val)}`);
      const result = await response.json();
      if (result.success) {
        setStockSuggestions(result.data.slice(0, 5)); // Limit to top 5 suggestions
      }
    } catch (error) {
      console.error('Failed to search stock drugs:', error);
    }
  };

  const generateLotNumber = (drug) => {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('');
    const timePart = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0')
    ].join('');

    return `LOT-${datePart}-${drug.tmt_id}-${timePart}`;
  };

  const selectSuggestion = (drug) => {
    setSelectedStockDrug(drug);
    setStockSearchQuery(`${drug.trade_name} (TMT-${drug.tmt_id})`);
    setLotNumber(generateLotNumber(drug));
    setStockPrice(drug.price && Number(drug.price) > 0 ? Number(drug.price).toFixed(2) : '');
    setStockSuggestions([]);
  };

  const handleStockCostChange = (value) => {
    setStockCost(value);

    if (!stockPrice && value !== '') {
      const cost = Number(value);
      if (Number.isFinite(cost) && cost >= 0) {
        setStockPrice((cost * 1.3).toFixed(2));
      }
    }
  };

  // Process incoming stock lot submission
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!selectedStockDrug) {
      setFormError('กรุณาค้นหาและเลือกตัวยาที่ต้องการนำเข้าจากระบบ');
      return;
    }
    if (!lotNumber || !stockQty || !stockCost || !stockPrice || !stockExpiry) {
      setFormError('กรุณากรอกข้อมูลนำเข้าล็อตยาให้ครบถ้วนทุกช่อง');
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch('/api/dashboard/inventory-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_id: selectedStockDrug.tmt_id,
          lot_number: lotNumber,
          quantity: parseInt(stockQty, 10),
          cost_price: parseFloat(stockCost),
          selling_price: parseFloat(stockPrice),
          expiry_date: stockExpiry
        })
      });

      const result = await response.json();
      if (result.success) {
        setFormSuccess(result.message);
        // Clear input form
        setSelectedStockDrug(null);
        setStockSearchQuery('');
        setLotNumber('');
        setStockQty('');
        setStockCost('');
        setStockPrice('');
        setStockExpiry('');
        
        // Refresh alerts and stock history sidebar
        fetchInventoryAlerts();
      } else {
        setFormError(result.error || 'เกิดข้อผิดพลาดในการนำเข้าล็อตยา');
      }
    } catch (error) {
      console.error('Stock-in submission failed:', error);
      setFormError('เกิดข้อผิดพลาดในการส่งข้อมูลไปยังระบบสารสนเทศคลังยา');
    } finally {
      setFormLoading(false);
    }
  };

  // Extract alerts stats
  const alertStats = React.useMemo(() => {
    if (!inventoryAlerts) return { lowStockCount: 0, expiringCount: 0 };
    const lowStockCount = inventoryAlerts.low_stock_alerts?.length || 0;
    const expiry = inventoryAlerts.expiry_alerts;
    const expiringCount = 
      (expiry?.expiring_30_days?.length || 0) + 
      (expiry?.expiring_60_days?.length || 0) + 
      (expiry?.expiring_90_days?.length || 0);
    return { lowStockCount, expiringCount };
  }, [inventoryAlerts]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
            ➕ นำเข้าสต็อกยาและคุมล็อตวันหมดอายุ <span className="brand-badge">Inventory Stock-In</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            บันทึกการเติมสต็อกยาประจำคลังยาแยกประเภทย่อยตามล็อตผลิต ต้นทุนนำเข้า และวันหมดอายุ (FEFO) หน้าร้าน
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', background: '#ffffff', color: '#0d9488', border: '1px solid #0d9488', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}>
            🛒 เข้าสู่จุดขาย POS
          </Link>
        </div>
      </header>

      {/* Modular Dashboard Top Navigation Tab Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>
        <Link 
          href="/dashboard" 
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          📊 สรุปวิเคราะห์ยอดขาย
        </Link>
        <Link 
          href="/dashboard/sales-logs" 
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          📜 ประวัติธุรกรรมการขาย
        </Link>
        <Link 
          href="/dashboard/stock" 
          style={{ textDecoration: 'none', background: '#ffffff', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0d9488'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748b'; }}
        >
          📦 สินค้าคงเหลือ
        </Link>
        <Link 
          href="/dashboard/stock-in" 
          style={{ textDecoration: 'none', background: '#0d9488', color: '#ffffff', border: '1px solid #0d9488', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
        >
          ➕ นำเข้าสต็อกคลังยา
        </Link>
      </div>

      {/* Two Column Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Search & Stock-In Form Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ➕ บันทึกนำเข้าล็อตยาคลังย่อย (Stock-In Lot Registry)
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
            ป้อนชุดข้อมูลล็อตยาและราคาต้นทุนเพื่อตรวจสอบวันหมดอายุอัติโนมัติเมื่อคีย์ขายยาที่หน้าเคาน์เตอร์ POS
          </p>

          <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search Suggestion Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                🔍 ค้นหาเวชภัณฑ์ TMT:
              </label>
              <input
                type="text"
                placeholder="พิมพ์ชื่อยา หรือรหัสยาสามัญ 2 ตัวอักษรขึ้นไป..."
                value={stockSearchQuery}
                onChange={(e) => handleStockSearchChange(e.target.value)}
                style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s ease' }}
                onFocus={(e) => e.target.style.borderColor = '#0d9488'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
              
              {stockSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', marginTop: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '220px', overflowY: 'auto' }}>
                  {stockSuggestions.map((drug) => (
                    <div
                      key={drug.tmt_id}
                      onClick={() => selectSuggestion(drug)}
                      style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong style={{ color: 'var(--color-primary)' }}>{drug.trade_name}</strong> {drug.strength} 
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>(TMT-{drug.tmt_id})</span>
                      {drug.price && Number(drug.price) > 0 && (
                        <span style={{ fontSize: '11px', color: '#0d9488', marginLeft: '8px', fontWeight: 'bold' }}>ขาย ฿{Number(drug.price).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lot number and Quantity row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  🔢 หมายเลขล็อต (Lot Number):
                </label>
                <input
                  type="text"
                  placeholder="เช่น LOT-MAY-01"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  📦 จำนวนนำเข้า ({selectedStockDrug ? selectedStockDrug.unit || 'ชิ้น' : 'ชิ้น'}):
                </label>
                <input
                  type="number"
                  placeholder="ตัวเลขจำนวนเต็มบวก"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none' }}
                  min="1"
                />
              </div>
            </div>

            {/* Cost price, selling price, and Expiry date row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  💰 ราคาต้นทุนนำเข้าต่อชิ้น (฿):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="เช่น 15.50"
                  value={stockCost}
                  onChange={(e) => handleStockCostChange(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none' }}
                  min="0"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  ราคาขายหน้าร้านต่อชิ้น (฿):
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="เช่น 20.00"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none' }}
                  min="0"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  📅 วันหมดอายุ (Expiry Date):
                </label>
                <input
                  type="date"
                  value={stockExpiry}
                  onChange={(e) => setStockExpiry(e.target.value)}
                  style={{ width: '100%', height: '42px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '14px', outline: 'none', color: '#0f172a', fontWeight: '600' }}
                />
              </div>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                ⚠️ {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                ✅ {formSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              style={{ width: '100%', height: '48px', border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)', marginTop: '8px' }}
            >
              {formLoading ? 'กำลังบันทึกนำเข้าคลังยา...' : '💾 ยืนยันบันทึกนำเข้าและสะสมคลัง'}
            </button>
          </form>
        </div>

        {/* Right Column: Alerts and Stock-In logs Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Smart Inventory Alerts Panel */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ การจัดการระบบคลังยาอัจฉริยะ (FEFO & สต็อก)
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                สถิติเชิงลึกแจ้งเตือนตัวยามีแนวโน้มที่จะหมดอายุและระดับของสต็อกต่ำกว่าจุดวิกฤต
              </p>
            </div>

            {/* Quick summary badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📦</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase' }}>สต็อกยาต่ำวิกฤต</div>
                  <div style={{ fontSize: '20px', fontWeight: '850', color: '#ef4444' }}>{alertStats.lowStockCount} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>รายการ</span></div>
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⏳</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', textTransform: 'uppercase' }}>ยาหมดอายุใน 90 วัน</div>
                  <div style={{ fontSize: '20px', fontWeight: '850', color: '#d97706' }}>{alertStats.expiringCount} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#64748b' }}>ล็อต</span></div>
                </div>
              </div>
            </div>

            {/* Scrollable list of alerts */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', background: '#fafbfd' }}>
              {alertsLoading ? (
                <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>กำลังดึงข้อมูลคลังยา...</p>
              ) : (
                <>
                  {inventoryAlerts?.expiry_alerts?.expiring_30_days?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', marginBottom: '6px' }}>🔴 วันหมดอายุวิกฤต (&lt; 30 วัน)</h4>
                      {inventoryAlerts.expiry_alerts.expiring_30_days.map((lot, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: '#fff', padding: '6px 10px', border: '1px solid #fee2e2', borderRadius: '6px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{lot.trade_name} <span style={{ fontSize: '8px', color: '#94a3b8' }}>({lot.lot_number})</span></span>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>อีก {lot.days_until_expiry} วัน!</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {inventoryAlerts?.expiry_alerts?.expiring_60_days?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '6px' }}>🟠 แจ้งเตือนวันหมดอายุ (&lt; 60 วัน)</h4>
                      {inventoryAlerts.expiry_alerts.expiring_60_days.map((lot, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: '#fff', padding: '6px 10px', border: '1px solid #fef3c7', borderRadius: '6px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{lot.trade_name} <span style={{ fontSize: '8px', color: '#94a3b8' }}>({lot.lot_number})</span></span>
                          <span style={{ color: '#d97706', fontWeight: 'bold' }}>อีก {lot.days_until_expiry} วัน</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {inventoryAlerts?.low_stock_alerts?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#0284c7', fontWeight: 'bold', marginBottom: '6px' }}>📦 สต็อกตำกว่าจุดจำหน่าย (Low Stock)</h4>
                      {inventoryAlerts.low_stock_alerts.map((drug, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: '#fff', padding: '6px 10px', border: '1px solid #e0f2fe', borderRadius: '6px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold' }}>{drug.trade_name}</span>
                          <span style={{ color: '#0369a1', fontWeight: 'bold' }}>เหลือ {drug.current_stock} {drug.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {alertStats.lowStockCount === 0 && alertStats.expiringCount === 0 && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', padding: '16px 0' }}>
                      🟢 คลังยาสมบูรณ์แบบ สต็อกมั่นคงดีเยี่ยม
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card 2: Stock-In History Log */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 ประวัติบันทึกการรับยาล็อตล่าสุด (Stock-In History)
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                รายงานล็อตยาล่าสุดที่ผู้จัดการดำเนินการนำเข้าสะสมเรียบร้อยแล้ว
              </p>
            </div>

            <div style={{ flex: 1, maxHeight: '260px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', background: '#fafbfd' }}>
              {alertsLoading ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>กำลังดึงสถิตินำเข้าคลัง...</p>
              ) : inventoryAlerts?.stock_in_history?.length > 0 ? (
                inventoryAlerts.stock_in_history.map((lot, idx) => {
                  const receivedDate = new Date(lot.received_at).toLocaleDateString('th-TH');
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#fff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ color: '#1e293b' }}>{lot.trade_name}</strong>
                        <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{lot.lot_number}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>TMT-{lot.drug_id} | {lot.strength}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #f1f5f9', paddingTop: '4px', marginTop: '2px', fontSize: '11px' }}>
                        <span>จำนวน: <strong style={{ color: '#0d9488' }}>+{lot.quantity} {lot.unit}</strong></span>
                        <span>ราคาทุน: <strong>฿{lot.cost_price.toFixed(2)}</strong></span>
                        <span style={{ color: '#94a3b8' }}>รับ: {receivedDate}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ textAlign: 'center', padding: '24px 0', fontSize: '12px', color: '#94a3b8' }}>ยังไม่มีประวัติการนำเข้าล็อตยาเข้าคลังใหม่</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
