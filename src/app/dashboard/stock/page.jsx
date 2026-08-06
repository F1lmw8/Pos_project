'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import AddProductModal from '../../../components/AddProductModal';
import ProductDetailModal from '../../../components/ProductDetailModal';
import { Trash2 } from 'lucide-react';

const modes = [
  { key: 'available', label: 'มีสินค้าพร้อมขาย' },
  { key: 'low',       label: 'ใกล้หมด' },
  { key: 'expiring',  label: 'ใกล้หมดอายุ' },
  { key: 'all',       label: 'ทั้งหมด' }
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH');
}

function getStockStatus(item) {
  if (item.sellable_quantity <= 0)
    return { label: 'ไม่มีล็อตพร้อมขาย', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (item.sellable_quantity <= item.reorder_point)
    return { label: 'ใกล้หมด', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  if (item.expiring_30_quantity > 0)
    return { label: 'ใกล้หมดอายุ 30 วัน', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' };
  if (item.expiring_90_quantity > 0)
    return { label: 'ใกล้หมดอายุ 90 วัน', color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' };
  return { label: 'พร้อมขาย', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
}

export default function StockMonitorPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [mode, setMode] = useState('available');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchStock = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ mode });
      if (query.trim()) params.set('q', query.trim());

      const response = await fetch(`/api/dashboard/inventory-stock?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'โหลดข้อมูลสต็อกไม่สำเร็จ');
      }

      setItems(result.data || []);
      setSummary(result.summary || null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'โหลดข้อมูลสต็อกไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  }, [mode, query]);

  useEffect(() => {
    const timer = setTimeout(fetchStock, 250);
    return () => clearTimeout(timer);
  }, [fetchStock]);

  const handleDeleteStockItem = async (item) => {
    if (!confirm(`คุณต้องการลบสินค้า "${item.trade_name}" ออกจากคลังใช่หรือไม่?`)) return;

    setLoading(true);
    setError('');
    try {
      const productId = item.tmt_id || item.sku;
      const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });

      const json = await res.json();
      if (json.success) {
        fetchStock();
      } else {
        setError(json.error || 'ลบสินค้าไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => summary || {
    item_count: 0, sellable_units: 0, low_stock_count: 0, expiring_90_units: 0
  }, [summary]);

  return (
    <DashboardLayout>
      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectProduct={async (product) => {
          try {
            const res = await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(product)
            });
            const json = await res.json();
            if (json.success && json.data) {
              setSelectedProduct(json.data);
            } else {
              setSelectedProduct(product);
            }
          } catch (e) {
            console.error(e);
            setSelectedProduct(product);
          } finally {
            fetchStock();
          }
        }}
      />

      <ProductDetailModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onUpdateSuccess={fetchStock}
      />

      {/* Page Header with Action Buttons matching CuraLink */}
      <div className="page-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">สินค้า (Products & Stock)</h1>
          <p className="page-subtitle">ดูแลสินค้าทุกชิ้นให้มีราคาถูกต้อง ติดตามได้ และพร้อมขาย</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'รายการที่แสดง',       value: totals.item_count,          color: 'var(--teal-600)', accent: 'var(--teal-50)' },
          { label: 'จำนวนพร้อมขายรวม',    value: totals.sellable_units,       color: '#0284c7',         accent: '#eff6ff' },
          { label: 'รายการใกล้หมด',       value: totals.low_stock_count,      color: '#d97706',         accent: '#fffbeb' },
          { label: 'ชิ้นใกล้หมดอายุ 90 วัน', value: totals.expiring_90_units, color: '#dc2626',         accent: '#fef2f2' }
        ].map((card) => (
          <div key={card.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', borderTop: `3px solid ${card.color}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value.toLocaleString('th-TH')}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="dash-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Mode tabs */}
          <div className="tab-group">
            {modes.map((item) => (
              <button
                key={item.key}
                className={`tab-btn${mode === item.key ? ' active' : ''}`}
                onClick={() => setMode(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Search bar matching CuraLink placeholder */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อ, SKU, บาร์โค้ด หรือ เลข อย..."
              className="form-input"
              style={{ width: '100%', paddingLeft: '34px' }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none' }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Stock Table matching reference table columns */}
      <div className="dash-card">
        {error && <div className="error-banner" style={{ marginBottom: 14 }}>⚠ {error}</div>}

        {loading ? (
          <div className="loading-center" style={{ padding: '40px' }}>
            <div className="spinner"></div>
            <span>กำลังโหลดข้อมูลสินค้าและสต็อก...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th>SKU / บาร์โค้ด</th>
                  <th>หมวดหมู่</th>
                  <th className="td-right">ราคา</th>
                  <th className="td-right">สต็อก</th>
                  <th>เลข อย.</th>
                  <th className="td-center">สถานะ</th>
                  <th className="td-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.tmt_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct(item)}>
                      <td>
                        <div className="td-bold">{item.trade_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                          {item.active_ingredient || '-'} · {item.strength || '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--teal-600)', fontFamily: 'monospace' }}>
                          {item.sku || 'P-001'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                          {item.barcode || '4057598015370'}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {item.dosage_form || 'ยา'}
                        </span>
                      </td>
                      <td className="td-right" style={{ fontWeight: 700 }}>
                        ฿{Number(item.price || 0).toFixed(2)}
                      </td>
                      <td className="td-right" style={{ fontWeight: 700, color: item.sellable_quantity > 0 ? 'var(--teal-600)' : '#dc2626' }}>
                        {item.sellable_quantity.toLocaleString('th-TH')} {item.unit}
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
                          {item.fda_reg_no || '-'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {item.fda_status === 'verified' ? '✓ ตรวจสอบแล้ว' : 'ⓘ ไม่ได้กำหนด'}
                        </div>
                      </td>
                      <td className="td-center">
                        <span style={{
                          display: 'inline-block',
                          background: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                          borderRadius: 'var(--radius-full)',
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap'
                        }}>
                          {status.label}
                        </span>
                      </td>
                      <td className="td-center" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedProduct(item)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            รายละเอียด
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStockItem(item);
                            }}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="ลบสินค้าออกจากคลัง"
                          >
                            <Trash2 size={13} /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state" style={{ padding: '36px' }}>
                        <div className="empty-icon">📦</div>
                        <div>ไม่พบสินค้าตามเงื่อนไขนี้</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
