/**
 * 검색 API 디버깅 페이지
 * 브라우저에서 직접 API를 테스트할 수 있는 간단한 페이지
 */

import { useState } from 'react';

export default function DebugSearch() {
  const [query, setQuery] = useState('AI');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('API 호출 시작:', `/api/search?q=${encodeURIComponent(query)}`);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      console.log('응답 상태:', response.status);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('응답 텍스트:', text.substring(0, 500));
        throw new Error(`잘못된 Content-Type: ${contentType}. 응답: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      console.log('응답 데이터:', data);
      
      if (!response.ok) {
        throw new Error(data.error?.message || '검색 중 오류가 발생했습니다.');
      }
      
      setResult(data);
    } catch (err) {
      console.error('API 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testMetadataAPI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('메타데이터 API 호출 시작');
      
      const response = await fetch('/api/search/metadata');
      
      console.log('메타데이터 응답 상태:', response.status);
      console.log('메타데이터 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      console.log('메타데이터 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('메타데이터 응답 텍스트:', text.substring(0, 500));
        throw new Error(`잘못된 Content-Type: ${contentType}. 응답: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      console.log('메타데이터 응답 데이터:', data);
      
      setResult(data);
    } catch (err) {
      console.error('메타데이터 API 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>검색 API 디버깅</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          검색어: 
          <input 
            type="text" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <button 
          onClick={testAPI} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          {loading ? '로딩...' : '검색 API 테스트'}
        </button>
        <button 
          onClick={testMetadataAPI} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '5px 10px' }}
        >
          {loading ? '로딩...' : '메타데이터 API 테스트'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          <h3>오류:</h3>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div style={{ 
          background: '#efe', 
          border: '1px solid #cfc', 
          padding: '10px',
          borderRadius: '4px'
        }}>
          <h3>결과:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>브라우저 콘솔을 확인하세요</h2>
        <p>F12를 눌러 개발자 도구를 열고 Console 탭에서 자세한 로그를 확인할 수 있습니다.</p>
      </div>
    </div>
  );
}