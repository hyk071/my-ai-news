/**
 * 모니터링 메트릭 API 엔드포인트
 * 지능형 제목 생성 시스템의 성능 데이터를 제공합니다.
 */

import { getMonitoringDashboard } from '../../../../lib/monitoring-dashboard.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dashboard = getMonitoringDashboard();
    const metrics = dashboard.generateDashboardData();
    
    res.status(200).json(metrics);
  } catch (error) {
    console.error('모니터링 메트릭 조회 오류:', error);
    res.status(500).json({ 
      error: '모니터링 데이터를 가져올 수 없습니다.',
      details: error.message 
    });
  }
}