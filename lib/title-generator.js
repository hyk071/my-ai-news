/**
 * TitleGenerator - 다단계 제목 생성 파이프라인 관리 클래스
 * AI 제목 생성, 콘텐츠 기반 제목, 휴리스틱 제목, 태그 기반 제목을 순차적으로 시도
 */

import { ContentAnalyzer } from './content-analyzer.js';
import { getCacheManager } from './cache-manager.js';
import { getMemoryOptimizer } from './memory-optimizer.js';

class TitleGenerationLogger {
    constructor() {
        this.logs = [];
        this.startTime = Date.now();
    }

    logStep(step, data) {
        const timestamp = Date.now() - this.startTime;
        this.logs.push({
            timestamp,
            step,
            data,
            level: 'info'
        });
        console.log(`[${timestamp}ms] ${step}:`, data);
    }

    logError(step, error) {
        const timestamp = Date.now() - this.startTime;
        this.logs.push({
            timestamp,
            step,
            error: error.message,
            level: 'error'
        });
        console.error(`[${timestamp}ms] ERROR in ${step}:`, error.message);
    }

    logWarning(step, message) {
        const timestamp = Date.now() - this.startTime;
        this.logs.push({
            timestamp,
            step,
            message,
            level: 'warning'
        });
        console.warn(`[${timestamp}ms] WARNING in ${step}:`, message);
    }

    getSummary() {
        return {
            totalTime: Date.now() - this.startTime,
            steps: this.logs.length,
            errors: this.logs.filter(log => log.level === 'error').length,
            warnings: this.logs.filter(log => log.level === 'warning').length,
            logs: this.logs
        };
    }
}

class TitleGenerator {
    constructor(contentAnalyzer, filters = {}, guidelines = {}) {
        this.analyzer = contentAnalyzer;
        this.filters = filters;
        this.guidelines = guidelines;
        this.logger = new TitleGenerationLogger();
        this.externalAITitles = []; // 외부에서 주입된 AI 제목들
        this.cacheManager = getCacheManager();
        this.memoryOptimizer = getMemoryOptimizer();

        // 기본 필터 설정 (더 관대하게)
        this.defaultFilters = {
            titleLen: { min: 10, max: 100 }, // 길이 제한 완화
            mustInclude: [],
            mustExclude: ['충격', '소름', '대박', '미쳤다', '헉', '레전드'],
            phraseInclude: [],
            phraseExclude: []
        };

        // 필터 병합
        this.mergedFilters = { ...this.defaultFilters, ...filters };

        // 콘텐츠 해시 생성 (캐싱용)
        this.contentHash = this.cacheManager.simpleHash(
            this.analyzer.content + JSON.stringify(this.analyzer.tags) + 
            this.analyzer.subject + this.analyzer.tone
        );

        this.logger.logStep('TitleGenerator 초기화', {
            hasAnalyzer: !!contentAnalyzer,
            filters: this.mergedFilters,
            guidelines: guidelines,
            contentHash: this.contentHash
        });
    }

    /**
     * 외부에서 생성된 AI 제목들을 주입
     * @param {Array} aiTitles AI 생성 제목 배열
     */
    setAITitles(aiTitles) {
        this.externalAITitles = Array.isArray(aiTitles) ? aiTitles : [];
        this.logger.logStep('외부 AI 제목 주입', { count: this.externalAITitles.length });
    }

    /**
     * 메인 제목 생성 메서드 - 전체 파이프라인 실행 (캐싱 지원)
     * @returns {Promise<Object>} 제목 생성 결과
     */
    async generateTitles() {
        this.logger.logStep('제목 생성 파이프라인 시작', { contentHash: this.contentHash });

        // 캐시에서 제목 후보 조회 시도
        const cachedCandidates = this.cacheManager.getCachedTitleCandidates(
            this.contentHash, this.mergedFilters, this.guidelines
        );

        if (cachedCandidates && cachedCandidates.length > 0) {
            this.logger.logStep('캐시된 제목 후보 사용', { count: cachedCandidates.length });
            
            return {
                candidates: cachedCandidates,
                bestTitle: cachedCandidates[0]?.title || 'AI 뉴스',
                sources: ['cache'],
                analysis: this.analyzer.analyze(), // 분석은 별도 캐싱됨
                logs: this.logger.getSummary(),
                fromCache: true
            };
        }

        // 캐시 미스 - 새로운 제목 생성 수행
        const candidates = [];
        const results = {
            candidates: [],
            bestTitle: '',
            sources: [],
            analysis: null,
            logs: [],
            fromCache: false
        };

        try {
            // 콘텐츠 분석 수행 (이미 캐싱됨)
            this.logger.logStep('콘텐츠 분석 시작', {});
            const analysis = this.analyzer.analyze();
            results.analysis = analysis;
            this.logger.logStep('콘텐츠 분석 완료', {
                headings: analysis.headings.length,
                keyPhrases: analysis.keyPhrases.length,
                statistics: analysis.statistics.length
            });

            // 1단계: AI 제목 생성 (현재는 스텁)
            this.logger.logStep('1단계: AI 제목 생성 시작', {});
            const aiTitles = await this.generateAITitles();
            if (aiTitles.length > 0) {
                candidates.push(...aiTitles.map(title => ({ title, source: 'ai_generation' })));
                results.sources.push('ai_generation');
                this.logger.logStep('AI 제목 생성 완료', { count: aiTitles.length });
            } else {
                this.logger.logWarning('AI 제목 생성', 'AI 제목 생성 실패 또는 결과 없음');
            }

            // 2단계: 콘텐츠 분석 기반 제목
            this.logger.logStep('2단계: 콘텐츠 기반 제목 생성 시작', {});
            const contentTitles = this.generateContentBasedTitles();
            if (contentTitles.length > 0) {
                candidates.push(...contentTitles.map(title => ({ title, source: 'content_analysis' })));
                results.sources.push('content_analysis');
                this.logger.logStep('콘텐츠 기반 제목 생성 완료', { count: contentTitles.length });
            }

            // 3단계: 휴리스틱 제목
            this.logger.logStep('3단계: 휴리스틱 제목 생성 시작', {});
            const heuristicTitles = this.generateHeuristicTitles();
            if (heuristicTitles.length > 0) {
                candidates.push(...heuristicTitles.map(title => ({ title, source: 'heuristic' })));
                results.sources.push('heuristic');
                this.logger.logStep('휴리스틱 제목 생성 완료', { count: heuristicTitles.length });
            }

            // 4단계: 태그/주제 기반 제목
            this.logger.logStep('4단계: 태그 기반 제목 생성 시작', {});
            const tagBasedTitles = this.generateTagBasedTitles();
            if (tagBasedTitles.length > 0) {
                candidates.push(...tagBasedTitles.map(title => ({ title, source: 'tag_based' })));
                results.sources.push('tag_based');
                this.logger.logStep('태그 기반 제목 생성 완료', { count: tagBasedTitles.length });
            }

            // 후보 처리 및 순위 결정
            this.logger.logStep('제목 후보 처리 시작', { totalCandidates: candidates.length });
            const rawCandidates = this.processAndRankCandidates(candidates);
            
            // 메모리 최적화 적용
            const optimizedCandidates = this.memoryOptimizer.optimizeTitleCandidates(rawCandidates);
            results.candidates = optimizedCandidates;

            // 최적 제목 선택
            results.bestTitle = optimizedCandidates.length > 0 ? optimizedCandidates[0].title : 'AI 뉴스';

            // 최적화된 제목 후보를 캐시에 저장
            if (optimizedCandidates.length > 0) {
                this.cacheManager.cacheTitleCandidates(
                    this.contentHash, this.mergedFilters, this.guidelines, optimizedCandidates
                );
            }

            this.logger.logStep('제목 생성 파이프라인 완료', {
                totalCandidates: optimizedCandidates.length,
                bestTitle: results.bestTitle,
                sources: results.sources,
                cached: true
            });

        } catch (error) {
            this.logger.logError('제목 생성 파이프라인', error);

            // 오류 발생 시 기본 제목 제공
            const fallbackTitle = this.generateFallbackTitle();
            results.bestTitle = fallbackTitle;
            results.candidates = [{ title: fallbackTitle, source: 'fallback', score: 0.1 }];
        }

        // 로그 요약 추가
        results.logs = this.logger.getSummary();

        return results;
    }

    /**
     * 폴백 제목 생성 (오류 발생 시 사용)
     */
    generateFallbackTitle() {
        try {
            const analysis = this.analyzer.analyze();
            
            // 1. 첫 번째 헤딩 사용
            if (analysis.headings && analysis.headings.length > 0) {
                const firstHeading = analysis.headings[0];
                if (firstHeading.text && firstHeading.text.length > 5) {
                    return firstHeading.text;
                }
            }
            
            // 2. 주요 키워드 조합
            if (analysis.keyPhrases && analysis.keyPhrases.length > 0) {
                const topKeywords = analysis.keyPhrases.slice(0, 2).map(kp => kp.phrase);
                if (topKeywords.length >= 2) {
                    return `${topKeywords[0]}과 ${topKeywords[1]}: 최신 동향 분석`;
                } else if (topKeywords.length === 1) {
                    return `${topKeywords[0]} 관련 최신 뉴스`;
                }
            }
            
            // 3. 태그 기반 제목
            if (this.analyzer.tags && this.analyzer.tags.length > 0) {
                const mainTag = this.analyzer.tags[0];
                return `${mainTag} 업계 동향: 주요 이슈 분석`;
            }
            
            // 4. 주제 기반 제목
            if (this.analyzer.subject && this.analyzer.subject.length > 10) {
                const subjectWords = this.analyzer.subject.split(' ').slice(0, 4).join(' ');
                return `${subjectWords} - 심층 분석`;
            }
            
            // 5. 최종 기본값
            return 'AI 뉴스: 최신 기술 동향';
            
        } catch (error) {
            console.warn('폴백 제목 생성 실패:', error.message);
            return 'AI 뉴스';
        }
    }

