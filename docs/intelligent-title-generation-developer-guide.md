# 지능형 제목 생성 시스템 개발자 가이드

## 아키텍처 개요

지능형 제목 생성 시스템은 모듈화된 아키텍처로 설계되어 각 컴포넌트가 독립적으로 작동하면서도 유기적으로 연결됩니다.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ContentAnalyzer │───▶│  TitleGenerator │───▶│TitleQualityEval │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CacheManager  │    │ TitleGenLogger  │    │ MemoryOptimizer │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 핵심 컴포넌트

### 1. ContentAnalyzer

기사 내용을 분석하여 제목 생성에 필요한 정보를 추출합니다.

#### 주요 메서드
```javascript
class ContentAnalyzer {
    constructor(content, tags, subject, tone)
    analyze()                    // 전체 분석 실행
    extractHeadings()           // 헤딩 추출
    extractKeyPhrases()         // 키워드 추출
    extractFirstParagraph()     // 첫 문단 추출
    extractStatistics()         // 통계 데이터 추출
    extractEntities()           // 개체명 추출
    analyzeSentiment()          // 감정 분석
    getSummary()               // 분석 요약
}
```

#### 분석 결과 구조
```javascript
{
    headings: [
        { level: 1, text: "제목", position: 0, chars: 10 }
    ],
    keyPhrases: [
        { phrase: "AI", frequency: 5, importance: 0.8, source: "tag" }
    ],
    firstParagraph: {
        text: "첫 문단 내용",
        sentences: ["문장1", "문장2"],
        keyPoints: ["핵심1", "핵심2"],
        chars: 100
    },
    statistics: [
        { value: "300%", context: "맥락", position: 50, type: "percentage" }
    ],
    entities: [
        { text: "삼성", type: "ORGANIZATION", frequency: 2, confidence: 0.9 }
    ],
    sentiment: {
        overall: "positive",
        confidence: 0.8,
        aspects: { technology: "positive", market: "positive" }
    }
}
```

### 2. TitleGenerator

다단계 파이프라인을 통해 제목을 생성하고 관리합니다.

#### 제목 생성 파이프라인
1. **AI 제목 생성**: 외부 AI 모델 또는 내부 AI 로직
2. **콘텐츠 기반 제목**: 분석 결과를 활용한 제목
3. **휴리스틱 제목**: 규칙 기반 제목 생성
4. **태그 기반 제목**: 태그와 주제 조합 제목

#### 주요 메서드
```javascript
class TitleGenerator {
    constructor(contentAnalyzer, filters, guidelines)
    
    // 메인 메서드
    generateTitles()                    // 전체 파이프라인 실행
    
    // 개별 생성 메서드
    generateAITitles()                  // AI 제목 생성
    generateContentBasedTitles()        // 콘텐츠 기반 제목
    generateHeuristicTitles()          // 휴리스틱 제목
    generateTagBasedTitles()           // 태그 기반 제목
    
    // 유틸리티 메서드
    processAndRankCandidates()         // 후보 처리 및 순위
    setAITitles()                      // 외부 AI 제목 주입
}
```

#### 결과 구조
```javascript
{
    candidates: [
        { title: "제목", source: "ai_generation", score: 0.85 }
    ],
    bestTitle: "최고 제목",
    sources: ["ai_generation", "content_analysis"],
    analysis: { /* 분석 결과 */ },
    logs: { /* 실행 로그 */ },
    fromCache: false
}
```

### 3. TitleQualityEvaluator

제목의 품질을 다각도로 평가하고 개선 방안을 제시합니다.

#### 평가 기준
- **관련성 (25%)**: 콘텐츠와의 연관성
- **가독성 (20%)**: 읽기 쉬움 정도
- **길이 (15%)**: 적절한 길이 여부
- **SEO (15%)**: 검색 엔진 최적화
- **참여도 (15%)**: 클릭 유도 가능성
- **준수성 (10%)**: 가이드라인 준수

#### 주요 메서드
```javascript
class TitleQualityEvaluator {
    constructor(contentAnalyzer, filters, guidelines)
    
    evaluateTitle(title)               // 전체 평가 실행
    calculateRelevanceScore(title)     // 관련성 점수
    calculateLengthScore(title)        // 길이 점수
    calculateReadabilityScore(title)   // 가독성 점수
    calculateSEOScore(title)           // SEO 점수
    calculateEngagementScore(title)    // 참여도 점수
    calculateComplianceScore(title)    // 준수성 점수
    passesFilters(title, scores)       // 필터 통과 여부
    getEvaluationReasons(title, scores) // 평가 이유
}
```

## 성능 최적화

### 캐싱 시스템

시스템은 다층 캐싱을 통해 성능을 최적화합니다:

- **콘텐츠 분석 캐싱**: 동일한 콘텐츠 재분석 방지
- **AI 응답 캐싱**: AI API 호출 최소화
- **제목 후보 캐싱**: 제목 생성 결과 재사용
- **품질 평가 캐싱**: 동일 제목 재평가 방지

### 메모리 최적화

대용량 콘텐츠 처리를 위한 메모리 최적화:

```javascript
import { getMemoryOptimizer } from './lib/memory-optimizer.js';

const optimizer = getMemoryOptimizer();

// 메모리 통계 확인
const stats = optimizer.getMemoryStats();
console.log('메모리 사용량:', stats);

// 강제 가비지 컬렉션
optimizer.forceGarbageCollection();
```

## API 변경사항 및 마이그레이션

### 기존 시스템에서 마이그레이션

기존 enhance.js API와의 호환성을 유지하면서 새로운 시스템을 사용할 수 있습니다:

```javascript
// 기존 방식 (여전히 지원)
const result = await enhanceTitle(content, tags, subject, tone);

// 새로운 방식 (권장)
const analyzer = new ContentAnalyzer(content, tags, subject, tone);
const generator = new TitleGenerator(analyzer);
const result = await generator.generateTitles();
```

### 주요 변경사항

1. **응답 구조 확장**: 더 상세한 분석 정보와 로그 포함
2. **품질 평가 추가**: 제목별 품질 점수 및 개선 권장사항
3. **다중 소스 지원**: AI, 콘텐츠, 휴리스틱, 태그 기반 제목
4. **캐싱 및 성능 최적화**: 대폭 향상된 처리 속도

### 하위 호환성

기존 API 호출은 계속 작동하며, 내부적으로 새로운 시스템을 사용합니다:

- 기존 응답 형식 유지
- 기존 매개변수 지원
- 점진적 마이그레이션 가능

## 확장 및 커스터마이징

### 새로운 제목 생성 방법 추가

```javascript
class CustomTitleGenerator extends TitleGenerator {
    generateCustomTitles() {
        // 커스텀 제목 생성 로직
        const titles = [];
        // ... 구현
        return titles;
    }
    
    async generateTitles() {
        const result = await super.generateTitles();
        
        // 커스텀 제목 추가
        const customTitles = this.generateCustomTitles();
        result.candidates.push(...customTitles.map(title => ({
            title, source: 'custom'
        })));
        
        return result;
    }
}
```

### 커스텀 품질 평가 기준

```javascript
class CustomQualityEvaluator extends TitleQualityEvaluator {
    calculateCustomScore(title) {
        // 커스텀 평가 로직
        return 0.5;
    }
    
    calculateOverallScore(scores) {
        const customScore = this.calculateCustomScore(scores.title);
        const baseScore = super.calculateOverallScore(scores);
        
        // 커스텀 점수를 가중치로 반영
        return (baseScore * 0.8) + (customScore * 0.2);
    }
}
```

### 커스텀 필터 추가

```javascript
const customFilters = {
    ...defaultFilters,
    customRule: (title) => {
        // 커스텀 필터 로직
        return title.includes('특정키워드');
    },
    industrySpecific: {
        technology: ['AI', '기술', '혁신'],
        finance: ['투자', '시장', '금융'],
        healthcare: ['의료', '건강', '치료']
    }
};
```

## 테스트 및 디버깅

### 단위 테스트 실행

```bash
# 개별 컴포넌트 테스트
node lib/test-content-analyzer.js
node lib/test-title-generator-advanced.js
node lib/test-title-quality-evaluator.js
node lib/test-title-generation-logger.js

# 통합 테스트
node lib/test-integration-title-system.js

# 품질 보증 테스트
node lib/test-quality-assurance.js
```

### 디버깅 도구

```javascript
// 상세 로그 활성화
const generator = new TitleGenerator(analyzer, filters, {
    ...guidelines,
    debug: true
});

// 실행 후 디버그 정보 확인
const result = await generator.generateTitles();
const debugInfo = result.logs;

console.log('디버그 정보:', debugInfo);
```

## 성능 모니터링

### 메트릭 수집

시스템은 다음 메트릭을 자동으로 수집합니다:

- **실행 시간**: 각 단계별 처리 시간
- **메모리 사용량**: 힙 메모리 사용량 추적
- **캐시 효율성**: 히트율 및 미스율
- **품질 점수**: 생성된 제목들의 평균 품질
- **성공률**: 제목 생성 성공/실패 비율

### 모니터링 대시보드 데이터

```javascript
// 시스템 전체 통계
const systemStats = {
    cache: cacheManager.getStats(),
    memory: memoryOptimizer.getMemoryStats(),
    performance: logger.getSummary()
};

console.log('시스템 통계:', systemStats);
```

---

*이 문서는 지능형 제목 생성 시스템의 내부 구조와 확장 방법을 다룹니다.*