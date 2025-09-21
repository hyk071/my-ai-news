/**
 * 성능 최적화 및 캐싱 테스트
 * 캐시 매니저, AI 캐시 래퍼, 메모리 최적화 기능을 테스트
 */

import { getCacheManager } from './cache-manager.js';
import { getAICacheWrapper } from './ai-cache-wrapper.js';
import { getMemoryOptimizer } from './memory-optimizer.js';
import { ContentAnalyzer } from './content-analyzer.js';
import { TitleGenerator } from './title-generator.js';

/**
 * 캐시 매니저 기본 기능 테스트
 */
async function testCacheManager() {
    console.log('\n=== 캐시 매니저 테스트 시작 ===');
    
    const cacheManager = getCacheManager();
    
    // 테스트 데이터
    const testContent = '이것은 테스트 기사 내용입니다. AI 기술이 발전하고 있습니다.';
    const testTags = ['AI', '기술'];
    const testSubject = 'AI 기술 발전';
    const testTone = '객관적';
    
    const testAnalysis = {
        headings: [{ level: 1, text: 'AI 기술 발전', chars: 7 }],
        keyPhrases: [{ phrase: 'AI', frequency: 2, importance: 0.8 }],
        statistics: [],
        entities: [],
        sentiment: { overall: 'positive', confidence: 0.7 }
    };

    // 1. 콘텐츠 분석 캐싱 테스트
    console.log('1. 콘텐츠 분석 캐싱 테스트');
    
    // 캐시 저장
    cacheManager.cacheContentAnalysis(testContent, testTags, testSubject, testTone, testAnalysis);
    
    // 캐시 조회
    const cachedAnalysis = cacheManager.getCachedContentAnalysis(testContent, testTags, testSubject, testTone);
    
    if (cachedAnalysis && cachedAnalysis.headings.length > 0) {
        console.log('✅ 콘텐츠 분석 캐싱 성공');
    } else {
        console.log('❌ 콘텐츠 분석 캐싱 실패');
    }

    // 2. AI 응답 캐싱 테스트
    console.log('2. AI 응답 캐싱 테스트');
    
    const testPrompt = 'AI 기술에 대한 제목을 생성해주세요';
    const testResponse = { candidates: [{ title: 'AI 기술의 미래' }] };
    
    cacheManager.cacheAIResponse('openai', testPrompt, testResponse);
    const cachedResponse = cacheManager.getCachedAIResponse('openai', testPrompt);
    
    if (cachedResponse && cachedResponse.candidates) {
        console.log('✅ AI 응답 캐싱 성공');
    } else {
        console.log('❌ AI 응답 캐싱 실패');
    }

    // 3. 캐시 통계 확인
    console.log('3. 캐시 통계 확인');
    const stats = cacheManager.getStats();
    console.log('캐시 통계:', {
        hitRate: stats.hitRate,
        totalEntries: stats.totalEntries,
        totalSize: stats.totalSize
    });

    console.log('=== 캐시 매니저 테스트 완료 ===\n');
}

/**
 * AI 캐시 래퍼 테스트
 */
