'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMeds, setCurrentMeds] = useState('');

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCustomers(val);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล ผู้ป่วย');
      return;
    }
    setError('');

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          id_card: idCard.trim(),
          medical_conditions: medicalConditions.trim(),
          allergies: allergies.trim(),
          current_medications: currentMeds.trim()
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setName('');
        setPhone('');
        setIdCard('');
        setMedicalConditions('');
        setAllergies('');
        setCurrentMeds('');
        fetchCustomers(search);
      } else {
        setError(json.error || 'ไม่สามารถลงทะเบียนผู้ป่วยได้');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        {/* Page Header */}
        <div className="stock-header">
          <div>
            <h1 className="dashboard-title">👥 ทะเบียนผู้ป่วย & ประวัติแพ้ยา</h1>
            <p className="dashboard-subtitle">
              จัดการข้อมูลผู้ป่วย โรคประจำตัว ยาที่ใช้ปัจจุบัน และสกัดกั้นประวัติแพ้ยา
            </p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>+ ลงทะเบียนผู้ป่วยใหม่</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-bar-row" style={{ marginTop: '16px', marginBottom: '20px' }}>
          <div className="search-container" style={{ maxWidth: '480px' }}>
            <span className="search-icon">⌕</span>
            <input
              type="text"
              className="search-input"
              placeholder="พิมพ์ค้นหาชื่อ หรือ เบอร์โทร (เช่น ลุงเค / 0819998877)..."
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button className="clear-search-btn" onClick={() => { setSearch(''); fetchCustomers(''); }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Patients Grid / Table */}
        {loading ? (
          <div className="loading-center" style={{ padding: '60px 0' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <span>กำลังโหลดรายชื่อผู้ป่วย...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-icon">👤</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              ไม่พบรายชื่อผู้ป่วยที่ค้นหา
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              ลองค้นหาด้วยชื่ออื่น หรือกดปุ่มลงทะเบียนผู้ป่วยใหม่
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>ชื่อ-นามสกุล ผู้ป่วย</th>
                  <th>เบอร์โทรศัพท์</th>
                  <th>โรคประจำตัว</th>
                  <th>ยาที่ใช้ปัจจุบัน</th>
                  <th>ประวัติการแพ้ยา</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust, idx) => (
                  <tr key={cust.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cust.name}</div>
                      {cust.id_card && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          ID: {cust.id_card}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                        {cust.phone || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {cust.medical_conditions || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--blue-600)', fontWeight: 500 }}>
                        {cust.current_medications || '-'}
                      </span>
                    </td>
                    <td>
                      {cust.allergies && cust.allergies.length > 0 ? (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            fontWeight: 700,
                            fontSize: '11px',
                            border: '1px solid #fecaca'
                          }}
                        >
                          ⚠️ {cust.allergies.join(', ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ไม่มี</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link
                        href={`/?customer_id=${cust.id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                      >
                        ไปหน้าขาย POS 🛒
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Window to Add New Patient */}
        {showModal && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-box" style={{ maxWidth: '520px' }}>
              <div className="modal-header">
                <div className="modal-icon">👤</div>
                <div className="modal-title">ลงทะเบียนผู้ป่วย / สมาชิกใหม่</div>
                <div className="modal-subtitle">บันทึกประวัติสุขภาพและสกัดกั้นการแพ้ยา</div>
              </div>

              <form onSubmit={handleCreateCustomer}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {error && (
                    <div className="error-banner" style={{ margin: 0 }}>
                      ⚠ {error}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      ชื่อ-นามสกุล <span style={{ color: 'var(--color-danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="cash-input"
                      style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                      placeholder="เช่น ลุงเค (เค รุ่งเรือง)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="text"
                        className="cash-input"
                        style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                        placeholder="เช่น 0819998877"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        เลขบัตรประชาชน / Passport
                      </label>
                      <input
                        type="text"
                        className="cash-input"
                        style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                        placeholder="13 หลัก..."
                        value={idCard}
                        onChange={(e) => setIdCard(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      โรคประจำตัว
                    </label>
                    <input
                      type="text"
                      className="cash-input"
                      style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                      placeholder="เช่น เบาหวาน, ความดันโลหิตสูง..."
                      value={medicalConditions}
                      onChange={(e) => setMedicalConditions(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#dc2626' }}>
                      ⚠️ ประวัติการแพ้ยา (คั่นด้วยจุลภาค)
                    </label>
                    <input
                      type="text"
                      className="cash-input"
                      style={{ fontSize: '13px', padding: '8px 12px', height: '38px', borderColor: '#fca5a5' }}
                      placeholder="เช่น Penicillin, Sulfa, Amoxicillin..."
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#2563eb' }}>
                      💊 ยาที่ใช้ปัจจุบัน
                    </label>
                    <input
                      type="text"
                      className="cash-input"
                      style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                      placeholder="เช่น Metformin 500mg, Amlodipine 5mg..."
                      value={currentMeds}
                      onChange={(e) => setCurrentMeds(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary">
                    บันทึกข้อมูลผู้ป่วย
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
