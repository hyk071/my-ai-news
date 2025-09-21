# 모니터링 시스템 설정 가이드

지능형 제목 생성 시스템의 모니터링 및 분석 시스템을 설정하고 사용하는 방법을 안내합니다.

## 시스템 구성 요소

### 1. 모니터링 대시보드 (MonitoringDashboard)
- 실시간 시스템 메트릭 수집 및 표시
- 제목 생성 성공률, 품질 점수, 성능 지표 추적
- 알림 및 권장사항 생성

### 2. 분석 엔진 (AnalyticsEngine)
- 사용자 행동 패턴 분석
- 제목 성능 분석 및 트렌드 식별
- A/B 테스트 결과 분석
- 인사이트 및 개선 권장사항 제공

### 3. 대시보드 서버 (DashboardServer)
- HTTP API를 통한 데이터 접근
- 실시간 웹 대시보드 제공
- 데이터 수집 및 내보내기 기능

## 빠른 시작

### 1. 대시보드 서버 시작

```bash
# 기본 포트(3000)로 시작
node scripts/start-dashboard.js

# 커스텀 포트로 시작
node scripts/start-dashboard.js --port=8080

# 데모 데이터와 함께 시작
node scripts/start-dashboard.js --demo
```

### 2. 웹 브라우저에서 대시보드 접속

```
http://localhost:3000
```

### 3. API 엔드포인트 확인

- **메트릭 API**: `GET /api/metrics`
- **분석 API**: `GET /api/analytics`
- **헬스 체크**: `GET /api/health`
- **데이터 내보내기**: `GET /api/export`
- **데이터 기록**: `POST /api/record`

## 상세 설정

### 모니터링 대시보드 설정

```javascript
import { getMonitoringDashboard } from './lib/monitoring-dashboard.js';

const dashboard = getMonitoringDashboard();

// 제목 생성 요청 기록
dashboard.recordTitleGenerationRequest(
    true,           // 성공 여부
    150,            // 응답 시간 (ms)
    0.85,           // 품질 점수 (0-1)
    'ai_generation' // 생성 방식
);

// 성능 메트릭 기록
dashboard.recordPerformanceMetrics(
    'titleGeneration', // 단계
    200,               // 처리 시간 (ms)
    50 * 1024 * 1024   // 메모리 사용량 (bytes)
);

// 사용자 피드백 기록
dashboard.recordUserFeedback(
    true,                    // 클릭 여부
    4.5,                     // 평점 (1-5)
    '제목이 매우 좋습니다'    // 피드백 텍스트
);
```

### 분석 엔진 설정

```javascript
import { getAnalyticsEngine } from './lib/analytics-engine.js';

const analytics = getAnalyticsEngine();

// 제목 성능 데이터 기록
analytics.recordTitlePerformance('AI가 바꾸는 미래', {
    impressions: 1000,
    clicks: 50,
    qualityScore: 0.8,
    source: 'ai_generation',
    userRating: 4.2
});

// 사용자 행동 기록
analytics.recordUserBehavior('user123', 'click', {
    page: 'article1',
    source: 'organic',
    device: 'desktop'
});

// A/B 테스트 결과 기록
analytics.recordABTestResult('title_length_test', 'short', {
    success: true,
    score: 0.75
});
```

### 클라이언트 라이브러리 사용

```javascript
import { DashboardClient } from './lib/dashboard-server.js';

const client = new DashboardClient('http://localhost:3000');

// 제목 생성 결과 기록
await client.recordTitleGeneration(true, 150, 0.85, 'ai_generation');

// 성능 메트릭 기록
await client.recordPerformance('titleGeneration', 200, 50 * 1024 * 1024);

// 사용자 피드백 기록
await client.recordUserFeedback(true, 4.5, '제목이 매우 좋습니다');
```

## 기존 시스템 통합

### enhance.js와 통합

```javascript
// enhance.js 수정 예시
import { getMonitoringDashboard } from './lib/monitoring-dashboard.js';
import { DashboardClient } from './lib/dashboard-server.js';

const dashboard = getMonitoringDashboard();
const client = new DashboardClient();

export async function enhanceTitle(content, tags, subject, tone) {
    const startTime = Date.now();
    
    try {
        // 기존 제목 생성 로직
        const result = await generateTitleWithNewSystem(content, tags, subject, tone);
        
        const responseTime = Date.now() - startTime;
        const qualityScore = result.bestTitle ? calculateQualityScore(result.bestTitle) : 0;
        
        // 모니터링 데이터 기록
        dashboard.recordTitleGenerationRequest(true, responseTime, qualityScore, 'integrated');
        
        // 원격 대시보드에도 전송 (선택사항)
        await client.recordTitleGeneration(true, responseTime, qualityScore, 'integrated');
        
        return result;
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        
        // 실패 기록
        dashboard.recordTitleGenerationRequest(false, responseTime, 0, 'integrated');
        await client.recordTitleGeneration(false, responseTime, 0, 'integrated');
        
        throw error;
    }
}
```

