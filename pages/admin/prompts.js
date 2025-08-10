// pages/admin/prompts.js
// 프롬프트 관리 UI: 카테고리/검색/CRUD/미리보기/기본세트 복구
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PROMPT_CATEGORIES } from "../../lib/promptDefaults";

function Editor({ value, onChange }) {
  return (
    <textarea
      className="textarea"
      rows={16}
      style={{ width: "100%", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      placeholder={"여기에 프롬프트 내용을 입력하세요 (마크다운/일반문장)"}
    />
  );
}

export default function PromptsPage(){
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sel, setSel] = useState(null); // {id,title,category,content}
  const [draft, setDraft] = useState({ title: "", category: "General", content: "" });
  const [loading, setLoading] = useState(false);

  async function load(){
    setLoading(true);
    try { const r = await fetch("/api/prompts"); setItems(await r.json()); }
    catch(_){} finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=>{
    const key = (q||"").toLowerCase();
    return (items||[]).filter(p =>
      (cat === "All" || p.category === cat) && (
        !key || p.title.toLowerCase().includes(key) || p.content.toLowerCase().includes(key)
      )
    );
  },[items,q,cat]);

  async function create(){
    if (!draft.title || !draft.content) return alert("제목/내용을 입력하세요");
    const r = await fetch("/api/prompts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(draft) });
    if (!r.ok) return alert("생성 실패");
    setDraft({ title: "", category: draft.category || "General", content: "" });
    load();
  }
  async function update(){
    if (!sel) return;
    const r = await fetch(`/api/prompts/${sel.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body: JSON.stringify(sel) });
    if (!r.ok) return alert("수정 실패");
    load();
  }
  async function remove(id){
    if (!confirm("삭제하시겠습니까?")) return;
    const r = await fetch(`/api/prompts/${id}`, { method:"DELETE" });
    if (!r.ok) return alert("삭제 실패");
    if (sel?.id === id) setSel(null);
    load();
  }
  // pages/admin/prompts.js 내 reset 이벤트
  async function resetDefaults(){
    if (!confirm("기본 템플릿 세트로 복구합니다. 계속할까요?")) return;
    const r = await fetch("/api/prompts/reset", { method: "POST" });
    const j = await r.json().catch(()=>({}));
    if (!r.ok || j?.ok === false) return alert(`복구 실패: ${j?.error || `HTTP ${r.status}`}`);
    alert(`복구 완료: ${j.count}개, 백업: ${j.backup || "(없음)"}`);
    // 목록 새로고침
    load();
  }


  return (
    <div>
      <header>
        <div className="container stack">
          <h1>프롬프트 관리</h1>
          <nav>
            <Link href="/">메인</Link>
            <Link href="/admin">관리자</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          {/* 컨트롤 바 */}
          <div className="card" style={{ display:"grid", gridTemplateColumns:"repeat(6, minmax(0, 1fr))", gap:8 }}>
            <div style={{ gridColumn:"span 2" }}>
              <label>카테고리</label>
              <select className="select" value={cat} onChange={(e)=>setCat(e.target.value)}>
                <option value="All">All</option>
                {PROMPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"span 3" }}>
              <label>검색</label>
              <input className="input" placeholder="제목/내용 검색" value={q} onChange={e=>setQ(e.target.value)} />
            </div>
            <div style={{ gridColumn:"span 1", display:"flex", alignItems:"end", gap:8 }}>
              <button className="btn" onClick={resetDefaults}>기본 세트 복구</button>
            </div>
          </div>

          {/* 목록 & 편집 */}
          <div className="grid" style={{ marginTop:12 }}>
            {/* 목록 */}
            <div className="card" style={{ minHeight: 480 }}>
              <h3>프롬프트 목록 ({filtered.length})</h3>
              {loading && <p>로딩 중…</p>}
              {!loading && filtered.map(p => (
                <div key={p.id} className="card" style={{ marginTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
                    <div>
                      <strong>[{p.category}]</strong> {p.title}
                      {p.isDefault && <span className="tag-chip" title="기본 템플릿">default</span>}
                    </div>
                    <div className="stack">
                      <button className="btn" onClick={()=>setSel(p)}>편집</button>
                      <button className="btn" onClick={()=>navigator.clipboard.writeText(p.content)}>복사</button>
                      <button className="btn" onClick={()=>remove(p.id)}>삭제</button>
                    </div>
                  </div>
                  <details style={{ marginTop:6 }}>
                    <summary>미리보기</summary>
                    <pre style={{ whiteSpace:"pre-wrap" }}>{p.content}</pre>
                  </details>
                </div>
              ))}
            </div>

            {/* 생성/편집 패널 */}
            <div className="card" style={{ minHeight: 480 }}>
              <h3>{sel ? "편집" : "새 프롬프트 추가"}</h3>

              <label>제목</label>
              <input className="input" value={(sel?.title ?? draft.title)} onChange={e => sel ? setSel({...sel, title:e.target.value}) : setDraft({...draft, title:e.target.value})} />

              <label style={{ marginTop:8 }}>카테고리</label>
              <select className="select" value={(sel?.category ?? draft.category)} onChange={e => sel ? setSel({...sel, category:e.target.value}) : setDraft({...draft, category:e.target.value})}>
                {PROMPT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ marginTop:8 }}>프롬프트 내용</label>
              <Editor value={(sel?.content ?? draft.content)} onChange={v => sel ? setSel({...sel, content:v}) : setDraft({...draft, content:v})} />

              <div className="stack" style={{ marginTop:8 }}>
                {!sel && <button className="btn" onClick={create}>추가</button>}
                {sel && <>
                  <button className="btn" onClick={update}>저장</button>
                  <button className="btn" onClick={()=>setSel(null)}>취소</button>
                </>}
              </div>

              <div className="card" style={{ marginTop:12 }}>
                <p style={{ margin:0, color:"#6b7280" }}>
                  * 이 페이지에서 저장한 프롬프트는 <strong>기사 생성</strong> 페이지의 “프롬프트 템플릿” 드롭다운에 자동으로 나타납니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News MVP</footer>
    </div>
  );
}
