// pages/admin/metrics.js
import fs from "fs";
import path from "path";
import Link from "next/link";
import { useMemo, useState } from "react";

function parseDate(s) { return s ? new Date(s) : null; }
function inRange(ts, from, to) {
  const t = new Date(ts).getTime();
  if (from && t < from.getTime()) return false;
  if (to && t > to.getTime()) return false;
  return true;
}
function aggregate(metrics) {
  // slug+variant 단위 집계
  const map = new Map();
  for (const m of metrics) {
    const key = `${m.slug}|${m.variant || "base"}`;
    if (!map.has(key)) map.set(key, { slug: m.slug, variant: m.variant || "base", view: 0, click: 0, read: 0 });
    const obj = map.get(key);
    if (m.type === "view") obj.view++;
    else if (m.type === "click") obj.click++;
    else if (m.type === "read") obj.read++;
  }
  return Array.from(map.values()).map(x => ({ ...x, ctr: x.view ? (x.click / x.view) : 0 }));
}
function toCSV(rows, titles) {
  const header = ["slug","title","variant","views","clicks","reads","ctr%"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const title = (titles[r.slug] || "").replace(/"/g, '""');
    lines.push([
      `"${r.slug}"`,
      `"${title}"`,
      r.variant,
      r.view,
      r.click,
      r.read,
      (r.ctr * 100).toFixed(2)
    ].join(","));
  }
  return lines.join("\n");
}

export default function MetricsPage({ metrics, articles }) {
  const titleMap = useMemo(() => {
    const m = {};
    for (const a of articles) m[a.slug] = a.title;
    return m;
  }, [articles]);

  // 필터 상태
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("ctr");
  const [sortDir, setSortDir] = useState("desc"); // asc|desc

  const from = useMemo(() => parseDate(fromStr), [fromStr]);
  const to = useMemo(() => (toStr ? new Date(new Date(toStr).getTime() + 86399999) : null), [toStr]); // inclusive

  const filtered = useMemo(() => {
    const lowerQ = (q || "").toLowerCase();
    return metrics.filter(m =>
      inRange(m.ts, from, to) &&
      (
        !q ||
        (m.slug && m.slug.toLowerCase().includes(lowerQ)) ||
        (titleMap[m.slug] && titleMap[m.slug].toLowerCase().includes(lowerQ))
      )
    );
  }, [metrics, from, to, q, titleMap]);

  const rows = useMemo(() => aggregate(filtered), [filtered]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "slug" || sortKey === "variant") {
        return a[sortKey].localeCompare(b[sortKey]) * dir;
      }
      return ((a[sortKey] || 0) - (b[sortKey] || 0)) * dir;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function downloadCSV() {
    const csv = toCSV(sorted, titleMap);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "metrics.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <header>
        <div className="container stack">
          <h1>CTR 대시보드</h1>
          <nav>
            <Link href="/">메인</Link>
            <Link href="/admin">관리자</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          {/* 컨트롤 패널 */}
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 8 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label>시작일</label>
              <input type="date" className="input" value={fromStr} onChange={e => setFromStr(e.target.value)} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label>종료일</label>
              <input type="date" className="input" value={toStr} onChange={e => setToStr(e.target.value)} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label>검색(슬러그/제목)</label>
              <input className="input" placeholder="예: gpt, 반도체..." value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label>정렬 컬럼</label>
              <select className="select" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                <option value="ctr">CTR</option>
                <option value="view">Views</option>
                <option value="click">Clicks</option>
                <option value="read">Reads</option>
                <option value="slug">Slug</option>
                <option value="variant">Variant</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label>정렬 방향</label>
              <select className="select" value={sortDir} onChange={e => setSortDir(e.target.value)}>
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", alignItems: "end" }}>
              <button className="btn" onClick={downloadCSV}>CSV 내보내기</button>
            </div>
          </div>

          {/* 표 */}
          <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8 }}>Slug</th>
                  <th style={{ textAlign: "left", padding: 8 }}>제목(현재 저장)</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Variant</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Views</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Clicks</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Reads</th>
                  <th style={{ textAlign: "right", padding: 8 }}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 8, fontFamily: "monospace" }}>{r.slug}</td>
                    <td style={{ padding: 8 }}>{titleMap[r.slug] || "-"}</td>
                    <td style={{ padding: 8 }}>{r.variant}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.view}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.click}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.read}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{(r.ctr * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News MVP</footer>
    </div>
  );
}

export async function getServerSideProps() {
  const dataDir = path.join(process.cwd(), "data");
  const mPath = path.join(dataDir, "metrics.json");
  const aPath = path.join(dataDir, "articles.json");
  const metrics = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, "utf8")) : [];
  const articles = fs.existsSync(aPath) ? JSON.parse(fs.readFileSync(aPath, "utf8")) : [];
  return { props: { metrics, articles } };
}
