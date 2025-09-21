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
import { ContentAnalyzer } from "../../lib/content-analyzer.js";
import { TitleGenerator } from "../../lib/title-generator.js";
import { getAICacheWrapper } from "../../lib/ai-cache-wrapper.js";
import { getMonitoringDashboard } from "../../lib/monitoring-dashboard.js";

function getRandomAuthor() {
  const first = ["John", "Emily", "Michael", "Sarah", "David", "Jessica", "Daniel", "Laura", "Alex", "Grace"];
  const last = ["Smith", "Johnson", "Brown", "Taylor", "Anderson", "Lee", "Martin", "Clark", "Walker", "Hall"];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}
function mdToHtml(md) {
  const raw = marked.parse(md || "");
  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h2", "h3", "figure", "figcaption", "ul", "ol", "li", "strong", "em"]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt", "title"] },
  });
  return clean;
}
function nowInKSTDate() { const kst = new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }); return new Date(kst); }
function pad(n) { return n.toString().padStart(2, "0"); }
function formatKST(d) { const y = d.getFullYear(), m = pad(d.getMonth() + 1), dd = pad(d.getDate()), hh = pad(d.getHours()), mm = pad(d.getMinutes()), ss = pad(d.getSeconds()); return `${y}-${m}-${dd} ${hh}:${mm}:${ss}`; }
function uniqueSlug(title) { const base = slugify(title || "ai-news", { lower: true, strict: true, locale: "ko" }); const t = nowInKSTDate(); return `${base}-${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}${pad(t.getHours())}${pad(t.getMinutes())}${pad(t.getSeconds())}`; }
function safeParseJson(txt) { if (!txt) return null; const i = txt.indexOf("{"); const j = txt.lastIndexOf("}"); if (i === -1 || j === -1 || j <= i) return null; try { return JSON.parse(txt.slice(i, j + 1)); } catch { return null; } }

const DEFAULT_BANNED = ["충격", "소름", "대박", "미쳤다", "헉", "레전드", "어떻게?", "이렇게만 하면", "단번에", "초대박", "완전정복", "충격적", "반전", "경악", "유출"];

function normCSV(s) { return Array.from(new Set((s || "").split(",").map(x => x.trim()).filter(Boolean))); }
function includesAll(title, arr) { const t = title.toLowerCase(); return (arr || "[]").every(k => t.includes((k || "").toLowerCase())); }
function includesAny(title, arr) { const t = title.toLowerCase(); return (arr || "[]").some(k => t.includes((k || "").toLowerCase())); }
function excludesAll(title, arr) { const t = title.toLowerCase(); return (arr || "[]").every(k => !t.includes((k || "").toLowerCase())); }

function filterCandidatesByRules(cands, filters) {
  if (!Array.isArray(cands)) return [];
  const mi = (filters?.mustInclude || []).map(s => s.toLowerCase());
  const me = (filters?.mustExclude || []).map(s => s.toLowerCase());
  const pi = (filters?.phraseInclude || []).map(s => s.toLowerCase());
  const pe = (filters?.phraseExclude || []).map(s => s.toLowerCase());
  const min = filters?.titleLen?.min || 45;
  const max = filters?.titleLen?.max || 60;

  const banned = new Set([...DEFAULT_BANNED.map(x => x.toLowerCase()), ...me]);
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
  const tset = new Set((tags || "[]").map(t => t.trim()).filter(Boolean));
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
    const lengthPenalty = (len > max ? (len - max) * 0.8 : 0) + (len < min ? (min - len) * 0.5 : 0);
    const score = (novelty * 2 + spec * 1.5 + act * 1.2 + (includesTag ? 3 : 0)) - lengthPenalty;
    scored.push({ title, score });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.title);
}

