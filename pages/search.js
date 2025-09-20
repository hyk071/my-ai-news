/**
 * 메인 검색 페이지
 * 모든 검색 컴포넌트를 통합한 완전한 검색 인터페이스
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

// 컴포넌트 임포트
import SearchBar from '../components/SearchBar';
import DateRangeFilter from '../components/DateRangeFilter';
import MultiSelectFilter from '../components/MultiSelectFilter';
import SortOptions from '../components/SortOptions';
import ActiveFilters from '../components/ActiveFilters';
import SearchResults from '../components/SearchResults';
import Pagination from '../components/Pagination';
import { HighlightStyles } from '../components/HighlightText';

// 커스텀 훅
import useSearch from '../hooks/useSearch';

const SearchPage = () => {
  const router = useRouter();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const {
    // 상태
    searchQuery,
    filters,
    sortBy,
    currentPage,
    pageSize,
    advancedSearch,
    
    // 결과
    searchResults,
    totalCount,
    totalPages,
    loading,
    error,
    suggestions,
    metadata,
    hasActiveFilters,
    
    // 액션
    handleSearchQueryChange,
    handleSearch,
    handleFiltersChange,
    handleRemoveFilter,
    handleClearAllFilters,
    handleSortChange,
    handlePageChange,
    handleAdvancedToggle
  } = useSearch();

  // 페이지 제목 생성
  const pageTitle = searchQuery 
    ? `"${searchQuery}" 검색 결과 - My AI News`
    : '검색 - My AI News';

  // 필터 변경 핸들러들
  const handleDateRangeChange = (dateRange) => {
    handleFiltersChange({ ...filters, dateRange });
  };

  const handleAIModelsChange = (aiModels) => {
    handleFiltersChange({ ...filters, aiModels });
  };

  const handleAuthorsChange = (authors) => {
    handleFiltersChange({ ...filters, authors });
  };

  // 모바일 필터 토글
  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };

  // 검색 제안 적용
  const applySuggestion = (suggestion) => {
    handleSearch(suggestion);
  };

  // 키보드 단축키 (ESC로 모바일 필터 닫기)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileFilterOpen) {
        setIsMobileFilterOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileFilterOpen]);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={
          searchQuery 
            ? `"${searchQuery}"에 대한 검색 결과 ${totalCount}개를 확인하세요.`
            : 'My AI News에서 원하는 기사를 검색하세요.'
        } />
        <meta name="robots" content="noindex" />
      </Head>

      <HighlightStyles />

      <div className="search-page">
        {/* 헤더 */}
        <header className="search-header">
          <div className="container">
            <div className="header-content">
              <Link href="/" className="logo">
                <h1>My AI News</h1>
              </Link>
              
              <nav className="header-nav">
                <Link href="/">홈</Link>
                <Link href="/admin">관리자</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="search-main">
          <div className="container">
            {/* 검색 섹션 */}
            <section className="search-section">
              <div className="search-bar-container">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  onSearch={handleSearch}
                  loading={loading}
                  placeholder="기사를 검색하세요..."
                  className="main-search-bar"
                />
                
                {/* 고급 검색 옵션 토글 */}
                <div className="advanced-options">
                  <label className="advanced-toggle">
                    <input
                      type="checkbox"
                      checked={advancedSearch}
                      onChange={(e) => handleAdvancedToggle(e.target.checked)}
                    />
                    <span className="toggle-text">고급 검색 (퍼지 매칭, 동의어)</span>
                  </label>
                </div>
              </div>

              {/* 검색 제안 */}
              {suggestions && (suggestions.corrections.length > 0 || suggestions.related.length > 0) && (
                <div className="search-suggestions">
                  {suggestions.corrections.length > 0 && (
                    <div className="suggestion-group">
                      <span className="suggestion-label">혹시 이것을 찾으셨나요?</span>
                      {suggestions.corrections.map((correction, index) => (
                        <div key={index} className="correction-group">
                          {correction.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              className="suggestion-button"
                              onClick={() => applySuggestion(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {suggestions.related.length > 0 && (
                    <div className="suggestion-group">
                      <span className="suggestion-label">관련 검색어:</span>
                      {suggestions.related.map((related, index) => (
                        <button
                          key={index}
                          className="suggestion-button"
                          onClick={() => applySuggestion(related)}
                        >
                          {related}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 필터 및 결과 섹션 */}
            <section className="content-section">
              <div className="content-layout">
                {/* 사이드바 필터 (데스크톱) */}
                <aside className="filters-sidebar desktop-only">
                  <div className="filters-container">
                    <h2 className="filters-title">필터</h2>
                    
                    <DateRangeFilter
                      startDate={filters.dateRange.start}
                      endDate={filters.dateRange.end}
                      onChange={handleDateRangeChange}
                      minDate={metadata.dateRange.earliest?.split('T')[0]}
                      maxDate={metadata.dateRange.latest?.split('T')[0]}
                    />
                    
                    <MultiSelectFilter
                      title="AI 모델"
                      options={metadata.availableModels.map(model => ({
                        value: model,
                        label: model,
                        count: null
                      }))}
                      selectedValues={filters.aiModels}
                      onChange={handleAIModelsChange}
                      searchable={false}
                    />
                    
                    <MultiSelectFilter
                      title="작성자"
                      options={metadata.availableAuthors.map(author => ({
                        value: author,
                        label: author,
                        count: null
                      }))}
                      selectedValues={filters.authors}
                      onChange={handleAuthorsChange}
                      searchable={true}
                      maxHeight="250px"
                    />
                  </div>
                </aside>

                {/* 메인 결과 영역 */}
                <div className="results-area">
                  {/* 모바일 필터 버튼 */}
                  <div className="mobile-filter-header mobile-only">
                    <button 
                      className="mobile-filter-button"
                      onClick={toggleMobileFilter}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                      </svg>
                      필터
                      {hasActiveFilters && <span className="filter-badge" />}
                    </button>
                    
                    <SortOptions
                      value={sortBy}
                      onChange={handleSortChange}
                      hasQuery={!!searchQuery}
                      showLabel={false}
                    />
                  </div>

                  {/* 데스크톱 정렬 옵션 */}
                  <div className="desktop-sort desktop-only">
                    <SortOptions
                      value={sortBy}
                      onChange={handleSortChange}
                      hasQuery={!!searchQuery}
                    />
                  </div>

                  {/* 활성 필터 표시 */}
                  <ActiveFilters
                    searchQuery={searchQuery}
                    filters={filters}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                  />

                  {/* 검색 결과 */}
                  <SearchResults
                    articles={searchResults}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    searchQuery={searchQuery}
                    loading={loading}
                    error={error}
                    showKeywords={true}
                    showReadingTime={true}
                    showSource={true}
                    layout="grid"
                  />

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      showInfo={true}
                      showSizeSelector={true}
                    />
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* 모바일 필터 모달 */}
        {isMobileFilterOpen && (
          <div className="mobile-filter-modal">
            <div className="modal-backdrop" onClick={toggleMobileFilter} />
            <div className="modal-content">
              <div className="modal-header">
                <h3>필터</h3>
                <button className="close-button" onClick={toggleMobileFilter}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              
              <div className="modal-body">
                <DateRangeFilter
                  startDate={filters.dateRange.start}
                  endDate={filters.dateRange.end}
                  onChange={handleDateRangeChange}
                  minDate={metadata.dateRange.earliest?.split('T')[0]}
                  maxDate={metadata.dateRange.latest?.split('T')[0]}
                />
                
                <MultiSelectFilter
                  title="AI 모델"
                  options={metadata.availableModels.map(model => ({
                    value: model,
                    label: model
                  }))}
                  selectedValues={filters.aiModels}
                  onChange={handleAIModelsChange}
                  searchable={false}
                />
                
                <MultiSelectFilter
                  title="작성자"
                  options={metadata.availableAuthors.map(author => ({
                    value: author,
                    label: author
                  }))}
                  selectedValues={filters.authors}
                  onChange={handleAuthorsChange}
                  searchable={true}
                  maxHeight="200px"
                />
              </div>
              
              <div className="modal-footer">
                <button 
                  className="apply-button"
                  onClick={toggleMobileFilter}
                >
                  필터 적용
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .search-page {
          min-height: 100vh;
          background: #f9fafb;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* 헤더 */
        .search-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 0;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo h1 {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .header-nav {
          display: flex;
          gap: 24px;
        }

        .header-nav a {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .header-nav a:hover {
          color: #1f2937;
        }

        /* 메인 컨텐츠 */
        .search-main {
          padding: 32px 0;
        }

        .search-section {
          margin-bottom: 32px;
        }

        .search-bar-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .main-search-bar {
          margin-bottom: 16px;
        }

        .advanced-options {
          text-align: center;
        }

        .advanced-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
          cursor: pointer;
        }

        .advanced-toggle input[type="checkbox"] {
          margin: 0;
        }

        /* 검색 제안 */
        .search-suggestions {
          max-width: 800px;
          margin: 16px auto 0;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .suggestion-group {
          margin-bottom: 12px;
        }

        .suggestion-group:last-child {
          margin-bottom: 0;
        }

        .suggestion-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .suggestion-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 13px;
          cursor: pointer;
          margin-right: 8px;
          margin-bottom: 4px;
          transition: all 0.2s ease;
        }

        .suggestion-button:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        /* 컨텐츠 레이아웃 */
        .content-layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 32px;
        }

        .filters-sidebar {
          background: white;
          border-radius: 8px;
          padding: 24px;
          height: fit-content;
          position: sticky;
          top: 32px;
        }

        .filters-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 20px 0;
        }

        .filters-container > :global(*) {
          margin-bottom: 24px;
        }

        .filters-container > :global(*:last-child) {
          margin-bottom: 0;
        }

        .results-area {
          min-width: 0;
        }

        .desktop-sort {
          margin-bottom: 24px;
        }

        /* 모바일 필터 */
        .mobile-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding: 16px;
          background: white;
          border-radius: 8px;
        }

        .mobile-filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
        }

        .mobile-filter-button svg {
          width: 16px;
          height: 16px;
          stroke-width: 2;
        }

        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        /* 모바일 필터 모달 */
        .mobile-filter-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          position: absolute;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 400px;
          height: 100%;
          background: white;
          display: flex;
          flex-direction: column;
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
        }

        .close-button svg {
          width: 20px;
          height: 20px;
          stroke-width: 2;
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .modal-body > :global(*) {
          margin-bottom: 24px;
        }

        .modal-body > :global(*:last-child) {
          margin-bottom: 0;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .apply-button {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
        }

        /* 반응형 */
        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }

          .search-main {
            padding: 24px 0;
          }

          .content-layout {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .desktop-only {
            display: none;
          }

          .mobile-only {
            display: block;
          }

          .modal-content {
            width: 100%;
            max-width: none;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .search-page {
            background: #111827;
          }

          .search-header {
            background: #1f2937;
            border-color: #374151;
          }

          .logo h1 {
            color: #f9fafb;
          }

          .header-nav a {
            color: #9ca3af;
          }

          .header-nav a:hover {
            color: #f9fafb;
          }

          .filters-sidebar,
          .mobile-filter-header,
          .search-suggestions {
            background: #1f2937;
            border-color: #374151;
          }

          .filters-title {
            color: #f9fafb;
          }

          .suggestion-label {
            color: #d1d5db;
          }

          .suggestion-button {
            background: #374151;
            border-color: #4b5563;
            color: #d1d5db;
          }

          .suggestion-button:hover {
            background: #4b5563;
            border-color: #6b7280;
          }

          .modal-content {
            background: #1f2937;
          }

          .modal-header {
            border-color: #374151;
          }

          .modal-header h3 {
            color: #f9fafb;
          }

          .close-button {
            color: #9ca3af;
          }

          .modal-footer {
            border-color: #374151;
          }
        }
      `}</style>
    </>
  );
};

export default SearchPage;