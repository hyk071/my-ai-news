/**
 * MultiSelectFilter 컴포넌트
 * 체크박스 기반 다중 선택 필터 (AI 모델, 작성자 등에 재사용 가능)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const MultiSelectFilter = ({
  title = '필터',
  options = [],
  selectedValues = [],
  onChange,
  maxHeight = '200px',
  searchable = true,
  showCount = true,
  className = '',
  disabled = false,
  placeholder = '검색...',
  emptyMessage = '옵션이 없습니다.',
  maxDisplayItems = 100
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 검색 필터링된 옵션들
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options.slice(0, maxDisplayItems);
    }

    const query = searchQuery.toLowerCase();
    return options
      .filter(option => {
        const label = typeof option === 'string' ? option : option.label;
        return label.toLowerCase().includes(query);
      })
      .slice(0, maxDisplayItems);
  }, [options, searchQuery, maxDisplayItems]);

  // 선택된 항목들의 정보
  const selectedInfo = useMemo(() => {
    const selectedSet = new Set(selectedValues);
    const selectedItems = options.filter(option => {
      const value = typeof option === 'string' ? option : option.value;
      return selectedSet.has(value);
    });

    return {
      count: selectedItems.length,
      items: selectedItems
    };
  }, [options, selectedValues]);

  // 체크박스 변경 처리
  const handleCheckboxChange = useCallback((optionValue, checked) => {
    let newSelectedValues;
    
    if (checked) {
      newSelectedValues = [...selectedValues, optionValue];
    } else {
      newSelectedValues = selectedValues.filter(value => value !== optionValue);
    }

    onChange && onChange(newSelectedValues);
  }, [selectedValues, onChange]);

  // 전체 선택/해제
  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions.map(option => 
      typeof option === 'string' ? option : option.value
    );
    
    const isAllSelected = allValues.every(value => selectedValues.includes(value));
    
    if (isAllSelected) {
      // 전체 해제
      const newSelectedValues = selectedValues.filter(value => !allValues.includes(value));
      onChange && onChange(newSelectedValues);
    } else {
      // 전체 선택
      const newSelectedValues = [...new Set([...selectedValues, ...allValues])];
      onChange && onChange(newSelectedValues);
    }
  }, [filteredOptions, selectedValues, onChange]);

  // 초기화
  const handleReset = useCallback(() => {
    onChange && onChange([]);
    setSearchQuery('');
  }, [onChange]);

  // 검색어 변경
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  // 전체 선택 상태 확인
  const selectAllState = useMemo(() => {
    if (filteredOptions.length === 0) return 'none';
    
    const filteredValues = filteredOptions.map(option => 
      typeof option === 'string' ? option : option.value
    );
    
    const selectedFilteredCount = filteredValues.filter(value => 
      selectedValues.includes(value)
    ).length;

    if (selectedFilteredCount === 0) return 'none';
    if (selectedFilteredCount === filteredValues.length) return 'all';
    return 'partial';
  }, [filteredOptions, selectedValues]);

  return (
    <div className={`multi-select-filter ${className}`}>
      <div className="filter-header">
        <button
          className="filter-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          type="button"
        >
          <h3 className="filter-title">
            {title}
            {showCount && selectedInfo.count > 0 && (
              <span className="selected-count">({selectedInfo.count})</span>
            )}
          </h3>
          <svg 
            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {selectedInfo.count > 0 && (
          <button 
            className="reset-button"
            onClick={handleReset}
            disabled={disabled}
            type="button"
          >
            초기화
          </button>
        )}
      </div>

      {/* 선택된 항목들 미리보기 */}
      {selectedInfo.count > 0 && !isExpanded && (
        <div className="selected-preview">
          {selectedInfo.items.slice(0, 3).map((item, index) => {
            const label = typeof item === 'string' ? item : item.label;
            return (
              <span key={index} className="selected-tag">
                {label}
              </span>
            );
          })}
          {selectedInfo.count > 3 && (
            <span className="more-count">+{selectedInfo.count - 3}</span>
          )}
        </div>
      )}

      {/* 확장된 필터 옵션들 */}
      {isExpanded && (
        <div className="filter-content">
          {/* 검색 입력 */}
          {searchable && options.length > 5 && (
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={disabled}
              />
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          )}

          {/* 전체 선택/해제 */}
          {filteredOptions.length > 1 && (
            <div className="select-all-container">
              <label className="checkbox-label select-all-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={selectAllState === 'all'}
                  ref={checkbox => {
                    if (checkbox) {
                      checkbox.indeterminate = selectAllState === 'partial';
                    }
                  }}
                  onChange={handleSelectAll}
                  disabled={disabled}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-text">
                  전체 선택 ({filteredOptions.length}개)
                </span>
              </label>
            </div>
          )}

          {/* 옵션 목록 */}
          <div className="options-container" style={{ maxHeight }}>
            {filteredOptions.length === 0 ? (
              <div className="empty-message">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option, index) => {
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                const count = typeof option === 'object' ? option.count : null;
                const isSelected = selectedValues.includes(value);

                return (
                  <label key={index} className="checkbox-label option-label">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(value, e.target.checked)}
                      disabled={disabled}
                    />
                    <span className="checkbox-custom" />
                    <span className="checkbox-text">
                      {label}
                      {count !== null && (
                        <span className="option-count">({count})</span>
                      )}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .multi-select-filter {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .filter-toggle {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex: 1;
          text-align: left;
        }

        .filter-toggle:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filter-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .selected-count {
          font-size: 14px;
          font-weight: 500;
          color: #3b82f6;
        }

        .expand-icon {
          width: 16px;
          height: 16px;
          color: #6b7280;
          transition: transform 0.2s ease;
          stroke-width: 2;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .reset-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .reset-button:hover:not(:disabled) {
          background: #e5e7eb;
          color: #374151;
        }

        .reset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .selected-preview {
          padding: 12px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          background: #f0f9ff;
          border-bottom: 1px solid #e5e7eb;
        }

        .selected-tag {
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .more-count {
          background: #6b7280;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .filter-content {
          padding: 16px 20px;
        }

        .search-container {
          position: relative;
          margin-bottom: 16px;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input:disabled {
          background: #f9fafb;
          opacity: 0.6;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #6b7280;
          stroke-width: 2;
        }

        .select-all-container {
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .select-all-label {
          font-weight: 600;
          color: #374151;
        }

        .options-container {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }

        .options-container::-webkit-scrollbar {
          width: 6px;
        }

        .options-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .options-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .options-container::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-radius: 4px;
        }

        .option-label:hover {
          background: #f9fafb;
        }

        .checkbox-input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .checkbox-custom {
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-radius: 3px;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 2px;
          top: -1px;
          width: 8px;
          height: 12px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-input:indeterminate + .checkbox-custom {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-input:indeterminate + .checkbox-custom::after {
          content: '';
          position: absolute;
          left: 2px;
          top: 6px;
          width: 8px;
          height: 2px;
          background: white;
        }

        .checkbox-text {
          font-size: 14px;
          color: #374151;
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .option-count {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .empty-message {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          padding: 20px;
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .multi-select-filter {
            background: #1f2937;
            border-color: #374151;
          }

          .filter-header {
            background: #374151;
            border-color: #4b5563;
          }

          .filter-title {
            color: #f9fafb;
          }

          .selected-count {
            color: #60a5fa;
          }

          .expand-icon {
            color: #9ca3af;
          }

          .reset-button {
            color: #9ca3af;
          }

          .reset-button:hover:not(:disabled) {
            background: #4b5563;
            color: #d1d5db;
          }

          .selected-preview {
            background: #1e3a8a;
            border-color: #4b5563;
          }

          .option-label:hover {
            background: #374151;
          }

          .checkbox-custom {
            border-color: #4b5563;
          }

          .checkbox-text {
            color: #d1d5db;
          }

          .option-count {
            color: #9ca3af;
          }

          .search-input {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }

          .search-input:focus {
            border-color: #60a5fa;
          }

          .search-icon {
            color: #9ca3af;
          }

          .empty-message {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

export default MultiSelectFilter;