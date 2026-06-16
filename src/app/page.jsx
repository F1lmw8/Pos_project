'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createPromptPayQrService, isQrPaymentMethod } from '../utils/paymentQr';

const PROMPTPAY_ID = '0989342456';

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
  const [promptPayQr, setPromptPayQr] = useState('');

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
          cashReceived: paymentMethod === 'cash' ? parseFloat(cashReceived) : result.transaction.total,
          change: paymentMethod === 'cash' ? cashChange : 0,
          subtotal: result.transaction.subtotal ?? subtotal,
          vat: result.transaction.vat ?? vat,
          promptPayQr: isQrPaymentMethod(paymentMethod) ? promptPayQr : ''
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
          <h1 className="brand-title">
            <div className="brand-icon">💊</div>
            RDU Pharmacy POS
            <span className="brand-badge">Front Counter</span>
          </h1>
          <div className="header-status">
            <Link href="/dashboard" className="btn btn-outline btn-sm">
              ◎ รายงาน &amp; คลัง
            </Link>
            <span className="status-dot"></span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ออนไลน์</span>
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
          <div className="loading-center" style={{ flex: 1 }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <span>กำลังค้นหารายการยา...</span>
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
                      {isOutOfStock ? 'หมดสต็อก' : `${product.stock_quantity} ${product.unit}`}
                    </span>
                  </div>

                  <div className="card-body">
                    <h3 className="drug-title">{product.trade_name}</h3>
                    <div className="drug-details">
                      {product.strength && <span className="drug-tag">{product.strength}</span>}
                      {product.dosage_form && <span className="drug-tag">{product.dosage_form}</span>}
                    </div>
                    {product.active_ingredient && (
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
                      <button className="add-btn" onClick={() => addToCart(product)}>+ เพิ่ม</button>
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
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>ไม่พบรายการยา</div>
              <div>ลองเปลี่ยนคำค้นหา หรือสะกดคำค้นใหม่อีกครั้ง</div>
            </div>
          </div>
        )}
      </section>

      {/* RIGHT SECTION: Cart Register Billing */}
      <section className="cart-section">
        <header className="cart-header">
          <h2 className="cart-title">
            รายการชำระเงิน
            {cartItemsArray.length > 0 && <span className="cart-count-badge">{cartItemsArray.length}</span>}
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
            cartItemsArray.map(item => (
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

                <button className="remove-item-btn" onClick={() => removeFromCart(item.product.tmt_id)}
                  title="ลบรายการ">
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="empty-cart-state">
              <div className="empty-cart-icon">🛒</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>ยังไม่มีรายการ</div>
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

          {/* Payment Method Selector */}
          <div className="payment-grid">
            <button
              className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
              onClick={() => { setPaymentMethod('cash'); setErrorMsg(''); }}
            >
              <span className="payment-btn-icon">💵</span>
              เงินสด
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'qr_promptpay' ? 'active' : ''}`}
              onClick={() => { setPaymentMethod('qr_promptpay'); setCashReceived(''); setErrorMsg(''); }}
            >
              <span className="payment-btn-icon">📱</span>
              PromptPay
            </button>
            <button
              className={`payment-btn ${paymentMethod === 'credit_card' ? 'active' : ''}`}
              onClick={() => { setPaymentMethod('credit_card'); setCashReceived(''); setErrorMsg(''); }}
            >
              <span className="payment-btn-icon">💳</span>
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

          {errorMsg && (
            <div className="error-banner">⚠ {errorMsg}</div>
          )}

          <button
            className="checkout-submit-btn"
            disabled={cartItemsArray.length === 0 || checkoutLoading}
            onClick={preCheckoutCheck}
          >
            {checkoutLoading ? (
              <><div className="spinner"></div><span>กำลังประมวลผล...</span></>
            ) : (
              `ยืนยันชำระเงิน · ฿${grandTotal.toFixed(2)}`
            )}
          </button>
        </footer>
      </section>

      {/* RENDER DYNAMIC RECEIPT PRINT MODAL */}
      {receipt && (
        <div className="receipt-overlay">
          <div className="receipt-box">
            <div className="receipt-header">
              <div className="receipt-logo">🏥</div>
              <h3 className="receipt-shop-name">PHARMACY POS RDU</h3>
              <p style={{ fontSize: '10px', color: '#6b7280', marginTop: 2 }}>กรุงเทพมหานคร ประเทศไทย</p>
              
              <div className="receipt-meta" style={{ marginTop: '12px' }}>
                <div><strong>เลขใบเสร็จ:</strong> {receipt.id}</div>
                <div><strong>วันที่:</strong> {new Date(receipt.date).toLocaleString('th-TH')}</div>
                <div><strong>แคชเชียร์:</strong> Front Counter #1</div>
                <div><strong>ชำระผ่าน:</strong> {receipt.payment_method === 'cash' ? 'เงินสด' : receipt.payment_method === 'qr_promptpay' ? 'QR PromptPay' : 'บัตรเครดิต'}</div>
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
                    <span style={{ fontSize: '10px', color: '#6b7280' }}>
                      TMT-{item.drug_id} {item.strength} {item.lot_number ? `Lot ${item.lot_number}` : ''}
                    </span>
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
              {isQrPaymentMethod(receipt.payment_method) && receipt.promptPayQr && (
                <div className="receipt-qr-code promptpay-receipt-qr">
                  <img src={receipt.promptPayQr} alt="PromptPay QR" />
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
              {/* Item list */}
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

              {/* Summary */}
              <div className="confirm-summary-rows">
                <div className="confirm-row">
                  <span>ช่องทางชำระเงิน</span>
                  <span style={{ fontWeight: 600, color: 'var(--teal-600)' }}>
                    {paymentMethod === 'cash' ? '💵 เงินสด' : paymentMethod === 'qr_promptpay' ? '📱 PromptPay QR' : '💳 บัตรเครดิต'}
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
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>฿{parseFloat(cashReceived).toFixed(2)}</span>
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
              <button
                className="btn btn-outline"
                onClick={() => setShowConfirmModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setShowConfirmModal(false); handleCheckout(); }}
              >
                ยืนยันชำระเงิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
