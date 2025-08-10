// pages/admin/index.js
import Link from "next/link";

export default function AdminHome() {
  return (
    <div>
      <header>
        <div className="container stack">
          <h1>관리자</h1>
          <nav>
            <Link href="/">메인</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          <div className="grid">
            <div className="card">
              <h3>기사 생성</h3>
              <p>AI 모델로 기사를 생성/저장합니다.</p>
              <Link className="btn" href="/admin/generate">바로 가기</Link>
            </div>
            <div className="card">
              <h3>프롬프트 관리</h3>
              <p>생성 프롬프트 템플릿을 관리합니다.</p>
              <Link className="btn" href="/admin/prompts">바로 가기</Link>
            </div>
            <div className="card">
              <h3>CTR 대시보드</h3>
              <p>기간·검색·정렬·CSV 내보내기 지원.</p>
              <Link className="btn" href="/admin/metrics">바로 가기</Link>
            </div>
          </div>
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News MVP</footer>
    </div>
  );
}
