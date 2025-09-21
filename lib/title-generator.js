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
                totalCandidates: processedCandidates.length,
                bestTitle: results.bestTitle,
                sources: results.sources,
                cached: true
            });

        } catch (error) {
            this.logger.logError('제목 생성 파이프라인', error);

            // 오류 발생 시 기본 제목 제공
            results.bestTitle = '기사 제목';
            results.candidates = [{ title: '기사 제목', source: 'fallback', score: 0.1 }];
        }

        // 로그 요약 추가
        results.logs = this.logger.getSummary();

        return results;
    }

    /**
     * AI 제목 생성 (외부 주입된 제목 사용 또는 직접 생성)
     * @returns {Promise<Array>} AI 생성 제목 배열
     */
    async generateAITitles() {
        this.logger.logStep('AI 제목 생성 시도', {});

        // 외부에서 주입된 AI 제목이 있으면 사용
        if (this.externalAITitles.length > 0) {
            this.logger.logStep('외부 AI 제목 사용', { count: this.externalAITitles.length });
            return this.externalAITitles;
        }

        // TODO: 실제 AI API 연동 구현
        // 현재는 빈 배열 반환 (AI 생성 실패 시뮬레이션)
        this.logger.logWarning('AI 제목 생성', '외부 AI 제목 없음, 직접 생성 미구현');
        return [];
    }

    /**
     * 콘텐츠 분석 결과를 기반으로 제목 생성
     * @returns {Array} 콘텐츠 기반 제목 배열
     */
    generateContentBasedTitles() {
        const titles = [];
        const analysis = this.analyzer.analysis;

        if (!analysis) {
            this.logger.logWarning('콘텐츠 기반 제목 생성', '분석 결과가 없음');
            return titles;
        }

        // 1. H1 헤딩에서 제목 추출 (길이 조정 포함)
        const h1Headings = analysis.headings.filter(h => h.level === 1);
        h1Headings.forEach(heading => {
            let title = heading.text;

            // 길이가 너무 짧으면 확장
            if ([...title].length < this.mergedFilters.titleLen.min) {
                const topKeyword = analysis.keyPhrases[0]?.phrase || '';
                if (topKeyword && !title.includes(topKeyword)) {
                    title = `${title}: ${topKeyword} 분석`;
                }
            }

            // 길이가 너무 길면 축약
            if ([...title].length > this.mergedFilters.titleLen.max) {
                title = [...title].slice(0, this.mergedFilters.titleLen.max - 3).join('') + '...';
            }

            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('H1 헤딩 제목 추가', { title: title });
            }
        });

        // 2. H2 헤딩을 확장하여 제목 생성
        const h2Headings = analysis.headings.filter(h => h.level === 2);
        h2Headings.forEach(heading => {
            if (!this.isGenericHeading(heading.text)) {
                const topKeyword = analysis.keyPhrases[0]?.phrase || '';
                let expandedTitle = heading.text;

                // H2가 너무 짧으면 확장
                if ([...expandedTitle].length < this.mergedFilters.titleLen.min) {
                    if (topKeyword) {
                        expandedTitle = `${topKeyword} ${heading.text}: 상세 분석`;
                    } else {
                        expandedTitle = `${heading.text}에 대한 심층 분석과 전망`;
                    }
                }

                if (this.isValidTitleLength(expandedTitle)) {
                    titles.push(expandedTitle);
                    this.logger.logStep('H2 헤딩 확장 제목 추가', { title: expandedTitle });
                }
            }
        });

        // 3. 첫 문단을 기반으로 한 제목 생성
        if (analysis.firstParagraph.text) {
            const firstSentence = analysis.firstParagraph.sentences[0];
            if (firstSentence) {
                let title = this.cleanSentenceForTitle(firstSentence);

                // 길이 조정: 너무 짧으면 키워드 추가, 너무 길면 축약
                if ([...title].length < this.mergedFilters.titleLen.min) {
                    const topKeyword = analysis.keyPhrases[0]?.phrase || '';
                    if (topKeyword && !title.includes(topKeyword)) {
                        title = `${topKeyword}: ${title}`;
                    }
                } else if ([...title].length > this.mergedFilters.titleLen.max) {
                    // 제목이 너무 길면 핵심 부분만 추출
                    const words = title.split(' ');
                    let shortened = '';
                    for (const word of words) {
                        if ([...shortened + ' ' + word].length <= this.mergedFilters.titleLen.max - 3) {
                            shortened += (shortened ? ' ' : '') + word;
                        } else {
                            break;
                        }
                    }
                    title = shortened + (shortened !== title ? '...' : '');
                }

                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('첫 문단 기반 제목 추가', { title: title });
                }
            }
        }

        // 4. 첫 문단에서 더 짧은 제목 생성 시도
        if (analysis.firstParagraph.sentences.length > 0) {
            const sentence = analysis.firstParagraph.sentences[0];
            const words = sentence.split(' ');
            
            // 핵심 키워드를 포함한 짧은 제목 생성
            if (words.length > 5) {
                const topKeyword = analysis.keyPhrases[0]?.phrase || '';
                let shortTitle = '';
                
                if (topKeyword) {
                    // 키워드 + 핵심 동작/상태
                    const actionWords = words.filter(word => 
                        word.includes('발전') || word.includes('변화') || 
                        word.includes('증가') || word.includes('성장') ||
                        word.includes('확대') || word.includes('혁신')
                    );
                    
                    if (actionWords.length > 0) {
                        shortTitle = `${topKeyword} ${actionWords[0]}, 새로운 전환점`;
                    } else {
                        shortTitle = `${topKeyword} 시장 동향과 전망 분석`;
                    }
                    
                    if (this.isValidTitleLength(shortTitle)) {
                        titles.push(shortTitle);
                        this.logger.logStep('짧은 제목 생성 추가', { title: shortTitle });
                    }
                }
            }
        }

        // 4. 통계 데이터를 포함한 제목 생성
        if (analysis.statistics.length > 0 && analysis.keyPhrases.length > 0) {
            const topStats = analysis.statistics.slice(0, 2);
            const topKeyword = analysis.keyPhrases[0].phrase;

            topStats.forEach(stat => {
                let statTitle = '';

                if (stat.type === 'percentage') {
                    statTitle = `${topKeyword} 시장 ${stat.value} 성장, 새로운 전환점 맞나`;
                } else if (stat.type === 'number') {
                    statTitle = `${topKeyword} 분야 ${stat.value} 규모 달성, 업계 주목`;
                } else if (stat.type === 'multiple') {
                    statTitle = `${topKeyword} 성능 ${stat.value} 향상, 경쟁력 강화 기대`;
                }

                if (statTitle && this.isValidTitleLength(statTitle)) {
                    titles.push(statTitle);
                    this.logger.logStep('통계 기반 제목 추가', { title: statTitle });
                }
            });
        }

        // 5. 키워드 조합 제목 생성
        if (analysis.keyPhrases.length >= 2) {
            const keyword1 = analysis.keyPhrases[0].phrase;
            const keyword2 = analysis.keyPhrases[1].phrase;

            const combinedTitles = [
                `${keyword1}와 ${keyword2}의 융합, 새로운 시장 기회 창출`,
                `${keyword1} 기반 ${keyword2} 혁신, 업계 판도 변화 예고`,
                `${keyword1} 시장에서 ${keyword2}의 역할, 전문가 분석`
            ];

            combinedTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('키워드 조합 제목 추가', { title: title });
                }
            });
        }

        // 중복 제거
        const uniqueTitles = [...new Set(titles)];

        this.logger.logStep('콘텐츠 기반 제목 생성 완료', {
            total: titles.length,
            unique: uniqueTitles.length
        });

        return uniqueTitles.slice(0, 6); // 최대 6개
    }

    /**
     * 휴리스틱 방법으로 제목 생성
     * @returns {Array} 휴리스틱 제목 배열
     */
    generateHeuristicTitles() {
        const titles = [];
        const analysis = this.analyzer.analysis;

        if (!analysis) {
            this.logger.logWarning('휴리스틱 제목 생성', '분석 결과가 없음');
            return titles;
        }

        const topKeywords = analysis.keyPhrases.slice(0, 3);
        const mainKeyword = topKeywords[0]?.phrase || 'AI';

        // 1. 트렌드 분석형 제목
        const trendTitles = [
            `${mainKeyword} 시장 동향 분석: 성장 요인과 전망`,
            `${mainKeyword} 산업 혁신, 새로운 패러다임의 시작`,
            `${mainKeyword} 기술 발전이 가져올 변화와 기회`
        ];

        trendTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('트렌드 분석형 제목 추가', { title: title });
            }
        });

        // 2. 통계 활용형 제목 (통계가 있는 경우)
        if (analysis.statistics.length > 0) {
            const stat = analysis.statistics[0];
            const statTitles = [
                `${mainKeyword} 시장 ${stat.value} 급성장, 업계 전망은?`,
                `${stat.value} 기록한 ${mainKeyword}, 지속 가능한 성장 가능할까`,
                `${mainKeyword} 분야 ${stat.value} 달성, 전문가들이 보는 의미`
            ];

            statTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('통계 활용형 제목 추가', { title: title });
                }
            });
        }

        // 3. 기업/개체명 기반 제목
        const topEntities = analysis.entities.slice(0, 2);
        if (topEntities.length > 0) {
            const entity = topEntities[0].text;
            const entityTitles = [
                `${entity}의 ${mainKeyword} 전략, 시장 판도 바꿀까`,
                `${entity} 중심으로 재편되는 ${mainKeyword} 생태계`,
                `${entity}가 이끄는 ${mainKeyword} 혁신, 경쟁사 대응은?`
            ];

            entityTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('개체명 기반 제목 추가', { title: title });
                }
            });
        }

        // 4. 감정 기반 제목
        if (analysis.sentiment.overall === 'positive') {
            const positiveTitles = [
                `${mainKeyword} 시장 호조세 지속, 투자자들 주목`,
                `${mainKeyword} 분야 성장 가속화, 새로운 기회 창출`,
                `${mainKeyword} 기술 발전으로 업계 전반 활기`
            ];

            positiveTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('긍정적 감정 기반 제목 추가', { title: title });
                }
            });
        }

        // 5. 질문형 제목
        const questionTitles = [
            `${mainKeyword} 시장, 다음 성장 동력은 무엇일까?`,
            `${mainKeyword} 기술 발전, 우리 생활 어떻게 바뀔까?`,
            `${mainKeyword} 투자 열풍, 지속 가능한 성장일까?`
        ];

        questionTitles.forEach(title => {
            if (this.isValidTitleLength(title)) {
                titles.push(title);
                this.logger.logStep('질문형 제목 추가', { title: title });
            }
        });

        this.logger.logStep('휴리스틱 제목 생성 완료', { count: titles.length });
        return titles.slice(0, 8); // 최대 8개
    }

    /**
     * 태그와 주제를 조합한 제목 생성
     * @returns {Array} 태그 기반 제목 배열
     */
    generateTagBasedTitles() {
        const titles = [];
        const tags = this.analyzer.tags;
        const subject = this.analyzer.subject;

        // 1. 주요 태그 기반 확장 제목
        if (tags.length > 0) {
            const mainTag = tags[0];

            const tagBasedTitles = [
                `${mainTag} 시장 동향과 미래 전망: 전문가 분석`,
                `${mainTag} 기술 혁신이 가져올 산업 변화`,
                `${mainTag} 분야 최신 트렌드와 투자 기회`,
                `${mainTag} 생태계 확장, 새로운 비즈니스 모델 등장`
            ];

            tagBasedTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('태그 기반 확장 제목 추가', { title: title });
                }
            });

            // 태그 조합 제목
            if (tags.length > 1) {
                const combinedTitles = [
                    `${mainTag}와 ${tags[1]}의 융합, 새로운 시너지 창출`,
                    `${mainTag} 기반 ${tags[1]} 혁신, 업계 주목`,
                    `${mainTag}와 ${tags[1]} 연계 전략, 성공 가능성은?`
                ];

                combinedTitles.forEach(title => {
                    if (this.isValidTitleLength(title)) {
                        titles.push(title);
                        this.logger.logStep('태그 조합 제목 추가', { title: title });
                    }
                });
            }

            this.logger.logStep('태그 기반 제목 생성', { mainTag, count: titles.length });
        }

        // 2. 주제 기반 확장 제목
        if (subject) {
            const subjectWords = subject.split(' ').filter(word => word.length > 2);
            if (subjectWords.length > 0) {
                const keyPhrase = subjectWords.slice(0, 3).join(' ');
                const subjectTitles = [
                    `${keyPhrase}에 대한 심층 분석과 시사점`,
                    `${keyPhrase} 현황과 향후 발전 방향`,
                    `${keyPhrase}이 업계에 미치는 영향 분석`
                ];

                subjectTitles.forEach(title => {
                    if (this.isValidTitleLength(title)) {
                        titles.push(title);
                        this.logger.logStep('주제 기반 확장 제목 추가', { title: title });
                    }
                });
            }
        }

        // 3. 태그 + 주제 조합 확장
        if (tags.length > 0 && subject) {
            const mainTag = tags[0];
            const subjectKey = subject.split(' ').slice(0, 2).join(' ');

            const combinedTitles = [
                `${mainTag} 중심의 ${subjectKey} 변화, 업계 전망`,
                `${subjectKey}에서 ${mainTag}의 역할과 중요성`,
                `${mainTag} 기술로 본 ${subjectKey}의 미래`
            ];

            combinedTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                    this.logger.logStep('태그+주제 조합 확장 제목 추가', { title: title });
                }
            });
        }

        // 4. 기본 폴백 제목들 (길이 조건 만족)
        if (titles.length === 0) {
            const fallbackTitles = [
                'AI 기술 발전과 산업 전반에 미치는 영향 분석',
                '최신 기술 동향과 시장 변화, 전문가 의견',
                '디지털 혁신 시대, 새로운 비즈니스 기회 탐색'
            ];

            fallbackTitles.forEach(title => {
                if (this.isValidTitleLength(title)) {
                    titles.push(title);
                }
            });

            this.logger.logStep('기본 폴백 제목 추가', { count: fallbackTitles.length });
        }

        this.logger.logStep('태그 기반 제목 생성 완료', { count: titles.length });
        return titles;
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