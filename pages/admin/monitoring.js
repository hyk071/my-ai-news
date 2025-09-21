/**
 * 관리자용 모니터링 대시보드 페이지
 * 지능형 제목 생성 시스템의 성능과 품질을 모니터링합니다.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
    // 30초마다 자동 새로고침
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } else {
        throw new Error('메트릭 데이터를 가져올 수 없습니다.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">모니터링 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchMetrics}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>모니터링 대시보드 - AI 뉴스 관리자</title>
        <meta name="description" content="지능형 제목 생성 시스템 모니터링 대시보드" />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                  📊 모니터링 대시보드
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <a 
                  href="/" 
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← 메인 사이트로
                </a>
                <button 
                  onClick={fetchMetrics}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {metrics && (
            <>
              {/* 개요 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="총 요청 수"
                  value={metrics.overview?.totalRequests?.toLocaleString() || '0'}
                  icon="📈"
                  color="blue"
                />
                <MetricCard
                  title="성공률"
                  value={`${((metrics.overview?.successRate || 0) * 100).toFixed(1)}%`}
                  icon="✅"
                  color="green"
                />
                <MetricCard
                  title="평균 품질 점수"
                  value={metrics.overview?.averageQualityScore?.toFixed(2) || '0.00'}
                  icon="⭐"
                  color="yellow"
                />
                <MetricCard
                  title="캐시 히트율"
                  value={`${((metrics.overview?.cacheHitRate || 0) * 100).toFixed(1)}%`}
                  icon="🚀"
                  color="purple"
                />
              </div>

              {/* 상세 정보 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 제목 생성 현황 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      제목 생성 현황
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">평균 응답시간</span>
                        <span className="text-sm font-medium">
                          {metrics.titleGeneration?.averageResponseTime || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">시간당 요청</span>
                        <span className="text-sm font-medium">
                          {metrics.titleGeneration?.requestsPerHour || 0}개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 품질 분석 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      품질 분석
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">우수 (0.8+)</span>
                        <span className="text-sm font-medium">
                          {metrics.qualityAnalysis?.scoreDistribution?.excellent || 0}개
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">양호 (0.6+)</span>
                        <span className="text-sm font-medium">
                          {metrics.qualityAnalysis?.scoreDistribution?.good || 0}개
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">보통 (0.4+)</span>
                        <span className="text-sm font-medium">
                          {metrics.qualityAnalysis?.scoreDistribution?.fair || 0}개
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 알림 */}
              {metrics.alerts && metrics.alerts.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    시스템 알림
                  </h3>
                  <div className="space-y-3">
                    {metrics.alerts.map((alert, index) => (
                      <div 
                        key={index}
                        className={`p-4 rounded-md ${
                          alert.type === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
                          alert.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                          'bg-green-50 border-l-4 border-green-400'
                        }`}
                      >
                        <div className="flex">
                          <div className="ml-3">
                            <h4 className={`text-sm font-medium ${
                              alert.type === 'error' ? 'text-red-800' :
                              alert.type === 'warning' ? 'text-yellow-800' :
                              'text-green-800'
                            }`}>
                              {alert.title}
                            </h4>
                            <p className={`mt-1 text-sm ${
                              alert.type === 'error' ? 'text-red-700' :
                              alert.type === 'warning' ? 'text-yellow-700' :
                              'text-green-700'
                            }`}>
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

// 메트릭 카드 컴포넌트
function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${colorClasses[color]} rounded-md flex items-center justify-center text-white text-lg`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}