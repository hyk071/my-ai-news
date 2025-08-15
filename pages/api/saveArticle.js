// pages/api/saveArticle.js
import fs from "fs";
import path from "path";
import slugify from "slugify";

function nowKST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}
function pad(n) { return n.toString().padStart(2, "0"); }
function timestampKST(d = nowKST()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function buildBase(title) {
  return slugify(title || "ai-news", { lower: true, strict: true, locale: "ko" });
}
function uniqueSlugFromTitle(title, existing) {
  const base = buildBase(title);
  let candidate = `${base}-${timestampKST()}`;
  // 충돌 방어 (아주 드물지만 파일 저장 레이스 대비)
  let salt = 0;
  while (existing.has(candidate)) {
    salt += 1;
    candidate = `${base}-${timestampKST()}-${salt}`;
  }
  return candidate;
}

// 제목 추출 함수 완전 재작성
function extractTitle(content) {
  if (!content) return "제목 없음";
  
  const lines = content.split('\n');
  
  // 1단계: H1 제목 찾기 (# 제목)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ') && !trimmed.startsWith('##')) {
      const title = trimmed.replace(/^#\s+/, '').trim();
      if (title && title.length > 5) {
        console.log('H1 제목 발견:', title); // 디버깅용
        return title;
      }
    }
  }
  
  // 2단계: 첫 번째 의미있는 텍스트를 제목으로 사용
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && 
        !trimmed.startsWith('#') && 
        !trimmed.startsWith('(') && 
        !trimmed.startsWith('-') &&
        !trimmed.includes('개요') && 
        !trimmed.includes('리드') && 
        !trimmed.includes('넛그래프') &&
        !trimmed.includes('By ') && 
        !trimmed.includes('년 ') && 
        !trimmed.includes('※') && // 주의사항 제외
        trimmed.length > 5) {
      console.log('대체 제목 발견:', trimmed); // 디버깅용
      return trimmed;
    }
  }
  
  console.log('제목을 찾을 수 없음'); // 디버깅용
  return "제목 없음";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "articles.json");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const list = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];
    const existingSlugs = new Set(list.map(a => a.slug));

    const {
      title,
      contentHTML,
      source,
      date,
      seo = {},
      author,
      generatedAt,
      abVariants,
    } = req.body || {};

    const finalTitle = (title || "AI 뉴스").trim();
    const finalSlug = uniqueSlugFromTitle(finalTitle, existingSlugs);

    const item = {
      title: finalTitle,
      contentHTML: contentHTML || "",
      source: source || "",
      date: date || "",
      seo: { title: finalTitle, description: (seo.description || "").toString() },
      slug: finalSlug,
      author: author || "",
      generatedAt: generatedAt || "",
      abVariants: Array.isArray(abVariants) && abVariants.length === 2 ? abVariants.slice(0, 2) : undefined,
    };

    list.unshift(item); // 최신이 위
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));

    // 저장 성공 후, 홈/해당 기사 경로 재검증 (캐시 갱신)
    const secret = process.env.REVALIDATE_SECRET;
    if (secret) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || `http://${req.headers.host}`;
      const revalidateUrl = `${base}/api/revalidate`;
      // fetch를 await하여 재검증 요청이 완료될 때까지 기다립니다.
      await fetch(revalidateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          paths: ["/", `/articles/${finalSlug}`],
        }),
      });
    }

    return res.status(200).json({ ok: true, slug: finalSlug });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "saveArticle 실패" });
  }
}