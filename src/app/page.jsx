'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createPromptPayQrService, isQrPaymentMethod } from '../utils/paymentQr';
import ReceiptModal from '../components/ReceiptModal';
import ControlledDrugModal from '../components/ControlledDrugModal';
import PatientHistoryModal from '../components/PatientHistoryModal';
import ThemeToggle from '../components/ThemeToggle';
import { getStoreSettings } from '../utils/storeSettings';
import {
  Store,
  Users,
  ClipboardList,
  LayoutDashboard,
  Search,
  UserPlus,
  Banknote,
  QrCode,
  CreditCard,
  History,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';

const PROMPTPAY_ID = '0989342456';

export default function PosRegisterPage() {
  // Application State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [dispensingReason, setDispensingReason] = useState('บรรเทาปวด/มีไข้');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Patient History Modal State
  const [showPatientHistoryModal, setShowPatientHistoryModal] = useState(false);
  const [historyCustomerId, setHistoryCustomerId] = useState(null);
  const [historyCustomerName, setHistoryCustomerName] = useState('');

  // Customer & Patient Profile State
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [allergyAlert, setAllergyAlert] = useState(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Registration Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustIdCard, setNewCustIdCard] = useState('');
  const [newCustConditions, setNewCustConditions] = useState('');
  const [newCustAllergies, setNewCustAllergies] = useState('');
  const [newCustCurrentMeds, setNewCustCurrentMeds] = useState('');
  const [newCustAge, setNewCustAge] = useState('');
  const [newCustGender, setNewCustGender] = useState('');
  const [newCustWeight, setNewCustWeight] = useState('');
  const [newCustHeight, setNewCustHeight] = useState('');

  // Controlled Drug Modal State (GPP Compliance)
  const [showControlledModal, setShowControlledModal] = useState(false);
  const [controlledItemsToLog, setControlledItemsToLog] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);

  // Receipt Modal State
  const [receipt, setReceipt] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promptPayQr, setPromptPayQr] = useState('');

  // Fetch products from PostgreSQL based on search query
  const fetchProducts = async (query = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      } else {
        setErrorMsg('ไม่สามารถดึงข้อมูลรายการยาได้');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers from PostgreSQL based on search query (name/phone)
  const fetchCustomers = async (query = '') => {
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const [storeSettings, setStoreSettings] = useState(() => getStoreSettings());

  useEffect(() => {
    setStoreSettings(getStoreSettings());
    fetchProducts();
    fetchCustomers();
  }, []);

  // Handle Customer Search
  const handleCustomerSearchChange = (e) => {
    const val = e.target.value;
    setCustomerSearch(val);
    fetchCustomers(val);
  };

  // Handle Register New Customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim(),
          id_card: newCustIdCard.trim(),
          age: newCustAge ? parseInt(newCustAge, 10) : null,
          gender: newCustGender,
          weight: newCustWeight ? parseFloat(newCustWeight) : null,
          height: newCustHeight ? parseFloat(newCustHeight) : null,
          medical_conditions: newCustConditions.trim(),
          allergies: newCustAllergies.trim(),
          current_medications: newCustCurrentMeds.trim()
        })
      });
      const json = await res.json();
      if (json.success) {
        setCustomers((prev) => [json.data, ...prev]);
        setSelectedCustomer(json.data);
        setShowAddCustomerModal(false);
        setNewCustName('');
        setNewCustPhone('');
        setNewCustIdCard('');
        setNewCustAge('');
        setNewCustGender('');
        setNewCustWeight('');
        setNewCustHeight('');
        setNewCustConditions('');
        setNewCustAllergies('');
        setNewCustCurrentMeds('');
      }
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  // Handle Search Input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchProducts(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchProducts('');
  };

  // Filter products based on selected UI Category
  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'ALL') return products;

    return products.filter((p) => {
      if (!p.dosage_form) return false;
      const form = p.dosage_form.toLowerCase();

      const isTablet = form.includes('tablet') || form.includes('pill');
      const isCapsule = form.includes('capsule') || form.includes('cap');
      const isCream =
        form.includes('cream') ||
        form.includes('ointment') ||
        form.includes('gel') ||
        form.includes('lotion');
      const isInjection =
        form.includes('inject') ||
        form.includes('infusion') ||
        form.includes('vial') ||
        form.includes('ampoule');
      const isLiquid =
        (form.includes('syrup') ||
          form.includes('suspension') ||
          form.includes('solution') ||
          form.includes('liquid') ||
          form.includes('drop')) &&
        !isInjection;

      if (selectedFilter === 'tablet') return isTablet;
      if (selectedFilter === 'capsule') return isCapsule;
      if (selectedFilter === 'cream') return isCream;
      if (selectedFilter === 'injection') return isInjection;
      if (selectedFilter === 'liquid') return isLiquid;
      if (selectedFilter === 'others')
        return !isTablet && !isCapsule && !isCream && !isInjection && !isLiquid;
      return true;
    });
  }, [products, selectedFilter]);

  // Drug Allergy Check Function
  const checkDrugAllergy = (product, customer) => {
    if (!customer || !customer.allergies || customer.allergies.length === 0) return null;

    const ingLower = (product.active_ingredient || '').toLowerCase();
    const tradeLower = (product.trade_name || '').toLowerCase();

    for (const allergy of customer.allergies) {
      const allergyLower = allergy.toLowerCase().trim();
      if (allergyLower && (ingLower.includes(allergyLower) || tradeLower.includes(allergyLower))) {
        return allergy;
      }
    }
    return null;
  };

  // Cart Operations
  const addToCart = (product) => {
    const tmtId = product.tmt_id;
    if (product.stock_quantity <= 0) return;

    if (selectedCustomer) {
      const matchedAllergy = checkDrugAllergy(product, selectedCustomer);
      if (matchedAllergy) {
        setAllergyAlert({
          drug: product.trade_name,
          ingredient: product.active_ingredient,
          allergy: matchedAllergy,
          customerName: selectedCustomer.name
        });
      }
    }

    setCart((prevCart) => {
      const existing = prevCart[tmtId];
      const newQty = existing ? existing.quantity + 1 : 1;

      if (newQty > product.stock_quantity) return prevCart;

      return {
        ...prevCart,
        [tmtId]: {
          product,
          quantity: newQty
        }
      };
    });
  };

  const updateQuantity = (tmtId, change) => {
    setCart((prevCart) => {
      const existing = prevCart[tmtId];
      if (!existing) return prevCart;

      const currentQty = parseInt(existing.quantity, 10) || 0;
      const newQty = currentQty + change;

      if (newQty <= 0) {
        const newCart = { ...prevCart };
        delete newCart[tmtId];
        return newCart;
      }

      if (newQty > existing.product.stock_quantity) {
        return prevCart;
      }

      return {
        ...prevCart,
        [tmtId]: {
          ...existing,
          quantity: newQty
        }
      };
    });
  };

  const handleQuantityChange = (tmtId, valueStr, maxStock) => {
    if (valueStr === '') {
      setCart((prevCart) => {
        const existing = prevCart[tmtId];
        if (!existing) return prevCart;
        return {
          ...prevCart,
          [tmtId]: {
            ...existing,
            quantity: ''
          }
        };
      });
      return;
    }

    let value = parseInt(valueStr, 10);
    if (isNaN(value) || value < 0) value = 0;
    if (value > maxStock) value = maxStock;

    setCart((prevCart) => {
      const existing = prevCart[tmtId];
      if (!existing) return prevCart;
      return {
        ...prevCart,
        [tmtId]: {
          ...existing,
          quantity: value
        }
      };
    });
  };

  const handleQuantityBlur = (tmtId) => {
    setCart((prevCart) => {
      const existing = prevCart[tmtId];
      if (!existing) return prevCart;

      if (existing.quantity === '' || existing.quantity <= 0) {
        const newCart = { ...prevCart };
        delete newCart[tmtId];
        return newCart;
      }
      return prevCart;
    });
  };

  const removeFromCart = (tmtId) => {
    setCart((prevCart) => {
      const newCart = { ...prevCart };
      delete newCart[tmtId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Calculations
  const cartItemsArray = useMemo(() => Object.values(cart), [cart]);

  // Check if cart contains any Dangerous (ข.ย. 11) or Special Controlled (ข.ย. 10) drugs
  const hasDangerousOrControlledDrugInCart = useMemo(() => {
    return cartItemsArray.some(({ product }) => {
      const group = (product.drug_group || product.category || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const isDangerous = group.includes('อันตราย') || category.includes('อันตราย') || group.includes('ข.ย. 11') || group.includes('ข.ย.11');
      const isControlled = group.includes('ควบคุมพิเศษ') || category.includes('ควบคุมพิเศษ') || group.includes('ข.ย. 10') || group.includes('ข.ย.10');
      return isDangerous || isControlled;
    });
  }, [cartItemsArray]);

  const subtotal = useMemo(() => {
    return cartItemsArray.reduce((acc, item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      return acc + item.product.price * qty;
    }, 0);
  }, [cartItemsArray]);

  const vat = useMemo(() => subtotal * 0.07, [subtotal]);
  const grandTotal = useMemo(() => subtotal + vat, [subtotal, vat]);
  const promptPayQrService = useMemo(() => createPromptPayQrService(PROMPTPAY_ID), []);

  const cashChange = useMemo(() => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < grandTotal) return 0;
    return received - grandTotal;
  }, [cashReceived, grandTotal]);

  useEffect(() => {
    let cancelled = false;

    if (!isQrPaymentMethod(paymentMethod) || grandTotal <= 0) {
      setPromptPayQr('');
      return;
    }

    const buildQr = async () => {
      try {
        const qrDataUrl = await promptPayQrService.createDataUrl(grandTotal);

        if (!cancelled) {
          setPromptPayQr(qrDataUrl);
        }
      } catch (error) {
        console.error('PromptPay QR generation failed:', error);
        if (!cancelled) {
          setPromptPayQr('');
        }
      }
    };

    buildQr();

    return () => {
      cancelled = true;
    };
  }, [paymentMethod, grandTotal, promptPayQrService]);

  // Check if cart contains GPP controlled items
  const controlledItemsInCart = useMemo(() => {
    return cartItemsArray
      .filter((item) => ['special_controlled', 'dangerous'].includes(item.product.drug_type))
      .map((item) => ({
        trade_name: item.product.trade_name,
        drug_type: item.product.drug_type,
        quantity: item.quantity,
        unit: item.product.unit
      }));
  }, [cartItemsArray]);

  // Pre-checkout check
  const preCheckoutCheck = () => {
    if (cartItemsArray.length === 0) return;
    setErrorMsg('');

    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < grandTotal) {
        setErrorMsg('กรุณากรอกจำนวนเงินสดที่ได้รับให้ถูกต้องและเพียงพอ');
        return;
      }
    }

    if (controlledItemsInCart.length > 0 && !patientInfo) {
      setControlledItemsToLog(controlledItemsInCart);
      setShowControlledModal(true);
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute Final Checkout API
  const handleCheckout = async (pInfo = patientInfo) => {
    if (cartItemsArray.length === 0) return;
    setErrorMsg('');

    setCheckoutLoading(true);

    const itemsPayload = cartItemsArray.map((item) => ({
      drug_id: item.product.tmt_id,
      quantity: item.quantity,
      unit_price: item.product.price
    }));

    const pPayload = pInfo || {
      patient_name: selectedCustomer?.name || 'ลูกค้าทั่วไป',
      patient_id_card: selectedCustomer?.id_card || '',
      prescriber_name: storeSettings.pharmacistName || 'ภก. ผู้สั่งใช้ยา',
      pharmacist_name: storeSettings.pharmacistName || 'ภก. อภิโช โลมทอง (ภ. 34152)',
      purpose: dispensingReason || 'บรรเทาปวด/มีไข้'
    };

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          payment_method: paymentMethod,
          customer_id: selectedCustomer?.id || null,
          patient_info: pPayload
        })
      });

      const result = await response.json();

      if (result.success) {
        setReceipt({
          ...result.transaction,
          patient_name: pInfo?.patient_name || selectedCustomer?.name || '',
          cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : result.transaction.total,
          change: paymentMethod === 'cash' ? cashChange : 0,
          subtotal: result.transaction.subtotal ?? subtotal,
          vat: result.transaction.vat ?? vat
        });

        setCart({});
        setCashReceived('');
        setPatientInfo(null);

        fetchProducts(searchQuery);
      } else {
        setErrorMsg(result.error || 'การชำระเงินขัดข้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setErrorMsg('เกิดข้อผิดพลาดในการทำธุรกรรมชำระเงิน');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="pos-wrapper">
      {/* LEFT SECTION: Search & Drug Products Grid */}
      <section className="catalogue-section">
        <header className="pos-header">
          <h1 className="brand-title">
            <div className="brand-icon">
              <Store size={20} />
            </div>
            {storeSettings.storeName || 'NONGFILM_MJU_Pharmacy'}
            <span className="brand-badge">{storeSettings.branchName || 'Front Counter'}</span>
          </h1>
          <div className="header-status">
            <ThemeToggle />
            <Link href="/dashboard/customers" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} /> ทะเบียนผู้ป่วย
            </Link>
            <Link href="/dashboard/gpp-reports" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={15} /> รายงาน GPP
            </Link>
            <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <LayoutDashboard size={15} /> แดชบอร์ด
            </Link>
          </div>
        </header>

        {/* Real-time search bar */}
        <div className="search-container">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหายาด้วยชื่อการค้า ชื่อสามัญ หรือรหัส TMT..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={handleClearSearch}>
              ✕
            </button>
          )}
        </div>

        {/* Filter Scroll Buttons */}
        <div className="filter-scroll">
          {[
            { id: 'ALL', name: 'ยาทั้งหมด' },
            { id: 'tablet', name: 'ยาเม็ด' },
            { id: 'capsule', name: 'ยาแคปซูล' },
            { id: 'liquid', name: 'ยาน้ำ' },
            { id: 'cream', name: 'ยาทาภายนอก' },
            { id: 'injection', name: 'ยาฉีด' },
            { id: 'others', name: 'อื่นๆ' }
          ].map((filter) => (
            <button
              key={filter.id}
              className={`filter-badge ${selectedFilter === filter.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.id)}
            >
              {filter.name}
            </button>
          ))}
        </div>

        {/* Main Products Grid */}
        {loading ? (
          <div className="loading-center" style={{ flex: 1 }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <span>กำลังค้นหารายการยา...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const inCart = cart[product.tmt_id];
              const isOutOfStock = product.stock_quantity <= 0;
              const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 20;

              return (
                <div
                  key={product.tmt_id}
                  className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                >
                  <div className="card-header">
                    <span className="tmt-id-label" style={{ fontFamily: 'monospace', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      TMT-{String(product.tmt_id).replace(/^TMT-/, '')}
                    </span>
                    <span
                      className={`stock-badge ${
                        isOutOfStock ? 'no-stock' : isLowStock ? 'low-stock' : 'in-stock'
                      }`}
                    >
                      {isOutOfStock ? 'หมดสต็อก' : `${product.stock_quantity} ${product.unit}`}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="drug-title">{product.trade_name}</h3>
                    <div className="drug-details" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(() => {
                        const typeStr = (product.drug_type || product.category || '').toLowerCase();
                        if (typeStr.includes('ควบคุมพิเศษ') || typeStr.includes('ข.ย. 10') || typeStr.includes('ข.ย.10') || typeStr === 'special_controlled') {
                          return (
                            <span style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px' }}>
                              ยาควบคุมพิเศษ (ข.ย. 10)
                            </span>
                          );
                        }
                        if (typeStr.includes('อันตราย') || typeStr.includes('ข.ย. 11') || typeStr.includes('ข.ย.11') || typeStr === 'dangerous') {
                          return (
                            <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px' }}>
                              ยาอันตราย (ข.ย. 11)
                            </span>
                          );
                        }
                        return (
                          <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', fontSize: '10.5px' }}>
                            ยาสามัญประจำบ้าน
                          </span>
                        );
                      })()}
                      {product.strength && <span className="drug-tag">{product.strength}</span>}
                      {product.dosage_form && <span className="drug-tag">{product.dosage_form}</span>}
                    </div>
                    {product.active_ingredient && product.active_ingredient !== product.trade_name && (
                      <p className="drug-desc" title={product.active_ingredient}>
                        {product.active_ingredient}
                      </p>
                    )}
                  </div>

                  <div className="card-footer">
                    <div className="price-display">
                      <span className="price-amount">฿{Number(product.price).toFixed(2)}</span>
                      <span className="price-unit">ต่อ {product.unit}</span>
                    </div>

                    {isOutOfStock ? (
                      <button className="add-btn" disabled>
                        หมดสต็อก
                      </button>
                    ) : inCart ? (
                      <div className="qty-counter-control">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.tmt_id, -1)}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="qty-number-input"
                          value={inCart.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              product.tmt_id,
                              e.target.value,
                              product.stock_quantity
                            )
                          }
                          onBlur={() => handleQuantityBlur(product.tmt_id)}
                          min="0"
                          max={product.stock_quantity}
                        />
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(product.tmt_id, 1)}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => addToCart(product)}>
                        + เพิ่ม
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-icon">⌕</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                ไม่พบรายการยา
              </div>
              <div>ลองเปลี่ยนคำค้นหา หรือสะกดคำค้นใหม่อีกครั้ง</div>
            </div>
          </div>
        )}
      </section>

      {/* RIGHT SECTION: Cart Register Billing */}
      <section className="cart-section">
        {/* Customer Selection & Patient Profile Header */}
        <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} style={{ color: 'var(--teal-600)' }} /> ผู้ป่วย / สมาชิก:
            </span>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              style={{ fontSize: '11px', fontWeight: 600, color: 'var(--teal-600)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              <UserPlus size={12} /> ลงทะเบียนผู้ป่วยใหม่
            </button>
          </div>

          {/* Quick Search & Select Customer */}
          <div style={{ marginBottom: '6px' }}>
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ เบอร์โทร (เช่น ลุงเค)..."
              value={customerSearch}
              onChange={handleCustomerSearchChange}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c.id === parseInt(e.target.value, 10));
              setSelectedCustomer(cust || null);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="">-- ไม่ระบุ (ลูกค้าทั่วไป) --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''} {c.allergies?.length > 0 ? '⚠️ แพ้ยา' : ''}
              </option>
            ))}
          </select>

          {/* Detailed Selected Patient Profile Card */}
          {selectedCustomer && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1.5px solid var(--teal-600)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', paddingBottom: '4px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={13} /> {selectedCustomer.name}
                  </div>
                  {selectedCustomer.phone && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      📞 เบอร์: {selectedCustomer.phone}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setHistoryCustomerId(selectedCustomer.id);
                      setHistoryCustomerName(selectedCustomer.name);
                      setShowPatientHistoryModal(true);
                    }}
                    style={{
                      backgroundColor: '#065f46',
                      color: '#a7f3d0',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>📜</span> ประวัติการซื้อยา
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px' }}
                    title="ยกเลิกการเลือก"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Patient Health Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
                {selectedCustomer.medical_conditions && (
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>🏥 โรคประจำตัว:</strong> {selectedCustomer.medical_conditions}
                  </div>
                )}

                {selectedCustomer.current_medications && (
                  <div style={{ color: 'var(--blue-600)' }}>
                    <strong>💊 ยาที่ใช้ปัจจุบัน:</strong> {selectedCustomer.current_medications}
                  </div>
                )}

                {selectedCustomer.allergies?.length > 0 ? (
                  <div style={{ marginTop: '4px', padding: '4px 8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontWeight: 700 }}>
                    ⚠️ ประวัติแพ้ยา: {selectedCustomer.allergies.join(', ')}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '10px' }}>ไม่มีประวัติแพ้ยาที่บันทึกไว้</div>
                )}
              </div>
            </div>
          )}
        </div>

        <header className="cart-header">
          <h2 className="cart-title">
            รายการชำระเงิน
            {cartItemsArray.length > 0 && (
              <span className="cart-count-badge">{cartItemsArray.length}</span>
            )}
          </h2>
          {cartItemsArray.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              ล้างรายการ
            </button>
          )}
        </header>

        {/* Scrollable Shopping Cart Items */}
        <div className="cart-items-container">
          {cartItemsArray.length > 0 ? (
            cartItemsArray.map((item) => (
              <div key={item.product.tmt_id} className="cart-item-row">
                <div className="item-details">
                  <span className="item-name" title={item.product.trade_name}>
                    {item.product.trade_name}
                  </span>
                  <span className="item-meta">
                    ฿{Number(item.product.price).toFixed(2)} × {item.quantity} {item.product.unit}
                  </span>
                </div>

                <div className="qty-counter-control">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.product.tmt_id, -1)}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="qty-number-input"
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.product.tmt_id,
                        e.target.value,
                        item.product.stock_quantity
                      )
                    }
                    onBlur={() => handleQuantityBlur(item.product.tmt_id)}
                    min="0"
                    max={item.product.stock_quantity}
                  />
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.product.tmt_id, 1)}
                  >
                    +
                  </button>
                </div>

                <span className="item-total-price">
                  ฿{(item.product.price * item.quantity).toFixed(2)}
                </span>

                <button
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.product.tmt_id)}
                  title="ลบรายการ"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="empty-cart-state">
              <div className="empty-cart-icon">🛒</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  ยังไม่มีรายการ
                </div>
                <div style={{ fontSize: '12px' }}>เลือกยาด้านซ้ายเพื่อเพิ่มรายการ</div>
              </div>
            </div>
          )}
        </div>

        {/* Billing Checkout Footer */}
        <footer className="checkout-footer">
          <div className="summary-rows">
            <div className="summary-row">
              <span>ราคารวม (Subtotal)</span>
              <span>฿{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>VAT 7%</span>
              <span>฿{vat.toFixed(2)}</span>
            </div>
            <div className="summary-row grand-total">
              <span>ยอดชำระ</span>
              <span>฿{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Patient Symptom & Dispensing Reason Input (Only for Registered Customers/Patients) */}
          {cartItemsArray.length > 0 && selectedCustomer && (
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'var(--bg-surface)', borderRadius: '10px', border: '1.5px solid var(--teal-600)' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--teal-700)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                เหตุผลการจ่ายยา / อาการป่วย (บันทึกประวัติ {selectedCustomer.name}):
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {[
                  'บรรเทาปวด/มีไข้',
                  'ไอ/เจ็บคอ/มีน้ำมูก',
                  'ติดเชื้อแบคทีเรีย',
                  'ปวดข้อ/ปวดกล้ามเนื้อ',
                  'ท้องเสีย/ท้องอืด',
                  'ผื่นคัน/แพ้ผิวหนัง'
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDispensingReason(reason)}
                    style={{
                      fontSize: '10.5px',
                      fontWeight: dispensingReason === reason ? 700 : 500,
                      padding: '3px 9px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: dispensingReason === reason ? 'var(--teal-600)' : 'var(--bg-card)',
                      color: dispensingReason === reason ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={dispensingReason}
                onChange={(e) => setDispensingReason(e.target.value)}
                placeholder={`ระบุอาการป่วยของ ${selectedCustomer.name} เพื่อบันทึกประวัติ...`}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  borderRadius: '7px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="payment-grid">
            <button
              className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('cash');
                setErrorMsg('');
              }}
            >
              <Banknote size={16} />
              เงินสด
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'qr_promptpay' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('qr_promptpay');
                setCashReceived('');
                setErrorMsg('');
              }}
            >
              <QrCode size={16} />
              PromptPay
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'credit_card' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('credit_card');
                setCashReceived('');
                setErrorMsg('');
              }}
            >
              <CreditCard size={16} />
              บัตรเครดิต
            </button>
          </div>

          {/* Cash Received Input */}
          {paymentMethod === 'cash' && cartItemsArray.length > 0 && (
            <div className="cash-input-area">
              <label className="cash-input-label">รับเงินสดมา</label>
              <div className="cash-input-wrapper">
                <span className="cash-prefix">฿</span>
                <input
                  type="number"
                  className="cash-input"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                <div className="change-display">
                  <span>เงินทอน</span>
                  <span>฿{cashChange.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {isQrPaymentMethod(paymentMethod) && cartItemsArray.length > 0 && (
            <div className="promptpay-panel">
              <div className="promptpay-qr-frame">
                {promptPayQr ? (
                  <img src={promptPayQr} alt="PromptPay QR" className="promptpay-qr-image" />
                ) : (
                  <div className="spinner"></div>
                )}
              </div>
              <div className="promptpay-details">
                <strong>PromptPay · KBank</strong>
                <span>ID: {PROMPTPAY_ID}</span>
                <span>฿{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {errorMsg && <div className="error-banner">⚠ {errorMsg}</div>}

          <button
            className="checkout-submit-btn"
            disabled={cartItemsArray.length === 0 || checkoutLoading}
            onClick={preCheckoutCheck}
          >
            {checkoutLoading ? (
              <>
                <div className="spinner"></div>
                <span>กำลังประมวลผล...</span>
              </>
            ) : (
              `ยืนยันชำระเงิน · ฿${grandTotal.toFixed(2)}`
            )}
          </button>
        </footer>
      </section>

      {/* DRUG ALLERGY WARNING POPUP MODAL */}
      {allergyAlert && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ maxWidth: '420px', border: '2px solid #ef4444' }}>
            <div className="modal-header" style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <div className="modal-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>⚠️</div>
              <div className="modal-title" style={{ color: '#991b1b' }}>แจ้งเตือนผู้ป่วยมีประวัติแพ้ยา!</div>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                ผู้ป่วย: <strong>{allergyAlert.customerName}</strong>
              </div>
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: 600 }}>
                ⚠️ ยาที่เลือก: &quot;{allergyAlert.drug}&quot; ({allergyAlert.ingredient}) ตรงกับประวัติยาที่แพ้: &quot;{allergyAlert.allergy}&quot;
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                กรุณาสอบถามเภสัชกร หรือเปลี่ยนรายการยาเป็นกลุ่มอื่นเพื่อความปลอดภัยของผู้ป่วย
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setAllergyAlert(null)}
                className="btn btn-primary"
                style={{ backgroundColor: '#dc2626', width: '100%' }}
              >
                รับทราบและตรวจสอบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TO REGISTER NEW PATIENT */}
      {showAddCustomerModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-icon">👤</div>
              <div className="modal-title">ลงทะเบียนผู้ป่วย / สมาชิกใหม่</div>
              <div className="modal-subtitle">บันทึกประวัติสุขภาพและประวัติแพ้ยา</div>
            </div>

            <form onSubmit={handleCreateCustomer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    ชื่อ-นามสกุล <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="cash-input"
                    style={{ fontSize: '13px', padding: '8px 12px', height: '38px' }}
                    placeholder="เช่น ลุงเค (เค รุ่งเรือง)"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
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
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
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
                      value={newCustIdCard}
                      onChange={(e) => setNewCustIdCard(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>
                      อายุ (ปี)
                    </label>
                    <input
                      type="number"
                      className="cash-input"
                      style={{ fontSize: '12px', padding: '6px 8px', height: '34px' }}
                      placeholder="เช่น 45"
                      value={newCustAge}
                      onChange={(e) => setNewCustAge(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>
                      เพศ
                    </label>
                    <select
                      className="cash-input"
                      style={{ fontSize: '12px', padding: '6px 8px', height: '34px' }}
                      value={newCustGender}
                      onChange={(e) => setNewCustGender(e.target.value)}
                    >
                      <option value="">ไม่ระบุ</option>
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>
                      น้ำหนัก (กก.)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="cash-input"
                      style={{ fontSize: '12px', padding: '6px 8px', height: '34px' }}
                      placeholder="เช่น 65.5"
                      value={newCustWeight}
                      onChange={(e) => setNewCustWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: '#64748b' }}>
                      ส่วนสูง (ซม.)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="cash-input"
                      style={{ fontSize: '12px', padding: '6px 8px', height: '34px' }}
                      placeholder="เช่น 170"
                      value={newCustHeight}
                      onChange={(e) => setNewCustHeight(e.target.value)}
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
                    value={newCustConditions}
                    onChange={(e) => setNewCustConditions(e.target.value)}
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
                    value={newCustAllergies}
                    onChange={(e) => setNewCustAllergies(e.target.value)}
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
                    value={newCustCurrentMeds}
                    onChange={(e) => setNewCustCurrentMeds(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddCustomerModal(false)}
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

      {/* CONTROLLED DRUG FORCE DATA ENTRY MODAL */}
      {showControlledModal && (
        <ControlledDrugModal
          controlledItems={controlledItemsToLog}
          customer={selectedCustomer}
          onConfirm={(pInfo) => {
            setShowControlledModal(false);
            setPatientInfo(pInfo);
            setShowConfirmModal(true);
          }}
          onCancel={() => setShowControlledModal(false)}
        />
      )}

      {/* RENDER DYNAMIC RECEIPT PRINT MODAL */}
      {receipt && (
        <ReceiptModal
          transaction={receipt}
          onClose={() => setReceipt(null)}
        />
      )}

      {/* TRANSACTION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-icon">✓</div>
              <div className="modal-title">ยืนยันการชำระเงิน</div>
              <div className="modal-subtitle">กรุณาตรวจสอบรายการก่อนยืนยัน</div>
            </div>

            <div className="modal-body">
              <div className="confirm-item-list">
                {cartItemsArray.map((item, idx) => (
                  <div key={idx} className="confirm-item-row">
                    <span className="confirm-item-name">{item.product.trade_name}</span>
                    <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      ×{item.quantity} {item.product.unit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="confirm-summary-rows">
                {selectedCustomer && (
                  <div className="confirm-row">
                    <span>ลูกค้า/ผู้ป่วย</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedCustomer.name}
                    </span>
                  </div>
                )}
                <div className="confirm-row">
                  <span>ช่องทางชำระเงิน</span>
                  <span style={{ fontWeight: 600, color: 'var(--teal-600)' }}>
                    {paymentMethod === 'cash'
                      ? '💵 เงินสด'
                      : paymentMethod === 'qr_promptpay'
                      ? '📱 PromptPay QR'
                      : '💳 บัตรเครดิต'}
                  </span>
                </div>
                <div className="confirm-row total">
                  <span>ยอดชำระ</span>
                  <span>฿{grandTotal.toFixed(2)}</span>
                </div>
                {paymentMethod === 'cash' && (
                  <>
                    <div className="confirm-row">
                      <span>รับเงินสด</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        ฿{parseFloat(cashReceived).toFixed(2)}
                      </span>
                    </div>
                    <div className="confirm-row change">
                      <span>เงินทอน</span>
                      <span>฿{cashChange.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowConfirmModal(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleCheckout();
                }}
              >
                ยืนยันชำระเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      <PatientHistoryModal
        isOpen={showPatientHistoryModal}
        onClose={() => setShowPatientHistoryModal(false)}
        customerId={historyCustomerId}
        customerName={historyCustomerName}
      />
    </div>
  );
}
