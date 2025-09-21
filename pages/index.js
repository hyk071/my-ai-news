// pages/index.js
import fs from "fs";
import path from "path";
import Link from "next/link";
import SearchBar from "../components/SearchBar";

// 간단한 HTML 요약 함수
function summarize(html, len = 100) {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, ''); // 태그 제거
  return text.length > len ? `${text.slice(0, len)}...` : text;
}

// 날짜 포맷 함수
function formatKoreanDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' });
}

// 기사 카드를 렌더링하는 컴포넌트
function ArticleCard({ article, type = 'secondary' }) {
  if (!article) return null;

  if (type === 'main') {
    return (
      <div className="article-card card">
        <Link href={`/articles/${article.slug}`}>
          <h2 className="headline">{article.title}</h2>
          <p className="summary">{summarize(article.contentHTML, 200)}</p>
          <div className="meta">
            <span>{article.author}</span> · <time>{formatKoreanDate(article.generatedAt)}</time>
          </div>
        </Link>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="article-card card" style={{ marginBottom: '1.5rem' }}>
        <Link href={`/articles/${article.slug}`}>
          <div className="card-content">
            <h3>{article.title}</h3>
            <div className="meta">
              <span>{article.author}</span> · <time>{formatKoreanDate(article.generatedAt)}</time>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="article-card card">
      <Link href={`/articles/${article.slug}`}>
        <div className="card-content">
          <h3>{article.title}</h3>
          <p className="summary">{summarize(article.contentHTML)}</p>
          <div className="meta">
            <span>{article.author}</span> · <time>{formatKoreanDate(article.generatedAt)}</time>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home({ articles }) {
  if (!articles || articles.length === 0) {
    return (
      <div>
        <header>
          <div className="container">
            <div className="header-content">
              <h1>My AI News</h1>
              <nav>
                <Link href="/search">검색</Link>
                <Link href="/admin">관리자</Link>
              </nav>
            </div>
          </div>
        </header>
        <main>
          <div className="container">
            <section className="search-section">
              <div className="search-container">
                <h2 className="search-title">AI 뉴스를 검색해보세요</h2>
                <SearchBar
                  placeholder="키워드를 입력하세요..."
                  className="home-search-bar"
                />
              </div>
            </section>
            <section className="news-section">
              <div className="section-header">
                <h2>최신 뉴스</h2>
                <p>AI가 생성한 최신 뉴스를 확인해보세요</p>
              </div>
              <div className="empty-state">
                <div className="empty-icon">📰</div>
                <h3>아직 생성된 기사가 없습니다</h3>
                <p>관리자 페이지에서 첫 번째 기사를 생성해보세요.</p>
                <Link href="/admin/generate" className="generate-link">
                  기사 생성하러 가기
                </Link>
              </div>
            </section>
          </div>
        </main>
        <footer>© {new Date().getFullYear()} My AI News</footer>
        
        <style jsx>{`
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 0;
          }

          .header-content h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
          }

          .header-content nav {
            display: flex;
            gap: 1.5rem;
          }

          .header-content nav a {
            color: #6b7280;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
          }

          .header-content nav a:hover {
            color: #1f2937;
          }

          .search-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 1.5rem 1.5rem;
            margin-bottom: 2rem;
            text-align: center;
            color: white;
          }

          .search-container {
            max-width: 450px;
            margin: 0 auto;
          }

          .search-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .news-section {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
          }

          .section-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
          }

          .section-header h2 {
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 0.5rem 0;
          }

          .section-header p {
            color: #6b7280;
            margin: 0;
            font-size: 1.1rem;
          }

          .empty-state {
            text-align: center;
            padding: 3rem 2rem;
            color: #6b7280;
          }

          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }

          .empty-state h3 {
            font-size: 1.5rem;
            color: #374151;
            margin: 0 0 0.5rem 0;
          }

          .empty-state p {
            margin: 0 0 1.5rem 0;
            font-size: 1.1rem;
            color: #6b7280;
          }

          .generate-link {
            display: inline-block;
            padding: 0.875rem 2rem;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          }

          .generate-link:hover {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          }
        `}</style>
      </div>
    );
  }

  // 기사 배분
  const mainStory = articles[0];
  const sidebarStories = articles.slice(1, 4);
  const secondaryStories = articles.slice(4);

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-content">
            <h1>My AI News</h1>
            <nav>
              <Link href="/search">검색</Link>
              <Link href="/admin">관리자</Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          {/* 검색 섹션 */}
          <section className="search-section">
            <div className="search-container">
              <h2 className="search-title">원하는 기사를 찾아보세요</h2>
              <SearchBar
                placeholder="AI, 기술, 정책 등 키워드로 검색..."
                className="home-search-bar"
              />
              <div className="popular-keywords">
                <span className="keywords-label">인기 검색어:</span>
                <Link href="/search?q=AI" className="keyword-tag">AI</Link>
                <Link href="/search?q=인공지능" className="keyword-tag">인공지능</Link>
                <Link href="/search?q=기술" className="keyword-tag">기술</Link>
                <Link href="/search?q=정책" className="keyword-tag">정책</Link>
              </div>
            </div>
          </section>

          <div className="main-grid">
            {/* 메인 기사 */}
            <section className="main-story">
              <ArticleCard article={mainStory} type="main" />
            </section>

            {/* 사이드바 기사 */}
            <aside className="sidebar">
              {sidebarStories.map(article => (
                <ArticleCard key={article.slug} article={article} type="sidebar" />
              ))}
            </aside>
          </div>

          {/* 나머지 기사 그리드 */}
          {secondaryStories.length > 0 && (
            <section className="secondary-grid">
              {secondaryStories.map(article => (
                <ArticleCard key={article.slug} article={article} type="secondary" />
              ))}
            </section>
          )}
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News</footer>

      <style jsx>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }

        .header-content h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .header-content nav {
          display: flex;
          gap: 1.5rem;
        }

        .header-content nav a {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .header-content nav a:hover {
          color: #1f2937;
        }

        .search-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem 1.5rem;
          margin-bottom: 2rem;
          text-align: center;
          color: white;
        }

        .search-container {
          max-width: 450px;
          margin: 0 auto;
        }

        .search-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-section :global(.home-search-bar) {
          margin-bottom: 1rem;
        }

        .popular-keywords {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }

        .keywords-label {
          font-size: 0.875rem;
          opacity: 0.9;
          font-weight: 500;
        }

        .keyword-tag {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.375rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .keyword-tag:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .search-section {
            padding: 2rem 1rem;
            margin-bottom: 2rem;
          }

          .search-title {
            font-size: 1.5rem;
          }

          .popular-keywords {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  const articles = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
  return {
    props: { articles: articles.slice(0, 10) }, // 메인 페이지에는 최근 10개만 표시
    revalidate: 300,
  };
}