/**
 * ActiveFilters 컴포넌트
 * 적용된 필터를 태그 형태로 표시하고 개별/전체 제거 기능 제공
 */

import { useMemo, useCallback } from 'react';

const ActiveFilters = ({
  searchQuery = '',
  filters = {},
  onRemoveFilter,
  onClearAll,
  className = ''
}) => {
  // 활성 필터 태그들 생성
  const filterTags = useMemo(() => {
    const tags = [];

    // 검색 쿼리 태그
    if (searchQuery.trim()) {
      tags.push({
        type: 'query',
        label: `검색: "${searchQuery}"`,
        value: searchQuery,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )
      });
    }

    // 날짜 범위 필터
    if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
      const { start, end } = filters.dateRange;
      let dateLabel = '날짜: ';
      
      if (start && end) {
        dateLabel += `${formatDate(start)} ~ ${formatDate(end)}`;
      } else if (start) {
        dateLabel += `${formatDate(start)} 이후`;
      } else if (end) {
        dateLabel += `${formatDate(end)} 이전`;
      }

      tags.push({
        type: 'dateRange',
        label: dateLabel,
        value: filters.dateRange,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      });
    }

    // AI 모델 필터
    if (filters.aiModels && filters.aiModels.length > 0) {
      filters.aiModels.forEach(model => {
        tags.push({
          type: 'aiModel',
          label: `AI 모델: ${model}`,
          value: model,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z" />
              <path d="M21 16c.552 0 1-.448 1-1v-2c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v2c0 .552.448 1 1 1h18z" />
            </svg>
          )
        });
      });
    }

    // 작성자 필터
    if (filters.authors && filters.authors.length > 0) {
      filters.authors.forEach(author => {
        tags.push({
          type: 'author',
          label: `작성자: ${author}`,
          value: author,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )
        });
      });
    }

    return tags;
  }, [searchQuery, filters]);

  // 개별 필터 제거
  const handleRemoveFilter = useCallback((tag) => {
    if (!onRemoveFilter) return;

    switch (tag.type) {
      case 'query':
        onRemoveFilter('query', '');
        break;
      case 'dateRange':
        onRemoveFilter('dateRange', { start: '', end: '' });
        break;
      case 'aiModel':
        onRemoveFilter('aiModel', tag.value);
        break;
      case 'author':
        onRemoveFilter('author', tag.value);
        break;
    }
  }, [onRemoveFilter]);

  // 전체 필터 제거
  const handleClearAll = useCallback(() => {
    onClearAll && onClearAll();
  }, [onClearAll]);

  // 날짜 포맷팅
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // 활성 필터가 없으면 렌더링하지 않음
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <div className={`active-filters ${className}`}>
      <div className="filters-header">
        <h3 className="filters-title">
          적용된 필터 ({filterTags.length}개)
        </h3>
        
        <button
          className="clear-all-button"
          onClick={handleClearAll}
          type="button"
        >
          <svg className="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          모든 필터 제거
        </button>
      </div>

      <div className="filter-tags">
        {filterTags.map((tag, index) => (
          <div key={`${tag.type}-${index}`} className={`filter-tag ${tag.type}`}>
            <span className="tag-icon">
              {tag.icon}
            </span>
            
            <span className="tag-label">
              {tag.label}
            </span>
            
            <button
              className="remove-button"
              onClick={() => handleRemoveFilter(tag)}
              aria-label={`${tag.label} 필터 제거`}
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .active-filters {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .filters-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .clear-all-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-all-button:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .clear-icon {
          width: 14px;
          height: 14px;
          stroke-width: 2;
        }

        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .filter-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 8px 6px 10px;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .filter-tag:hover {
          border-color: #9ca3af;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-tag.query {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .filter-tag.dateRange {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .filter-tag.aiModel {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }

        .filter-tag.author {
          border-color: #f59e0b;
          background: #fffbeb;
        }

        .tag-icon {
          width: 14px;
          height: 14px;
          color: #6b7280;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .filter-tag.query .tag-icon {
          color: #3b82f6;
        }

        .filter-tag.dateRange .tag-icon {
          color: #10b981;
        }

        .filter-tag.aiModel .tag-icon {
          color: #8b5cf6;
        }

        .filter-tag.author .tag-icon {
          color: #f59e0b;
        }

        .tag-label {
          color: #374151;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .remove-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .remove-button:hover {
          background: #f3f4f6;
          color: #6b7280;
        }

        .remove-button svg {
          width: 12px;
          height: 12px;
          stroke-width: 2;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .active-filters {
            padding: 12px;
          }

          .filters-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .filters-title {
            font-size: 13px;
          }

          .clear-all-button {
            font-size: 12px;
            padding: 3px 6px;
          }

          .clear-icon {
            width: 12px;
            height: 12px;
          }

          .filter-tag {
            font-size: 12px;
            padding: 5px 6px 5px 8px;
          }

          .tag-icon {
            width: 12px;
            height: 12px;
          }

          .tag-label {
            max-width: 150px;
          }

          .remove-button {
            width: 16px;
            height: 16px;
          }

          .remove-button svg {
            width: 10px;
            height: 10px;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .active-filters {
            background: #1f2937;
            border-color: #374151;
          }

          .filters-title {
            color: #f9fafb;
          }

          .clear-all-button {
            color: #9ca3af;
          }

          .clear-all-button:hover {
            background: #374151;
            color: #d1d5db;
          }

          .filter-tag {
            background: #374151;
            border-color: #4b5563;
          }

          .filter-tag:hover {
            border-color: #6b7280;
          }

          .filter-tag.query {
            background: #1e3a8a;
            border-color: #3b82f6;
          }

          .filter-tag.dateRange {
            background: #064e3b;
            border-color: #10b981;
          }

          .filter-tag.aiModel {
            background: #581c87;
            border-color: #8b5cf6;
          }

          .filter-tag.author {
            background: #92400e;
            border-color: #f59e0b;
          }

          .tag-label {
            color: #f9fafb;
          }

          .tag-icon {
            color: #9ca3af;
          }

          .filter-tag.query .tag-icon {
            color: #60a5fa;
          }

          .filter-tag.dateRange .tag-icon {
            color: #34d399;
          }

          .filter-tag.aiModel .tag-icon {
            color: #a78bfa;
          }

          .filter-tag.author .tag-icon {
            color: #fbbf24;
          }

          .remove-button {
            color: #6b7280;
          }

          .remove-button:hover {
            background: #4b5563;
            color: #9ca3af;
          }
        }

        /* 애니메이션 */
        .filter-tag {
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ActiveFilters;