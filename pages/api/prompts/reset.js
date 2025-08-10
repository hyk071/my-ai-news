// pages/api/prompts/reset.js
import fs from "fs";
import path from "path";
import { DEFAULT_PROMPTS } from "../../../lib/promptDefaults"; // pages/api/prompts/reset.js 기준 경로

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function dataDir() { return path.join(process.cwd(), "data"); }
function dataFile() { const d = dataDir(); ensureDir(d); return path.join(d, "prompts.json"); }
function ts() {
  const d = new Date(), pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function backupFile(fp) {
  try {
    if (!fs.existsSync(fp)) return null;
    const bak = fp.replace(/prompts\.json$/, `prompts.bak-${ts()}.json`);
    fs.copyFileSync(fp, bak);
    return bak;
  } catch { return null; }
}

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    if (!Array.isArray(DEFAULT_PROMPTS) || DEFAULT_PROMPTS.length === 0) {
      return res.status(500).json({ ok: false, error: "DEFAULT_PROMPTS is empty" });
    }
    const dir = dataDir();
    const fp = dataFile();
    const bak = backupFile(fp);

    const payload = DEFAULT_PROMPTS.map((p, i) => ({
      id: i + 1,
      title: p.title,
      category: p.category,
      content: p.content,
      isDefault: !!p.isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // 원자적 교체
    const tmp = path.join(dir, `prompts.tmp-${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(payload, null, 2));
    fs.renameSync(tmp, fp);

    return res.status(200).json({ ok: true, count: payload.length, backup: bak });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
