// === FILE: pages/api/models/[provider].js ===
import OpenAI from "openai";

export default async function handler(req, res) {
  const { provider } = req.query;
  try {
    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) return res.status(200).json({ models: [] });
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const list = await client.models.list();
      const ids = (list?.data || []).map(m => m.id);
      
      // GPT-5와 GPT-4 계열만 필터링 (구모델 제외)
      const models = ids.filter(id => {
        // GPT-5 계열 (gpt-5, gpt5 등)
        if (id.startsWith('gpt-5') || id.startsWith('gpt5')) return true;
        
        // GPT-4 계열 (gpt-4o, gpt-4o-mini, gpt-4-turbo 등)
        if (id.startsWith('gpt-4')) return true;
        
        // o1, o1-mini 등 최신 모델들
        if (id.startsWith('o1')) return true;
        
        return false;
      });
      
      return res.status(200).json({ models });
    }

    if (provider === "gemini") {
      if (!process.env.GOOGLE_API_KEY) return res.status(200).json({ models: [] });
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;
      const r = await fetch(url);
      const j = await r.json();
      const names = (j.models || []).map(m => (m.name || "").replace(/^models\//, ""));
      // 텍스트 생성 위주 모델(간단 제외 규칙)
      const models = names.filter(n => !/embed|embedding|moderation/i.test(n));
      return res.status(200).json({ models });
    }

    if (provider === "claude") {
      // Anthropic는 공식 list API가 없어 환경변수 또는 기본 셋 제공
      const env = process.env.ANTHROPIC_MODELS;
      const models = env ? env.split(",").map(s => s.trim()).filter(Boolean) : [
        "claude-3-5-sonnet-latest",
        "claude-3-7-sonnet-latest",
        "claude-3-opus-latest",
        "claude-3-haiku-latest",
      ];
      return res.status(200).json({ models });
    }

    return res.status(400).json({ error: "unknown provider" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "models list failed" });
  }
}