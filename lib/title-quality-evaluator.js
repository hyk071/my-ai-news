/**
 * TitleQualityEvaluator - 제목 품질 평가 및 필터링 클래스
 * 관련성, 길이, 가독성, SEO, 참여도, 준수성 점수를 계산하여 제목 품질을 평가
 */

import { getCacheManager } from './cache-manager.js';
import { getMemoryOptimizer } from './memory-optimizer.js';

class TitleQualityEvaluator {
    constructor(contentAnalyzer, filters = {}, guidelines = {}) {
        this.analyzer = contentAnalyzer;
        this.filters = filters;
        this.guidelines = guidelines;
        this.cacheManager = getCacheManager();
        this.memoryOptimizer = getMemoryOptimizer();

        // 기본 필터 설정
        this.defaultFilters = {
            titleLen: { min: 10, max: 100 },
            mustInclude: [],
            mustExclude: ['충격', '소름', '대박', '미쳤다', '헉', '레전드'],
            phraseInclude: [],
            phraseExclude: [],
            minRelevanceScore: 0.3,
            minLengthScore: 0.4,
            minReadabilityScore: 0.3,
            minSEOScore: 0.2,
            minEngagementScore: 0.2,
            minComplianceScore: 0.5,
            minOverallScore: 0.4
        };

        // 필터 병합
        this.mergedFilters = { ...this.defaultFilters, ...filters };

        // 기본 가이드라인 설정
        this.defaultGuidelines = {
            preferredStyle: 'professional', // professional, casual, engaging
            targetAudience: 'general', // general, technical, business
            seoOptimization: true,
            clickbaitAvoidance: true,
            brandTone: 'neutral' // positive, neutral, authoritative
        };

        // 가이드라인 병합
        this.mergedGuidelines = { ...this.defaultGuidelines, ...guidelines };

        console.log('TitleQualityEvaluator 초기화:', {
            hasAnalyzer: !!contentAnalyzer,
            filters: Object.keys(this.mergedFilters).length,
            guidelines: Object.keys(this.mergedGuidelines).length
        });
    }

    /**
     * 제목 품질 평가 메인 메서드
     * @param {string} title 평가할 제목
     * @returns {Object} 평가 결과 객체
     */
    evaluateTitle(title) {
        console.log('제목 품질 평가 시작:', { title });

        const startTime = Date.now();
        
        // 캐시에서 평가 결과 조회 시도
        const cacheKey = this.generateEvaluationCacheKey(title);
        const cachedResult = this.cacheManager.getCachedTitleEvaluation(cacheKey);

        if (cachedResult) {
            console.log('캐시된 평가 결과 사용:', { title, cached: true });
            return cachedResult;
        }

        // 새로운 평가 수행
        const evaluation = this.performTitleEvaluation(title);
        
        // 평가 시간 기록
        evaluation.evaluationTime = Date.now() - startTime;

        // 메모리 최적화 적용
        const optimizedEvaluation = this.memoryOptimizer.optimizeEvaluationResult(evaluation);

        // 결과를 캐시에 저장
        this.cacheManager.cacheTitleEvaluation(cacheKey, optimizedEvaluation);

        console.log('제목 품질 평가 완료:', {
            title,
            overallScore: optimizedEvaluation.overallScore,
            evaluationTime: `${evaluation.evaluationTime}ms`,
            cached: false
        });

        return optimizedEvaluation;
    }

    /**
     * 실제 제목 평가 수행
     * @param {string} title 평가할 제목
     * @returns {Object} 평가 결과
     */
    performTitleEvaluation(title) {
        const evaluation = {
            title: title,
            scores: {},
            overallScore: 0,
            passesFilters: false,
            reasons: [],
            recommendations: [],
            metadata: {
                titleLength: [...title].length,
                wordCount: title.split(/\s+/).length,
                evaluatedAt: new Date().toISOString()
            }
        };

        try {
            // 1. 개별 점수 계산
            evaluation.scores.relevance = this.calculateRelevanceScore(title);
            evaluation.scores.length = this.calculateLengthScore(title);
            evaluation.scores.readability = this.calculateReadabilityScore(title);
            evaluation.scores.seo = this.calculateSEOScore(title);
            evaluation.scores.engagement = this.calculateEngagementScore(title);
            evaluation.scores.compliance = this.calculateComplianceScore(title);

            // 2. 전체 점수 계산 (가중 평균)
            evaluation.overallScore = this.calculateOverallScore(evaluation.scores);

            // 3. 필터 통과 여부 확인
            evaluation.passesFilters = this.passesFilters(title, evaluation.scores);

            // 4. 평가 이유 생성
            evaluation.reasons = this.getEvaluationReasons(title, evaluation.scores);

            // 5. 개선 권장사항 생성
            evaluation.recommendations = this.generateRecommendations(title, evaluation.scores);

            console.log('제목 평가 세부 점수:', {
                title,
                relevance: evaluation.scores.relevance.toFixed(2),
                length: evaluation.scores.length.toFixed(2),
                readability: evaluation.scores.readability.toFixed(2),
                seo: evaluation.scores.seo.toFixed(2),
                engagement: evaluation.scores.engagement.toFixed(2),
                compliance: evaluation.scores.compliance.toFixed(2),
                overall: evaluation.overallScore.toFixed(2)
            });

        } catch (error) {
            console.error('제목 평가 중 오류 발생:', error);
            
            // 오류 발생 시 기본값 설정
            evaluation.scores = {
                relevance: 0.1,
                length: 0.1,
                readability: 0.1,
                seo: 0.1,
                engagement: 0.1,
                compliance: 0.1
            };
            evaluation.overallScore = 0.1;
            evaluation.passesFilters = false;
            evaluation.reasons = [`평가 중 오류 발생: ${error.message}`];
            evaluation.recommendations = ['제목을 다시 확인해 주세요'];
        }

        return evaluation;
    }

