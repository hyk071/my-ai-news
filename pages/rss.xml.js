// pages/rss.xml.js
import fs from "fs";
import path from "path";

export async function getServerSideProps({ res }) {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  const articles = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const items = articles.map(a => `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${base}/articles/${a.slug}</link>
      <pubDate>${new Date(a.date || a.generatedAt || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${a.seo?.description || ""}]]></description>
    </item>`).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0"><channel>
    <title>My AI News</title>
    <link>${base}</link>
    <description>AI 뉴스 피드</description>
    ${items}
  </channel></rss>`;

  res.setHeader("Content-Type", "application/rss+xml");
  res.write(xml);
  res.end();
  return { props: {} };
}

function escapeXml(s=""){ return s.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c])); }
export default function RSS(){ return null; }