async function testAICacheWrapper() {
    console.log('\n=== AI 캐시 래퍼 테스트 시작 ===');
    
    const aiCache = getAICacheWrapper();
    
    // 모의 AI 함수
    const mockAIFunction = async (params) => {
        console.log('모의 AI 함수 호출:', params.content.substring(0, 20) + '...');
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 지연
        return {
            candidates: [
                { title: `${params.tags[0]} 기술의 혁신적 발전` },
                { title: `${params.tags[0]} 시장 동향 분석` }
            ]
        };
    };

    const testParams = {
        content: 'AI 기술이 빠르게 발전하고 있습니다. 생성형 AI가 주목받고 있습니다.',
        tags: ['AI', '기술'],
        subject: 'AI 기술 발전',
        tone: '객관적',
        lengthRange: { min: 10, max: 50 },
        filters: { titleLen: { min: 10, max: 100 } },
        guidelines: { dataBacked: true }
    };

    // 1. 첫 번째 호출 (캐시 미스)
    console.log('1. 첫 번째 AI 호출 (캐시 미스 예상)');
    const startTime1 = Date.now();
    const result1 = await aiCache.cachedOpenAICall(mockAIFunction, testParams);
    const duration1 = Date.now() - startTime1;
    
    console.log(`첫 번째 호출 완료: ${duration1}ms`);
    console.log('결과:', result1?.candidates?.length, '개 제목');

    // 2. 두 번째 호출 (캐시 히트)
    console.log('2. 두 번째 AI 호출 (캐시 히트 예상)');
    const startTime2 = Date.now();
    const result2 = await aiCache.cachedOpenAICall(mockAIFunction, testParams);
    const duration2 = Date.now() - startTime2;
    
    console.log(`두 번째 호출 완료: ${duration2}ms`);
    console.log('결과:', result2?.candidates?.length, '개 제목');

    // 성능 개선 확인
    if (duration2 < duration1 * 0.5) {
        console.log('✅ 캐싱으로 인한 성능 개선 확인');
    } else {
        console.log('❌ 캐싱 성능 개선 미확인');
    }

    // 3. 통계 확인
    const aiStats = aiCache.getStats();
    console.log('AI 캐시 통계:', aiStats);

    console.log('=== AI 캐시 래퍼 테스트 완료 ===\n');
}

/**
 * 메모리 최적화 테스트
 */
async function testMemoryOptimizer() {
    console.log('\n=== 메모리 최적화 테스트 시작 ===');
    
    const memoryOptimizer = getMemoryOptimizer();
    
    // 1. 대용량 텍스트 청크 처리 테스트
    console.log('1. 대용량 텍스트 청크 처리 테스트');
    
    const largeText = 'AI 기술이 발전하고 있습니다. '.repeat(1000); // 약 30KB
    const results = memoryOptimizer.processTextInChunks(
        largeText,
        (chunk, position) => {
            return { position, length: chunk.length };
        },
        5000 // 5KB 청크
    );
    
    console.log(`청크 처리 결과: ${results.length}개 청크`);

    // 2. 객체 배열 최적화 테스트
    console.log('2. 객체 배열 최적화 테스트');
    
    const testObjects = [
        { title: 'AI 기술', source: 'ai', score: 0.9, extra: 'unnecessary', metadata: { large: 'data' } },
        { title: '기술 혁신', source: 'content', score: 0.8, extra: 'unnecessary', metadata: { large: 'data' } }
    ];
    
    const optimized = memoryOptimizer.optimizeObjectArray(testObjects, ['title', 'source', 'score']);
    console.log('최적화 전:', JSON.stringify(testObjects[0]).length, '바이트');
    console.log('최적화 후:', JSON.stringify(optimized[0]).length, '바이트');

    // 3. 분석 결과 최적화 테스트
    console.log('3. 분석 결과 최적화 테스트');
    
    const testAnalysis = {
        headings: [
            { level: 1, text: 'AI 기술의 발전', position: 0, chars: 8, extra: 'data' },
            { level: 2, text: '생성형 AI', position: 100, chars: 5, extra: 'data' }
        ],
        keyPhrases: [
            { phrase: 'AI', frequency: 10, importance: 0.9, context: 'long context data' },
            { phrase: '기술', frequency: 8, importance: 0.8, context: 'long context data' }
        ],
        firstParagraph: {
            text: 'AI 기술이 빠르게 발전하고 있습니다. '.repeat(50),
            sentences: ['문장1', '문장2', '문장3'],
            keyPoints: ['포인트1', '포인트2']
        }
    };
    
    const optimizedAnalysis = memoryOptimizer.optimizeAnalysisResult(testAnalysis);
    
    const originalSize = JSON.stringify(testAnalysis).length;
    const optimizedSize = JSON.stringify(optimizedAnalysis).length;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`메모리 사용량 감소: ${originalSize} → ${optimizedSize} 바이트 (${reduction}% 감소)`);

    // 4. 메모리 통계 확인
    console.log('4. 메모리 통계 확인');
    const memoryStats = memoryOptimizer.getMemoryStats();
    console.log('메모리 통계:', memoryStats);

    const recommendations = memoryOptimizer.getOptimizationRecommendations();
    if (recommendations.length > 0) {
        console.log('최적화 권장사항:', recommendations);
    }

    console.log('=== 메모리 최적화 테스트 완료 ===\n');
}

