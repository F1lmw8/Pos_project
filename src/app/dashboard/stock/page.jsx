'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

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

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStock() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ mode });
        if (query.trim()) params.set('q', query.trim());

        const response = await fetch(`/api/dashboard/inventory-stock?${params.toString()}`, {
          signal: controller.signal
        });
        const responseText = await response.text();
        let result;

        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(response.ok ? 'API ส่งข้อมูลกลับมาไม่ถูกต้อง' : responseText || 'โหลดข้อมูลสต็อกไม่สำเร็จ');
        }

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'โหลดข้อมูลสต็อกไม่สำเร็จ');
        }

        setItems(result.data);
        setSummary(result.summary);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'โหลดข้อมูลสต็อกไม่สำเร็จ');
        }
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchStock, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [mode, query]);

  const totals = useMemo(() => summary || {
    item_count: 0, sellable_units: 0, low_stock_count: 0, expiring_90_units: 0
  }, [summary]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title">สินค้าคงเหลือ (Stock Monitor)</h1>
          <p className="page-subtitle">ตรวจดูรายการที่ยังมีล็อตพร้อมขายตาม FEFO แยกจำนวน วันหมดอายุ และสถานะสต็อก</p>
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
          <div key={card.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', borderTop: `3px solid ${card.color}` }}>
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

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อยา / active ingredient / TMT"
              className="form-input"
              style={{ width: '280px', paddingLeft: '32px' }}
            />
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none' }}>🔍</span>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="dash-card">
        {error && <div className="error-banner" style={{ marginBottom: 14 }}>⚠ {error}</div>}

        {loading ? (
          <div className="loading-center" style={{ padding: '40px' }}>
            <div className="spinner"></div>
            <span>กำลังโหลดข้อมูลสต็อก...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>สินค้า</th>
                  <th className="td-right">พร้อมขาย</th>
                  <th className="td-right">Stock ระบบ</th>
                  <th className="td-center">ล็อต</th>
                  <th className="td-center">หมดอายุใกล้สุด</th>
                  <th className="td-right">ใกล้หมดอายุ</th>
                  <th className="td-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.tmt_id}>
                      <td>
                        <div className="td-bold">{item.trade_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                          TMT-{item.tmt_id} · {item.strength || '-'} · <em>{item.active_ingredient || '-'}</em>
                        </div>
                      </td>
                      <td className="td-right" style={{ fontWeight: 700, color: item.sellable_quantity > 0 ? 'var(--teal-600)' : '#dc2626' }}>
                        {item.sellable_quantity.toLocaleString('th-TH')} {item.unit}
                      </td>
                      <td className="td-right" style={{ color: 'var(--text-secondary)' }}>
                        {item.system_stock.toLocaleString('th-TH')}
                      </td>
                      <td className="td-center" style={{ color: 'var(--text-secondary)' }}>
                        {item.lot_count}
                      </td>
                      <td className="td-center" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatDate(item.nearest_expiry_date)}
                      </td>
                      <td className="td-right" style={{
                        fontWeight: item.expiring_90_quantity > 0 ? 700 : 400,
                        color: item.expiring_90_quantity > 0 ? '#c2410c' : 'var(--text-muted)'
                      }}>
                        {item.expiring_90_quantity > 0 ? item.expiring_90_quantity.toLocaleString('th-TH') : '-'}
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
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7">
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
