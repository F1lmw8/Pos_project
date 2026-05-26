'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function PosRegisterPage() {
  // Application State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Receipt Modal State
  const [receipt, setReceipt] = useState(null);
  const [cashReceived, setCashReceived] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Fetch products from PostgreSQL based on search query
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

  // Fetch initial products on load
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Search Input with a minor debounce or direct trigger
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchProducts(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchProducts('');
  };

  // 2. Filter products based on selected UI Category
  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'ALL') return products;

    return products.filter(p => {
      if (!p.dosage_form) return false;
      const form = p.dosage_form.toLowerCase();
      
      const isTablet = form.includes('tablet') || form.includes('pill');
      const isCapsule = form.includes('capsule') || form.includes('cap');
      const isCream = form.includes('cream') || form.includes('ointment') || form.includes('gel') || form.includes('lotion');
      const isInjection = form.includes('inject') || form.includes('infusion') || form.includes('vial') || form.includes('ampoule');
      const isLiquid = (form.includes('syrup') || form.includes('suspension') || form.includes('solution') || form.includes('liquid') || form.includes('drop')) && !isInjection;

      if (selectedFilter === 'tablet') return isTablet;
      if (selectedFilter === 'capsule') return isCapsule;
      if (selectedFilter === 'cream') return isCream;
      if (selectedFilter === 'injection') return isInjection;
      if (selectedFilter === 'liquid') return isLiquid;
      if (selectedFilter === 'others') return !isTablet && !isCapsule && !isCream && !isInjection && !isLiquid;
      return true;
    });
  }, [products, selectedFilter]);

  // 3. Cart Operations
  const addToCart = (product) => {
    const tmtId = product.tmt_id;
    if (product.stock_quantity <= 0) return; // Out of stock check

    setCart(prevCart => {
      const existing = prevCart[tmtId];
      const newQty = existing ? existing.quantity + 1 : 1;
      
      // Stock limit validation
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
    setCart(prevCart => {
      const existing = prevCart[tmtId];
      if (!existing) return prevCart;

      const currentQty = parseInt(existing.quantity, 10) || 0;
      const newQty = currentQty + change;
      
      if (newQty <= 0) {
        // Remove item if quantity becomes 0
        const newCart = { ...prevCart };
        delete newCart[tmtId];
        return newCart;
      }

      // Check against maximum available stock
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
    // Allow empty string temporarily so cashiers can backspace to type new numbers
    if (valueStr === '') {
      setCart(prevCart => {
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
    if (value > maxStock) value = maxStock; // Validate against physical inventory

    setCart(prevCart => {
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
    setCart(prevCart => {
      const existing = prevCart[tmtId];
      if (!existing) return prevCart;

      // Clean up item from cart if cashier leaves it blank or at zero
      if (existing.quantity === '' || existing.quantity <= 0) {
        const newCart = { ...prevCart };
        delete newCart[tmtId];
        return newCart;
      }
      return prevCart;
    });
  };

  const removeFromCart = (tmtId) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      delete newCart[tmtId];
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // 4. Calculations
  const cartItemsArray = useMemo(() => Object.values(cart), [cart]);

  const subtotal = useMemo(() => {
    return cartItemsArray.reduce((acc, item) => {
      const qty = parseInt(item.quantity, 10) || 0;
      return acc + (item.product.price * qty);
    }, 0);
  }, [cartItemsArray]);

  const vat = useMemo(() => subtotal * 0.07, [subtotal]);
  const grandTotal = useMemo(() => subtotal + vat, [subtotal, vat]);

  const cashChange = useMemo(() => {
    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < grandTotal) return 0;
    return received - grandTotal;
  }, [cashReceived, grandTotal]);

  // 5. Checkout Handler
  const handleCheckout = async () => {
    if (cartItemsArray.length === 0) return;
    setErrorMsg('');

    // Additional validation for Cash payment
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < grandTotal) {
        setErrorMsg('กรุณากรอกจำนวนเงินสดที่ได้รับให้ถูกต้องและเพียงพอ');
        return;
      }
    }

    setCheckoutLoading(true);

    // Format items payload for API
    const itemsPayload = cartItemsArray.map(item => ({
      drug_id: item.product.tmt_id,
      quantity: item.quantity,
      unit_price: item.product.price
    }));

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          payment_method: paymentMethod
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store receipt details to show dynamic print modal
        setReceipt({
          ...result.transaction,
          cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : grandTotal,
          change: paymentMethod === 'cash' ? cashChange : 0,
          subtotal,
          vat
        });
        
        // Success: Reset checkout parameters
        setCart({});
        setCashReceived('');
        
        // Re-fetch database catalogue to sync stock levels
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

  const preCheckoutCheck = () => {
    if (cartItemsArray.length === 0) return;
    setErrorMsg('');

    // Additional validation for Cash payment
    if (paymentMethod === 'cash') {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < grandTotal) {
        setErrorMsg('กรุณากรอกจำนวนเงินสดที่ได้รับให้ถูกต้องและเพียงพอ');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  return (
    <div className="pos-wrapper">
      {/* LEFT SECTION: Search & Drug Products Grid */}
      <section className="catalogue-section">
        <header className="pos-header">
          <div>
            <h1 className="brand-title">
              💊 RDU POS <span className="brand-badge">Front Counter</span>
            </h1>
          </div>
          <div className="header-status">
            <Link 
              href="/dashboard" 
              style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', 
                color: '#fff', 
                textDecoration: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 14px', 
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                transition: 'all 0.2s ease',
                marginRight: '12px',
                fontSize: '12px'
              }}
            >
              📊 ดูสรุปยอด & รายงานคลัง
            </Link>
            <span className="status-dot"></span>
            <span>คลังยาเชื่อมต่อออนไลน์</span>
          </div>
        </header>

        {/* Real-time search bar */}
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหายาด้วยชื่อการค้า ชื่อยาสามัญ หรือรหัส TMT (พิมพ์ 2 ตัวอักษรขึ้นไป)..."
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
            { id: 'ALL', name: '💊 ยาทั้งหมด' },
            { id: 'tablet', name: '💊 ยาเม็ด (Tablet)' },
            { id: 'capsule', name: '💊 ยาแคปซูล (Capsule)' },
            { id: 'liquid', name: '🍼 ยาน้ำ (Liquid)' },
            { id: 'cream', name: '🧴 ยาทาภายนอก (Cream/Ointment)' },
            { id: 'injection', name: '💉 ยาฉีด (Injection)' },
            { id: 'others', name: '📦 อื่นๆ' }
          ].map(filter => (
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>กำลังค้นหารายการยาแบบเรียลไทม์...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map(product => {
              const inCart = cart[product.tmt_id];
              const isOutOfStock = product.stock_quantity <= 0;
              const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 20;

              return (
                <div key={product.tmt_id} className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="card-header">
                    <span className="tmt-id-label">TMT-{product.tmt_id}</span>
                    <span className={`stock-badge ${isOutOfStock ? 'no-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                      {isOutOfStock ? 'สินค้าหมด' : `คงเหลือ ${product.stock_quantity} ${product.unit}`}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="drug-title">{product.trade_name}</h3>
                    <div className="drug-details">
                      {product.strength && <span className="brand-badge">{product.strength}</span>}
                      {product.dosage_form && <span className="filter-badge" style={{ padding: '2px 8px', fontSize: '10px' }}>{product.dosage_form}</span>}
                    </div>
                    {product.active_ingredient && (
                      <p className="drug-desc" title={product.active_ingredient}>
                        🔬 {product.active_ingredient}
                      </p>
                    )}
                  </div>

                  <div className="card-footer">
                    <div className="price-display">
                      <span className="price-amount">฿{Number(product.price).toFixed(2)}</span>
                      <span className="price-unit">ต่อ {product.unit}</span>
                    </div>

                    {isOutOfStock ? (
                      <button className="add-btn" disabled>หมดสต็อก</button>
                    ) : inCart ? (
                      <div className="qty-counter-control">
                        <button className="qty-btn" onClick={() => updateQuantity(product.tmt_id, -1)}>−</button>
                        <input
                          type="number"
                          className="qty-number-input"
                          value={inCart.quantity}
                          onChange={(e) => handleQuantityChange(product.tmt_id, e.target.value, product.stock_quantity)}
                          onBlur={() => handleQuantityBlur(product.tmt_id)}
                          min="0"
                          max={product.stock_quantity}
                        />
                        <button className="qty-btn" onClick={() => updateQuantity(product.tmt_id, 1)}>+</button>
                      </div>
                    ) : (
                      <button className="add-btn" onClick={() => addToCart(product)}>เพิ่มเข้าตะกร้า</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '48px' }}>🔎</span>
            <h3 style={{ margin: '12px 0 4px 0', color: 'var(--text-primary)' }}>ไม่พบข้อมูลยา</h3>
            <p style={{ fontSize: '14px' }}>ลองเปลี่ยนคำค้นหา หรือสะกดคำค้นใหม่อีกครั้ง</p>
          </div>
        )}
      </section>

      {/* RIGHT SECTION: Cart Register Billing */}
      <section className="cart-section">
        <header className="cart-header">
          <h2 className="cart-title">
            🛒 รายการสั่งซื้อ
            {cartItemsArray.length > 0 && <span className="cart-count-badge">{cartItemsArray.length}</span>}
          </h2>
          {cartItemsArray.length > 0 && (
            <button className="clear-cart-btn" onClick={clearCart}>
              ล้างตะกร้า
            </button>
          )}
        </header>

        {/* Scrollable Shopping Cart Items */}
        <div className="cart-items-container">
          {cartItemsArray.length > 0 ? (
            cartItemsArray.map(item => (
              <div key={item.product.tmt_id} className="cart-item-row">
                <div className="item-details">
                  <span className="item-name" title={item.product.trade_name}>
                    {item.product.trade_name}
                  </span>
                  <span className="item-meta">
                    ฿{Number(item.product.price).toFixed(2)} x {item.quantity} {item.product.unit}
                  </span>
                </div>

                <div className="qty-counter-control" style={{ marginRight: '8px' }}>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.tmt_id, -1)}>−</button>
                  <input
                    type="number"
                    className="qty-number-input"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.product.tmt_id, e.target.value, item.product.stock_quantity)}
                    onBlur={() => handleQuantityBlur(item.product.tmt_id)}
                    min="0"
                    max={item.product.stock_quantity}
                  />
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.tmt_id, 1)}>+</button>
                </div>

                <span className="item-total-price">
                  ฿{(item.product.price * item.quantity).toFixed(2)}
                </span>

                <button className="remove-item-btn" onClick={() => removeFromCart(item.product.tmt_id)}>
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="empty-cart-state">
              <span className="empty-cart-icon">🛒</span>
              <p>เครื่องรับชำระเงินยังว่างอยู่</p>
              <p style={{ fontSize: '12px' }}>คลิกเลือกรายการยาด้านซ้ายเพื่อทำรายการ</p>
            </div>
          )}
        </div>

        {/* Billing Checkout Footer */}
        <footer className="checkout-footer">
          <div className="summary-rows">
            <div className="summary-row">
              <span>ราคารวมสินค้า (Subtotal)</span>
              <span>฿{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%)</span>
              <span>฿{vat.toFixed(2)}</span>
            </div>
            <div className="summary-row grand-total">
              <span>ยอดชำระทั้งสิ้น</span>
              <span>฿{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="payment-grid">
            <button
              className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('cash');
                setErrorMsg('');
              }}
            >
              💵 เงินสด
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'qr_promptpay' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('qr_promptpay');
                setCashReceived('');
                setErrorMsg('');
              }}
            >
              📱 PromptPay QR
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'credit_card' ? 'active' : ''}`}
              onClick={() => {
                setPaymentMethod('credit_card');
                setCashReceived('');
                setErrorMsg('');
              }}
            >
              💳 บัตรเครดิต
            </button>
          </div>

          {/* Cash Received Input Field */}
          {paymentMethod === 'cash' && cartItemsArray.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                รับเงินสดมา (Cash Received):
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>฿</span>
                <input
                  type="number"
                  className="search-input"
                  style={{ height: '40px', paddingLeft: '30px', fontSize: '14px' }}
                  placeholder="กรอกจำนวนเงินสด..."
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </div>
              {cashReceived && parseFloat(cashReceived) >= grandTotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-success)', fontWeight: 'bold', marginTop: '2px' }}>
                  <span>เงินทอน:</span>
                  <span>฿{cashChange.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Server/Checkout error messages */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#fca5a5' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Action Checkout Submit Button */}
          <button
            className="checkout-submit-btn"
            disabled={cartItemsArray.length === 0 || checkoutLoading}
            onClick={preCheckoutCheck}
          >
            {checkoutLoading ? (
              <>
                <div className="spinner"></div>
                <span>กำลังดำเนินการชำระเงิน...</span>
              </>
            ) : (
              <>
                ⚡ ยืนยันชำระเงิน (฿{grandTotal.toFixed(2)})
              </>
            )}
          </button>
        </footer>
      </section>

      {/* RENDER DYNAMIC RECEIPT PRINT MODAL */}
      {receipt && (
        <div className="receipt-overlay">
          <div className="receipt-box">
            <div className="receipt-header">
              <span className="receipt-logo">🏥</span>
              <h3 className="receipt-shop-name">PHARMACY POS RDU</h3>
              <p style={{ fontSize: '10px', color: '#4b5563' }}>กรุงเทพมหานคร ประเทศไทย</p>
              
              <div className="receipt-meta" style={{ marginTop: '10px' }}>
                <div><strong>เลขใบเสร็จ:</strong> {receipt.id}</div>
                <div><strong>วันที่:</strong> {new Date(receipt.date).toLocaleString('th-TH')}</div>
                <div><strong>แคชเชียร์:</strong> Front Counter #1</div>
                <div><strong>ชำระเงินผ่าน:</strong> {receipt.payment_method === 'cash' ? 'เงินสด (Cash)' : receipt.payment_method === 'qr_promptpay' ? 'QR PromptPay' : 'บัตรเครดิต (Credit Card)'}</div>
              </div>
            </div>

            <div className="receipt-table">
              <div className="receipt-row" style={{ fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>
                <span>รายการยา</span>
                <span style={{ width: '60px', textAlign: 'center' }}>จำนวน</span>
                <span style={{ width: '80px', textAlign: 'right' }}>รวม (฿)</span>
              </div>
              
              {receipt.items.map((item, idx) => (
                <div key={idx} className="receipt-row item-line">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold' }}>{item.trade_name}</span>
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>TMT-{item.drug_id} {item.strength}</span>
                  </div>
                  <span style={{ width: '60px', textAlign: 'center', alignSelf: 'center' }}>{item.quantity} {item.unit}</span>
                  <span style={{ width: '80px', textAlign: 'right', alignSelf: 'center' }}>{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-total-section">
              <div className="receipt-row">
                <span>ราคารวมสินค้า:</span>
                <span>฿{receipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="receipt-row">
                <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                <span>฿{receipt.vat.toFixed(2)}</span>
              </div>
              <div className="receipt-total-row grand-total" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '4px' }}>
                <span>รวมทั้งสิ้น:</span>
                <span>฿{receipt.total.toFixed(2)}</span>
              </div>
              
              {receipt.payment_method === 'cash' && (
                <>
                  <div className="receipt-row" style={{ color: '#4b5563', marginTop: '4px' }}>
                    <span>รับเงินสด:</span>
                    <span>฿{receipt.cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="receipt-row" style={{ fontWeight: 'bold', color: '#059669' }}>
                    <span>เงินทอน:</span>
                    <span>฿{receipt.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="receipt-footer">
              {receipt.payment_method !== 'cash' && (
                <div className="receipt-qr-code">
                  [ QR PROMPTPAY ]
                  <br />
                  ตรวจสอบสต็อกแล้ว
                </div>
              )}
              <p>*** ขอบคุณที่ใช้บริการ / THANK YOU ***</p>
              <p style={{ fontSize: '9px', color: '#9ca3af' }}>บันทึกสต็อกและประวัติเรียบร้อยใน PostgreSQL</p>
              
              <button className="receipt-close-btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => setReceipt(null)}>
                พิมพ์ใบเสร็จและเริ่มรายการใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TRANSACTION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="receipt-overlay" style={{ zIndex: 999 }}>
          <div className="receipt-box" style={{ fontFamily: 'var(--font-sans)', padding: '28px', maxWidth: '420px', borderRadius: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px' }}>📝</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#1e293b', marginTop: '8px' }}>
                ยืนยันการทำรายการชำระเงิน
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>กรุณาตรวจสอบรายละเอียดรายการยาก่อนกดยืนยัน</p>
            </div>

            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc', marginBottom: '16px' }}>
              {cartItemsArray.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155', paddingBottom: '6px', marginBottom: '6px', borderBottom: idx < cartItemsArray.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                  <span style={{ fontWeight: '500', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.trade_name}
                  </span>
                  <span style={{ color: '#64748b' }}>
                    x{item.quantity} {item.product.unit}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569' }}>
                <span>ช่องทางชำระเงิน:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {paymentMethod === 'cash' ? '💵 เงินสด' : paymentMethod === 'qr_promptpay' ? '📱 PromptPay QR' : '💳 บัตรเครดิต'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                <span>ยอดชำระทั้งสิ้น:</span>
                <span style={{ fontSize: '17px', color: 'var(--color-primary)' }}>฿{grandTotal.toFixed(2)}</span>
              </div>
              
              {paymentMethod === 'cash' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                    <span>รับเงินสดมา:</span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>฿{parseFloat(cashReceived).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                    <span style={{ color: 'var(--color-primary)' }}>เงินทอน:</span>
                    <span style={{ fontSize: '18px', color: 'var(--color-primary)' }}>฿{cashChange.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button 
                className="receipt-close-btn" 
                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                onClick={() => setShowConfirmModal(false)}
              >
                ยกเลิก
              </button>
              <button 
                className="checkout-submit-btn" 
                style={{ height: '44px', borderRadius: '8px', fontSize: '14px' }}
                onClick={() => {
                  setShowConfirmModal(false);
                  handleCheckout();
                }}
              >
                ยืนยันการทำรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
