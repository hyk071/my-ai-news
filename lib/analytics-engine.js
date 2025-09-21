/**
 * 지능형 제목 생성 시스템 분석 엔진
 * 사용자 행동, 제목 성능, 트렌드를 분석하여 인사이트를 제공합니다.
 */

class AnalyticsEngine {
    constructor() {
        this.analysisData = {
            titlePerformance: new Map(), // 제목별 성능 데이터
            userBehavior: [],            // 사용자 행동 패턴
            contentPatterns: new Map(),  // 콘텐츠 패턴 분석
            temporalTrends: [],          // 시간별 트렌드
            abTestResults: new Map()     // A/B 테스트 결과
        };
        
        this.insights = [];
        this.lastAnalysisTime = Date.now();
    }

    /**
     * 제목 성능 데이터 기록
     */
    recordTitlePerformance(title, metrics) {
        const titleKey = this.normalizeTitle(title);
        
        if (!this.analysisData.titlePerformance.has(titleKey)) {
            this.analysisData.titlePerformance.set(titleKey, {
                title: title,
                impressions: 0,
                clicks: 0,
                qualityScore: 0,
                userRatings: [],
                sources: new Set(),
                contentTypes: new Set(),
                timestamps: []
            });
        }
        
        const data = this.analysisData.titlePerformance.get(titleKey);
        data.impressions += metrics.impressions || 0;
        data.clicks += metrics.clicks || 0;
        data.qualityScore = metrics.qualityScore || data.qualityScore;
        
        if (metrics.userRating) {
            data.userRatings.push(metrics.userRating);
        }
        
        if (metrics.source) {
            data.sources.add(metrics.source);
        }
        
        if (metrics.contentType) {
            data.contentTypes.add(metrics.contentType);
        }
        
        data.timestamps.push(Date.now());
    }

    /**
     * 사용자 행동 패턴 기록
     */
    recordUserBehavior(userId, action, context) {
        this.analysisData.userBehavior.push({
            userId,
            action,
            context,
            timestamp: Date.now()
        });
        
        // 최근 1000개 기록만 유지
        if (this.analysisData.userBehavior.length > 1000) {
            this.analysisData.userBehavior = this.analysisData.userBehavior.slice(-1000);
        }
    }

    /**
     * 콘텐츠 패턴 기록
     */
    recordContentPatterns(content, tags, generatedTitles) {
        const contentKey = this.generateContentKey(content, tags);
        
        if (!this.analysisData.contentPatterns.has(contentKey)) {
            this.analysisData.contentPatterns.set(contentKey, {
                contentLength: content.length,
                tags: [...tags],
                titleVariations: [],
                successfulPatterns: [],
                averageQuality: 0,
                count: 0
            });
        }
        
        const pattern = this.analysisData.contentPatterns.get(contentKey);
        pattern.count++;
        
        generatedTitles.forEach(titleData => {
            pattern.titleVariations.push({
                title: titleData.title,
                source: titleData.source,
                score: titleData.score,
                timestamp: Date.now()
            });
            
            if (titleData.score > 0.7) {
                pattern.successfulPatterns.push({
                    title: titleData.title,
                    source: titleData.source,
                    score: titleData.score
                });
            }
        });
        
        // 평균 품질 업데이트
        const totalScore = pattern.titleVariations.reduce((sum, t) => sum + t.score, 0);
        pattern.averageQuality = totalScore / pattern.titleVariations.length;
    }

    /**
     * 시간별 트렌드 분석
     */
    recordTemporalTrend(metrics) {
        this.analysisData.temporalTrends.push({
            timestamp: Date.now(),
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            ...metrics
        });
        
        // 최근 7일 데이터만 유지
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.analysisData.temporalTrends = this.analysisData.temporalTrends
            .filter(trend => trend.timestamp > weekAgo);
    }

    /**
     * A/B 테스트 결과 기록
     */
    recordABTestResult(testId, variant, outcome) {
        if (!this.analysisData.abTestResults.has(testId)) {
            this.analysisData.abTestResults.set(testId, {
                variants: new Map(),
                startTime: Date.now(),
                totalSamples: 0
            });
        }
        
        const test = this.analysisData.abTestResults.get(testId);
        
        if (!test.variants.has(variant)) {
            test.variants.set(variant, {
                samples: 0,
                successes: 0,
                totalScore: 0,
                outcomes: []
            });
        }
        
        const variantData = test.variants.get(variant);
        variantData.samples++;
        variantData.outcomes.push(outcome);
        
        if (outcome.success) {
            variantData.successes++;
        }
        
        if (outcome.score) {
            variantData.totalScore += outcome.score;
        }
        
        test.totalSamples++;
    }

