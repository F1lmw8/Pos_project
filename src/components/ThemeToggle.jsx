'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style, showText = false }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('pharmacy_pos_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('pharmacy_pos_theme', nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justify: 'center',
        gap: '6px',
        width: showText ? 'auto' : '38px',
        height: '38px',
        borderRadius: showText ? '20px' : '50%',
        padding: showText ? '0 14px' : 0,
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-xs)',
        ...style
      }}
    >
      {theme === 'dark' ? (
        <Sun size={18} style={{ color: '#f59e0b' }} />
      ) : (
        <Moon size={18} style={{ color: '#6366f1' }} />
      )}
      {showText && (
        <span style={{ fontSize: '12px', fontWeight: 700 }}>
          {theme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}
        </span>
      )}
    </button>
  );
}
