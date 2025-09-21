/**
 * TitleGenerationLogger 단위 테스트
 * 로깅 시스템의 모든 기능을 테스트
 */

import { TitleGenerationLogger } from './title-generation-logger.js';

/**
 * 기본 로깅 기능 테스트
 */
function testBasicLogging() {
    console.log('\n=== 기본 로깅 기능 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        logLevel: 'debug',
        enableConsole: false // 테스트 중 콘솔 출력 비활성화
    });
    
    // 다양한 레벨의 로그 기록
    logger.logStep('테스트 시작', { testId: 'basic-001' }, 'info');
    logger.logDebug('디버그 정보', { debugData: 'test' });
    logger.logWarning('경고 테스트', '이것은 테스트 경고입니다');
    logger.logError('오류 테스트', new Error('테스트 오류'));
    
    const summary = logger.getSummary();
    
    console.log('✅ 로그 기록 완료');
    console.log(`- 총 로그 수: ${summary.logs.total}`);
    console.log(`- 오류 수: ${summary.logs.errors}`);
    console.log(`- 경고 수: ${summary.logs.warnings}`);
    console.log(`- 성공률: ${summary.steps.successRate}`);
    
    // 검증
    const passed = summary.logs.total >= 4 && 
                  summary.logs.errors === 1 && 
                  summary.logs.warnings === 1;
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 단계별 타이머 테스트
 */
function testStepTiming() {
    console.log('\n=== 단계별 타이머 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false
    });
    
    // 단계 시작/종료 테스트
    logger.startStep('데이터 로딩');
    
    // 시뮬레이션 지연
    const start = Date.now();
    while (Date.now() - start < 50) {
        // 50ms 대기
    }
    
    logger.endStep('데이터 로딩', { recordsLoaded: 100 }, true);
    
    logger.startStep('데이터 처리');
    
    // 또 다른 시뮬레이션 지연
    const start2 = Date.now();
    while (Date.now() - start2 < 30) {
        // 30ms 대기
    }
    
    logger.endStep('데이터 처리', { recordsProcessed: 100 }, false);
    
    const summary = logger.getSummary();
    const debugInfo = logger.getDebugInfo({ includeStepTimes: true });
    
    console.log('✅ 단계별 타이머 테스트 완료');
    console.log(`- 총 실행 시간: ${summary.executionTime.total}`);
    console.log(`- 성공한 단계: ${summary.steps.successful}`);
    console.log(`- 실패한 단계: ${summary.steps.failed}`);
    
    // 성능 분석 확인
    if (debugInfo.stepPerformance) {
        console.log('- 단계별 성능:');
        Object.keys(debugInfo.stepPerformance).forEach(step => {
            const perf = debugInfo.stepPerformance[step];
            console.log(`  • ${step}: ${perf.median} (중간값)`);
        });
    }
    
    const passed = summary.steps.total === 2 && 
                  summary.steps.successful === 1 && 
                  summary.steps.failed === 1;
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 메트릭 수집 테스트
 */
function testMetricsCollection() {
    console.log('\n=== 메트릭 수집 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false,
        enableMetrics: true
    });
    
    // 다양한 메트릭 기록
    logger.recordMetric('처리량', 1000, 'records/sec');
    logger.recordMetric('응답시간', 250, 'ms');
    logger.recordMetric('메모리사용량', 128, 'MB');
    
    // 여러 단계 실행으로 메트릭 생성
    for (let i = 0; i < 5; i++) {
        logger.startStep(`처리단계${i}`);
        
        // 시뮬레이션 작업
        const start = Date.now();
        while (Date.now() - start < 10 + i * 5) {
            // 가변 지연
        }
        
        logger.endStep(`처리단계${i}`, { iteration: i }, true);
    }
    
    const summary = logger.getSummary();
    const performance = summary.performance;
    
    console.log('✅ 메트릭 수집 테스트 완료');
    console.log(`- 수집된 성능 데이터: ${Object.keys(performance).length}개 단계`);
    console.log(`- 메모리 샘플: ${summary.memory.samples || 0}개`);
    
    // 성능 데이터 확인
    if (performance['처리단계0']) {
        console.log(`- 처리단계0 평균: ${performance['처리단계0'].average}`);
    }
    
    const passed = Object.keys(performance).length >= 5 && 
                  summary.steps.total >= 5;
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 로그 레벨 필터링 테스트
 */
