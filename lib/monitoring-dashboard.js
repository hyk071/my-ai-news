/**
 * 지능형 제목 생성 시스템 모니터링 대시보드
 * 제목 생성 성공률, 품질 점수, 성능 메트릭을 추적하고 분석합니다.
 */

import { getCacheManager } from './cache-manager.js';
import { getMemoryOptimizer } from './memory-optimizer.js';

class MonitoringDashboard {
    constructor() {
        this.metrics = {
            titleGeneration: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                responseTimeHistory: []
            },
            qualityScores: {
                averageScore: 0,
                scoreDistribution: {
                    excellent: 0,    // 0.8-1.0
                    good: 0,         // 0.6-0.8
                    fair: 0,         // 0.4-0.6
                    poor: 0          // 0.0-0.4
                },
                scoreHistory: [],
                bySource: {
                    ai_generation: { count: 0, totalScore: 0 },
                    content_analysis: { count: 0, totalScore: 0 },
                    heuristic: { count: 0, totalScore: 0 },
                    tag_based: { count: 0, totalScore: 0 }
                }
            },
            performance: {
                cacheHitRate: 0,
                averageMemoryUsage: 0,
                memoryUsageHistory: [],
                processingTimeByStage: {
                    contentAnalysis: [],
                    titleGeneration: [],
                    qualityEvaluation: []
                }
            },
            userSatisfaction: {
                clickThroughRate: 0,
                userRatings: [],
                feedbackCount: 0,
                improvementSuggestions: []
            }
        };
        