    /**
     * 전체 점수 계산 (가중 평균)
     * @param {Object} scores 개별 점수들
     * @returns {number} 전체 점수 (0-1)
     */
    calculateOverallScore(scores) {
        // 점수별 가중치 설정
        const weights = {
            relevance: 0.25,    // 관련성 25%
            length: 0.15,       // 길이 15%
            readability: 0.20,  // 가독성 20%
            seo: 0.15,          // SEO 15%
            engagement: 0.15,   // 참여도 15%
            compliance: 0.10    // 준수성 10%
        };

        let weightedSum = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(key => {
            if (scores[key] !== undefined) {
                weightedSum += scores[key] * weights[key];
                totalWeight += weights[key];
            }
        });

        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * 평가 캐시 키 생성
     * @param {string} title 제목
     * @returns {string} 캐시 키
     */
    generateEvaluationCacheKey(title) {
        const contentHash = this.analyzer ? 
            this.cacheManager.simpleHash(this.analyzer.content) : 'no-content';
        const filtersHash = this.cacheManager.simpleHash(JSON.stringify(this.mergedFilters));
        const guidelinesHash = this.cacheManager.simpleHash(JSON.stringify(this.mergedGuidelines));
        
        return `eval_${this.cacheManager.simpleHash(title)}_${contentHash}_${filtersHash}_${guidelinesHash}`;
    }

    /**
     * 기본 점수 계산 프레임워크 - 하위 클래스에서 구현할 메서드들의 기본 구조
     */

    /**
     * 관련성 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} 관련성 점수 (0-1)
     */
    calculateRelevanceScore(title) {
        let score = 0.1; // 기본 점수
        
        if (!this.analyzer || !this.analyzer.analysis) {
            console.log('관련성 점수 계산: 분석 데이터 없음');
            return score;
        }

        const analysis = this.analyzer.analysis;
        const titleLower = title.toLowerCase();
        const titleWords = title.split(/\s+/).map(word => word.toLowerCase());

        console.log('관련성 점수 계산 시작:', { title, keyPhrases: analysis.keyPhrases.length });

        // 1. 핵심 키워드 매칭 점수 (가중치 40%)
        const keywordScore = this.calculateKeywordRelevance(titleLower, titleWords, analysis.keyPhrases);
        score += keywordScore * 0.4;

        // 2. 개체명 매칭 점수 (가중치 20%)
        const entityScore = this.calculateEntityRelevance(titleLower, analysis.entities);
        score += entityScore * 0.2;

        // 3. 주제 일치도 점수 (가중치 15%)
        const subjectScore = this.calculateSubjectRelevance(titleLower, this.analyzer.subject);
        score += subjectScore * 0.15;

        // 4. 통계 데이터 활용 점수 (가중치 10%)
        const statisticsScore = this.calculateStatisticsRelevance(title, analysis.statistics);
        score += statisticsScore * 0.1;

        // 5. 감정 일치도 점수 (가중치 10%)
        const sentimentScore = this.calculateSentimentRelevance(title, analysis.sentiment);
        score += sentimentScore * 0.1;

        // 6. 헤딩 관련성 점수 (가중치 5%)
        const headingScore = this.calculateHeadingRelevance(titleLower, analysis.headings);
        score += headingScore * 0.05;

        const finalScore = Math.min(1.0, score);
        
        console.log('관련성 점수 계산 완료:', {
            keyword: keywordScore.toFixed(2),
            entity: entityScore.toFixed(2),
            subject: subjectScore.toFixed(2),
            statistics: statisticsScore.toFixed(2),
            sentiment: sentimentScore.toFixed(2),
            heading: headingScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * 키워드 관련성 계산
     */
    calculateKeywordRelevance(titleLower, titleWords, keyPhrases) {
        if (!keyPhrases || keyPhrases.length === 0) return 0;

        let score = 0;
        let totalImportance = 0;

        keyPhrases.forEach(kp => {
            const phrase = kp.phrase.toLowerCase();
            const importance = kp.importance || 0.5;
            totalImportance += importance;

            // 완전 일치
            if (titleLower.includes(phrase)) {
                score += importance * 1.0;
            }
            // 부분 일치 (단어 단위)
            else if (titleWords.some(word => phrase.includes(word) || word.includes(phrase))) {
                score += importance * 0.5;
            }
        });

        return totalImportance > 0 ? Math.min(1.0, score / totalImportance) : 0;
    }

    /**
     * 개체명 관련성 계산
     */
    calculateEntityRelevance(titleLower, entities) {
        if (!entities || entities.length === 0) return 0;

        let matchCount = 0;
        let totalConfidence = 0;

        entities.forEach(entity => {
            const entityText = entity.text.toLowerCase();
            const confidence = entity.confidence || 0.5;
            totalConfidence += confidence;

            if (titleLower.includes(entityText)) {
                matchCount += confidence;
            }
        });

        return totalConfidence > 0 ? Math.min(1.0, matchCount / totalConfidence) : 0;
    }

    /**
     * 주제 관련성 계산
     */
    calculateSubjectRelevance(titleLower, subject) {
        if (!subject) return 0.5; // 주제가 없으면 중립 점수

        const subjectWords = subject.toLowerCase().split(/\s+/).filter(word => word.length > 2);
        if (subjectWords.length === 0) return 0.5;

        const matchCount = subjectWords.filter(word => titleLower.includes(word)).length;
        return Math.min(1.0, matchCount / subjectWords.length);
    }

    /**
     * 통계 데이터 관련성 계산
     */
    calculateStatisticsRelevance(title, statistics) {
        if (!statistics || statistics.length === 0) return 0.5;

        const hasStatistics = statistics.some(stat => title.includes(stat.value));
        return hasStatistics ? 1.0 : 0.3;
    }

    /**
     * 감정 일치도 계산
     */
    calculateSentimentRelevance(title, sentiment) {
        if (!sentiment) return 0.5;

        const titleLower = title.toLowerCase();
        const positiveWords = ['성장', '발전', '혁신', '기회', '성공', '확대', '증가'];
        const negativeWords = ['위기', '감소', '하락', '문제', '도전', '어려움'];

        const hasPositive = positiveWords.some(word => titleLower.includes(word));
        const hasNegative = negativeWords.some(word => titleLower.includes(word));

        if (sentiment.overall === 'positive' && hasPositive) return 1.0;
        if (sentiment.overall === 'negative' && hasNegative) return 1.0;
        if (sentiment.overall === 'neutral' && !hasPositive && !hasNegative) return 1.0;

        return 0.6; // 부분 일치
    }

    /**
     * 헤딩 관련성 계산
     */
    calculateHeadingRelevance(titleLower, headings) {
        if (!headings || headings.length === 0) return 0.5;

        const hasHeadingMatch = headings.some(heading => {
            const headingLower = heading.text.toLowerCase();
            return titleLower.includes(headingLower) || headingLower.includes(titleLower);
        });

        return hasHeadingMatch ? 1.0 : 0.3;
    }

    /**
     * 길이 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} 길이 점수 (0-1)
     */
    calculateLengthScore(title) {
        const chars = [...title].length;
        const words = title.split(/\s+/).length;
        const min = this.mergedFilters.titleLen.min;
        const max = this.mergedFilters.titleLen.max;

        console.log('길이 점수 계산:', { title, chars, words, min, max });

        let score = 0;

        // 1. 문자 수 기반 점수 (가중치 60%)
        const charScore = this.calculateCharacterLengthScore(chars, min, max);
        score += charScore * 0.6;

        // 2. 단어 수 기반 점수 (가중치 25%)
        const wordScore = this.calculateWordCountScore(words);
        score += wordScore * 0.25;

        // 3. 균형성 점수 (가중치 15%)
        const balanceScore = this.calculateLengthBalanceScore(chars, words);
        score += balanceScore * 0.15;

        const finalScore = Math.min(1.0, score);

        console.log('길이 점수 세부사항:', {
            charScore: charScore.toFixed(2),
            wordScore: wordScore.toFixed(2),
            balanceScore: balanceScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * 문자 수 기반 점수 계산
     */
    calculateCharacterLengthScore(chars, min, max) {
        // 범위 밖이면 낮은 점수
        if (chars < min) {
            const shortage = min - chars;
            return Math.max(0.1, 0.5 - (shortage * 0.05)); // 부족할수록 감점
        }
        
        if (chars > max) {
            const excess = chars - max;
            return Math.max(0.1, 0.5 - (excess * 0.02)); // 초과할수록 감점
        }

        // 범위 내에서 최적 길이 계산
        const optimal = (min + max) / 2;
        const distance = Math.abs(chars - optimal);
        const maxDistance = Math.max(optimal - min, max - optimal);
        
        return Math.max(0.7, 1 - (distance / maxDistance) * 0.3);
    }

    /**
     * 단어 수 기반 점수 계산
     */
    calculateWordCountScore(words) {
        // 이상적인 단어 수: 4-10개
        if (words >= 4 && words <= 10) {
            return 1.0;
        } else if (words >= 2 && words <= 15) {
            return 0.8;
        } else if (words >= 1 && words <= 20) {
            return 0.6;
        } else {
            return 0.3;
        }
    }

    /**
     * 길이 균형성 점수 계산
     */
    calculateLengthBalanceScore(chars, words) {
        if (words === 0) return 0.1;

        const avgWordLength = chars / words;
        
        // 평균 단어 길이가 3-8자 사이면 좋음
        if (avgWordLength >= 3 && avgWordLength <= 8) {
            return 1.0;
        } else if (avgWordLength >= 2 && avgWordLength <= 12) {
            return 0.7;
        } else {
            return 0.4;
        }
    }

    /**
     * 가독성 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} 가독성 점수 (0-1)
     */
    calculateReadabilityScore(title) {
        console.log('가독성 점수 계산 시작:', { title });

        let score = 0;

        // 1. 구조적 가독성 (가중치 30%)
        const structuralScore = this.calculateStructuralReadability(title);
        score += structuralScore * 0.3;

        // 2. 언어적 가독성 (가중치 25%)
        const linguisticScore = this.calculateLinguisticReadability(title);
        score += linguisticScore * 0.25;

        // 3. 시각적 가독성 (가중치 20%)
        const visualScore = this.calculateVisualReadability(title);
        score += visualScore * 0.2;

        // 4. 인지적 가독성 (가중치 15%)
        const cognitiveScore = this.calculateCognitiveReadability(title);
        score += cognitiveScore * 0.15;

        // 5. 문법적 가독성 (가중치 10%)
        const grammaticalScore = this.calculateGrammaticalReadability(title);
        score += grammaticalScore * 0.1;

        const finalScore = Math.min(1.0, score);

        console.log('가독성 점수 세부사항:', {
            structural: structuralScore.toFixed(2),
            linguistic: linguisticScore.toFixed(2),
            visual: visualScore.toFixed(2),
            cognitive: cognitiveScore.toFixed(2),
            grammatical: grammaticalScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * 구조적 가독성 계산
     */
    calculateStructuralReadability(title) {
        let score = 0.5;
        const words = title.split(/\s+/);

        // 적절한 단어 수
        if (words.length >= 3 && words.length <= 12) {
            score += 0.3;
        } else if (words.length >= 2 && words.length <= 15) {
            score += 0.1;
        }

        // 단어 길이 분포
        const avgWordLength = title.replace(/\s/g, '').length / words.length;
        if (avgWordLength >= 3 && avgWordLength <= 8) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    /**
     * 언어적 가독성 계산
     */
    calculateLinguisticReadability(title) {
        let score = 0.6;

        // 복잡한 전문용어 과다 사용 체크
        const complexTerms = ['패러다임', '시너지', '솔루션', '플랫폼', '인프라스트럭처'];
        const complexCount = complexTerms.filter(term => 
            title.toLowerCase().includes(term)
        ).length;
        
        if (complexCount > 2) {
            score -= 0.2;
        }

        // 읽기 쉬운 단어 사용
        const easyWords = ['분석', '전망', '동향', '현황', '발전', '성장', '변화'];
        const easyCount = easyWords.filter(word => 
            title.toLowerCase().includes(word)
        ).length;
        
        if (easyCount > 0) {
            score += 0.2;
        }

        // 외래어/영어 과다 사용 체크
        const foreignWords = title.match(/[A-Za-z]+/g) || [];
        if (foreignWords.length > 3) {
            score -= 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 시각적 가독성 계산
     */
    calculateVisualReadability(title) {
        let score = 0.7;

        // 특수문자 과다 사용 체크
        const specialChars = title.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || [];
        if (specialChars.length > 3) {
            score -= 0.3;
        } else if (specialChars.length <= 1) {
            score += 0.2;
        }

        // 연속 공백 체크
        if (title.includes('  ')) {
            score -= 0.2;
        }

        // 대소문자 혼용 체크 (영어의 경우)
        const englishWords = title.match(/[A-Za-z]+/g) || [];
        const allCapsWords = englishWords.filter(word => word === word.toUpperCase() && word.length > 1);
        if (allCapsWords.length > 1) {
            score -= 0.1;
        }

        // 숫자와 문자의 적절한 조합
        const hasNumbers = /\d/.test(title);
        const hasLetters = /[가-힣A-Za-z]/.test(title);
        if (hasNumbers && hasLetters) {
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 인지적 가독성 계산
     */
    calculateCognitiveReadability(title) {
        let score = 0.6;

        // 정보 밀도 체크
        const words = title.split(/\s+/);
        const uniqueWords = new Set(words.map(word => word.toLowerCase()));
        const repetitionRatio = 1 - (uniqueWords.size / words.length);
        
        if (repetitionRatio > 0.3) {
            score -= 0.2; // 너무 많은 반복
        }

        // 개념의 복잡성
        const conceptWords = ['전략', '혁신', '생태계', '패러다임', '프레임워크'];
        const conceptCount = conceptWords.filter(word => 
            title.toLowerCase().includes(word)
        ).length;
        
        if (conceptCount > 2) {
            score -= 0.1;
        }

        // 구체성 vs 추상성 균형
        const concreteWords = ['시장', '기업', '제품', '서비스', '기술'];
        const abstractWords = ['가치', '비전', '철학', '문화', '정신'];
        
        const concreteCount = concreteWords.filter(word => title.toLowerCase().includes(word)).length;
        const abstractCount = abstractWords.filter(word => title.toLowerCase().includes(word)).length;
        
        if (concreteCount > 0 && abstractCount <= concreteCount) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    /**
     * 문법적 가독성 계산
     */
    calculateGrammaticalReadability(title) {
        let score = 0.8;

        // 기본 문법 체크
        if (title.startsWith(' ') || title.endsWith(' ')) {
            score -= 0.2;
        }

        // 문장 부호 사용 적절성
        const questionMarks = (title.match(/\?/g) || []).length;
        const exclamationMarks = (title.match(/!/g) || []).length;
        
        if (questionMarks > 1 || exclamationMarks > 1) {
            score -= 0.1;
        }

        // 조사 사용 적절성 (한국어)
        const particles = ['은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로'];
        const particleCount = particles.filter(particle => 
            title.includes(particle)
        ).length;
        
        if (particleCount > 0) {
            score += 0.1; // 자연스러운 한국어 문장
        }

        return Math.min(1.0, score);
    }

    /**
     * SEO 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} SEO 점수 (0-1)
     */
    calculateSEOScore(title) {
        console.log('SEO 점수 계산 시작:', { title });

        let score = 0;

        // 1. 키워드 최적화 (가중치 35%)
        const keywordScore = this.calculateSEOKeywordScore(title);
        score += keywordScore * 0.35;

        // 2. 길이 최적화 (가중치 25%)
        const lengthScore = this.calculateSEOLengthScore(title);
        score += lengthScore * 0.25;

        // 3. 구조 최적화 (가중치 20%)
        const structureScore = this.calculateSEOStructureScore(title);
        score += structureScore * 0.2;

        // 4. 검색 친화성 (가중치 15%)
        const searchFriendlyScore = this.calculateSearchFriendlyScore(title);
        score += searchFriendlyScore * 0.15;

        // 5. 메타데이터 호환성 (가중치 5%)
        const metadataScore = this.calculateMetadataCompatibilityScore(title);
        score += metadataScore * 0.05;

        const finalScore = Math.min(1.0, score);

        console.log('SEO 점수 세부사항:', {
            keyword: keywordScore.toFixed(2),
            length: lengthScore.toFixed(2),
            structure: structureScore.toFixed(2),
            searchFriendly: searchFriendlyScore.toFixed(2),
            metadata: metadataScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * SEO 키워드 점수 계산
     */
    calculateSEOKeywordScore(title) {
        let score = 0.2;

        if (!this.analyzer || !this.analyzer.analysis) {
            return score;
        }

        const analysis = this.analyzer.analysis;
        const titleLower = title.toLowerCase();
        const titleWords = title.split(/\s+/);

        // 주요 키워드 포함 여부
        const keywordMatches = analysis.keyPhrases.filter(kp => 
            titleLower.includes(kp.phrase.toLowerCase())
        );

        if (keywordMatches.length > 0) {
            score += 0.4;
            
            // 키워드 위치 보너스 (앞쪽에 있을수록 좋음)
            const firstKeyword = keywordMatches[0];
            const keywordPosition = titleLower.indexOf(firstKeyword.phrase.toLowerCase());
            const titleLength = title.length;
            
            if (keywordPosition < titleLength * 0.3) {
                score += 0.2; // 앞쪽 30% 내에 있으면 보너스
            } else if (keywordPosition < titleLength * 0.5) {
                score += 0.1; // 앞쪽 50% 내에 있으면 작은 보너스
            }
        }

        // 키워드 밀도 체크 (과도하면 감점)
        const keywordDensity = keywordMatches.length / titleWords.length;
        if (keywordDensity > 0.5) {
            score -= 0.1; // 키워드 스터핑 방지
        }

        // 롱테일 키워드 보너스
        const longTailKeywords = analysis.keyPhrases.filter(kp => 
            kp.phrase.split(' ').length >= 2 && titleLower.includes(kp.phrase.toLowerCase())
        );
        if (longTailKeywords.length > 0) {
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * SEO 길이 점수 계산
     */
    calculateSEOLengthScore(title) {
        const chars = [...title].length;
        
        // Google 검색 결과에서 최적 길이: 30-60자
        if (chars >= 30 && chars <= 60) {
            return 1.0;
        } else if (chars >= 25 && chars <= 70) {
            return 0.8;
        } else if (chars >= 20 && chars <= 80) {
            return 0.6;
        } else if (chars >= 15 && chars <= 100) {
            return 0.4;
        } else {
            return 0.2;
        }
    }

    /**
     * SEO 구조 점수 계산
     */
    calculateSEOStructureScore(title) {
        let score = 0.5;

        // 제목 구조 패턴 분석
        const hasColon = title.includes(':');
        const hasDash = title.includes('-') || title.includes('–');
        const hasComma = title.includes(',');

        // 구조화된 제목 보너스
        if (hasColon || hasDash) {
            score += 0.2;
        }

        // 브랜드명/카테고리 분리 구조
        if (hasColon && title.split(':').length === 2) {
            score += 0.1;
        }

        // 숫자 포함 (리스트형 제목)
        if (/\d+/.test(title)) {
            score += 0.1;
        }

        // 질문형 제목
        if (title.includes('?')) {
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 검색 친화성 점수 계산
     */
    calculateSearchFriendlyScore(title) {
        let score = 0.4;

        const titleLower = title.toLowerCase();

        // 검색 의도 키워드
        const searchIntentWords = [
            '방법', '가이드', '분석', '비교', '리뷰', '전망', '동향', '현황',
            '완벽', '최고', '최신', '2024', '추천', '순위'
        ];

        const intentMatches = searchIntentWords.filter(word => 
            titleLower.includes(word)
        ).length;

        if (intentMatches > 0) {
            score += Math.min(0.3, intentMatches * 0.1);
        }

        // 지역성 키워드 (해당하는 경우)
        const locationWords = ['한국', '국내', '서울', '부산', '글로벌'];
        const locationMatches = locationWords.filter(word => 
            titleLower.includes(word)
        ).length;

        if (locationMatches > 0) {
            score += 0.1;
        }

        // 시간성 키워드
        const timeWords = ['2024', '최신', '신규', '새로운', '업데이트'];
        const timeMatches = timeWords.filter(word => 
            titleLower.includes(word)
        ).length;

        if (timeMatches > 0) {
            score += 0.1;
        }

        // 특수문자 과다 사용 감점
        const specialChars = title.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || [];
        if (specialChars.length > 3) {
            score -= 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 메타데이터 호환성 점수 계산
     */
    calculateMetadataCompatibilityScore(title) {
        let score = 0.8;

        // HTML 특수문자 체크
        const htmlChars = ['<', '>', '&', '"', "'"];
        const hasHtmlChars = htmlChars.some(char => title.includes(char));
        if (hasHtmlChars) {
            score -= 0.3;
        }

        // 인코딩 문제 가능성 체크
        const problematicChars = title.match(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?:;-]/g);
        if (problematicChars && problematicChars.length > 0) {
            score -= 0.2;
        }

        // 소셜 미디어 호환성
        const chars = [...title].length;
        if (chars <= 70) { // Twitter 등에서 잘림 방지
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 참여도 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} 참여도 점수 (0-1)
     */
    calculateEngagementScore(title) {
        console.log('참여도 점수 계산 시작:', { title });

        let score = 0;

        // 1. 감정적 어필 (가중치 30%)
        const emotionalScore = this.calculateEmotionalAppealScore(title);
        score += emotionalScore * 0.3;

        // 2. 호기심 유발 (가중치 25%)
        const curiosityScore = this.calculateCuriosityScore(title);
        score += curiosityScore * 0.25;

        // 3. 실용성 어필 (가중치 20%)
        const utilityScore = this.calculateUtilityScore(title);
        score += utilityScore * 0.2;

        // 4. 긴급성/시의성 (가중치 15%)
        const urgencyScore = this.calculateUrgencyScore(title);
        score += urgencyScore * 0.15;

        // 5. 사회적 증명 (가중치 10%)
        const socialProofScore = this.calculateSocialProofScore(title);
        score += socialProofScore * 0.1;

        const finalScore = Math.min(1.0, score);

        console.log('참여도 점수 세부사항:', {
            emotional: emotionalScore.toFixed(2),
            curiosity: curiosityScore.toFixed(2),
            utility: utilityScore.toFixed(2),
            urgency: urgencyScore.toFixed(2),
            socialProof: socialProofScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * 감정적 어필 점수 계산
     */
    calculateEmotionalAppealScore(title) {
        let score = 0.3;
        const titleLower = title.toLowerCase();

        // 긍정적 감정 단어
        const positiveWords = [
            '혁신', '성장', '발전', '성공', '기회', '가능성', '미래', '희망',
            '놀라운', '획기적', '뛰어난', '탁월한', '우수한', '최고'
        ];

        // 중립적 전문 단어 (적절한 수준)
        const professionalWords = [
            '분석', '전망', '동향', '현황', '트렌드', '전략', '방안', '해결책'
        ];

        // 부정적이지만 관심을 끄는 단어
        const challengeWords = [
            '위기', '도전', '문제', '해결', '극복', '대응', '변화', '전환'
        ];

        const positiveCount = positiveWords.filter(word => titleLower.includes(word)).length;
        const professionalCount = professionalWords.filter(word => titleLower.includes(word)).length;
        const challengeCount = challengeWords.filter(word => titleLower.includes(word)).length;

        // 긍정적 단어 보너스
        if (positiveCount > 0) {
            score += Math.min(0.4, positiveCount * 0.15);
        }

        // 전문적 단어 보너스 (적절한 수준)
        if (professionalCount > 0 && professionalCount <= 2) {
            score += Math.min(0.2, professionalCount * 0.1);
        }

        // 도전/문제 해결 관련 단어 보너스
        if (challengeCount > 0) {
            score += Math.min(0.2, challengeCount * 0.1);
        }

        // 과도한 감정적 표현 감점
        const excessiveWords = ['대박', '충격', '소름', '미쳤다', '레전드'];
        const excessiveCount = excessiveWords.filter(word => titleLower.includes(word)).length;
        if (excessiveCount > 0) {
            score -= excessiveCount * 0.3;
        }

        return Math.max(0.1, Math.min(1.0, score));
    }

    /**
     * 호기심 유발 점수 계산
     */
    calculateCuriosityScore(title) {
        let score = 0.2;

        // 질문형 제목
        if (title.includes('?')) {
            score += 0.3;
        }

        // 숫자 포함 (구체성)
        const numbers = title.match(/\d+/g);
        if (numbers) {
            score += Math.min(0.2, numbers.length * 0.1);
        }

        // 호기심 유발 패턴
        const curiosityPatterns = [
            '비밀', '진실', '이유', '방법', '비결', '노하우', '팁',
            '알아야 할', '놓치면 안 되는', '숨겨진', '공개', '밝혀진'
        ];

        const curiosityCount = curiosityPatterns.filter(pattern => 
            title.toLowerCase().includes(pattern)
        ).length;

        if (curiosityCount > 0) {
            score += Math.min(0.3, curiosityCount * 0.15);
        }

        // 대조/비교 표현
        const contrastWords = ['vs', '대', '비교', '차이', '장단점'];
        const contrastCount = contrastWords.filter(word => 
            title.toLowerCase().includes(word)
        ).length;

        if (contrastCount > 0) {
            score += 0.2;
        }

        return Math.min(1.0, score);
    }

    /**
     * 실용성 어필 점수 계산
     */
    calculateUtilityScore(title) {
        let score = 0.3;
        const titleLower = title.toLowerCase();

        // 실용적 키워드
        const utilityWords = [
            '가이드', '방법', '팁', '노하우', '전략', '해결책', '방안',
            '완벽', '실무', '실전', '활용', '적용', '구현', '실행'
        ];

        const utilityCount = utilityWords.filter(word => titleLower.includes(word)).length;
        if (utilityCount > 0) {
            score += Math.min(0.4, utilityCount * 0.2);
        }

        // 단계별/체계적 접근
        const systematicWords = ['단계', '과정', '절차', '순서', '체계', '프로세스'];
        const systematicCount = systematicWords.filter(word => titleLower.includes(word)).length;
        if (systematicCount > 0) {
            score += 0.2;
        }

        // 결과 지향적 표현
        const resultWords = ['결과', '성과', '효과', '개선', '향상', '최적화'];
        const resultCount = resultWords.filter(word => titleLower.includes(word)).length;
        if (resultCount > 0) {
            score += 0.1;
        }

        return Math.min(1.0, score);
    }

    /**
     * 긴급성/시의성 점수 계산
     */
    calculateUrgencyScore(title) {
        let score = 0.4;
        const titleLower = title.toLowerCase();

        // 시간 관련 키워드
        const timeWords = [
            '2024', '최신', '신규', '새로운', '업데이트', '최근',
            '지금', '현재', '오늘', '이번', '올해', '최근'
        ];

        const timeCount = timeWords.filter(word => titleLower.includes(word)).length;
        if (timeCount > 0) {
            score += Math.min(0.3, timeCount * 0.15);
        }

        // 트렌드 관련 키워드
        const trendWords = ['트렌드', '동향', '흐름', '변화', '전환', '패러다임'];
        const trendCount = trendWords.filter(word => titleLower.includes(word)).length;
        if (trendCount > 0) {
            score += 0.2;
        }

        // 긴급성 표현 (과도하지 않은 수준)
        const urgentWords = ['중요', '필수', '핵심', '주목', '관심'];
        const urgentCount = urgentWords.filter(word => titleLower.includes(word)).length;
        if (urgentCount > 0) {
            score += Math.min(0.1, urgentCount * 0.05);
        }

        return Math.min(1.0, score);
    }

    /**
     * 사회적 증명 점수 계산
     */
    calculateSocialProofScore(title) {
        let score = 0.5;
        const titleLower = title.toLowerCase();

        // 권위/전문성 표현
        const authorityWords = [
            '전문가', '분석', '연구', '조사', '보고서', '발표',
            '업계', '시장', '기업', '기관', '협회'
        ];

        const authorityCount = authorityWords.filter(word => titleLower.includes(word)).length;
        if (authorityCount > 0) {
            score += Math.min(0.3, authorityCount * 0.1);
        }

        // 통계/데이터 기반
        if (this.analyzer && this.analyzer.analysis && this.analyzer.analysis.statistics.length > 0) {
            const hasStatInTitle = this.analyzer.analysis.statistics.some(stat => 
                title.includes(stat.value)
            );
            if (hasStatInTitle) {
                score += 0.2;
            }
        }

        // 인정받은 기업/기관명 포함
        if (this.analyzer && this.analyzer.analysis && this.analyzer.analysis.entities.length > 0) {
            const hasEntityInTitle = this.analyzer.analysis.entities.some(entity => 
                titleLower.includes(entity.text.toLowerCase())
            );
            if (hasEntityInTitle) {
                score += 0.1;
            }
        }

        return Math.min(1.0, score);
    }

    /**
     * 준수성 점수 계산 (상세 구현)
     * @param {string} title 제목
     * @returns {number} 준수성 점수 (0-1)
     */
    calculateComplianceScore(title) {
        console.log('준수성 점수 계산 시작:', { title });

        let score = 0.8; // 기본적으로 높은 점수에서 시작

        // 1. 금지 키워드 준수 (가중치 40%)
        const bannedWordsScore = this.calculateBannedWordsCompliance(title);
        score = score * (0.6 + bannedWordsScore * 0.4);

        // 2. 클릭베이트 방지 (가중치 30%)
        const clickbaitScore = this.calculateClickbaitCompliance(title);
        score = score * (0.7 + clickbaitScore * 0.3);

        // 3. 브랜드 톤 준수 (가중치 15%)
        const brandToneScore = this.calculateBrandToneCompliance(title);
        score = score * (0.85 + brandToneScore * 0.15);

        // 4. 윤리적 기준 준수 (가중치 10%)
        const ethicalScore = this.calculateEthicalCompliance(title);
        score = score * (0.9 + ethicalScore * 0.1);

        // 5. 법적 준수 (가중치 5%)
        const legalScore = this.calculateLegalCompliance(title);
        score = score * (0.95 + legalScore * 0.05);

        const finalScore = Math.max(0.0, Math.min(1.0, score));

        console.log('준수성 점수 세부사항:', {
            bannedWords: bannedWordsScore.toFixed(2),
            clickbait: clickbaitScore.toFixed(2),
            brandTone: brandToneScore.toFixed(2),
            ethical: ethicalScore.toFixed(2),
            legal: legalScore.toFixed(2),
            final: finalScore.toFixed(2)
        });

        return finalScore;
    }

    /**
     * 금지 키워드 준수 점수 계산
     */
    calculateBannedWordsCompliance(title) {
        const titleLower = title.toLowerCase();
        const bannedWords = this.mergedFilters.mustExclude || [];

        if (bannedWords.length === 0) return 1.0;

        const bannedFound = bannedWords.filter(banned => 
            titleLower.includes(banned.toLowerCase())
        );

        if (bannedFound.length === 0) {
            return 1.0;
        } else {
            // 발견된 금지 키워드 수에 따라 점수 감소
            const penaltyRatio = bannedFound.length / bannedWords.length;
            return Math.max(0.0, 1.0 - penaltyRatio * 2); // 최대 2배 감점
        }
    }

    /**
     * 클릭베이트 방지 준수 점수 계산
     */
    calculateClickbaitCompliance(title) {
        if (!this.mergedGuidelines.clickbaitAvoidance) {
            return 1.0; // 클릭베이트 방지가 비활성화된 경우
        }

        let score = 1.0;
        const titleLower = title.toLowerCase();

        // 강한 클릭베이트 패턴 (심각한 감점)
        const severeClickbait = [
            '충격', '소름', '대박', '미쳤다', '헉', '레전드', '실화',
            '믿을 수 없는', '절대', '무조건', '100%', '완전'
        ];

        const severeFound = severeClickbait.filter(pattern => 
            titleLower.includes(pattern)
        );
        score -= severeFound.length * 0.4;

        // 중간 수준 클릭베이트 패턴 (보통 감점)
        const moderateClickbait = [
            '놀라운', '엄청난', '최고의', '최악의', '비밀', '진실',
            '반드시', '꼭', '모든', '전부'
        ];

        const moderateFound = moderateClickbait.filter(pattern => 
            titleLower.includes(pattern)
        );
        score -= moderateFound.length * 0.2;

        // 경미한 클릭베이트 패턴 (약간 감점)
        const mildClickbait = [
            '특별한', '독특한', '새로운', '혁신적인', '획기적인'
        ];

        const mildFound = mildClickbait.filter(pattern => 
            titleLower.includes(pattern)
        );
        score -= mildFound.length * 0.1;

        return Math.max(0.0, score);
    }

    /**
     * 브랜드 톤 준수 점수 계산
     */
    calculateBrandToneCompliance(title) {
        const brandTone = this.mergedGuidelines.brandTone || 'neutral';
        const titleLower = title.toLowerCase();
        let score = 0.8; // 기본 점수

        switch (brandTone) {
            case 'positive':
                const positiveWords = ['성장', '발전', '혁신', '성공', '기회', '미래'];
                const positiveCount = positiveWords.filter(word => titleLower.includes(word)).length;
                if (positiveCount > 0) score += 0.2;
                
                const negativeWords = ['위기', '실패', '문제', '어려움'];
                const negativeCount = negativeWords.filter(word => titleLower.includes(word)).length;
                if (negativeCount > 0) score -= 0.1;
                break;

            case 'authoritative':
                const authWords = ['분석', '연구', '조사', '전문가', '보고서'];
                const authCount = authWords.filter(word => titleLower.includes(word)).length;
                if (authCount > 0) score += 0.2;
                
                const casualWords = ['꿀팁', '대박', '짱'];
                const casualCount = casualWords.filter(word => titleLower.includes(word)).length;
                if (casualCount > 0) score -= 0.2;
                break;

            case 'neutral':
            default:
                // 중립적 톤 - 극단적 표현 피하기
                const extremeWords = ['최고', '최악', '절대', '완전', '무조건'];
                const extremeCount = extremeWords.filter(word => titleLower.includes(word)).length;
                if (extremeCount === 0) score += 0.2;
                else score -= extremeCount * 0.1;
                break;
        }

        return Math.min(1.0, score);
    }

    /**
     * 윤리적 기준 준수 점수 계산
     */
    calculateEthicalCompliance(title) {
        let score = 1.0;
        const titleLower = title.toLowerCase();

        // 차별적 표현 체크
        const discriminatoryWords = [
            '남성만', '여성만', '젊은이만', '나이든', '장애인', '외국인'
        ];
        const discriminatoryFound = discriminatoryWords.filter(word => 
            titleLower.includes(word)
        );
        score -= discriminatoryFound.length * 0.3;

        // 과장/허위 표현 체크
        const exaggeratedWords = [
            '100% 확실', '절대 실패 없는', '무조건 성공', '완벽한'
        ];
        const exaggeratedFound = exaggeratedWords.filter(word => 
            titleLower.includes(word)
        );
        score -= exaggeratedFound.length * 0.2;

        // 공포 조장 표현 체크
        const fearWords = [
            '위험', '경고', '주의', '조심', '피해야 할'
        ];
        const fearCount = fearWords.filter(word => titleLower.includes(word)).length;
        if (fearCount > 2) { // 적절한 수준을 넘어서면 감점
            score -= (fearCount - 2) * 0.1;
        }

        return Math.max(0.0, score);
    }

    /**
     * 법적 준수 점수 계산
     */
    calculateLegalCompliance(title) {
        let score = 1.0;
        const titleLower = title.toLowerCase();

        // 의료/건강 관련 과장 표현
        const medicalClaims = [
            '치료', '완치', '100% 효과', '부작용 없는', '의학적으로 증명'
        ];
        const medicalFound = medicalClaims.filter(claim => 
            titleLower.includes(claim)
        );
        score -= medicalFound.length * 0.2;

        // 투자/재정 관련 보장 표현
        const financialClaims = [
            '100% 수익', '무위험', '보장된 수익', '절대 손실 없는'
        ];
        const financialFound = financialClaims.filter(claim => 
            titleLower.includes(claim)
        );
        score -= financialFound.length * 0.2;

        // 저작권 침해 가능성
        const copyrightWords = [
            '무료 다운로드', '크랙', '불법', '해킹'
        ];
        const copyrightFound = copyrightWords.filter(word => 
            titleLower.includes(word)
        );
        score -= copyrightFound.length * 0.3;

        return Math.max(0.0, score);
    }

    /**
     * 필터 통과 여부 확인 (상세 구현)
     * @param {string} title 제목
     * @param {Object} scores 점수들
     * @returns {boolean} 통과 여부
     */
    passesFilters(title, scores) {
        console.log('필터 통과 여부 확인 시작:', { title });

        const filters = this.mergedFilters;
        const failedFilters = [];

        // 1. 기본 길이 필터 (필수)
        const chars = [...title].length;
        if (chars < filters.titleLen.min || chars > filters.titleLen.max) {
            failedFilters.push(`길이 기준 미달 (${chars}자, 기준: ${filters.titleLen.min}-${filters.titleLen.max}자)`);
        }

        // 2. 필수 포함 키워드 필터
        if (filters.mustInclude && filters.mustInclude.length > 0) {
            const titleLower = title.toLowerCase();
            const missingRequired = filters.mustInclude.filter(required => 
                !titleLower.includes(required.toLowerCase())
            );
            if (missingRequired.length > 0) {
                failedFilters.push(`필수 키워드 누락: ${missingRequired.join(', ')}`);
            }
        }

        // 3. 금지 키워드 필터 (필수)
        if (filters.mustExclude && filters.mustExclude.length > 0) {
            const titleLower = title.toLowerCase();
            const foundBanned = filters.mustExclude.filter(banned => 
                titleLower.includes(banned.toLowerCase())
            );
            if (foundBanned.length > 0) {
                failedFilters.push(`금지 키워드 포함: ${foundBanned.join(', ')}`);
            }
        }

        // 4. 필수 구문 포함 필터
        if (filters.phraseInclude && filters.phraseInclude.length > 0) {
            const titleLower = title.toLowerCase();
            const missingPhrases = filters.phraseInclude.filter(phrase => 
                !titleLower.includes(phrase.toLowerCase())
            );
            if (missingPhrases.length > 0) {
                failedFilters.push(`필수 구문 누락: ${missingPhrases.join(', ')}`);
            }
        }

        // 5. 금지 구문 필터
        if (filters.phraseExclude && filters.phraseExclude.length > 0) {
            const titleLower = title.toLowerCase();
            const foundBannedPhrases = filters.phraseExclude.filter(phrase => 
                titleLower.includes(phrase.toLowerCase())
            );
            if (foundBannedPhrases.length > 0) {
                failedFilters.push(`금지 구문 포함: ${foundBannedPhrases.join(', ')}`);
            }
        }

        // 6. 개별 점수 기준 필터
        const scoreFilters = this.checkScoreFilters(scores, filters);
        failedFilters.push(...scoreFilters);

        // 7. 전체 점수 기준 필터
        const overallScore = this.calculateOverallScore(scores);
        if (overallScore < filters.minOverallScore) {
            failedFilters.push(`전체 점수 미달 (${overallScore.toFixed(2)}, 기준: ${filters.minOverallScore})`);
        }

        // 8. 고급 품질 필터
        const qualityFilters = this.checkAdvancedQualityFilters(title, scores);
        failedFilters.push(...qualityFilters);

        const passed = failedFilters.length === 0;

        console.log('필터 통과 여부 확인 완료:', {
            title,
            passed,
            failedFilters: failedFilters.length,
            details: failedFilters
        });

        return passed;
    }

    /**
     * 점수 기준 필터 확인
     */
    checkScoreFilters(scores, filters) {
        const failedFilters = [];

        if (scores.relevance < filters.minRelevanceScore) {
            failedFilters.push(`관련성 점수 미달 (${scores.relevance.toFixed(2)}, 기준: ${filters.minRelevanceScore})`);
        }

        if (scores.length < filters.minLengthScore) {
            failedFilters.push(`길이 점수 미달 (${scores.length.toFixed(2)}, 기준: ${filters.minLengthScore})`);
        }

        if (scores.readability < filters.minReadabilityScore) {
            failedFilters.push(`가독성 점수 미달 (${scores.readability.toFixed(2)}, 기준: ${filters.minReadabilityScore})`);
        }

        if (scores.seo < filters.minSEOScore) {
            failedFilters.push(`SEO 점수 미달 (${scores.seo.toFixed(2)}, 기준: ${filters.minSEOScore})`);
        }

        if (scores.engagement < filters.minEngagementScore) {
            failedFilters.push(`참여도 점수 미달 (${scores.engagement.toFixed(2)}, 기준: ${filters.minEngagementScore})`);
        }

        if (scores.compliance < filters.minComplianceScore) {
            failedFilters.push(`준수성 점수 미달 (${scores.compliance.toFixed(2)}, 기준: ${filters.minComplianceScore})`);
        }

        return failedFilters;
    }

    /**
     * 고급 품질 필터 확인
     */
    checkAdvancedQualityFilters(title, scores) {
        const failedFilters = [];

        // 중복 제거 필터
        if (this.isDuplicateTitle(title)) {
            failedFilters.push('중복 제목');
        }

        // 의미 없는 제목 필터
        if (this.isMeaninglessTitle(title)) {
            failedFilters.push('의미 없는 제목');
        }

        // 과도한 특수문자 필터
        if (this.hasExcessiveSpecialChars(title)) {
            failedFilters.push('과도한 특수문자 사용');
        }

        // 언어 일관성 필터
        if (!this.hasLanguageConsistency(title)) {
            failedFilters.push('언어 일관성 부족');
        }

        return failedFilters;
    }

    /**
     * 중복 제목 확인
     */
    isDuplicateTitle(title) {
        // 간단한 중복 패턴 체크
        const words = title.split(/\s+/);
        const uniqueWords = new Set(words.map(word => word.toLowerCase()));
        
        // 50% 이상이 중복 단어면 중복으로 간주
        return (uniqueWords.size / words.length) < 0.5;
    }

    /**
     * 의미 없는 제목 확인
     */
    isMeaninglessTitle(title) {
        const meaninglessPatterns = [
            /^[^가-힣A-Za-z]*$/, // 문자가 없음
            /^(.)\1{5,}/, // 같은 문자 6번 이상 반복
            /^[0-9\s\-_.,!?]*$/ // 숫자와 기호만
        ];

        return meaninglessPatterns.some(pattern => pattern.test(title));
    }

    /**
     * 과도한 특수문자 확인
     */
    hasExcessiveSpecialChars(title) {
        const specialChars = title.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || [];
        const totalChars = [...title].length;
        
        // 특수문자가 전체의 30% 이상이면 과도함
        return (specialChars.length / totalChars) > 0.3;
    }

    /**
     * 언어 일관성 확인
     */
    hasLanguageConsistency(title) {
        const koreanChars = (title.match(/[가-힣]/g) || []).length;
        const englishChars = (title.match(/[A-Za-z]/g) || []).length;
        const totalLetters = koreanChars + englishChars;

        if (totalLetters === 0) return false;

        // 한국어나 영어 중 하나가 90% 이상이거나, 적절히 섞여있으면 일관성 있음
        const koreanRatio = koreanChars / totalLetters;
        const englishRatio = englishChars / totalLetters;

        return koreanRatio >= 0.9 || englishRatio >= 0.9 || 
               (koreanRatio >= 0.3 && englishRatio >= 0.3);
    }

    /**
     * 평가 이유 생성 (상세 구현)
     * @param {string} title 제목
     * @param {Object} scores 점수들
     * @returns {Array} 평가 이유 배열
     */
    getEvaluationReasons(title, scores) {
        console.log('평가 이유 생성 시작:', { title });

        const reasons = [];

        // 1. 관련성 평가 이유
        reasons.push(...this.getRelevanceReasons(title, scores.relevance));

        // 2. 길이 평가 이유
        reasons.push(...this.getLengthReasons(title, scores.length));

        // 3. 가독성 평가 이유
        reasons.push(...this.getReadabilityReasons(title, scores.readability));

        // 4. SEO 평가 이유
        reasons.push(...this.getSEOReasons(title, scores.seo));

        // 5. 참여도 평가 이유
        reasons.push(...this.getEngagementReasons(title, scores.engagement));

        // 6. 준수성 평가 이유
        reasons.push(...this.getComplianceReasons(title, scores.compliance));

        // 7. 전체 평가 이유
        const overallScore = this.calculateOverallScore(scores);
        reasons.push(...this.getOverallReasons(overallScore));

        // 8. 특별한 강점/약점 이유
        reasons.push(...this.getSpecialReasons(title, scores));

        console.log('평가 이유 생성 완료:', { title, reasonCount: reasons.length });

        return reasons;
    }

    /**
     * 관련성 평가 이유 생성
     */
    getRelevanceReasons(title, relevanceScore) {
        const reasons = [];

        if (relevanceScore >= 0.8) {
            reasons.push('콘텐츠와의 관련성이 매우 높음 - 주요 키워드와 주제가 잘 반영됨');
        } else if (relevanceScore >= 0.6) {
            reasons.push('콘텐츠와의 관련성이 양호함 - 핵심 내용이 적절히 표현됨');
        } else if (relevanceScore >= 0.4) {
            reasons.push('콘텐츠와의 관련성이 보통 수준 - 일부 키워드 매칭');
        } else if (relevanceScore >= 0.2) {
            reasons.push('콘텐츠와의 관련성이 낮음 - 주요 키워드 부족');
        } else {
            reasons.push('콘텐츠와의 관련성이 매우 낮음 - 핵심 내용 미반영');
        }

        // 구체적인 관련성 요소 분석
        if (this.analyzer && this.analyzer.analysis) {
            const analysis = this.analyzer.analysis;
            const titleLower = title.toLowerCase();

            const keywordMatches = analysis.keyPhrases.filter(kp => 
                titleLower.includes(kp.phrase.toLowerCase())
            ).length;

            if (keywordMatches > 0) {
                reasons.push(`${keywordMatches}개의 핵심 키워드가 제목에 포함됨`);
            }

            const entityMatches = analysis.entities.filter(entity => 
                titleLower.includes(entity.text.toLowerCase())
            ).length;

            if (entityMatches > 0) {
                reasons.push(`${entityMatches}개의 주요 개체명이 제목에 포함됨`);
            }
        }

        return reasons;
    }

    /**
     * 길이 평가 이유 생성
     */
    getLengthReasons(title, lengthScore) {
        const reasons = [];
        const chars = [...title].length;
        const words = title.split(/\s+/).length;

        if (lengthScore >= 0.8) {
            reasons.push(`제목 길이가 최적임 (${chars}자, ${words}단어) - 검색 결과와 소셜 미디어에 적합`);
        } else if (lengthScore >= 0.6) {
            reasons.push(`제목 길이가 적절함 (${chars}자, ${words}단어) - 대부분의 플랫폼에서 잘 표시됨`);
        } else if (lengthScore >= 0.4) {
            reasons.push(`제목 길이가 보통 수준 (${chars}자, ${words}단어) - 일부 플랫폼에서 잘림 가능성`);
        } else {
            if (chars < this.mergedFilters.titleLen.min) {
                reasons.push(`제목이 너무 짧음 (${chars}자) - 더 구체적인 정보 필요`);
            } else {
                reasons.push(`제목이 너무 김 (${chars}자) - 간결성 개선 필요`);
            }
        }

        // 단어 수 분석
        if (words >= 4 && words <= 10) {
            reasons.push('단어 수가 이상적임 - 정보 전달과 가독성의 균형');
        } else if (words < 4) {
            reasons.push('단어 수가 적음 - 더 상세한 설명 고려');
        } else {
            reasons.push('단어 수가 많음 - 핵심 내용으로 압축 고려');
        }

        return reasons;
    }

    /**
     * 가독성 평가 이유 생성
     */
    getReadabilityReasons(title, readabilityScore) {
        const reasons = [];

        if (readabilityScore >= 0.8) {
            reasons.push('가독성이 매우 우수함 - 명확하고 이해하기 쉬운 구조');
        } else if (readabilityScore >= 0.6) {
            reasons.push('가독성이 양호함 - 대부분의 독자가 쉽게 이해 가능');
        } else if (readabilityScore >= 0.4) {
            reasons.push('가독성이 보통 수준 - 일부 개선 여지 있음');
        } else {
            reasons.push('가독성 개선 필요 - 복잡하거나 이해하기 어려운 구조');
        }

        // 구체적인 가독성 요소 분석
        const specialChars = (title.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
        if (specialChars > 3) {
            reasons.push('특수문자 사용이 과도함 - 시각적 복잡성 증가');
        } else if (specialChars <= 1) {
            reasons.push('특수문자 사용이 적절함 - 깔끔한 시각적 인상');
        }

        if (title.includes('  ')) {
            reasons.push('연속 공백 존재 - 형식 정리 필요');
        }

        const avgWordLength = title.replace(/\s/g, '').length / title.split(/\s+/).length;
        if (avgWordLength >= 3 && avgWordLength <= 8) {
            reasons.push('평균 단어 길이가 적절함 - 읽기 편안함');
        }

        return reasons;
    }

    /**
     * SEO 평가 이유 생성
     */
    getSEOReasons(title, seoScore) {
        const reasons = [];

        if (seoScore >= 0.8) {
            reasons.push('SEO 최적화가 매우 우수함 - 검색 엔진에서 높은 가시성 기대');
        } else if (seoScore >= 0.6) {
            reasons.push('SEO 최적화가 양호함 - 검색 결과에서 적절한 노출 가능');
        } else if (seoScore >= 0.4) {
            reasons.push('SEO 최적화가 보통 수준 - 일부 개선으로 검색 성과 향상 가능');
        } else {
            reasons.push('SEO 최적화 개선 필요 - 검색 엔진 가시성 제한적');
        }

        // 구체적인 SEO 요소 분석
        const chars = [...title].length;
        if (chars >= 30 && chars <= 60) {
            reasons.push('검색 결과 표시에 최적화된 길이');
        }

        if (this.analyzer && this.analyzer.analysis) {
            const titleLower = title.toLowerCase();
            const hasKeywords = this.analyzer.analysis.keyPhrases.some(kp => 
                titleLower.includes(kp.phrase.toLowerCase())
            );
            if (hasKeywords) {
                reasons.push('주요 검색 키워드 포함으로 검색 매칭 가능성 높음');
            }
        }

        if (/\d/.test(title)) {
            reasons.push('숫자 포함으로 구체성과 검색 친화성 향상');
        }

        return reasons;
    }

    /**
     * 참여도 평가 이유 생성
     */
    getEngagementReasons(title, engagementScore) {
        const reasons = [];

        if (engagementScore >= 0.8) {
            reasons.push('참여도가 매우 높음 - 클릭과 공유를 유도하는 매력적인 제목');
        } else if (engagementScore >= 0.6) {
            reasons.push('참여도가 양호함 - 독자의 관심을 끌 수 있는 요소 포함');
        } else if (engagementScore >= 0.4) {
            reasons.push('참여도가 보통 수준 - 일부 흥미 요소 있으나 개선 가능');
        } else {
            reasons.push('참여도 개선 필요 - 독자의 관심을 끌기 어려운 구조');
        }

        // 구체적인 참여도 요소 분석
        if (title.includes('?')) {
            reasons.push('질문형 제목으로 호기심 유발 효과');
        }

        const titleLower = title.toLowerCase();
        const emotionalWords = ['혁신', '성장', '기회', '전망', '분석', '트렌드'];
        const emotionalCount = emotionalWords.filter(word => titleLower.includes(word)).length;
        if (emotionalCount > 0) {
            reasons.push(`${emotionalCount}개의 감정적 어필 단어로 관심 유도`);
        }

        if (/\d/.test(title)) {
            reasons.push('구체적 숫자로 신뢰성과 관심도 증가');
        }

        return reasons;
    }

    /**
     * 준수성 평가 이유 생성
     */
    getComplianceReasons(title, complianceScore) {
        const reasons = [];

        if (complianceScore >= 0.9) {
            reasons.push('가이드라인 준수가 매우 우수함 - 모든 기준 충족');
        } else if (complianceScore >= 0.7) {
            reasons.push('가이드라인 준수가 양호함 - 대부분의 기준 충족');
        } else if (complianceScore >= 0.5) {
            reasons.push('가이드라인 준수가 보통 수준 - 일부 기준 미충족');
        } else {
            reasons.push('가이드라인 준수 개선 필요 - 여러 기준 미충족');
        }

        // 구체적인 준수성 요소 분석
        const titleLower = title.toLowerCase();
        const bannedWords = this.mergedFilters.mustExclude || [];
        const foundBanned = bannedWords.filter(banned => 
            titleLower.includes(banned.toLowerCase())
        );

        if (foundBanned.length === 0) {
            reasons.push('금지 키워드 없음 - 브랜드 가이드라인 준수');
        } else {
            reasons.push(`금지 키워드 발견: ${foundBanned.join(', ')}`);
        }

        const clickbaitWords = ['충격', '소름', '대박', '미쳤다'];
        const clickbaitFound = clickbaitWords.filter(word => titleLower.includes(word));
        if (clickbaitFound.length === 0) {
            reasons.push('클릭베이트 요소 없음 - 신뢰성 있는 제목');
        }

        return reasons;
    }

    /**
     * 전체 평가 이유 생성
     */
    getOverallReasons(overallScore) {
        const reasons = [];

        if (overallScore >= 0.8) {
            reasons.push('전체적으로 매우 우수한 제목 - 모든 측면에서 높은 품질');
        } else if (overallScore >= 0.6) {
            reasons.push('전체적으로 양호한 제목 - 대부분의 기준 충족');
        } else if (overallScore >= 0.4) {
            reasons.push('전체적으로 보통 수준의 제목 - 개선 여지 있음');
        } else {
            reasons.push('전체적으로 개선이 필요한 제목 - 여러 측면에서 보완 필요');
        }

        return reasons;
    }

    /**
     * 특별한 강점/약점 이유 생성
     */
    getSpecialReasons(title, scores) {
        const reasons = [];

        // 특별한 강점 식별
        const strengths = [];
        const weaknesses = [];

        Object.entries(scores).forEach(([category, score]) => {
            if (score >= 0.9) {
                strengths.push(category);
            } else if (score < 0.3) {
                weaknesses.push(category);
            }
        });

        if (strengths.length > 0) {
            const strengthNames = strengths.map(s => this.getCategoryName(s)).join(', ');
            reasons.push(`특별한 강점: ${strengthNames} 영역에서 탁월한 성과`);
        }

        if (weaknesses.length > 0) {
            const weaknessNames = weaknesses.map(w => this.getCategoryName(w)).join(', ');
            reasons.push(`개선 필요 영역: ${weaknessNames} 부분 집중 보완 필요`);
        }

        // 균형성 평가
        const scoreValues = Object.values(scores);
        const maxScore = Math.max(...scoreValues);
        const minScore = Math.min(...scoreValues);
        const scoreDiff = maxScore - minScore;

        if (scoreDiff < 0.2) {
            reasons.push('모든 영역에서 균형잡힌 품질 - 일관성 있는 우수함');
        } else if (scoreDiff > 0.6) {
            reasons.push('영역별 품질 편차 큼 - 약점 보완을 통한 전체 품질 향상 가능');
        }

        return reasons;
    }

    /**
     * 카테고리명 한국어 변환
     */
    getCategoryName(category) {
        const categoryNames = {
            'relevance': '관련성',
            'length': '길이',
            'readability': '가독성',
            'seo': 'SEO',
            'engagement': '참여도',
            'compliance': '준수성'
        };

        return categoryNames[category] || category;
    }

    /**
     * 개선 권장사항 생성 (상세 구현)
     * @param {string} title 제목
     * @param {Object} scores 점수들
     * @returns {Array} 권장사항 배열
     */
    generateRecommendations(title, scores) {
        console.log('개선 권장사항 생성 시작:', { title });

        const recommendations = [];

        // 1. 관련성 개선 권장사항
        recommendations.push(...this.getRelevanceRecommendations(title, scores.relevance));

        // 2. 길이 개선 권장사항
        recommendations.push(...this.getLengthRecommendations(title, scores.length));

        // 3. 가독성 개선 권장사항
        recommendations.push(...this.getReadabilityRecommendations(title, scores.readability));

        // 4. SEO 개선 권장사항
        recommendations.push(...this.getSEORecommendations(title, scores.seo));

        // 5. 참여도 개선 권장사항
        recommendations.push(...this.getEngagementRecommendations(title, scores.engagement));

        // 6. 준수성 개선 권장사항
        recommendations.push(...this.getComplianceRecommendations(title, scores.compliance));

        // 7. 우선순위 기반 권장사항
        recommendations.push(...this.getPriorityRecommendations(title, scores));

        // 중복 제거 및 우선순위 정렬
        const uniqueRecommendations = [...new Set(recommendations)];
        const prioritizedRecommendations = this.prioritizeRecommendations(uniqueRecommendations, scores);

        console.log('개선 권장사항 생성 완료:', { 
            title, 
            recommendationCount: prioritizedRecommendations.length 
        });

        return prioritizedRecommendations.slice(0, 8); // 최대 8개
    }

    /**
     * 관련성 개선 권장사항
     */
    getRelevanceRecommendations(title, relevanceScore) {
        const recommendations = [];

        if (relevanceScore < 0.5) {
            recommendations.push('주요 키워드를 제목에 포함하여 콘텐츠 관련성을 높이세요');
            
            if (this.analyzer && this.analyzer.analysis) {
                const topKeywords = this.analyzer.analysis.keyPhrases.slice(0, 3);
                if (topKeywords.length > 0) {
                    const keywordList = topKeywords.map(kp => kp.phrase).join(', ');
                    recommendations.push(`추천 키워드: ${keywordList}`);
                }

                if (this.analyzer.analysis.entities.length > 0) {
                    const topEntity = this.analyzer.analysis.entities[0].text;
                    recommendations.push(`주요 개체명 '${topEntity}' 포함을 고려하세요`);
                }
            }
        }

        if (relevanceScore < 0.3) {
            recommendations.push('제목이 기사 내용과 거리가 멀어 보입니다. 핵심 주제를 더 명확히 반영하세요');
        }

        return recommendations;
    }

    /**
     * 길이 개선 권장사항
     */
    getLengthRecommendations(title, lengthScore) {
        const recommendations = [];
        const chars = [...title].length;
        const words = title.split(/\s+/).length;

        if (lengthScore < 0.5) {
            if (chars < this.mergedFilters.titleLen.min) {
                recommendations.push(`제목이 너무 짧습니다 (${chars}자). 더 구체적인 정보를 추가하세요`);
                recommendations.push('부제목이나 설명을 추가하여 정보량을 늘리세요');
                
                if (words < 4) {
                    recommendations.push('최소 4-5개 단어로 구성하여 의미를 명확히 하세요');
                }
            } else if (chars > this.mergedFilters.titleLen.max) {
                recommendations.push(`제목이 너무 깁니다 (${chars}자). 핵심 내용만 남기고 간결하게 줄이세요`);
                recommendations.push('부가적인 설명이나 수식어를 제거하세요');
                
                if (words > 12) {
                    recommendations.push('10개 이하의 단어로 압축하여 가독성을 높이세요');
                }
            }
        }

        // 최적 길이 제안
        const optimalMin = Math.max(this.mergedFilters.titleLen.min, 25);
        const optimalMax = Math.min(this.mergedFilters.titleLen.max, 60);
        
        if (chars < optimalMin || chars > optimalMax) {
            recommendations.push(`SEO와 가독성을 위해 ${optimalMin}-${optimalMax}자 범위로 조정하세요`);
        }

        return recommendations;
    }

    /**
     * 가독성 개선 권장사항
     */
    getReadabilityRecommendations(title, readabilityScore) {
        const recommendations = [];

        if (readabilityScore < 0.5) {
            // 특수문자 과다 사용
            const specialChars = (title.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
            if (specialChars > 3) {
                recommendations.push('특수문자 사용을 줄여 시각적 복잡성을 낮추세요');
            }

            // 연속 공백
            if (title.includes('  ')) {
                recommendations.push('연속된 공백을 제거하여 형식을 정리하세요');
            }

            // 복잡한 단어 구조
            const avgWordLength = title.replace(/\s/g, '').length / title.split(/\s+/).length;
            if (avgWordLength > 10) {
                recommendations.push('긴 단어나 복합어를 간단한 표현으로 바꾸세요');
            }

            // 전문용어 과다
            const complexTerms = ['패러다임', '시너지', '솔루션', '플랫폼'];
            const complexCount = complexTerms.filter(term => 
                title.toLowerCase().includes(term)
            ).length;
            
            if (complexCount > 1) {
                recommendations.push('전문용어를 일반적인 표현으로 바꿔 이해도를 높이세요');
            }
        }

        if (readabilityScore < 0.3) {
            recommendations.push('문장 구조를 단순화하여 읽기 쉽게 만드세요');
            recommendations.push('핵심 메시지를 앞쪽에 배치하세요');
        }

        return recommendations;
    }

    /**
     * SEO 개선 권장사항
     */
    getSEORecommendations(title, seoScore) {
        const recommendations = [];

        if (seoScore < 0.5) {
            recommendations.push('검색 엔진 최적화를 위해 주요 키워드를 제목 앞부분에 배치하세요');
            
            const chars = [...title].length;
            if (chars < 30) {
                recommendations.push('검색 결과 표시를 위해 제목을 30자 이상으로 늘리세요');
            } else if (chars > 60) {
                recommendations.push('검색 결과에서 잘리지 않도록 60자 이내로 줄이세요');
            }

            if (!/\d/.test(title)) {
                recommendations.push('구체적인 숫자나 연도를 포함하여 검색 친화성을 높이세요');
            }

            // 검색 의도 키워드 제안
            const searchIntentWords = ['방법', '가이드', '분석', '비교', '전망', '동향'];
            const hasSearchIntent = searchIntentWords.some(word => 
                title.toLowerCase().includes(word)
            );
            
            if (!hasSearchIntent) {
                recommendations.push('검색 의도를 반영하는 키워드(분석, 전망, 가이드 등)를 추가하세요');
            }
        }

        if (seoScore < 0.3) {
            recommendations.push('메타 제목으로 사용하기에 부적합합니다. 검색 키워드를 중심으로 재작성하세요');
        }

        return recommendations;
    }

    /**
     * 참여도 개선 권장사항
     */
    getEngagementRecommendations(title, engagementScore) {
        const recommendations = [];

        if (engagementScore < 0.5) {
            // 호기심 유발 요소 부족
            if (!title.includes('?')) {
                recommendations.push('질문형 제목으로 바꿔 독자의 호기심을 유발하세요');
            }

            // 감정적 어필 부족
            const titleLower = title.toLowerCase();
            const emotionalWords = ['혁신', '성장', '기회', '전망', '놀라운', '특별한'];
            const hasEmotional = emotionalWords.some(word => titleLower.includes(word));
            
            if (!hasEmotional) {
                recommendations.push('감정적 어필이 있는 단어를 추가하여 관심도를 높이세요');
            }

            // 구체성 부족
            if (!/\d/.test(title)) {
                recommendations.push('구체적인 숫자나 통계를 포함하여 신뢰성을 높이세요');
            }

            // 실용성 부족
            const utilityWords = ['방법', '팁', '가이드', '노하우', '전략'];
            const hasUtility = utilityWords.some(word => titleLower.includes(word));
            
            if (!hasUtility) {
                recommendations.push('실용적 가치를 나타내는 표현을 추가하세요');
            }
        }

        if (engagementScore < 0.3) {
            recommendations.push('제목이 너무 평범합니다. 독특하거나 흥미로운 관점을 추가하세요');
            recommendations.push('독자의 문제나 관심사와 직접 연결되는 표현을 사용하세요');
        }

        return recommendations;
    }

    /**
     * 준수성 개선 권장사항
     */
    getComplianceRecommendations(title, complianceScore) {
        const recommendations = [];

        if (complianceScore < 0.7) {
            const titleLower = title.toLowerCase();
            
            // 금지 키워드 확인
            const bannedWords = this.mergedFilters.mustExclude || [];
            const foundBanned = bannedWords.filter(banned => 
                titleLower.includes(banned.toLowerCase())
            );
            
            if (foundBanned.length > 0) {
                recommendations.push(`금지된 표현을 제거하세요: ${foundBanned.join(', ')}`);
            }

            // 클릭베이트 확인
            const clickbaitWords = ['충격', '소름', '대박', '미쳤다', '헉'];
            const clickbaitFound = clickbaitWords.filter(word => titleLower.includes(word));
            
            if (clickbaitFound.length > 0) {
                recommendations.push('클릭베이트 표현을 전문적인 용어로 바꾸세요');
            }

            // 과장 표현 확인
            const exaggeratedWords = ['100%', '절대', '무조건', '완벽한'];
            const exaggeratedFound = exaggeratedWords.filter(word => titleLower.includes(word));
            
            if (exaggeratedFound.length > 0) {
                recommendations.push('과장된 표현을 객관적인 표현으로 수정하세요');
            }
        }

        if (complianceScore < 0.5) {
            recommendations.push('브랜드 가이드라인을 검토하고 준수하는 제목으로 수정하세요');
            recommendations.push('신뢰성 있고 전문적인 톤으로 재작성하세요');
        }

        return recommendations;
    }

    /**
     * 우선순위 기반 권장사항
     */
    getPriorityRecommendations(title, scores) {
        const recommendations = [];
        
        // 가장 낮은 점수 영역 식별
        const sortedScores = Object.entries(scores).sort((a, b) => a[1] - b[1]);
        const lowestCategory = sortedScores[0];
        
        if (lowestCategory[1] < 0.4) {
            const categoryName = this.getCategoryName(lowestCategory[0]);
            recommendations.push(`우선 개선 영역: ${categoryName} 점수가 가장 낮습니다 (${lowestCategory[1].toFixed(2)})`);
        }

        // 전체 점수가 낮은 경우
        const overallScore = this.calculateOverallScore(scores);
        if (overallScore < 0.4) {
            recommendations.push('전체적인 품질 개선이 필요합니다. 단계적으로 각 영역을 보완하세요');
        }

        // 균형성 개선
        const scoreValues = Object.values(scores);
        const maxScore = Math.max(...scoreValues);
        const minScore = Math.min(...scoreValues);
        
        if (maxScore - minScore > 0.5) {
            recommendations.push('영역별 품질 편차가 큽니다. 약점 영역을 집중 보완하세요');
        }

        return recommendations;
    }

    /**
     * 권장사항 우선순위 정렬
     */
    prioritizeRecommendations(recommendations, scores) {
        // 점수가 낮은 영역의 권장사항을 우선순위로 정렬
        const priorityOrder = Object.entries(scores)
            .sort((a, b) => a[1] - b[1])
            .map(entry => entry[0]);

        const prioritized = [];
        const remaining = [...recommendations];

        // 우선순위 순서대로 관련 권장사항 추가
        priorityOrder.forEach(category => {
            const categoryName = this.getCategoryName(category);
            const categoryRecommendations = remaining.filter(rec => 
                rec.includes(categoryName) || this.isRelatedToCategory(rec, category)
            );
            
            prioritized.push(...categoryRecommendations);
            categoryRecommendations.forEach(rec => {
                const index = remaining.indexOf(rec);
                if (index > -1) remaining.splice(index, 1);
            });
        });

        // 나머지 권장사항 추가
        prioritized.push(...remaining);

        return prioritized;
    }

    /**
     * 권장사항이 특정 카테고리와 관련있는지 확인
     */
    isRelatedToCategory(recommendation, category) {
        const categoryKeywords = {
            'relevance': ['키워드', '관련성', '주제', '내용'],
            'length': ['길이', '자', '단어', '간결', '구체적'],
            'readability': ['가독성', '읽기', '이해', '복잡', '단순'],
            'seo': ['검색', 'SEO', '최적화', '키워드'],
            'engagement': ['참여', '관심', '호기심', '클릭', '흥미'],
            'compliance': ['준수', '가이드라인', '금지', '클릭베이트', '브랜드']
        };

        const keywords = categoryKeywords[category] || [];
        return keywords.some(keyword => recommendation.includes(keyword));
    }
}

export { TitleQualityEvaluator };