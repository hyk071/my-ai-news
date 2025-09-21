/**
 * 품질 보증 테스트
 * 생성된 제목과 기사 내용의 관련성 평가, 제목 품질 점수 정확성 검증, 성능 테스트
 */

import { ContentAnalyzer } from './content-analyzer.js';
import { TitleGenerator } from './title-generator.js';
import { TitleQualityEvaluator } from './title-quality-evaluator.js';

// 품질 평가용 테스트 데이터
const qualityTestData = {
    highQuality: {
        content: `# 인공지능 기술의 혁신적 발전과 산업 응용

## 기술 현황

최근 인공지능 기술이 급속도로 발전하면서 다양한 산업 분야에서 
혁신적인 변화를 이끌고 있다. 특히 자연어 처리와 컴퓨터 비전 기술의 
발전으로 실용적인 AI 서비스들이 속속 등장하고 있다.

## 시장 동향

글로벌 AI 시장 규모는 2024년 기준 8,000억 달러를 넘어섰으며, 
연평균 42% 성장률을 보이고 있다. 주요 기업들의 95%가 
AI 기술 도입을 적극 검토하고 있다고 발표했다.`,
        tags: ['인공지능', 'AI기술', '산업혁신'],
        subject: '인공지능 기술 발전과 산업 응용 현황',
        expectedTitles: [
            'AI 기술 혁신이 가져올 산업 변화와 미래 전망',
            '인공지능 시장 8,000억 달러 돌파, 42% 성장률 기록',
            'AI 기술 발전으로 변화하는 산업 생태계'
        ]
    },
    
    mediumQuality: {
        content: `## 스마트폰 시장 변화

스마트폰 시장이 포화 상태에 접어들면서 새로운 변화가 필요한 시점이다. 
제조사들은 차별화된 기능과 서비스로 경쟁력을 확보하려 노력하고 있다.

최근 폴더블 스마트폰이 주목받고 있으며, 5G 기술과 결합하여 
새로운 사용자 경험을 제공하고 있다.`,
        tags: ['스마트폰', '5G', '폴더블'],
        subject: '스마트폰 시장 변화와 새로운 트렌드',
        expectedTitles: [
            '스마트폰 시장 포화 속 폴더블과 5G로 새 활로',
            '스마트폰 제조사들의 차별화 전략과 시장 전망'
        ]
    }
};/**

 * 제목-내용 관련성 평가 테스트
 */