        this.startTime = Date.now();
        this.lastResetTime = Date.now();
        this.recentEvents = [];
    }

    /**
     * 제목 생성 요청 기록
     */
    recordTitleGenerationRequest(success, responseTime, qualityScore, source, details = {}) {
        this.metrics.titleGeneration.totalRequests++;
        
        if (success) {
            this.metrics.titleGeneration.successfulRequests++;
            
            // 응답 시간 기록
            this.metrics.titleGeneration.responseTimeHistory.push({
                time: Date.now(),
                responseTime
            });
            
            // 평균 응답 시간 업데이트
            this.updateAverageResponseTime(responseTime);
            
            // 품질 점수 기록
            if (qualityScore !== undefined) {
                this.recordQualityScore(qualityScore, source);
            }
        } else {
            this.metrics.titleGeneration.failedRequests++;
        }

        // 최근 이벤트 기록 (최대 50개 유지)
        this.recentEvents.push({
            timestamp: Date.now(),
            success,
            responseTime,
            qualityScore,
            source,
            ...details
        });
        if (this.recentEvents.length > 50) {
            this.recentEvents.splice(0, this.recentEvents.length - 50);
        }
    }

    /**
     * 품질 점수 기록
     */
    recordQualityScore(score, source) {
        // 전체 평균 점수 업데이트
        const currentTotal = this.metrics.qualityScores.averageScore * 
                           this.metrics.qualityScores.scoreHistory.length;
        this.metrics.qualityScores.scoreHistory.push({
            score,
            source,
            timestamp: Date.now()
        });
        
        this.metrics.qualityScores.averageScore = 
            (currentTotal + score) / this.metrics.qualityScores.scoreHistory.length;

        // 점수 분포 업데이트
        if (score >= 0.8) {
            this.metrics.qualityScores.scoreDistribution.excellent++;
        } else if (score >= 0.6) {
            this.metrics.qualityScores.scoreDistribution.good++;
        } else if (score >= 0.4) {
            this.metrics.qualityScores.scoreDistribution.fair++;
        } else {
            this.metrics.qualityScores.scoreDistribution.poor++;
        }

        // 소스별 점수 기록
        if (source && this.metrics.qualityScores.bySource[source]) {
            this.metrics.qualityScores.bySource[source].count++;
            this.metrics.qualityScores.bySource[source].totalScore += score;
        }
    }

    /**
     * 성능 메트릭 기록
     */
    recordPerformanceMetrics(stage, processingTime, memoryUsage) {
        // 단계별 처리 시간 기록
        if (this.metrics.performance.processingTimeByStage[stage]) {
            this.metrics.performance.processingTimeByStage[stage].push({
                time: processingTime,
                timestamp: Date.now()
            });
        }

        // 메모리 사용량 기록
        if (memoryUsage) {
            this.metrics.performance.memoryUsageHistory.push({
                usage: memoryUsage,
                timestamp: Date.now()
            });
            
            // 평균 메모리 사용량 업데이트
            const totalUsage = this.metrics.performance.memoryUsageHistory
                .reduce((sum, record) => sum + record.usage, 0);
            this.metrics.performance.averageMemoryUsage = 
                totalUsage / this.metrics.performance.memoryUsageHistory.length;
        }

        // 캐시 히트율 업데이트
        const cacheManager = getCacheManager();
        const cacheStats = cacheManager.getStats();
        this.metrics.performance.cacheHitRate = cacheStats.hitRate;
    }

    /**
     * 사용자 만족도 기록
     */
    recordUserFeedback(clickThrough, rating, feedback) {
        if (clickThrough !== undefined) {
            // 클릭률 업데이트 (간단한 이동 평균)
            const currentCTR = this.metrics.userSatisfaction.clickThroughRate;
            this.metrics.userSatisfaction.clickThroughRate = 
                (currentCTR * 0.9) + (clickThrough ? 0.1 : 0);
        }

        if (rating !== undefined) {
            this.metrics.userSatisfaction.userRatings.push({
                rating,
                timestamp: Date.now()
            });
        }

        if (feedback) {
            this.metrics.userSatisfaction.feedbackCount++;
            this.metrics.userSatisfaction.improvementSuggestions.push({
                feedback,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 대시보드 데이터 생성
     */
    generateDashboardData() {
        const now = Date.now();
        const uptime = now - this.startTime;
        const timeSinceReset = now - this.lastResetTime;

        return {
            overview: {
                uptime: this.formatDuration(uptime),
                timeSinceReset: this.formatDuration(timeSinceReset),
                totalRequests: this.metrics.titleGeneration.totalRequests,
                successRate: this.getSuccessRate(),
                averageQualityScore: Math.round(this.metrics.qualityScores.averageScore * 100) / 100,
                cacheHitRate: Math.round(this.metrics.performance.cacheHitRate * 100) / 100
            },
            titleGeneration: {
                ...this.metrics.titleGeneration,
                successRate: this.getSuccessRate(),
                requestsPerHour: this.getRequestsPerHour()
            },
            qualityAnalysis: {
                ...this.metrics.qualityScores,
                sourcePerformance: this.getSourcePerformance(),
                trendAnalysis: this.getQualityTrend()
            },
            performance: {
                ...this.metrics.performance,
                averageProcessingTime: this.getAverageProcessingTime(),
                memoryTrend: this.getMemoryTrend(),
                bottlenecks: this.identifyBottlenecks()
            },
            userSatisfaction: {
                ...this.metrics.userSatisfaction,
                averageRating: this.getAverageUserRating(),
                satisfactionTrend: this.getSatisfactionTrend(),
                topFeedback: this.getTopFeedback()
            },
            alerts: this.generateAlerts(),
            recommendations: this.generateRecommendations(),
            recentEvents: this.recentEvents
        };
    }

    /**
     * HTML 대시보드 생성
     */
    generateHTMLDashboard() {
        const data = this.generateDashboardData();
        
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>지능형 제목 생성 시스템 모니터링 대시보드</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #333; }
        .metric-value { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 5px; }
        .metric-label { font-size: 14px; color: #666; }
        .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: #10b981; transition: width 0.3s ease; }
        .alert { padding: 12px; border-radius: 6px; margin: 10px 0; }
        .alert-warning { background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; }
        .alert-error { background: #fee2e2; border-left: 4px solid #ef4444; color: #991b1b; }
        .alert-success { background: #d1fae5; border-left: 4px solid #10b981; color: #065f46; }
        .chart-placeholder { height: 200px; background: #f9fafb; border: 2px dashed #d1d5db; display: flex; align-items: center; justify-content: center; color: #6b7280; border-radius: 4px; }
        .recommendations { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .recommendation-item { padding: 10px; border-left: 4px solid #3b82f6; background: #eff6ff; margin: 10px 0; border-radius: 0 4px 4px 0; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>지능형 제목 생성 시스템 모니터링 대시보드</h1>
            <p>시스템 가동 시간: ${data.overview.uptime} | 마지막 리셋: ${data.overview.timeSinceReset}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">전체 요청 현황</div>
                <div class="metric-value">${data.overview.totalRequests.toLocaleString()}</div>
                <div class="metric-label">총 요청 수</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.overview.successRate * 100}%"></div>
                </div>
                <div class="metric-label">성공률: ${(data.overview.successRate * 100).toFixed(1)}%</div>
            </div>

            <div class="metric-card">
                <div class="metric-title">제목 품질</div>
                <div class="metric-value">${data.overview.averageQualityScore}</div>
                <div class="metric-label">평균 품질 점수</div>
                <div style="margin-top: 10px;">
                    <div>우수: ${data.qualityAnalysis.scoreDistribution.excellent}개</div>
                    <div>양호: ${data.qualityAnalysis.scoreDistribution.good}개</div>
                    <div>보통: ${data.qualityAnalysis.scoreDistribution.fair}개</div>
                    <div>미흡: ${data.qualityAnalysis.scoreDistribution.poor}개</div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">시스템 성능</div>
                <div class="metric-value">${data.overview.cacheHitRate}</div>
                <div class="metric-label">캐시 히트율</div>
                <div style="margin-top: 10px;">
                    <div>평균 응답시간: ${data.titleGeneration.averageResponseTime}ms</div>
                    <div>메모리 사용량: ${(data.performance.averageMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-title">사용자 만족도</div>
                <div class="metric-value">${(data.userSatisfaction.clickThroughRate * 100).toFixed(1)}%</div>
                <div class="metric-label">클릭률</div>
                <div style="margin-top: 10px;">
                    <div>평균 평점: ${data.userSatisfaction.averageRating}/5.0</div>
                    <div>피드백 수: ${data.userSatisfaction.feedbackCount}개</div>
                </div>
            </div>
        </div>

        ${data.alerts.length > 0 ? `
        <div class="metric-card">
            <div class="metric-title">시스템 알림</div>
            ${data.alerts.map(alert => `
                <div class="alert alert-${alert.type}">
                    <strong>${alert.title}</strong><br>
                    ${alert.message}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="recommendations">
            <div class="metric-title">개선 권장사항</div>
            ${data.recommendations.map(rec => `
                <div class="recommendation-item">
                    <strong>${rec.title}</strong><br>
                    ${rec.description}
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // 자동 새로고침 (30초마다)
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>`;
    }

    // 유틸리티 메서드들
    updateAverageResponseTime(newTime) {
        const history = this.metrics.titleGeneration.responseTimeHistory;
        const totalTime = history.reduce((sum, record) => sum + record.responseTime, 0);
        this.metrics.titleGeneration.averageResponseTime = Math.round(totalTime / history.length);
    }

    getSuccessRate() {
        const total = this.metrics.titleGeneration.totalRequests;
        if (total === 0) return 0;
        return this.metrics.titleGeneration.successfulRequests / total;
    }

    getRequestsPerHour() {
        const hourInMs = 60 * 60 * 1000;
        const timeSinceReset = Date.now() - this.lastResetTime;
        const hours = timeSinceReset / hourInMs;
        return Math.round(this.metrics.titleGeneration.totalRequests / Math.max(hours, 1));
    }

    getSourcePerformance() {
        const performance = {};
        for (const [source, data] of Object.entries(this.metrics.qualityScores.bySource)) {
            if (data.count > 0) {
                performance[source] = {
                    averageScore: data.totalScore / data.count,
                    count: data.count
                };
            }
        }
        return performance;
    }

    getQualityTrend() {
        const recent = this.metrics.qualityScores.scoreHistory.slice(-10);
        if (recent.length < 2) return 'insufficient_data';
        
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, r) => sum + r.score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.score, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 0.05) return 'improving';
        if (secondAvg < firstAvg - 0.05) return 'declining';
        return 'stable';
    }

    getAverageProcessingTime() {
        const allTimes = [];
        for (const times of Object.values(this.metrics.performance.processingTimeByStage)) {
            allTimes.push(...times.map(t => t.time));
        }
        if (allTimes.length === 0) return 0;
        return Math.round(allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length);
    }

    getMemoryTrend() {
        const recent = this.metrics.performance.memoryUsageHistory.slice(-10);
        if (recent.length < 2) return 'stable';
        
        const trend = recent[recent.length - 1].usage - recent[0].usage;
        if (trend > 10 * 1024 * 1024) return 'increasing'; // 10MB 증가
        if (trend < -10 * 1024 * 1024) return 'decreasing';
        return 'stable';
    }

    identifyBottlenecks() {
        const bottlenecks = [];
        const stages = this.metrics.performance.processingTimeByStage;
        
        for (const [stage, times] of Object.entries(stages)) {
            if (times.length > 0) {
                const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length;
                if (avgTime > 1000) { // 1초 이상
                    bottlenecks.push({ stage, averageTime: avgTime });
                }
            }
        }
        
        return bottlenecks.sort((a, b) => b.averageTime - a.averageTime);
    }

    getAverageUserRating() {
        const ratings = this.metrics.userSatisfaction.userRatings;
        if (ratings.length === 0) return 0;
        return (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1);
    }

    getSatisfactionTrend() {
        const recent = this.metrics.userSatisfaction.userRatings.slice(-10);
        if (recent.length < 2) return 'stable';
        
        const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
        const secondHalf = recent.slice(Math.floor(recent.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, r) => sum + r.rating, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.rating, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 0.3) return 'improving';
        if (secondAvg < firstAvg - 0.3) return 'declining';
        return 'stable';
    }

    getTopFeedback() {
        return this.metrics.userSatisfaction.improvementSuggestions
            .slice(-5)
            .map(s => s.feedback);
    }

    generateAlerts() {
        const alerts = [];
        
        // 성공률 경고
        const successRate = this.getSuccessRate();
        if (successRate < 0.9) {
            alerts.push({
                type: 'warning',
                title: '낮은 성공률',
                message: `현재 성공률이 ${(successRate * 100).toFixed(1)}%입니다. 90% 이상 유지를 권장합니다.`
            });
        }
        
        // 품질 점수 경고
        if (this.metrics.qualityScores.averageScore < 0.6) {
            alerts.push({
                type: 'warning',
                title: '낮은 품질 점수',
                message: `평균 품질 점수가 ${this.metrics.qualityScores.averageScore.toFixed(2)}입니다. 0.6 이상 유지를 권장합니다.`
            });
        }
        
        // 메모리 사용량 경고
        const memoryUsageMB = this.metrics.performance.averageMemoryUsage / 1024 / 1024;
        if (memoryUsageMB > 500) {
            alerts.push({
                type: 'error',
                title: '높은 메모리 사용량',
                message: `평균 메모리 사용량이 ${memoryUsageMB.toFixed(1)}MB입니다. 메모리 최적화가 필요합니다.`
            });
        }
        
        // 캐시 히트율 경고
        if (this.metrics.performance.cacheHitRate < 0.7) {
            alerts.push({
                type: 'warning',
                title: '낮은 캐시 효율성',
                message: `캐시 히트율이 ${(this.metrics.performance.cacheHitRate * 100).toFixed(1)}%입니다. 캐시 전략 개선이 필요합니다.`
            });
        }
        
        return alerts;
    }

    generateRecommendations() {
        const recommendations = [];
        // 순환 참조 방지를 위해 직접 메트릭 사용
        const successRate = this.getSuccessRate();
        const sourcePerf = this.getSourcePerformance();
        
        // 성능 개선 권장사항
        const bottlenecks = this.identifyBottlenecks();
        if (bottlenecks.length > 0) {
            const slowestStage = bottlenecks[0];
            recommendations.push({
                title: '성능 최적화',
                description: `${slowestStage.stage} 단계의 처리 시간이 ${slowestStage.averageTime}ms로 가장 느립니다. 이 단계의 최적화를 우선적으로 진행하세요.`
            });
        }
        
        // 품질 개선 권장사항
        const bestSource = Object.entries(sourcePerf)
            .sort(([,a], [,b]) => b.averageScore - a.averageScore)[0];
        
        if (bestSource) {
            recommendations.push({
                title: '제목 생성 전략 최적화',
                description: `${bestSource[0]} 방식이 평균 ${bestSource[1].averageScore.toFixed(2)} 점으로 가장 높은 품질을 보입니다. 이 방식의 비중을 늘려보세요.`
            });
        }
        
        // 캐시 최적화 권장사항
        if (this.metrics.performance.cacheHitRate < 0.8) {
            recommendations.push({
                title: '캐시 전략 개선',
                description: '캐시 히트율이 낮습니다. 캐시 키 전략을 재검토하고, 캐시 만료 시간을 조정해보세요.'
            });
        }
        
        // 사용자 만족도 개선 권장사항
        if (this.metrics.userSatisfaction.clickThroughRate < 0.1) {
            recommendations.push({
                title: '사용자 참여도 개선',
                description: '클릭률이 낮습니다. 더 매력적이고 호기심을 자극하는 제목 생성 전략을 고려해보세요.'
            });
        }
        
        return recommendations;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}일 ${hours % 24}시간`;
        if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
        if (minutes > 0) return `${minutes}분 ${seconds % 60}초`;
        return `${seconds}초`;
    }

    /**
     * 메트릭 리셋
     */
    resetMetrics() {
        this.metrics = {
            titleGeneration: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                averageResponseTime: 0,
                responseTimeHistory: []
            },
            qualityScores: {
                averageScore: 0,
                scoreDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
                scoreHistory: [],
                bySource: {
                    ai_generation: { count: 0, totalScore: 0 },
                    content_analysis: { count: 0, totalScore: 0 },
                    heuristic: { count: 0, totalScore: 0 },
                    tag_based: { count: 0, totalScore: 0 }
                }
            },
            performance: {
                cacheHitRate: 0,
                averageMemoryUsage: 0,
                memoryUsageHistory: [],
                processingTimeByStage: {
                    contentAnalysis: [],
                    titleGeneration: [],
                    qualityEvaluation: []
                }
            },
            userSatisfaction: {
                clickThroughRate: 0,
                userRatings: [],
                feedbackCount: 0,
                improvementSuggestions: []
            }
        };
        
        this.lastResetTime = Date.now();
    }

    /**
     * 메트릭 데이터 내보내기
     */
    exportMetrics() {
        return {
            exportTime: new Date().toISOString(),
            systemInfo: {
                startTime: this.startTime,
                lastResetTime: this.lastResetTime,
                uptime: Date.now() - this.startTime
            },
            metrics: this.metrics,
            dashboardData: this.generateDashboardData()
        };
    }
}

// 싱글톤 인스턴스
let dashboardInstance = null;

export function getMonitoringDashboard() {
    if (!dashboardInstance) {
        dashboardInstance = new MonitoringDashboard();
    }
    return dashboardInstance;
}

export { MonitoringDashboard };
