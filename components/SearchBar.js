/**
 * SearchBar 컴포넌트
 * 검색 입력 필드, 검색 버튼, 디바운싱, 로딩 상태 처리
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const SearchBar = ({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder = '기사를 검색하세요...', 
  loading = false,
  showSuggestions = true,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const router = useRouter();

  // 검색 히스토리 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(history.slice(0, 5)); // 최근 5개만
    }
  }, []);

  // 입력값 변경 처리
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }

    // 검색 제안 표시
    if (newValue.trim() && showSuggestions) {
      // 검색 히스토리에서 매칭되는 항목 찾기
      const matchingSuggestions = searchHistory.filter(item =>
        item.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(matchingSuggestions);
      setShowSuggestionsList(true);
    } else {
      setShowSuggestionsList(false);
    }
  }, [onChange, searchHistory, showSuggestions]);

  // 검색 실행
  const handleSearch = useCallback((searchQuery = inputValue) => {
    const query = searchQuery.trim();
    if (!query) return;

    // 검색 히스토리에 추가
    if (typeof window !== 'undefined') {
      const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }

    setShowSuggestionsList(false);

    if (onSearch) {
      onSearch(query);
    } else {
      // 기본 동작: 검색 페이지로 이동
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [inputValue, searchHistory, onSearch, router]);

  // 엔터키 처리
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
    }
  }, [handleSearch]);

  // 제안 항목 클릭
  const handleSuggestionClick = useCallback((suggestion) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  // 외부 클릭시 제안 목록 숨기기
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestionsList(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 키보드 단축키 (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`search-bar ${className}`}>
      <div className="search-input-container">
        <div className="search-input-wrapper">
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (inputValue.trim() && suggestions.length > 0) {
                setShowSuggestionsList(true);
              }
            }}
            disabled={loading}
          />
          
          <button
            className={`search-button ${loading ? 'loading' : ''}`}
            onClick={() => handleSearch()}
            disabled={loading || !inputValue.trim()}
            aria-label="검색"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </button>
        </div>

        {/* 검색 제안 목록 */}
        {showSuggestionsList && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <svg className="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 키보드 단축키 힌트 */}
      <div className="search-hint">
        <kbd>Ctrl</kbd> + <kbd>K</kbd>로 빠른 검색
      </div>

      <style jsx>{`
        .search-bar {
          position: relative;
          width: 100%;
          max-width: 600px;
        }

        .search-input-container {
          position: relative;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .search-input-wrapper:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input {
          flex: 1;
          padding: 16px 20px;
          border: none;
          outline: none;
          font-size: 16px;
          background: transparent;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-button {
          padding: 16px 20px;
          border: none;
          background: #3b82f6;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .search-button.loading {
          background: #6b7280;
        }

        .search-icon {
          width: 20px;
          height: 20px;
          stroke-width: 2;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #f9fafb;
        }

        .suggestion-icon {
          width: 16px;
          height: 16px;
          color: #6b7280;
          stroke-width: 2;
        }

        .search-hint {
          margin-top: 8px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
        }

        .search-hint kbd {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 11px;
          font-family: monospace;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .search-input {
            padding: 14px 16px;
            font-size: 16px; /* iOS 줌 방지 */
          }

          .search-button {
            padding: 14px 16px;
          }

          .search-hint {
            display: none;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .search-input-wrapper {
            background: #1f2937;
            border-color: #374151;
          }

          .search-input {
            color: white;
          }

          .search-input::placeholder {
            color: #9ca3af;
          }

          .suggestions-list {
            background: #1f2937;
            border-color: #374151;
          }

          .suggestion-item {
            border-color: #374151;
          }

          .suggestion-item:hover {
            background: #374151;
          }

          .search-hint kbd {
            background: #374151;
            border-color: #4b5563;
            color: #d1d5db;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;