    /**
     * 종합 분석 실행
     */
    runComprehensiveAnalysis() {
        const titlePerformanceAnalysis = this.analyzeTitlePerformance();
        const userBehaviorAnalysis = this.analyzeUserBehavior();
        const contentPatternAnalysis = this.analyzeContentPatterns();
        const temporalAnalysis = this.analyzeTemporalTrends();
        const abTestAnalysis = this.analyzeABTests();
        const insights = this.generateInsights();
        
        const analysis = {
            titlePerformanceAnalysis,
            userBehaviorAnalysis,
            contentPatternAnalysis,
            temporalAnalysis,
            abTestAnalysis,
            insights,
            recommendations: [] // 순환 참조 방지를 위해 별도 호출
        };
        
        // 권장사항은 별도로 생성
        analysis.recommendations = this.generateRecommendations();
        
        this.lastAnalysisTime = Date.now();
        return analysis;
    }

    /**
     * 제목 성능 분석
     */
    analyzeTitlePerformance() {
        const performances = Array.from(this.analysisData.titlePerformance.values());
        
        // CTR 계산
        const titlesWithCTR = performances
            .filter(p => p.impressions > 0)
            .map(p => ({
                ...p,
                ctr: p.clicks / p.impressions,
                avgRating: p.userRatings.length > 0 
                    ? p.userRatings.reduce((sum, r) => sum + r, 0) / p.userRatings.length 
                    : 0
            }))
            .sort((a, b) => b.ctr - a.ctr);

        // 상위/하위 성과 제목
        const topPerformers = titlesWithCTR.slice(0, 10);
        const bottomPerformers = titlesWithCTR.slice(-10);

        // 소스별 성능
        const sourcePerformance = this.analyzePerformanceBySource(performances);

        // 길이별 성능
        const lengthPerformance = this.analyzePerformanceByLength(titlesWithCTR);

        return {
            totalTitles: performances.length,
            averageCTR: titlesWithCTR.reduce((sum, t) => sum + t.ctr, 0) / titlesWithCTR.length,
            averageQuality: performances.reduce((sum, p) => sum + p.qualityScore, 0) / performances.length,
            topPerformers,
            bottomPerformers,
            sourcePerformance,
            lengthPerformance,
            trendAnalysis: titlesWithCTR.length > 0 ? this.analyzeTitleTrends(titlesWithCTR) : 'insufficient_data'
        };
    }

    /**
     * 사용자 행동 분석
     */
    analyzeUserBehavior() {
        const behaviors = this.analysisData.userBehavior;
        
        // 액션별 빈도
        const actionFrequency = {};
        behaviors.forEach(b => {
            actionFrequency[b.action] = (actionFrequency[b.action] || 0) + 1;
        });

        // 사용자별 패턴
        const userPatterns = {};
        behaviors.forEach(b => {
            if (!userPatterns[b.userId]) {
                userPatterns[b.userId] = {
                    actions: [],
                    sessionCount: 0,
                    avgSessionLength: 0
                };
            }
            userPatterns[b.userId].actions.push(b);
        });

        // 시간대별 활동
        const hourlyActivity = new Array(24).fill(0);
        behaviors.forEach(b => {
            const hour = new Date(b.timestamp).getHours();
            hourlyActivity[hour]++;
        });

        return {
            totalActions: behaviors.length,
            uniqueUsers: Object.keys(userPatterns).length,
            actionFrequency,
            mostActiveHours: this.findPeakHours(hourlyActivity),
            userEngagementScore: this.calculateEngagementScore(userPatterns),
            behaviorPatterns: this.identifyBehaviorPatterns(behaviors)
        };
    }

