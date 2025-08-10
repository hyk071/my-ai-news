// utils/ab.js
// 초기 50/50 → 가중치(CTR 기반)로 확률 배정. 한번 배정되면 로컬스토리지에 고정.
export function assignVariant(slug, variants, weightsForSlug) {
  if (!variants || variants.length !== 2) return { variant: "base", title: null };
  if (typeof window === "undefined") return { variant: "base", title: null };

  const key = `ab:${slug}`;
  let v = localStorage.getItem(key);
  if (v !== "A" && v !== "B") {
    // 가중치: {A: number, B: number} → 확률로 정규화
    const wA = Number(weightsForSlug?.A ?? 0.5);
    const wB = Number(weightsForSlug?.B ?? 0.5);
    const sum = (wA > 0 ? wA : 0) + (wB > 0 ? wB : 0);
    const pA = sum > 0 ? (wA / sum) : 0.5;
    v = Math.random() < pA ? "A" : "B";
    localStorage.setItem(key, v);
  }
  const title = v === "A" ? variants[0] : variants[1];
  return { variant: v, title };
}
