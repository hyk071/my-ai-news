// pages/api/revalidate.js
// 저장 직후 특정 경로를 재검증하는 API. secret 토큰으로 보호.
export default async function handler(req, res) {
  try {
    const { secret, paths } = req.body || {};
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: "paths[] required" });
    }

    // Next.js ISR 재검증
    for (const p of paths) {
      await res.revalidate(p);
    }
    return res.status(200).json({ revalidated: paths });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "revalidate failed" });
  }
}
