'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style }) {
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
        gap: '6px',
        backgroundColor: theme === 'dark' ? '#172822' : '#e2e8f0',
        color: theme === 'dark' ? '#34d399' : '#0f172a',
        border: theme === 'dark' ? '1px solid #1f3d33' : '1px solid #cbd5e1',
        borderRadius: '20px',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        ...style
      }}
    >
      {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
      <span>{theme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'}</span>
    </button>
  );
}
