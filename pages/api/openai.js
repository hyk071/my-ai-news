// === FILE: pages/api/openai.js ===
import OpenAI from "openai";
import { basePrompt } from "./prompts/articlePrompt";
import { withRetry } from "../../utils/retry"; // 상단 import 추가

function buildPrompt({ tags = [], subject = "", tone = "객관적", lengthRange = {min:1000,max:2000}, overridePrompt }) {
  const keywords = tags.length ? `핵심 키워드: ${tags.join(", ")}` : "핵심 키워드: (없음)";
  const len = `원고 분량: ${lengthRange.min}~${lengthRange.max} 단어`;
  const style = `말투: ${tone}`;
  const structure = `구성: 리드(핵심 요약) → 배경/맥락 → 핵심 분석(데이터/사례) → 영향/시사점 → 전망/과제`;
  const quality = `요구사항: 사실관계 검토, 과장·추측 금지, 중복/군더더기 배제, 문단 간 논리 연결 강화, 전문용어는 간단 설명`;
  const template = overridePrompt || basePrompt;
  return `${template}

${keywords}
주제 설명: ${subject || "(없음)"}
${style}
${len}
${structure}
${quality}

출력 형식:
- 본문은 마크다운(H2=대제목, H3=소제목) 사용
- 표나 목록이 적절할 때 활용
- 출처/근거가 모호하면 '전문가 견해' 수준으로 표현(허위사실 금지)
- 기사만 출력(불필요한 코멘트 제거)`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const {
      model = "gpt-4o-mini",
      tags = [],
      subject = "",
      tone = "객관적",
      lengthRange = { min: 1000, max: 2000 },
      overridePrompt
    } = req.body || {};

    const prompt = buildPrompt({ tags, subject, tone, lengthRange, overridePrompt });

    // 모델에 따라 파라미터 동적 설정
    const params = {
      model,
      messages: [{ role: "user", content: prompt }],
    };
    if (model !== 'gpt5mini') {
      params.temperature = 0.5;
    }

    // 일시 오류/429 대비: 지수 백오프 재시도 래퍼로 감싸기
    const completion = await withRetry(() => 
      client.chat.completions.create(params),
      { retries: 3, baseDelayMs: 1000 } // 필요 시 조정
    );

    const content = completion.choices?.[0]?.message?.content || "(응답 없음)";
    return res.status(200).json({
      title: "temp",
      content,
      source: "OpenAI",
      date: new Date().toISOString()
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "OpenAI 기사 생성 실패" });
  }
}
