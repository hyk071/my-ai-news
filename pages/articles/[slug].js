// pages/articles/[slug].js
import fs from "fs";
import path from "path";
import Head from "next/head";
import Link from "next/link";

function formatKoreanDate(s) {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' });
}

export default function ArticlePage({ article }) {
  if (!article) {
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <h1>기사를 찾을 수 없습니다.</h1>
        <Link href="/">← 홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{article.seo?.title || article.title}</title>
        <meta name="description" content={article.seo?.description || ""} />
      </Head>

      <header>
        <div className="container">
          <h1>My AI News</h1>
          <nav><Link href="/">← 홈으로</Link></nav>
        </div>
      </header>

      <main>
        <div className="article-content-wrapper">
          <article>
            <h1 className="headline">{article.title}</h1>
            <div className="meta">
              <span>By {article.author}</span> · <time>{formatKoreanDate(article.generatedAt)}</time>
            </div>
            <div className="content" dangerouslySetInnerHTML={{ __html: article.contentHTML }} />
          </article>
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News</footer>
    </>
  );
}

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  const articles = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
  const paths = articles
    .filter(a => a.slug && typeof a.slug === "string")
    .map(a => ({ params: { slug: a.slug } }));
  
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  const articles = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
  const article = articles.find(a => a.slug === params.slug) || null;

  if (!article) {
    return { notFound: true };
  }

  return {
    props: { article },
    revalidate: 300,
  };
}