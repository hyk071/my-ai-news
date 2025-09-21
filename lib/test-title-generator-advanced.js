/**
 * TitleGenerator 고급 단위 테스트
 * 각 제목 생성 방법별 상세 테스트
 */

import { TitleGenerator } from './title-generator.js';
import { ContentAnalyzer } from './content-analyzer.js';

// 테스트용 샘플 데이터
const sampleContent = `# AI 기술의 미래와 산업 혁신

## 개요

인공지능 기술이 급속도로 발전하면서 다양한 산업 분야에서 혁신적인 변화가 일어나고 있다. 
특히 생성형 AI의 등장으로 콘텐츠 제작, 소프트웨어 개발, 의료 진단 등의 영역에서 
기존의 패러다임을 완전히 바꾸는 새로운 가능성들이 열리고 있다.

## 시장 현황

글로벌 AI 시장 규모는 2024년 기준 5,000억 달러를 넘어섰으며, 
연평균 35% 성장률을 보이고 있다. 주요 기업들의 97%가 AI 도입을 
적극적으로 검토하고 있다고 발표했다.

### 주요 기업 동향

- OpenAI: GPT-4 기반 새로운 서비스 출시
- Google: Bard AI 성능 2배 향상
- Microsoft: Azure AI 플랫폼 확장`;

const sampleTags = ['AI', '인공지능', '기술혁신'];
const sampleSubject = 'AI 기술 발전과 산업 혁신 동향';
const sampleTone = '전문적';

/**
 * AI 제목 생성 메서드 테스트
 */
