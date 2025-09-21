/**
 * 시스템 상태 확인 테스트
 * 핵심 컴포넌트들이 정상적으로 로드되고 기본 기능이 작동하는지 확인
 */

import { ContentAnalyzer } from './content-analyzer.js';
import { TitleGenerator } from './title-generator.js';
import { TitleQualityEvaluator } from './title-quality-evaluator.js';
import { getMonitoringDashboard } from './monitoring-dashboard.js';
import { getAnalyticsEngine } from './analytics-engine.js';

class SystemHealthTest {
    constructor() {
        this.testResults = [];
    }

    /**
     * 모든 상태 확인 테스트 실행
     */
    async runHealthChecks() {
        console.log('🏥 시스템 상태 확인 테스트 시작...\n');

        this.testComponentLoading();
        this.testBasicFunctionality();
        this.testMonitoringComponents();

        this.printResults();
        return this.testResults.every(result => result.passed);
    }

    /**
     * 컴포넌트 로딩 테스트
     */
    testComponentLoading() {
        console.log('📦 컴포넌트 로딩 테스트...');

        this.test('ContentAnalyzer 로딩', () => {
            const analyzer = new ContentAnalyzer('테스트 콘텐츠');
            return analyzer !== null && typeof analyzer.analyze === 'function';
        });

        this.test('TitleGenerator 로딩', () => {
            const analyzer = new ContentAnalyzer('테스트 콘텐츠');
            const generator = new TitleGenerator(analyzer);
            return generator !== null && typeof generator.generateTitles === 'function';
        });

        this.test('TitleQualityEvaluator 로딩', () => {
            const analyzer = new ContentAnalyzer('테스트 콘텐츠');
            const evaluator = new TitleQualityEvaluator(analyzer);
            return evaluator !== null && typeof evaluator.evaluateTitle === 'function';
        });

        console.log('✅ 컴포넌트 로딩 테스트 완료\n');
    }

    /**
     * 기본 기능 테스트
     */
    testBasicFunctionality() {
        console.log('⚙️  기본 기능 테스트...');

        this.test('콘텐츠 분석 기본 기능', () => {
            try {
                const analyzer = new ContentAnalyzer('# 테스트 제목\n\n테스트 내용입니다.');
                const analysis = analyzer.analyze();
                return analysis && analysis.headings && Array.isArray(analysis.headings);
            } catch (error) {
                console.warn('콘텐츠 분석 오류:', error.message);
                return false;
            }
        });

        this.test('제목 생성 기본 기능', () => {
            try {
                const analyzer = new ContentAnalyzer('테스트 콘텐츠');
                const generator = new TitleGenerator(analyzer);
                // 실제 생성은 하지 않고 객체 생성만 확인
                return generator !== null;
            } catch (error) {
                console.warn('제목 생성 오류:', error.message);
                return false;
            }
        });

        this.test('품질 평가 기본 기능', () => {
            try {
                const analyzer = new ContentAnalyzer('테스트 콘텐츠');
                const evaluator = new TitleQualityEvaluator(analyzer);
                const evaluation = evaluator.evaluateTitle('테스트 제목');
                return evaluation && typeof evaluation.overallScore === 'number';
            } catch (error) {
                console.warn('품질 평가 오류:', error.message);
                return false;
            }
        });

        console.log('✅ 기본 기능 테스트 완료\n');
    }

    /**
     * 모니터링 컴포넌트 테스트
     */
    testMonitoringComponents() {
        console.log('📊 모니터링 컴포넌트 테스트...');

        this.test('모니터링 대시보드 초기화', () => {
            try {
                const dashboard = getMonitoringDashboard();
                return dashboard !== null && typeof dashboard.recordTitleGenerationRequest === 'function';
            } catch (error) {
                console.warn('모니터링 대시보드 오류:', error.message);
                return false;
            }
        });

        this.test('분석 엔진 초기화', () => {
            try {
                const analytics = getAnalyticsEngine();
                return analytics !== null && typeof analytics.recordTitlePerformance === 'function';
            } catch (error) {
                console.warn('분석 엔진 오류:', error.message);
                return false;
            }
        });

        this.test('기본 메트릭 기록', () => {
            try {
                const dashboard = getMonitoringDashboard();
                dashboard.recordTitleGenerationRequest(true, 100, 0.8, 'test');
                return true;
            } catch (error) {
                console.warn('메트릭 기록 오류:', error.message);
                return false;
            }
        });

        console.log('✅ 모니터링 컴포넌트 테스트 완료\n');
    }

    /**
     * 테스트 실행 헬퍼
     */
    test(name, testFunction) {
        try {
            const result = testFunction();
            this.testResults.push({
                name,
                passed: result,
                error: null
            });
            return result;
        } catch (error) {
            this.testResults.push({
                name,
                passed: false,
                error: error.message
            });
            return false;
        }
    }

    /**
     * 결과 출력
     */
    printResults() {
        console.log('📋 시스템 상태 확인 결과:');
        console.log('=' .repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}`);
            
            if (!result.passed && result.error) {
                console.log(`   오류: ${result.error}`);
            }
            
            result.passed ? passed++ : failed++;
        });
        
        console.log('=' .repeat(50));
        console.log(`총 ${this.testResults.length}개 테스트 중 ${passed}개 통과, ${failed}개 실패`);
        
        if (failed === 0) {
            console.log('🎉 시스템이 정상적으로 작동하고 있습니다!');
        } else {
            console.log(`⚠️  ${failed}개의 컴포넌트에 문제가 있습니다.`);
        }
    }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const healthTest = new SystemHealthTest();
    
    healthTest.runHealthChecks()
        .then((success) => {
            console.log('\n✨ 시스템 상태 확인 완료!');
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('시스템 상태 확인 중 오류:', error);
            process.exit(1);
        });
}

export { SystemHealthTest };