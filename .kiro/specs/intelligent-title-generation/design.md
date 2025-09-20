# Design Document

## Overview

현재 뉴스 생성 시스템의 제목 생성 문제를 해결하기 위한 지능형 제목 생성 시스템을 설계합니다. 이 시스템은 다층적 접근 방식을 사용하여 AI 제목 생성, 콘텐츠 분석 기반 제목 추출, 그리고 휴리스틱 백업을 통해 항상 의미있는 제목을 생성합니다.

## Architecture

### 현재 시스템 분석

**문제점:**
1. AI 제목 생성 실패 시 부적절한 폴백 로직
2. 기사 내용과 제목의 연관성 검증 부족
3. 제목 후보 품질 필터링 미흡
4. 디버깅 정보 부족

**개선 방향:**
1. 다단계 제목 생성 파이프라인 구축
2. 콘텐츠 분석 기반 제목 추출 강화
3. 제목 품질 평가 및 필터링 시스템 도입
4. 상세한 로깅 및 디버깅 시스템 구축

### 시스템 아키텍처

```
[기사 내용] 
    ↓
[콘텐츠 전처리 및 분석]
    ↓
[다단계 제목 생성 파이프라인]
    ├── 1단계: AI 제목 생성 (OpenAI/Claude/Gemini)
    ├── 2단계: 콘텐츠 분석 기반 제목 추출
    ├── 3단계: 휴리스틱 제목 생성
    └── 4단계: 태그/주제 기반 제목 생성
    ↓
[제목 품질 평가 및 필터링]
    ↓
[제목 후보 순위 결정]
    ↓
[최종 제목 선택 및 반환]
```

## Components and Interfaces

### 1. ContentAnalyzer

기사 내용을 분석하여 제목 생성에 필요한 정보를 추출합니다.

```javascript
class ContentAnalyzer {
  constructor(content, tags, subject, tone) {
    this.content = content;
    this.tags = tags;
    this.subject = subject;
    this.tone = tone;
    this.analysis = null;
  }

  analyze() {
    return {
      headings: this.extractHeadings(),
      keyPhrases: this.extractKeyPhrases(),
      firstParagraph: this.extractFirstParagraph(),
      statistics: this.extractStatistics(),
      entities: this.extractEntities(),
      sentiment: this.analyzeSentiment()
    };
  }

  extractHeadings() {
    // H1, H2, H3 태그에서 제목 후보 추출
  }

  extractKeyPhrases() {
    // 핵심 키워드와 구문 추출
  }

  extractFirstParagraph() {
    // 첫 번째 의미있는 문단 추출
  }

  extractStatistics() {
    // 숫자, 퍼센트, 통계 데이터 추출
  }

  extractEntities() {
    // 회사명, 인명, 지명 등 개체명 추출
  }

  analyzeSentiment() {
    // 기사의 전반적인 톤 분석
  }
}
```

### 2. TitleGenerator

다단계 제목 생성 파이프라인을 관리합니다.

```javascript
class TitleGenerator {
  constructor(contentAnalyzer, filters, guidelines) {
    this.analyzer = contentAnalyzer;
    this.filters = filters;
    this.guidelines = guidelines;
    this.logger = new TitleGenerationLogger();
  }

  async generateTitles() {
    const candidates = [];
    
    // 1단계: AI 제목 생성
    const aiTitles = await this.generateAITitles();
    candidates.push(...aiTitles);
    
    // 2단계: 콘텐츠 분석 기반 제목
    const contentTitles = this.generateContentBasedTitles();
    candidates.push(...contentTitles);
    
    // 3단계: 휴리스틱 제목
    const heuristicTitles = this.generateHeuristicTitles();
    candidates.push(...heuristicTitles);
    
    // 4단계: 태그/주제 기반 제목
    const tagBasedTitles = this.generateTagBasedTitles();
    candidates.push(...tagBasedTitles);
    
    return this.processAndRankCandidates(candidates);
  }

  async generateAITitles() {
    // 기존 AI 제목 생성 로직 개선
  }

  generateContentBasedTitles() {
    // 콘텐츠 분석 결과를 기반으로 제목 생성
  }

  generateHeuristicTitles() {
    // 규칙 기반 제목 생성
  }

  generateTagBasedTitles() {
    // 태그와 주제를 조합한 제목 생성
  }
}
```