// ---------- Provider prompts ----------
function buildConstraintText(filters, guidelines) {
  const lines = [];
  if (filters?.titleLen) lines.push(`- 제목 글자수: ${filters.titleLen.min}~${filters.titleLen.max}자 내.`);
  if (filters?.mustInclude?.length) lines.push(`- 제목에 반드시 포함: ${filters.mustInclude.join(", ")}`);
  if (filters?.mustExclude?.length) lines.push(`- 제목에 금지: ${filters.mustExclude.join(", ")}`);
  if (filters?.phraseInclude?.length) lines.push(`- 제목에 포함 권장(문구): ${filters.phraseInclude.join(" / ")}`);
  if (filters?.phraseExclude?.length) lines.push(`- 금지 문구: ${filters.phraseExclude.join(" / ")}`);
  if (guidelines?.dataBacked) lines.push(`- 데이터 근거(기관명/수치/기간) 최소 ${guidelines.numFactsMin || 2}개를 본문 맥락에 반영.`);
  if (guidelines?.noClickbait) lines.push(`- 클릭베이트/과장 표현 금지.`);
  if (guidelines?.newsroomStyle) lines.push(`- 뉴스룸 스타일: 명확한 리드와 넛그래프, 적절한 소제목, 중립 어휘.`);
  return lines.join("\n");
}

async function seoFromOpenAI({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.OPENAI_API_KEY) return null;
  
  const aiCache = getAICacheWrapper();
  
  // 원본 OpenAI 호출 함수
  const originalOpenAICall = async (params) => {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const sys = titlePrompt;
    const constraint = buildConstraintText(params.filters, params.guidelines);
    const user = `태그: ${(params.tags || []).join(", ") || "(없음)"}\n주제 설명: ${params.subject || "(없음)"}\n말투: ${params.tone}\n길이: ${params.lengthRange.min}~${params.lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${params.content}`;
    
    const comp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: sys }, { role: "user", content: user }]
    });
    
    return safeParseJson(comp.choices?.[0]?.message?.content);
  };
  
  // 캐싱된 호출
  return aiCache.cachedOpenAICall(originalOpenAICall, { content, tags, subject, tone, lengthRange, filters, guidelines });
}
async function seoFromGemini({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.GOOGLE_API_KEY) return null;
  
  const aiCache = getAICacheWrapper();
  
  // 원본 Gemini 호출 함수
  const originalGeminiCall = async (params) => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: titlePrompt,
    });
    const constraint = buildConstraintText(params.filters, params.guidelines);
    const userPrompt = `태그: ${(params.tags || []).join(", ") || "(없음)"}\n주제 설명: ${params.subject || "(없음)"}\n말투: ${params.tone}\n길이: ${params.lengthRange.min}~${params.lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${params.content}\n\nJSON만 출력`;
    
    const r = await model.generateContent(userPrompt);
    const txt = r.response?.text?.();
    return safeParseJson(txt);
  };
  
  // 캐싱된 호출
  return aiCache.cachedGeminiCall(originalGeminiCall, { content, tags, subject, tone, lengthRange, filters, guidelines });
}
async function seoFromClaude({ content, tags, subject, tone, lengthRange, filters, guidelines }) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  
  const aiCache = getAICacheWrapper();
  
  // 원본 Claude 호출 함수
  const originalClaudeCall = async (params) => {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const constraint = buildConstraintText(params.filters, params.guidelines);
    const userPrompt = `태그: ${(params.tags || []).join(", ") || "(없음)"}\n주제 설명: ${params.subject || "(없음)"}\n말투: ${params.tone}\n길이: ${params.lengthRange.min}~${params.lengthRange.max} 단어\n추가 제약:\n${constraint}\n\n[기사원문]\n${params.content}\n\n반드시 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: titlePrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    
    const block = msg.content?.[0];
    const txt = typeof block === "object" && "text" in block ? block.text : "";
    return safeParseJson(txt);
  };
  
  // 캐싱된 호출
  return aiCache.cachedClaudeCall(originalClaudeCall, { content, tags, subject, tone, lengthRange, filters, guidelines });
}

// ---------- Image (생성 소형, 표시 200×100) ----------
async function imageFromOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const img = await client.images.generate({ model: "gpt-image-1", prompt, size: "256x256" });
    const b64 = img.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : null;
  } catch { return null; }
}
async function imageFromGemini(prompt) {
  if (!process.env.GOOGLE_API_KEY) return null;
  try {
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
  } catch { return null; }
}
function placeholderImage(title = "AI News") {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='100'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='55%' font-family='Arial, sans-serif' font-size='14' fill='#374151' text-anchor='middle'>${title}</text>
     </svg>`
  );
  return `data:image/svg+xml;charset=utf-8,${svg}`;
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

