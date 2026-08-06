'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Upload, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { downloadStockTemplate, parseExcelFile } from '../utils/excelStockHelper';

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const rows = await parseExcelFile(selectedFile);
      if (rows.length === 0) {
        setErrorMsg('ไม่พบรายการข้อมูลยาในไฟล์ที่เลือก กรุณาตรวจสอบเทมเพลตไฟล์ Excel');
        setParsedData([]);
      } else {
        setParsedData(rows);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' + err.message);
      setParsedData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (parsedData.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedData })
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        setTimeout(() => {
          if (onImportSuccess) onImportSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(json.error || 'การนำเข้าข้อมูลล้มเหลว');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '18px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                นำเข้าข้อมูลคลังยาด้วยไฟล์ Excel (Stock Card Import)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                รองรับไฟล์ .xlsx / .xls ตามแบบฟอร์มมาตรฐานคลังยาโรงพยาบาลและคลินิก
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Download Template Banner */}
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '14px 18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                📥 ยังไม่มีไฟล์เทมเพลต Excel มาตรฐาน?
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                ดาวน์โหลดเทมเพลตแบบฟอร์ม Stock Card ที่ใส่สูตรคำนวณอัตโนมัติ (SUM, VLOOKUP, ED/N, DUE)
              </div>
            </div>
            <button
              type="button"
              onClick={downloadStockTemplate}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            >
              <Download size={14} /> โหลดเทมเพลต Excel
            </button>
          </div>

          {/* Upload Area */}
          <div style={{ border: '2px dashed var(--border)', borderRadius: '14px', padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              id="excel-file-input"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="excel-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} />
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--teal-600)' }}>
                  {file ? file.name : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx / .csv)'}
                </span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  ระบบจะอ่านข้อมูล ล็อตยา, ความแรง, บัญชียา ED/N, กลุ่มยา และราคาสต็อกให้อัตโนมัติ
                </div>
              </div>
            </label>
          </div>

          {errorMsg && (
            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} /> {successMsg}
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedData.length > 0 && (
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📋 ตรวจสอบรายการที่จะนำเข้า ({parsedData.length} รายการ):</span>
              </div>

              <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>รายการยาและเวชภัณฑ์</th>
                      <th>ความแรง</th>
                      <th>ED/N</th>
                      <th>ขนาดบรรจุ</th>
                      <th>รหัสล็อต</th>
                      <th style={{ textAlign: 'center' }}>จำนวนรับ</th>
                      <th style={{ textAlign: 'right' }}>ราคาขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.trade_name}</td>
                        <td>{row.strength || '-'}</td>
                        <td>
                          <span style={{ backgroundColor: row.ed_type === 'ED' ? '#ecfdf5' : '#f1f5f9', color: row.ed_type === 'ED' ? '#047857' : '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
                            {row.ed_type || 'ED'}
                          </span>
                        </td>
                        <td>{row.unit || 'กล่อง'}</td>
                        <td style={{ fontFamily: 'monospace' }}>{row.lot_number || '-'}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>฿{Number(row.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            ยกเลิก
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmImport}
            disabled={loading || parsedData.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? 'กำลังบันทึกข้อมูล...' : `🚀 ยืนยันการนำเข้า (${parsedData.length} รายการ)`}
          </button>
        </div>
      </div>
    </div>
  );
}