    /**
     * AI 제목 생성 (개선된 버전 - 품질 검증 및 오류 처리 포함)
     * @returns {Promise<Array>} AI 생성 제목 배열
     */
    async generateAITitles() {
        this.logger.logStep('AI 제목 생성 시작', {
            hasExternalTitles: this.externalAITitles.length > 0,
            contentLength: this.analyzer.content.length,
            tags: this.analyzer.tags.length
        });

        let aiTitles = [];
        let validatedTitles = [];

        try {
            // 1단계: 외부 주입된 AI 제목 사용 (우선순위)
            if (this.externalAITitles.length > 0) {
                this.logger.logStep('외부 AI 제목 검증 시작', { count: this.externalAITitles.length });
                aiTitles = this.externalAITitles;
            } else {
                // 2단계: 내부 AI 제목 생성 시도
                this.logger.logStep('내부 AI 제목 생성 시도', {});
                aiTitles = await this.generateInternalAITitles();
            }

            // 3단계: AI 제목 품질 검증 및 필터링
            validatedTitles = this.validateAndFilterAITitles(aiTitles);

            // 4단계: 품질 기반 순위 결정
            const rankedTitles = this.rankAITitles(validatedTitles);

            this.logger.logStep('AI 제목 생성 완료', {
                original: aiTitles.length,
                validated: validatedTitles.length,
                final: rankedTitles.length
            });

            return rankedTitles;

        } catch (error) {
            this.logger.logError('AI 제목 생성', error);
            
            // 5단계: 오류 발생 시 스마트 폴백 처리
            const fallbackTitles = this.generateSmartAIFallback();
            
            this.logger.logStep('AI 제목 생성 폴백 적용', { 
                fallbackCount: fallbackTitles.length,
                error: error.message 
            });

            return fallbackTitles;
        }
    }

    /**
     * 내부 AI 제목 생성 (콘텐츠 분석 기반)
     * @returns {Promise<Array>} 내부 생성 AI 제목 배열
     */
    async generateInternalAITitles() {
        const analysis = this.analyzer.analysis;
        if (!analysis) {
            throw new Error('콘텐츠 분석 결과가 없어 AI 제목 생성 불가');
        }

        const aiTitles = [];

        // AI 스타일 제목 생성 (분석 결과 기반)
        const aiStyleTitles = this.generateAIStyleTitles(analysis);
        aiTitles.push(...aiStyleTitles);

        // 트렌드 예측형 AI 제목
        const trendPredictiveTitles = this.generateTrendPredictiveTitles(analysis);
        aiTitles.push(...trendPredictiveTitles);

        // 감정 최적화 AI 제목
        const emotionOptimizedTitles = this.generateEmotionOptimizedTitles(analysis);
        aiTitles.push(...emotionOptimizedTitles);

        // SEO 최적화 AI 제목
        const seoOptimizedTitles = this.generateSEOOptimizedTitles(analysis);
        aiTitles.push(...seoOptimizedTitles);

        this.logger.logStep('내부 AI 제목 생성 완료', { count: aiTitles.length });
        return aiTitles;
    }

