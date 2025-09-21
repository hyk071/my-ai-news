/**
 * AI Cache Wrapper - AI API 호출 최적화 및 캐싱 래퍼
 * 불필요한 AI API 호출을 최소화하고 응답을 캐싱하여 성능 향상
 */

import { getCacheManager } from './cache-manager.js';

class AICacheWrapper {
    constructor() {
        this.cacheManager = getCacheManager();
        this.requestQueue = new Map(); // 동시 요청 중복 방지
        this.rateLimiter = new Map(); // 간단한 레이트 리미터
    }

    /**
     * 캐싱된 AI 제목 생성 (OpenAI)
     * @param {Function} originalFunction 원본 AI 함수
     * @param {Object} params 요청 파라미터
     * @returns {Promise<Object|null>} AI 응답 또는 null
     */
    async cachedOpenAICall(originalFunction, params) {
        return this.cachedAICall('openai', originalFunction, params);
    }

    /**
     * 캐싱된 AI 제목 생성 (Claude)
     * @param {Function} originalFunction 원본 AI 함수
     * @param {Object} params 요청 파라미터
     * @returns {Promise<Object|null>} AI 응답 또는 null
     */
    async cachedClaudeCall(originalFunction, params) {
        return this.cachedAICall('claude', originalFunction, params);
    }

    /**
     * 캐싱된 AI 제목 생성 (Gemini)
     * @param {Function} originalFunction 원본 AI 함수
     * @param {Object} params 요청 파라미터
     * @returns {Promise<Object|null>} AI 응답 또는 null
     */
    async cachedGeminiCall(originalFunction, params) {
        return this.cachedAICall('gemini', originalFunction, params);
    }

    /**
     * 공통 캐싱된 AI 호출 로직
     * @param {string} provider AI 제공사
     * @param {Function} originalFunction 원본 AI 함수
     * @param {Object} params 요청 파라미터
     * @returns {Promise<Object|null>} AI 응답 또는 null
     */
    async cachedAICall(provider, originalFunction, params) {
        // 프롬프트 생성 (캐시 키용)
        const prompt = this.generatePromptKey(params);
        
        // 레이트 리미팅 체크
        if (this.isRateLimited(provider)) {
            console.log(`${provider} API 레이트 리미트 적용, 캐시 우선 사용`);
            const cached = this.cacheManager.getCachedAIResponse(provider, prompt);
            if (cached) return cached;
            
            // 캐시도 없으면 잠시 대기
            await this.delay(1000);
        }

        // 캐시에서 응답 조회
        const cachedResponse = this.cacheManager.getCachedAIResponse(provider, prompt);
        if (cachedResponse) {
            console.log(`${provider} AI 응답 캐시 히트`);
            return cachedResponse;
        }

        // 동시 요청 중복 방지
        const requestKey = `${provider}:${this.cacheManager.simpleHash(prompt)}`;
        if (this.requestQueue.has(requestKey)) {
            console.log(`${provider} 동시 요청 대기 중...`);
            return this.requestQueue.get(requestKey);
        }

        // 새로운 AI API 호출
        const requestPromise = this.makeAIRequest(provider, originalFunction, params, prompt);
        this.requestQueue.set(requestKey, requestPromise);

        try {
            const response = await requestPromise;
            
            // 성공적인 응답을 캐시에 저장
            if (response) {
                this.cacheManager.cacheAIResponse(provider, prompt, response);
                console.log(`${provider} AI 응답 캐시 저장 완료`);
            }
            
            return response;
        } catch (error) {
            console.error(`${provider} AI 호출 실패:`, error.message);
            
            // 오류 발생 시 캐시된 응답이라도 반환 시도
            const fallbackCached = this.cacheManager.getCachedAIResponse(provider, prompt);
            if (fallbackCached) {
                console.log(`${provider} 오류 발생, 캐시된 응답 사용`);
                return fallbackCached;
            }
            
            return null;
        } finally {
            // 요청 큐에서 제거
            this.requestQueue.delete(requestKey);
            
            // 레이트 리미터 업데이트
            this.updateRateLimit(provider);
        }
    }

