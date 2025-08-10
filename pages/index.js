// pages/index.js
import fs from "fs";
import path from "path";
import Link from "next/link";

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
            <h1>My AI News</h1>
            <nav><Link href="/admin">관리자</Link></nav>
          </div>
        </header>
        <main><div className="container"><p>아직 생성된 기사가 없습니다.</p></div></main>
        <footer>© {new Date().getFullYear()} My AI News</footer>
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
          <h1>My AI News</h1>
          <nav><Link href="/admin">관리자</Link></nav>
        </div>
      </header>

      <main>
        <div className="container">
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