### 3. TitleQualityEvaluator

제목의 품질을 평가하고 필터링합니다.

```javascript
class TitleQualityEvaluator {
  constructor(filters, guidelines, contentAnalysis) {
    this.filters = filters;
    this.guidelines = guidelines;
    this.contentAnalysis = contentAnalysis;
  }

  evaluateTitle(title) {
    const scores = {
      relevance: this.calculateRelevanceScore(title),
      length: this.calculateLengthScore(title),
      readability: this.calculateReadabilityScore(title),
      seo: this.calculateSEOScore(title),
      engagement: this.calculateEngagementScore(title),
      compliance: this.calculateComplianceScore(title)
    };

    const totalScore = this.calculateWeightedScore(scores);
    const passed = this.passesFilters(title);

    return {
      title,
      scores,
      totalScore,
      passed,
      reasons: this.getEvaluationReasons(title, scores, passed)
    };
  }

  calculateRelevanceScore(title) {
    // 기사 내용과의 관련성 점수 계산
  }

  calculateLengthScore(title) {
    // 제목 길이 적절성 점수 계산
  }

  calculateReadabilityScore(title) {
    // 가독성 점수 계산
  }

  calculateSEOScore(title) {
    // SEO 최적화 점수 계산
  }

  calculateEngagementScore(title) {
    // 클릭 유도 가능성 점수 계산
  }

  calculateComplianceScore(title) {
    // 가이드라인 준수 점수 계산
  }

  passesFilters(title) {
    // 필터 조건 통과 여부 확인
  }
}
```

### 4. TitleGenerationLogger

제목 생성 과정의 상세한 로그를 관리합니다.

```javascript
class TitleGenerationLogger {
  constructor() {
    this.logs = [];
    this.startTime = Date.now();
  }

  logStep(step, data) {
    const timestamp = Date.now() - this.startTime;
    this.logs.push({
      timestamp,
      step,
      data,
      level: 'info'
    });
    console.log(`[${timestamp}ms] ${step}:`, data);
  }

  logError(step, error) {
    const timestamp = Date.now() - this.startTime;
    this.logs.push({
      timestamp,
      step,
      error: error.message,
      level: 'error'
    });
    console.error(`[${timestamp}ms] ERROR in ${step}:`, error.message);
  }

  logWarning(step, message) {
    const timestamp = Date.now() - this.startTime;
    this.logs.push({
      timestamp,
      step,
      message,
      level: 'warning'
    });
    console.warn(`[${timestamp}ms] WARNING in ${step}:`, message);
  }

  getSummary() {
    return {
      totalTime: Date.now() - this.startTime,
      steps: this.logs.length,
      errors: this.logs.filter(log => log.level === 'error').length,
      warnings: this.logs.filter(log => log.level === 'warning').length,
      logs: this.logs
    };
  }
}
```

## Data Models

### ContentAnalysis

```javascript
{
  headings: [
    { level: 1, text: "메인 제목", position: 0 },
    { level: 2, text: "소제목 1", position: 150 },
    { level: 2, text: "소제목 2", position: 300 }
  ],
  keyPhrases: [
    { phrase: "생성형 AI", frequency: 5, importance: 0.9 },
    { phrase: "반도체 산업", frequency: 3, importance: 0.7 }
  ],
  firstParagraph: {
    text: "첫 번째 문단 내용...",
    sentences: ["첫 번째 문장", "두 번째 문장"],
    keyPoints: ["핵심 포인트 1", "핵심 포인트 2"]
  },
  statistics: [
    { value: "300%", context: "매출 증가", position: 120 },
    { value: "97%", context: "전문가 동의", position: 250 }
  ],
  entities: [
    { text: "삼성전자", type: "ORGANIZATION", confidence: 0.95 },
    { text: "서울", type: "LOCATION", confidence: 0.88 }
  ],
  sentiment: {
    overall: "positive",
    confidence: 0.75,
    aspects: {
      technology: "positive",
      market: "neutral",
      future: "optimistic"
    }
  }
}
```

