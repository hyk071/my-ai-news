// === FILE: pages/api/gemini.js ===
import { GoogleGenerativeAI } from "@google/generative-ai";
import { basePrompt } from "./prompts/articlePrompt";
import { withRetry } from "../../utils/retry"; // 상단 import 추가

function buildPrompt({ tags = [], subject = "", tone = "객관적", lengthRange = {min:1000,max:2000}, overridePrompt }) {
  const keywords = tags.length ? `핵심 키워드: ${tags.join(", ")}` : "핵심 키워드: (없음)";
  const len = `원고 분량: ${lengthRange.min}~${lengthRange.max} 단어`;
  const style = `말투: ${tone}`;
  const structure = `구성: 리드 → 배경/맥락 → 핵심 분석(데이터/사례) → 영향/시사점 → 전망`;
  const quality = `요구사항: 사실검증, 과장금지, 중복/군더더기 제거, 논리적 연결 강화`;
  const template = overridePrompt || basePrompt;
  return `${template}

${keywords}
주제 설명: ${subject || "(없음)"}
${style}
${len}
${structure}
${quality}

출력: 마크다운(H2/H3) 기반의 기사만 출력`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const {
      model = "gemini-1.5-flash",
      tags = [],
      subject = "",
      tone = "객관적",
      lengthRange = { min: 1000, max: 2000 },
      overridePrompt
    } = req.body || {};

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const gemini = genAI.getGenerativeModel({ model });
    const prompt = buildPrompt({ tags, subject, tone, lengthRange, overridePrompt });
    const result = await withRetry(() => gemini.generateContent(prompt), {
      retries: 3,
      baseDelayMs: 1000,
    });
    const content = result.response?.text?.() || "(응답 없음)";

    return res.status(200).json({
      title: "temp",
      content,
      source: "Gemini",
      date: new Date().toISOString()
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Gemini 기사 생성 실패" });
  }
}
