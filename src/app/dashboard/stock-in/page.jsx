'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ExcelImportModal from '../../../components/ExcelImportModal';
import { Download, Upload } from 'lucide-react';
import { downloadStockTemplate } from '../../../utils/excelStockHelper';

export default function StockInPage() {
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
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
      }
    } catch (error) {
      console.error('Failed to load inventory alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAlerts();
  }, []);

  // Drug search suggestion
  const handleStockSearchChange = async (val) => {
    setStockSearchQuery(val);
    if (val.length < 2) { setStockSuggestions([]); return; }
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(val)}`);
      const result = await response.json();
      if (result.success) setStockSuggestions(result.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to search stock drugs:', error);
    }
  };

  const generateLotNumber = (drug) => {
    const now = new Date();
    const d = [now.getFullYear(), String(now.getMonth()+1).padStart(2,'0'), String(now.getDate()).padStart(2,'0')].join('');
    const t = [String(now.getHours()).padStart(2,'0'), String(now.getMinutes()).padStart(2,'0')].join('');
    return `LOT-${d}-${drug.tmt_id}-${t}`;
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
      if (Number.isFinite(cost) && cost >= 0) setStockPrice((cost * 1.3).toFixed(2));
    }
  };

  // Submit stock-in
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setFormSuccess('');
    setFormError('');

    if (!selectedStockDrug) { setFormError('กรุณาค้นหาและเลือกตัวยาที่ต้องการนำเข้าจากระบบ'); return; }
    if (!lotNumber || !stockQty || !stockCost || !stockPrice || !stockExpiry) {
      setFormError('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return;
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
        setSelectedStockDrug(null); setStockSearchQuery(''); setLotNumber('');
        setStockQty(''); setStockCost(''); setStockPrice(''); setStockExpiry('');
        fetchInventoryAlerts();
      } else {
        setFormError(result.error || 'เกิดข้อผิดพลาดในการนำเข้าล็อตยา');
      }
    } catch (error) {
      setFormError('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setFormLoading(false);
    }
  };

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
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">นำเข้าล็อตยา (Stock-In)</h1>
          <p className="page-subtitle">บันทึกล็อตยานำเข้า ต้นทุน และวันหมดอายุสำหรับระบบ FEFO หรือนำเข้าเป็น Batch ผ่าน Excel</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={downloadStockTemplate}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="ดาวน์โหลดเทมเพลต Excel"
          >
            <Download size={15} /> เทมเพลต Excel
          </button>
          <button
            type="button"
            onClick={() => setIsExcelImportOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Upload size={15} /> นำเข้าล็อตยาจาก Excel
          </button>
        </div>
      </div>

      {/* Two Column Grid — equal width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── LEFT: Stock-In Form ── */}
        <div className="dash-card">
          <div className="dash-card-title">
            <div className="dash-card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>+</div>
            บันทึกนำเข้าล็อตยาใหม่
          </div>

          <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Drug Search */}
            <div style={{ position: 'relative' }}>
              <label className="form-label">ค้นหาเวชภัณฑ์ TMT</label>
              <input
                type="text"
                className="form-input"
                placeholder="พิมพ์ชื่อยา หรือรหัส TMT 2 ตัวขึ้นไป..."
                value={stockSearchQuery}
                onChange={(e) => handleStockSearchChange(e.target.value)}
              />
              {stockSuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {stockSuggestions.map((drug) => (
                    <div key={drug.tmt_id} className="autocomplete-item" onClick={() => selectSuggestion(drug)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{drug.trade_name}</strong>
                          {drug.strength && <span style={{ color: 'var(--text-secondary)', marginLeft: 5, fontSize: '11px' }}>{drug.strength}</span>}
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '10px' }}>TMT-{drug.tmt_id}</span>
                        </div>
                        {drug.price && Number(drug.price) > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--teal-600)', fontWeight: 600, flexShrink: 0 }}>฿{Number(drug.price).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected drug chip */}
            {selectedStockDrug && (
              <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--teal-700)' }}>{selectedStockDrug.trade_name}</strong>
                  {selectedStockDrug.strength && <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '11px' }}>{selectedStockDrug.strength}</span>}
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: '10px' }}>TMT-{selectedStockDrug.tmt_id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedStockDrug(null); setStockSearchQuery(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}
                >×</button>
              </div>
            )}

            {/* Lot + Qty */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">หมายเลขล็อต (Lot No.)</label>
                <input type="text" className="form-input" placeholder="เช่น LOT-20250528-001" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
              </div>
              <div>
                <label className="form-label">จำนวนรับเข้า ({selectedStockDrug?.unit || 'ชิ้น'})</label>
                <input type="number" className="form-input" placeholder="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} min="1" />
              </div>
            </div>

            {/* Cost + Price + Expiry */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div>
                <label className="form-label">ต้นทุน/ชิ้น (฿)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={stockCost} onChange={(e) => handleStockCostChange(e.target.value)} min="0" />
              </div>
              <div>
                <label className="form-label">ราคาขาย (฿)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={stockPrice} onChange={(e) => setStockPrice(e.target.value)} min="0" />
              </div>
              <div>
                <label className="form-label">วันหมดอายุ</label>
                <input type="date" className="form-input" value={stockExpiry} onChange={(e) => setStockExpiry(e.target.value)} />
              </div>
            </div>

            {formError && <div className="error-banner">⚠ {formError}</div>}
            {formSuccess && <div className="success-banner">✓ {formSuccess}</div>}

            <button type="submit" className="checkout-submit-btn" disabled={formLoading} style={{ height: '46px', marginTop: '4px' }}>
              {formLoading ? 'กำลังบันทึก...' : 'ยืนยันบันทึกนำเข้าล็อตยา'}
            </button>
          </form>
        </div>

        {/* ── RIGHT: Alerts + History ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Inventory Alert Panel */}
          <div className="dash-card">
            <div className="dash-card-title">
              <div className="dash-card-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠</div>
              แจ้งเตือนคลังยา (FEFO)
            </div>

            {/* Summary counters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>สต็อกต่ำกว่าจุดสั่ง</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>{alertStats.lowStockCount}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 3 }}>รายการ</div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>หมดอายุใน 90 วัน</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{alertStats.expiringCount}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 3 }}>ล็อต</div>
              </div>
            </div>

            {/* Alert rows — color-coded by severity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '260px', overflowY: 'auto' }}>
              {alertsLoading ? (
                <div className="loading-center" style={{ padding: '20px' }}>
                  <div className="spinner"></div>
                  <span>กำลังโหลด...</span>
                </div>
              ) : (
                <>
                  {/* 🔴 Critical: < 30 days */}
                  {inventoryAlerts?.expiry_alerts?.expiring_30_days?.map((lot, idx) => (
                    <div key={`e30-${idx}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.trade_name}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>Lot: {lot.lot_number}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                        <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '14px' }}>{lot.days_until_expiry} วัน</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#dc2626' }}>🔴 วิกฤต</div>
                      </div>
                    </div>
                  ))}

                  {/* 🟠 Warning: < 60 days */}
                  {inventoryAlerts?.expiry_alerts?.expiring_60_days?.map((lot, idx) => (
                    <div key={`e60-${idx}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.trade_name}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>Lot: {lot.lot_number}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                        <div style={{ fontWeight: 800, color: '#d97706', fontSize: '14px' }}>{lot.days_until_expiry} วัน</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#d97706' }}>🟠 แจ้งเตือน</div>
                      </div>
                    </div>
                  ))}

                  {/* 🟡 Caution: < 90 days */}
                  {inventoryAlerts?.expiry_alerts?.expiring_90_days?.map((lot, idx) => (
                    <div key={`e90-${idx}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: '#fefce8', border: '1px solid #fef08a', borderLeft: '4px solid #eab308'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.trade_name}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>Lot: {lot.lot_number}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                        <div style={{ fontWeight: 800, color: '#ca8a04', fontSize: '14px' }}>{lot.days_until_expiry} วัน</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#ca8a04' }}>🟡 ติดตาม</div>
                      </div>
                    </div>
                  ))}

                  {/* 🔵 Low stock */}
                  {inventoryAlerts?.low_stock_alerts?.map((drug, idx) => (
                    <div key={`ls-${idx}`} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #3b82f6'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drug.trade_name}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>สั่งเมื่อเหลือ &lt; {drug.reorder_point} {drug.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
                        <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '14px' }}>{drug.current_stock} {drug.unit}</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#3b82f6' }}>🔵 สต็อกต่ำ</div>
                      </div>
                    </div>
                  ))}

                  {alertStats.lowStockCount === 0 && alertStats.expiringCount === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-success)', fontSize: '13px', fontWeight: 500 }}>
                      ✓ คลังยาสมบูรณ์ ไม่มีการแจ้งเตือน
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stock-In History */}
          <div className="dash-card">
            <div className="dash-card-title">
              <div className="dash-card-icon" style={{ background: '#f8fafc', color: 'var(--text-secondary)' }}>≡</div>
              ประวัตินำเข้าล็อตล่าสุด
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {alertsLoading ? (
                <div className="loading-center"><div className="spinner"></div></div>
              ) : inventoryAlerts?.stock_in_history?.length > 0 ? (
                inventoryAlerts.stock_in_history.map((lot, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-muted)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                      <strong style={{ fontSize: '12px', color: 'var(--text-primary)', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.trade_name}</strong>
                      <span className="badge badge-gray" style={{ fontSize: '10px', fontFamily: 'monospace', flexShrink: 0 }}>{lot.lot_number}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--teal-600)', fontWeight: 600 }}>+{lot.quantity} {lot.unit}</span>
                      <span>ต้นทุน ฿{lot.cost_price.toFixed(2)}/ชิ้น</span>
                      <span>{new Date(lot.received_at).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: '28px' }}>
                  <div style={{ fontSize: '11px' }}>ยังไม่มีประวัตินำเข้า</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        onImportSuccess={fetchInventoryAlerts}
      />
    </DashboardLayout>
  );
}
