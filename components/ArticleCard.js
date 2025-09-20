/**
 * ArticleCard 컴포넌트 (검색 기능 강화)
 * 기존 ArticleCard를 확장하여 검색어 하이라이트, 읽기 시간, 키워드 표시 추가
 */

import Link from 'next/link';
import HighlightText from './HighlightText';

const ArticleCard = ({ 
  article, 
  type = 'secondary',
  searchQuery = '',
  showKeywords = false,
  showReadingTime = false,
  showSource = true,
  className = ''
}) => {
  if (!article) return null;

  // 간단한 HTML 요약 함수
  function summarize(html, len = 100) {
    if (!html) return "";
    const text = html.replace(/<[^>]+>/g, ''); // 태그 제거
    return text.length > len ? `${text.slice(0, len)}...` : text;
  }

  // 날짜 포맷 함수
  function formatKoreanDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // 읽기 시간 계산 (단어 수 기반)
  function calculateReadingTime(content) {
    if (!content) return 0;
    const text = content.replace(/<[^>]+>/g, '');
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / 200); // 분당 200단어 기준
  }

  const readingTime = showReadingTime ? 
    (article.readingTime || calculateReadingTime(article.contentHTML)) : 0;

  // 메인 기사 카드
  if (type === 'main') {
    return (
      <article className={`article-card main-card ${className}`}>
        <Link href={`/articles/${article.slug}`}>
          <div className="card-content">
            <h2 className="headline">
              <HighlightText 
                text={article.title} 
                searchQuery={searchQuery}
                maxLength={120}
              />
            </h2>
            
            <p className="summary">
              <HighlightText 
                text={summarize(article.contentHTML, 200)} 
                searchQuery={searchQuery}
                maxLength={200}
              />
            </p>
            
            <div className="meta-info">
              <div className="primary-meta">
                <span className="author">{article.author}</span>
                {showSource && article.source && (
                  <>
                    <span className="separator">·</span>
                    <span className="source">{article.source}</span>
                  </>
                )}
                <span className="separator">·</span>
                <time className="date">
                  {formatKoreanDate(article.generatedAt || article.date)}
                </time>
                {readingTime > 0 && (
                  <>
                    <span className="separator">·</span>
                    <span className="reading-time">{readingTime}분 읽기</span>
                  </>
                )}
              </div>
              
              {showKeywords && article.keywords && article.keywords.length > 0 && (
                <div className="keywords">
                  {article.keywords.slice(0, 5).map((keyword, index) => (
                    <span key={index} className="keyword-tag">
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Link>

        <style jsx>{`
          .main-card {
            background: white;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 1px solid #f3f4f6;
            transition: all 0.3s ease;
            cursor: pointer;
          }

          .main-card:hover {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .headline {
            font-size: 28px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 16px 0;
            color: #1f2937;
          }

          .summary {
            font-size: 16px;
            line-height: 1.6;
            color: #4b5563;
            margin: 0 0 20px 0;
          }

          .meta-info {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .primary-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #6b7280;
          }

          .author {
            font-weight: 600;
            color: #374151;
          }

          .source {
            background: #f3f4f6;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .separator {
            color: #d1d5db;
          }

          .reading-time {
            font-size: 12px;
            color: #9ca3af;
          }

          .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .keyword-tag {
            background: #eff6ff;
            color: #1e40af;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
          }

          @media (max-width: 768px) {
            .main-card {
              padding: 24px;
            }

            .headline {
              font-size: 24px;
            }

            .summary {
              font-size: 15px;
            }
          }
        `}</style>
      </article>
    );
  }

  // 사이드바 기사 카드
  if (type === 'sidebar') {
    return (
      <article className={`article-card sidebar-card ${className}`}>
        <Link href={`/articles/${article.slug}`}>
          <div className="card-content">
            <h3 className="title">
              <HighlightText 
                text={article.title} 
                searchQuery={searchQuery}
                maxLength={80}
              />
            </h3>
            
            <div className="meta">
              <span className="author">{article.author}</span>
              {showSource && article.source && (
                <>
                  <span className="separator">·</span>
                  <span className="source">{article.source}</span>
                </>
              )}
              <span className="separator">·</span>
              <time className="date">
                {formatKoreanDate(article.generatedAt || article.date)}
              </time>
            </div>
          </div>
        </Link>

        <style jsx>{`
          .sidebar-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            border: 1px solid #f3f4f6;
            transition: all 0.2s ease;
            cursor: pointer;
            margin-bottom: 16px;
          }

          .sidebar-card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }

          .title {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.4;
            margin: 0 0 12px 0;
            color: #1f2937;
          }

          .meta {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: #6b7280;
          }

          .author {
            font-weight: 500;
            color: #374151;
          }

          .source {
            background: #f9fafb;
            padding: 1px 6px;
            border-radius: 3px;
            font-size: 11px;
          }

          .separator {
            color: #d1d5db;
          }
        `}</style>
      </article>
    );
  }

  // 기본 (secondary) 기사 카드
  return (
    <article className={`article-card secondary-card ${className}`}>
      <Link href={`/articles/${article.slug}`}>
        <div className="card-content">
          <h3 className="title">
            <HighlightText 
              text={article.title} 
              searchQuery={searchQuery}
              maxLength={100}
            />
          </h3>
          
          <p className="summary">
            <HighlightText 
              text={summarize(article.contentHTML)} 
              searchQuery={searchQuery}
              maxLength={120}
            />
          </p>
          
          <div className="meta-info">
            <div className="primary-meta">
              <span className="author">{article.author}</span>
              {showSource && article.source && (
                <>
                  <span className="separator">·</span>
                  <span className="source">{article.source}</span>
                </>
              )}
              <span className="separator">·</span>
              <time className="date">
                {formatKoreanDate(article.generatedAt || article.date)}
              </time>
              {readingTime > 0 && (
                <>
                  <span className="separator">·</span>
                  <span className="reading-time">{readingTime}분</span>
                </>
              )}
            </div>
            
            {showKeywords && article.keywords && article.keywords.length > 0 && (
              <div className="keywords">
                {article.keywords.slice(0, 3).map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      <style jsx>{`
        .secondary-card {
          background: white;
          border-radius: 10px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .secondary-card:hover {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          margin: 0 0 12px 0;
          color: #1f2937;
        }

        .summary {
          font-size: 14px;
          line-height: 1.5;
          color: #4b5563;
          margin: 0 0 16px 0;
          flex: 1;
        }

        .meta-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: auto;
        }

        .primary-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .author {
          font-weight: 500;
          color: #374151;
        }

        .source {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .separator {
          color: #d1d5db;
        }

        .reading-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .keywords {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .keyword-tag {
          background: #f0f9ff;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .secondary-card {
            padding: 20px;
          }

          .title {
            font-size: 16px;
          }

          .summary {
            font-size: 13px;
          }

          .primary-meta {
            font-size: 12px;
          }
        }
      `}</style>
    </article>
  );
};

export default ArticleCard;