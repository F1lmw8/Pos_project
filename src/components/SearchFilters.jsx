'use client';

import React from 'react';

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filteredCount
}) {
  const trendingTags = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Omeprazole', 'Clobetasol'];

  return (
    <section className="search-section animate-slide">
      {/* Search Input Box */}
      <div className="search-box-wrapper">
        <div className="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input 
          type="text"
          className="search-input"
          placeholder="ค้นหาชื่อยา เช่น Paracetamol, CLOBET..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-button" onClick={() => setSearchQuery('')} aria-label="ล้างการค้นหา">✕</button>
        )}
      </div>

      {/* Popular Search tags */}
      <div className="trending-container animate-fade">
        <span className="trending-label">🔥 ยอดนิยม:</span>
        {trendingTags.map((tag) => (
          <button 
            key={tag} 
            className="trending-tag" 
            onClick={() => setSearchQuery(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Quick Category Filters */}
      <div className="filters-container">
        <button 
          className={`filter-btn ${selectedFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('ALL')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </span>
          <span className="filter-text">ทั้งหมด</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'tablet' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('tablet')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="20" x2="20" y2="4"></line><path d="M15 5c3 3 0 6 0 6l-4 4c-3 3-6 0-6 0Z"></path></svg>
          </span>
          <span className="filter-text">ยาเม็ด</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'capsule' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('capsule')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </span>
          <span className="filter-text">แคปซูล</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'cream' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('cream')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4M9 6h6v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6Z"></path></svg>
          </span>
          <span className="filter-text">ยาทา</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'injection' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('injection')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 2 4 4-2 2-4-4 2-2ZM14 10l-4-4-6 6v4h4l6-6Z"/></svg>
          </span>
          <span className="filter-text">ยาฉีด</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'liquid' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('liquid')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 2-5 5M14 7l3 3M12 9l-7 7H3v-2l7-7M5 19a3 3 0 1 0 6 0 3 3 0 1 0-6 0Z"/></svg>
          </span>
          <span className="filter-text">ยาน้ำ</span>
        </button>
        
        <button 
          className={`filter-btn ${selectedFilter === 'others' ? 'active' : ''}`}
          onClick={() => setSelectedFilter('others')}
        >
          <span className="filter-icon-svg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </span>
          <span className="filter-text">อื่นๆ</span>
        </button>
      </div>

      {/* Query Stats Count */}
      <div className="stats-badge animate-fade">
        ค้นพบยา <span className="stats-count">{filteredCount.toLocaleString()}</span> รายการ ในหมวดหมู่ {
          selectedFilter === 'ALL' ? 'ทั้งหมด' : 
          selectedFilter === 'tablet' ? 'ยาเม็ด' : 
          selectedFilter === 'capsule' ? 'แคปซูล' : 
          selectedFilter === 'cream' ? 'ยาทา' : 
          selectedFilter === 'injection' ? 'ยาฉีด' : 
          selectedFilter === 'liquid' ? 'ยาน้ำ' : 
          selectedFilter === 'others' ? 'อื่นๆ' : selectedFilter
        }
      </div>
    </section>
  );
}