    /**
     * 실제 AI API 요청 수행
     * @param {string} provider AI 제공사
     * @param {Function} originalFunction 원본 AI 함수
     * @param {Object} params 요청 파라미터
     * @param {string} prompt 프롬프트 키
     * @returns {Promise<Object|null>} AI 응답
     */
    async makeAIRequest(provider, originalFunction, params, prompt) {
        const startTime = Date.now();
        
        try {
            console.log(`${provider} AI API 호출 시작`);
            const response = await originalFunction(params);
            
            const duration = Date.now() - startTime;
            console.log(`${provider} AI API 호출 완료: ${duration}ms`);
            
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`${provider} AI API 호출 실패: ${duration}ms, ${error.message}`);
            throw error;
        }
    }

    /**
     * 프롬프트 키 생성 (캐싱용)
     * @param {Object} params 요청 파라미터
     * @returns {string} 프롬프트 키
     */
    generatePromptKey(params) {
        // 캐싱에 영향을 주는 주요 파라미터들만 포함
        const keyData = {
            content: params.content ? this.cacheManager.simpleHash(params.content) : '',
            tags: Array.isArray(params.tags) ? params.tags.sort().join(',') : '',
            subject: params.subject || '',
            tone: params.tone || '',
            lengthRange: params.lengthRange || {},
            filters: this.normalizeFilters(params.filters || {}),
            guidelines: this.normalizeGuidelines(params.guidelines || {})
        };
        
        return JSON.stringify(keyData);
    }

    /**
     * 필터 정규화 (캐싱 일관성을 위해)
     * @param {Object} filters 필터 객체
     * @returns {Object} 정규화된 필터
     */
    normalizeFilters(filters) {
        return {
            titleLen: filters.titleLen || {},
            mustInclude: Array.isArray(filters.mustInclude) ? filters.mustInclude.sort() : [],
            mustExclude: Array.isArray(filters.mustExclude) ? filters.mustExclude.sort() : [],
            phraseInclude: Array.isArray(filters.phraseInclude) ? filters.phraseInclude.sort() : [],
            phraseExclude: Array.isArray(filters.phraseExclude) ? filters.phraseExclude.sort() : []
        };
    }

    /**
     * 가이드라인 정규화 (캐싱 일관성을 위해)
     * @param {Object} guidelines 가이드라인 객체
     * @returns {Object} 정규화된 가이드라인
     */
    normalizeGuidelines(guidelines) {
        return {
            dataBacked: !!guidelines.dataBacked,
            noClickbait: !!guidelines.noClickbait,
            newsroomStyle: !!guidelines.newsroomStyle,
            numFactsMin: guidelines.numFactsMin || 0
        };
    }

    /**
     * 레이트 리미팅 체크
     * @param {string} provider AI 제공사
     * @returns {boolean} 레이트 리미트 적용 여부
     */
    isRateLimited(provider) {
        const now = Date.now();
        const rateLimit = this.rateLimiter.get(provider);
        
        if (!rateLimit) return false;
        
        // 1분 내에 5회 이상 호출 시 레이트 리미트 적용
        const recentCalls = rateLimit.calls.filter(time => now - time < 60000);
        return recentCalls.length >= 5;
    }

    /**
     * 레이트 리미터 업데이트
     * @param {string} provider AI 제공사
     */
    updateRateLimit(provider) {
        const now = Date.now();
        
        if (!this.rateLimiter.has(provider)) {
            this.rateLimiter.set(provider, { calls: [] });
        }
        
        const rateLimit = this.rateLimiter.get(provider);
        rateLimit.calls.push(now);
        
        // 1분 이전 호출 기록 정리
        rateLimit.calls = rateLimit.calls.filter(time => now - time < 60000);
    }

    /**
     * 지연 함수
     * @param {number} ms 지연 시간 (밀리초)
     * @returns {Promise} 지연 Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 캐시 통계 조회
     * @returns {Object} 캐시 통계
     */
    getStats() {
        const cacheStats = this.cacheManager.getStats();
        const queueSize = this.requestQueue.size;
        
        const rateLimitStats = {};
        for (const [provider, data] of this.rateLimiter.entries()) {
            rateLimitStats[provider] = {
                recentCalls: data.calls.length,
                isLimited: this.isRateLimited(provider)
            };
        }
        
        return {
            cache: cacheStats,
            requestQueue: queueSize,
            rateLimits: rateLimitStats
        };
    }

    /**
     * 캐시 클리어
     * @param {string} type 클리어할 캐시 타입
     */
    clearCache(type = 'ai_response') {
        this.cacheManager.clearCache(type);
        this.requestQueue.clear();
        console.log('AI 캐시 클리어 완료:', type);
    }
}

// 싱글톤 인스턴스
let aiCacheWrapperInstance = null;

/**
 * AI 캐시 래퍼 싱글톤 인스턴스 조회
 * @returns {AICacheWrapper} AI 캐시 래퍼 인스턴스
 */
function getAICacheWrapper() {
    if (!aiCacheWrapperInstance) {
        aiCacheWrapperInstance = new AICacheWrapper();
    }
    return aiCacheWrapperInstance;
}

export { AICacheWrapper, getAICacheWrapper };