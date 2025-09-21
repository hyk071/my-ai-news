/**
 * MemoryOptimizer - 메모리 사용량 최적화 유틸리티
 * 대용량 텍스트 처리 시 메모리 사용량을 최적화하고 가비지 컬렉션을 효율적으로 관리
 */

class MemoryOptimizer {
    constructor() {
        this.memoryStats = {
            peakUsage: 0,
            currentUsage: 0,
            gcCount: 0,
            optimizations: 0
        };
        
        // 메모리 모니터링 시작
        this.startMemoryMonitoring();
    }

    /**
     * 대용량 텍스트를 청크 단위로 처리
     * @param {string} text 처리할 텍스트
     * @param {Function} processor 각 청크를 처리할 함수
     * @param {number} chunkSize 청크 크기 (기본: 10000자)
     * @returns {Array} 처리 결과 배열
     */
    processTextInChunks(text, processor, chunkSize = 10000) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const results = [];
        const totalLength = text.length;
        
        console.log(`텍스트 청크 처리 시작: ${totalLength}자, 청크 크기: ${chunkSize}`);
        
        for (let i = 0; i < totalLength; i += chunkSize) {
            const chunk = text.slice(i, Math.min(i + chunkSize, totalLength));
            
            try {
                const result = processor(chunk, i);
                if (result !== null && result !== undefined) {
                    results.push(result);
                }
            } catch (error) {
                console.error(`청크 처리 오류 (위치: ${i}):`, error.message);
            }
            
            // 주기적으로 가비지 컬렉션 힌트 제공
            if (i % (chunkSize * 5) === 0 && global.gc) {
                global.gc();
                this.memoryStats.gcCount++;
            }
        }
        
