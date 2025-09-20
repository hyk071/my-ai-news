/**
 * TitleGenerator 테스트 파일
 * 다단계 제목 생성 파이프라인 테스트
 */

import { ContentAnalyzer } from './content-analyzer.js';
import { TitleGenerator } from './title-generator.js';

// 테스트용 샘플 기사 데이터
const sampleArticles = {
  tech: {
    content: `# 생성형 AI가 반도체 산업에 미치는 영향

## 개요

생성형 AI 기술의 급속한 발전이 반도체 산업 전반에 큰 변화를 가져오고 있다. 
NVIDIA의 GPU 매출이 300% 증가하면서 AI 칩 시장의 성장세가 뚜렷해지고 있다.

## 시장 현황

삼성전자와 SK하이닉스는 AI 메모리 반도체 개발에 총 5조원을 투자한다고 발표했다. 
전문가들의 97%가 향후 3년간 AI 반도체 수요가 지속 증가할 것으로 전망한다고 밝혔다.

### 주요 기업 동향

- OpenAI: GPT-4 모델 훈련을 위해 10,000개의 GPU 클러스터 구축
- Google: 자체 AI 칩 TPU 생산량을 2배 확대
- Microsoft: Azure AI 서비스를 위한 데이터센터 투자 확대

## 전망

업계 관계자들은 2024년 AI 반도체 시장 규모가 1,000억 달러를 넘어설 것으로 예상한다고 말했다.`,
    tags: ['생성형 AI', '반도체', 'NVIDIA'],
    subject: 'AI 기술이 반도체 산업에 미치는 영향과 시장 전망',
    tone: '분석적'
  },

  economy: {
    content: `## 국내 스타트업 투자 시장 회복 조짐

벤처투자 시장이 침체에서 벗어나 회복세를 보이고 있다. 
올해 1분기 벤처투자 금액이 전년 동기 대비 15% 증가한 2.3조원을 기록했다.

특히 AI와 바이오 분야에서 대형 투자가 잇따르고 있다. 
카카오벤처스는 AI 스타트업에 500억원 규모의 펀드를 조성한다고 발표했다.`,
    tags: ['스타트업', '벤처투자', 'AI'],
    subject: '국내 벤처투자 시장의 회복 동향',
    tone: '객관적'
  },

  noHeading: {
    content: `인공지능 기술의 발전으로 많은 산업 분야에서 변화가 일어나고 있다. 
특히 의료, 금융, 제조업 등에서 AI 도입이 가속화되고 있으며, 
이로 인해 업무 효율성이 크게 개선되고 있다는 평가를 받고 있다.

전문가들은 향후 10년간 AI 기술이 경제 전반에 미칠 영향이 
산업혁명에 버금갈 것이라고 전망하고 있다.`,
    tags: ['인공지능', 'AI', '산업혁명'],
    subject: 'AI 기술이 산업 전반에 미치는 영향',
    tone: '전문적'
  }
};

/**
 * 기본 제목 생성 테스트
 */
