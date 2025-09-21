/**
 * 모니터링 대시보드 서버
 * HTTP 서버를 통해 실시간 대시보드와 API를 제공합니다.
 */

import http from 'http';
import url from 'url';
import { getMonitoringDashboard } from './monitoring-dashboard.js';
import { getAnalyticsEngine } from './analytics-engine.js';

class DashboardServer {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
        this.dashboard = getMonitoringDashboard();
        this.analytics = getAnalyticsEngine();
        
        // API 엔드포인트 정의
        this.routes = {
            '/': this.serveDashboard.bind(this),
            '/api/metrics': this.serveMetrics.bind(this),
            '/api/analytics': this.serveAnalytics.bind(this),
            '/api/export': this.serveExport.bind(this),
            '/api/reset': this.handleReset.bind(this),
            '/api/health': this.serveHealth.bind(this),
            '/api/record': this.handleRecord.bind(this)
        };
    }

    /**
     * 서버 시작
     */
    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`모니터링 대시보드 서버가 http://localhost:${this.port} 에서 실행 중입니다.`);
        });

        return this.server;
    }

    /**
     * 서버 중지
     */
    stop() {
        if (this.server) {
            this.server.close();
            console.log('모니터링 대시보드 서버가 중지되었습니다.');
        }
    }

    /**
     * HTTP 요청 처리
     */
    async handleRequest(req, res) {
        try {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            // CORS 헤더 설정
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            // 라우트 매칭
            const handler = this.routes[pathname];
            if (handler) {
                await handler(req, res, parsedUrl.query);
            } else {
                this.serve404(res);
            }
        } catch (error) {
            console.error('요청 처리 중 오류:', error);
            this.serveError(res, error);
        }
    }

    /**
     * 메인 대시보드 페이지 제공
     */
    async serveDashboard(req, res) {
        try {
            const htmlContent = this.dashboard.generateHTMLDashboard();
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(htmlContent);
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 메트릭 API 제공
     */
    async serveMetrics(req, res) {
        try {
            const metrics = this.dashboard.generateDashboardData();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(metrics, null, 2));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 분석 API 제공
     */
    async serveAnalytics(req, res) {
        try {
            const analysis = this.analytics.runComprehensiveAnalysis();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(analysis, null, 2));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 데이터 내보내기 API
     */
    async serveExport(req, res) {
        try {
            const exportData = {
                metrics: this.dashboard.exportMetrics(),
                analytics: this.analytics.exportAnalysis(),
                exportTime: new Date().toISOString()
            };
            
            const filename = `title-system-export-${new Date().toISOString().split('T')[0]}.json`;
            
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            res.end(JSON.stringify(exportData, null, 2));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 메트릭 리셋 처리
     */
    async handleReset(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        try {
            this.dashboard.resetMetrics();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: '메트릭이 성공적으로 리셋되었습니다.',
                resetTime: new Date().toISOString()
            }));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 헬스 체크 API
     */
    async serveHealth(req, res) {
        try {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(health, null, 2));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 데이터 기록 API
     */
    async handleRecord(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }

        try {
            const body = await this.parseRequestBody(req);
            const data = JSON.parse(body);
            
            // 데이터 타입에 따라 적절한 기록 메서드 호출
            switch (data.type) {
                case 'title_generation':
                    this.dashboard.recordTitleGenerationRequest(
                        data.success,
                        data.responseTime,
                        data.qualityScore,
                        data.source
                    );
                    break;
                    
                case 'performance':
                    this.dashboard.recordPerformanceMetrics(
                        data.stage,
                        data.processingTime,
                        data.memoryUsage
                    );
                    break;
                    
                case 'user_feedback':
                    this.dashboard.recordUserFeedback(
                        data.clickThrough,
                        data.rating,
                        data.feedback
                    );
                    break;
                    
                case 'title_performance':
                    this.analytics.recordTitlePerformance(data.title, data.metrics);
                    break;
                    
                case 'user_behavior':
                    this.analytics.recordUserBehavior(data.userId, data.action, data.context);
                    break;
                    
                default:
                    throw new Error(`Unknown data type: ${data.type}`);
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true, 
                message: '데이터가 성공적으로 기록되었습니다.' 
            }));
        } catch (error) {
            this.serveError(res, error);
        }
    }

    /**
     * 404 에러 페이지
     */
    serve404(res) {
        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>404 - 페이지를 찾을 수 없습니다</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>404 - 페이지를 찾을 수 없습니다</h1>
    <p><a href="/">대시보드로 돌아가기</a></p>
</body>
</html>`;
        
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    }

    /**
     * 에러 응답
     */
    serveError(res, error) {
        console.error('서버 에러:', error);
        
        const errorResponse = {
            error: true,
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse, null, 2));
    }

    /**
     * 요청 본문 파싱
     */
    parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                resolve(body);
            });
            
            req.on('error', error => {
                reject(error);
            });
        });
    }
}

/**
 * 대시보드 서버 시작 함수
 */
export function startDashboardServer(port = 3000) {
    const server = new DashboardServer(port);
    return server.start();
}

/**
 * 클라이언트 라이브러리 - 대시보드에 데이터 전송
 */
export class DashboardClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    /**
     * 제목 생성 요청 기록
     */
    async recordTitleGeneration(success, responseTime, qualityScore, source) {
        return this.sendData({
            type: 'title_generation',
            success,
            responseTime,
            qualityScore,
            source
        });
    }

    /**
     * 성능 메트릭 기록
     */
    async recordPerformance(stage, processingTime, memoryUsage) {
        return this.sendData({
            type: 'performance',
            stage,
            processingTime,
            memoryUsage
        });
    }

    /**
     * 사용자 피드백 기록
     */
    async recordUserFeedback(clickThrough, rating, feedback) {
        return this.sendData({
            type: 'user_feedback',
            clickThrough,
            rating,
            feedback
        });
    }

    /**
     * 제목 성능 기록
     */
    async recordTitlePerformance(title, metrics) {
        return this.sendData({
            type: 'title_performance',
            title,
            metrics
        });
    }

    /**
     * 사용자 행동 기록
     */
    async recordUserBehavior(userId, action, context) {
        return this.sendData({
            type: 'user_behavior',
            userId,
            action,
            context
        });
    }

    /**
     * 데이터 전송
     */
    async sendData(data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('대시보드 데이터 전송 실패:', error);
            // 실패해도 메인 기능에 영향을 주지 않도록 조용히 처리
            return { success: false, error: error.message };
        }
    }
}

export { DashboardServer };