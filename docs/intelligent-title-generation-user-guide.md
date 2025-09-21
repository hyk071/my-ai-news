# 지능형 제목 생성 시스템 사용자 가이드

## 개요

지능형 제목 생성 시스템은 AI 기술을 활용하여 기사 내용을 분석하고 최적화된 제목을 자동으로 생성하는 시스템입니다. 이 시스템은 콘텐츠 분석, 다단계 제목 생성, 품질 평가를 통해 SEO 친화적이고 독자의 관심을 끄는 제목을 제공합니다.

## 주요 기능

### 🎯 다단계 제목 생성
- **AI 제목 생성**: 최신 AI 모델을 활용한 창의적 제목 생성
- **콘텐츠 기반 제목**: 기사 내용 분석을 통한 관련성 높은 제목
- **휴리스틱 제목**: 규칙 기반 알고리즘으로 안정적인 제목 생성
- **태그 기반 제목**: 태그와 주제를 활용한 맞춤형 제목

### 📊 품질 평가 시스템
- **관련성 점수**: 기사 내용과의 연관성 평가
- **SEO 최적화**: 검색 엔진 친화적 제목 생성
- **가독성 평가**: 독자가 이해하기 쉬운 제목 검증
- **참여도 분석**: 클릭률을 높일 수 있는 제목 요소 평가

### ⚡ 성능 최적화
- **캐싱 시스템**: 반복 분석 결과 캐싱으로 빠른 응답
- **메모리 최적화**: 대용량 콘텐츠 처리 시 메모리 효율성
- **로깅 시스템**: 상세한 실행 로그와 성능 모니터링

## 빠른 시작

### 기본 사용법

```javascript
import { ContentAnalyzer } from './lib/content-analyzer.js';
import { TitleGenerator } from './lib/title-generator.js';

// 1. 콘텐츠 분석기 생성
const analyzer = new ContentAnalyzer(
    content,    // 기사 내용
    tags,       // 태그 배열
    subject,    // 주제
    tone        // 톤 (선택사항)
);

// 2. 제목 생성기 생성
const generator = new TitleGenerator(analyzer);

// 3. 제목 생성
const result = await generator.generateTitles();

console.log('최고 제목:', result.bestTitle);
console.log('후보 제목들:', result.candidates);
```

### 품질 평가 사용법

```javascript
import { TitleQualityEvaluator } from './lib/title-quality-evaluator.js';

// 품질 평가기 생성
const evaluator = new TitleQualityEvaluator(analyzer);

// 제목 품질 평가
const evaluation = evaluator.evaluateTitle('평가할 제목');

console.log('전체 점수:', evaluation.overallScore);
console.log('세부 점수:', evaluation.scores);
console.log('개선 권장사항:', evaluation.recommendations);
```

## 상세 사용법

### 콘텐츠 분석기 (ContentAnalyzer)

콘텐츠 분석기는 기사 내용을 분석하여 제목 생성에 필요한 정보를 추출합니다.

```javascript
const analyzer = new ContentAnalyzer(content, tags, subject, tone);

// 분석 실행
const analysis = analyzer.analyze();

// 분석 결과 확인
console.log('헤딩:', analysis.headings);
console.log('키워드:', analysis.keyPhrases);
console.log('통계:', analysis.statistics);
console.log('개체명:', analysis.entities);
console.log('감정:', analysis.sentiment);
```

#### 입력 매개변수
- **content** (string): 분석할 기사 내용 (마크다운 형식 지원)
- **tags** (Array): 기사와 관련된 태그 배열
- **subject** (string): 기사의 주제나 요약
- **tone** (string): 원하는 톤 ('객관적', '분석적', '중립적' 등)

### 제목 생성기 (TitleGenerator)

제목 생성기는 다단계 파이프라인을 통해 다양한 방식으로 제목을 생성합니다.

```javascript
// 기본 설정으로 생성
const generator = new TitleGenerator(analyzer);

// 필터와 가이드라인 설정
const filters = {
    titleLen: { min: 20, max: 60 },
    mustInclude: ['AI'],
    mustExclude: ['충격', '대박']
};

const guidelines = {
    preferredStyle: 'professional',
    targetAudience: 'technical',
    seoOptimization: true
};

const generator = new TitleGenerator(analyzer, filters, guidelines);
```

#### 필터 옵션
- **titleLen**: 제목 길이 제한 (min, max)
- **mustInclude**: 반드시 포함해야 할 키워드
- **mustExclude**: 제외해야 할 키워드
- **minRelevanceScore**: 최소 관련성 점수
- **minOverallScore**: 최소 전체 품질 점수

#### 가이드라인 옵션
- **preferredStyle**: 선호하는 스타일 ('professional', 'casual', 'engaging')
- **targetAudience**: 대상 독자 ('general', 'technical', 'business')
- **seoOptimization**: SEO 최적화 여부
- **clickbaitAvoidance**: 클릭베이트 방지 여부

### 품질 평가기 (TitleQualityEvaluator)

품질 평가기는 생성된 제목의 품질을 다각도로 평가합니다.