async function testBasicTitleGeneration() {
  console.log('\n=== 기본 제목 생성 테스트 ===');
  
  const analyzer = new ContentAnalyzer(
    sampleArticles.tech.content,
    sampleArticles.tech.tags,
    sampleArticles.tech.subject,
    sampleArticles.tech.tone
  );

  const generator = new TitleGenerator(analyzer);
  const result = await generator.generateTitles();
  
  console.log('✅ 제목 생성 완료');
  console.log('- 최적 제목:', result.bestTitle);
  console.log('- 후보 개수:', result.candidates.length);
  console.log('- 사용된 소스:', result.sources.join(', '));
  console.log('- 실행 시간:', result.logs.totalTime, 'ms');
  
  console.log('\n제목 후보들:');
  result.candidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.title} (${candidate.source}, 점수: ${candidate.score.toFixed(2)})`);
  });
  
  return result;
}

/**
 * 콘텐츠 기반 제목 생성 테스트
 */
function testContentBasedTitleGeneration() {
  console.log('\n=== 콘텐츠 기반 제목 생성 테스트 ===');
  
  const analyzer = new ContentAnalyzer(sampleArticles.tech.content);
  const generator = new TitleGenerator(analyzer);
  
  const contentTitles = generator.generateContentBasedTitles();
  
  console.log('콘텐츠 기반 제목들:');
  contentTitles.forEach((title, index) => {
    console.log(`${index + 1}. ${title} (${[...title].length}자)`);
  });
  
  // 검증
  const hasValidLength = contentTitles.every(title => {
    const chars = [...title].length;
    return chars >= 45 && chars <= 60;
  });
  
  console.log('✅ 모든 제목이 유효한 길이:', hasValidLength);
  console.log('✅ 생성된 제목 개수:', contentTitles.length);
  
  return contentTitles;
}

/**
 * 휴리스틱 제목 생성 테스트
 */
function testHeuristicTitleGeneration() {
  console.log('\n=== 휴리스틱 제목 생성 테스트 ===');
  
  const analyzer = new ContentAnalyzer(
    sampleArticles.tech.content,
    sampleArticles.tech.tags,
    sampleArticles.tech.subject
  );
  
  const generator = new TitleGenerator(analyzer);
  const heuristicTitles = generator.generateHeuristicTitles();
  
  console.log('휴리스틱 제목들:');
  heuristicTitles.forEach((title, index) => {
    console.log(`${index + 1}. ${title} (${[...title].length}자)`);
  });
  
  console.log('✅ 생성된 제목 개수:', heuristicTitles.length);
  
  return heuristicTitles;
}

/**
 * 태그 기반 제목 생성 테스트
 */
function testTagBasedTitleGeneration() {
  console.log('\n=== 태그 기반 제목 생성 테스트 ===');
  
  const analyzer = new ContentAnalyzer(
    sampleArticles.tech.content,
    sampleArticles.tech.tags,
    sampleArticles.tech.subject
  );
  
  const generator = new TitleGenerator(analyzer);
  const tagTitles = generator.generateTagBasedTitles();
  
  console.log('태그 기반 제목들:');
  tagTitles.forEach((title, index) => {
    console.log(`${index + 1}. ${title} (${[...title].length}자)`);
  });
  
  console.log('✅ 생성된 제목 개수:', tagTitles.length);
  
  return tagTitles;
}

/**
 * 필터링 테스트
 */
async function testFiltering() {
  console.log('\n=== 필터링 테스트 ===');
  
  const analyzer = new ContentAnalyzer(sampleArticles.tech.content);
  
  // 엄격한 필터 설정
  const strictFilters = {
    titleLen: { min: 50, max: 55 },
    mustInclude: ['AI'],
    mustExclude: ['충격', '대박', '미쳤다']
  };
  
  const generator = new TitleGenerator(analyzer, strictFilters);
  const result = await generator.generateTitles();
  
  console.log('엄격한 필터 적용 결과:');
  console.log('- 후보 개수:', result.candidates.length);
  
  result.candidates.forEach((candidate, index) => {
    const chars = [...candidate.title].length;
    const hasAI = candidate.title.toLowerCase().includes('ai');
    console.log(`${index + 1}. ${candidate.title} (${chars}자, AI 포함: ${hasAI})`);
  });
  
  // 검증
  const allValidLength = result.candidates.every(c => {
    const chars = [...c.title].length;
    return chars >= 50 && chars <= 55;
  });
  
  const allHaveAI = result.candidates.every(c => 
    c.title.toLowerCase().includes('ai')
  );
  
  console.log('✅ 모든 제목이 길이 조건 만족:', allValidLength);
  console.log('✅ 모든 제목이 AI 포함:', allHaveAI);
  
  return result;
}

/**
 * 다양한 기사 유형 테스트
 */
async function testDifferentArticleTypes() {
  console.log('\n=== 다양한 기사 유형 테스트 ===');
  
  for (const [type, article] of Object.entries(sampleArticles)) {
    console.log(`\n--- ${type.toUpperCase()} 기사 테스트 ---`);
    
    const analyzer = new ContentAnalyzer(
      article.content,
      article.tags,
      article.subject,
      article.tone
    );
    
    const generator = new TitleGenerator(analyzer);
    const result = await generator.generateTitles();
    
    console.log('최적 제목:', result.bestTitle);
    console.log('후보 개수:', result.candidates.length);
    console.log('사용된 소스:', result.sources.join(', '));
    
    if (result.candidates.length > 0) {
      console.log('상위 3개 후보:');
      result.candidates.slice(0, 3).forEach((candidate, index) => {
        console.log(`  ${index + 1}. ${candidate.title} (${candidate.score.toFixed(2)})`);
      });
    }
  }
}

/**
 * 점수 계산 테스트
 */
async function testScoring() {
  console.log('\n=== 점수 계산 테스트 ===');
  
  const analyzer = new ContentAnalyzer(
    sampleArticles.tech.content,
    sampleArticles.tech.tags,
    sampleArticles.tech.subject
  );
  
  const generator = new TitleGenerator(analyzer);
  const result = await generator.generateTitles();
  
  console.log('점수별 제목 순위:');
  result.candidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.title}`);
    console.log(`   점수: ${candidate.score.toFixed(3)}, 소스: ${candidate.source}, 길이: ${candidate.chars}자`);
  });
  
  // 점수 검증
  const scoresDescending = result.candidates.every((candidate, index) => {
    if (index === 0) return true;
    return candidate.score <= result.candidates[index - 1].score;
  });
  
  console.log('✅ 점수 내림차순 정렬:', scoresDescending);
  
  return result;
}

