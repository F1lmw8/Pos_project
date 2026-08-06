'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import ExcelImportModal from '../../../components/ExcelImportModal';
import { Download, Upload, Plus, Trash2, FileText, CheckCircle2, Barcode, Scan, Calculator } from 'lucide-react';
import { downloadStockTemplate } from '../../../utils/excelStockHelper';

export default function StockInPage() {
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Goods Receipt Header States
  const [supplierName, setSupplierName] = useState('บริษัท ยาอินไทย จำกัด');
  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState('');

  // Barcode Instant Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  // Drug Item Add Form States
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [selectedStockDrug, setSelectedStockDrug] = useState(null);
  const [lotNumber, setLotNumber] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockCost, setStockCost] = useState('');
  const [stockPrice, setStockPrice] = useState('');
  const [stockExpiry, setStockExpiry] = useState('');
  const [itemError, setItemError] = useState('');

  // Goods Receipt Cart / Items Table State
  const [receiptItems, setReceiptItems] = useState([]);

  // Financial & Tax States
  const [vatMode, setVatMode] = useState('included'); // 'included', 'excluded', 'none'
  const [discountInput, setDiscountInput] = useState('');

  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Auto generate Goods Receipt No and Date on load
  useEffect(() => {
    const now = new Date();
    const dStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    setReceiptNo(`GRN-${dStr}-${Math.floor(100 + Math.random() * 900)}`);
    setReceiptDate(now.toISOString().slice(0, 10));
    fetchInventoryAlerts();
  }, []);

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

  // Instant Barcode Scan Handler
  const handleBarcodeKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = barcodeInput.trim();
      if (!code) return;

      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(code)}`);
        const result = await response.json();
        if (result.success && result.data.length > 0) {
          const matchedDrug = result.data[0];
          selectSuggestion(matchedDrug);
          setScanSuccessMsg(`✓ สแกนบาร์โค้ดพบสินค้า: ${matchedDrug.trade_name}`);
          setBarcodeInput('');
          setTimeout(() => setScanSuccessMsg(''), 3500);
        } else {
          setItemError(`ไม่พบสินค้าสำหรับบาร์โค้ด / รหัส "${code}"`);
        }
      } catch (err) {
        console.error('Barcode scan error:', err);
      }
    }
  };

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
    const d = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    const t = [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join('');
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

  // Add Item to Receiving Receipt Cart
  const handleAddReceiptItem = (e) => {
    e.preventDefault();
    setItemError('');

    if (!selectedStockDrug) { setItemError('กรุณาเลือกตัวยาจากระบบหรือสแกนบาร์โค้ด'); return; }
    if (!lotNumber || !stockQty || !stockCost || !stockPrice || !stockExpiry) {
      setItemError('กรุณากรอกข้อมูล ล็อต, จำนวน, ต้นทุน, ราคาขาย และวันหมดอายุให้ครบถ้วน');
      return;
    }

    const qty = parseInt(stockQty, 10);
    const cost = parseFloat(stockCost);
    const price = parseFloat(stockPrice);

    if (qty <= 0 || cost < 0 || price < 0) {
      setItemError('จำนวนและราคาต้องเป็นตัวเลขที่ถูกต้อง');
      return;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      tmt_id: selectedStockDrug.tmt_id,
      trade_name: selectedStockDrug.trade_name,
      strength: selectedStockDrug.strength || '',
      unit: selectedStockDrug.unit || 'ชิ้น',
      lot_number: lotNumber,
      quantity: qty,
      cost_price: cost,
      price: price,
      expiry_date: stockExpiry,
      itemTotalCost: qty * cost
    };

    setReceiptItems(prev => [...prev, newItem]);

    // Reset item form
    setSelectedStockDrug(null);
    setStockSearchQuery('');
    setLotNumber('');
    setStockQty('');
    setStockCost('');
    setStockPrice('');
    setStockExpiry('');
  };

  const handleRemoveReceiptItem = (id) => {
    setReceiptItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate Financial Breakdown
  const financials = useMemo(() => {
    const rawSubtotal = receiptItems.reduce((acc, item) => acc + item.itemTotalCost, 0);
    const discount = Math.max(0, parseFloat(discountInput || 0));
    const discountedSubtotal = Math.max(0, rawSubtotal - discount);

    let preTaxValue = 0;
    let vatAmount = 0;
    let grandTotal = 0;

    if (vatMode === 'included') {
      preTaxValue = discountedSubtotal / 1.07;
      vatAmount = discountedSubtotal - preTaxValue;
      grandTotal = discountedSubtotal;
    } else if (vatMode === 'excluded') {
      preTaxValue = discountedSubtotal;
      vatAmount = discountedSubtotal * 0.07;
      grandTotal = discountedSubtotal + vatAmount;
    } else { // 'none'
      preTaxValue = discountedSubtotal;
      vatAmount = 0;
      grandTotal = discountedSubtotal;
    }

    return {
      subtotal: rawSubtotal,
      discount,
      discountedSubtotal,
      preTaxValue,
      vatAmount,
      grandTotal
    };
  }, [receiptItems, discountInput, vatMode]);

  // Handle Excel Import -> Load into Goods Receipt Document Form
  const handleLoadExcelToReceipt = (parsedData) => {
    const formatted = parsedData.map((item, idx) => ({
      id: Date.now() + idx + Math.random(),
      tmt_id: item.tmt_id || `EXCEL-${idx + 100}`,
      trade_name: item.trade_name || item.name || 'ไม่ระบุชื่อ',
      strength: item.strength || '',
      unit: item.unit || 'กล่อง',
      lot_number: item.lot_number || `LOT-EXCEL-${idx + 1}`,
      quantity: parseInt(item.quantity || 1, 10),
      cost_price: parseFloat(item.cost_price || (item.price ? item.price * 0.7 : 0)),
      price: parseFloat(item.price || 0),
      expiry_date: item.expiry_date || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      itemTotalCost: parseInt(item.quantity || 1, 10) * parseFloat(item.cost_price || (item.price ? item.price * 0.7 : 0))
    }));

    setReceiptItems(formatted);
    setFormSuccess(`✓ ดึงข้อมูลจาก Excel ${formatted.length} รายการ เข้าสู่ใบรับสินค้าสำเร็จ! สามารถเลือกภาษี (VAT) และส่วนลดท้ายบิลด้านล่าง ก่อนกดบันทึกเข้าสต็อก`);
  };

  // Submit Complete Goods Receipt
  const handleConfirmGoodsReceipt = async () => {
    setFormSuccess('');
    setFormError('');

    if (receiptItems.length === 0) {
      setFormError('กรุณาเพิ่มรายการยาลงในใบรับอย่างน้อย 1 รายการ');
      return;
    }

    setFormLoading(true);

    try {
      const itemsToImport = receiptItems.map(item => ({
        ...item,
        supplier_name: supplierName,
        receipt_no: receiptNo
      }));

      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToImport })
      });

      const json = await res.json();

      if (json.success) {
        setFormSuccess(`✓ บันทึกใบรับสินค้าเลขที่ ${receiptNo} สำเร็จเรียบร้อยแล้ว (${receiptItems.length} รายการ, ยอดรวม ฿${financials.grandTotal.toFixed(2)})`);
        setReceiptItems([]);
        setDiscountInput('');
        fetchInventoryAlerts();

        // Regenerate new Receipt No
        const now = new Date();
        const dStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
        setReceiptNo(`GRN-${dStr}-${Math.floor(100 + Math.random() * 900)}`);
      } else {
        setFormError(json.error || 'เกิดข้อผิดพลาดในการบันทึกใบรับสินค้า');
      }
    } catch (err) {
      console.error(err);
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setFormLoading(false);
    }
  };

  const alertStats = useMemo(() => {
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
          <h1 className="page-title">ใบรับสินค้าเข้าคลัง (Goods Receipt Note - GRN)</h1>
          <p className="page-subtitle">บันทึกล็อตยานำเข้า ต้นทุน วันหมดอายุ และบันทึกใบรับสินค้าพร้อมคำนวณภาษีและส่วนลดท้ายบิล</p>
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

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'start' }}>

        {/* ── LEFT: Goods Receiving Document Form & Table ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Receipt Header Document Box */}
          <div className="dash-card">
            <div className="dash-card-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="dash-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '16px' }}>เอกสารใบรับสินค้าเข้าคลัง</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>ดูแลสินค้าทุกชิ้นให้มีราคาถูกต้อง ติดตามได้ และพร้อมขาย</div>
                </div>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--teal-600)', fontFamily: 'monospace', backgroundColor: 'var(--teal-50)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--teal-100)' }}>
                {receiptNo}
              </span>
            </div>

            {/* Instant Barcode Scanner Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--teal-50)',
              border: '1.5px dashed var(--teal-600)',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Barcode size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--teal-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>สแกนบาร์โค้ดด่วน (Instant Barcode Scanner)</span>
                  <Scan size={14} color="var(--teal-600)" />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--teal-700)' }}>
                  ยิงบาร์โค้ด 1D/EAN ที่กล่องยาเพื่อเลือกสินค้าเข้าใบรับโดยอัตโนมัติ
                </div>
              </div>
              <input
                type="text"
                placeholder="ยิงบาร์โค้ดสแกนที่นี่..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                style={{
                  width: '210px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--teal-600)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            {scanSuccessMsg && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
                {scanSuccessMsg}
              </div>
            )}

            {/* Goods Receipt Meta Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>ผู้ส่งมอบ / ซัพพลายเออร์ (Supplier)</label>
                <input
                  type="text"
                  className="form-input"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="เช่น บริษัท ยาอินไทย จำกัด"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>วันที่รับสินค้า (Receipt Date)</label>
                <input
                  type="date"
                  className="form-input"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '16px 0' }} />

            {/* Drug Addition Form */}
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--teal-600)" /> เพิ่มรายการยาเข้าใบรับสินค้า:
            </div>

            <form onSubmit={handleAddReceiptItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Search Drug */}
              <div style={{ position: 'relative' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>ค้นหาเวชภัณฑ์ TMT / บาร์โค้ด</label>
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
                <div style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

              {itemError && <div className="error-banner">⚠ {itemError}</div>}

              <button type="submit" className="btn btn-outline" style={{ height: '42px', fontWeight: 700, borderColor: 'var(--teal-600)', color: 'var(--teal-600)' }}>
                + เพิ่มรายการยาลงในใบรับ
              </button>
            </form>
          </div>

          {/* Receiving Items Table Card */}
          <div className="dash-card" style={{ padding: '22px', borderRadius: '16px' }}>
            <div className="dash-card-title" style={{ marginBottom: '16px' }}>
              <div className="dash-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>📋</div>
              <span style={{ fontSize: '15px', fontWeight: 800 }}>รายการยาในใบรับสินค้า ({receiptItems.length} รายการ)</span>
            </div>

            {receiptItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '14px', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>ยังไม่มีรายการยาในใบรับสินค้า กรุณาค้นหา สแกนบาร์โค้ด หรือเพิ่มรายการยาด้านบน</div>
              </div>
            ) : (
              <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <table className="data-table" style={{ fontSize: '12.5px', margin: 0 }}>
                  <thead style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <tr>
                      <th style={{ padding: '12px' }}>#</th>
                      <th style={{ padding: '12px' }}>รายการยา</th>
                      <th style={{ padding: '12px' }}>เลขล็อต</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>จำนวน</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>ต้นทุน/หน่วย</th>
                      <th style={{ textAlign: 'right', padding: '12px' }}>รวมต้นทุน</th>
                      <th style={{ textAlign: 'center', padding: '12px' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.trade_name}</strong>
                          {item.strength && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{item.strength}</span>}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{item.lot_number}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                        <td style={{ textAlign: 'right' }}>฿{item.cost_price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--teal-600)' }}>฿{item.itemTotalCost.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveReceiptItem(item.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="ลบรายการนี้"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Financial Summary & Tax Breakdown Box */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '22px',
              marginTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Calculator size={18} color="var(--teal-600)" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  สรุปยอดรวมและภาษีมูลค่าเพิ่ม
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                ระบบคำนวณมูลค่าสินค้า ภาษี และยอดรวมสุทธิจากรายการโดยอัตโนมัติ คุณกรอกเฉพาะส่วนลดและเลือกว่าราคารวมภาษีหรือไม่
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                {/* VAT Mode Selector */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>ภาษีมูลค่าเพิ่ม (VAT)</label>
                  <select
                    value={vatMode}
                    onChange={(e) => setVatMode(e.target.value)}
                    className="form-input"
                    style={{ fontWeight: 600, borderRadius: '10px' }}
                  >
                    <option value="included">ราคารวมภาษีแล้ว (VAT Included)</option>
                    <option value="excluded">ราคาไม่รวมภาษี (VAT Excluded +7%)</option>
                    <option value="none">ไม่มีภาษี / ยกเว้น VAT (0%)</option>
                  </select>
                </div>

                {/* Discount Field */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>ส่วนลดท้ายบิล (บาท)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    min="0"
                    style={{ borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Financial Summary Breakdown List */}
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>มูลค่าสินค้า:</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: 'var(--text-primary)' }}>
                    ฿{financials.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                {financials.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', color: '#dc2626' }}>
                    <span>ส่วนลดท้ายบิล:</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '15px' }}>
                      -฿{financials.discount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ภาษีมูลค่าเพิ่ม (7%):</span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: 'var(--text-primary)' }}>
                    ฿{financials.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                {/* Grand Total Banner */}
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#065f46', whiteSpace: 'nowrap' }}>
                    จำนวนเงินรวมทั้งสิ้น:
                  </span>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: '#047857', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    ฿{financials.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {formError && <div className="error-banner" style={{ marginTop: '16px' }}>⚠️ {formError}</div>}
            {formSuccess && <div className="success-banner" style={{ marginTop: '16px' }}>✓ {formSuccess}</div>}

            {/* Confirm Goods Receipt Button */}
            <button
              type="button"
              onClick={handleConfirmGoodsReceipt}
              disabled={formLoading || receiptItems.length === 0}
              style={{
                width: '100%',
                height: '50px',
                marginTop: '18px',
                backgroundColor: formLoading || receiptItems.length === 0 ? 'var(--bg-muted)' : '#10b981',
                color: formLoading || receiptItems.length === 0 ? 'var(--text-muted)' : '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: formLoading || receiptItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: formLoading || receiptItems.length === 0 ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <CheckCircle2 size={18} />
              {formLoading ? 'กำลังบันทึกใบรับสินค้า...' : `ยืนยันบันทึกใบรับสินค้าเข้าคลัง (${receiptItems.length} รายการ)`}
            </button>
          </div>

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

            {/* Alert rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '260px', overflowY: 'auto' }}>
              {alertsLoading ? (
                <div className="loading-center" style={{ padding: '20px' }}>
                  <div className="spinner"></div>
                  <span>กำลังโหลด...</span>
                </div>
              ) : (
                <>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
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
        onLoadToReceipt={handleLoadExcelToReceipt}
      />
    </DashboardLayout>
  );
}
