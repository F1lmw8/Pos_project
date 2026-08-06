'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style, iconOnly = false }) {
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
        gap: iconOnly ? 0 : '8px',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderRadius: iconOnly ? '50%' : '20px',
        width: iconOnly ? '38px' : 'auto',
        height: '38px',
        minWidth: iconOnly ? '38px' : 'auto',
        minHeight: '38px',
        padding: iconOnly ? 0 : '6px 14px',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-xs)',
        ...style
      }}
    >
      {theme === 'dark' ? (
        <>
          <Moon size={17} style={{ color: '#a78bfa' }} />
          {!iconOnly && <span>โหมดมืด</span>}
        </>
      ) : (
        <>
          <Sun size={17} style={{ color: '#f59e0b' }} />
          {!iconOnly && <span>โหมดสว่าง</span>}
        </>
      )}
    </button>
  );
}