### 자동 메트릭 수집

```javascript
// 미들웨어 형태로 자동 수집
class TitleGenerationMonitor {
    constructor() {
        this.dashboard = getMonitoringDashboard();
        this.client = new DashboardClient();
    }
    
    async monitor(operation, ...args) {
        const startTime = Date.now();
        const memoryBefore = process.memoryUsage().heapUsed;
        
        try {
            const result = await operation(...args);
            
            const responseTime = Date.now() - startTime;
            const memoryAfter = process.memoryUsage().heapUsed;
            const memoryUsed = memoryAfter - memoryBefore;
            
            // 성공 기록
            this.dashboard.recordTitleGenerationRequest(
                true, 
                responseTime, 
                result.qualityScore || 0, 
                result.source || 'unknown'
            );
            
            this.dashboard.recordPerformanceMetrics(
                'titleGeneration',
                responseTime,
                memoryUsed
            );
            
            return result;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // 실패 기록
            this.dashboard.recordTitleGenerationRequest(false, responseTime, 0, 'error');
            
            throw error;
        }
    }
}

// 사용 예시
const monitor = new TitleGenerationMonitor();

export async function enhanceTitle(content, tags, subject, tone) {
    return monitor.monitor(generateTitleWithNewSystem, content, tags, subject, tone);
}
```

## 대시보드 커스터마이징

### 커스텀 메트릭 추가

```javascript
// 커스텀 대시보드 클래스
class CustomMonitoringDashboard extends MonitoringDashboard {
    constructor() {
        super();
        this.customMetrics = {
            contentTypes: new Map(),
            userSegments: new Map()
        };
    }
    
    recordContentTypeMetric(contentType, success, qualityScore) {
        if (!this.customMetrics.contentTypes.has(contentType)) {
            this.customMetrics.contentTypes.set(contentType, {
                requests: 0,
                successes: 0,
                totalQuality: 0
            });
        }
        
        const metric = this.customMetrics.contentTypes.get(contentType);
        metric.requests++;
        if (success) {
            metric.successes++;
            metric.totalQuality += qualityScore;
        }
    }
    
    generateDashboardData() {
        const baseData = super.generateDashboardData();
        
        // 커스텀 메트릭 추가
        baseData.customAnalysis = {
            contentTypePerformance: this.getContentTypePerformance(),
            userSegmentAnalysis: this.getUserSegmentAnalysis()
        };
        
        return baseData;
    }
    
    getContentTypePerformance() {
        const performance = {};
        for (const [type, data] of this.customMetrics.contentTypes) {
            performance[type] = {
                successRate: data.successes / data.requests,
                averageQuality: data.totalQuality / data.successes,
                totalRequests: data.requests
            };
        }
        return performance;
    }
}
```

### 커스텀 알림 규칙

```javascript
class CustomDashboard extends MonitoringDashboard {
    generateAlerts() {
        const alerts = super.generateAlerts();
        
        // 커스텀 알림 규칙
        const data = this.generateDashboardData();
        
        // 특정 시간대 성능 저하 감지
        const currentHour = new Date().getHours();
        if (currentHour >= 9 && currentHour <= 17) { // 업무 시간
            if (data.titleGeneration.averageResponseTime > 500) {
                alerts.push({
                    type: 'warning',
                    title: '업무 시간 성능 저하',
                    message: '업무 시간 중 응답 시간이 500ms를 초과했습니다.'
                });
            }
        }
        
        // 특정 소스의 품질 저하 감지
        const sourcePerf = this.getSourcePerformance();
        for (const [source, perf] of Object.entries(sourcePerf)) {
            if (perf.averageScore < 0.5) {
                alerts.push({
                    type: 'error',
                    title: `${source} 품질 저하`,
                    message: `${source} 방식의 평균 품질이 0.5 미만입니다.`
                });
            }
        }
        
        return alerts;
    }
}
```