        console.log(`텍스트 청크 처리 완료: ${results.length}개 결과`);
        return results;
    }

    /**
     * 객체 배열에서 불필요한 속성 제거
     * @param {Array} objects 객체 배열
     * @param {Array} keepFields 유지할 필드 목록
     * @returns {Array} 최적화된 객체 배열
     */
    optimizeObjectArray(objects, keepFields) {
        if (!Array.isArray(objects)) {
            return objects;
        }

        const optimized = objects.map(obj => {
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            const optimizedObj = {};
            keepFields.forEach(field => {
                if (obj.hasOwnProperty(field)) {
                    optimizedObj[field] = obj[field];
                }
            });

            return optimizedObj;
        });

        this.memoryStats.optimizations++;
        console.log(`객체 배열 최적화: ${objects.length}개 객체, ${keepFields.length}개 필드 유지`);
        
        return optimized;
    }

    /**
     * 문자열 배열 중복 제거 및 최적화
     * @param {Array} strings 문자열 배열
     * @param {number} maxLength 최대 문자열 길이
     * @returns {Array} 최적화된 문자열 배열
     */
    optimizeStringArray(strings, maxLength = 1000) {
        if (!Array.isArray(strings)) {
            return strings;
        }

        const seen = new Set();
        const optimized = [];

        for (const str of strings) {
            if (typeof str !== 'string' || str.length === 0) {
                continue;
            }

            // 길이 제한
            const trimmed = str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
            
            // 중복 제거
            const normalized = trimmed.toLowerCase().trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                optimized.push(trimmed);
            }
        }

        console.log(`문자열 배열 최적화: ${strings.length} → ${optimized.length}개`);
        return optimized;
    }

    /**
     * 콘텐츠 분석 결과 최적화
     * @param {Object} analysis 분석 결과 객체
     * @returns {Object} 최적화된 분석 결과
     */
    optimizeAnalysisResult(analysis) {
        if (!analysis || typeof analysis !== 'object') {
            return analysis;
        }

        const optimized = {
            headings: this.optimizeObjectArray(analysis.headings || [], ['level', 'text', 'chars']),
            keyPhrases: this.optimizeObjectArray(analysis.keyPhrases || [], ['phrase', 'frequency', 'importance']),
            firstParagraph: {
                text: this.truncateText(analysis.firstParagraph?.text || '', 500),
                sentences: this.optimizeStringArray(analysis.firstParagraph?.sentences || [], 200),
                keyPoints: this.optimizeStringArray(analysis.firstParagraph?.keyPoints || [], 150),
                chars: analysis.firstParagraph?.chars || 0
            },
            statistics: this.optimizeObjectArray(analysis.statistics || [], ['value', 'context', 'type']),
            entities: this.optimizeObjectArray(analysis.entities || [], ['text', 'type', 'frequency']),
            sentiment: {
                overall: analysis.sentiment?.overall || 'neutral',
                confidence: analysis.sentiment?.confidence || 0.5,
                aspects: analysis.sentiment?.aspects || {}
            }
        };

        this.memoryStats.optimizations++;
        console.log('콘텐츠 분석 결과 최적화 완료');
        
        return optimized;
    }

    /**
     * 제목 후보 배열 최적화
     * @param {Array} candidates 제목 후보 배열
     * @returns {Array} 최적화된 제목 후보 배열
     */
    optimizeTitleCandidates(candidates) {
        if (!Array.isArray(candidates)) {
            return candidates;
        }

        const optimized = candidates
            .filter(candidate => candidate && candidate.title)
            .map(candidate => ({
                title: this.truncateText(candidate.title, 200),
                source: candidate.source || 'unknown',
                score: typeof candidate.score === 'number' ? 
                       Math.round(candidate.score * 1000) / 1000 : 0.5
            }))
            .slice(0, 20); // 최대 20개로 제한

        console.log(`제목 후보 최적화: ${candidates.length} → ${optimized.length}개`);
        return optimized;
    }

    /**
     * 텍스트 길이 제한
     * @param {string} text 원본 텍스트
     * @param {number} maxLength 최대 길이
     * @returns {string} 제한된 텍스트
     */
    truncateText(text, maxLength) {
        if (typeof text !== 'string') {
            return '';
        }
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.slice(0, maxLength - 3) + '...';
    }

    /**
     * 메모리 사용량 모니터링 시작
     */
    startMemoryMonitoring() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            setInterval(() => {
                const usage = process.memoryUsage();
                this.memoryStats.currentUsage = usage.heapUsed;
                
                if (usage.heapUsed > this.memoryStats.peakUsage) {
                    this.memoryStats.peakUsage = usage.heapUsed;
                }
                
                // 메모리 사용량이 높으면 경고
                if (usage.heapUsed > 100 * 1024 * 1024) { // 100MB
                    console.warn('높은 메모리 사용량 감지:', this.formatBytes(usage.heapUsed));
                }
            }, 30000); // 30초마다 체크
        }
    }

    /**
     * 바이트를 읽기 쉬운 형식으로 변환
     * @param {number} bytes 바이트 수
     * @returns {string} 포맷된 문자열
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 메모리 통계 조회
     * @returns {Object} 메모리 사용량 통계
     */
    getMemoryStats() {
        const current = typeof process !== 'undefined' && process.memoryUsage ? 
                       process.memoryUsage() : { heapUsed: 0, heapTotal: 0 };
        
        return {
            current: {
                used: this.formatBytes(current.heapUsed),
                total: this.formatBytes(current.heapTotal),
                percentage: current.heapTotal > 0 ? 
                           Math.round((current.heapUsed / current.heapTotal) * 100) : 0
            },
            peak: this.formatBytes(this.memoryStats.peakUsage),
            gcCount: this.memoryStats.gcCount,
            optimizations: this.memoryStats.optimizations
        };
    }

    /**
     * 강제 가비지 컬렉션 실행 (가능한 경우)
     */
    forceGarbageCollection() {
        if (global.gc) {
            global.gc();
            this.memoryStats.gcCount++;
            console.log('강제 가비지 컬렉션 실행');
        } else {
            console.log('가비지 컬렉션 사용 불가 (--expose-gc 플래그 필요)');
        }
    }

    /**
     * 메모리 최적화 권장사항 제공
     * @returns {Array} 권장사항 배열
     */
    getOptimizationRecommendations() {
        const stats = this.getMemoryStats();
        const recommendations = [];
        
        if (stats.current.percentage > 80) {
            recommendations.push('메모리 사용률이 높습니다. 캐시 크기를 줄이는 것을 고려하세요.');
        }
        
        if (this.memoryStats.gcCount < 5) {
            recommendations.push('가비지 컬렉션이 적게 실행되었습니다. --expose-gc 플래그 사용을 고려하세요.');
        }
        
        if (this.memoryStats.optimizations === 0) {
            recommendations.push('메모리 최적화가 실행되지 않았습니다. 대용량 데이터 처리 시 최적화 함수를 사용하세요.');
        }
        
        return recommendations;
    }
}

// 싱글톤 인스턴스
let memoryOptimizerInstance = null;

/**
 * 메모리 최적화 유틸리티 싱글톤 인스턴스 조회
 * @returns {MemoryOptimizer} 메모리 최적화 인스턴스
 */
function getMemoryOptimizer() {
    if (!memoryOptimizerInstance) {
        memoryOptimizerInstance = new MemoryOptimizer();
    }
    return memoryOptimizerInstance;
}

export { MemoryOptimizer, getMemoryOptimizer };