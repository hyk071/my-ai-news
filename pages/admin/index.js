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
            <Link href="/search">검색</Link>
          </nav>
        </div>
      </header>

      <main>
        <div className="container">
          <div className="admin-grid">
            <div className="card">
              <div className="card-icon">✍️</div>
              <h3>기사 생성</h3>
              <p>AI 모델로 기사를 생성하고 저장합니다.</p>
              <Link className="btn btn-primary" href="/admin/generate">바로 가기</Link>
            </div>
            
            <div className="card">
              <div className="card-icon">📊</div>
              <h3>생성 통계</h3>
              <p>생성된 기사의 CTR 및 성과를 분석합니다.</p>
              <Link className="btn btn-primary" href="/admin/metrics">바로 가기</Link>
            </div>
            
            <div className="card">
              <div className="card-icon">🔧</div>
              <h3>프롬프트 관리</h3>
              <p>AI 생성 프롬프트 템플릿을 관리합니다.</p>
              <Link className="btn btn-primary" href="/admin/prompts">바로 가기</Link>
            </div>
            
            <div className="card">
              <div className="card-icon">📈</div>
              <h3>시스템 모니터링</h3>
              <p>제목 생성 시스템의 실시간 성능을 모니터링합니다.</p>
              <Link className="btn btn-primary" href="/admin/monitoring">바로 가기</Link>
            </div>
            
            <div className="card">
              <div className="card-icon">🔍</div>
              <h3>기사 관리</h3>
              <p>생성된 기사를 검색하고 관리합니다.</p>
              <Link className="btn btn-secondary" href="/search">바로 가기</Link>
            </div>
            
            <div className="card">
              <div className="card-icon">⚙️</div>
              <h3>시스템 설정</h3>
              <p>AI 모델 설정 및 시스템 구성을 관리합니다.</p>
              <Link className="btn btn-secondary" href="/admin/settings">바로 가기</Link>
            </div>
          </div>
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News MVP</footer>
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .stack {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }
        
        .stack nav {
          display: flex;
          gap: 1rem;
        }
        
        .stack nav a {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
        }
        
        .stack nav a:hover {
          color: #1f2937;
        }
        
        header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }
        
        main {
          min-height: 70vh;
          padding: 2rem 0;
        }
        
        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-color: #3b82f6;
        }
        
        .card-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .card h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .card p {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
          line-height: 1.5;
        }
        
        .btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
          background: #e5e7eb;
        }
        
        footer {
          text-align: center;
          padding: 2rem 0;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          margin-top: 3rem;
        }
        
        @media (max-width: 768px) {
          .admin-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .card {
            padding: 1.5rem;
          }
          
          .stack {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
