// pages/admin/generate.js
// 관리자용 기사 생성 페이지 (고급 필터/가이드라인 포함)
// - 회사→모델 동적 로드
// - 태그/주제/말투/길이 입력
// - 고급 필터(포함/제외 키워드·문구, 제목 글자수 범위)
// - 가이드라인(데이터 근거, 클릭베이트 금지, 뉴스룸 스타일, 최소 사실개수)
// - 기사 생성 → 강화(enhance)
// - 제목 후보 6개 노출/수동 선택, A/B 두 개 선택 저장
// - 저장 시 선택 제목 우선

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const TONES = ["객관적","전문적","분석적","중립적","비판적","설득적","친근한","담백한","심층적","칼럼형"];
const LENGTH_PRESETS = [
  { value: "500-1000", label: "500~1000 단어" },
  { value: "1000-2000", label: "1000~2000 단어" },
  { value: "2000-3000", label: "2000~3000 단어" },
];

// 기본 금칙어(제목 후보 필터 및 점수화에 사용)
const DEFAULT_BANNED = ["충격","소름","대박","미쳤다","헉","레전드","어떻게?","이렇게만 하면","단번에","초대박","완전정복","충격적","반전","경악","유출"];

export default function GenerateArticle() {
  const router = useRouter();

  // ---- 생성 입력 상태 ----
  const [apiProvider, setApiProvider] = useState("openai");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [loadingModels, setLoadingModels] = useState(false);

  const [tagsInput, setTagsInput] = useState("");
  const [subject, setSubject] = useState("");
  const [tone, setTone] = useState("객관적");
  const [lengthPreset, setLengthPreset] = useState("1000-2000");

  // ---- 고급 필터/가이드라인 ----
  const [mustIncludeStr, setMustIncludeStr] = useState("");           // 쉼표 구분 키워드
  const [mustExcludeStr, setMustExcludeStr] = useState(DEFAULT_BANNED.join(", "));
  const [phraseIncludeStr, setPhraseIncludeStr] = useState("");       // 줄바꿈 구분 문구
  const [phraseExcludeStr, setPhraseExcludeStr] = useState("");
  const [titleMin, setTitleMin] = useState(45);
  const [titleMax, setTitleMax] = useState(60);
  const [requireData, setRequireData] = useState(true);               // 데이터 근거 필수
  const [forbidClickbait, setForbidClickbait] = useState(true);       // 클릭베이트 금지
  const [newsroomStyle, setNewsroomStyle] = useState(true);           // 뉴스룸 스타일
  const [numFactsMin, setNumFactsMin] = useState(2);                  // 최소 사실/수치 개수

  // ---- 결과 상태 ----
  const [raw, setRaw] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [loading, setLoading] = useState(false);

  // ---- 프롬프트 템플릿 목록 ----
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(null);

  // ---- 제목 후보/A-B 선택 상태 ----
  const [candidates, setCandidates] = useState([]);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(null);
  const [abSel, setAbSel] = useState([]); // 최대 2개

  // 프롬프트 목록 로드
  useEffect(() => { (async () => {
    try { const r = await fetch("/api/prompts"); setPrompts(await r.json()); } catch (_) {}
  })(); }, []);

  // 회사 변경 시 모델 목록 동적 로드
  useEffect(() => { loadModels(apiProvider); }, [apiProvider]);
  async function loadModels(provider) {
    setLoadingModels(true);
    try {
      const r = await fetch(`/api/models/${provider}`);
      const j = await r.json();
      const arr = j.models || [];
      setModels(arr);
      setModel(arr[0] || "");
    } catch (e) {
      console.error(e);
      setModels([]); setModel("");
      } finally { setLoadingModels(false); }
    }

  // 키워드 파서(쉼표/해시태그/공백 모두 허용, # 제거, 중복 제거)
  const tags = useMemo(() => {
    const s = (tagsInput || "").trim();
    if (!s) return [];
    const byComma = s.split(",").map(x => x.trim()).filter(Boolean);
    if (byComma.length > 1) return Array.from(new Set(byComma.map(x => x.replace(/^#/, "")).filter(Boolean)));
    const hashTags = Array.from(s.matchAll(/#([^\s#,]+)/g)).map(m => m[1]);
    if (hashTags.length) return Array.from(new Set(hashTags));
    return Array.from(new Set(s.split(/\s+/).map(x => x.replace(/^#/, "")).filter(Boolean)));
  }, [tagsInput]);

  // 길이 프리셋 → 숫자 범위
  const lengthRange = useMemo(() => {
    const [min, max] = (lengthPreset || "1000-2000").split("-").map(n => parseInt(n, 10));
    return { min, max };
  }, [lengthPreset]);

  // 필터/가이드라인 객체화
  const filters = useMemo(() => {
    const normCSV = (s) => Array.from(new Set((s || "").split(",").map(x => x.trim()).filter(Boolean)));
    const normLines = (s) => Array.from(new Set((s || "").split(/\n+/).map(x => x.trim()).filter(Boolean)));
    // 제목 글자 범위 방어
    let min = parseInt(titleMin, 10) || 45;
    let max = parseInt(titleMax, 10) || 60;
    if (min > max) [min, max] = [max, min];
    return {
      mustInclude: normCSV(mustIncludeStr).map(s => s.replace(/^#/, "")),
      mustExclude: normCSV(mustExcludeStr).map(s => s.replace(/^#/, "")),
      phraseInclude: normLines(phraseIncludeStr),
      phraseExclude: normLines(phraseExcludeStr),
      titleLen: { min, max },
    };
  }, [mustIncludeStr, mustExcludeStr, phraseIncludeStr, phraseExcludeStr, titleMin, titleMax]);

  const guidelines = useMemo(() => ({
    dataBacked: !!requireData,
    noClickbait: !!forbidClickbait,
    newsroomStyle: !!newsroomStyle,
    numFactsMin: Math.max(0, parseInt(numFactsMin, 10) || 0),
  }), [requireData, forbidClickbait, newsroomStyle, numFactsMin]);

  // 1단계: 원문 생성 → 2단계: 강화
  async function generateArticle() {
    setLoading(true); setRaw(null); setEnhanced(null);
    setCandidates([]); setSelectedTitleIdx(null); setAbSel([]);
    try {
      const body = { model, tags, subject, tone, lengthRange, filters, guidelines };
      if (selectedPromptId) {
        const p = prompts.find(x => x.id === Number(selectedPromptId));
        if (p) body.overridePrompt = p.content;
      }

      // 1) 원문 생성 (회사별 API 라우트: 필요 시 filters/guidelines를 내부 프롬프트에 반영하도록 확장 가능)
      const resp = await fetch(`/api/${apiProvider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setRaw(data);

      // 2) SEO/제목 강화
      const enh = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data.content,
          tags,
          subject,
          tone,
          lengthRange,
          filters,
          guidelines,
          textProvider: apiProvider,
          textModel: model,
        }),
      }).then(r => r.json());

      setEnhanced({ ...enh, source: data.source, date: data.date });
      setCandidates(Array.isArray(enh.candidates) ? enh.candidates : []);
      setSelectedTitleIdx(null);
      setAbSel([]);
    } catch (e) {
      console.error(e);
      setRaw({ error: e.message || "API 호출 실패" });
    } finally { setLoading(false); }
  }

  // 저장
  async function saveArticle() {
    if (!enhanced || enhanced.error) return alert("저장할 강화된 기사 데이터가 없습니다.");
    try {
      const chosenTitle =
        (selectedTitleIdx !== null && candidates[selectedTitleIdx])
          ? candidates[selectedTitleIdx]
          : enhanced.title;

      const abVariants =
        (Array.isArray(abSel) && abSel.length === 2)
          ? abSel.map(i => candidates[i]).filter(Boolean).slice(0, 2)
          : undefined;

      const res = await fetch("/api/saveArticle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: chosenTitle,
          contentHTML: enhanced.contentHTML,
          source: enhanced.source,
          date: enhanced.date,
          seo: { ...(enhanced.seo || {}), title: chosenTitle },
          slug: enhanced.slug,
          author: enhanced.author,
          generatedAt: enhanced.generatedAt,
          abVariants,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      router.push('/');
    } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <header>
        <div className="container stack">
          <h1>기사 생성</h1>
          <nav>
            <Link href="/">홈</Link>
            <Link href="/admin">관리자</Link>
            <Link href="/admin/prompts">프롬프트 관리</Link>
            <Link href="/admin/metrics">CTR 대시보드</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          {/* 입력 카드 */}
          <div className="card stack-col">
            {/* 회사/모델 */}
            <div className="stack" style={{ flexWrap: "wrap", rowGap: 8 }}>
              <label>AI 회사</label>
              <select className="select" onChange={e => setApiProvider(e.target.value)} value={apiProvider}>
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
                <option value="perplexity">Perplexity</option>
              </select>

              <label>모델</label>
              <select className="select" onChange={e => setModel(e.target.value)} value={model} disabled={loadingModels || !models.length}>
                {loadingModels && <option>로딩 중...</option>}
                {!loadingModels && models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <button className="btn" onClick={() => loadModels(apiProvider)} disabled={loadingModels}>모델 새로고침</button>
            </div>

            {/* 프롬프트 템플릿 */}
            <div className="stack">
              <label>프롬프트 템플릿</label>
              <select className="select" value={selectedPromptId || ""} onChange={e => setSelectedPromptId(e.target.value)}>
                <option value="">(선택 안 함)</option>
                {prompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>

            {/* 태그/주제/말투/길이 */}
            <div className="stack-col">
              <label>핵심 키워드 (쉼표 또는 해시태그)</label>
              <input className="input" placeholder="예: 생성형 AI, 반도체, 규제  또는  #생성형AI #반도체" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
              <div>{tags.map(t => (<span key={t} className="tag-chip">{t}</span>))}</div>
            </div>

            <div className="stack-col">
              <label>주제 설명</label>
              <textarea
                className="textarea textarea-lg"
                rows={6}
                style={{ minHeight: 160 }}
                placeholder="기사의 초점/배경/관점 등을 간단히 적으세요."
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="stack" style={{ flexWrap: "wrap", rowGap: 8 }}>
              <label>말투</label>
              <select className="select" onChange={e => setTone(e.target.value)} value={tone}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>

              <label>길이</label>
              <select className="select" onChange={e => setLengthPreset(e.target.value)} value={lengthPreset}>
                {LENGTH_PRESETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* 고급 필터 */}
            <div className="card" style={{ marginTop: 12 }}>
              <h3>고급 필터</h3>
              <div className="stack-col">
                <label>제목 필수 포함 키워드 (쉼표)</label>
                <input className="input" placeholder="예: 생성형 AI, 반도체" value={mustIncludeStr} onChange={e => setMustIncludeStr(e.target.value)} />
              </div>
              <div className="stack-col">
                <label>제목 금지 키워드 (쉼표)</label>
                <input className="input" placeholder="낚시성/과장 표현 등" value={mustExcludeStr} onChange={e => setMustExcludeStr(e.target.value)} />
              </div>
              <div className="stack-col">
                <label>제목 필수 포함 문구 (줄바꿈 구분)</label>
                <textarea className="textarea" rows={2} placeholder="예: 국내 시장, 분기 실적" value={phraseIncludeStr} onChange={e => setPhraseIncludeStr(e.target.value)} />
              </div>
              <div className="stack-col">
                <label>제목 금지 문구 (줄바꿈 구분)</label>
                <textarea className="textarea" rows={2} placeholder="예: ○○만 하면, 소름 돋는" value={phraseExcludeStr} onChange={e => setPhraseExcludeStr(e.target.value)} />
              </div>
              <div className="stack" style={{ flexWrap: "wrap", columnGap: 12, rowGap: 8 }}>
                <label>제목 글자수</label>
                <input className="input" type="number" style={{ width: 100 }} value={titleMin} onChange={e => setTitleMin(e.target.value)} />~
                <input className="input" type="number" style={{ width: 100 }} value={titleMax} onChange={e => setTitleMax(e.target.value)} /> 자
              </div>
            </div>

            {/* 가이드라인 */}
            <div className="card" style={{ marginTop: 12 }}>
              <h3>가이드라인</h3>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={requireData} onChange={e => setRequireData(e.target.checked)} />
                데이터 근거(기관/수치/기간) 최소 <input className="input" type="number" style={{ width: 80 }} value={numFactsMin} onChange={e => setNumFactsMin(e.target.value)} /> 개 포함
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input type="checkbox" checked={forbidClickbait} onChange={e => setForbidClickbait(e.target.checked)} />
                클릭베이트 금지(과장·낚시 표현 배제)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input type="checkbox" checked={newsroomStyle} onChange={e => setNewsroomStyle(e.target.checked)} />
                뉴스룸 스타일(명확한 리드/넛그래프·자연스러운 소제목)
              </label>
            </div>

            {/* 액션 */}
            <div className="stack" style={{ marginTop: 12 }}>
              <button className="btn" onClick={generateArticle} disabled={loading}>
                {loading ? "생성 중..." : "생성"}
              </button>
              <button className="btn" onClick={saveArticle} disabled={!enhanced || enhanced.error}>저장</button>
            </div>
          </div>

          {/* 미리보기 */}
          {enhanced && !enhanced.error && (
            <article className="article card" style={{ marginTop: 16 }}>
              <h1 className="headline">{enhanced.title}</h1>
              <div className="meta"><span>{enhanced.source} · {enhanced.author}</span> · <time>{enhanced.generatedAt}</time></div>
              <div className="content" dangerouslySetInnerHTML={{ __html: enhanced.contentHTML }} />
            </article>
          )}

          {raw && raw.error && (
            <div className="card" style={{ marginTop: 16, color: "red" }}>{raw.error}</div>
          )}

          {/* 후보 제목 수동 선택 + A/B 테스트 */}
          {Array.isArray(candidates) && candidates.length > 0 && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 style={{ marginBottom: 8 }}>제목 후보 선택 (최대 6개)</h3>

              {/* 라디오: 하나 선택 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                {candidates.map((t, idx) => (
                  <label key={idx} className="card" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="radio"
                      name="headlineCandidate"
                      checked={selectedTitleIdx === idx}
                      onChange={() => setSelectedTitleIdx(idx)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>

              <div className="stack" style={{ marginTop: 8 }}>
                <button
                  className="btn"
                  disabled={selectedTitleIdx === null}
                  onClick={() => {
                    if (selectedTitleIdx === null) return;
                    const t = candidates[selectedTitleIdx];
                    setEnhanced(prev => prev ? ({ ...prev, title: t, seo: { ...(prev.seo||{}), title: t } }) : prev);
                  }}
                >
                  선택한 제목 적용
                </button>
              </div>

              {/* (옵션) A/B 테스트용 두 개 제목 선택 */}
              <div className="card" style={{ marginTop: 12 }}>
                <h3 style={{ marginBottom: 8 }}>A/B 테스트(선택)</h3>
                <p style={{ color:"#6b7280", marginTop:0, marginBottom:8 }}>두 개를 선택하면 저장 시 함께 기록됩니다.</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:6 }}>
                  {candidates.map((t, idx) => {
                    const checked = abSel.includes(idx);
                    return (
                      <label key={`ab-${idx}`} className="card" style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isOn = e.target.checked;
                            setAbSel(prev => {
                              const set = new Set(prev || []);
                              if (isOn) set.add(idx); else set.delete(idx);
                              return Array.from(set).slice(0, 2);
                            });
                          }}
                        />
                        <span>{t}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News MVP</footer>
    </div>
  );
}
