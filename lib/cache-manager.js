/**
 * CacheManager - 제목 생성 시스템의 캐싱 관리 클래스
 * 콘텐츠 분석 결과, AI 응답, 제목 후보 등을 메모리에 캐싱하여 성능 최적화
 */

class CacheManager {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 100; // 최대 캐시 항목 수
        this.ttl = options.ttl || 30 * 60 * 1000; // TTL: 30분 (밀리초)
        this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 정리 주기: 5분
        
        // 캐시 저장소들
        this.contentAnalysisCache = new Map();
        this.aiResponseCache = new Map();
        this.titleCandidatesCache = new Map();
        
        // 메타데이터 저장소
        this.cacheMetadata = new Map();
        
        // 통계
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            cleanups: 0
        };
        
        // 자동 정리 타이머 시작
        this.startCleanupTimer();
        
        console.log('CacheManager 초기화:', {
            maxSize: this.maxSize,
            ttl: this.ttl,
            cleanupInterval: this.cleanupInterval
        });
    }

    /**
     * 콘텐츠 분석 결과 캐싱
     * @param {string} content 기사 내용
     * @param {Array} tags 태그 배열
     * @param {string} subject 주제
     * @param {string} tone 톤
     * @param {Object} analysisResult 분석 결과
     */
    cacheContentAnalysis(content, tags, subject, tone, analysisResult) {
        const key = this.generateContentAnalysisKey(content, tags, subject, tone);
        const cacheEntry = {
            data: analysisResult,
            timestamp: Date.now(),
            type: 'content_analysis',
            size: this.estimateObjectSize(analysisResult)
        };
        
        this.setCache(this.contentAnalysisCache, key, cacheEntry);
        console.log('콘텐츠 분석 결과 캐시 저장:', key.substring(0, 16) + '...');
    }

    /**
     * 캐시된 콘텐츠 분석 결과 조회
     * @param {string} content 기사 내용
     * @param {Array} tags 태그 배열
     * @param {string} subject 주제
     * @param {string} tone 톤
     * @returns {Object|null} 캐시된 분석 결과 또는 null
     */
    getCachedContentAnalysis(content, tags, subject, tone) {
        const key = this.generateContentAnalysisKey(content, tags, subject, tone);
        const cached = this.getCache(this.contentAnalysisCache, key);
        
        if (cached) {
            console.log('콘텐츠 분석 캐시 히트:', key.substring(0, 16) + '...');
            return cached.data;
        }
        
        console.log('콘텐츠 분석 캐시 미스:', key.substring(0, 16) + '...');
        return null;
    }

    /**
     * AI 응답 캐싱
     * @param {string} provider AI 제공사 (openai, claude, gemini)
     * @param {string} prompt 프롬프트
     * @param {Object} response AI 응답
     */
    cacheAIResponse(provider, prompt, response) {
        const key = this.generateAIResponseKey(provider, prompt);
        const cacheEntry = {
            data: response,
            timestamp: Date.now(),
            type: 'ai_response',
            provider: provider,
            size: this.estimateObjectSize(response)
        };
        
        this.setCache(this.aiResponseCache, key, cacheEntry);
        console.log('AI 응답 캐시 저장:', provider, key.substring(0, 16) + '...');
    }

    /**
     * 캐시된 AI 응답 조회
     * @param {string} provider AI 제공사
     * @param {string} prompt 프롬프트
     * @returns {Object|null} 캐시된 AI 응답 또는 null
     */
    getCachedAIResponse(provider, prompt) {
        const key = this.generateAIResponseKey(provider, prompt);
        const cached = this.getCache(this.aiResponseCache, key);
        
        if (cached) {
            console.log('AI 응답 캐시 히트:', provider, key.substring(0, 16) + '...');
            return cached.data;
        }
        
        console.log('AI 응답 캐시 미스:', provider, key.substring(0, 16) + '...');
        return null;
    }

    /**
     * 제목 후보 캐싱
     * @param {string} contentHash 콘텐츠 해시
     * @param {Object} filters 필터 설정
     * @param {Object} guidelines 가이드라인
     * @param {Array} candidates 제목 후보들
     */
    cacheTitleCandidates(contentHash, filters, guidelines, candidates) {
        const key = this.generateTitleCandidatesKey(contentHash, filters, guidelines);
        const cacheEntry = {
            data: candidates,
            timestamp: Date.now(),
            type: 'title_candidates',
            size: this.estimateObjectSize(candidates)
        };
        
        this.setCache(this.titleCandidatesCache, key, cacheEntry);
        console.log('제목 후보 캐시 저장:', key.substring(0, 16) + '...');
    }

    /**
     * 캐시된 제목 후보 조회
     * @param {string} contentHash 콘텐츠 해시
     * @param {Object} filters 필터 설정
     * @param {Object} guidelines 가이드라인
     * @returns {Array|null} 캐시된 제목 후보들 또는 null
     */
    getCachedTitleCandidates(contentHash, filters, guidelines) {
        const key = this.generateTitleCandidatesKey(contentHash, filters, guidelines);
        const cached = this.getCache(this.titleCandidatesCache, key);
        
        if (cached) {
            console.log('제목 후보 캐시 히트:', key.substring(0, 16) + '...');
            return cached.data;
        }
        
        console.log('제목 후보 캐시 미스:', key.substring(0, 16) + '...');
        return null;
    }

    /**
     * 콘텐츠 분석 키 생성
     * @param {string} content 기사 내용
     * @param {Array} tags 태그 배열
     * @param {string} subject 주제
     * @param {string} tone 톤
     * @returns {string} 캐시 키
     */
    generateContentAnalysisKey(content, tags, subject, tone) {
        const contentHash = this.simpleHash(content);
        const tagsStr = Array.isArray(tags) ? tags.sort().join(',') : '';
        const keyData = `content:${contentHash}:${tagsStr}:${subject}:${tone}`;
        return this.simpleHash(keyData);
    }

    /**
     * AI 응답 키 생성
     * @param {string} provider AI 제공사
     * @param {string} prompt 프롬프트
     * @returns {string} 캐시 키
     */
    generateAIResponseKey(provider, prompt) {
        const promptHash = this.simpleHash(prompt);
        return `ai:${provider}:${promptHash}`;
    }

    /**
     * 제목 후보 키 생성
     * @param {string} contentHash 콘텐츠 해시
     * @param {Object} filters 필터 설정
     * @param {Object} guidelines 가이드라인
     * @returns {string} 캐시 키
     */
    generateTitleCandidatesKey(contentHash, filters, guidelines) {
        const filtersStr = JSON.stringify(filters || {});
        const guidelinesStr = JSON.stringify(guidelines || {});
        const keyData = `titles:${contentHash}:${filtersStr}:${guidelinesStr}`;
        return this.simpleHash(keyData);
    }

    /**
     * 캐시에서 데이터 조회 (공통 로직)
     * @param {Map} cache 캐시 맵
     * @param {string} key 캐시 키
     * @returns {Object|null} 캐시된 데이터 또는 null
     */
    getCache(cache, key) {
        const entry = cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        
        // TTL 체크
        if (Date.now() - entry.timestamp > this.ttl) {
            cache.delete(key);
            this.cacheMetadata.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        return entry;
    }

    /**
     * 캐시에 데이터 저장 (공통 로직)
     * @param {Map} cache 캐시 맵
     * @param {string} key 캐시 키
     * @param {Object} entry 캐시 엔트리
     */
    setCache(cache, key, entry) {
        // 캐시 크기 제한 체크
        if (cache.size >= this.maxSize) {
            this.evictOldestEntry(cache);
        }
        
        cache.set(key, entry);
        this.cacheMetadata.set(key, {
            cacheType: entry.type,
            timestamp: entry.timestamp,
            size: entry.size
        });
    }

    /**
     * 가장 오래된 캐시 엔트리 제거
     * @param {Map} cache 캐시 맵
     */
    evictOldestEntry(cache) {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            cache.delete(oldestKey);
            this.cacheMetadata.delete(oldestKey);
            this.stats.evictions++;
            console.log('캐시 엔트리 제거 (용량 초과):', oldestKey.substring(0, 16) + '...');
        }
    }

    /**
     * 만료된 캐시 엔트리 정리
     */
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        // 모든 캐시 맵에서 만료된 엔트리 제거
        const caches = [this.contentAnalysisCache, this.aiResponseCache, this.titleCandidatesCache];
        
        caches.forEach(cache => {
            for (const [key, entry] of cache.entries()) {
                if (now - entry.timestamp > this.ttl) {
                    cache.delete(key);
                    this.cacheMetadata.delete(key);
                    cleanedCount++;
                }
            }
        });
        
        if (cleanedCount > 0) {
            console.log('캐시 정리 완료:', cleanedCount, '개 엔트리 제거');
            this.stats.cleanups++;
        }
    }

    /**
     * 자동 정리 타이머 시작
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup();
        }, this.cleanupInterval);
    }

    /**
     * 간단한 해시 함수 (성능 최적화용)
     * @param {string} str 해시할 문자열
     * @returns {string} 해시 값
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * 객체 크기 추정 (메모리 사용량 모니터링용)
     * @param {Object} obj 크기를 추정할 객체
     * @returns {number} 추정 크기 (바이트)
     */
    estimateObjectSize(obj) {
        const jsonStr = JSON.stringify(obj);
        return jsonStr.length * 2; // UTF-16 기준 대략적 크기
    }

    /**
     * 캐시 통계 조회
     * @returns {Object} 캐시 통계 정보
     */
    getStats() {
        const totalEntries = this.contentAnalysisCache.size + 
                           this.aiResponseCache.size + 
                           this.titleCandidatesCache.size;
        
        const hitRate = this.stats.hits + this.stats.misses > 0 ? 
                       (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) : 0;
        
        let totalSize = 0;
        for (const metadata of this.cacheMetadata.values()) {
            totalSize += metadata.size || 0;
        }
        
        return {
            ...this.stats,
            totalEntries,
            hitRate: `${hitRate}%`,
            totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
            cacheBreakdown: {
                contentAnalysis: this.contentAnalysisCache.size,
                aiResponse: this.aiResponseCache.size,
                titleCandidates: this.titleCandidatesCache.size
            }
        };
    }

    /**
     * 특정 타입의 캐시 클리어
     * @param {string} type 캐시 타입 ('content_analysis', 'ai_response', 'title_candidates', 'all')
     */
    clearCache(type = 'all') {
        if (type === 'all' || type === 'content_analysis') {
            this.contentAnalysisCache.clear();
        }
        if (type === 'all' || type === 'ai_response') {
            this.aiResponseCache.clear();
        }
        if (type === 'all' || type === 'title_candidates') {
            this.titleCandidatesCache.clear();
        }
        if (type === 'all') {
            this.cacheMetadata.clear();
        }
        
        console.log('캐시 클리어 완료:', type);
    }

    /**
     * 캐시 매니저 종료 (정리 타이머 중지)
     */
    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.clearCache('all');
        console.log('CacheManager 종료');
    }
}

// 싱글톤 인스턴스 생성
let cacheManagerInstance = null;

/**
 * 캐시 매니저 싱글톤 인스턴스 조회
 * @param {Object} options 캐시 매니저 옵션
 * @returns {CacheManager} 캐시 매니저 인스턴스
 */
function getCacheManager(options = {}) {
    if (!cacheManagerInstance) {
        cacheManagerInstance = new CacheManager(options);
    }
    return cacheManagerInstance;
}

export { CacheManager, getCacheManager };