async function testTitleContentRelevance() {
    console.log('\n=== 제목-내용 관련성 평가 테스트 ===');
    
    let allPassed = true;
    const results = {};
    
    for (const [quality, data] of Object.entries(qualityTestData)) {
        console.log(`\n--- ${quality.toUpperCase()} 품질 데이터 테스트 ---`);
        
        try {
            const analyzer = new ContentAnalyzer(data.content, data.tags, data.subject);
            const generator = new TitleGenerator(analyzer);
            const evaluator = new TitleQualityEvaluator(analyzer);
            
            const titleResult = await generator.generateTitles();
            const generatedTitles = titleResult.candidates.map(c => c.title);
            
            // 생성된 제목들의 관련성 평가
            const relevanceScores = [];
            for (const title of generatedTitles.slice(0, 5)) {
                const evaluation = evaluator.evaluateTitle(title);
                relevanceScores.push({
                    title: title,
                    relevanceScore: evaluation.scores.relevance,
                    overallScore: evaluation.overallScore
                });
            }
            
            // 예상 제목들과의 유사성 검사
            const expectedSimilarity = data.expectedTitles.map(expectedTitle => {
                const similarities = generatedTitles.map(generatedTitle => 
                    calculateTitleSimilarity(expectedTitle, generatedTitle)
                );
                return Math.max(...similarities);
            });
            
            const avgRelevance = relevanceScores.reduce((sum, item) => sum + item.relevanceScore, 0) / relevanceScores.length;
            const avgSimilarity = expectedSimilarity.reduce((sum, sim) => sum + sim, 0) / expectedSimilarity.length;
            
            results[quality] = {
                avgRelevance: avgRelevance,
                avgSimilarity: avgSimilarity,
                generatedCount: generatedTitles.length,
                topTitles: relevanceScores.slice(0, 3)
            };
            
            console.log(`✅ ${quality} 테스트 완료`);
            console.log(`- 평균 관련성 점수: ${avgRelevance.toFixed(3)}`);
            console.log(`- 예상 제목 유사도: ${avgSimilarity.toFixed(3)}`);
            console.log(`- 생성된 제목 수: ${generatedTitles.length}개`);
            
            // 상위 제목 출력
            console.log('상위 제목들:');
            relevanceScores.slice(0, 3).forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.title} (관련성: ${item.relevanceScore.toFixed(2)})`);
            });
            
            // 품질 기준 검증
            const qualityThreshold = quality === 'highQuality' ? 0.6 : 0.4;
            const similarityThreshold = quality === 'highQuality' ? 0.3 : 0.2;
            
            const meetsQuality = avgRelevance >= qualityThreshold && avgSimilarity >= similarityThreshold;
            if (!meetsQuality) {
                allPassed = false;
                console.log(`❌ ${quality} 품질 기준 미달`);
            }
            
        } catch (error) {
            console.error(`${quality} 테스트 중 오류: ${error.message}`);
            allPassed = false;
        }
    }
    
    console.log(`\n제목-내용 관련성 테스트 결과: ${allPassed ? '✅ 통과' : '❌ 실패'}`);
    return allPassed;
}

/**
 * 제목 유사도 계산 (간단한 단어 기반)
 */
function calculateTitleSimilarity(title1, title2) {
    const words1 = title1.toLowerCase().split(/\s+/);
    const words2 = title2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
}

/**
 * 제목 품질 점수 정확성 검증 테스트
 */
async function testQualityScoreAccuracy() {
    console.log('\n=== 제목 품질 점수 정확성 검증 테스트 ===');
    
    const testCases = [
        {
            title: 'AI 기술 혁신이 가져올 산업 변화와 미래 전망 분석',
            expectedRange: { min: 0.7, max: 1.0 },
            description: '고품질 제목'
        },
        {
            title: 'AI 기술',
            expectedRange: { min: 0.0, max: 0.4 },
            description: '너무 짧은 제목'
        },
        {
            title: '충격! 믿을 수 없는 AI 기술의 대박 소식!!!',
            expectedRange: { min: 0.0, max: 0.3 },
            description: '클릭베이트 제목'
        },
        {
            title: 'AI 인공지능 기술 발전 동향과 산업 응용 현황 분석',
            expectedRange: { min: 0.6, max: 0.9 },
            description: '적절한 품질 제목'
        }
    ];
    
    const data = qualityTestData.highQuality;
    const analyzer = new ContentAnalyzer(data.content, data.tags, data.subject);
    const evaluator = new TitleQualityEvaluator(analyzer);
    
    let allAccurate = true;
    
    for (const testCase of testCases) {
        try {
            const evaluation = evaluator.evaluateTitle(testCase.title);
            const score = evaluation.overallScore;
            
            const isAccurate = score >= testCase.expectedRange.min && score <= testCase.expectedRange.max;
            
            console.log(`\n${testCase.description}:`);
            console.log(`- 제목: "${testCase.title}"`);
            console.log(`- 실제 점수: ${score.toFixed(3)}`);
            console.log(`- 예상 범위: ${testCase.expectedRange.min}-${testCase.expectedRange.max}`);
            console.log(`- 정확성: ${isAccurate ? '✅' : '❌'}`);
            
            if (!isAccurate) {
                allAccurate = false;
                console.log(`- 세부 점수: 관련성 ${evaluation.scores.relevance.toFixed(2)}, 길이 ${evaluation.scores.length.toFixed(2)}, 가독성 ${evaluation.scores.readability.toFixed(2)}`);
            }
            
        } catch (error) {
            console.error(`품질 점수 테스트 오류: ${error.message}`);
            allAccurate = false;
        }
    }
    
    console.log(`\n품질 점수 정확성 테스트 결과: ${allAccurate ? '✅ 통과' : '❌ 실패'}`);
    return allAccurate;
}

/**
 * 성능 및 메모리 사용량 테스트
 */
async function testPerformanceAndMemory() {
    console.log('\n=== 성능 및 메모리 사용량 테스트 ===');
    
    const data = qualityTestData.highQuality;
    const testIterations = [1, 10, 50];
    const results = {};
    
    for (const iterations of testIterations) {
        console.log(`\n${iterations}회 반복 성능 테스트...`);
        
        const startMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        const startTime = Date.now();
        
        try {
            const promises = [];
            
            for (let i = 0; i < iterations; i++) {
                const analyzer = new ContentAnalyzer(data.content, data.tags, data.subject);
                const generator = new TitleGenerator(analyzer);
                const evaluator = new TitleQualityEvaluator(analyzer);
                
                const promise = generator.generateTitles().then(titleResult => {
                    return evaluator.evaluateTitle(titleResult.bestTitle);
                });
                
                promises.push(promise);
            }
            
            const allResults = await Promise.all(promises);
            
            const endTime = Date.now();
            const endMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
            
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;
            const memoryIncrease = endMemory - startMemory;
            const avgMemoryPerOp = memoryIncrease / iterations;
            
            results[iterations] = {
                totalTime: totalTime,
                avgTime: avgTime,
                memoryIncrease: memoryIncrease,
                avgMemoryPerOp: avgMemoryPerOp,
                successRate: allResults.filter(r => r.overallScore > 0).length / iterations,
                avgQualityScore: allResults.reduce((sum, r) => sum + r.overallScore, 0) / iterations
            };
            
            console.log(`✅ ${iterations}회 테스트 완료`);
            console.log(`- 총 시간: ${totalTime}ms`);
            console.log(`- 평균 시간: ${avgTime.toFixed(1)}ms`);
            console.log(`- 메모리 증가: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
            console.log(`- 평균 품질 점수: ${results[iterations].avgQualityScore.toFixed(3)}`);
            console.log(`- 성공률: ${(results[iterations].successRate * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error(`${iterations}회 성능 테스트 오류: ${error.message}`);
            results[iterations] = { error: error.message };
        }
    }
    
    // 성능 분석
    console.log('\n📊 성능 분석 결과:');
    
    const performanceGood = results[1] && results[50] && 
                           results[50].avgTime <= results[1].avgTime * 1.5; // 1.5배 이내
    
    const memoryEfficient = results[50] && 
                           results[50].avgMemoryPerOp < 10 * 1024 * 1024; // 10MB 이하
    
    console.log(`- 성능 확장성: ${performanceGood ? '✅ 양호' : '❌ 개선 필요'}`);
    console.log(`- 메모리 효율성: ${memoryEfficient ? '✅ 양호' : '❌ 개선 필요'}`);
    
    const allSuccessful = Object.values(results).every(result => 
        !result.error && result.successRate === 1
    );
    
    console.log(`\n성능 및 메모리 테스트 결과: ${allSuccessful && performanceGood && memoryEfficient ? '✅ 통과' : '❌ 실패'}`);
    return allSuccessful && performanceGood && memoryEfficient;
}/**
 * 일관성
 및 안정성 테스트
 */
async function testConsistencyAndStability() {
    console.log('\n=== 일관성 및 안정성 테스트 ===');
    
    const data = qualityTestData.highQuality;
    const testRuns = 5;
    const results = [];
    
    console.log(`동일한 입력으로 ${testRuns}회 반복 실행...`);
    
    for (let i = 0; i < testRuns; i++) {
        try {
            const analyzer = new ContentAnalyzer(data.content, data.tags, data.subject);
            const generator = new TitleGenerator(analyzer);
            const titleResult = await generator.generateTitles();
            
            results.push({
                bestTitle: titleResult.bestTitle,
                candidateCount: titleResult.candidates.length,
                sources: titleResult.sources,
                executionTime: titleResult.logs.totalTime
            });
            
        } catch (error) {
            console.error(`${i + 1}번째 실행 오류: ${error.message}`);
            results.push({ error: error.message });
        }
    }
    
    // 일관성 분석
    const successfulRuns = results.filter(r => !r.error);
    const uniqueTitles = new Set(successfulRuns.map(r => r.bestTitle));
    const avgCandidates = successfulRuns.reduce((sum, r) => sum + r.candidateCount, 0) / successfulRuns.length;
    const avgTime = successfulRuns.reduce((sum, r) => sum + r.executionTime, 0) / successfulRuns.length;
    
    console.log('✅ 일관성 분석 완료');
    console.log(`- 성공한 실행: ${successfulRuns.length}/${testRuns}회`);
    console.log(`- 고유한 최고 제목: ${uniqueTitles.size}개`);
    console.log(`- 평균 후보 수: ${avgCandidates.toFixed(1)}개`);
    console.log(`- 평균 실행 시간: ${avgTime.toFixed(1)}ms`);
    
    console.log('\n생성된 최고 제목들:');
    successfulRuns.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.bestTitle}`);
    });
    
    // 안정성 검증
    const stabilityGood = successfulRuns.length === testRuns && // 모든 실행 성공
                         avgCandidates >= 3 && // 충분한 후보 생성
                         uniqueTitles.size >= 1; // 최소 1개 이상의 제목
    
    console.log(`\n일관성 및 안정성 테스트 결과: ${stabilityGood ? '✅ 통과' : '❌ 실패'}`);
    return stabilityGood;
}

