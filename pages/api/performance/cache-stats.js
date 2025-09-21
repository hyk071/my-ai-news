/**
 * 캐시 및 성능 통계 API
 * 제목 생성 시스템의 캐싱 성능과 메모리 사용량 통계를 제공
 */

import { getCacheManager } from '../../../lib/cache-manager.js';
import { getAICacheWrapper } from '../../../lib/ai-cache-wrapper.js';
import { getMemoryOptimizer } from '../../../lib/memory-optimizer.js';

export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cacheManager = getCacheManager();
        const aiCacheWrapper = getAICacheWrapper();
        const memoryOptimizer = getMemoryOptimizer();

        // 캐시 통계 수집
        const cacheStats = cacheManager.getStats();
        const aiCacheStats = aiCacheWrapper.getStats();
        const memoryStats = memoryOptimizer.getMemoryStats();
        const recommendations = memoryOptimizer.getOptimizationRecommendations();

        // 성능 지표 계산
        const performanceMetrics = {
            cacheEfficiency: {
                hitRate: cacheStats.hitRate,
                totalRequests: cacheStats.hits + cacheStats.misses,
                cacheSize: cacheStats.totalSize,
                evictionRate: cacheStats.evictions > 0 ? 
                    (cacheStats.evictions / cacheStats.totalEntries * 100).toFixed(2) + '%' : '0%'
            },
            aiOptimization: {
                requestQueue: aiCacheStats.requestQueue,
                rateLimits: aiCacheStats.rateLimits,
                cacheBreakdown: aiCacheStats.cache.cacheBreakdown
            },
            memoryUsage: {
                current: memoryStats.current,
                peak: memoryStats.peak,
                gcCount: memoryStats.gcCount,
                optimizations: memoryStats.optimizations
            },
            recommendations: recommendations
        };

        // 시스템 상태 평가
        const systemHealth = evaluateSystemHealth(cacheStats, memoryStats);

        const response = {
            timestamp: new Date().toISOString(),
            systemHealth: systemHealth,
            cache: {
                general: cacheStats,
                ai: aiCacheStats.cache,
                breakdown: cacheStats.cacheBreakdown
            },
            memory: memoryStats,
            performance: performanceMetrics,
            recommendations: recommendations
        };

        res.status(200).json(response);

    } catch (error) {
        console.error('캐시 통계 조회 오류:', error);
        res.status(500).json({ 
            error: '캐시 통계 조회 실패',
            message: error.message 
        });
    }
}

/**
 * 시스템 상태 평가
 * @param {Object} cacheStats 캐시 통계
 * @param {Object} memoryStats 메모리 통계
 * @returns {Object} 시스템 상태 정보
 */
function evaluateSystemHealth(cacheStats, memoryStats) {
    const hitRate = parseFloat(cacheStats.hitRate.replace('%', ''));
    const memoryPercentage = memoryStats.current.percentage;
    
    let status = 'healthy';
    let issues = [];
    let score = 100;

    // 캐시 히트율 평가
    if (hitRate < 30) {
        status = 'warning';
        issues.push('낮은 캐시 히트율');
        score -= 20;
    } else if (hitRate < 50) {
        issues.push('개선 가능한 캐시 히트율');
        score -= 10;
    }

    // 메모리 사용량 평가
    if (memoryPercentage > 90) {
        status = 'critical';
        issues.push('높은 메모리 사용량');
        score -= 30;
    } else if (memoryPercentage > 70) {
        if (status === 'healthy') status = 'warning';
        issues.push('메모리 사용량 주의');
        score -= 15;
    }

    // 캐시 제거율 평가
    if (cacheStats.evictions > cacheStats.totalEntries * 0.5) {
        if (status === 'healthy') status = 'warning';
        issues.push('높은 캐시 제거율');
        score -= 10;
    }

    return {
        status: status,
        score: Math.max(0, score),
        issues: issues,
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
    };
}