#!/usr/bin/env node

/**
 * 모니터링 대시보드 시작 스크립트
 * 대시보드 서버를 시작하고 기본 설정을 구성합니다.
 */

import { startDashboardServer } from '../lib/dashboard-server.js';
import { getMonitoringDashboard } from '../lib/monitoring-dashboard.js';
import { getAnalyticsEngine } from '../lib/analytics-engine.js';

// 명령행 인수 파싱
const args = process.argv.slice(2);
const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1] || 3000;
const demo = args.includes('--demo');
const help = args.includes('--help') || args.includes('-h');

if (help) {
    console.log(`
지능형 제목 생성 시스템 모니터링 대시보드

사용법:
  node scripts/start-dashboard.js [옵션]

옵션:
  --port=PORT     서버 포트 (기본값: 3000)
  --demo          데모 데이터로 시작
  --help, -h      이 도움말 표시

예시:
  node scripts/start-dashboard.js --port=8080
  node scripts/start-dashboard.js --demo
`);
    process.exit(0);
}

async function startDashboard() {
    console.log('🚀 지능형 제목 생성 시스템 모니터링 대시보드 시작...\n');

    try {
        // 대시보드와 분석 엔진 초기화
        const dashboard = getMonitoringDashboard();
        const analytics = getAnalyticsEngine();

        // 데모 데이터 생성 (요청된 경우)
        if (demo) {
            console.log('📊 데모 데이터 생성 중...');
            await generateDemoData(dashboard, analytics);
            console.log('✅ 데모 데이터 생성 완료\n');
        }

        // 서버 시작
        const server = startDashboardServer(parseInt(port));

        console.log(`🌐 대시보드가 다음 주소에서 실행 중입니다:`);
        console.log(`   메인 대시보드: http://localhost:${port}`);
        console.log(`   메트릭 API: http://localhost:${port}/api/metrics`);
        console.log(`   분석 API: http://localhost:${port}/api/analytics`);
        console.log(`   헬스 체크: http://localhost:${port}/api/health`);
        console.log(`   데이터 내보내기: http://localhost:${port}/api/export`);
        console.log('\n💡 Ctrl+C를 눌러 서버를 중지할 수 있습니다.\n');

        // 주기적 상태 출력
        const statusInterval = setInterval(() => {
            const data = dashboard.generateDashboardData();
            console.log(`📈 현재 상태: 총 ${data.overview.totalRequests}개 요청, 성공률 ${(data.overview.successRate * 100).toFixed(1)}%, 평균 품질 ${data.overview.averageQualityScore}`);
        }, 30000); // 30초마다

        // 종료 처리
        process.on('SIGINT', () => {
            console.log('\n🛑 서버를 종료합니다...');
            clearInterval(statusInterval);
            server.close(() => {
                console.log('✅ 서버가 정상적으로 종료되었습니다.');
                process.exit(0);
            });
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 서버를 종료합니다...');
            clearInterval(statusInterval);
            server.close(() => {
                console.log('✅ 서버가 정상적으로 종료되었습니다.');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ 대시보드 시작 중 오류 발생:', error);
        process.exit(1);
    }
}

/**
 * 데모 데이터 생성
 */
async function generateDemoData(dashboard, analytics) {
    // 제목 생성 요청 시뮬레이션
    const sources = ['ai_generation', 'content_analysis', 'heuristic', 'tag_based'];
    const stages = ['contentAnalysis', 'titleGeneration', 'qualityEvaluation'];
    
    console.log('  📝 제목 생성 요청 데이터 생성...');
    for (let i = 0; i < 100; i++) {
        const success = Math.random() > 0.15; // 85% 성공률
        const responseTime = 80 + Math.random() * 300;
        const qualityScore = success ? 0.5 + Math.random() * 0.5 : 0;
        const source = sources[Math.floor(Math.random() * sources.length)];
        
        dashboard.recordTitleGenerationRequest(success, responseTime, qualityScore, source);
        
        // 성능 메트릭
        const stage = stages[Math.floor(Math.random() * stages.length)];
        const processingTime = 50 + Math.random() * 200;
        const memoryUsage = (30 + Math.random() * 40) * 1024 * 1024;
        
        dashboard.recordPerformanceMetrics(stage, processingTime, memoryUsage);
    }

    console.log('  👥 사용자 피드백 데이터 생성...');
    const feedbacks = [
        '제목이 매우 흥미롭습니다',
        '더 구체적이었으면 좋겠어요',
        '완벽한 제목입니다!',
        '조금 길어서 아쉬워요',
        '클릭하고 싶게 만드네요',
        '내용과 잘 맞는 것 같아요',
        '좀 더 창의적이었으면...',
        '정확하고 명확합니다'
    ];

    for (let i = 0; i < 50; i++) {
        const clickThrough = Math.random() > 0.4; // 60% 클릭률
        const rating = 2 + Math.random() * 3; // 2-5점
        const feedback = Math.random() > 0.3 ? feedbacks[Math.floor(Math.random() * feedbacks.length)] : null;
        
        dashboard.recordUserFeedback(clickThrough, rating, feedback);
    }

    console.log('  📊 제목 성능 분석 데이터 생성...');
    const demoTitles = [
        'AI가 바꾸는 미래의 모습',
        '2024년 주목해야 할 기술 트렌드',
        '데이터 사이언스의 새로운 패러다임',
        '클라우드 컴퓨팅의 진화와 전망',
        '블록체인 기술의 실제 활용 사례',
        '머신러닝으로 해결하는 비즈니스 문제',
        '사이버 보안의 최신 동향',
        '디지털 트랜스포메이션 성공 전략',
        '빅데이터 분석의 핵심 기법',
        'IoT가 만드는 스마트 시티'
    ];

    demoTitles.forEach((title, index) => {
        const impressions = 500 + Math.random() * 2000;
        const clicks = impressions * (0.02 + Math.random() * 0.08); // 2-10% CTR
        const qualityScore = 0.6 + Math.random() * 0.4;
        const source = sources[index % sources.length];
        
        analytics.recordTitlePerformance(title, {
            impressions: Math.floor(impressions),
            clicks: Math.floor(clicks),
            qualityScore,
            source,
            userRating: 2 + Math.random() * 3
        });
    });

    console.log('  🎯 사용자 행동 패턴 데이터 생성...');
    const actions = ['click', 'share', 'bookmark', 'comment', 'like'];
    const users = Array.from({length: 20}, (_, i) => `user${i + 1}`);
    
    for (let i = 0; i < 200; i++) {
        const userId = users[Math.floor(Math.random() * users.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const context = {
            page: `article${Math.floor(Math.random() * 50) + 1}`,
            source: 'organic',
            device: Math.random() > 0.3 ? 'desktop' : 'mobile'
        };
        
        analytics.recordUserBehavior(userId, action, context);
    }

    console.log('  🧪 A/B 테스트 데이터 생성...');
    // 제목 길이 테스트
    for (let i = 0; i < 100; i++) {
        analytics.recordABTestResult('title_length_test', 'short', {
            success: Math.random() > 0.25, // 75% 성공률
            score: 0.6 + Math.random() * 0.3
        });
        
        analytics.recordABTestResult('title_length_test', 'long', {
            success: Math.random() > 0.2, // 80% 성공률
            score: 0.65 + Math.random() * 0.3
        });
    }

    // 제목 스타일 테스트
    for (let i = 0; i < 80; i++) {
        analytics.recordABTestResult('title_style_test', 'question', {
            success: Math.random() > 0.3, // 70% 성공률
            score: 0.55 + Math.random() * 0.35
        });
        
        analytics.recordABTestResult('title_style_test', 'statement', {
            success: Math.random() > 0.35, // 65% 성공률
            score: 0.5 + Math.random() * 0.4
        });
    }

    console.log('  📈 시간별 트렌드 데이터 생성...');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const timestamp = now - (day * dayInMs) + (hour * 60 * 60 * 1000);
            
            // 시간대별 활동 패턴 (오전 9시-오후 6시가 피크)
            const activityMultiplier = hour >= 9 && hour <= 18 ? 1.5 : 0.8;
            const requestCount = Math.floor((5 + Math.random() * 15) * activityMultiplier);
            
            analytics.recordTemporalTrend({
                requests: requestCount,
                averageQuality: 0.6 + Math.random() * 0.3,
                averageResponseTime: 100 + Math.random() * 150,
                timestamp
            });
        }
    }
}

// 스크립트 실행
startDashboard();