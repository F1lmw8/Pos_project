'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import drugData from '../../../data/drugs.json';
import { getRduDetails } from '../../../utils/rduMatcher';
import drugImages from '../../../data/drugImages.json';

export default function DrugDetailPage({ params }) {
  // Extract id from params. Using React.use() is required in Next 15 if params is a Promise, 
  // but if this is a standard client component we can unwrap params if needed. 
  // In Next 15, page params are promises.
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  
  const drug = useMemo(() => {
    return drugData.find(d => d.c === id);
  }, [id]);

  const selectedRdu = useMemo(() => {
    if (!drug) return null;
    return getRduDetails(drug);
  }, [drug]);

  // Match the active ingredient to our image database
  let drugImage = null;
  if (drug && drug.a) {
    const genericNameLower = drug.a.split('+')[0].trim().toLowerCase();
    for (const [key, url] of Object.entries(drugImages)) {
      if (genericNameLower.includes(key)) {
        drugImage = url;
        break;
      }
    }
  }

  const [copied, setCopied] = useState(false);
  const [fdaCopied, setFdaCopied] = useState(false);
  const [searchSource, setSearchSource] = useState('');

  if (!drug || !selectedRdu) {
    return notFound();
  }

  const handleCopy = () => {
    const textToCopy = `[ข้อมูลยา RDU]\nชื่อยา: ${drug.t}\nสามัญ: ${drug.a}\nข้อบ่งใช้: ${selectedRdu.indications}\nวิธีใช้: ${selectedRdu.instructions}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExternalSearch = (e, url, sourceName) => {
    e.preventDefault();
    const searchKeyword = drug.t;
    
    // Open new tab immediately to bypass popup blockers
    const newWindow = window.open('about:blank', '_blank');
    
    const performSearch = () => {
      let finalUrl = url;
      if (sourceName === 'ม.อุบล') {
        const encoded = encodeURIComponent(searchKeyword);
        finalUrl = `${url}?keyword=${encoded}&search=${encoded}&q=${encoded}&name=${encoded}&trade_name=${encoded}&tradename=${encoded}`;
      }
      if (newWindow) {
        newWindow.location.href = finalUrl;
      }
      setSearchSource(sourceName);
      setFdaCopied(true);
      setTimeout(() => setFdaCopied(false), 4000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(searchKeyword)
        .then(performSearch)
        .catch(() => {
          // Fallback copy method
          const textArea = document.createElement("textarea");
          textArea.value = searchKeyword;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (err) {}
          document.body.removeChild(textArea);
          performSearch();
        });
    } else {
      // Fallback copy method
      const textArea = document.createElement("textarea");
      textArea.value = searchKeyword;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {}
      document.body.removeChild(textArea);
      performSearch();
    }
  };

  return (
    <div className="drug-page-wrapper">
      {fdaCopied && (
        <div className="fda-copied-toast" style={{ background: '#78350f', borderLeft: '4px solid #f59e0b' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>คัดลอกชื่อยา <strong>"{drug.t}"</strong> แล้ว! คลิกขวาที่ช่องค้นหาแล้วกด <strong>"วาง" (Ctrl+V)</strong> ได้เลย</span>
        </div>
      )}
      <div className="drug-page-container">
        {/* A. Breadcrumbs */}
        <nav className="drug-breadcrumb">
          <Link href="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            กลับไปหน้าค้นหา
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{drug.t}</span>
        </nav>

        {/* B. Header Section */}
        <header className="drug-header" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {drugImage && (
            <img 
              src={drugImage} 
              alt={drug.a} 
              style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white' }} 
            />
          )}
          <div>
            <div className="drug-id">TMT ID: {drug.c}</div>
            <h1 className="drug-title" style={{ marginTop: '8px' }}>{drug.t}</h1>
            <div className="drug-subtitle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drug-icon"><path d="M10.5 20.5 19 12a4.95 4.95 0 1 0-7-7L3.5 13.5a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
              {drug.a} {drug.s ? `(${drug.s})` : ''}
            </div>
          </div>
        </header>

        {/* Alert Banner for Cancelled Drugs */}
        {drug.cancelled && (
          <div className="drug-alert-banner" style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span><strong>แจ้งเตือน (อย.):</strong> ตำรับยานี้ถูกยกเลิก/เพิกถอนแล้ว {drug.cancelDate ? `(เมื่อ ${drug.cancelDate})` : ''}</span>
          </div>
        )}

        {/* C. Alert Banner */}
        {selectedRdu.isFallback && (
          <div className="drug-alert-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            <span><strong>ข้อควรระวัง:</strong> ข้อมูลนี้เป็นข้อมูลแนะนำทั่วไป โปรดปรึกษาแพทย์หรือเภสัชกรก่อนใช้งาน</span>
          </div>
        )}

        {/* D. Main Content Grid */}
        <div className="drug-main-grid">
          {/* Left Column: Data */}
          <div className="drug-content-column">
            
            <div className="drug-info-list">
              <div className="drug-info-item">
                <span className="info-label">ชื่อภาษาไทย</span>
                <span className="info-value">{selectedRdu.thaiGeneric}</span>
              </div>
              <div className="drug-info-item">
                <span className="info-label">รูปแบบยา</span>
                <span className="info-value">{selectedRdu.category}</span>
              </div>
              <div className="drug-info-item">
                <span className="info-label">หน่วยจ่าย</span>
                <span className="info-value">{drug.u || '-'}</span>
              </div>
            </div>

            <hr className="drug-divider" />

            <div className="drug-detail-section">
              <h3 className="section-heading">ข้อบ่งใช้ (Indications)</h3>
              <p className="section-body">{selectedRdu.indications}</p>
            </div>

            <div className="drug-detail-section">
              <h3 className="section-heading">คำแนะนำในการใช้ยา</h3>
              <p className="section-body" style={{ whiteSpace: 'pre-line' }}>{selectedRdu.instructions}</p>
            </div>

            <div className="drug-detail-section">
              <h3 className="section-heading">อาการไม่พึงประสงค์</h3>
              <p className="section-body">{selectedRdu.adverseEffects}</p>
            </div>

            <div className="drug-detail-section">
              <h3 className="section-heading text-danger">ข้อห้ามใช้ (Contraindications)</h3>
              <p className="section-body">{selectedRdu.contraindications}</p>
            </div>

            <div className="drug-detail-section">
              <h3 className="section-heading">การเก็บรักษา</h3>
              <p className="section-body">{selectedRdu.storage}</p>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="drug-actions-column">
            <div className="actions-panel">
              <h3 className="actions-title">เครื่องมือจัดการ</h3>
              
              <button className="action-btn-primary" onClick={handleCopy}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                {copied ? 'คัดลอกสำเร็จแล้ว' : 'คัดลอกวิธีใช้ยา'}
              </button>

              <a 
                href="https://drugiden2.ubu.ac.th/iden-tradename"
                onClick={(e) => handleExternalSearch(e, 'https://drugiden2.ubu.ac.th/iden-tradename', 'ม.อุบล')}
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn-tmt"
                style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}
                title="สืบค้นข้อมูลแยกแยะเม็ดยาจากคณะเภสัชศาสตร์ มหาวิทยาลัยอุบลราชธานี"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                แยกแยะเม็ดยา (ม.อุบล)
              </a>

              <button className="action-btn-secondary" onClick={() => window.print()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/><path d="M6 9V2h12v7"/></svg>
                พิมพ์ฉลาก / PDF
              </button>

              <div className="actions-help-text">
                ข้อมูลอ้างอิง TMT มาตรฐานประเทศไทย สำหรับใช้ตรวจสอบและบันทึกประวัติการรักษาผู้ป่วย
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
