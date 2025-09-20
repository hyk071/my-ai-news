/**
 * Pagination 컴포넌트
 * 페이지 번호 표시, 이전/다음 버튼, 페이지 변경 처리
 */

import { useMemo, useCallback } from 'react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
  showInfo = true,
  showSizeSelector = false,
  pageSizeOptions = [10, 20, 50, 100],
  maxVisiblePages = 7,
  className = '',
  disabled = false
}) => {
  // 표시할 페이지 번호들 계산
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // 끝에서 시작점 조정
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages = [];
    
    // 첫 페이지 추가
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // 중간 페이지들 추가
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 마지막 페이지 추가
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, totalPages, maxVisiblePages]);

  // 페이지 변경 처리
  const handlePageChange = useCallback((page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !disabled) {
      onPageChange && onPageChange(page);
      
      // 페이지 변경시 스크롤 위치 조정
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [currentPage, totalPages, onPageChange, disabled]);

  // 페이지 크기 변경 처리
  const handlePageSizeChange = useCallback((newPageSize) => {
    if (onPageChange) {
      // 현재 첫 번째 아이템의 인덱스 계산
      const currentFirstItem = (currentPage - 1) * pageSize;
      // 새로운 페이지 크기에서의 페이지 번호 계산
      const newPage = Math.floor(currentFirstItem / newPageSize) + 1;
      onPageChange(newPage, newPageSize);
    }
  }, [currentPage, pageSize, onPageChange]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e, page) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePageChange(page);
    }
  }, [handlePageChange]);

  // 페이지가 1개 이하면 렌더링하지 않음
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className={`pagination ${className}`}>
      {/* 페이지 정보 */}
      {showInfo && (
        <div className="pagination-info">
          <span className="item-range">
            {startItem.toLocaleString()} - {endItem.toLocaleString()}
          </span>
          <span className="total-count">
            / {totalCount.toLocaleString()}개
          </span>
        </div>
      )}

      {/* 페이지 네비게이션 */}
      <nav className="pagination-nav" aria-label="페이지 네비게이션">
        {/* 이전 페이지 버튼 */}
        <button
          className={`nav-button prev ${currentPage === 1 ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="이전 페이지"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          <span className="nav-text">이전</span>
        </button>

        {/* 페이지 번호들 */}
        <div className="page-numbers">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                className={`page-number ${page === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
                onKeyDown={(e) => handleKeyDown(e, page)}
                disabled={disabled}
                aria-label={`${page}페이지`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* 다음 페이지 버튼 */}
        <button
          className={`nav-button next ${currentPage === totalPages ? 'disabled' : ''}`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="다음 페이지"
        >
          <span className="nav-text">다음</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </nav>

      {/* 페이지 크기 선택기 */}
      {showSizeSelector && (
        <div className="page-size-selector">
          <label htmlFor="page-size" className="size-label">
            페이지당 항목 수:
          </label>
          <select
            id="page-size"
            className="size-select"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={disabled}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>
                {size}개
              </option>
            ))}
          </select>
        </div>
      )}

      <style jsx>{`
        .pagination {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 24px 0;
        }

        .pagination-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #6b7280;
        }

        .item-range {
          font-weight: 500;
          color: #374151;
        }

        .total-count {
          color: #9ca3af;
        }

        .pagination-nav {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-button:hover:not(.disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .nav-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f9fafb;
        }

        .nav-button svg {
          width: 16px;
          height: 16px;
          stroke-width: 2;
        }

        .nav-text {
          font-size: 13px;
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-number {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .page-number:hover:not(.active):not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .page-number.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .page-number:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ellipsis {
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 14px;
        }

        .page-size-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .size-label {
          color: #374151;
          font-weight: 500;
        }

        .size-select {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          color: #374151;
          font-size: 13px;
          cursor: pointer;
        }

        .size-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .size-select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f9fafb;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .pagination {
            gap: 12px;
          }

          .pagination-nav {
            gap: 4px;
          }

          .nav-button {
            padding: 6px 10px;
            font-size: 13px;
          }

          .nav-text {
            display: none;
          }

          .page-number {
            min-width: 36px;
            height: 36px;
            font-size: 13px;
          }

          .ellipsis {
            min-width: 36px;
            height: 36px;
          }

          .page-size-selector {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }

          .size-label {
            font-size: 12px;
          }

          .size-select {
            font-size: 12px;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .pagination-info {
            color: #9ca3af;
          }

          .item-range {
            color: #d1d5db;
          }

          .total-count {
            color: #6b7280;
          }

          .nav-button {
            background: #1f2937;
            border-color: #374151;
            color: #d1d5db;
          }

          .nav-button:hover:not(.disabled) {
            background: #374151;
            border-color: #4b5563;
          }

          .nav-button.disabled {
            background: #374151;
          }

          .page-number {
            background: #1f2937;
            border-color: #374151;
            color: #d1d5db;
          }

          .page-number:hover:not(.active):not(:disabled) {
            background: #374151;
            border-color: #4b5563;
          }

          .page-number.active {
            background: #3b82f6;
            border-color: #3b82f6;
            color: white;
          }

          .ellipsis {
            color: #6b7280;
          }

          .size-label {
            color: #d1d5db;
          }

          .size-select {
            background: #1f2937;
            border-color: #374151;
            color: #d1d5db;
          }

          .size-select:disabled {
            background: #374151;
          }
        }

        /* 접근성 개선 */
        .nav-button:focus,
        .page-number:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .size-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Pagination;