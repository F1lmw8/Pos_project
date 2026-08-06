'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Landmark,
  ClipboardList,
  Users,
  Package,
  Sparkles,
  PackagePlus,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Store,
  Settings
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  {
    section: 'รายงาน',
    links: [
      { href: '/dashboard',                 label: 'ภาพรวม & สรุปยอด',      icon: LayoutDashboard },
      { href: '/dashboard/sales-logs',      label: 'ประวัติธุรกรรม',          icon: FileText },
      { href: '/dashboard/fda-tax-reports', label: 'รายงานสรรพากรและ อย.', icon: Landmark },
      { href: '/dashboard/gpp-reports',     label: 'รายงาน GPP (ข.ย.)',    icon: ClipboardList },
    ]
  },
  {
    section: 'ผู้ป่วย & สมาชิก',
    links: [
      { href: '/dashboard/customers', label: 'ทะเบียนผู้ป่วย & แพ้ยา', icon: Users },
    ]
  },
  {
    section: 'คลังสินค้า',
    links: [
      { href: '/dashboard/stock',       label: 'สินค้าคงเหลือ',       icon: Package },
      { href: '/dashboard/add-product', label: 'เพิ่มสินค้าใหม่ (อย.)', icon: Sparkles },
      { href: '/dashboard/stock-in',    label: 'นำเข้าล็อตยา',        icon: PackagePlus },
    ]
  },
  {
    section: 'ตั้งค่าระบบ',
    links: [
      { href: '/dashboard/settings',    label: 'ตั้งค่าร้านยา',       icon: Settings },
    ]
  }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pharmacy_sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('pharmacy_sidebar_collapsed', String(next));
  };

  return (
    <div className="dashboard-shell" style={{
      display: 'grid',
      gridTemplateColumns: isCollapsed ? '68px 1fr' : '220px 1fr',
      transition: 'grid-template-columns 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)'
    }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{
        backgroundColor: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden'
      }}>
        {/* Brand & Collapse Toggle Header */}
        <div style={{
          padding: isCollapsed ? '14px 6px' : '16px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: isCollapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: isCollapsed ? '8px' : '10px'
        }}>
          {!isCollapsed ? (
            <>
              <Link href="/" title="ไปที่หน้าขาย POS" style={{ textDecoration: 'none', color: 'inherit', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--teal-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.25)'
                }}>
                  <Store size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                    RDU Pharmacy
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                    Admin Portal
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleCollapse}
                title="ย่อเมนู (Collapse)"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '8px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/" title="RDU Pharmacy (ไปหน้า POS)" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--teal-600)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(13,148,136,0.25)'
                }}>
                  <Store size={22} />
                </div>
              </Link>
              <button
                type="button"
                onClick={toggleCollapse}
                title="ขยายเมนู (Expand)"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '6px',
                  width: '44px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{
          padding: isCollapsed ? '14px 6px' : '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isCollapsed ? 'center' : 'stretch',
          gap: isCollapsed ? '6px' : '2px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {navItems.map((group, groupIdx) => (
            <React.Fragment key={group.section}>
              {!isCollapsed ? (
                <span className="sidebar-section-label" style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.7px',
                  color: 'var(--text-muted)',
                  padding: '10px 8px 4px'
                }}>
                  {group.section}
                </span>
              ) : (
                groupIdx > 0 && <div style={{ width: '32px', height: '1px', backgroundColor: 'var(--border)', margin: '6px 0' }} />
              )}

              {group.links.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href;

                if (isCollapsed) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: isActive ? '#10b981' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        boxShadow: isActive ? '0 4px 12px rgba(16,185,129,0.3)' : 'none'
                      }}
                    >
                      <IconComponent size={20} />
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${isActive ? ' active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      color: isActive ? 'var(--teal-700)' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--teal-50)' : 'transparent',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: isActive ? '700' : '500',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <IconComponent size={18} />
                    <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: isCollapsed ? '12px 6px' : '16px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          {!isCollapsed ? (
            <>
              <ThemeToggle style={{ width: '100%', justifyContent: 'center' }} />
              <Link href="/" className="sidebar-link" style={{ justifyContent: 'center', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} />
                กลับหน้า POS
              </Link>
            </>
          ) : (
            <>
              <ThemeToggle style={{ padding: '6px', width: '38px', height: '38px', justifyContent: 'center', borderRadius: '10px' }} />
              <Link href="/" title="กลับหน้าขาย POS" style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none'
              }}>
                <ShoppingCart size={18} />
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-content" style={{ padding: '24px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
