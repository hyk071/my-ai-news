/**
 * SearchResults 컴포넌트
 * 검색 결과 기사 목록 렌더링, 빈 결과 상태, 로딩 상태 처리
 */

import { useMemo } from 'react';
import ArticleCard from './ArticleCard';

const SearchResults = ({
  articles = [],
  totalCount = 0,
  currentPage = 1,
  totalPages = 0,
  searchQuery = '',
  loading = false,
  error = null,
  showKeywords = false,
  showReadingTime = false,
  showSource = true,
  layout = 'grid', // 'grid' | 'list'
  className = ''
}) => {
  // 로딩 스켈레톤 생성
  const skeletonItems = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="skeleton-card">
        <div className="skeleton-title" />
        <div className="skeleton-content">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
        <div className="skeleton-meta">
          <div className="skeleton-author" />
          <div className="skeleton-date" />
        </div>
      </div>
    ));
  }, []);

  // 에러 상태
  if (error) {
    return (
      <div className={`search-results error-state ${className}`}>
        <div className="error-container">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h3 className="error-title">검색 중 오류가 발생했습니다</h3>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>

        <style jsx>{`
          .error-state {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            padding: 40px 20px;
          }

          .error-container {
            text-align: center;
            max-width: 400px;
          }

          .error-icon {
            width: 64px;
            height: 64px;
            color: #ef4444;
            margin-bottom: 16px;
            stroke-width: 1.5;
          }

          .error-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }

          .error-message {
            font-size: 14px;
            color: #6b7280;
            margin: 0 0 24px 0;
            line-height: 1.5;
          }

          .retry-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }

          .retry-button:hover {
            background: #2563eb;
          }
        `}</style>
      </div>
    );
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className={`search-results loading-state ${className}`}>
        <div className="results-header">
          <div className="skeleton-count" />
        </div>
        
        <div className={`results-grid ${layout}`}>
          {skeletonItems}
        </div>

        <style jsx>{`
          .loading-state {
            animation: pulse 1.5s ease-in-out infinite;
          }

          .skeleton-count {
            height: 20px;
            width: 200px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 24px;
          }

          .skeleton-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
          }

          .skeleton-title {
            height: 20px;
            background: #e5e7eb;
            border-radius: 4px;
            margin-bottom: 12px;
          }

          .skeleton-content {
            margin-bottom: 16px;
          }

          .skeleton-line {
            height: 14px;
            background: #f3f4f6;
            border-radius: 4px;
            margin-bottom: 8px;
          }

          .skeleton-line.short {
            width: 70%;
          }

          .skeleton-meta {
            display: flex;
            gap: 12px;
          }

          .skeleton-author {
            height: 12px;
            width: 80px;
            background: #f3f4f6;
            border-radius: 4px;
          }

          .skeleton-date {
            height: 12px;
            width: 100px;
            background: #f3f4f6;
            border-radius: 4px;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    );
  }

  // 빈 결과 상태
  if (!loading && articles.length === 0) {
    return (
      <div className={`search-results empty-state ${className}`}>
        <div className="empty-container">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          
          <h3 className="empty-title">
            {searchQuery ? '검색 결과가 없습니다' : '기사가 없습니다'}
          </h3>
          
          <p className="empty-message">
            {searchQuery ? (
              <>
                "<strong>{searchQuery}</strong>"에 대한 검색 결과를 찾을 수 없습니다.<br />
                다른 키워드로 검색해보세요.
              </>
            ) : (
              '표시할 기사가 없습니다.'
            )}
          </p>

          {searchQuery && (
            <div className="empty-suggestions">
              <h4 className="suggestions-title">검색 팁:</h4>
              <ul className="suggestions-list">
                <li>키워드를 다르게 입력해보세요</li>
                <li>더 일반적인 용어를 사용해보세요</li>
                <li>필터 조건을 확인해보세요</li>
                <li>맞춤법을 확인해보세요</li>
              </ul>
            </div>
          )}
        </div>

        <style jsx>{`
          .empty-state {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 400px;
            padding: 40px 20px;
          }

          .empty-container {
            text-align: center;
            max-width: 500px;
          }

          .empty-icon {
            width: 80px;
            height: 80px;
            color: #9ca3af;
            margin-bottom: 20px;
            stroke-width: 1.5;
          }

          .empty-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 12px 0;
          }

          .empty-message {
            font-size: 16px;
            color: #6b7280;
            margin: 0 0 32px 0;
            line-height: 1.6;
          }

          .empty-suggestions {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: left;
          }

          .suggestions-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin: 0 0 12px 0;
          }

          .suggestions-list {
            margin: 0;
            padding-left: 20px;
            color: #4b5563;
          }

          .suggestions-list li {
            margin-bottom: 6px;
            font-size: 14px;
            line-height: 1.5;
          }

          @media (max-width: 768px) {
            .empty-title {
              font-size: 20px;
            }

            .empty-message {
              font-size: 14px;
            }

            .empty-suggestions {
              padding: 16px;
            }
          }
        `}</style>
      </div>
    );
  }

  // 정상 결과 표시
  return (
    <div className={`search-results ${className}`}>
      {/* 결과 헤더 */}
      <div className="results-header">
        <div className="results-count">
          {searchQuery ? (
            <>
              "<strong>{searchQuery}</strong>"에 대한 검색 결과 
              <span className="count-number">{totalCount.toLocaleString()}개</span>
            </>
          ) : (
            <>
              전체 기사 <span className="count-number">{totalCount.toLocaleString()}개</span>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="page-info">
            {currentPage}페이지 / {totalPages}페이지
          </div>
        )}
      </div>

      {/* 결과 그리드/리스트 */}
      <div className={`results-grid ${layout}`}>
        {articles.map((article, index) => (
          <ArticleCard
            key={article.slug || index}
            article={article}
            type="secondary"
            searchQuery={searchQuery}
            showKeywords={showKeywords}
            showReadingTime={showReadingTime}
            showSource={showSource}
          />
        ))}
      </div>

      <style jsx>{`
        .search-results {
          width: 100%;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .results-count {
          font-size: 16px;
          color: #374151;
          line-height: 1.5;
        }

        .count-number {
          font-weight: 600;
          color: #1f2937;
          margin-left: 4px;
        }

        .page-info {
          font-size: 14px;
          color: #6b7280;
          background: #f9fafb;
          padding: 4px 12px;
          border-radius: 6px;
        }

        .results-grid.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .results-grid.list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* 모바일 반응형 */
        @media (max-width: 768px) {
          .results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .results-count {
            font-size: 14px;
          }

          .page-info {
            font-size: 12px;
          }

          .results-grid.grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .results-grid.list {
            gap: 12px;
          }
        }

        /* 다크 모드 지원 */
        @media (prefers-color-scheme: dark) {
          .results-header {
            border-color: #374151;
          }

          .results-count {
            color: #d1d5db;
          }

          .count-number {
            color: #f9fafb;
          }

          .page-info {
            background: #374151;
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchResults;