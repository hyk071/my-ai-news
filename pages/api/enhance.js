// pages/api/enhance.js
// - 본문 기반 제목 후보 6개(JSON) 생성 (선택 텍스트 제공사 우선 → OpenAI → Claude → Gemini → 휴리스틱)
// - 고급 필터/가이드라인을 프롬프트와 후보 후처리에 모두 적용
// - 최적 제목 자동 선택 + 후보 목록 함께 반환
// - 유니크 슬러그/KST/작성자 유지

import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";
import { titlePrompt } from "./prompts/titlePrompt";

function getRandomAuthor() {
  const first = ["John","Emily","Michael","Sarah","David","Jessica","Daniel","Laura","Alex","Grace"];
  const last = ["Smith","Johnson","Brown","Taylor","Anderson","Lee","Martin","Clark","Walker","Hall"];
  return `${first[Math.floor(Math.random()*first.length)]} ${last[Math.floor(Math.random()*last.length)]}`;
}
function mdToHtml(md) {
  const raw = marked.parse(md || "");
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img","h2","h3","figure","figcaption","ul","ol","li","strong","em"]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src","alt","title"] },
  });
  return clean;
}
function nowInKSTDate() { const kst = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }); return new Date(kst); }
function pad(n){return n.toString().padStart(2,"0");}
function formatKST(d){ const y=d.getFullYear(), m=pad(d.getMonth()+1), dd=pad(d.getDate()), hh=pad(d.getHours()), mm=pad(d.getMinutes()), ss=pad(d.getSeconds()); return `${y}-${m}-${dd} ${hh}:${mm}:${ss}`; }
function uniqueSlug(title){ const base = slugify(title || "ai-news", { lower: true, strict: true, locale: "ko" }); const t=nowInKSTDate(); return `${base}-${t.getFullYear()}${pad(t.getMonth()+1)}${pad(t.getDate())}${pad(t.getHours())}${pad(t.getMinutes())}${pad(t.getSeconds())}`; }
function safeParseJson(txt){ if(!txt) return null; const i=txt.indexOf("{"); const j=txt.lastIndexOf("}"); if(i===-1||j===-1||j<=i) return null; try{ return JSON.parse(txt.slice(i,j+1)); }catch{ return null; } }

const DEFAULT_BANNED = ["충격","소름","대박","미쳤다","헉","레전드","어떻게?","이렇게만 하면","단번에","초대박","완전정복","충격적","반전","경악","유출"];

function normCSV(s){ return Array.from(new Set((s||"").split(",").map(x=>x.trim()).filter(Boolean))); }
function includesAll(title, arr){ const t=title.toLowerCase(); return (arr||"[]").every(k => t.includes((k||"").toLowerCase())); }
function includesAny(title, arr){ const t=title.toLowerCase(); return (arr||"[]").some(k => t.includes((k||"").toLowerCase())); }
function excludesAll(title, arr){ const t=title.toLowerCase(); return (arr||"[]").every(k => !t.includes((k||"").toLowerCase())); }

function filterCandidatesByRules(cands, filters) {
  if (!Array.isArray(cands)) return [];
  const mi = (filters?.mustInclude || []).map(s=>s.toLowerCase());
  const me = (filters?.mustExclude || []).map(s=>s.toLowerCase());
  const pi = (filters?.phraseInclude || []).map(s=>s.toLowerCase());
  const pe = (filters?.phraseExclude || []).map(s=>s.toLowerCase());
  const min = filters?.titleLen?.min || 45;
  const max = filters?.titleLen?.max || 60;

  const banned = new Set([...DEFAULT_BANNED.map(x=>x.toLowerCase()), ...me]);
  const res = [];
  for (const c of cands) {
    const title = (typeof c?.title === "string" ? c.title.trim() : c)?.toString() || "";
    if (!title) continue;
    const lower = title.toLowerCase();
    const len = [...title].length;
    if (len < min || len > max) continue;
    // 금지 키워드/문구
    if ([...banned].some(b => b && lower.includes(b))) continue;
    if (!excludesAll(lower, pe)) continue;
    // 필수 키워드/문구
    if (!includesAll(lower, mi)) continue;
    if (pi.length && !includesAny(lower, pi)) continue;

    res.push(title);
  }
  return Array.from(new Set(res));
}

// 점수화(필터 통과 전제). novelty/specificity/actionability 반영.
function scoreCandidates(json, tags, filters) {
  const scored = [];
  const tset = new Set((tags||"[]").map(t=>t.trim()).filter(Boolean));
  const min = filters?.titleLen?.min || 45;
  const max = filters?.titleLen?.max || 60;

  (json?.candidates || []).forEach(c => {
    if (!c || typeof c.title !== "string") return;
    const title = c.title.trim();
    const len = [...title].length;
    if (len < min || len > max) return;

    const novelty = Number(c.novelty ?? 0);
    const spec = Number(c.specificity ?? 0);
    const act = Number(c.actionability ?? 0);
    const includesTag = c.includes_primary_tag || ([...tset].some(t => t && title.includes(t)));
    const lengthPenalty = (len>max? (len-max)*0.8 : 0) + (len<min? (min-len)*0.5 : 0);
    const score = (novelty*2 + spec*1.5 + act*1.2 + (includesTag? 3 : 0)) - lengthPenalty;
    scored.push({ title, score });
  });
  scored.sort((a,b)=>b.score-a.score);
  return scored.map(s=>s.title);
}

// ---------- Provider prompts ----------
function buildConstraintText(filters, guidelines){
  const lines = [];
  if (filters?.titleLen) lines.push(`- 제목 글자수: ${filters.titleLen.min}~${filters.titleLen.max}자 내.`);
  if (filters?.mustInclude?.length) lines.push(`- 제목에 반드시 포함: ${filters.mustInclude.join(", ")}`);
  if (filters?.mustExclude?.length) lines.push(`- 제목에 금지: ${filters.mustExclude.join(", ")}`);
  if (filters?.phraseInclude?.length) lines.push(`- 제목에 포함 권장(문구): ${filters.phraseInclude.join(" / ")}`);
  if (filters?.phraseExclude?.length) lines.push(`- 금지 문구: ${filters.phraseExclude.join(" / ")}`);
  if (guidelines?.dataBacked) lines.push(`- 데이터 근거(기관명/수치/기간) 최소 ${guidelines.numFactsMin||2}개를 본문 맥락에 반영.`);
  if (guidelines?.noClickbait) lines.push(`- 클릭베이트/과장 표현 금지.`);
  if (guidelines?.newsroomStyle) lines.push(`- 뉴스룸 스타일: 명확한 리드와 넛그래프, 적절한 소제목, 중립 어휘.`);
  return lines.join("\n");
}

async function seoFromOpenAI({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const sys = titlePrompt;
  const constraint = buildConstraintText(filters, guidelines);
  const user = `태그: ${(tags||[]).join(", ") || "(없음)"}\n주제 설명: ${subject || "(없음)"}\n말투: ${tone}\n길이: ${lengthRange.min}~${lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${content}`;
  const comp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [ { role: "system", content: sys }, { role: "user", content: user } ]
  });
  return safeParseJson(comp.choices?.[0]?.message?.content);
}
async function seoFromGemini({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.GOOGLE_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const constraint = buildConstraintText(filters, guidelines);
  const prompt = `${titlePrompt}\n\n태그: ${(tags||[]).join(", ") || "(없음)"}\n주제 설명: ${subject || "(없음)"}\n말투: ${tone}\n길이: ${lengthRange.min}~${lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${content}\n\nJSON만 출력`;
  const r = await model.generateContent(prompt);
  const txt = r.response?.text?.();
  return safeParseJson(txt);
}
async function seoFromClaude({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const constraint = buildConstraintText(filters, guidelines);
  const prompt = `${titlePrompt}\n\n태그: ${(tags||[]).join(", ") || "(없음)"}\n주제 설명: ${subject || "(없음)"}\n말투: ${tone}\n길이: ${lengthRange.min}~${lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${content}\n\nJSON만 출력`;
  const msg = await anthropic.messages.create({ model: "claude-3-5-sonnet-latest", max_tokens: 800, messages: [{ role: "user", content: prompt }] });
  const block = msg.content?.[0];
  const txt = typeof block === "object" && "text" in block ? block.text : "";
  return safeParseJson(txt);
}

// ---------- Image (생성 소형, 표시 200×100) ----------
async function imageFromOpenAI(prompt){
  if (!process.env.OPENAI_API_KEY) return null;
  try{
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const img = await client.images.generate({ model: "gpt-image-1", prompt, size: "256x256" });
    const b64 = img.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : null;
  }catch{ return null; }
}
async function imageFromGemini(prompt){
  if (!process.env.GOOGLE_API_KEY) return null;
  try{
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generate?key=${process.env.GOOGLE_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: { text: prompt }, aspectRatio: "1:1" })
    });
    const j = await r.json();
    const b64 = j?.images?.[0]?.imageBytes
      || j?.candidates?.[0]?.content?.parts?.find(p => p.inline_data)?.inline_data?.data
      || j?.predictions?.[0]?.bytesBase64Encoded;
    return b64 ? `data:image/png;base64,${b64}` : null;
  }catch{ return null; }
}
function placeholderImage(title="AI News"){
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='55%' font-family='Arial, sans-serif' font-size='14' fill='#374151' text-anchor='middle'>${title}</text>
     </svg>`
  );
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  const {
    content, tags = [], subject = "", tone = "객관적",
    lengthRange = {min:1000,max:2000},
    filters = {}, guidelines = {},
    imageProvider, textProvider
  } = req.body || {};
  if (!content) return res.status(400).json({ error: "content 가 필요합니다." });

  try{
    // 1) 제목 후보 JSON: 선택 제공사 → OpenAI → Claude → Gemini → 휴리스틱
    const ctx = { content, tags, subject, tone, lengthRange, filters, guidelines };
    let seoJson = null;
    if (textProvider === "openai") seoJson = await seoFromOpenAI(ctx);
    else if (textProvider === "claude") seoJson = await seoFromClaude(ctx);
    else if (textProvider === "gemini") seoJson = await seoFromGemini(ctx);
    if (!seoJson) seoJson = await seoFromOpenAI(ctx);
    if (!seoJson) seoJson = await seoFromClaude(ctx);
    if (!seoJson) seoJson = await seoFromGemini(ctx);

    // 2) 후보 정제: 필터 통과 → 점수화 순
    let rawCandidates = [];
    let metaDescription = "";
    if (seoJson?.candidates?.length) {
      rawCandidates = seoJson.candidates;
      metaDescription = typeof seoJson.meta_description === "string" ? seoJson.meta_description : "";
    }
    // 필터 적용
    const filteredTitles = filterCandidatesByRules(rawCandidates, filters);
    // 점수로 정렬(필터 통과 후보가 있을 때만)
    const ordered = filteredTitles.length ? filteredTitles
      : scoreCandidates(seoJson, tags, filters);

    // 휴리스틱 백업(여전히 없으면)
    let candidates = ordered;
    if (!candidates.length) {
      const firstH2 = (content.match(/^##\s*(.+)$/m)?.[1] || "").trim();
      const firstLine = (content.replace(/[#>*`\-\*_]/g,"").split("\n").find(Boolean) || "").trim();
      const base = firstH2 || firstLine || "AI 뉴스";
      candidates = [base, `${base} — ${tags[0]||"분석"}`, `${base} 전망과 과제`].slice(0,3);
      metaDescription = subject ? subject.slice(0,150) : "이 기사는 주제에 대한 심층 분석을 제공합니다.";
    }

    // 최종 제목 선택
    let bestTitle = candidates[0] || "AI 뉴스";
    bestTitle = bestTitle.replace(/\s*-\s*자동\s*생성\s*$/i, "").trim();

    // 3) 본문/작성자/시간/슬러그
    const contentHTML = mdToHtml(content);
    const author = getRandomAuthor();
    const generatedAt = formatKST(nowInKSTDate());
    const slug = uniqueSlug(bestTitle);

    return res.status(200).json({
      title: bestTitle,
      seo: { title: bestTitle, description: metaDescription || "AI 관련 이슈를 분석한 기사." },
      candidates,
      metaDescription,
      slug,
      contentHTML,
      author,
      generatedAt,
    });
  }catch(e){
    console.error(e);
    return res.status(500).json({ error: "enhance 실패" });
  }
}