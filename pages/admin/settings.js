// pages/admin/settings.js
import { useState } from 'react';
import Link from 'next/link';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    aiProvider: 'openai',
    maxArticlesPerDay: 10,
    autoPublish: false,
    qualityThreshold: 0.7,
    enableMonitoring: true,
    cacheEnabled: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      // 설정 저장 로직 (실제로는 API 호출)
      console.log('설정 저장:', settings);
      alert('설정이 저장되었습니다.');
    } catch (error) {
      alert('설정 저장에 실패했습니다.');
    }
  };

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-content">
            <h1>시스템 설정</h1>
            <nav>
              <Link href="/admin">관리자 홈</Link>
              <Link href="/">메인</Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <div className="container">
          <div className="settings-grid">
            {/* AI 설정 */}
            <div className="settings-section">
              <h2>🤖 AI 모델 설정</h2>
              <div className="setting-item">
                <label>기본 AI 제공사</label>
                <select 
                  value={settings.aiProvider}
                  onChange={(e) => handleSettingChange('aiProvider', e.target.value)}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="claude">Anthropic (Claude)</option>
                  <option value="gemini">Google (Gemini)</option>
                </select>
              </div>
              
              <div className="setting-item">
                <label>품질 임계값</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={settings.qualityThreshold}
                  onChange={(e) => handleSettingChange('qualityThreshold', parseFloat(e.target.value))}
                />
                <span className="range-value">{settings.qualityThreshold}</span>
              </div>
            </div>

            {/* 생성 설정 */}
            <div className="settings-section">
              <h2>📝 기사 생성 설정</h2>
              <div className="setting-item">
                <label>일일 최대 기사 수</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxArticlesPerDay}
                  onChange={(e) => handleSettingChange('maxArticlesPerDay', parseInt(e.target.value))}
                />
              </div>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.autoPublish}
                    onChange={(e) => handleSettingChange('autoPublish', e.target.checked)}
                  />
                  자동 발행 활성화
                </label>
              </div>
            </div>

            {/* 시스템 설정 */}
            <div className="settings-section">
              <h2>⚙️ 시스템 설정</h2>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enableMonitoring}
                    onChange={(e) => handleSettingChange('enableMonitoring', e.target.checked)}
                  />
                  모니터링 활성화
                </label>
              </div>
              
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.cacheEnabled}
                    onChange={(e) => handleSettingChange('cacheEnabled', e.target.checked)}
                  />
                  캐시 활성화
                </label>
              </div>
            </div>

            {/* API 키 관리 */}
            <div className="settings-section">
              <h2>🔑 API 키 관리</h2>
              <div className="setting-item">
                <label>OpenAI API 키</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="api-key-input"
                />
              </div>
              
              <div className="setting-item">
                <label>Anthropic API 키</label>
                <input
                  type="password"
                  placeholder="sk-ant-..."
                  className="api-key-input"
                />
              </div>
              
              <div className="setting-item">
                <label>Google API 키</label>
                <input
                  type="password"
                  placeholder="AIza..."
                  className="api-key-input"
                />
              </div>
            </div>
          </div>

          <div className="actions">
            <button onClick={handleSave} className="btn btn-primary">
              설정 저장
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary">
              초기화
            </button>
          </div>
        </div>
      </main>

      <footer>© {new Date().getFullYear()} My AI News</footer>

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
        }

        .header-content h1 {
          margin: 0;
          color: #1f2937;
        }

        .header-content nav {
          display: flex;
          gap: 1rem;
        }

        .header-content nav a {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
        }

        .header-content nav a:hover {
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

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .settings-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .settings-section h2 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #f3f4f6;
        }

        .setting-item {
          margin-bottom: 1.5rem;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-item label {
          display: block;
          margin-bottom: 0.5rem;
          color: #374151;
          font-weight: 500;
        }

        .setting-item input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        .setting-item input,
        .setting-item select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .setting-item input:focus,
        .setting-item select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .api-key-input {
          font-family: monospace;
          font-size: 0.9rem;
        }

        .range-value {
          margin-left: 1rem;
          font-weight: 600;
          color: #3b82f6;
        }

        .actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          padding: 2rem 0;
        }

        .btn {
          padding: 0.875rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
          transform: translateY(-1px);
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
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .settings-section {
            padding: 1.5rem;
          }

          .actions {
            flex-direction: column;
            align-items: center;
          }

          .btn {
            width: 100%;
            max-width: 300px;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}