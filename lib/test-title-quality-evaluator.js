/**
 * TitleQualityEvaluator 테스트 파일
 * 제목 품질 평가 시스템의 모든 기능을 테스트
 */

import { TitleQualityEvaluator } from './title-quality-evaluator.js';
import { ContentAnalyzer } from './content-analyzer.js';

// 테스트용 샘플 기사 데이터
const sampleContent = `# 생성형 AI가 반도체 산업에 미치는 영향

## 개요

생성형 AI 기술의 급속한 발전이 반도체 산업 전반에 큰 변화를 가져오고 있다. 
NVIDIA의 GPU 매출이 300% 증가하면서 AI 칩 시장의 성장세가 뚜렷해지고 있다.

## 시장 현황

삼성전자와 SK하이닉스는 AI 메모리 반도체 개발에 총 5조원을 투자한다고 발표했다. 
전문가들의 97%가 향후 3년간 AI 반도체 수요가 지속 증가할 것으로 전망한다고 밝혔다.`;

const sampleTags = ['생성형 AI', '반도체', 'NVIDIA'];
const sampleSubject = 'AI 기술이 반도체 산업에 미치는 영향과 시장 전망';
const sampleTone = '분석적';

// 테스트용 제목들
const testTitles = {
    excellent: 'AI 반도체 시장 300% 성장, 삼성과 NVIDIA 경쟁 가속화',
    good: '생성형 AI 기술이 반도체 산업에 미치는 영향 분석',
    average: 'AI 기술 발전과 반도체 시장 변화',
    poor: 'AI 대박! 반도체 완전 혁신!!',
    veryPoor: '충격! 믿을 수 없는 AI 반도체 소식'
};

/**
 * 기본 품질 평가 테스트
 */
function testBasicEvaluation() {
    console.log('\n=== 기본 품질 평가 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    Object.entries(testTitles).forEach(([level, title]) => {
        console.log(`\n--- ${level.toUpperCase()} 제목 평가 ---`);
        console.log(`제목: "${title}"`);
        
        const evaluation = evaluator.evaluateTitle(title);
        
        console.log('점수 결과:');
        console.log(`- 관련성: ${evaluation.scores.relevance.toFixed(2)}`);
        console.log(`- 길이: ${evaluation.scores.length.toFixed(2)}`);
        console.log(`- 가독성: ${evaluation.scores.readability.toFixed(2)}`);
        console.log(`- SEO: ${evaluation.scores.seo.toFixed(2)}`);
        console.log(`- 참여도: ${evaluation.scores.engagement.toFixed(2)}`);
        console.log(`- 준수성: ${evaluation.scores.compliance.toFixed(2)}`);
        console.log(`- 전체: ${evaluation.overallScore.toFixed(2)}`);
        console.log(`- 필터 통과: ${evaluation.passesFilters ? '✅' : '❌'}`);
        
        if (evaluation.reasons.length > 0) {
            console.log('평가 이유:');
            evaluation.reasons.slice(0, 3).forEach(reason => {
                console.log(`  • ${reason}`);
            });
        }
        
        if (evaluation.recommendations.length > 0) {
            console.log('개선 권장사항:');
            evaluation.recommendations.slice(0, 2).forEach(rec => {
                console.log(`  • ${rec}`);
            });
        }
    });
}

/**
 * 개별 점수 계산 테스트
 */
