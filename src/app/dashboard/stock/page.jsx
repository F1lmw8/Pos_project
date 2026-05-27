'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const modes = [
  { key: 'available', label: 'มีสินค้าพร้อมขาย' },
  { key: 'low', label: 'ใกล้หมด' },
  { key: 'expiring', label: 'ใกล้หมดอายุ' },
  { key: 'all', label: 'ทั้งหมด' }
];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH');
}

function getStockStatus(item) {
  if (item.sellable_quantity <= 0) return { label: 'ไม่มีล็อตพร้อมขาย', color: '#dc2626', bg: '#fef2f2' };
  if (item.sellable_quantity <= item.reorder_point) return { label: 'ใกล้หมด', color: '#d97706', bg: '#fffbeb' };
  if (item.expiring_30_quantity > 0) return { label: 'ใกล้หมดอายุ 30 วัน', color: '#c2410c', bg: '#fff7ed' };
  if (item.expiring_90_quantity > 0) return { label: 'มีล็อตใกล้หมดอายุ', color: '#0284c7', bg: '#eff6ff' };
  return { label: 'พร้อมขาย', color: '#059669', bg: '#ecfdf5' };
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
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mode, query]);

  const totals = useMemo(() => summary || {
    item_count: 0,
    sellable_units: 0,
    low_stock_count: 0,
    expiring_90_units: 0
  }, [summary]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', padding: '24px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '12px' }}>
            📦 สินค้าคงเหลือ <span className="brand-badge">Stock Monitor</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            ตรวจดูรายการที่ยังมีล็อตพร้อมขายตาม FEFO แยกจำนวนคงเหลือ วันหมดอายุ และสถานะใกล้สั่งเพิ่ม
          </p>
        </div>
        <Link href="/" style={{ textDecoration: 'none', background: '#ffffff', color: '#0d9488', border: '1px solid #0d9488', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
          🛒 เข้า POS
        </Link>
      </header>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { href: '/dashboard', label: '📊 สรุปยอดขาย' },
          { href: '/dashboard/sales-logs', label: '📜 ประวัติการขาย' },
          { href: '/dashboard/stock', label: '📦 สินค้าคงเหลือ', active: true },
          { href: '/dashboard/stock-in', label: '➕ นำเข้าสต็อก' }
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              textDecoration: 'none',
              background: link.active ? '#0d9488' : '#ffffff',
              color: link.active ? '#ffffff' : '#64748b',
              border: link.active ? '1px solid #0d9488' : '1px solid #e2e8f0',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'รายการที่แสดง', value: totals.item_count, color: '#0d9488' },
          { label: 'จำนวนพร้อมขายรวม', value: totals.sellable_units, color: '#0284c7' },
          { label: 'รายการใกล้หมด', value: totals.low_stock_count, color: '#d97706' },
          { label: 'ชิ้นใกล้หมดอายุ 90 วัน', value: totals.expiring_90_units, color: '#c2410c' }
        ].map((card) => (
          <div key={card.label} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>{card.label}</div>
            <div style={{ fontSize: '26px', color: card.color, fontWeight: 850, marginTop: '6px' }}>{card.value.toLocaleString('th-TH')}</div>
          </div>
        ))}
      </section>

      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
            {modes.map((item) => (
              <button
                key={item.key}
                onClick={() => setMode(item.key)}
                style={{ border: 'none', background: mode === item.key ? '#ffffff' : 'transparent', color: mode === item.key ? '#0d9488' : '#64748b', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', boxShadow: mode === item.key ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none' }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อยา / active ingredient / TMT"
            style={{ width: 'min(420px, 100%)', height: '40px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0 14px', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </section>

      <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>กำลังโหลดข้อมูลสต็อก...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                  <th style={{ padding: '12px 10px' }}>สินค้า</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>พร้อมขาย</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Stock ระบบ</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>ล็อต</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>หมดอายุใกล้สุด</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>ใกล้หมดอายุ</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.tmt_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <strong style={{ color: '#0f172a' }}>{item.trade_name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          TMT-{item.tmt_id} · {item.strength || '-'} · {item.active_ingredient || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 850, color: item.sellable_quantity > 0 ? '#0d9488' : '#dc2626' }}>
                        {item.sellable_quantity.toLocaleString('th-TH')} {item.unit}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#475569' }}>{item.system_stock.toLocaleString('th-TH')}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', color: '#475569' }}>{item.lot_count}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center', color: '#475569' }}>{formatDate(item.nearest_expiry_date)}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: item.expiring_90_quantity > 0 ? '#c2410c' : '#64748b', fontWeight: item.expiring_90_quantity > 0 ? 800 : 500 }}>
                        {item.expiring_90_quantity.toLocaleString('th-TH')}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', background: status.bg, color: status.color, border: `1px solid ${status.color}22`, borderRadius: '999px', padding: '5px 10px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>ไม่พบสินค้าตามเงื่อนไขนี้</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
