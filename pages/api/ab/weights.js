// pages/api/ab/weights.js
// 최근 N일(metrics.json) 기준으로 slug별 A/B 가중치 산출(Beta-prior 스무딩)
// w = (clicks+α) / (views+α+β), 기본 α=1, β=1  → 확률로 사용
import fs from "fs";
import path from "path";

const ALPHA = 1; // prior clicks
const BETA = 1;  // prior non-clicks

function withinDays(tsISO, days) {
  if (!days) return true;
  const ts = new Date(tsISO).getTime();
  const cutoff = Date.now() - days * 86400000;
  return ts >= cutoff;
}

export default function handler(req, res) {
  try {
    const days = req.method === "GET"
      ? Number(new URL(req.url, "http://x").searchParams.get("days") || 30)
      : Number(req.body?.days || 30);

    const dataDir = path.join(process.cwd(), "data");
    const mPath = path.join(dataDir, "metrics.json");
    const aPath = path.join(dataDir, "articles.json");
    const metrics = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, "utf8")) : [];
    const articles = fs.existsSync(aPath) ? JSON.parse(fs.readFileSync(aPath, "utf8")) : [];

    const withAB = articles.filter(a => Array.isArray(a.abVariants) && a.abVariants.length === 2);

    // 집계: slug-variant 단위 views/clicks
    const agg = new Map();
    for (const m of metrics) {
      if (!withinDays(m.ts, days)) continue;
      if (!m.slug) continue;
      const variant = m.variant || "base";
      if (variant !== "A" && variant !== "B") continue; // base는 가중치 산정 제외
      const key = `${m.slug}|${variant}`;
      if (!agg.has(key)) agg.set(key, { views: 0, clicks: 0 });
      const obj = agg.get(key);
      if (m.type === "view") obj.views++;
      else if (m.type === "click") obj.clicks++;
    }

    // 가중치 계산
    const weights = {}; // { slug: {A: wA, B: wB} }
    for (const a of withAB) {
      const keyA = `${a.slug}|A`;
      const keyB = `${a.slug}|B`;
      const A = agg.get(keyA) || { views: 0, clicks: 0 };
      const B = agg.get(keyB) || { views: 0, clicks: 0 };
      const wA = (A.clicks + ALPHA) / (A.views + ALPHA + BETA);
      const wB = (B.clicks + ALPHA) / (B.views + ALPHA + BETA);
      weights[a.slug] = { A: wA, B: wB };
    }

    return res.status(200).json({ days, weights });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "weights failed" });
  }
}