function testAITitleGeneration() {
    console.log('\n=== AI 제목 생성 메서드 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    // 외부 AI 제목 주입 테스트
    const externalAITitles = [
        'AI 혁신이 가져올 미래 산업의 변화',
        '인공지능 기술 발전, 새로운 패러다임의 시작',
        '생성형 AI 시대, 산업 전반의 디지털 전환'
    ];
    
    generator.setAITitles(externalAITitles);
    
    return generator.generateAITitles().then(aiTitles => {
        console.log('✅ AI 제목 생성 테스트 완료');
        console.log(`- 생성된 제목 수: ${aiTitles.length}`);
        
        aiTitles.forEach((title, index) => {
            console.log(`  ${index + 1}. ${title}`);
        });
        
        // 검증: 외부 제목이 반환되어야 함
        const passed = aiTitles.length === externalAITitles.length &&
                      aiTitles.every(title => externalAITitles.includes(title));
        
        console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
        return passed;
    });
}

/**
 * 콘텐츠 기반 제목 생성 상세 테스트
 */
function testContentBasedTitleGeneration() {
    console.log('\n=== 콘텐츠 기반 제목 생성 상세 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    const contentTitles = generator.generateContentBasedTitles();
    
    console.log('✅ 콘텐츠 기반 제목 생성 테스트 완료');
    console.log(`- 생성된 제목 수: ${contentTitles.length}`);
    
    // 제목 유형별 분류
    const titleTypes = {
        heading: contentTitles.filter(title => title.includes('AI 기술의 미래')),
        keyword: contentTitles.filter(title => title.includes('AI') || title.includes('인공지능')),
        statistics: contentTitles.filter(title => title.includes('5,000억') || title.includes('35%') || title.includes('97%')),
        entity: contentTitles.filter(title => title.includes('OpenAI') || title.includes('Google') || title.includes('Microsoft'))
    };
    
    console.log('제목 유형별 분석:');
    console.log(`- 헤딩 기반: ${titleTypes.heading.length}개`);
    console.log(`- 키워드 기반: ${titleTypes.keyword.length}개`);
    console.log(`- 통계 기반: ${titleTypes.statistics.length}개`);
    console.log(`- 개체명 기반: ${titleTypes.entity.length}개`);
    
    contentTitles.slice(0, 5).forEach((title, index) => {
        console.log(`  ${index + 1}. ${title}`);
    });
    
    // 검증: 다양한 유형의 제목이 생성되어야 함
    const passed = contentTitles.length >= 3 &&
                  titleTypes.keyword.length > 0 &&
                  contentTitles.every(title => title.length >= 10);
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 휴리스틱 제목 생성 상세 테스트
 */
function testHeuristicTitleGeneration() {
    console.log('\n=== 휴리스틱 제목 생성 상세 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    const heuristicTitles = generator.generateHeuristicTitles();
    
    console.log('✅ 휴리스틱 제목 생성 테스트 완료');
    console.log(`- 생성된 제목 수: ${heuristicTitles.length}`);
    
    // 휴리스틱 패턴 분석
    const patterns = {
        trend: heuristicTitles.filter(title => title.includes('동향') || title.includes('트렌드')),
        question: heuristicTitles.filter(title => title.includes('?')),
        statistics: heuristicTitles.filter(title => title.includes('5,000억') || title.includes('35%')),
        prediction: heuristicTitles.filter(title => title.includes('전망') || title.includes('미래')),
        analysis: heuristicTitles.filter(title => title.includes('분석'))
    };
    
    console.log('휴리스틱 패턴 분석:');
    console.log(`- 트렌드형: ${patterns.trend.length}개`);
    console.log(`- 질문형: ${patterns.question.length}개`);
    console.log(`- 통계형: ${patterns.statistics.length}개`);
    console.log(`- 예측형: ${patterns.prediction.length}개`);
    console.log(`- 분석형: ${patterns.analysis.length}개`);
    
    heuristicTitles.slice(0, 5).forEach((title, index) => {
        console.log(`  ${index + 1}. ${title}`);
    });
    
    // 검증: 다양한 휴리스틱 패턴이 적용되어야 함
    const passed = heuristicTitles.length >= 5 &&
                  (patterns.trend.length > 0 || patterns.analysis.length > 0) &&
                  heuristicTitles.every(title => title.length >= 15);
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 태그 기반 제목 생성 상세 테스트
 */
function testTagBasedTitleGeneration() {
    console.log('\n=== 태그 기반 제목 생성 상세 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    const tagBasedTitles = generator.generateTagBasedTitles();
    
    console.log('✅ 태그 기반 제목 생성 테스트 완료');
    console.log(`- 생성된 제목 수: ${tagBasedTitles.length}`);
    
    // 태그 포함 분석
    const tagInclusion = {
        ai: tagBasedTitles.filter(title => title.includes('AI') || title.includes('인공지능')),
        innovation: tagBasedTitles.filter(title => title.includes('기술혁신') || title.includes('혁신')),
        subject: tagBasedTitles.filter(title => title.includes('기술') || title.includes('발전'))
    };
    
    console.log('태그 포함 분석:');
    console.log(`- AI 관련: ${tagInclusion.ai.length}개`);
    console.log(`- 혁신 관련: ${tagInclusion.innovation.length}개`);
    console.log(`- 주제 관련: ${tagInclusion.subject.length}개`);
    
    tagBasedTitles.slice(0, 5).forEach((title, index) => {
        console.log(`  ${index + 1}. ${title}`);
    });
    
    // 검증: 태그가 제목에 반영되어야 함
    const passed = tagBasedTitles.length >= 3 &&
                  tagInclusion.ai.length > 0 &&
                  tagBasedTitles.every(title => title.length >= 10);
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 제목 후보 처리 및 순위 테스트
 */
function testCandidateProcessingAndRanking() {
    console.log('\n=== 제목 후보 처리 및 순위 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    // 테스트용 후보 제목들
    const testCandidates = [
        { title: 'AI 기술 혁신과 미래 전망', source: 'ai_generation' },
        { title: 'AI 기술 혁신과 미래 전망', source: 'content_analysis' }, // 중복
        { title: 'AI', source: 'heuristic' }, // 너무 짧음
        { title: '인공지능 기술이 가져올 산업 혁신의 새로운 패러다임과 미래 사회에 미칠 광범위한 영향에 대한 종합적 분석', source: 'tag_based' }, // 너무 김
        { title: '인공지능 기술 발전과 산업 혁신 동향 분석', source: 'content_analysis' },
        { title: 'AI 시장 5,000억 달러 돌파, 35% 성장률 기록', source: 'heuristic' }
    ];
    
    const processedCandidates = generator.processAndRankCandidates(testCandidates);
    
    console.log('✅ 제목 후보 처리 및 순위 테스트 완료');
    console.log(`- 원본 후보: ${testCandidates.length}개`);
    console.log(`- 처리된 후보: ${processedCandidates.length}개`);
    
    console.log('처리된 제목 후보 (순위순):');
    processedCandidates.forEach((candidate, index) => {
        console.log(`  ${index + 1}. ${candidate.title} (점수: ${candidate.score?.toFixed(2) || 'N/A'})`);
    });
    
    // 검증: 중복 제거, 길이 필터링, 점수 순 정렬이 되어야 함
    const titles = processedCandidates.map(c => c.title);
    const uniqueTitles = new Set(titles);
    const hasValidLengths = processedCandidates.every(c => 
        c.title.length >= 10 && c.title.length <= 100
    );
    const hasScores = processedCandidates.every(c => 
        typeof c.score === 'number' && c.score >= 0 && c.score <= 1
    );
    
    const passed = uniqueTitles.size === processedCandidates.length &&
                  hasValidLengths &&
                  hasScores &&
                  processedCandidates.length < testCandidates.length; // 일부 필터링됨
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 필터 적용 테스트
 */
function testFilterApplication() {
    console.log('\n=== 필터 적용 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    
    // 엄격한 필터 설정
    const strictFilters = {
        titleLen: { min: 20, max: 50 },
        mustInclude: ['AI'],
        mustExclude: ['충격', '대박'],
        minRelevanceScore: 0.5
    };
    
    const generator = new TitleGenerator(analyzer, strictFilters);
    
    return generator.generateTitles().then(result => {
        console.log('✅ 필터 적용 테스트 완료');
        console.log(`- 생성된 후보: ${result.candidates.length}개`);
        console.log(`- 최고 제목: "${result.bestTitle}"`);
        console.log(`- 사용된 소스: ${result.sources.join(', ')}`);
        
        // 필터 조건 검증
        const validCandidates = result.candidates.filter(candidate => {
            const title = candidate.title;
            const chars = [...title].length;
            return chars >= 20 && chars <= 50 && title.includes('AI');
        });
        
        console.log(`- 필터 조건 만족: ${validCandidates.length}/${result.candidates.length}개`);
        
        const passed = result.candidates.length > 0 &&
                      result.bestTitle.length > 0 &&
                      validCandidates.length === result.candidates.length;
        
        console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
        return passed;
    });
}

/**
 * 로깅 통합 테스트
 */
function testLoggingIntegration() {
    console.log('\n=== 로깅 통합 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    return generator.generateTitles().then(result => {
        const logs = result.logs;
        
        console.log('✅ 로깅 통합 테스트 완료');
        console.log(`- 총 로그 수: ${logs.steps}`);
        console.log(`- 실행 시간: ${logs.totalTime}ms`);
        console.log(`- 오류 수: ${logs.errors}`);
        console.log(`- 경고 수: ${logs.warnings}`);
        
        // 주요 단계 로그 확인
        const hasImportantLogs = logs.logs && logs.logs.some(log => 
            log.step.includes('제목 생성') || log.step.includes('콘텐츠 분석')
        );
        
        const passed = logs.totalTime > 0 &&
                      logs.steps > 0 &&
                      (hasImportantLogs || logs.steps >= 5);
        
        console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
        return passed;
    });
}

/**
 * 캐싱 동작 테스트
 */
function testCachingBehavior() {
    console.log('\n=== 캐싱 동작 테스트 ===');
    
    const analyzer = new ContentAnalyzer(sampleContent, sampleTags, sampleSubject, sampleTone);
    const generator = new TitleGenerator(analyzer);
    
    // 첫 번째 실행 (캐시 미스)
    return generator.generateTitles().then(result1 => {
        const time1 = result1.logs.totalTime;
        const fromCache1 = result1.fromCache;
        
        // 두 번째 실행 (캐시 히트 예상)
        return generator.generateTitles().then(result2 => {
            const time2 = result2.logs.totalTime;
            const fromCache2 = result2.fromCache;
            
            console.log('✅ 캐싱 동작 테스트 완료');
            console.log(`- 첫 번째 실행: ${time1}ms (캐시: ${fromCache1 ? '히트' : '미스'})`);
            console.log(`- 두 번째 실행: ${time2}ms (캐시: ${fromCache2 ? '히트' : '미스'})`);
            console.log(`- 성능 향상: ${fromCache2 ? '✅' : '❌'}`);
            
            // 결과 일관성 확인
            const consistentResults = result1.bestTitle === result2.bestTitle &&
                                    result1.candidates.length === result2.candidates.length;
            
            const passed = consistentResults && 
                          (fromCache2 || time2 <= time1); // 캐시 히트이거나 성능 개선
            
            console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
            return passed;
        });
    });
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
    console.log('🚀 TitleGenerator 고급 단위 테스트 시작\n');
    
    const tests = [
        testAITitleGeneration,
        testContentBasedTitleGeneration,
        testHeuristicTitleGeneration,
        testTagBasedTitleGeneration,
        testCandidateProcessingAndRanking,
        testFilterApplication,
        testLoggingIntegration,
        testCachingBehavior
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`테스트 실행 중 오류: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n📊 테스트 결과 요약:`);
    console.log(`- 통과: ${passed}개`);
    console.log(`- 실패: ${failed}개`);
    console.log(`- 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n✅ 모든 테스트 통과!');
    } else {
        console.log('\n❌ 일부 테스트 실패');
    }
    
    return failed === 0;
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export {
    testAITitleGeneration,
    testContentBasedTitleGeneration,
    testHeuristicTitleGeneration,
    testTagBasedTitleGeneration,
    testCandidateProcessingAndRanking,
    testFilterApplication,
    testLoggingIntegration,
    testCachingBehavior,
    runAllTests
};