function testIndividualScores() {
    console.log('\n=== 개별 점수 계산 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    const testTitle = testTitles.good;
    console.log(`테스트 제목: "${testTitle}"`);
    
    console.log('\n개별 점수 상세 분석:');
    
    // 관련성 점수
    const relevanceScore = evaluator.calculateRelevanceScore(testTitle);
    console.log(`관련성 점수: ${relevanceScore.toFixed(3)}`);
    
    // 길이 점수
    const lengthScore = evaluator.calculateLengthScore(testTitle);
    console.log(`길이 점수: ${lengthScore.toFixed(3)}`);
    
    // 가독성 점수
    const readabilityScore = evaluator.calculateReadabilityScore(testTitle);
    console.log(`가독성 점수: ${readabilityScore.toFixed(3)}`);
    
    // SEO 점수
    const seoScore = evaluator.calculateSEOScore(testTitle);
    console.log(`SEO 점수: ${seoScore.toFixed(3)}`);
    
    // 참여도 점수
    const engagementScore = evaluator.calculateEngagementScore(testTitle);
    console.log(`참여도 점수: ${engagementScore.toFixed(3)}`);
    
    // 준수성 점수
    const complianceScore = evaluator.calculateComplianceScore(testTitle);
    console.log(`준수성 점수: ${complianceScore.toFixed(3)}`);
}

/**
 * 필터링 테스트
 */
function testFiltering() {
    console.log('\n=== 필터링 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    
    // 엄격한 필터 설정
    const strictFilters = {
        titleLen: { min: 20, max: 50 },
        mustInclude: ['AI'],
        mustExclude: ['충격', '대박', '완전'],
        minRelevanceScore: 0.6,
        minLengthScore: 0.5,
        minReadabilityScore: 0.5,
        minSEOScore: 0.4,
        minEngagementScore: 0.4,
        minComplianceScore: 0.7,
        minOverallScore: 0.5
    };
    
    const evaluator = new TitleQualityEvaluator(analyzer, strictFilters);
    
    Object.entries(testTitles).forEach(([level, title]) => {
        console.log(`\n${level}: "${title}"`);
        
        const evaluation = evaluator.evaluateTitle(title);
        const passed = evaluation.passesFilters;
        
        console.log(`필터 통과: ${passed ? '✅ 통과' : '❌ 실패'}`);
        console.log(`전체 점수: ${evaluation.overallScore.toFixed(2)}`);
        
        if (!passed && evaluation.reasons.length > 0) {
            console.log('실패 이유:');
            evaluation.reasons.slice(0, 2).forEach(reason => {
                console.log(`  • ${reason}`);
            });
        }
    });
}

/**
 * 다양한 제목 유형 테스트
 */
function testVariousTitleTypes() {
    console.log('\n=== 다양한 제목 유형 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    const titleTypes = {
        '질문형': 'AI 반도체 시장, 다음 성장 동력은 무엇일까?',
        '숫자형': '2024년 AI 반도체 시장 5가지 핵심 트렌드',
        '비교형': 'NVIDIA vs 삼성전자: AI 반도체 경쟁 분석',
        '예측형': 'AI 반도체 시장 전망: 300% 성장의 지속 가능성',
        '가이드형': 'AI 반도체 투자 완벽 가이드: 전문가 분석',
        '뉴스형': '삼성전자, AI 반도체 개발에 5조원 투자 발표',
        '분석형': 'AI 기술 발전이 반도체 산업에 미치는 영향 분석'
    };
    
    Object.entries(titleTypes).forEach(([type, title]) => {
        console.log(`\n--- ${type} ---`);
        console.log(`제목: "${title}"`);
        
        const evaluation = evaluator.evaluateTitle(title);
        
        console.log(`전체 점수: ${evaluation.overallScore.toFixed(2)}`);
        console.log(`SEO: ${evaluation.scores.seo.toFixed(2)} | 참여도: ${evaluation.scores.engagement.toFixed(2)} | 가독성: ${evaluation.scores.readability.toFixed(2)}`);
        console.log(`필터 통과: ${evaluation.passesFilters ? '✅' : '❌'}`);
    });
}

/**
 * 엣지 케이스 테스트
 */
function testEdgeCases() {
    console.log('\n=== 엣지 케이스 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    const edgeCases = {
        '매우 짧은 제목': 'AI',
        '매우 긴 제목': 'AI 기술의 급속한 발전이 반도체 산업 전반에 미치는 광범위하고 심층적인 영향과 그에 따른 시장 변화 및 미래 전망에 대한 종합적 분석',
        '특수문자 과다': 'AI!!! 반도체@@@ 시장### 대박$$$',
        '숫자만': '2024 300% 97% 5조원',
        '영어만': 'AI Semiconductor Market Growth Analysis',
        '반복 단어': 'AI AI AI 반도체 반도체 시장 시장',
        '빈 문자열': '',
        '공백만': '   ',
        '금지 키워드': '충격적인 AI 반도체 대박 소식'
    };
    
    Object.entries(edgeCases).forEach(([caseType, title]) => {
        console.log(`\n${caseType}: "${title}"`);
        
        try {
            const evaluation = evaluator.evaluateTitle(title);
            console.log(`전체 점수: ${evaluation.overallScore.toFixed(2)}`);
            console.log(`필터 통과: ${evaluation.passesFilters ? '✅' : '❌'}`);
            
            if (evaluation.recommendations.length > 0) {
                console.log(`주요 권장사항: ${evaluation.recommendations[0]}`);
            }
        } catch (error) {
            console.log(`오류 발생: ${error.message}`);
        }
    });
}

/**
 * 성능 테스트
 */
function testPerformance() {
    console.log('\n=== 성능 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    const iterations = 100;
    const testTitle = testTitles.good;
    
    console.log(`${iterations}회 반복 평가 테스트`);
    console.log(`테스트 제목: "${testTitle}"`);
    
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
        evaluator.evaluateTitle(testTitle);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`총 실행 시간: ${totalTime}ms`);
    console.log(`평균 실행 시간: ${avgTime.toFixed(2)}ms`);
    console.log(`초당 처리량: ${Math.round(1000 / avgTime)}회/초`);
}

/**
 * 캐싱 테스트
 */
function testCaching() {
    console.log('\n=== 캐싱 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    const testTitle = testTitles.excellent;
    
    console.log('첫 번째 평가 (캐시 미스):');
    const startTime1 = Date.now();
    const result1 = evaluator.evaluateTitle(testTitle);
    const time1 = Date.now() - startTime1;
    console.log(`실행 시간: ${time1}ms`);
    console.log(`전체 점수: ${result1.overallScore.toFixed(2)}`);
    
    console.log('\n두 번째 평가 (캐시 히트):');
    const startTime2 = Date.now();
    const result2 = evaluator.evaluateTitle(testTitle);
    const time2 = Date.now() - startTime2;
    console.log(`실행 시간: ${time2}ms`);
    console.log(`전체 점수: ${result2.overallScore.toFixed(2)}`);
    
    console.log(`\n캐싱 효과: ${((time1 - time2) / time1 * 100).toFixed(1)}% 성능 향상`);
    console.log(`결과 일치: ${result1.overallScore === result2.overallScore ? '✅' : '❌'}`);
}

/**
 * 전체 테스트 실행
 */
function runAllTests() {
    console.log('🚀 TitleQualityEvaluator 테스트 시작\n');
    
    try {
        testBasicEvaluation();
        testIndividualScores();
        testFiltering();
        testVariousTitleTypes();
        testEdgeCases();
        testPerformance();
        testCaching();
        
        console.log('\n✅ 모든 테스트 완료!');
    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
        console.error(error.stack);
    }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export {
    testBasicEvaluation,
    testIndividualScores,
    testFiltering,
    testVariousTitleTypes,
    testEdgeCases,
    testPerformance,
    testCaching,
    runAllTests
};