/**
 * 통합 성능 테스트
 */
async function testIntegratedPerformance() {
    console.log('\n=== 통합 성능 테스트 시작 ===');
    
    const testContent = `
# AI 기술의 혁신적 발전

AI 기술이 빠르게 발전하고 있습니다. 생성형 AI는 300% 성장을 기록했습니다.

## 주요 동향

- OpenAI의 GPT 모델 발전
- Google의 Gemini 출시
- 삼성전자의 AI 반도체 투자

## 시장 전망

전문가들은 AI 시장이 2025년까지 97% 성장할 것으로 예측하고 있습니다.
`.repeat(5); // 내용 확장

    const testTags = ['AI', '기술', '혁신'];
    const testSubject = 'AI 기술 발전과 시장 전망';
    const testTone = '객관적';

    // 1. 첫 번째 실행 (캐시 미스)
    console.log('1. 첫 번째 제목 생성 (캐시 미스)');
    const startTime1 = Date.now();
    
    const analyzer1 = new ContentAnalyzer(testContent, testTags, testSubject, testTone);
    const generator1 = new TitleGenerator(analyzer1, {}, {});
    const result1 = await generator1.generateTitles();
    
    const duration1 = Date.now() - startTime1;
    console.log(`첫 번째 실행 완료: ${duration1}ms`);
    console.log(`생성된 제목 수: ${result1.candidates.length}`);
    console.log(`최적 제목: ${result1.bestTitle}`);

    // 2. 두 번째 실행 (캐시 히트)
    console.log('2. 두 번째 제목 생성 (캐시 히트 예상)');
    const startTime2 = Date.now();
    
    const analyzer2 = new ContentAnalyzer(testContent, testTags, testSubject, testTone);
    const generator2 = new TitleGenerator(analyzer2, {}, {});
    const result2 = await generator2.generateTitles();
    
    const duration2 = Date.now() - startTime2;
    console.log(`두 번째 실행 완료: ${duration2}ms`);
    console.log(`생성된 제목 수: ${result2.candidates.length}`);
    console.log(`캐시 사용 여부: ${result2.fromCache ? '예' : '아니오'}`);

    // 성능 개선 분석
    const improvement = ((duration1 - duration2) / duration1 * 100).toFixed(1);
    console.log(`성능 개선: ${improvement}% (${duration1}ms → ${duration2}ms)`);

    if (duration2 < duration1 * 0.3) {
        console.log('✅ 캐싱으로 인한 대폭적인 성능 개선 확인');
    } else if (duration2 < duration1 * 0.7) {
        console.log('✅ 캐싱으로 인한 성능 개선 확인');
    } else {
        console.log('❌ 캐싱 성능 개선 미확인');
    }

    // 3. 전체 시스템 통계
    console.log('3. 전체 시스템 통계');
    const cacheManager = getCacheManager();
    const memoryOptimizer = getMemoryOptimizer();
    
    const finalStats = {
        cache: cacheManager.getStats(),
        memory: memoryOptimizer.getMemoryStats()
    };
    
    console.log('최종 통계:', finalStats);

    console.log('=== 통합 성능 테스트 완료 ===\n');
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
    console.log('🚀 성능 최적화 및 캐싱 테스트 시작\n');
    
    try {
        await testCacheManager();
        await testAICacheWrapper();
        await testMemoryOptimizer();
        await testIntegratedPerformance();
        
        console.log('✅ 모든 테스트 완료');
        
    } catch (error) {
        console.error('❌ 테스트 실행 중 오류:', error);
        console.error(error.stack);
    }
}

// 테스트 실행 (직접 실행 시)
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { 
    testCacheManager, 
    testAICacheWrapper, 
    testMemoryOptimizer, 
    testIntegratedPerformance, 
    runAllTests 
};