    /**
     * AI 스타일 제목 생성
     */
    generateAIStyleTitles(analysis) {
        const titles = [];
        const topKeyword = analysis.keyPhrases[0]?.phrase || 'AI';
        const sentiment = analysis.sentiment.overall;

        // AI가 선호하는 패턴의 제목들
        const aiPatterns = [
            `${topKeyword}의 미래를 바꿀 5가지 핵심 요소`,
            `${topKeyword} 혁신, 전문가가 예측하는 다음 단계`,
            `${topKeyword} 시장 분석: 데이터가 말하는 진실`,
            `${topKeyword}로 인한 산업 패러다임 전환의 신호`
        ];

        // 통계 기반 AI 스타일 제목
        if (analysis.statistics.length > 0) {
            const stat = analysis.statistics[0];
            aiPatterns.push(
                `${topKeyword} ${stat.value} 성장의 숨겨진 의미`,
                `데이터로 검증된 ${topKeyword}의 ${stat.value} 혁신`
            );
        }

        // 감정 기반 AI 스타일 조정
        if (sentiment === 'positive') {
            aiPatterns.push(
                `${topKeyword} 성공 스토리: AI가 분석한 성장 요인`,
                `${topKeyword} 시장 급성장, AI 예측 모델이 제시하는 전망`
            );
        }

        aiPatterns.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
            }
        });

        return titles.slice(0, 4); // 최대 4개
    }

    /**
     * 트렌드 예측형 AI 제목 생성
     */
    generateTrendPredictiveTitles(analysis) {
        const titles = [];
        const topKeyword = analysis.keyPhrases[0]?.phrase || 'AI';
        const hasEntities = analysis.entities.length > 0;

        const predictiveTitles = [
            `${topKeyword} 트렌드 예측: 2024년 주목해야 할 변화`,
            `${topKeyword} 시장 전망, AI 모델이 예측하는 미래`,
            `${topKeyword} 다음 혁신 포인트는 어디일까`
        ];

        // 개체명 기반 예측 제목
        if (hasEntities) {
            const entity = analysis.entities[0].text;
            predictiveTitles.push(
                `${entity}의 ${topKeyword} 전략, AI가 예측하는 성공 확률`,
                `${topKeyword} 시장에서 ${entity}의 다음 행보 예측`
            );
        }

        predictiveTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
            }
        });

        return titles.slice(0, 3); // 최대 3개
    }

    /**
     * 감정 최적화 AI 제목 생성
     */
    generateEmotionOptimizedTitles(analysis) {
        const titles = [];
        const topKeyword = analysis.keyPhrases[0]?.phrase || 'AI';
        const sentiment = analysis.sentiment;

        // 감정 점수에 따른 최적화된 제목
        if (sentiment.confidence > 0.7) {
            if (sentiment.overall === 'positive') {
                titles.push(
                    `${topKeyword} 성공 신화, 지속 가능한 성장의 비밀`,
                    `${topKeyword} 시장 호황, 기회를 놓치지 마세요`,
                    `${topKeyword} 혁신 가속화, 새로운 가능성의 문이 열리다`
                );
            } else if (sentiment.overall === 'negative') {
                titles.push(
                    `${topKeyword} 위기를 기회로, 전환점에서의 선택`,
                    `${topKeyword} 도전 과제 해결, 혁신적 접근법 필요`,
                    `${topKeyword} 시장 변화, 위기 속에서 찾는 새로운 길`
                );
            }
        } else {
            // 중립적이거나 신뢰도가 낮은 경우
            titles.push(
                `${topKeyword} 현황 분석, 균형잡힌 시각으로 본 미래`,
                `${topKeyword} 시장 동향, 객관적 데이터로 본 전망`
            );
        }

        return titles.filter(title => this.isValidTitleLength(title)).slice(0, 2);
    }

    /**
     * SEO 최적화 AI 제목 생성
     */
    generateSEOOptimizedTitles(analysis) {
        const titles = [];
        const topKeywords = analysis.keyPhrases.slice(0, 3);
        
        if (topKeywords.length === 0) return titles;

        const mainKeyword = topKeywords[0].phrase;
        const secondKeyword = topKeywords[1]?.phrase;

        // SEO 친화적 패턴의 제목들
        const seoTitles = [
            `${mainKeyword} 완벽 가이드: 전문가가 알려주는 핵심 포인트`,
            `${mainKeyword} 최신 동향 2024: 알아야 할 모든 것`,
            `${mainKeyword} 성공 전략: 실무진이 공개하는 노하우`
        ];

        // 2개 키워드 조합 SEO 제목
        if (secondKeyword) {
            seoTitles.push(
                `${mainKeyword} vs ${secondKeyword}: 비교 분석과 선택 가이드`,
                `${mainKeyword}와 ${secondKeyword} 통합 전략: 시너지 극대화 방법`
            );
        }

        // 통계 기반 SEO 제목
        if (analysis.statistics.length > 0) {
            const stat = analysis.statistics[0];
            seoTitles.push(
                `${mainKeyword} ${stat.value} 성장 비결: 데이터로 본 성공 요인`
            );
        }

        return seoTitles.filter(title => this.isValidTitleLength(title)).slice(0, 3);
    }

    /**
     * AI 제목 품질 검증 및 필터링
     */
    validateAndFilterAITitles(aiTitles) {
        const validatedTitles = [];

        aiTitles.forEach(title => {
            const validation = this.validateAITitleQuality(title);
            
            if (validation.isValid) {
                validatedTitles.push({
                    title: title,
                    qualityScore: validation.score,
                    issues: validation.issues
                });
                
                this.logger.logStep('AI 제목 검증 통과', { 
                    title: title, 
                    score: validation.score 
                });
            } else {
                this.logger.logWarning('AI 제목 검증 실패', { 
                    title: title, 
                    issues: validation.issues 
                });
            }
        });

        return validatedTitles;
    }

    /**
     * AI 제목 품질 검증
     */
    validateAITitleQuality(title) {
        const issues = [];
        let score = 0.5; // 기본 점수

        // 1. 길이 검증
        const chars = [...title].length;
        if (chars < this.mergedFilters.titleLen.min) {
            issues.push('제목이 너무 짧음');
            score -= 0.2;
        } else if (chars > this.mergedFilters.titleLen.max) {
            issues.push('제목이 너무 김');
            score -= 0.2;
        } else {
            score += 0.1;
        }

        // 2. 금지 키워드 검증
        const titleLower = title.toLowerCase();
        const bannedFound = this.mergedFilters.mustExclude.filter(banned => 
            titleLower.includes(banned.toLowerCase())
        );
        if (bannedFound.length > 0) {
            issues.push(`금지 키워드 포함: ${bannedFound.join(', ')}`);
            score -= 0.3;
        }

        // 3. 키워드 관련성 검증
        const analysis = this.analyzer.analysis;
        if (analysis && analysis.keyPhrases.length > 0) {
            const keywordMatches = analysis.keyPhrases.filter(kp => 
                titleLower.includes(kp.phrase.toLowerCase())
            ).length;
            
            if (keywordMatches === 0) {
                issues.push('주요 키워드 미포함');
                score -= 0.2;
            } else {
                score += keywordMatches * 0.1;
            }
        }

        // 4. 문법 및 구조 검증
        if (title.includes('  ')) { // 연속 공백
            issues.push('연속 공백 존재');
            score -= 0.1;
        }

        if (title.startsWith(' ') || title.endsWith(' ')) {
            issues.push('앞뒤 공백 존재');
            score -= 0.1;
        }

        // 5. 의미 있는 내용 검증
        if (title.length < 5 || title.split(' ').length < 2) {
            issues.push('의미 있는 내용 부족');
            score -= 0.2;
        }

        const isValid = issues.length === 0 || (issues.length === 1 && score > 0.3);
        
        return {
            isValid: isValid,
            score: Math.max(0, Math.min(1, score)),
            issues: issues
        };
    }

    /**
     * AI 제목 순위 결정
     */
    rankAITitles(validatedTitles) {
        return validatedTitles
            .sort((a, b) => b.qualityScore - a.qualityScore)
            .map(item => item.title)
            .slice(0, 6); // 최대 6개
    }

    /**
     * 스마트 AI 폴백 제목 생성
     */
    generateSmartAIFallback() {
        const analysis = this.analyzer.analysis;
        const fallbackTitles = [];

        // 분석 결과가 있으면 이를 기반으로 폴백 제목 생성
        if (analysis && analysis.keyPhrases.length > 0) {
            const mainKeyword = analysis.keyPhrases[0].phrase;
            
            fallbackTitles.push(
                `${mainKeyword} 시장 동향: 전문가 분석과 전망`,
                `${mainKeyword} 혁신 트렌드와 미래 가능성`,
                `${mainKeyword} 분야 최신 동향과 시사점`
            );

            // 통계가 있으면 추가
            if (analysis.statistics.length > 0) {
                const stat = analysis.statistics[0];
                fallbackTitles.push(
                    `${mainKeyword} ${stat.value} 변화, 업계 주목`
                );
            }
        } else {
            // 기본 폴백 제목들
            fallbackTitles.push(
                'AI 기술 발전과 산업 변화 전망',
                '디지털 혁신 시대의 새로운 기회',
                '기술 트렌드 분석과 미래 예측'
            );
        }

        // 길이 검증 후 반환
        return fallbackTitles
            .filter(title => this.isValidTitleLength(title))
            .slice(0, 3); // 최대 3개
    }

    /**
     * 콘텐츠 분석 결과를 기반으로 제목 생성 (개선된 버전)
     * @returns {Array} 콘텐츠 기반 제목 배열
     */
    generateContentBasedTitles() {
        const titles = [];
        const analysis = this.analyzer.analysis;

        if (!analysis) {
            this.logger.logWarning('콘텐츠 기반 제목 생성', '분석 결과가 없음');
            return titles;
        }

        this.logger.logStep('콘텐츠 기반 제목 생성 시작', {
            headings: analysis.headings.length,
            keyPhrases: analysis.keyPhrases.length,
            statistics: analysis.statistics.length,
            entities: analysis.entities.length
        });

        // 1. H1 헤딩 기반 제목 생성 (개선된 로직)
        this.generateHeadingBasedTitles(titles, analysis.headings, analysis.keyPhrases);

        // 2. 첫 문단 기반 제목 생성 (개선된 로직)
        this.generateFirstParagraphTitles(titles, analysis.firstParagraph, analysis.keyPhrases);

        // 3. 통계 데이터 기반 제목 생성 (개선된 로직)
        this.generateStatisticalTitles(titles, analysis.statistics, analysis.keyPhrases);

        // 4. 키워드 조합 제목 생성 (개선된 로직)
        this.generateKeywordCombinationTitles(titles, analysis.keyPhrases);

        // 5. 개체명 기반 제목 생성 (새로운 기능)
        this.generateEntityBasedTitles(titles, analysis.entities, analysis.keyPhrases);

        // 6. 감정 기반 제목 생성 (새로운 기능)
        this.generateSentimentBasedTitles(titles, analysis.sentiment, analysis.keyPhrases);

        // 7. 컨텍스트 기반 제목 생성 (새로운 기능)
        this.generateContextualTitles(titles, analysis);

        // 중복 제거 및 품질 필터링
        const uniqueTitles = this.filterAndRankContentTitles(titles);

        this.logger.logStep('콘텐츠 기반 제목 생성 완료', {
            total: titles.length,
            unique: uniqueTitles.length,
            final: Math.min(uniqueTitles.length, 8)
        });

        return uniqueTitles.slice(0, 8); // 최대 8개
    }

    /**
     * 헤딩 기반 제목 생성 (개선된 로직)
     */
    generateHeadingBasedTitles(titles, headings, keyPhrases) {
        const h1Headings = headings.filter(h => h.level === 1);
        const h2Headings = headings.filter(h => h.level === 2);
        const topKeyword = keyPhrases[0]?.phrase || '';

        // H1 헤딩 처리
        h1Headings.forEach(heading => {
            let title = heading.text;

            // 길이 조정 및 키워드 강화
            if ([...title].length < this.mergedFilters.titleLen.min) {
                if (topKeyword && !title.includes(topKeyword)) {
                    title = `${title}: ${topKeyword} 심층 분석`;
                } else {
                    title = `${title}의 현재와 미래 전망`;
                }
            } else if ([...title].length > this.mergedFilters.titleLen.max) {
                title = [...title].slice(0, this.mergedFilters.titleLen.max - 3).join('') + '...';
            }

            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('H1 헤딩 제목 추가', { title });
            }
        });

        // H2 헤딩 처리 (개선된 확장 로직)
        h2Headings.forEach(heading => {
            if (!this.isGenericHeading(heading.text)) {
                const expandedTitles = this.expandH2Heading(heading.text, topKeyword);
                expandedTitles.forEach(title => {
                    if (this.isValidTitleLength(title)) {
                        titles.push(title);
                        this.logger.logStep('H2 헤딩 확장 제목 추가', { title });
                    }
                });
            }
        });
    }

    /**
     * H2 헤딩 확장 로직
     */
    expandH2Heading(headingText, topKeyword) {
        const expandedTitles = [];
        
        if ([...headingText].length < this.mergedFilters.titleLen.min) {
            if (topKeyword) {
                expandedTitles.push(`${topKeyword} ${headingText}: 전문가 분석과 전망`);
                expandedTitles.push(`${headingText}으로 본 ${topKeyword} 시장 변화`);
            } else {
                expandedTitles.push(`${headingText}에 대한 심층 분석과 시사점`);
            }
        } else {
            expandedTitles.push(headingText);
        }

        return expandedTitles;
    }

    /**
     * 첫 문단 기반 제목 생성 (개선된 로직)
     */
    generateFirstParagraphTitles(titles, firstParagraph, keyPhrases) {
        if (!firstParagraph.text) return;

        const topKeyword = keyPhrases[0]?.phrase || '';
        const sentences = firstParagraph.sentences;

        // 첫 번째 문장 기반 제목
        if (sentences.length > 0) {
            const firstSentence = sentences[0];
            const cleanedTitle = this.cleanSentenceForTitle(firstSentence);
            
            if (cleanedTitle) {
                const enhancedTitles = this.enhanceFirstSentenceTitle(cleanedTitle, topKeyword);
                enhancedTitles.forEach(title => {
                    if (this.isValidTitleLength(title)) {
                        titles.push(title);
                        this.logger.logStep('첫 문단 기반 제목 추가', { title });
                    }
                });
            }
        }

        // 핵심 포인트 기반 제목
        if (firstParagraph.keyPoints.length > 0) {
            firstParagraph.keyPoints.forEach(point => {
                const pointTitle = this.createKeyPointTitle(point, topKeyword);
                if (pointTitle && this.isValidTitleLength(pointTitle)) {
                    titles.push(pointTitle);
                    this.logger.logStep('핵심 포인트 기반 제목 추가', { title: pointTitle });
                }
            });
        }
    }

    /**
     * 첫 문장 제목 강화
     */
    enhanceFirstSentenceTitle(cleanedTitle, topKeyword) {
        const enhancedTitles = [];
        
        // 길이 조정
        if ([...cleanedTitle].length < this.mergedFilters.titleLen.min) {
            if (topKeyword && !cleanedTitle.includes(topKeyword)) {
                enhancedTitles.push(`${topKeyword}: ${cleanedTitle}`);
                enhancedTitles.push(`${cleanedTitle}, ${topKeyword} 관점에서 분석`);
            } else {
                enhancedTitles.push(`${cleanedTitle}의 의미와 전망`);
            }
        } else if ([...cleanedTitle].length > this.mergedFilters.titleLen.max) {
            const words = cleanedTitle.split(' ');
            let shortened = '';
            for (const word of words) {
                if ([...shortened + ' ' + word].length <= this.mergedFilters.titleLen.max - 3) {
                    shortened += (shortened ? ' ' : '') + word;
                } else {
                    break;
                }
            }
            enhancedTitles.push(shortened + (shortened !== cleanedTitle ? '...' : ''));
        } else {
            enhancedTitles.push(cleanedTitle);
        }

        return enhancedTitles;
    }

    /**
     * 핵심 포인트 기반 제목 생성
     */
    createKeyPointTitle(keyPoint, topKeyword) {
        const cleanedPoint = this.cleanSentenceForTitle(keyPoint);
        
        if ([...cleanedPoint].length < this.mergedFilters.titleLen.min) {
            return topKeyword ? `${topKeyword} ${cleanedPoint}, 업계 주목` : `${cleanedPoint}의 중요성과 의미`;
        } else if ([...cleanedPoint].length > this.mergedFilters.titleLen.max) {
            return [...cleanedPoint].slice(0, this.mergedFilters.titleLen.max - 3).join('') + '...';
        }
        
        return cleanedPoint;
    }

    /**
     * 통계 데이터 기반 제목 생성 (개선된 로직)
     */
    generateStatisticalTitles(titles, statistics, keyPhrases) {
        if (statistics.length === 0 || keyPhrases.length === 0) return;

        const topKeyword = keyPhrases[0].phrase;
        const topStats = statistics.slice(0, 3); // 상위 3개 통계

        topStats.forEach(stat => {
            const statTitles = this.createStatisticalTitleVariations(stat, topKeyword);
            statTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('통계 기반 제목 추가', { title, statValue: stat.value });
                }
            });
        });
    }

    /**
     * 통계 기반 제목 변형 생성
     */
    createStatisticalTitleVariations(stat, topKeyword) {
        const variations = [];
        
        if (stat.type === 'percentage') {
            variations.push(`${topKeyword} 시장 ${stat.value} 성장, 새로운 전환점 맞나`);
            variations.push(`${stat.value} 급성장한 ${topKeyword}, 지속 가능할까`);
            variations.push(`${topKeyword} 분야 ${stat.value} 증가, 전문가 분석`);
        } else if (stat.type === 'number') {
            variations.push(`${topKeyword} 분야 ${stat.value} 규모 달성, 업계 주목`);
            variations.push(`${stat.value} 기록한 ${topKeyword} 시장, 향후 전망은`);
            variations.push(`${topKeyword} ${stat.value} 돌파, 성장 동력 분석`);
        } else if (stat.type === 'multiple') {
            variations.push(`${topKeyword} 성능 ${stat.value} 향상, 경쟁력 강화 기대`);
            variations.push(`${stat.value} 개선된 ${topKeyword}, 시장 반응은`);
            variations.push(`${topKeyword} ${stat.value} 발전, 업계 판도 변화`);
        }

        return variations;
    }

    /**
     * 키워드 조합 제목 생성 (개선된 로직)
     */
    generateKeywordCombinationTitles(titles, keyPhrases) {
        if (keyPhrases.length < 2) return;

        const keyword1 = keyPhrases[0].phrase;
        const keyword2 = keyPhrases[1].phrase;
        const keyword3 = keyPhrases.length > 2 ? keyPhrases[2].phrase : null;

        // 2개 키워드 조합
        const twoKeywordTitles = [
            `${keyword1}와 ${keyword2}의 융합, 새로운 시장 기회 창출`,
            `${keyword1} 기반 ${keyword2} 혁신, 업계 판도 변화 예고`,
            `${keyword1} 시장에서 ${keyword2}의 역할과 중요성`,
            `${keyword2}로 강화되는 ${keyword1} 생태계의 미래`
        ];

        twoKeywordTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('2개 키워드 조합 제목 추가', { title });
            }
        });

        // 3개 키워드 조합 (있는 경우)
        if (keyword3) {
            const threeKeywordTitles = [
                `${keyword1}, ${keyword2}, ${keyword3} 연계 전략의 성공 가능성`,
                `${keyword1}와 ${keyword2}로 본 ${keyword3} 시장 전망`
            ];

            threeKeywordTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('3개 키워드 조합 제목 추가', { title });
                }
            });
        }
    }

    /**
     * 개체명 기반 제목 생성 (새로운 기능)
     */
    generateEntityBasedTitles(titles, entities, keyPhrases) {
        if (entities.length === 0) return;

        const topEntity = entities[0];
        const topKeyword = keyPhrases[0]?.phrase || '기술';

        const entityTitles = [
            `${topEntity.text}의 ${topKeyword} 전략, 시장 판도 바꿀까`,
            `${topEntity.text} 중심으로 재편되는 ${topKeyword} 생태계`,
            `${topEntity.text}가 이끄는 ${topKeyword} 혁신의 방향성`,
            `${topKeyword} 시장에서 ${topEntity.text}의 영향력 확대`
        ];

        entityTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('개체명 기반 제목 추가', { title, entity: topEntity.text });
            }
        });
    }

    /**
     * 감정 기반 제목 생성 (새로운 기능)
     */
    generateSentimentBasedTitles(titles, sentiment, keyPhrases) {
        if (keyPhrases.length === 0) return;

        const topKeyword = keyPhrases[0].phrase;
        let sentimentTitles = [];

        if (sentiment.overall === 'positive') {
            sentimentTitles = [
                `${topKeyword} 시장 호조세 지속, 투자자들 주목`,
                `${topKeyword} 분야 성장 가속화, 새로운 기회 창출`,
                `${topKeyword} 기술 발전으로 업계 전반 활기`,
                `${topKeyword} 시장 긍정적 전망, 성장 동력 분석`
            ];
        } else if (sentiment.overall === 'negative') {
            sentimentTitles = [
                `${topKeyword} 시장 우려 확산, 대응 방안은`,
                `${topKeyword} 분야 도전 과제와 해결책 모색`,
                `${topKeyword} 업계 어려움 속 새로운 돌파구 찾기`
            ];
        } else {
            sentimentTitles = [
                `${topKeyword} 시장 현황과 향후 전망 분석`,
                `${topKeyword} 분야 균형잡힌 시각으로 본 미래`,
                `${topKeyword} 업계 객관적 평가와 발전 방향`
            ];
        }

        sentimentTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('감정 기반 제목 추가', { title, sentiment: sentiment.overall });
            }
        });
    }

    /**
     * 컨텍스트 기반 제목 생성 (새로운 기능)
     */
    generateContextualTitles(titles, analysis) {
        const topKeyword = analysis.keyPhrases[0]?.phrase || 'AI';
        const hasStatistics = analysis.statistics.length > 0;
        const hasEntities = analysis.entities.length > 0;
        const isPositive = analysis.sentiment.overall === 'positive';

        // 컨텍스트에 따른 제목 템플릿
        const contextualTitles = [];

        if (hasStatistics && isPositive) {
            contextualTitles.push(`${topKeyword} 시장 급성장, 데이터로 본 성공 요인`);
            contextualTitles.push(`숫자로 증명된 ${topKeyword}의 성장 잠재력`);
        }

        if (hasEntities && hasStatistics) {
            const topEntity = analysis.entities[0].text;
            contextualTitles.push(`${topEntity} 주도하는 ${topKeyword} 시장, 수치로 본 현황`);
        }

        if (analysis.headings.length > 3) {
            contextualTitles.push(`${topKeyword} 분야 종합 분석: 현재와 미래 전망`);
            contextualTitles.push(`${topKeyword} 시장 다각도 분석과 전략적 시사점`);
        }

        contextualTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('컨텍스트 기반 제목 추가', { title });
            }
        });
    }

    /**
     * 콘텐츠 제목 필터링 및 순위 결정
     */
    filterAndRankContentTitles(titles) {
        // 중복 제거
        const uniqueTitles = [...new Set(titles)];
        
        // 품질 기반 순위 결정
        const rankedTitles = uniqueTitles.map(title => ({
            title,
            score: this.calculateContentTitleScore(title)
        })).sort((a, b) => b.score - a.score);

        return rankedTitles.map(item => item.title);
    }

    /**
     * 콘텐츠 기반 제목 점수 계산
     */
    calculateContentTitleScore(title) {
        let score = 0.5; // 기본 점수

        const analysis = this.analyzer.analysis;
        if (!analysis) return score;

        // 키워드 포함 점수
        const titleLower = title.toLowerCase();
        const keywordMatches = analysis.keyPhrases.filter(kp => 
            titleLower.includes(kp.phrase.toLowerCase())
        );
        score += keywordMatches.length * 0.1;

        // 개체명 포함 점수
        const entityMatches = analysis.entities.filter(entity => 
            titleLower.includes(entity.text.toLowerCase())
        );
        score += entityMatches.length * 0.05;

        // 통계 포함 점수
        const hasStatistics = analysis.statistics.some(stat => 
            title.includes(stat.value)
        );
        if (hasStatistics) score += 0.1;

        // 길이 점수 (최적 길이에 가까울수록 높은 점수)
        const chars = [...title].length;
        const optimalLength = (this.mergedFilters.titleLen.min + this.mergedFilters.titleLen.max) / 2;
        const lengthScore = 1 - Math.abs(chars - optimalLength) / optimalLength;
        score += lengthScore * 0.1;

        // 감정 일치 점수
        if (analysis.sentiment.overall === 'positive' && 
            (title.includes('성장') || title.includes('발전') || title.includes('혁신'))) {
            score += 0.05;
        }

        return Math.min(1.0, score);
    }

    /**
     * 휴리스틱 방법으로 제목 생성 (개선된 규칙 기반 알고리즘)
     * @returns {Array} 휴리스틱 제목 배열
     */
    generateHeuristicTitles() {
        const titles = [];
        const analysis = this.analyzer.analysis;

        if (!analysis) {
            this.logger.logWarning('휴리스틱 제목 생성', '분석 결과가 없음');
            return titles;
        }

        this.logger.logStep('휴리스틱 제목 생성 시작', {
            keyPhrases: analysis.keyPhrases.length,
            statistics: analysis.statistics.length,
            entities: analysis.entities.length,
            sentiment: analysis.sentiment.overall
        });

        const topKeywords = analysis.keyPhrases.slice(0, 3);
        const mainKeyword = topKeywords[0]?.phrase || 'AI';

        // 1. 고급 트렌드 분석형 제목 (개선된 알고리즘)
        this.generateAdvancedTrendTitles(titles, mainKeyword, analysis);

        // 2. 스마트 통계 활용형 제목 (개선된 알고리즘)
        this.generateSmartStatisticalTitles(titles, mainKeyword, analysis);

        // 3. 컨텍스트 인식 개체명 기반 제목 (개선된 알고리즘)
        this.generateContextAwareEntityTitles(titles, mainKeyword, analysis);

        // 4. 감정 적응형 제목 (개선된 알고리즘)
        this.generateSentimentAdaptiveTitles(titles, mainKeyword, analysis);

        // 5. 인텔리전트 질문형 제목 (개선된 알고리즘)
        this.generateIntelligentQuestionTitles(titles, mainKeyword, analysis);

        // 6. 시간적 맥락 기반 제목 (새로운 기능)
        this.generateTemporalContextTitles(titles, mainKeyword, analysis);

        // 7. 산업별 특화 제목 (새로운 기능)
        this.generateIndustrySpecificTitles(titles, mainKeyword, analysis);

        // 8. 다층적 키워드 조합 제목 (새로운 기능)
        this.generateMultiLayerKeywordTitles(titles, topKeywords, analysis);

        // 품질 기반 필터링 및 순위 결정
        const rankedTitles = this.rankHeuristicTitles(titles, analysis);

        this.logger.logStep('휴리스틱 제목 생성 완료', { 
            total: titles.length,
            ranked: rankedTitles.length 
        });

        return rankedTitles.slice(0, 10); // 최대 10개
    }

    /**
     * 고급 트렌드 분석형 제목 생성
     */
    generateAdvancedTrendTitles(titles, mainKeyword, analysis) {
        const trendPatterns = [
            { template: `${mainKeyword} 시장 동향 분석: 성장 요인과 전망`, weight: 0.8 },
            { template: `${mainKeyword} 산업 혁신, 새로운 패러다임의 시작`, weight: 0.7 },
            { template: `${mainKeyword} 기술 발전이 가져올 변화와 기회`, weight: 0.6 }
        ];

        // 감정에 따른 트렌드 제목 조정
        if (analysis.sentiment.overall === 'positive') {
            trendPatterns.push(
                { template: `${mainKeyword} 시장 급성장, 새로운 기회의 창`, weight: 0.9 },
                { template: `${mainKeyword} 혁신 가속화, 업계 전반 활기`, weight: 0.8 }
            );
        } else if (analysis.sentiment.overall === 'negative') {
            trendPatterns.push(
                { template: `${mainKeyword} 시장 도전과 극복 방안`, weight: 0.7 },
                { template: `${mainKeyword} 업계 위기 속 새로운 돌파구`, weight: 0.6 }
            );
        }

        // 통계가 있으면 트렌드 제목에 반영
        if (analysis.statistics.length > 0) {
            const stat = analysis.statistics[0];
            trendPatterns.push({
                template: `${mainKeyword} 시장 ${stat.value} 변화, 트렌드 분석`,
                weight: 0.85
            });
        }

        trendPatterns.forEach(pattern => {
            if (this.isValidTitleLength(pattern.template)) {
                titles.push({ title: pattern.template, weight: pattern.weight, type: 'trend' });
                this.logger.logStep('고급 트렌드 제목 추가', { title: pattern.template });
            }
        });
    }

    /**
     * 스마트 통계 활용형 제목 생성
     */
    generateSmartStatisticalTitles(titles, mainKeyword, analysis) {
        if (analysis.statistics.length === 0) return;

        const topStats = analysis.statistics.slice(0, 2);
        
        topStats.forEach(stat => {
            const statTitles = this.createSmartStatisticalVariations(stat, mainKeyword, analysis);
            statTitles.forEach(titleObj => {
                if (this.isValidTitleLength(titleObj.title)) {
                    titles.push(titleObj);
                    this.logger.logStep('스마트 통계 제목 추가', { title: titleObj.title });
                }
            });
        });
    }

    /**
     * 스마트 통계 제목 변형 생성
     */
    createSmartStatisticalVariations(stat, mainKeyword, analysis) {
        const variations = [];
        const sentiment = analysis.sentiment.overall;
        const hasEntities = analysis.entities.length > 0;

        if (stat.type === 'percentage') {
            variations.push({
                title: `${mainKeyword} 시장 ${stat.value} 급성장, 업계 전망은?`,
                weight: 0.9,
                type: 'statistical'
            });

            if (sentiment === 'positive') {
                variations.push({
                    title: `${stat.value} 성장한 ${mainKeyword}, 지속 가능한 발전 가능할까`,
                    weight: 0.85,
                    type: 'statistical'
                });
            }

            if (hasEntities) {
                const entity = analysis.entities[0].text;
                variations.push({
                    title: `${entity} 주도 ${mainKeyword} ${stat.value} 성장, 경쟁사 대응은`,
                    weight: 0.8,
                    type: 'statistical'
                });
            }
        } else if (stat.type === 'number') {
            variations.push({
                title: `${mainKeyword} 분야 ${stat.value} 규모 달성, 업계 주목`,
                weight: 0.85,
                type: 'statistical'
            });

            variations.push({
                title: `${stat.value} 돌파한 ${mainKeyword} 시장, 다음 목표는`,
                weight: 0.8,
                type: 'statistical'
            });
        } else if (stat.type === 'multiple') {
            variations.push({
                title: `${mainKeyword} 성능 ${stat.value} 향상, 경쟁력 강화 기대`,
                weight: 0.8,
                type: 'statistical'
            });
        }

        return variations;
    }

    /**
     * 컨텍스트 인식 개체명 기반 제목 생성
     */
    generateContextAwareEntityTitles(titles, mainKeyword, analysis) {
        if (analysis.entities.length === 0) return;

        const topEntities = analysis.entities.slice(0, 2);
        
        topEntities.forEach(entity => {
            const entityTitles = this.createContextAwareEntityVariations(entity, mainKeyword, analysis);
            entityTitles.forEach(titleObj => {
                if (this.isValidTitleLength(titleObj.title)) {
                    titles.push(titleObj);
                    this.logger.logStep('컨텍스트 인식 개체명 제목 추가', { title: titleObj.title });
                }
            });
        });
    }

    /**
     * 컨텍스트 인식 개체명 제목 변형 생성
     */
    createContextAwareEntityVariations(entity, mainKeyword, analysis) {
        const variations = [];
        const sentiment = analysis.sentiment.overall;
        const hasStatistics = analysis.statistics.length > 0;

        // 기본 개체명 기반 제목
        variations.push({
            title: `${entity.text}의 ${mainKeyword} 전략, 시장 판도 바꿀까`,
            weight: 0.8,
            type: 'entity'
        });

        // 감정에 따른 조정
        if (sentiment === 'positive') {
            variations.push({
                title: `${entity.text} 중심으로 성장하는 ${mainKeyword} 생태계`,
                weight: 0.85,
                type: 'entity'
            });
        } else if (sentiment === 'negative') {
            variations.push({
                title: `${entity.text}의 ${mainKeyword} 도전과 극복 전략`,
                weight: 0.7,
                type: 'entity'
            });
        }

        // 통계와 결합
        if (hasStatistics) {
            const stat = analysis.statistics[0];
            variations.push({
                title: `${entity.text}가 이끄는 ${mainKeyword} ${stat.value} 혁신`,
                weight: 0.9,
                type: 'entity'
            });
        }

        // 경쟁 관점
        if (entity.type === 'ORGANIZATION') {
            variations.push({
                title: `${entity.text}의 ${mainKeyword} 혁신, 경쟁사 대응 전략은`,
                weight: 0.75,
                type: 'entity'
            });
        }

        return variations;
    }

    /**
     * 감정 적응형 제목 생성
     */
    generateSentimentAdaptiveTitles(titles, mainKeyword, analysis) {
        const sentiment = analysis.sentiment;
        const sentimentTitles = [];

        if (sentiment.overall === 'positive') {
            sentimentTitles.push(
                { title: `${mainKeyword} 시장 호조세 지속, 투자자들 주목`, weight: 0.85, type: 'sentiment' },
                { title: `${mainKeyword} 분야 성장 가속화, 새로운 기회 창출`, weight: 0.8, type: 'sentiment' },
                { title: `${mainKeyword} 기술 발전으로 업계 전반 활기`, weight: 0.75, type: 'sentiment' }
            );

            // 신뢰도가 높으면 더 강한 긍정 표현
            if (sentiment.confidence > 0.8) {
                sentimentTitles.push({
                    title: `${mainKeyword} 시장 급성장, 황금기 진입 신호`,
                    weight: 0.9,
                    type: 'sentiment'
                });
            }
        } else if (sentiment.overall === 'negative') {
            sentimentTitles.push(
                { title: `${mainKeyword} 시장 우려 확산, 대응 방안 모색`, weight: 0.7, type: 'sentiment' },
                { title: `${mainKeyword} 분야 도전 과제와 해결책 탐색`, weight: 0.65, type: 'sentiment' },
                { title: `${mainKeyword} 업계 어려움 속 새로운 돌파구 찾기`, weight: 0.6, type: 'sentiment' }
            );
        } else {
            sentimentTitles.push(
                { title: `${mainKeyword} 시장 현황과 향후 전망 분석`, weight: 0.7, type: 'sentiment' },
                { title: `${mainKeyword} 분야 균형잡힌 시각으로 본 미래`, weight: 0.65, type: 'sentiment' }
            );
        }

        sentimentTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.title)) {
                titles.push(titleObj);
                this.logger.logStep('감정 적응형 제목 추가', { title: titleObj.title });
            }
        });
    }

    /**
     * 인텔리전트 질문형 제목 생성
     */
    generateIntelligentQuestionTitles(titles, mainKeyword, analysis) {
        const questionTitles = [];
        const hasStatistics = analysis.statistics.length > 0;
        const hasEntities = analysis.entities.length > 0;
        const sentiment = analysis.sentiment.overall;

        // 기본 질문형 제목
        questionTitles.push(
            { title: `${mainKeyword} 시장, 다음 성장 동력은 무엇일까?`, weight: 0.8, type: 'question' },
            { title: `${mainKeyword} 기술 발전, 우리 생활 어떻게 바뀔까?`, weight: 0.75, type: 'question' }
        );

        // 통계 기반 질문
        if (hasStatistics) {
            const stat = analysis.statistics[0];
            questionTitles.push({
                title: `${mainKeyword} ${stat.value} 성장, 지속 가능한 발전일까?`,
                weight: 0.85,
                type: 'question'
            });
        }

        // 개체명 기반 질문
        if (hasEntities) {
            const entity = analysis.entities[0].text;
            questionTitles.push({
                title: `${entity}의 ${mainKeyword} 전략, 성공할 수 있을까?`,
                weight: 0.8,
                type: 'question'
            });
        }

        // 감정 기반 질문
        if (sentiment === 'positive') {
            questionTitles.push({
                title: `${mainKeyword} 호황, 언제까지 지속될까?`,
                weight: 0.75,
                type: 'question'
            });
        } else if (sentiment === 'negative') {
            questionTitles.push({
                title: `${mainKeyword} 위기, 어떻게 극복할 수 있을까?`,
                weight: 0.7,
                type: 'question'
            });
        }

        questionTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.title)) {
                titles.push(titleObj);
                this.logger.logStep('인텔리전트 질문형 제목 추가', { title: titleObj.title });
            }
        });
    }

    /**
     * 시간적 맥락 기반 제목 생성 (새로운 기능)
     */
    generateTemporalContextTitles(titles, mainKeyword, analysis) {
        const temporalTitles = [];
        const hasStatistics = analysis.statistics.length > 0;

        // 현재-미래 대비 제목
        temporalTitles.push(
            { title: `${mainKeyword} 현재와 미래: 변화의 핵심 요소`, weight: 0.7, type: 'temporal' },
            { title: `${mainKeyword} 시장 진화, 과거에서 미래로`, weight: 0.65, type: 'temporal' }
        );

        // 통계가 있으면 시간적 변화 강조
        if (hasStatistics) {
            temporalTitles.push({
                title: `${mainKeyword} 급변하는 시장, 2024년 전망은`,
                weight: 0.8,
                type: 'temporal'
            });
        }

        // 트렌드 예측 제목
        if (analysis.sentiment.overall === 'positive') {
            temporalTitles.push({
                title: `${mainKeyword} 미래 전망, 다가오는 기회들`,
                weight: 0.75,
                type: 'temporal'
            });
        }

        temporalTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.title)) {
                titles.push(titleObj);
                this.logger.logStep('시간적 맥락 제목 추가', { title: titleObj.title });
            }
        });
    }

    /**
     * 산업별 특화 제목 생성 (새로운 기능)
     */
    generateIndustrySpecificTitles(titles, mainKeyword, analysis) {
        const industryTitles = [];
        
        // 키워드 기반 산업 분류
        const industryContext = this.identifyIndustryContext(mainKeyword, analysis);
        
        if (industryContext.type === 'technology') {
            industryTitles.push(
                { title: `${mainKeyword} 기술 혁신, 디지털 전환 가속화`, weight: 0.8, type: 'industry' },
                { title: `${mainKeyword} 플랫폼 생태계 확장과 경쟁 구도`, weight: 0.75, type: 'industry' }
            );
        } else if (industryContext.type === 'finance') {
            industryTitles.push(
                { title: `${mainKeyword} 금융 혁신, 새로운 서비스 모델`, weight: 0.8, type: 'industry' },
                { title: `${mainKeyword} 투자 트렌드와 리스크 분석`, weight: 0.75, type: 'industry' }
            );
        } else if (industryContext.type === 'healthcare') {
            industryTitles.push(
                { title: `${mainKeyword} 의료 혁신, 환자 중심 서비스`, weight: 0.8, type: 'industry' },
                { title: `${mainKeyword} 헬스케어 생태계 변화`, weight: 0.75, type: 'industry' }
            );
        } else {
            // 일반 산업 제목
            industryTitles.push(
                { title: `${mainKeyword} 산업 생태계 변화와 대응 전략`, weight: 0.7, type: 'industry' },
                { title: `${mainKeyword} 시장 구조 변화, 새로운 경쟁 환경`, weight: 0.65, type: 'industry' }
            );
        }

        industryTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.title)) {
                titles.push(titleObj);
                this.logger.logStep('산업별 특화 제목 추가', { title: titleObj.title });
            }
        });
    }

    /**
     * 산업 컨텍스트 식별
     */
    identifyIndustryContext(mainKeyword, analysis) {
        const keyword = mainKeyword.toLowerCase();
        
        if (keyword.includes('ai') || keyword.includes('인공지능') || keyword.includes('기술') || keyword.includes('플랫폼')) {
            return { type: 'technology', confidence: 0.8 };
        } else if (keyword.includes('투자') || keyword.includes('금융') || keyword.includes('펀드')) {
            return { type: 'finance', confidence: 0.8 };
        } else if (keyword.includes('의료') || keyword.includes('헬스') || keyword.includes('바이오')) {
            return { type: 'healthcare', confidence: 0.8 };
        }
        
        return { type: 'general', confidence: 0.5 };
    }

    /**
     * 다층적 키워드 조합 제목 생성 (새로운 기능)
     */
    generateMultiLayerKeywordTitles(titles, topKeywords, analysis) {
        if (topKeywords.length < 2) return;

        const multiLayerTitles = [];
        const keyword1 = topKeywords[0].phrase;
        const keyword2 = topKeywords[1].phrase;
        const keyword3 = topKeywords.length > 2 ? topKeywords[2].phrase : null;

        // 2층 키워드 조합
        multiLayerTitles.push(
            { title: `${keyword1}와 ${keyword2} 융합, 시너지 효과 분석`, weight: 0.8, type: 'multilayer' },
            { title: `${keyword1} 기반 ${keyword2} 혁신 전략`, weight: 0.75, type: 'multilayer' }
        );

        // 3층 키워드 조합 (있는 경우)
        if (keyword3) {
            multiLayerTitles.push({
                title: `${keyword1}, ${keyword2}, ${keyword3} 연계 생태계`,
                weight: 0.85,
                type: 'multilayer'
            });
        }

        // 통계와 키워드 조합
        if (analysis.statistics.length > 0) {
            const stat = analysis.statistics[0];
            multiLayerTitles.push({
                title: `${keyword1}와 ${keyword2} ${stat.value} 성장 동력`,
                weight: 0.9,
                type: 'multilayer'
            });
        }

        multiLayerTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.title)) {
                titles.push(titleObj);
                this.logger.logStep('다층적 키워드 조합 제목 추가', { title: titleObj.title });
            }
        });
    }

    /**
     * 휴리스틱 제목 순위 결정
     */
    rankHeuristicTitles(titles, analysis) {
        return titles
            .map(titleObj => ({
                ...titleObj,
                finalScore: this.calculateHeuristicTitleScore(titleObj, analysis)
            }))
            .sort((a, b) => b.finalScore - a.finalScore)
            .map(titleObj => titleObj.title);
    }

    /**
     * 휴리스틱 제목 점수 계산
     */
    calculateHeuristicTitleScore(titleObj, analysis) {
        let score = titleObj.weight || 0.5;

        // 타입별 가중치
        const typeWeights = {
            'statistical': 0.2,
            'entity': 0.15,
            'trend': 0.1,
            'sentiment': 0.1,
            'question': 0.05,
            'temporal': 0.05,
            'industry': 0.1,
            'multilayer': 0.15
        };

        score += typeWeights[titleObj.type] || 0;

        // 키워드 매칭 보너스
        const titleLower = titleObj.title.toLowerCase();
        const keywordMatches = analysis.keyPhrases.filter(kp => 
            titleLower.includes(kp.phrase.toLowerCase())
        ).length;
        score += keywordMatches * 0.05;

        // 길이 점수
        const chars = [...titleObj.title].length;
        const optimalLength = (this.mergedFilters.titleLen.min + this.mergedFilters.titleLen.max) / 2;
        const lengthScore = 1 - Math.abs(chars - optimalLength) / optimalLength;
        score += lengthScore * 0.05;

        return Math.min(1.0, score);
    }

    /**
     * 태그와 주제를 조합한 제목 생성 (개선된 알고리즘)
     * @returns {Array} 태그 기반 제목 배열
     */
    generateTagBasedTitles() {
        const titles = [];
        const tags = this.analyzer.tags;
        const subject = this.analyzer.subject;
        const analysis = this.analyzer.analysis;

        this.logger.logStep('태그 기반 제목 생성 시작', {
            tags: tags.length,
            hasSubject: !!subject,
            hasAnalysis: !!analysis
        });

        // 1. 스마트 태그 기반 확장 제목 (개선된 알고리즘)
        this.generateSmartTagBasedTitles(titles, tags, analysis);

        // 2. 인텔리전트 주제 기반 제목 (개선된 알고리즘)
        this.generateIntelligentSubjectTitles(titles, subject, analysis);

        // 3. 고급 태그-주제 조합 제목 (개선된 알고리즘)
        this.generateAdvancedTagSubjectCombination(titles, tags, subject, analysis);

        // 4. 컨텍스트 인식 태그 제목 (새로운 기능)
        this.generateContextAwareTagTitles(titles, tags, analysis);

        // 5. 의미론적 태그 확장 제목 (새로운 기능)
        this.generateSemanticTagExpansion(titles, tags, analysis);

        // 6. 적응형 폴백 제목 (개선된 폴백 로직)
        this.generateAdaptiveFallbackTitles(titles, tags, subject, analysis);

        // 품질 기반 필터링 및 순위 결정
        const rankedTitles = this.rankTagBasedTitles(titles, tags, subject, analysis);

        this.logger.logStep('태그 기반 제목 생성 완료', { 
            total: titles.length,
            ranked: rankedTitles.length 
        });

        return rankedTitles.slice(0, 8); // 최대 8개
    }

    /**
     * 스마트 태그 기반 확장 제목 생성
     */
    generateSmartTagBasedTitles(titles, tags, analysis) {
        if (tags.length === 0) return;

        const mainTag = tags[0];
        const sentiment = analysis?.sentiment?.overall || 'neutral';
        const hasStatistics = analysis?.statistics?.length > 0;

        // 기본 태그 확장 제목
        const baseTitles = [
            { template: `${mainTag} 시장 동향과 미래 전망: 전문가 분석`, weight: 0.8, type: 'tag_basic' },
            { template: `${mainTag} 기술 혁신이 가져올 산업 변화`, weight: 0.75, type: 'tag_basic' },
            { template: `${mainTag} 분야 최신 트렌드와 투자 기회`, weight: 0.7, type: 'tag_basic' }
        ];

        // 감정에 따른 태그 제목 조정
        if (sentiment === 'positive') {
            baseTitles.push(
                { template: `${mainTag} 생태계 확장, 새로운 성장 동력`, weight: 0.85, type: 'tag_positive' },
                { template: `${mainTag} 시장 호황, 기회와 전망 분석`, weight: 0.8, type: 'tag_positive' }
            );
        } else if (sentiment === 'negative') {
            baseTitles.push(
                { template: `${mainTag} 시장 도전과 극복 방안`, weight: 0.7, type: 'tag_negative' },
                { template: `${mainTag} 분야 위기 속 새로운 돌파구`, weight: 0.65, type: 'tag_negative' }
            );
        }

        // 통계와 결합된 태그 제목
        if (hasStatistics) {
            const stat = analysis.statistics[0];
            baseTitles.push({
                template: `${mainTag} 시장 ${stat.value} 변화, 업계 분석`,
                weight: 0.9,
                type: 'tag_statistical'
            });
        }

        baseTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('스마트 태그 기반 제목 추가', { title: titleObj.template });
            }
        });

        // 다중 태그 조합 (개선된 로직)
        if (tags.length > 1) {
            this.generateMultiTagCombinations(titles, tags, analysis);
        }
    }

    /**
     * 다중 태그 조합 생성
     */
    generateMultiTagCombinations(titles, tags, analysis) {
        const mainTag = tags[0];
        const secondTag = tags[1];
        const thirdTag = tags.length > 2 ? tags[2] : null;

        // 2개 태그 조합
        const twoTagCombinations = [
            { template: `${mainTag}와 ${secondTag}의 융합, 새로운 시너지 창출`, weight: 0.85, type: 'tag_combination' },
            { template: `${mainTag} 기반 ${secondTag} 혁신, 업계 주목`, weight: 0.8, type: 'tag_combination' },
            { template: `${mainTag}와 ${secondTag} 연계 전략의 성공 가능성`, weight: 0.75, type: 'tag_combination' }
        ];

        // 3개 태그 조합 (있는 경우)
        if (thirdTag) {
            twoTagCombinations.push({
                template: `${mainTag}, ${secondTag}, ${thirdTag} 통합 생태계`,
                weight: 0.9,
                type: 'tag_combination'
            });
        }

        // 감정에 따른 조합 제목 조정
        if (analysis?.sentiment?.overall === 'positive') {
            twoTagCombinations.push({
                template: `${mainTag}와 ${secondTag} 상승 시너지, 시장 기대감 증폭`,
                weight: 0.85,
                type: 'tag_combination'
            });
        }

        twoTagCombinations.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('다중 태그 조합 제목 추가', { title: titleObj.template });
            }
        });
    }

    /**
     * 인텔리전트 주제 기반 제목 생성
     */
    generateIntelligentSubjectTitles(titles, subject, analysis) {
        if (!subject) return;

        const subjectWords = subject.split(' ').filter(word => word.length > 2);
        if (subjectWords.length === 0) return;

        const keyPhrase = subjectWords.slice(0, 3).join(' ');
        const sentiment = analysis?.sentiment?.overall || 'neutral';
        const hasEntities = analysis?.entities?.length > 0;

        // 기본 주제 기반 제목
        const subjectTitles = [
            { template: `${keyPhrase}에 대한 심층 분석과 시사점`, weight: 0.8, type: 'subject_basic' },
            { template: `${keyPhrase} 현황과 향후 발전 방향`, weight: 0.75, type: 'subject_basic' },
            { template: `${keyPhrase}이 업계에 미치는 영향 분석`, weight: 0.7, type: 'subject_basic' }
        ];

        // 감정에 따른 주제 제목 조정
        if (sentiment === 'positive') {
            subjectTitles.push({
                template: `${keyPhrase}의 긍정적 전망과 기회 요소`,
                weight: 0.85,
                type: 'subject_positive'
            });
        } else if (sentiment === 'negative') {
            subjectTitles.push({
                template: `${keyPhrase}의 도전과 해결 방안 모색`,
                weight: 0.7,
                type: 'subject_negative'
            });
        }

        // 개체명과 결합된 주제 제목
        if (hasEntities) {
            const entity = analysis.entities[0].text;
            subjectTitles.push({
                template: `${entity}가 바라본 ${keyPhrase}의 미래`,
                weight: 0.8,
                type: 'subject_entity'
            });
        }

        subjectTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('인텔리전트 주제 기반 제목 추가', { title: titleObj.template });
            }
        });
    }

    /**
     * 고급 태그-주제 조합 제목 생성
     */
    generateAdvancedTagSubjectCombination(titles, tags, subject, analysis) {
        if (tags.length === 0 || !subject) return;

        const mainTag = tags[0];
        const subjectKey = subject.split(' ').slice(0, 2).join(' ');
        const sentiment = analysis?.sentiment?.overall || 'neutral';
        const hasStatistics = analysis?.statistics?.length > 0;

        // 기본 태그-주제 조합
        const combinedTitles = [
            { template: `${mainTag} 중심의 ${subjectKey} 변화, 업계 전망`, weight: 0.85, type: 'tag_subject' },
            { template: `${subjectKey}에서 ${mainTag}의 역할과 중요성`, weight: 0.8, type: 'tag_subject' },
            { template: `${mainTag} 기술로 본 ${subjectKey}의 미래`, weight: 0.75, type: 'tag_subject' }
        ];

        // 감정 기반 조합 제목
        if (sentiment === 'positive') {
            combinedTitles.push({
                template: `${mainTag}가 이끄는 ${subjectKey} 성장 스토리`,
                weight: 0.9,
                type: 'tag_subject'
            });
        } else if (sentiment === 'negative') {
            combinedTitles.push({
                template: `${subjectKey} 위기 속 ${mainTag}의 해결책`,
                weight: 0.75,
                type: 'tag_subject'
            });
        }

        // 통계와 결합된 태그-주제 제목
        if (hasStatistics) {
            const stat = analysis.statistics[0];
            combinedTitles.push({
                template: `${mainTag} 기반 ${subjectKey} ${stat.value} 혁신`,
                weight: 0.95,
                type: 'tag_subject'
            });
        }

        combinedTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('고급 태그-주제 조합 제목 추가', { title: titleObj.template });
            }
        });
    }

    /**
     * 컨텍스트 인식 태그 제목 생성 (새로운 기능)
     */
    generateContextAwareTagTitles(titles, tags, analysis) {
        if (tags.length === 0 || !analysis) return;

        const mainTag = tags[0];
        const context = this.analyzeTagContext(mainTag, analysis);

        const contextTitles = [];

        // 기술 컨텍스트
        if (context.type === 'technology') {
            contextTitles.push(
                { template: `${mainTag} 기술 생태계 진화와 혁신 동력`, weight: 0.85, type: 'context_tech' },
                { template: `${mainTag} 플랫폼 경쟁, 차세대 표준은`, weight: 0.8, type: 'context_tech' }
            );
        }

        // 비즈니스 컨텍스트
        if (context.type === 'business') {
            contextTitles.push(
                { template: `${mainTag} 비즈니스 모델 혁신과 수익 창출`, weight: 0.8, type: 'context_business' },
                { template: `${mainTag} 시장 경쟁력 강화 전략`, weight: 0.75, type: 'context_business' }
            );
        }

        // 사회적 컨텍스트
        if (context.type === 'social') {
            contextTitles.push(
                { template: `${mainTag}이 바꾸는 사회와 일상의 변화`, weight: 0.8, type: 'context_social' },
                { template: `${mainTag} 사회적 영향과 윤리적 고려사항`, weight: 0.75, type: 'context_social' }
            );
        }

        contextTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('컨텍스트 인식 태그 제목 추가', { title: titleObj.template });
            }
        });
    }

    /**
     * 태그 컨텍스트 분석
     */
    analyzeTagContext(tag, analysis) {
        const tagLower = tag.toLowerCase();
        
        // 기술 관련 키워드
        if (tagLower.includes('ai') || tagLower.includes('인공지능') || 
            tagLower.includes('기술') || tagLower.includes('플랫폼') ||
            tagLower.includes('디지털') || tagLower.includes('소프트웨어')) {
            return { type: 'technology', confidence: 0.8 };
        }
        
        // 비즈니스 관련 키워드
        if (tagLower.includes('시장') || tagLower.includes('투자') || 
            tagLower.includes('비즈니스') || tagLower.includes('경영') ||
            tagLower.includes('스타트업') || tagLower.includes('기업')) {
            return { type: 'business', confidence: 0.8 };
        }
        
        // 사회 관련 키워드
        if (tagLower.includes('사회') || tagLower.includes('교육') || 
            tagLower.includes('문화') || tagLower.includes('환경')) {
            return { type: 'social', confidence: 0.8 };
        }
        
        return { type: 'general', confidence: 0.5 };
    }

    /**
     * 의미론적 태그 확장 제목 생성 (새로운 기능)
     */
    generateSemanticTagExpansion(titles, tags, analysis) {
        if (tags.length === 0) return;

        const mainTag = tags[0];
        const semanticExpansions = this.getSemanticExpansions(mainTag);

        semanticExpansions.forEach(expansion => {
            const expandedTitles = [
                { template: `${mainTag}에서 ${expansion}으로, 패러다임 전환`, weight: 0.8, type: 'semantic' },
                { template: `${expansion} 관점에서 본 ${mainTag}의 가능성`, weight: 0.75, type: 'semantic' }
            ];

            expandedTitles.forEach(titleObj => {
                if (this.isValidTitleLength(titleObj.template)) {
                    titles.push(titleObj);
                    this.logger.logStep('의미론적 태그 확장 제목 추가', { title: titleObj.template });
                }
            });
        });
    }

    /**
     * 의미론적 확장 키워드 생성
     */
    getSemanticExpansions(tag) {
        const tagLower = tag.toLowerCase();
        const expansions = [];

        if (tagLower.includes('ai') || tagLower.includes('인공지능')) {
            expansions.push('지능형 자동화', '인간-AI 협업');
        } else if (tagLower.includes('블록체인')) {
            expansions.push('탈중앙화', '디지털 신뢰');
        } else if (tagLower.includes('클라우드')) {
            expansions.push('하이브리드 컴퓨팅', '엣지 컴퓨팅');
        } else {
            expansions.push('디지털 혁신', '스마트 솔루션');
        }

        return expansions.slice(0, 2); // 최대 2개
    }

    /**
     * 적응형 폴백 제목 생성 (개선된 폴백 로직)
     */
    generateAdaptiveFallbackTitles(titles, tags, subject, analysis) {
        // 기존 제목이 충분하면 폴백 제목 생성하지 않음
        if (titles.length >= 5) return;

        const fallbackTitles = [];
        const mainKeyword = tags.length > 0 ? tags[0] : 
                           (analysis?.keyPhrases?.length > 0 ? analysis.keyPhrases[0].phrase : 'AI');

        // 컨텍스트 기반 적응형 폴백
        if (analysis?.sentiment?.overall === 'positive') {
            fallbackTitles.push(
                { template: `${mainKeyword} 분야 성장 동력과 미래 기회`, weight: 0.7, type: 'fallback' },
                { template: `${mainKeyword} 시장 확대, 새로운 가능성 탐색`, weight: 0.65, type: 'fallback' }
            );
        } else if (analysis?.sentiment?.overall === 'negative') {
            fallbackTitles.push(
                { template: `${mainKeyword} 분야 도전과 혁신 방안`, weight: 0.65, type: 'fallback' },
                { template: `${mainKeyword} 시장 변화, 대응 전략 모색`, weight: 0.6, type: 'fallback' }
            );
        } else {
            fallbackTitles.push(
                { template: `${mainKeyword} 기술 발전과 산업 전반 영향 분석`, weight: 0.7, type: 'fallback' },
                { template: `${mainKeyword} 시장 동향과 전문가 의견`, weight: 0.65, type: 'fallback' },
                { template: `디지털 혁신 시대, ${mainKeyword}의 역할과 전망`, weight: 0.6, type: 'fallback' }
            );
        }

        fallbackTitles.forEach(titleObj => {
            if (this.isValidTitleLength(titleObj.template)) {
                titles.push(titleObj);
                this.logger.logStep('적응형 폴백 제목 추가', { title: titleObj.template });
            }
        });
    }

    /**
     * 태그 기반 제목 순위 결정
     */
    rankTagBasedTitles(titles, tags, subject, analysis) {
        return titles
            .map(titleObj => ({
                ...titleObj,
                finalScore: this.calculateTagTitleScore(titleObj, tags, subject, analysis)
            }))
            .sort((a, b) => b.finalScore - a.finalScore)
            .map(titleObj => titleObj.template || titleObj.title);
    }

    /**
     * 태그 기반 제목 점수 계산
     */
    calculateTagTitleScore(titleObj, tags, subject, analysis) {
        let score = titleObj.weight || 0.5;

        // 타입별 가중치
        const typeWeights = {
            'tag_statistical': 0.2,
            'tag_combination': 0.15,
            'tag_subject': 0.15,
            'context_tech': 0.1,
            'context_business': 0.1,
            'semantic': 0.1,
            'tag_positive': 0.05,
            'tag_basic': 0.05,
            'fallback': -0.1
        };

        score += typeWeights[titleObj.type] || 0;

        // 태그 매칭 보너스
        const titleText = titleObj.template || titleObj.title;
        const titleLower = titleText.toLowerCase();
        const tagMatches = tags.filter(tag => 
            titleLower.includes(tag.toLowerCase())
        ).length;
        score += tagMatches * 0.1;

        // 주제 매칭 보너스
        if (subject) {
            const subjectWords = subject.toLowerCase().split(' ');
            const subjectMatches = subjectWords.filter(word => 
                word.length > 2 && titleLower.includes(word)
            ).length;
            score += subjectMatches * 0.05;
        }

        // 키워드 매칭 보너스
        if (analysis?.keyPhrases) {
            const keywordMatches = analysis.keyPhrases.filter(kp => 
                titleLower.includes(kp.phrase.toLowerCase())
            ).length;
            score += keywordMatches * 0.05;
        }

        return Math.min(1.0, score);
    }

    /**
     * 제목 후보들을 처리하고 순위를 매김
     * @param {Array} candidates 제목 후보 배열
     * @returns {Array} 처리된 제목 후보 배열
     */
    processAndRankCandidates(candidates) {
        this.logger.logStep('제목 후보 처리 시작', { count: candidates.length });

        // 1. 중복 제거
        const uniqueCandidates = this.removeDuplicates(candidates);
        this.logger.logStep('중복 제거 완료', {
            original: candidates.length,
            unique: uniqueCandidates.length
        });

        // 2. 기본 필터링
        const filteredCandidates = this.applyBasicFilters(uniqueCandidates);
        this.logger.logStep('기본 필터링 완료', {
            filtered: filteredCandidates.length
        });

        // 3. 점수 계산
        const scoredCandidates = this.calculateScores(filteredCandidates);
        this.logger.logStep('점수 계산 완료', {
            scored: scoredCandidates.length
        });

        // 4. 순위 정렬
        const rankedCandidates = scoredCandidates.sort((a, b) => b.score - a.score);
        this.logger.logStep('순위 정렬 완료', {
            topScore: rankedCandidates[0]?.score || 0
        });

        return rankedCandidates.slice(0, 6); // 상위 6개만 반환
    }

    /**
     * 중복 제목 제거
     * @param {Array} candidates 제목 후보 배열
     * @returns {Array} 중복 제거된 배열
     */
    removeDuplicates(candidates) {
        const seen = new Set();
        return candidates.filter(candidate => {
            const key = candidate.title.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * 기본 필터 적용
     * @param {Array} candidates 제목 후보 배열
     * @returns {Array} 필터링된 배열
     */
    applyBasicFilters(candidates) {
        return candidates.filter(candidate => {
            const title = candidate.title;

            // 길이 체크
            const chars = [...title].length;
            if (chars < this.mergedFilters.titleLen.min || chars > this.mergedFilters.titleLen.max) {
                this.logger.logStep('길이 필터 제외', { title, chars });
                return false;
            }

            // 금지 키워드 체크
            const titleLower = title.toLowerCase();
            for (const banned of this.mergedFilters.mustExclude) {
                if (titleLower.includes(banned.toLowerCase())) {
                    this.logger.logStep('금지 키워드 필터 제외', { title, banned });
                    return false;
                }
            }

            // 필수 키워드 체크
            if (this.mergedFilters.mustInclude.length > 0) {
                const hasRequired = this.mergedFilters.mustInclude.some(required =>
                    titleLower.includes(required.toLowerCase())
                );
                if (!hasRequired) {
                    this.logger.logStep('필수 키워드 필터 제외', { title });
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * 제목 후보들의 점수 계산
     * @param {Array} candidates 제목 후보 배열
     * @returns {Array} 점수가 추가된 배열
     */
    calculateScores(candidates) {
        return candidates.map(candidate => {
            let score = 0.5; // 기본 점수

            // 소스별 가중치
            const sourceWeights = {
                'ai_generation': 0.4,
                'content_analysis': 0.3,
                'heuristic': 0.2,
                'tag_based': 0.1
            };
            score += sourceWeights[candidate.source] || 0.1;

            // 키워드 포함 보너스
            const analysis = this.analyzer.analysis;
            if (analysis && analysis.keyPhrases.length > 0) {
                const titleLower = candidate.title.toLowerCase();
                const keywordBonus = analysis.keyPhrases
                    .filter(kp => titleLower.includes(kp.phrase.toLowerCase()))
                    .reduce((sum, kp) => sum + (kp.importance * 0.1), 0);
                score += keywordBonus;
            }

            // 길이 점수 (최적 길이에 가까울수록 높은 점수)
            const chars = [...candidate.title].length;
            const optimalLength = (this.mergedFilters.titleLen.min + this.mergedFilters.titleLen.max) / 2;
            const lengthScore = 1 - Math.abs(chars - optimalLength) / optimalLength;
            score += lengthScore * 0.1;

            return {
                ...candidate,
                score: Math.min(1.0, score), // 최대 1.0
                chars: chars
            };
        });
    }

    // === 유틸리티 메서드들 ===

    /**
     * 제목 길이가 유효한지 확인
     * @param {string} title 제목
     * @returns {boolean} 유효 여부
     */
    isValidTitleLength(title) {
        if (!title) return false;
        const chars = [...title].length;
        return chars >= this.mergedFilters.titleLen.min && chars <= this.mergedFilters.titleLen.max;
    }

    /**
     * 일반적인 헤딩인지 확인 (개요, 결론 등)
     * @param {string} heading 헤딩 텍스트
     * @returns {boolean} 일반적인 헤딩 여부
     */
    isGenericHeading(heading) {
        const genericTerms = ['개요', '서론', '결론', '요약', '마무리', '끝으로', '참고'];
        const headingLower = heading.toLowerCase();
        return genericTerms.some(term => headingLower.includes(term));
    }

    /**
     * 문장을 제목용으로 정리
     * @param {string} sentence 원본 문장
     * @returns {string} 정리된 제목
     */
    cleanSentenceForTitle(sentence) {
        if (!sentence) return '';

        // 문장 부호 제거 및 정리
        let cleaned = sentence
            .replace(/[.!?]+$/, '') // 끝의 문장부호 제거
            .replace(/\s+/g, ' ') // 연속 공백 정리
            .trim();

        // 너무 긴 경우 적절히 자르기
        if ([...cleaned].length > this.mergedFilters.titleLen.max) {
            cleaned = [...cleaned].slice(0, this.mergedFilters.titleLen.max - 3).join('') + '...';
        }

        return cleaned;
    }

    /**
     * 통계 데이터를 포함한 제목 생성
     * @param {Object} stat 통계 정보
     * @param {Array} keyPhrases 키워드 목록
     * @returns {string} 통계 기반 제목
     */
    createStatisticalTitle(stat, keyPhrases) {
        if (!stat || !keyPhrases.length) return '';

        const mainKeyword = keyPhrases[0].phrase;
        const templates = [
            `${mainKeyword} ${stat.value} 성장`,
            `${stat.value} 증가한 ${mainKeyword} 시장`,
            `${mainKeyword}, ${stat.value} 기록`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * 긍정적 트렌드 제목 생성
     * @param {Array} keywords 키워드 목록
     * @returns {string} 긍정적 트렌드 제목
     */
    createPositiveTrendTitle(keywords) {
        if (!keywords.length) return '';

        const mainKeyword = keywords[0].phrase;
        const templates = [
            `${mainKeyword} 성장세 지속`,
            `${mainKeyword} 시장 확대`,
            `${mainKeyword} 혁신 가속화`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * 개체명 기반 제목 생성
     * @param {Array} entities 개체명 목록
     * @param {Array} keywords 키워드 목록
     * @returns {string} 개체명 기반 제목
     */
    createEntityBasedTitle(entities, keywords) {
        if (!entities.length) return '';

        const mainEntity = entities[0].text;
        const mainKeyword = keywords.length > 0 ? keywords[0].phrase : '기술';

        const templates = [
            `${mainEntity}의 ${mainKeyword} 전략`,
            `${mainEntity}, ${mainKeyword} 분야 진출`,
            `${mainEntity}와 ${mainKeyword}의 미래`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }
}

export { TitleGenerator, TitleGenerationLogger };