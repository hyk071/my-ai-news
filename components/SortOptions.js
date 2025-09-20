/**
 * SortOptions 컴포넌트
 * 드롭다운 형태의 정렬 옵션 (최신순, 오래된순, 제목순, 관련성순)
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const SortOptions = ({
  value = 'newest',
  onChange,
  hasQuery = false,
  className = '',
  disabled = false,
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 정렬 옵션들
  const sortOptions = [
    {
      value: 'newest',
      label: '최신순',
      description: '최근에 작성된 기사부터',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      value: 'oldest',
      label: '오래된순',
      description: '오래된 기사부터',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 22V2M7 19h10.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H18" />
        </svg>
      )
    },
    {
      value: 'title',
      label: '제목순',
      description: '제목 알파벳 순서',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      )
    }
  ];

  // 관련성순은 검색어가 있을 때만 표시
  if (hasQuery) {
    sortOptions.unshift({
      value: 'relevance',
      label: '관련성순',
      description: '검색어와 가장 관련성 높은 순서',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      )
    });
  }

  // 현재 선택된 옵션
  const selectedOption = sortOptions.find(option => option.value === value) || sortOptions[0];

  // 옵션 선택 처리
  const handleOptionSelect = useCallback((optionValue) => {
    if (optionValue !== value) {
      onChange && onChange(optionValue);
    }
    setIsOpen(false);
  }, [value, onChange]);

  // 드롭다운 토글
  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [isOpen, disabled]);

  // 외부 클릭시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleDropdown();
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = sortOptions.findIndex(opt => opt.value === value);
          const nextIndex = (currentIndex + 1) % sortOptions.length;
          handleOptionSelect(sortOptions[nextIndex].value);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const currentIndex = sortOptions.findIndex(opt => opt.value === value);
          const prevIndex = currentIndex === 0 ? sortOptions.length - 1 : currentIndex - 1;
          handleOptionSelect(sortOptions[prevIndex].value);
        }
        break;
    }
  }, [disabled, isOpen, toggleDropdown, value, sortOptions, handleOptionSelect]);

  return (
    <div className={`sort-options ${className}`} ref={dropdownRef}>
      {showLabel && (
        <label className="sort-label">정렬</label>
      )}
      
      <div className="sort-dropdown">
        <button
          className={`sort-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          type="button"
        >
          <div className="selected-option">
            <span className="option-icon">
              {selectedOption.icon}
            </span>
            <div className="option-text">
              <span className="option-label">{selectedOption.label}</span>
              <span className="option-description">{selectedOption.description}</span>
            </div>
          </div>
          
          <svg 
            className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>

        {isOpen && (
          <div className="sort-menu">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                className={`sort-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
                type="button"
              >
                <span className="option-icon">
                  {option.icon}
                </span>
                <div className="option-text">
                  <span className="option-label">{option.label}</span>
                  <span className="option-description">{option.description}</span>
                </div>
                {option.value === value && (
                  <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .sort-options {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sort-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .sort-dropdown {
          position: relative;
        }

        .sort-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .sort-trigger:hover:not(.disabled) {
          border-color: #9ca3af;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .sort-trigger.open {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sort-trigger.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f9fafb;
        }

        .selected-option {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .option-icon {
          width: 18px;
          height: 18px;
          color: #6b7280;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-label {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .option-description {
          font-size: 12px;
          color: #6b7280;
        }

        .dropdown-arrow {
          width: 16px;
          height: 16px;
          color: #6b7280;
          transition: transform 0.2s ease;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .sort-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          margin-top: 4px;
          overflow: hidden;
        }

        .sort-option {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: white;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
          text-align: left;
        }

        .sort-option:hover {
          background: #f9fafb;
        }

        .sort-option.selected {
          background: #eff6ff;
        }

        .sort-option.selected .option-icon {
          color: #3b82f6;
        }

        .sort-option.selected .option-label {
          color: #1e40af;
          font-weight: 600;
        }

        .check-icon {
          width: 16px;
          height: 16px;
          color: #3b82f6;
          stroke-width: 2;
          margin-left: auto;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .sort-trigger {
            padding: 10px 14px;
          }

          .option-label {
            font-size: 13px;
          }

          .option-description {
            font-size: 11px;
          }

          .sort-option {
            padding: 10px 14px;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .sort-label {
            color: #d1d5db;
          }

          .sort-trigger {
            background: #1f2937;
            border-color: #374151;
          }

          .sort-trigger:hover:not(.disabled) {
            border-color: #4b5563;
          }

          .sort-trigger.open {
            border-color: #60a5fa;
          }

          .sort-trigger.disabled {
            background: #374151;
          }

          .option-label {
            color: #f9fafb;
          }

          .option-description {
            color: #9ca3af;
          }

          .option-icon {
            color: #9ca3af;
          }

          .dropdown-arrow {
            color: #9ca3af;
          }

          .sort-menu {
            background: #1f2937;
            border-color: #374151;
          }

          .sort-option {
            background: #1f2937;
          }

          .sort-option:hover {
            background: #374151;
          }

          .sort-option.selected {
            background: #1e3a8a;
          }

          .sort-option.selected .option-icon {
            color: #60a5fa;
          }

          .sort-option.selected .option-label {
            color: #bfdbfe;
          }

          .check-icon {
            color: #60a5fa;
          }
        }

        /* 접근성 개선 */
        .sort-trigger:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sort-option:focus {
          outline: none;
          background: #f3f4f6;
        }

        @media (prefers-color-scheme: dark) {
          .sort-option:focus {
            background: #4b5563;
          }
        }
      `}</style>
    </div>
  );
};

export default SortOptions;