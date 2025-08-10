// utils/metrics.js
export function logMetric(type, slug, variant = null) {
  try {
    const payload = {
      type, slug,
      variant: variant || "base",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    const data = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([data], { type: "application/json" });
      navigator.sendBeacon("/api/metrics/log", blob);
    } else {
      // keepalive로 네비게이션 직전에도 전송 시도
      fetch("/api/metrics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (_) {}
}