// 제목 후보 추출 함수 완전 재작성
function extractTitleCandidates(content) {
  if (!content) return [];

  const lines = content.split('\n');
  const candidates = [];

  console.log('제목 후보 추출 시작:', lines.length, '줄'); // 디버깅용

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // H1 제목 찾기 (# 제목)
    if (line.startsWith('# ') && !line.startsWith('##')) {
      const title = line.replace(/^#\s+/, '').trim();
      if (title && title.length > 5 && !candidates.includes(title)) {
        console.log('H1 제목 후보 추가:', title); // 디버깅용
        candidates.push(title);
      }
      continue;
    }

    // H2 소제목은 제목 후보에서 제외
    if (line.startsWith('## ')) {
      continue;
    }

    // 첫 번째 의미있는 텍스트를 제목 후보로 추가
    if (line && !line.startsWith('#') && !line.startsWith('(') && !line.startsWith('-') && candidates.length === 0) {
      if (!line.includes('개요') &&
        !line.includes('리드') &&
        !line.includes('넛그래프') &&
        !line.includes('By ') &&
        !line.includes('년 ') &&
        !line.includes('※') && // 주의사항 제외
        line.length > 5) {
        console.log('대체 제목 후보 추가:', line); // 디버깅용
        candidates.push(line);
      }
    }
  }

  console.log('최종 제목 후보:', candidates); // 디버깅용
  return candidates.slice(0, 6);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  
  // 요청 시작 시간 기록 (모니터링용)
  req.startTime = Date.now();
  
  const {
    content, tags = [], subject = "", tone = "객관적",
    lengthRange = { min: 1000, max: 2000 },
    filters = {}, guidelines = {},
    imageProvider, textProvider
  } = req.body || {};
  if (!content) return res.status(400).json({ error: "content 가 필요합니다." });

  try {
    // 현재 코드 개선
    let seoJson = null;
    let lastError = null;

    // 선택된 제공사 우선 시도
    if (textProvider === "openai") {
      try { seoJson = await seoFromOpenAI({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { lastError = `OpenAI: ${e.message}`; }
    }
    else if (textProvider === "claude") {
      try { seoJson = await seoFromClaude({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { lastError = `Claude: ${e.message}`; }
    }
    else if (textProvider === "gemini") {
      try { seoJson = await seoFromGemini({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { lastError = `Gemini: ${e.message}`; }
    }

    // 폴백 시도 (에러 로깅 포함)
    if (!seoJson) {
      console.log(`Primary provider ${textProvider} failed: ${lastError}`);
      try { seoJson = await seoFromOpenAI({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { console.log(`OpenAI fallback failed: ${e.message}`); }
    }
    if (!seoJson) {
      try { seoJson = await seoFromClaude({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { console.log(`Claude fallback failed: ${e.message}`); }
    }
    if (!seoJson) {
      try { seoJson = await seoFromGemini({ content, tags, subject, tone, lengthRange, filters, guidelines }); }
      catch (e) { console.log(`Gemini fallback failed: ${e.message}`); }
    }

    // 2) 새로운 지능형 제목 생성 시스템 사용
    let candidates = [];
    let bestTitle = "AI 뉴스";
    let metaDescription = "";
    let titleGenerationLogs = null;

    // 단계별 폴백 시스템으로 개선
    const fallbackSteps = [];
    let currentStep = 1;

    try {
      fallbackSteps.push(`Step ${currentStep++}: AI 제목 처리 시작`);

      // AI 제목 생성 시도 및 결과 처리
      let aiTitles = [];
      if (seoJson?.candidates?.length) {
        try {
          const rawCandidates = seoJson.candidates;
          metaDescription = typeof seoJson.meta_description === "string" ? seoJson.meta_description : "";

          const filteredTitles = filterCandidatesByRules(rawCandidates, filters);
          aiTitles = filteredTitles.length ? filteredTitles : scoreCandidates(seoJson, tags, filters);

          fallbackSteps.push(`Step ${currentStep++}: AI 제목 ${aiTitles.length}개 처리 완료`);
          console.log('AI 제목 생성 성공:', aiTitles.length, '개');
        } catch (aiError) {
          fallbackSteps.push(`Step ${currentStep++}: AI 제목 처리 실패 - ${aiError.message}`);
          console.warn('AI 제목 처리 중 오류:', aiError.message);
        }
      } else {
        fallbackSteps.push(`Step ${currentStep++}: AI 제목 없음, 콘텐츠 분석으로 진행`);
      }

      // ContentAnalyzer로 기사 분석
      fallbackSteps.push(`Step ${currentStep++}: 콘텐츠 분석 시작`);
      const analyzer = new ContentAnalyzer(content, tags, subject, tone);

      // TitleGenerator로 제목 생성
      fallbackSteps.push(`Step ${currentStep++}: 제목 생성기 초기화`);
      const generator = new TitleGenerator(analyzer, filters, guidelines);

      // AI 제목이 있으면 TitleGenerator에 주입
      if (aiTitles.length > 0) {
        generator.setAITitles(aiTitles);
        fallbackSteps.push(`Step ${currentStep++}: AI 제목 ${aiTitles.length}개 주입 완료`);
      }

      const titleResult = await generator.generateTitles();
      fallbackSteps.push(`Step ${currentStep++}: 제목 생성 완료 - ${titleResult.candidates.length}개 후보`);

      // 결과 처리
      if (aiTitles.length > 0) {
        const aiCandidates = aiTitles.map(title => ({
          title: title,
          source: 'ai_generation',
          score: 0.9
        }));
        titleResult.candidates = [...aiCandidates, ...titleResult.candidates];
        titleResult.candidates.sort((a, b) => (b.score || 0) - (a.score || 0));

        if (titleResult.candidates.length > 0) {
          bestTitle = titleResult.candidates[0].title;
          fallbackSteps.push(`Step ${currentStep++}: AI 제목 우선 선택 - "${bestTitle}"`);
        }
      } else {
        bestTitle = titleResult.bestTitle;
        fallbackSteps.push(`Step ${currentStep++}: 콘텐츠 기반 제목 선택 - "${bestTitle}"`);
      }

      candidates = titleResult.candidates.map(c => c.title);
      titleGenerationLogs = titleResult.logs;

      console.log('지능형 제목 생성 완료:', {
        bestTitle: bestTitle,
        candidatesCount: candidates.length,
        sources: titleResult.sources,
        executionTime: titleResult.logs?.totalTime,
        fallbackSteps: fallbackSteps.length
      });

    } catch (error) {
      fallbackSteps.push(`Step ${currentStep++}: 지능형 제목 생성 실패 - ${error.message}`);
      console.error('지능형 제목 생성 실패:', error.message);
      console.error('오류 스택:', error.stack);

      // 단계별 폴백 시스템
      try {
        fallbackSteps.push(`Step ${currentStep++}: 폴백 1단계 - AI 제목 직접 사용 시도`);

        if (seoJson?.candidates?.length) {
          const rawCandidates = seoJson.candidates;
          const filteredTitles = filterCandidatesByRules(rawCandidates, filters);
          candidates = filteredTitles.length ? filteredTitles : scoreCandidates(seoJson, tags, filters);
          bestTitle = candidates[0] || null;

          if (bestTitle) {
            fallbackSteps.push(`Step ${currentStep++}: 폴백 1단계 성공 - "${bestTitle}"`);
          } else {
            throw new Error('AI 제목 후보 없음');
          }
        } else {
          throw new Error('AI 제목 데이터 없음');
        }

      } catch (fallback1Error) {
        fallbackSteps.push(`Step ${currentStep++}: 폴백 1단계 실패 - ${fallback1Error.message}`);

        try {
          fallbackSteps.push(`Step ${currentStep++}: 폴백 2단계 - 기본 콘텐츠 분석 시도`);

          // 기본 콘텐츠 분석 폴백
          const firstH1 = (content.match(/^#\s*(.+)$/m)?.[1] || "").trim();
          const firstH2 = (content.match(/^##\s*(.+)$/m)?.[1] || "").trim();
          const firstLine = (content.replace(/[#>*`\-\*_]/g, "").split("\n").find(Boolean) || "").trim();

          if (firstH1 && firstH1.length > 5) {
            bestTitle = firstH1;
            candidates = [firstH1];
            fallbackSteps.push(`Step ${currentStep++}: H1 제목 사용 - "${bestTitle}"`);
          } else if (firstH2 && firstH2.length > 5) {
            bestTitle = firstH2;
            candidates = [firstH2];
            fallbackSteps.push(`Step ${currentStep++}: H2 제목 사용 - "${bestTitle}"`);
          } else if (firstLine && firstLine.length > 10) {
            bestTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
            candidates = [bestTitle];
            fallbackSteps.push(`Step ${currentStep++}: 첫 줄 사용 - "${bestTitle}"`);
          } else {
            throw new Error('유효한 콘텐츠 없음');
          }

        } catch (fallback2Error) {
          fallbackSteps.push(`Step ${currentStep++}: 폴백 2단계 실패 - ${fallback2Error.message}`);

          // 최종 폴백: 태그/주제 기반 제목
          fallbackSteps.push(`Step ${currentStep++}: 최종 폴백 - 태그/주제 기반 제목 생성`);

          if (tags.length > 0) {
            bestTitle = `${tags[0]} 업계 동향: 최신 분석`;
            candidates = [bestTitle];
            fallbackSteps.push(`Step ${currentStep++}: 태그 기반 제목 - "${bestTitle}"`);
          } else if (subject && subject.length > 10) {
            const subjectWords = subject.split(' ').slice(0, 4).join(' ');
            bestTitle = `${subjectWords} - 심층 분석`;
            candidates = [bestTitle];
            fallbackSteps.push(`Step ${currentStep++}: 주제 기반 제목 - "${bestTitle}"`);
          } else {
            // 콘텐츠에서 키워드 추출 시도
            const contentKeywords = content.match(/[가-힣]{2,}/g);
            if (contentKeywords && contentKeywords.length > 0) {
              const topKeyword = contentKeywords[0];
              bestTitle = `${topKeyword} 관련 최신 뉴스`;
              candidates = [bestTitle];
              fallbackSteps.push(`Step ${currentStep++}: 콘텐츠 키워드 기반 제목 - "${bestTitle}"`);
            } else {
              bestTitle = "AI 뉴스: 최신 기술 동향";
              candidates = [bestTitle];
              fallbackSteps.push(`Step ${currentStep++}: 기본 제목 사용 - "${bestTitle}"`);
            }
          }
        }
      }

      // 폴백 과정 로깅
      console.log('폴백 시스템 실행 완료:', {
        finalTitle: bestTitle,
        totalSteps: fallbackSteps.length,
        steps: fallbackSteps
      });
    }

    // 제목 후처리
    bestTitle = bestTitle.replace(/\s*-\s*자동\s*생성\s*$/i, "").trim();

    // 3) 본문/작성자/시간/슬러그
    const contentHTML = mdToHtml(content);
    const author = getRandomAuthor();
    const generatedAt = formatKST(nowInKSTDate());
    const slug = uniqueSlug(bestTitle);

    // 모니터링 데이터 수집
    try {
      const dashboard = getMonitoringDashboard();
      const responseTime = Date.now() - (req.startTime || Date.now());
      const qualityScore = titleResult?.candidates?.[0]?.score || 0.7; // 기본값
      const source = titleResult?.sources?.[0] || 'fallback';
      
      dashboard.recordTitleGenerationRequest(true, responseTime, qualityScore, source);
    } catch (monitoringError) {
      console.warn('모니터링 데이터 기록 실패:', monitoringError.message);
    }

    return res.status(200).json({
      title: bestTitle,
      seo: { title: bestTitle, description: metaDescription || "AI 관련 이슈를 분석한 기사." },
      candidates,
      metaDescription,
      slug,
      contentHTML,
      author,
      generatedAt,
      // 디버깅 정보 추가 (개발 환경에서만)
      ...(process.env.NODE_ENV === 'development' && titleGenerationLogs && {
        titleGenerationLogs: {
          executionTime: titleGenerationLogs.totalTime,
          steps: titleGenerationLogs.steps,
          errors: titleGenerationLogs.errors,
          warnings: titleGenerationLogs.warnings
        }
      })
    });
  } catch (e) {
    console.error('enhance API 전체 오류:', e);
    console.error('오류 스택:', e.stack);

    // 실패 모니터링 데이터 기록
    try {
      const dashboard = getMonitoringDashboard();
      const responseTime = Date.now() - (req.startTime || Date.now());
      dashboard.recordTitleGenerationRequest(false, responseTime, 0, 'error');
    } catch (monitoringError) {
      console.warn('모니터링 데이터 기록 실패:', monitoringError.message);
    }

    // 오류 발생 시에도 기본적인 응답 제공
    try {
      // 최소한의 제목이라도 생성 시도
      let emergencyTitle = "뉴스";

      if (content) {
        const firstLine = content.split('\n').find(line => line.trim().length > 5);
        if (firstLine) {
          const cleaned = firstLine.replace(/[#>*`\-\*_]/g, "").trim();
          if (cleaned.length > 5) {
            emergencyTitle = cleaned.length > 30 ? cleaned.substring(0, 27) + '...' : cleaned;
          }
        }
      }

      if (tags.length > 0) {
        emergencyTitle = `${tags[0]} ${emergencyTitle}`;
      }

      const contentHTML = mdToHtml(content || "내용을 불러올 수 없습니다.");
      const author = getRandomAuthor();
      const generatedAt = formatKST(nowInKSTDate());
      const slug = uniqueSlug(emergencyTitle);

      console.log('긴급 응답 생성:', {
        title: emergencyTitle,
        contentLength: content?.length || 0,
        error: e.message
      });

      return res.status(200).json({
        title: emergencyTitle,
        seo: {
          title: emergencyTitle,
          description: "기사 내용을 분석하는 중 오류가 발생했습니다."
        },
        candidates: [emergencyTitle],
        metaDescription: "기사 내용을 분석하는 중 오류가 발생했습니다.",
        slug,
        contentHTML,
        author,
        generatedAt,
        error: "제목 생성 중 일부 오류가 발생했지만 기본 제목을 제공합니다.",
        ...(process.env.NODE_ENV === 'development' && {
          debugInfo: {
            originalError: e.message,
            stack: e.stack
          }
        })
      });

    } catch (emergencyError) {
      console.error('긴급 응답 생성도 실패:', emergencyError);

      // 최후의 수단: 최소한의 JSON 응답
      return res.status(500).json({
        error: "enhance 실패",
        title: "오류 발생",
        message: "기사 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        ...(process.env.NODE_ENV === 'development' && {
          originalError: e.message,
          emergencyError: emergencyError.message
        })
      });
    }
  }
}