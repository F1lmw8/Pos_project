'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    section: 'รายงาน',
    links: [
      { href: '/dashboard',                 label: 'ภาพรวม & สรุปยอด',      icon: '◎' },
      { href: '/dashboard/sales-logs',      label: 'ประวัติธุรกรรม',          icon: '≡' },
      { href: '/dashboard/fda-tax-reports', label: 'รายงานสรรพากรและ อย.', icon: '🏛' },
      { href: '/dashboard/gpp-reports',     label: 'รายงาน GPP (ข.ย.)',    icon: '📋' },
    ]
  },
  {
    section: 'ผู้ป่วย & สมาชิก',
    links: [
      { href: '/dashboard/customers', label: 'ทะเบียนผู้ป่วย & แพ้ยา', icon: '👤' },
    ]
  },
  {
    section: 'คลังสินค้า',
    links: [
      { href: '/dashboard/stock',    label: 'สินค้าคงเหลือ',   icon: '⊡' },
      { href: '/dashboard/stock-in', label: 'นำเข้าล็อตยา',    icon: '+' },
    ]
  }
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">💊</div>
          <div>
            <div className="sidebar-brand-name">Pharmacy POS</div>
            <div className="sidebar-brand-sub">ระบบจัดการคลังยา</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((group) => (
            <React.Fragment key={group.section}>
              <span className="sidebar-section-label">{group.section}</span>
              {group.links.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${isActive ? ' active' : ''}`}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link href="/" className="sidebar-link">
            <span className="sidebar-link-icon">←</span>
            กลับหน้า POS
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