    /**
     * 콘텐츠 패턴 분석
     */
    analyzeContentPatterns() {
        try {
            const patterns = Array.from(this.analysisData.contentPatterns.values());
            
            // 성공적인 패턴 식별
            const successfulPatterns = patterns
                .filter(p => p && p.averageQuality > 0.7)
                .sort((a, b) => (b.averageQuality || 0) - (a.averageQuality || 0));

            // 태그별 성능
            let tagPerformance = {};
            try {
                tagPerformance = this.analyzeTagPerformance(patterns);
            } catch (error) {
                console.warn('태그 성능 분석 중 오류:', error.message);
            }

            // 콘텐츠 길이별 성능
            let lengthPerformance = {};
            try {
                lengthPerformance = this.analyzeContentLengthPerformance(patterns);
            } catch (error) {
                console.warn('콘텐츠 길이 성능 분석 중 오류:', error.message);
            }

            // 최적 패턴 식별
            let optimalPatterns = [];
            try {
                optimalPatterns = this.identifyOptimalPatterns(patterns);
            } catch (error) {
                console.warn('최적 패턴 식별 중 오류:', error.message);
            }

            return {
                totalPatterns: patterns.length,
                successfulPatterns: successfulPatterns.slice(0, 20),
                tagPerformance,
                lengthPerformance,
                optimalPatterns
            };
        } catch (error) {
            console.warn('콘텐츠 패턴 분석 중 오류:', error.message);
            return {
                totalPatterns: 0,
                successfulPatterns: [],
                tagPerformance: {},
                lengthPerformance: {},
                optimalPatterns: []
            };
        }
    }

    /**
     * 시간별 트렌드 분석
     */
    analyzeTemporalTrends() {
        const trends = this.analysisData.temporalTrends;
        
        // 시간대별 성능
        const hourlyPerformance = this.groupByHour(trends);
        
        // 요일별 성능
        const dailyPerformance = this.groupByDayOfWeek(trends);
        
        // 트렌드 방향
        const trendDirection = this.calculateTrendDirection(trends);

        return {
            hourlyPerformance,
            dailyPerformance,
            trendDirection,
            seasonalPatterns: this.identifySeasonalPatterns(trends),
            peakPerformanceTimes: this.identifyPeakTimes(trends)
        };
    }

    /**
     * A/B 테스트 분석
     */
    analyzeABTests() {
        const results = {};
        
        for (const [testId, test] of this.analysisData.abTestResults) {
            const variants = Array.from(test.variants.entries()).map(([variant, data]) => ({
                variant,
                samples: data.samples,
                successRate: data.successes / data.samples,
                averageScore: data.totalScore / data.samples,
                confidence: this.calculateStatisticalSignificance(data, test.totalSamples)
            }));
            
            results[testId] = {
                totalSamples: test.totalSamples,
                duration: Date.now() - test.startTime,
                variants,
                winner: this.determineWinner(variants),
                statisticalSignificance: this.calculateOverallSignificance(variants)
            };
        }
        
        return results;
    }

