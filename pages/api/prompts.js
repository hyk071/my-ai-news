import fs from "fs";
import path from "path";

const promptsFile = path.join(process.cwd(), "data", "prompts.json");

function readPrompts() {
  const data = fs.readFileSync(promptsFile, "utf-8");
  return JSON.parse(data);
}
function writePrompts(data) {
  fs.writeFileSync(promptsFile, JSON.stringify(data, null, 2), "utf-8");
}

export default function handler(req, res) {
  if (req.method === "GET") {
    const prompts = readPrompts();
    return res.status(200).json(prompts);
  }
  if (req.method === "POST") {
    const { title, description, content } = req.body || {};
    if (!title || !content) return res.status(400).json({ error: "title/content 필요" });
    const prompts = readPrompts();
    const newId = prompts.length ? Math.max(...prompts.map(p => p.id)) + 1 : 1;
    const newPrompt = { id: newId, title, description: description || "", content };
    prompts.push(newPrompt);
    writePrompts(prompts);
    return res.status(201).json(newPrompt);
  }
  if (req.method === "PUT") {
    const { id, title, description, content } = req.body || {};
    if (!id || !title || !content) return res.status(400).json({ error: "id/title/content 필요" });
    const prompts = readPrompts();
    const idx = prompts.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "없음" });
    prompts[idx] = { id, title, description: description || "", content };
    writePrompts(prompts);
    return res.status(200).json(prompts[idx]);
  }
  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "id 필요" });
    let prompts = readPrompts();
    prompts = prompts.filter(p => p.id !== id);
    writePrompts(prompts);
    return res.status(200).json({ ok: true });
  }
  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).end("Method Not Allowed");
}
