// utils/retry.js
// 지수 백오프 + Jitter 재시도 유틸. API 일시 오류/429에 사용.
export async function withRetry(fn, {
  retries = 3,
  baseDelayMs = 800, // 0.8s
  maxDelayMs = 8000,
  retryOn = (err) => {
    const code = err?.response?.status || err?.status;
    return code === 429 || code >= 500; // 속도제한/서버오류
  }
} = {}) {
  let attempt = 0, lastErr;
  while (attempt <= retries) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (!retryOn(e) || attempt === retries) break;
      const jitter = Math.random() * 0.4 + 0.8; // 0.8~1.2
      const delay = Math.min(maxDelayMs, Math.round(baseDelayMs * (2 ** attempt) * jitter));
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr;
}