/**
 * 엣지 케이스 품질 보증 테스트
 */
async function testEdgeCaseQuality() {
    console.log('\n=== 엣지 케이스 품질 보증 테스트 ===');
    
    const edgeCases = [
        {
            name: '매우 짧은 콘텐츠',
            content: 'AI 기술 발전.',
            tags: ['AI'],
            subject: 'AI 기술',
            expectation: '기본 품질 유지'
        },
        {
            name: '매우 긴 콘텐츠',
            content: 'AI 기술 '.repeat(1000) + '발전하고 있다.',
            tags: ['AI', '기술'],
            subject: 'AI 기술 발전',
            expectation: '성능 저하 없이 처리'
        },
        {
            name: '특수 문자 포함',
            content: 'AI & ML 기술이 @#$% 발전하고 있다!!! 정말 놀라운 변화다.',
            tags: ['AI', 'ML'],
            subject: 'AI ML 기술 발전',
            expectation: '특수 문자 적절히 처리'
        },
        {
            name: '다국어 혼합',
            content: 'AI technology와 인공지능 기술이 rapidly 발전하고 있다.',
            tags: ['AI', 'technology'],
            subject: 'AI 기술 발전',
            expectation: '다국어 콘텐츠 처리'
        }
    ];
    
    let allPassed = true;
    
    for (const edgeCase of edgeCases) {
        console.log(`\n--- ${edgeCase.name} 테스트 ---`);
        
        try {
            const analyzer = new ContentAnalyzer(edgeCase.content, edgeCase.tags, edgeCase.subject);
            const generator = new TitleGenerator(analyzer);
            const evaluator = new TitleQualityEvaluator(analyzer);
            
            const titleResult = await generator.generateTitles();
            const evaluation = evaluator.evaluateTitle(titleResult.bestTitle);
            
            console.log(`- 생성된 제목: "${titleResult.bestTitle}"`);
            console.log(`- 후보 수: ${titleResult.candidates.length}개`);
            console.log(`- 품질 점수: ${evaluation.overallScore.toFixed(3)}`);
            console.log(`- 실행 시간: ${titleResult.logs.totalTime}ms`);
            
            // 기본 품질 기준 검증
            const hasValidTitle = titleResult.bestTitle.length > 0;
            const hasReasonableQuality = evaluation.overallScore > 0.1;
            const completedInTime = titleResult.logs.totalTime < 10000; // 10초 이내
            
            const caseValid = hasValidTitle && hasReasonableQuality && completedInTime;
            
            console.log(`- 결과: ${caseValid ? '✅ 통과' : '❌ 실패'}`);
            
            if (!caseValid) {
                allPassed = false;
                console.log(`  실패 이유: 제목 ${hasValidTitle ? '✅' : '❌'}, 품질 ${hasReasonableQuality ? '✅' : '❌'}, 시간 ${completedInTime ? '✅' : '❌'}`);
            }
            
        } catch (error) {
            console.error(`${edgeCase.name} 테스트 오류: ${error.message}`);
            allPassed = false;
        }
    }
    
    console.log(`\n엣지 케이스 품질 보증 테스트 결과: ${allPassed ? '✅ 통과' : '❌ 실패'}`);
    return allPassed;
}