```javascript
const evaluator = new TitleQualityEvaluator(analyzer, filters, guidelines);

const evaluation = evaluator.evaluateTitle(title);

// 평가 결과 활용
if (evaluation.passesFilters) {
    console.log('제목이 모든 필터를 통과했습니다.');
} else {
    console.log('개선이 필요한 영역:', evaluation.reasons);
    console.log('권장사항:', evaluation.recommendations);
}
```

#### 평가 점수 항목
- **relevance**: 콘텐츠와의 관련성 (0-1)
- **length**: 제목 길이 적절성 (0-1)
- **readability**: 가독성 (0-1)
- **seo**: SEO 최적화 정도 (0-1)
- **engagement**: 참여도/클릭 유도성 (0-1)
- **compliance**: 가이드라인 준수도 (0-1)

## 제목 품질 개선 팁

### 1. 관련성 향상
- 기사의 핵심 키워드를 제목에 포함
- 주제와 직접적으로 연관된 표현 사용
- 기사 내용을 정확히 반영하는 제목 작성

### 2. SEO 최적화
- 검색 키워드를 제목 앞부분에 배치
- 30-60자 길이로 제목 작성
- 구체적인 숫자나 연도 포함
- 검색 의도를 반영하는 키워드 사용

### 3. 가독성 개선
- 복잡한 전문용어 최소화
- 명확하고 간결한 표현 사용
- 적절한 구두점 활용
- 자연스러운 한국어 문장 구조

### 4. 참여도 증대
- 호기심을 유발하는 질문형 제목
- 구체적인 숫자나 통계 포함
- 독자의 관심사와 연결되는 표현
- 적절한 감정적 어필 (과도하지 않게)

### 5. 준수성 확보
- 클릭베이트 표현 피하기
- 과장되거나 선정적인 표현 자제
- 브랜드 가이드라인 준수
- 윤리적이고 정확한 표현 사용

## 모범 사례

### 좋은 제목의 예시

✅ **기술 기사**
- "AI 반도체 시장 300% 성장, 2024년 전망과 주요 기업 동향"
- "생성형 AI 기술이 바꾸는 콘텐츠 제작 패러다임"

✅ **경제 기사**
- "국내 스타트업 투자 15% 증가, 회복세 지속 전망"
- "벤처투자 시장 변화와 새로운 기회 영역 분석"

✅ **사회 기사**
- "원격근무 확산으로 변화하는 직장 문화와 미래 전망"
- "하이브리드 근무제 도입 기업 78%, 만족도 85% 기록"

### 피해야 할 제목의 예시

❌ **클릭베이트**
- "충격! 믿을 수 없는 AI 기술의 대박 소식"
- "이것만 알면 당신도 AI 전문가!"

❌ **너무 짧거나 김**
- "AI" (너무 짧음)
- "인공지능 기술의 급속한 발전이 가져올 산업 전반의 혁신적 변화와..." (너무 김)

❌ **관련성 부족**
- "놀라운 기술 혁신" (구체성 부족)
- "전문가들이 말하는 비밀" (내용과 무관)

## 문제 해결 가이드

### 자주 발생하는 문제

#### Q: 제목이 생성되지 않아요
A: 다음 사항을 확인해보세요:
- 콘텐츠가 충분한 길이인지 확인 (최소 100자 이상 권장)
- 태그나 주제가 적절히 설정되었는지 확인
- 필터 조건이 너무 엄격하지 않은지 확인

#### Q: 생성된 제목의 품질이 낮아요
A: 다음 방법을 시도해보세요:
- 더 구체적이고 상세한 콘텐츠 제공
- 관련성 높은 태그 추가
- 명확한 주제 설정
- 필터 조건 완화

#### Q: 성능이 느려요
A: 성능 개선 방법:
- 캐싱이 활성화되어 있는지 확인
- 콘텐츠 길이를 적절히 조절
- 불필요한 태그나 필터 제거
- 메모리 사용량 모니터링

#### Q: 특정 키워드가 포함되지 않아요
A: 키워드 포함 방법:
- `mustInclude` 필터에 원하는 키워드 추가
- 태그에 해당 키워드 포함
- 콘텐츠에서 해당 키워드의 빈도 증가

### 고급 설정

#### 로깅 활성화
```javascript
import { TitleGenerationLogger } from './lib/title-generation-logger.js';

const logger = new TitleGenerationLogger({
    logLevel: 'debug',
    enableConsole: true,
    enableMetrics: true
});

// 로그 확인
const summary = logger.getSummary();
console.log('실행 요약:', summary);
```

#### 캐시 관리
```javascript
import { getCacheManager } from './lib/cache-manager.js';

const cacheManager = getCacheManager();

// 캐시 통계 확인
const stats = cacheManager.getStats();
console.log('캐시 통계:', stats);

// 캐시 클리어
cacheManager.clearCache('all');
```

## API 참조

자세한 API 문서는 [개발자 문서](./intelligent-title-generation-developer-guide.md)를 참조하세요.

## 지원 및 문의

시스템 사용 중 문제가 발생하거나 추가 기능이 필요한 경우, 개발팀에 문의해 주세요.

---

*이 문서는 지능형 제목 생성 시스템 v1.0을 기준으로 작성되었습니다.*