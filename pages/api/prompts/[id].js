// pages/api/prompts/[id].js
import fs from "fs";
import path from "path";

function dataFile() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "prompts.json");
}
function readAll() {
  const fp = dataFile();
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, "utf8")); } catch { return []; }
}
function writeAll(list) {
  const fp = dataFile();
  fs.writeFileSync(fp, JSON.stringify(list, null, 2));
}

export default function handler(req, res) {
  const id = Number(req.query.id);
  if (!id) return res.status(400).json({ error: "invalid id" });
  const list = readAll();
  const idx = list.findIndex(p => Number(p.id) === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  if (req.method === "PUT") {
    const { title, category, content } = req.body || {};
    if (title) list[idx].title = title.toString().trim();
    if (category) list[idx].category = category.toString().trim();
    if (content) list[idx].content = content.toString();
    list[idx].updatedAt = new Date().toISOString();
    writeAll(list);
    return res.status(200).json(list[idx]);
  }
  if (req.method === "DELETE") {
    const [removed] = list.splice(idx, 1);
    writeAll(list);
    return res.status(200).json({ ok: true, removed });
  }
  return res.status(405).end("Method Not Allowed");
}