// === FILE: pages/api/perplexity.js ===
import axios from "axios";
import { basePrompt } from "./prompts/articlePrompt";
import { withRetry } from "../../utils/retry";

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
      model = "llama-3.1-sonar-large-128k-online",
      tags = [],
      subject = "",
      tone = "객관적",
      lengthRange = { min: 1000, max: 2000 },
      overridePrompt
    } = req.body || {};

    const prompt = buildPrompt({ tags, subject, tone, lengthRange, overridePrompt });

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content || "(응답 없음)";
    
    // Perplexity API 응답에서 토큰 사용량 추출
    const usage = response.data?.usage || {};
    
    return res.status(200).json({
      title: "temp",
      content,
      source: "Perplexity",
      date: new Date().toISOString(),
      usage: {
        prompt_tokens: usage.prompt_tokens || 0,
        completion_tokens: usage.completion_tokens || 0,
        total_tokens: usage.total_tokens || 0
      }
    });
  } catch (e) {
    console.error(e?.response?.data || e);
    return res.status(500).json({ error: "Perplexity 기사 생성 실패" });
  }
}
