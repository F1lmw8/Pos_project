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

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: iconOnly ? 0 : '8px',
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
        color: isDark ? '#f8fafc' : '#0f172a',
        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
        borderRadius: iconOnly ? '50%' : '20px',
        width: iconOnly ? '38px' : 'auto',
        height: '38px',
        minWidth: iconOnly ? '38px' : 'auto',
        minHeight: '38px',
        padding: iconOnly ? 0 : '6px 14px',
        fontSize: '12px',
        fontWeight: '700',
        lineHeight: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {isDark ? (
        <Moon size={17} style={{ color: '#a78bfa', flexShrink: 0 }} />
      ) : (
        <Sun size={17} style={{ color: '#f59e0b', flexShrink: 0 }} />
      )}
      {!iconOnly && (
        <span style={{ color: isDark ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap' }}>
          {isDark ? 'โหมดมืด' : 'โหมดสว่าง'}
        </span>
      )}
    </button>
  );
}