## 데이터 분석 및 활용

### 성능 트렌드 분석

```javascript
// 주간 성능 리포트 생성
function generateWeeklyReport() {
    const analytics = getAnalyticsEngine();
    const analysis = analytics.runComprehensiveAnalysis();
    
    const report = {
        period: 'weekly',
        generatedAt: new Date().toISOString(),
        summary: {
            totalTitles: analysis.titlePerformanceAnalysis.totalTitles,
            averageCTR: analysis.titlePerformanceAnalysis.averageCTR,
            topPerformer: analysis.titlePerformanceAnalysis.topPerformers[0],
            keyInsights: analysis.insights.slice(0, 3)
        },
        recommendations: analysis.recommendations,
        trends: analysis.temporalAnalysis
    };
    
    return report;
}
```

### A/B 테스트 자동화

```javascript
class ABTestManager {
    constructor() {
        this.analytics = getAnalyticsEngine();
        this.activeTests = new Map();
    }
    
    startTest(testId, variants, trafficSplit = 0.5) {
        this.activeTests.set(testId, {
            variants,
            trafficSplit,
            startTime: Date.now(),
            sampleSize: 0
        });
    }
    
    assignVariant(testId, userId) {
        const test = this.activeTests.get(testId);
        if (!test) return null;
        
        // 간단한 해시 기반 할당
        const hash = this.hashUserId(userId);
        const variant = hash < test.trafficSplit ? test.variants[0] : test.variants[1];
        
        return variant;
    }
    
    recordResult(testId, variant, outcome) {
        this.analytics.recordABTestResult(testId, variant, outcome);
        
        const test = this.activeTests.get(testId);
        if (test) {
            test.sampleSize++;
        }
    }
    
    getTestResults(testId) {
        const analysis = this.analytics.runComprehensiveAnalysis();
        return analysis.abTestAnalysis[testId];
    }
    
    hashUserId(userId) {
        // 간단한 해시 함수
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
        }
        return Math.abs(hash) / 0xffffffff;
    }
}
```

## 문제 해결

### 일반적인 문제들

1. **대시보드가 로드되지 않음**
   - 포트가 이미 사용 중인지 확인
   - 방화벽 설정 확인
   - 서버 로그 확인

2. **메트릭이 업데이트되지 않음**
   - 데이터 기록 함수가 올바르게 호출되는지 확인
   - 네트워크 연결 상태 확인
   - API 엔드포인트 응답 확인

3. **성능 저하**
   - 메모리 사용량 모니터링
   - 캐시 히트율 확인
   - 불필요한 메트릭 수집 제거

### 디버깅 도구

```javascript
// 디버그 모드 활성화
const dashboard = getMonitoringDashboard();
dashboard.debugMode = true;

// 상세 로그 출력
dashboard.recordTitleGenerationRequest(true, 150, 0.85, 'debug');
console.log('Debug info:', dashboard.getDebugInfo());
```

### 로그 분석

```bash
# 서버 로그 실시간 모니터링
tail -f dashboard.log

# 에러 로그만 필터링
grep "ERROR" dashboard.log

# 성능 메트릭 추출
grep "performance" dashboard.log | tail -100
```

## 보안 고려사항

### API 보안

```javascript
// 기본 인증 추가
class SecureDashboardServer extends DashboardServer {
    authenticate(req) {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return false;
        }
        
        const token = auth.substring(7);
        return this.validateToken(token);
    }
    
    async handleRequest(req, res) {
        if (!this.authenticate(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        
        return super.handleRequest(req, res);
    }
}
```

### 데이터 프라이버시

```javascript
// 민감한 데이터 마스킹
class PrivacyAwareDashboard extends MonitoringDashboard {
    recordUserFeedback(clickThrough, rating, feedback) {
        // 개인정보 제거
        const sanitizedFeedback = this.sanitizeFeedback(feedback);
        super.recordUserFeedback(clickThrough, rating, sanitizedFeedback);
    }
    
    sanitizeFeedback(feedback) {
        if (!feedback) return feedback;
        
        // 이메일, 전화번호 등 제거
        return feedback
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[이메일]')
            .replace(/\b\d{3}-\d{3,4}-\d{4}\b/g, '[전화번호]');
    }
}
```

---

이 가이드를 통해 모니터링 시스템을 효과적으로 설정하고 활용할 수 있습니다. 추가 질문이나 문제가 있으면 개발팀에 문의하세요.