/**
 * 전체 품질 보증 테스트 실행
 */
async function runAllQualityAssuranceTests() {
    console.log('🚀 품질 보증 테스트 시작\n');
    
    const tests = [
        { name: '제목-내용 관련성 평가', test: testTitleContentRelevance },
        { name: '품질 점수 정확성 검증', test: testQualityScoreAccuracy },
        { name: '성능 및 메모리 사용량', test: testPerformanceAndMemory },
        { name: '일관성 및 안정성', test: testConsistencyAndStability },
        { name: '엣지 케이스 품질 보증', test: testEdgeCaseQuality }
    ];
    
    let passed = 0;
    let failed = 0;
    const results = {};
    
    for (const { name, test } of tests) {
        console.log(`\n🔄 ${name} 테스트 실행 중...`);
        
        try {
            const startTime = Date.now();
            const result = await test();
            const executionTime = Date.now() - startTime;
            
            results[name] = {
                passed: result,
                executionTime: executionTime
            };
            
            if (result) {
                passed++;
                console.log(`✅ ${name} 테스트 통과 (${executionTime}ms)`);
            } else {
                failed++;
                console.log(`❌ ${name} 테스트 실패 (${executionTime}ms)`);
            }
            
        } catch (error) {
            failed++;
            results[name] = {
                passed: false,
                error: error.message,
                executionTime: 0
            };
            console.error(`❌ ${name} 테스트 오류: ${error.message}`);
        }
    }
    
    console.log(`\n📊 품질 보증 테스트 결과 요약:`);
    console.log(`- 통과: ${passed}개`);
    console.log(`- 실패: ${failed}개`);
    console.log(`- 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    // 실행 시간 분석
    const totalTime = Object.values(results).reduce((sum, result) => sum + result.executionTime, 0);
    console.log(`- 총 실행 시간: ${totalTime}ms`);
    
    if (failed === 0) {
        console.log('\n🎉 모든 품질 보증 테스트 통과!');
        console.log('제목 생성 시스템의 품질이 검증되었습니다.');
    } else {
        console.log('\n⚠️ 일부 품질 보증 테스트 실패');
        console.log('품질 개선이 필요한 영역이 있습니다.');
        
        // 실패한 테스트 목록
        const failedTests = Object.entries(results)
            .filter(([name, result]) => !result.passed)
            .map(([name]) => name);
        
        if (failedTests.length > 0) {
            console.log('실패한 테스트:');
            failedTests.forEach(testName => {
                console.log(`- ${testName}`);
            });
        }
    }
    
    return failed === 0;
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllQualityAssuranceTests();
}

export {
    testTitleContentRelevance,
    testQualityScoreAccuracy,
    testPerformanceAndMemory,
    testConsistencyAndStability,
    testEdgeCaseQuality,
    runAllQualityAssuranceTests
};