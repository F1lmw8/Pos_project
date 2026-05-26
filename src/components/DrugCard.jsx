'use client';

import React from 'react';
import { getDosageIcon } from '../utils/rduMatcher';

import Link from 'next/link';

export default function DrugCard({ drug }) {
  const getDosageInfo = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('tablet') || cat.includes('capsule')) return { label: 'ยาเม็ด', theme: 'teal', icon: <path d="M10 2 2 10l12 12 8-8L10 2ZM10 10l4 4"/> };
    if (cat.includes('injection')) return { label: 'ยาฉีด', theme: 'red', icon: <path d="m18 2 4 4-2 2-4-4 2-2ZM14 10l-4-4-6 6v4h4l6-6Z"/> };
    if (cat.includes('suspension') || cat.includes('syrup') || cat.includes('solution') || cat.includes('liquid')) return { label: 'ยาน้ำ', theme: 'purple', icon: <path d="M8 2v4M16 2v4M12 20a4 4 0 0 0 4-4V8H8v8a4 4 0 0 0 4 4Z"/> };
    if (cat.includes('cream') || cat.includes('ointment')) return { label: 'ยาทา', theme: 'orange', icon: <><circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 0 0 8 0"/></> };
    return { label: 'ยา', theme: 'teal', icon: <rect x="2" y="7" width="20" height="10" rx="5" ry="5"></rect> };
  };

  const dosageInfo = getDosageInfo(drug.d);

  return (
    <Link 
      href={`/drug/${drug.c}`}
      className="drug-card"
      style={{ textDecoration: 'none' }}
    >
      {/* Top Row */}
      <div className="drug-card-header-row">
        <span className="drug-tmt-id">TMT {drug.c}</span>
        <span className={`drug-form-badge badge-theme-${dosageInfo.theme}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {dosageInfo.icon}
          </svg>
          {dosageInfo.label}
        </span>
      </div>
      
      {/* Middle Row */}
      <div className="drug-card-body">
        <h3 className="drug-trade-name">{drug.t}</h3>
        <p className="drug-generic-name">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="generic-icon"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
          {drug.a}
        </p>
        <div className="drug-badge-list">
          {drug.d && <span className={`badge badge-form badge-theme-${dosageInfo.theme}`}>{drug.d}</span>}
          {drug.s && <span className="badge badge-strength-gray">{drug.s}</span>}
        </div>
      </div>
      
      {/* Footer Row */}
      <div className="drug-card-footer">
        <span className="drug-unit-footer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          {drug.d?.includes('tablet') || drug.d?.includes('capsule') ? 'tablet/capsule' : (drug.u || 'pack')}
        </span>
        <span className="view-detail-link">ดูข้อมูล →</span>
      </div>
    </Link>
  );
}
