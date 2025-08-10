// pages/sitemap.xml.js
import fs from "fs";
import path from "path";

export async function getServerSideProps({ res }) {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  const articles = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const urls = [
    `<url><loc>${base}</loc></url>`,
    ...articles.map(a => `<url><loc>${base}/articles/${a.slug}</loc></url>`),
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();
  return { props: {} };
}

export default function SiteMap() { return null; }
