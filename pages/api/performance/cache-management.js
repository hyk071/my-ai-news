/**
 * 캐시 관리 API
 * 캐시 클리어, 가비지 컬렉션 등 캐시 관리 기능 제공
 */

import { getCacheManager } from '../../../lib/cache-manager.js';
import { getAICacheWrapper } from '../../../lib/ai-cache-wrapper.js';
import { getMemoryOptimizer } from '../../../lib/memory-optimizer.js';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, type } = req.body;

    if (!action) {
        return res.status(400).json({ error: 'action 파라미터가 필요합니다' });
    }

    try {
        const cacheManager = getCacheManager();
        const aiCacheWrapper = getAICacheWrapper();
        const memoryOptimizer = getMemoryOptimizer();

        let result = {};

        switch (action) {
            case 'clear_cache':
                const cacheType = type || 'all';
                cacheManager.clearCache(cacheType);
                result = {
                    action: 'clear_cache',
                    type: cacheType,
                    message: `${cacheType} 캐시가 클리어되었습니다`
                };
                break;

            case 'clear_ai_cache':
                aiCacheWrapper.clearCache();
                result = {
                    action: 'clear_ai_cache',
                    message: 'AI 응답 캐시가 클리어되었습니다'
                };
                break;

            case 'force_gc':
                memoryOptimizer.forceGarbageCollection();
                result = {
                    action: 'force_gc',
                    message: '가비지 컬렉션이 실행되었습니다'
                };
                break;

            case 'cleanup':
                cacheManager.cleanup();
                result = {
                    action: 'cleanup',
                    message: '만료된 캐시 엔트리가 정리되었습니다'
                };
                break;

            case 'optimize_memory':
                memoryOptimizer.forceGarbageCollection();
                cacheManager.cleanup();
                result = {
                    action: 'optimize_memory',
                    message: '메모리 최적화가 실행되었습니다'
                };
                break;

            default:
                return res.status(400).json({ 
                    error: '지원하지 않는 액션입니다',
                    supportedActions: ['clear_cache', 'clear_ai_cache', 'force_gc', 'cleanup', 'optimize_memory']
                });
        }

        // 실행 후 통계 정보 포함
        const stats = {
            cache: cacheManager.getStats(),
            memory: memoryOptimizer.getMemoryStats()
        };

        res.status(200).json({
            success: true,
            result: result,
            timestamp: new Date().toISOString(),
            stats: stats
        });

    } catch (error) {
        console.error('캐시 관리 오류:', error);
        res.status(500).json({ 
            error: '캐시 관리 실패',
            message: error.message 
        });
    }
}