    /**
     * 인사이트 생성
     */
    generateInsights() {
        const insights = [];
        
        try {
            // 제목 성능 인사이트
            const titleAnalysis = this.analyzeTitlePerformance();
            if (titleAnalysis && titleAnalysis.topPerformers && titleAnalysis.topPerformers.length > 0) {
                const bestTitle = titleAnalysis.topPerformers[0];
                if (bestTitle && bestTitle.title && bestTitle.ctr !== undefined) {
                    insights.push({
                        type: 'title_performance',
                        priority: 'high',
                        title: '최고 성과 제목 패턴 발견',
                        description: `"${bestTitle.title}"이 ${(bestTitle.ctr * 100).toFixed(1)}% CTR로 최고 성과를 보였습니다.`,
                        actionable: true,
                        recommendation: '이와 유사한 패턴의 제목을 더 많이 생성해보세요.'
                    });
                }
            }

            // 소스별 성능 인사이트
            if (titleAnalysis && titleAnalysis.sourcePerformance) {
                const sourceEntries = Object.entries(titleAnalysis.sourcePerformance);
                if (sourceEntries.length > 0) {
                    const bestSource = sourceEntries
                        .sort(([,a], [,b]) => (b.averageScore || 0) - (a.averageScore || 0))[0];
                    
                    if (bestSource && bestSource[1] && bestSource[1].averageScore > 0) {
                        insights.push({
                            type: 'source_performance',
                            priority: 'medium',
                            title: '최적 제목 생성 방식 식별',
                            description: `${bestSource[0]} 방식이 평균 ${bestSource[1].averageScore.toFixed(2)} 점으로 가장 우수합니다.`,
                            actionable: true,
                            recommendation: '이 방식의 가중치를 높여 더 자주 사용하도록 조정하세요.'
                        });
                    }
                }
            }

            // 시간대별 성능 인사이트
            const temporalAnalysis = this.analyzeTemporalTrends();
            if (temporalAnalysis && temporalAnalysis.peakPerformanceTimes && temporalAnalysis.peakPerformanceTimes.length > 0) {
                const peakTime = temporalAnalysis.peakPerformanceTimes[0];
                if (peakTime && peakTime.hour !== undefined) {
                    insights.push({
                        type: 'temporal_pattern',
                        priority: 'low',
                        title: '최적 발행 시간대 발견',
                        description: `${peakTime.hour}시경에 발행된 콘텐츠의 성과가 가장 좋습니다.`,
                        actionable: true,
                        recommendation: '중요한 콘텐츠는 이 시간대에 발행하는 것을 고려해보세요.'
                    });
                }
            }
        } catch (error) {
            console.warn('인사이트 생성 중 오류:', error.message);
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * 권장사항 생성
     */
    generateRecommendations() {
        const recommendations = [];
        // 순환 참조 방지를 위해 직접 분석 수행
        const titleAnalysis = this.analyzeTitlePerformance();
        const contentAnalysis = this.analyzeContentPatterns();

        // 제목 최적화 권장사항
        if (titleAnalysis.averageCTR < 0.05) {
            recommendations.push({
                category: 'title_optimization',
                priority: 'high',
                title: '제목 클릭률 개선 필요',
                description: '현재 평균 CTR이 5% 미만입니다. 더 매력적인 제목 생성이 필요합니다.',
                actions: [
                    '감정적 어휘 사용 증가',
                    '호기심 유발 요소 추가',
                    '숫자나 통계 활용',
                    '질문형 제목 시도'
                ]
            });
        }

        // 콘텐츠 패턴 권장사항
        const successfulPatterns = contentAnalysis.successfulPatterns;
        if (successfulPatterns.length > 0) {
            recommendations.push({
                category: 'content_strategy',
                priority: 'medium',
                title: '성공적인 콘텐츠 패턴 활용',
                description: '특정 콘텐츠 패턴에서 높은 성과를 보이고 있습니다.',
                actions: [
                    `${successfulPatterns[0].tags.join(', ')} 태그 조합 활용`,
                    `${Math.round(successfulPatterns[0].contentLength / 100) * 100}자 내외 콘텐츠 길이 유지`,
                    '성공 패턴을 템플릿화하여 재사용'
                ]
            });
        }

        // A/B 테스트 권장사항
        const abTests = this.analyzeABTests();
        for (const [testId, result] of Object.entries(abTests)) {
            if (result.statisticalSignificance > 0.95) {
                recommendations.push({
                    category: 'ab_test_results',
                    priority: 'high',
                    title: `A/B 테스트 결과 적용 (${testId})`,
                    description: `통계적으로 유의미한 결과가 나왔습니다.`,
                    actions: [
                        `${result.winner.variant} 변형을 기본값으로 적용`,
                        '유사한 패턴으로 추가 테스트 진행',
                        '결과를 다른 콘텐츠 유형에도 적용 검토'
                    ]
                });
            }
        }

        return recommendations;
    }

    // 유틸리티 메서드들
    normalizeTitle(title) {
        return title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    }

    generateContentKey(content, tags) {
        const contentHash = this.simpleHash(content.substring(0, 200));
        const tagHash = this.simpleHash(tags.sort().join(','));
        return `${contentHash}_${tagHash}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer로 변환
        }
        return Math.abs(hash).toString(36);
    }

    analyzePerformanceBySource(performances) {
        const sourceStats = {};
        
        performances.forEach(p => {
            p.sources.forEach(source => {
                if (!sourceStats[source]) {
                    sourceStats[source] = {
                        count: 0,
                        totalScore: 0,
                        totalClicks: 0,
                        totalImpressions: 0
                    };
                }
                
                sourceStats[source].count++;
                sourceStats[source].totalScore += p.qualityScore;
                sourceStats[source].totalClicks += p.clicks;
                sourceStats[source].totalImpressions += p.impressions;
            });
        });

        // 평균 계산
        for (const source in sourceStats) {
            const stats = sourceStats[source];
            stats.averageScore = stats.totalScore / stats.count;
            stats.averageCTR = stats.totalImpressions > 0 
                ? stats.totalClicks / stats.totalImpressions 
                : 0;
        }

        return sourceStats;
    }

    analyzePerformanceByLength(titles) {
        if (!titles || titles.length === 0) {
            return {};
        }

        const lengthBuckets = {
            short: { min: 0, max: 30, titles: [] },
            medium: { min: 31, max: 60, titles: [] },
            long: { min: 61, max: 100, titles: [] },
            veryLong: { min: 101, max: Infinity, titles: [] }
        };

        titles.forEach(title => {
            if (!title || !title.title) return;
            
            const length = title.title.length;
            for (const [bucket, range] of Object.entries(lengthBuckets)) {
                if (length >= range.min && length <= range.max) {
                    range.titles.push(title);
                    break;
                }
            }
        });

        // 각 버킷별 평균 성능 계산
        const performance = {};
        for (const [bucket, data] of Object.entries(lengthBuckets)) {
            if (data.titles.length > 0) {
                performance[bucket] = {
                    count: data.titles.length,
                    averageCTR: data.titles.reduce((sum, t) => sum + (t.ctr || 0), 0) / data.titles.length,
                    averageQuality: data.titles.reduce((sum, t) => sum + (t.qualityScore || 0), 0) / data.titles.length,
                    averageLength: data.titles.reduce((sum, t) => sum + (t.title ? t.title.length : 0), 0) / data.titles.length
                };
            }
        }

        return performance;
    }

    calculateStatisticalSignificance(variantData, totalSamples) {
        // 간단한 통계적 유의성 계산 (실제로는 더 정교한 방법 사용)
        const sampleSize = variantData.samples;
        const successRate = variantData.successes / sampleSize;
        
        if (sampleSize < 30) return 0; // 샘플 크기가 너무 작음
        
        // 신뢰구간 계산 (95% 신뢰도)
        const standardError = Math.sqrt((successRate * (1 - successRate)) / sampleSize);
        const marginOfError = 1.96 * standardError;
        
        return Math.min(0.99, Math.max(0, 1 - (marginOfError * 2)));
    }

    determineWinner(variants) {
        return variants.reduce((winner, current) => 
            current.successRate > winner.successRate ? current : winner
        );
    }

    calculateOverallSignificance(variants) {
        if (variants.length < 2) return 0;
        
        const sorted = variants.sort((a, b) => b.successRate - a.successRate);
        const best = sorted[0];
        const second = sorted[1];
        
        const difference = best.successRate - second.successRate;
        const combinedSamples = best.samples + second.samples;
        
        // 차이가 클수록, 샘플이 많을수록 높은 신뢰도
        return Math.min(0.99, (difference * Math.sqrt(combinedSamples)) / 2);
    }

    findPeakHours(hourlyActivity) {
        const maxActivity = Math.max(...hourlyActivity);
        return hourlyActivity
            .map((activity, hour) => ({ hour, activity }))
            .filter(h => h.activity > maxActivity * 0.8)
            .sort((a, b) => b.activity - a.activity);
    }

    calculateEngagementScore(userPatterns) {
        const users = Object.values(userPatterns);
        if (users.length === 0) return 0;
        
        const avgActionsPerUser = users.reduce((sum, user) => sum + user.actions.length, 0) / users.length;
        const activeUsers = users.filter(user => user.actions.length > 1).length;
        const engagementRate = activeUsers / users.length;
        
        return (avgActionsPerUser * engagementRate) / 10; // 0-1 스케일로 정규화
    }

    identifyBehaviorPatterns(behaviors) {
        // 간단한 패턴 식별 (실제로는 더 정교한 분석 필요)
        const patterns = [];
        
        // 연속 액션 패턴
        const actionSequences = {};
        for (let i = 0; i < behaviors.length - 1; i++) {
            const current = behaviors[i].action;
            const next = behaviors[i + 1].action;
            const sequence = `${current} -> ${next}`;
            
            actionSequences[sequence] = (actionSequences[sequence] || 0) + 1;
        }
        
        // 가장 빈번한 패턴들
        const topSequences = Object.entries(actionSequences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        patterns.push({
            type: 'action_sequences',
            data: topSequences
        });
        
        return patterns;
    }

    /**
     * 제목 트렌드 분석
     */
    analyzeTitleTrends(titles) {
        if (titles.length < 5) return 'insufficient_data';
        
        // 최근 제목들의 성과 트렌드 분석
        const recent = titles.slice(-10);
        const older = titles.slice(0, -10);
        
        if (older.length === 0) return 'insufficient_data';
        
        const recentAvgCTR = recent.reduce((sum, t) => sum + t.ctr, 0) / recent.length;
        const olderAvgCTR = older.reduce((sum, t) => sum + t.ctr, 0) / older.length;
        
        if (recentAvgCTR > olderAvgCTR * 1.1) return 'improving';
        if (recentAvgCTR < olderAvgCTR * 0.9) return 'declining';
        return 'stable';
    }

    /**
     * 태그별 성능 분석
     */
    analyzeTagPerformance(patterns) {
        const tagStats = {};
        
        if (!patterns || patterns.length === 0) {
            return {};
        }
        
        patterns.forEach(pattern => {
            if (!pattern || !pattern.tags || !Array.isArray(pattern.tags)) {
                return;
            }
            
            pattern.tags.forEach(tag => {
                if (!tag) return;
                
                if (!tagStats[tag]) {
                    tagStats[tag] = {
                        count: 0,
                        totalQuality: 0,
                        successCount: 0
                    };
                }
                
                tagStats[tag].count++;
                tagStats[tag].totalQuality += pattern.averageQuality || 0;
                
                if ((pattern.averageQuality || 0) > 0.7) {
                    tagStats[tag].successCount++;
                }
            });
        });
        
        // 평균 계산
        const performance = {};
        for (const [tag, stats] of Object.entries(tagStats)) {
            if (stats.count > 0) {
                performance[tag] = {
                    averageQuality: stats.totalQuality / stats.count,
                    successRate: stats.successCount / stats.count,
                    frequency: stats.count
                };
            }
        }
        
        return performance;
    }

    /**
     * 콘텐츠 길이별 성능 분석
     */
    analyzeContentLengthPerformance(patterns) {
        const lengthBuckets = {
            short: { min: 0, max: 500, patterns: [] },
            medium: { min: 501, max: 1500, patterns: [] },
            long: { min: 1501, max: 3000, patterns: [] },
            veryLong: { min: 3001, max: Infinity, patterns: [] }
        };
        
        patterns.forEach(pattern => {
            const length = pattern.contentLength;
            for (const [bucket, range] of Object.entries(lengthBuckets)) {
                if (length >= range.min && length <= range.max) {
                    range.patterns.push(pattern);
                    break;
                }
            }
        });
        
        const performance = {};
        for (const [bucket, data] of Object.entries(lengthBuckets)) {
            if (data.patterns.length > 0) {
                performance[bucket] = {
                    count: data.patterns.length,
                    averageQuality: data.patterns.reduce((sum, p) => sum + p.averageQuality, 0) / data.patterns.length,
                    averageLength: data.patterns.reduce((sum, p) => sum + p.contentLength, 0) / data.patterns.length
                };
            }
        }
        
        return performance;
    }

    /**
     * 최적 패턴 식별
     */
    identifyOptimalPatterns(patterns) {
        if (!patterns || patterns.length === 0) {
            return [];
        }
        
        return patterns
            .filter(p => p && (p.averageQuality || 0) > 0.8 && (p.count || 0) > 2)
            .sort((a, b) => (b.averageQuality || 0) - (a.averageQuality || 0))
            .slice(0, 10)
            .map(p => ({
                tags: p.tags || [],
                contentLength: p.contentLength || 0,
                averageQuality: p.averageQuality || 0,
                sampleSize: p.count || 0,
                successfulPatterns: (p.successfulPatterns || []).slice(0, 3)
            }));
    }

    /**
     * 시간대별 그룹화
     */
    groupByHour(trends) {
        const hourlyData = new Array(24).fill(null).map(() => ({
            requests: 0,
            totalQuality: 0,
            totalResponseTime: 0,
            count: 0
        }));
        
        trends.forEach(trend => {
            const data = hourlyData[trend.hour];
            data.requests += trend.requests || 0;
            data.totalQuality += (trend.averageQuality || 0) * (trend.requests || 1);
            data.totalResponseTime += (trend.averageResponseTime || 0) * (trend.requests || 1);
            data.count += trend.requests || 1;
        });
        
        return hourlyData.map((data, hour) => ({
            hour,
            averageRequests: data.requests / Math.max(data.count, 1),
            averageQuality: data.totalQuality / Math.max(data.count, 1),
            averageResponseTime: data.totalResponseTime / Math.max(data.count, 1)
        }));
    }

    /**
     * 요일별 그룹화
     */
    groupByDayOfWeek(trends) {
        const dailyData = new Array(7).fill(null).map(() => ({
            requests: 0,
            totalQuality: 0,
            totalResponseTime: 0,
            count: 0
        }));
        
        trends.forEach(trend => {
            const data = dailyData[trend.dayOfWeek];
            data.requests += trend.requests || 0;
            data.totalQuality += (trend.averageQuality || 0) * (trend.requests || 1);
            data.totalResponseTime += (trend.averageResponseTime || 0) * (trend.requests || 1);
            data.count += trend.requests || 1;
        });
        
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return dailyData.map((data, day) => ({
            day: dayNames[day],
            averageRequests: data.requests / Math.max(data.count, 1),
            averageQuality: data.totalQuality / Math.max(data.count, 1),
            averageResponseTime: data.totalResponseTime / Math.max(data.count, 1)
        }));
    }

    /**
     * 트렌드 방향 계산
     */
    calculateTrendDirection(trends) {
        if (trends.length < 10) return 'insufficient_data';
        
        const recent = trends.slice(-5);
        const older = trends.slice(-10, -5);
        
        const recentAvg = recent.reduce((sum, t) => sum + (t.averageQuality || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, t) => sum + (t.averageQuality || 0), 0) / older.length;
        
        if (recentAvg > olderAvg * 1.05) return 'improving';
        if (recentAvg < olderAvg * 0.95) return 'declining';
        return 'stable';
    }

    /**
     * 계절적 패턴 식별
     */
    identifySeasonalPatterns(trends) {
        // 간단한 구현 - 실제로는 더 정교한 시계열 분석 필요
        const patterns = [];
        
        // 주간 패턴
        const weeklyPattern = this.groupByDayOfWeek(trends);
        const bestDay = weeklyPattern.reduce((best, current) => 
            current.averageQuality > best.averageQuality ? current : best
        );
        
        patterns.push({
            type: 'weekly',
            pattern: `${bestDay.day}요일에 가장 높은 품질 (${bestDay.averageQuality.toFixed(2)})`
        });
        
        // 일간 패턴
        const hourlyPattern = this.groupByHour(trends);
        const bestHour = hourlyPattern.reduce((best, current) => 
            current.averageQuality > best.averageQuality ? current : best
        );
        
        patterns.push({
            type: 'daily',
            pattern: `${bestHour.hour}시에 가장 높은 품질 (${bestHour.averageQuality.toFixed(2)})`
        });
        
        return patterns;
    }

    /**
     * 피크 시간대 식별
     */
    identifyPeakTimes(trends) {
        const hourlyData = this.groupByHour(trends);
        
        return hourlyData
            .filter(h => h.averageQuality > 0)
            .sort((a, b) => b.averageQuality - a.averageQuality)
            .slice(0, 3);
    }

    /**
     * 분석 결과 내보내기
     */
    exportAnalysis() {
        return {
            exportTime: new Date().toISOString(),
            lastAnalysisTime: this.lastAnalysisTime,
            comprehensiveAnalysis: this.runComprehensiveAnalysis(),
            rawData: {
                titlePerformance: Array.from(this.analysisData.titlePerformance.entries()),
                userBehavior: this.analysisData.userBehavior,
                contentPatterns: Array.from(this.analysisData.contentPatterns.entries()),
                temporalTrends: this.analysisData.temporalTrends,
                abTestResults: Array.from(this.analysisData.abTestResults.entries())
            }
        };
    }
}

// 싱글톤 인스턴스
let analyticsInstance = null;

export function getAnalyticsEngine() {
    if (!analyticsInstance) {
        analyticsInstance = new AnalyticsEngine();
    }
    return analyticsInstance;
}

export { AnalyticsEngine };