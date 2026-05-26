'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar({ searchQuery, setSearchQuery }) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isInputFocused = document.activeElement && document.activeElement.classList.contains('navbar-search-input');
      
      // If scroll position is close to the top, absolutely clear sticky status to prevent sticking/overlapping
      if (window.scrollY < 120) {
        setIsSticky(false);
        if (isInputFocused) {
          document.activeElement.blur(); // Dismiss mobile keyboard gracefully
        }
      } else if (window.scrollY > 220 || isInputFocused) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    
    // Also listen to focus and blur events on the input to dynamically update sticky state
    const handleFocusChange = () => {
      handleScroll();
    };
    
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, []);

  return (
    <>
      <nav className={`main-navbar ${isSticky ? 'sticky' : ''}`}>
        <div className="navbar-container">
          {/* Logo */}
          <Link href="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
            <span className="logo-icon">🏥</span>
            <span className="logo-text">รู้เรื่องยา <span className="logo-accent">RDU</span></span>
          </Link>

          {/* Centered/Right Search Input in Sticky Mode */}
          {isSticky ? (
            <div className="navbar-search-wrapper animate-slide-down">
              <div className="navbar-search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input 
                type="text"
                className="navbar-search-input"
                placeholder="ค้นหาชื่อยา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="navbar-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          ) : (
            <div className="navbar-links">
              <span className="nav-link">คู่มือยาผู้ป่วย</span>
              <span className="nav-link">ความปลอดภัย RDU</span>
            </div>
          )}
        </div>
      </nav>
      {/* Spacer to prevent layout shift when navbar becomes fixed */}
      {isSticky && <div className="navbar-spacer"></div>}
    </>
  );
}