/**
 * 엣지 케이스 테스트
 */
async function testEdgeCases() {
  console.log('\n=== 엣지 케이스 테스트 ===');
  
  // 1. 빈 내용
  console.log('\n1. 빈 내용 테스트');
  const emptyAnalyzer = new ContentAnalyzer('');
  const emptyGenerator = new TitleGenerator(emptyAnalyzer);
  const emptyResult = await emptyGenerator.generateTitles();
  console.log('빈 내용 결과:', emptyResult.bestTitle);
  console.log('후보 개수:', emptyResult.candidates.length);
  
  // 2. 헤딩이 없는 내용
  console.log('\n2. 헤딩 없는 내용 테스트');
  const noHeadingAnalyzer = new ContentAnalyzer(sampleArticles.noHeading.content);
  const noHeadingGenerator = new TitleGenerator(noHeadingAnalyzer);
  const noHeadingResult = await noHeadingGenerator.generateTitles();
  console.log('헤딩 없는 내용 결과:', noHeadingResult.bestTitle);
  console.log('후보 개수:', noHeadingResult.candidates.length);
  
  // 3. 매우 엄격한 필터
  console.log('\n3. 매우 엄격한 필터 테스트');
  const strictAnalyzer = new ContentAnalyzer(sampleArticles.tech.content);
  const veryStrictFilters = {
    titleLen: { min: 100, max: 110 }, // 매우 긴 제목만 허용
    mustInclude: ['존재하지않는키워드']
  };
  const strictGenerator = new TitleGenerator(strictAnalyzer, veryStrictFilters);
  const strictResult = await strictGenerator.generateTitles();
  console.log('엄격한 필터 결과:', strictResult.bestTitle);
  console.log('후보 개수:', strictResult.candidates.length);
  
  // 4. 태그와 주제가 없는 경우
  console.log('\n4. 태그/주제 없는 경우 테스트');
  const noTagsAnalyzer = new ContentAnalyzer(sampleArticles.tech.content, [], '');
  const noTagsGenerator = new TitleGenerator(noTagsAnalyzer);
  const noTagsResult = await noTagsGenerator.generateTitles();
  console.log('태그/주제 없는 결과:', noTagsResult.bestTitle);
  console.log('후보 개수:', noTagsResult.candidates.length);
}

/**
 * 성능 테스트
 */
async function testPerformance() {
  console.log('\n=== 성능 테스트 ===');
  
  const iterations = 50;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const analyzer = new ContentAnalyzer(
      sampleArticles.tech.content,
      sampleArticles.tech.tags,
      sampleArticles.tech.subject
    );
    
    const generator = new TitleGenerator(analyzer);
    await generator.generateTitles();
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  console.log(`${iterations}회 반복 실행:`);
  console.log('- 총 시간:', totalTime, 'ms');
  console.log('- 평균 시간:', avgTime.toFixed(2), 'ms');
  console.log('- 초당 처리량:', Math.round(1000 / avgTime), '회/초');
}

/**
 * 로깅 테스트
 */
async function testLogging() {
  console.log('\n=== 로깅 테스트 ===');
  
  const analyzer = new ContentAnalyzer(sampleArticles.tech.content);
  const generator = new TitleGenerator(analyzer);
  const result = await generator.generateTitles();
  
  console.log('로그 요약:');
  console.log('- 총 실행 시간:', result.logs.totalTime, 'ms');
  console.log('- 로그 단계 수:', result.logs.steps);
  console.log('- 오류 수:', result.logs.errors);
  console.log('- 경고 수:', result.logs.warnings);
  
  console.log('\n주요 로그 단계들:');
  result.logs.logs
    .filter(log => log.level === 'info')
    .slice(0, 5)
    .forEach(log => {
      console.log(`[${log.timestamp}ms] ${log.step}`);
    });
  
  if (result.logs.errors > 0) {
    console.log('\n오류 로그들:');
    result.logs.logs
      .filter(log => log.level === 'error')
      .forEach(log => {
        console.log(`[${log.timestamp}ms] ERROR: ${log.step} - ${log.error}`);
      });
  }
  
  return result.logs;
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 TitleGenerator 테스트 시작\n');
  
  try {
    await testBasicTitleGeneration();
    testContentBasedTitleGeneration();
    testHeuristicTitleGeneration();
    testTagBasedTitleGeneration();
    await testFiltering();
    await testDifferentArticleTypes();
    await testScoring();
    await testEdgeCases();
    await testPerformance();
    await testLogging();
    
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
  testBasicTitleGeneration,
  testContentBasedTitleGeneration,
  testHeuristicTitleGeneration,
  testTagBasedTitleGeneration,
  testFiltering,
  testDifferentArticleTypes,
  testScoring,
  testEdgeCases,
  testPerformance,
  testLogging,
  runAllTests
};