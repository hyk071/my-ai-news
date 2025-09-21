/**
 * TitleGenerationLogger - 제목 생성 과정의 상세한 로그 관리 클래스
 * 각 단계별 실행 시간, 성공/실패 상태, 오류 정보를 기록하고 디버깅 정보를 제공
 */

class TitleGenerationLogger {
    constructor(options = {}) {
        this.logs = [];
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        this.options = {
            logLevel: options.logLevel || 'info', // debug, info, warn, error
            maxLogs: options.maxLogs || 1000,
            enableConsole: options.enableConsole !== false,
            enableMetrics: options.enableMetrics !== false,
            timestampFormat: options.timestampFormat || 'relative' // relative, absolute, iso
        };

        // 성능 메트릭
        this.metrics = {
            totalSteps: 0,
            successfulSteps: 0,
            failedSteps: 0,
            warningSteps: 0,
            totalExecutionTime: 0,
            stepTimes: {},
            memoryUsage: [],
            errors: [],
            warnings: []
        };

        // 단계별 타이머
        this.stepTimers = new Map();

        this.logStep('Logger 초기화', {
            sessionId: this.sessionId,
            options: this.options,
            startTime: new Date(this.startTime).toISOString()
        }, 'info');
    }

    /**
     * 세션 ID 생성
     * @returns {string} 고유 세션 ID
     */
    generateSessionId() {
        return 'tg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 단계 로그 기록
     * @param {string} step 단계명
     * @param {Object} data 로그 데이터
     * @param {string} level 로그 레벨 (debug, info, warn, error)
     */
    logStep(step, data = {}, level = 'info') {
        const timestamp = Date.now();
        const relativeTime = timestamp - this.startTime;
        
        const logEntry = {
            sessionId: this.sessionId,
            timestamp: this.formatTimestamp(timestamp),
            relativeTime: relativeTime,
            step: step,
            level: level,
            data: this.sanitizeData(data),
            memoryUsage: this.getCurrentMemoryUsage()
        };

        // 로그 레벨 필터링
        if (this.shouldLog(level)) {
            this.logs.push(logEntry);
            
            // 콘솔 출력
            if (this.options.enableConsole) {
                this.outputToConsole(logEntry);
            }

            // 메트릭 업데이트
            if (this.options.enableMetrics) {
                this.updateMetrics(step, level, relativeTime);
            }

            // 로그 크기 제한
            this.trimLogsIfNeeded();
        }
    }

    /**
     * 오류 로그 기록
     * @param {string} step 단계명
     * @param {Error|string} error 오류 객체 또는 메시지
     * @param {Object} context 추가 컨텍스트
     */
    logError(step, error, context = {}) {
        const errorInfo = {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Error',
            context: context
        };

        this.logStep(step, { error: errorInfo }, 'error');
        
        // 오류 메트릭 업데이트
        if (this.options.enableMetrics) {
            this.metrics.errors.push({
                step: step,
                error: errorInfo,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 경고 로그 기록
     * @param {string} step 단계명
     * @param {string} message 경고 메시지
     * @param {Object} context 추가 컨텍스트
     */
    logWarning(step, message, context = {}) {
        const warningInfo = {
            message: message,
            context: context
        };

        this.logStep(step, { warning: warningInfo }, 'warn');
        
        // 경고 메트릭 업데이트
        if (this.options.enableMetrics) {
            this.metrics.warnings.push({
                step: step,
                message: message,
                context: context,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 디버그 로그 기록
     * @param {string} step 단계명
     * @param {Object} data 디버그 데이터
     */
    logDebug(step, data = {}) {
        this.logStep(step, data, 'debug');
    }

    /**
     * 단계 시작 시간 기록
     * @param {string} stepName 단계명
     */
    startStep(stepName) {
        this.stepTimers.set(stepName, Date.now());
        this.logDebug(`${stepName} 시작`, { stepName });
    }

    /**
     * 단계 종료 및 실행 시간 기록
     * @param {string} stepName 단계명
     * @param {Object} result 실행 결과
     * @param {boolean} success 성공 여부
     */
    endStep(stepName, result = {}, success = true) {
        const startTime = this.stepTimers.get(stepName);
        if (startTime) {
            const executionTime = Date.now() - startTime;
            this.stepTimers.delete(stepName);

            const logData = {
                stepName,
                executionTime: `${executionTime}ms`,
                success,
                result: this.sanitizeData(result)
            };

            const level = success ? 'info' : 'error';
            this.logStep(`${stepName} 완료`, logData, level);

            // 단계별 실행 시간 메트릭 업데이트
            if (this.options.enableMetrics) {
                if (!this.metrics.stepTimes[stepName]) {
                    this.metrics.stepTimes[stepName] = [];
                }
                this.metrics.stepTimes[stepName].push(executionTime);
            }
        }
    }

    /**
     * 성능 메트릭 기록
     * @param {string} metricName 메트릭명
     * @param {number} value 값
     * @param {string} unit 단위
     */
    recordMetric(metricName, value, unit = '') {
        this.logStep('성능 메트릭', {
            metric: metricName,
            value: value,
            unit: unit
        }, 'debug');
    }

    /**
     * 전체 실행 요약 정보 제공
     * @returns {Object} 실행 요약 정보
     */
    getSummary() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;

        const summary = {
            sessionId: this.sessionId,
            executionTime: {
                total: `${totalTime}ms`,
                start: new Date(this.startTime).toISOString(),
                end: new Date(endTime).toISOString()
            },
            logs: {
                total: this.logs.length,
                byLevel: this.getLogCountsByLevel(),
                errors: this.metrics.errors.length,
                warnings: this.metrics.warnings.length
            },
            steps: {
                total: this.metrics.totalSteps,
                successful: this.metrics.successfulSteps,
                failed: this.metrics.failedSteps,
                successRate: this.metrics.totalSteps > 0 ? 
                           `${((this.metrics.successfulSteps / this.metrics.totalSteps) * 100).toFixed(1)}%` : '0%'
            },
            performance: this.getPerformanceSummary(),
            memory: this.getMemorySummary()
        };

        // 최근 오류들
        if (this.metrics.errors.length > 0) {
            summary.recentErrors = this.metrics.errors.slice(-5).map(err => ({
                step: err.step,
                message: err.error.message,
                timestamp: new Date(err.timestamp).toISOString()
            }));
        }

        // 최근 경고들
        if (this.metrics.warnings.length > 0) {
            summary.recentWarnings = this.metrics.warnings.slice(-3).map(warn => ({
                step: warn.step,
                message: warn.message,
                timestamp: new Date(warn.timestamp).toISOString()
            }));
        }

        return summary;
    }

    /**
     * 상세 디버깅 정보 제공
     * @param {Object} options 옵션
     * @returns {Object} 디버깅 정보
     */
    getDebugInfo(options = {}) {
        const {
            includeLogs = true,
            includeMetrics = true,
            includeStepTimes = true,
            logLevel = 'info',
            maxLogs = 100
        } = options;

        const debugInfo = {
            sessionId: this.sessionId,
            summary: this.getSummary()
        };

        if (includeLogs) {
            debugInfo.logs = this.logs
                .filter(log => this.isLogLevelIncluded(log.level, logLevel))
                .slice(-maxLogs)
                .map(log => ({
                    timestamp: log.timestamp,
                    step: log.step,
                    level: log.level,
                    data: log.data
                }));
        }

        if (includeMetrics) {
            debugInfo.metrics = {
                ...this.metrics,
                memoryUsage: this.metrics.memoryUsage.slice(-10) // 최근 10개만
            };
        }

        if (includeStepTimes) {
            debugInfo.stepPerformance = this.getStepPerformanceAnalysis();
        }

        return debugInfo;
    }

    /**
     * 로그를 파일로 내보내기 (JSON 형식)
     * @returns {string} JSON 형식의 로그 데이터
     */
    exportLogs() {
        const exportData = {
            sessionId: this.sessionId,
            exportTime: new Date().toISOString(),
            summary: this.getSummary(),
            logs: this.logs,
            metrics: this.metrics
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 로그 레벨 확인
     * @param {string} level 확인할 로그 레벨
     * @returns {boolean} 로그 출력 여부
     */
    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.options.logLevel] || 1;
        const checkLevel = levels[level] || 1;
        return checkLevel >= currentLevel;
    }

    /**
     * 로그 레벨 포함 여부 확인
     * @param {string} logLevel 로그 레벨
     * @param {string} filterLevel 필터 레벨
     * @returns {boolean} 포함 여부
     */
    isLogLevelIncluded(logLevel, filterLevel) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        return (levels[logLevel] || 1) >= (levels[filterLevel] || 1);
    }

    /**
     * 콘솔 출력
     * @param {Object} logEntry 로그 엔트리
     */
    outputToConsole(logEntry) {
        const { level, step, relativeTime, data } = logEntry;
        const timeStr = `[${relativeTime}ms]`;
        const message = `${timeStr} ${step}`;

        switch (level) {
            case 'debug':
                console.debug(message, data);
                break;
            case 'info':
                console.log(message, data);
                break;
            case 'warn':
                console.warn(message, data);
                break;
            case 'error':
                console.error(message, data);
                break;
            default:
                console.log(message, data);
        }
    }

    /**
     * 타임스탬프 포맷팅
     * @param {number} timestamp 타임스탬프
     * @returns {string} 포맷된 타임스탬프
     */
    formatTimestamp(timestamp) {
        switch (this.options.timestampFormat) {
            case 'absolute':
                return timestamp.toString();
            case 'iso':
                return new Date(timestamp).toISOString();
            case 'relative':
            default:
                return `+${timestamp - this.startTime}ms`;
        }
    }

    /**
     * 데이터 정리 (민감한 정보 제거)
     * @param {Object} data 원본 데이터
     * @returns {Object} 정리된 데이터
     */
    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sanitized = { ...data };
        
        // 민감한 키워드 제거
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
        sensitiveKeys.forEach(key => {
            if (sanitized[key]) {
                sanitized[key] = '[REDACTED]';
            }
        });

        // 너무 큰 객체 제한
        const jsonStr = JSON.stringify(sanitized);
        if (jsonStr.length > 10000) {
            return { ...sanitized, _truncated: true, _originalSize: jsonStr.length };
        }

        return sanitized;
    }

    /**
     * 현재 메모리 사용량 조회
     * @returns {Object} 메모리 사용량 정보
     */
    getCurrentMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            return {
                heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
                heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
                external: Math.round(usage.external / 1024 / 1024 * 100) / 100 // MB
            };
        }
        return null;
    }

    /**
     * 메트릭 업데이트
     * @param {string} step 단계명
     * @param {string} level 로그 레벨
     * @param {number} relativeTime 상대 시간
     */
    updateMetrics(step, level, relativeTime) {
        this.metrics.totalSteps++;
        
        switch (level) {
            case 'error':
                this.metrics.failedSteps++;
                break;
            case 'warn':
                this.metrics.warningSteps++;
                break;
            default:
                this.metrics.successfulSteps++;
        }

        // 메모리 사용량 기록 (주기적으로)
        if (this.metrics.totalSteps % 10 === 0) {
            const memUsage = this.getCurrentMemoryUsage();
            if (memUsage) {
                this.metrics.memoryUsage.push({
                    timestamp: Date.now(),
                    ...memUsage
                });
            }
        }
    }

    /**
     * 로그 레벨별 개수 조회
     * @returns {Object} 레벨별 로그 개수
     */
    getLogCountsByLevel() {
        const counts = { debug: 0, info: 0, warn: 0, error: 0 };
        this.logs.forEach(log => {
            if (counts.hasOwnProperty(log.level)) {
                counts[log.level]++;
            }
        });
        return counts;
    }

    /**
     * 성능 요약 정보 조회
     * @returns {Object} 성능 요약
     */
    getPerformanceSummary() {
        const stepTimes = this.metrics.stepTimes;
        const summary = {};

        Object.keys(stepTimes).forEach(stepName => {
            const times = stepTimes[stepName];
            if (times.length > 0) {
                const total = times.reduce((sum, time) => sum + time, 0);
                const avg = total / times.length;
                const min = Math.min(...times);
                const max = Math.max(...times);

                summary[stepName] = {
                    count: times.length,
                    total: `${total}ms`,
                    average: `${Math.round(avg)}ms`,
                    min: `${min}ms`,
                    max: `${max}ms`
                };
            }
        });

        return summary;
    }

    /**
     * 메모리 사용량 요약 조회
     * @returns {Object} 메모리 요약
     */
    getMemorySummary() {
        const memoryData = this.metrics.memoryUsage;
        if (memoryData.length === 0) {
            return { available: false };
        }

        const latest = memoryData[memoryData.length - 1];
        const heapUsages = memoryData.map(m => m.heapUsed);
        const peak = Math.max(...heapUsages);
        const average = heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length;

        return {
            current: `${latest.heapUsed}MB`,
            peak: `${peak}MB`,
            average: `${Math.round(average * 100) / 100}MB`,
            samples: memoryData.length
        };
    }

    /**
     * 단계별 성능 분석
     * @returns {Object} 단계별 성능 분석 결과
     */
    getStepPerformanceAnalysis() {
        const analysis = {};
        const stepTimes = this.metrics.stepTimes;

        Object.keys(stepTimes).forEach(stepName => {
            const times = stepTimes[stepName];
            if (times.length > 0) {
                const sorted = [...times].sort((a, b) => a - b);
                const median = sorted[Math.floor(sorted.length / 2)];
                const p95 = sorted[Math.floor(sorted.length * 0.95)];

                analysis[stepName] = {
                    median: `${median}ms`,
                    p95: `${p95}ms`,
                    variance: this.calculateVariance(times),
                    trend: this.calculateTrend(times)
                };
            }
        });

        return analysis;
    }

    /**
     * 분산 계산
     * @param {Array} values 값 배열
     * @returns {number} 분산
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.round(variance);
    }

    /**
     * 트렌드 계산 (단순 선형 회귀)
     * @param {Array} values 값 배열
     * @returns {string} 트렌드 ('improving', 'stable', 'degrading')
     */
    calculateTrend(values) {
        if (values.length < 3) return 'stable';

        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, idx) => sum + (idx * val), 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        if (slope > 5) return 'degrading';
        if (slope < -5) return 'improving';
        return 'stable';
    }

    /**
     * 로그 크기 제한
     */
    trimLogsIfNeeded() {
        if (this.logs.length > this.options.maxLogs) {
            const removeCount = this.logs.length - this.options.maxLogs;
            this.logs.splice(0, removeCount);
        }
    }

    /**
     * 로거 리셋
     */
    reset() {
        this.logs = [];
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        this.metrics = {
            totalSteps: 0,
            successfulSteps: 0,
            failedSteps: 0,
            warningSteps: 0,
            totalExecutionTime: 0,
            stepTimes: {},
            memoryUsage: [],
            errors: [],
            warnings: []
        };
        this.stepTimers.clear();
    }
}

export { TitleGenerationLogger };