### TitleCandidate

```javascript
{
  title: "생성형 AI가 반도체 산업에 미치는 영향",
  source: "ai_generation", // ai_generation, content_analysis, heuristic, tag_based
  scores: {
    relevance: 0.85,
    length: 0.90,
    readability: 0.80,
    seo: 0.75,
    engagement: 0.70,
    compliance: 1.0
  },
  totalScore: 0.83,
  passed: true,
  reasons: [
    "기사 핵심 키워드 포함",
    "적절한 길이",
    "SEO 최적화"
  ],
  metadata: {
    chars: 23,
    words: 8,
    keywordMatches: ["생성형 AI", "반도체"],
    strategy: "데이터 활용",
    generatedAt: "2024-01-01T12:00:00Z"
  }
}
```

## Error Handling

### AI 제목 생성 실패 처리

1. **Primary Provider 실패**: 다른 AI 제공사로 자동 폴백
2. **모든 AI 실패**: 콘텐츠 분석 기반 제목 생성으로 전환
3. **콘텐츠 분석 실패**: 휴리스틱 방법으로 폴백
4. **모든 방법 실패**: 태그/주제 기반 기본 제목 생성

### 제목 품질 문제 처리

1. **모든 후보 필터 실패**: 필터 조건 완화하여 재시도
2. **제목 길이 문제**: 자동 길이 조정 또는 대안 제목 생성
3. **관련성 부족**: 콘텐츠 재분석 후 제목 재생성

### 로깅 및 모니터링

1. **성능 모니터링**: 각 단계별 실행 시간 측정
2. **품질 모니터링**: 제목 품질 점수 분포 추적
3. **실패율 모니터링**: AI 제목 생성 성공/실패율 추적
4. **사용자 피드백**: 선택된 제목과 품질 점수 상관관계 분석

## Testing Strategy

### 단위 테스트

1. **ContentAnalyzer 테스트**
   - 다양한 형식의 기사 내용 분석 테스트
   - 헤딩, 키워드, 통계 추출 정확성 테스트
   - 엣지 케이스 처리 테스트

2. **TitleGenerator 테스트**
   - 각 제목 생성 방법별 단위 테스트
   - AI API 모킹을 통한 테스트
   - 폴백 로직 테스트

3. **TitleQualityEvaluator 테스트**
   - 제목 품질 평가 알고리즘 테스트
   - 필터링 로직 테스트
   - 점수 계산 정확성 테스트

### 통합 테스트

1. **전체 파이프라인 테스트**
   - 실제 기사 데이터를 사용한 end-to-end 테스트
   - 다양한 기사 유형별 제목 생성 테스트
   - 성능 및 응답 시간 테스트

2. **AI 제공사별 테스트**
   - OpenAI, Claude, Gemini 각각의 제목 생성 품질 테스트
   - 폴백 시나리오 테스트
   - API 오류 처리 테스트

### 품질 보증 테스트

1. **제목 품질 평가**
   - 생성된 제목과 기사 내용의 관련성 평가
   - 사용자 만족도 테스트
   - A/B 테스트를 통한 클릭률 비교

2. **성능 테스트**
   - 대량 기사 처리 성능 테스트
   - 메모리 사용량 모니터링
   - 동시 요청 처리 능력 테스트

### 회귀 테스트

1. **기존 기능 보장**
   - 기존 제목 생성 기능의 하위 호환성 테스트
   - 기존 API 인터페이스 유지 확인
   - 데이터 형식 호환성 테스트

2. **품질 회귀 방지**
   - 제목 품질 기준선 설정 및 모니터링
   - 자동화된 품질 검증 파이프라인
   - 품질 저하 시 알림 시스템