function testLogLevelFiltering() {
    console.log('\n=== 로그 레벨 필터링 테스트 ===');
    
    // ERROR 레벨만 기록하는 로거
    const errorLogger = new TitleGenerationLogger({
        logLevel: 'error',
        enableConsole: false
    });
    
    errorLogger.logDebug('디버그 메시지', { shouldNotAppear: true });
    errorLogger.logStep('정보 메시지', { shouldNotAppear: true }, 'info');
    errorLogger.logWarning('경고 메시지', 'shouldNotAppear');
    errorLogger.logError('오류 메시지', new Error('이것만 나타나야 함'));
    
    const errorSummary = errorLogger.getSummary();
    
    // INFO 레벨 이상 기록하는 로거
    const infoLogger = new TitleGenerationLogger({
        logLevel: 'info',
        enableConsole: false
    });
    
    infoLogger.logDebug('디버그 메시지', { shouldNotAppear: true });
    infoLogger.logStep('정보 메시지', { shouldAppear: true }, 'info');
    infoLogger.logWarning('경고 메시지', 'shouldAppear');
    infoLogger.logError('오류 메시지', new Error('shouldAppear'));
    
    const infoSummary = infoLogger.getSummary();
    
    console.log('✅ 로그 레벨 필터링 테스트 완료');
    console.log(`- ERROR 레벨 로거: ${errorSummary.logs.total}개 로그 (예상: 1개)`);
    console.log(`- INFO 레벨 로거: ${infoSummary.logs.total}개 로그 (예상: 3개)`);
    
    const passed = errorSummary.logs.total === 1 && 
                  infoSummary.logs.total === 3;
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 로그 내보내기 테스트
 */
function testLogExport() {
    console.log('\n=== 로그 내보내기 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false
    });
    
    // 테스트 로그 생성
    logger.logStep('내보내기 테스트 시작', { testData: 'export-test' });
    logger.logWarning('테스트 경고', '내보내기용 경고');
    logger.recordMetric('테스트메트릭', 42, 'units');
    
    const exportedData = logger.exportLogs();
    
    console.log('✅ 로그 내보내기 테스트 완료');
    console.log(`- 내보낸 데이터 크기: ${exportedData.length} 문자`);
    
    // JSON 파싱 테스트
    let parsed = null;
    try {
        parsed = JSON.parse(exportedData);
        console.log(`- JSON 파싱: ✅ 성공`);
        console.log(`- 세션 ID: ${parsed.sessionId}`);
        console.log(`- 로그 수: ${parsed.logs.length}`);
    } catch (error) {
        console.log(`- JSON 파싱: ❌ 실패 - ${error.message}`);
    }
    
    const passed = exportedData.length > 0 && 
                  parsed !== null && 
                  parsed.sessionId && 
                  Array.isArray(parsed.logs);
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 성능 분석 테스트
 */
function testPerformanceAnalysis() {
    console.log('\n=== 성능 분석 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false
    });
    
    // 다양한 성능 패턴으로 단계 실행
    const stepName = '성능테스트단계';
    const executionTimes = [10, 15, 12, 18, 14, 20, 16, 13, 17, 19];
    
    executionTimes.forEach((time, index) => {
        logger.startStep(stepName);
        
        const start = Date.now();
        while (Date.now() - start < time) {
            // 지정된 시간만큼 대기
        }
        
        logger.endStep(stepName, { iteration: index }, true);
    });
    
    const debugInfo = logger.getDebugInfo({ includeStepTimes: true });
    const stepPerf = debugInfo.stepPerformance[stepName];
    
    console.log('✅ 성능 분석 테스트 완료');
    if (stepPerf) {
        console.log(`- 중간값: ${stepPerf.median}`);
        console.log(`- 95퍼센타일: ${stepPerf.p95}`);
        console.log(`- 분산: ${stepPerf.variance}`);
        console.log(`- 트렌드: ${stepPerf.trend}`);
    }
    
    const summary = logger.getSummary();
    const performance = summary.performance[stepName];
    
    if (performance) {
        console.log(`- 실행 횟수: ${performance.count}`);
        console.log(`- 평균 시간: ${performance.average}`);
        console.log(`- 최소/최대: ${performance.min}/${performance.max}`);
    }
    
    const passed = stepPerf && 
                  performance && 
                  performance.count === executionTimes.length.toString();
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 메모리 모니터링 테스트
 */
function testMemoryMonitoring() {
    console.log('\n=== 메모리 모니터링 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false,
        enableMetrics: true
    });
    
    // 메모리 사용량을 기록하기 위해 여러 단계 실행
    for (let i = 0; i < 15; i++) {
        logger.logStep(`메모리테스트${i}`, { 
            data: 'x'.repeat(1000), // 약간의 메모리 사용
            iteration: i 
        });
    }
    
    const summary = logger.getSummary();
    const memoryInfo = summary.memory;
    
    console.log('✅ 메모리 모니터링 테스트 완료');
    
    if (memoryInfo.available !== false) {
        console.log(`- 현재 메모리: ${memoryInfo.current}`);
        console.log(`- 최대 메모리: ${memoryInfo.peak}`);
        console.log(`- 평균 메모리: ${memoryInfo.average}`);
        console.log(`- 샘플 수: ${memoryInfo.samples}`);
    } else {
        console.log('- 메모리 정보 사용 불가 (Node.js 환경 아님)');
    }
    
    // 메모리 정보가 있거나 Node.js가 아닌 환경에서는 통과
    const passed = memoryInfo.available !== false || typeof process === 'undefined';
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 로거 리셋 테스트
 */
function testLoggerReset() {
    console.log('\n=== 로거 리셋 테스트 ===');
    
    const logger = new TitleGenerationLogger({
        enableConsole: false
    });
    
    // 초기 데이터 생성
    logger.logStep('리셋 전 로그', { data: 'before-reset' });
    logger.logError('리셋 전 오류', new Error('before-reset'));
    
    const beforeReset = logger.getSummary();
    const sessionIdBefore = beforeReset.sessionId;
    
    // 리셋 실행
    logger.reset();
    
    // 리셋 후 데이터 생성
    logger.logStep('리셋 후 로그', { data: 'after-reset' });
    
    const afterReset = logger.getSummary();
    const sessionIdAfter = afterReset.sessionId;
    
    console.log('✅ 로거 리셋 테스트 완료');
    console.log(`- 리셋 전 로그 수: ${beforeReset.logs.total}`);
    console.log(`- 리셋 후 로그 수: ${afterReset.logs.total}`);
    console.log(`- 세션 ID 변경: ${sessionIdBefore !== sessionIdAfter ? '✅' : '❌'}`);
    
    const passed = beforeReset.logs.total >= 2 && 
                  afterReset.logs.total === 1 && 
                  sessionIdBefore !== sessionIdAfter;
    
    console.log(`테스트 결과: ${passed ? '✅ 통과' : '❌ 실패'}`);
    return passed;
}

/**
 * 전체 테스트 실행
 */
function runAllTests() {
    console.log('🚀 TitleGenerationLogger 단위 테스트 시작\n');
    
    const tests = [
        testBasicLogging,
        testStepTiming,
        testMetricsCollection,
        testLogLevelFiltering,
        testLogExport,
        testPerformanceAnalysis,
        testMemoryMonitoring,
        testLoggerReset
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            if (test()) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`테스트 실행 중 오류: ${error.message}`);
            failed++;
        }
    });
    
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
    testBasicLogging,
    testStepTiming,
    testMetricsCollection,
    testLogLevelFiltering,
    testLogExport,
    testPerformanceAnalysis,
    testMemoryMonitoring,
    testLoggerReset,
    runAllTests
};