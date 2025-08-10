// pages/robots.txt.js
export async function getServerSideProps({ res }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const txt = `User-agent: * 
Allow: /
Sitemap: ${base}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain");
  res.write(txt);
  res.end();
  return { props: {} };
}
export default function Robots(){ return null; }
