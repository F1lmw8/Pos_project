'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Settings, Store, ShieldCheck, UserCheck, MapPin, Phone, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('ร้านยารู้เรื่องยา RDU');
  const [branchName, setBranchName] = useState('สาขาหลัก Pharmacy');
  const [licenseNo, setLicenseNo] = useState('กท. 12345/2569');
  const [pharmacistName, setPharmacistName] = useState('ภก. สมชาย มีสุข (ภ. 12345)');
  const [address, setAddress] = useState('123 ม.6 ต.หนองหาร อ.สันทราย จ.เชียงใหม่ 50290');
  const [phone, setPhone] = useState('053-123456');

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pharmacy_store_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.branchName) setBranchName(parsed.branchName);
        if (parsed.licenseNo) setLicenseNo(parsed.licenseNo);
        if (parsed.pharmacistName) setPharmacistName(parsed.pharmacistName);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.phone) setPhone(parsed.phone);
      } catch (e) {
        console.error('Failed to load store settings:', e);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      storeName,
      branchName,
      licenseNo,
      pharmacistName,
      address,
      phone
    };

    localStorage.setItem('pharmacy_store_settings', JSON.stringify(updated));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div className="stock-header" style={{ marginBottom: '8px' }}>
          <div>
            <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={26} style={{ color: 'var(--teal-600)' }} /> ตั้งค่าข้อมูลร้านยา & ใบอนุญาต GPP
            </h1>
            <p className="dashboard-subtitle" style={{ marginTop: '4px' }}>
              จัดการข้อมูลสถานประกอบการ เลขที่ใบอนุญาต และชื่อเภสัชกรผู้มีหน้าที่ปฏิบัติการสำหรับออกรายงาน อย.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div style={{
            backgroundColor: '#064e3b',
            color: '#6ee7b7',
            border: '1px solid #047857',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={18} /> บันทึกข้อมูลการตั้งค่าร้านยาเรียบร้อยแล้ว!
          </div>
        )}

        {/* Main Form Sheet */}
        <form onSubmit={handleSave} style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={18} style={{ color: 'var(--teal-600)' }} /> ข้อมูลสถานประกอบการ (ร้านขายยา)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                ชื่อสถานประกอบการ (ร้านยา):
              </label>
              <input
                type="text"
                className="search-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="เช่น ร้านยารู้เรื่องยา RDU"
                required
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                ชื่อสาขา:
              </label>
              <input
                type="text"
                className="search-input"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="เช่น สาขาหลัก Pharmacy"
                required
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--teal-600)' }} /> ใบอนุญาต & ข้อมูลเภสัชกร (สำหรับรายงาน GPP/อย.)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                เลขที่ใบอนุญาตขายยาแผนปัจจุบัน:
              </label>
              <input
                type="text"
                className="search-input"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                placeholder="เช่น กท. 12345/2569"
                required
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                ชื่อเภสัชกรผู้มีหน้าที่ปฏิบัติการ:
              </label>
              <input
                type="text"
                className="search-input"
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                placeholder="เช่น ภก. สมชาย มีสุข (ภ. 12345)"
                required
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>
          </div>

          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} style={{ color: 'var(--teal-600)' }} /> สถานที่ตั้ง & ข้อมูลติดต่อ
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                ที่อยู่อาคาร / สถานที่ตั้งร้าน:
              </label>
              <input
                type="text"
                className="search-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ระบุที่อยู่..."
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                เบอร์โทรศัพท์:
              </label>
              <input
                type="text"
                className="search-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="053-123456"
                style={{ height: '42px', padding: '0 14px' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '13.5px', fontWeight: 700 }}
            >
              <Save size={16} /> บันทึกข้อมูลตั้งค่าร้านยา
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
