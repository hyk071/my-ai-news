// pages/api/metrics/log.js
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const { type, slug, variant, ua } = req.body || {};
    if (!type || !slug) return res.status(400).json({ error: "type/slug required" });

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "metrics.json");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const list = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : [];

    list.push({ type, slug, variant: variant || "base", ua: ua || "", ts: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "metrics log failed" });
  }
}
