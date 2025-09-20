/**
 * enhance.js API와 새로운 제목 생성 시스템 통합 테스트
 */

// 테스트용 샘플 데이터
const sampleContent = `# 생성형 AI가 반도체 산업에 미치는 영향

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

업계 관계자들은 2024년 AI 반도체 시장 규모가 1,000억 달러를 넘어설 것으로 예상한다고 말했다.`;

/**
 * enhance API 호출 테스트
 */
async function testEnhanceAPI() {
  console.log('\n=== enhance API 통합 테스트 ===');
  
  const requestBody = {
    content: sampleContent,
    tags: ['생성형 AI', '반도체', 'NVIDIA'],
    subject: 'AI 기술이 반도체 산업에 미치는 영향과 시장 전망',
    tone: '분석적',
    lengthRange: { min: 1000, max: 2000 },
    filters: {
      titleLen: { min: 45, max: 60 },
      mustInclude: [],
      mustExclude: ['충격', '소름', '대박'],
      phraseInclude: [],
      phraseExclude: []
    },
    guidelines: {
      dataBacked: true,
      noClickbait: true,
      newsroomStyle: true,
      numFactsMin: 2
    },
    textProvider: 'openai' // AI 제목 생성 시도
  };

  try {
    console.log('API 요청 전송 중...');
    
    const response = await fetch('http://localhost:3000/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ API 호출 성공');
    console.log('- 최종 제목:', result.title);
    console.log('- 제목 길이:', [...result.title].length, '자');
    console.log('- 후보 개수:', result.candidates?.length || 0);
    console.log('- 슬러그:', result.slug);
    console.log('- 작성자:', result.author);
    console.log('- 생성 시간:', result.generatedAt);
    
    if (result.candidates && result.candidates.length > 0) {
      console.log('\n제목 후보들:');
      result.candidates.forEach((candidate, index) => {
        console.log(`${index + 1}. ${candidate} (${[...candidate].length}자)`);
      });
    }
    
    if (result.titleGenerationLogs) {
      console.log('\n제목 생성 로그:');
      console.log('- 실행 시간:', result.titleGenerationLogs.executionTime, 'ms');
      console.log('- 단계 수:', result.titleGenerationLogs.steps);
      console.log('- 오류 수:', result.titleGenerationLogs.errors);
      console.log('- 경고 수:', result.titleGenerationLogs.warnings);
    }
    
    // 제목 품질 검증
    const titleLength = [...result.title].length;
    const hasValidLength = titleLength >= 45 && titleLength <= 60;
    const hasContent = result.title !== 'AI 뉴스' && result.title !== '제목 없음';
    const hasKeywords = result.tags?.some(tag => result.title.includes(tag)) || false;
    
    console.log('\n품질 검증:');
    console.log('✅ 유효한 길이:', hasValidLength);
    console.log('✅ 의미있는 제목:', hasContent);
    console.log('✅ 키워드 포함:', hasKeywords);
    
    return result;
    
  } catch (error) {
    console.error('❌ API 호출 실패:', error.message);
    return null;
  }
}

/**
 * AI 제목 생성 실패 시나리오 테스트
 */
async function testAIFailureScenario() {
  console.log('\n=== AI 제목 생성 실패 시나리오 테스트 ===');
  
  const requestBody = {
    content: sampleContent,
    tags: ['생성형 AI', '반도체'],
    subject: 'AI 기술이 반도체 산업에 미치는 영향',
    tone: '분석적',
    lengthRange: { min: 1000, max: 2000 },
    filters: {
      titleLen: { min: 45, max: 60 }
    },
    // textProvider를 설정하지 않아서 AI 제목 생성 실패 유도
  };

  try {
    const response = await fetch('http://localhost:3000/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('✅ AI 실패 시나리오 처리 성공');
    console.log('- 폴백 제목:', result.title);
    console.log('- 후보 개수:', result.candidates?.length || 0);
    
    // 폴백 시스템이 작동했는지 확인
    const hasValidFallback = result.title && result.title !== 'AI 뉴스';
    console.log('✅ 유효한 폴백 제목:', hasValidFallback);
    
    return result;
    
  } catch (error) {
    console.error('❌ 폴백 테스트 실패:', error.message);
    return null;
  }
}

/**
 * 엄격한 필터 테스트
 */
async function testStrictFilters() {
  console.log('\n=== 엄격한 필터 테스트 ===');
  
  const requestBody = {
    content: sampleContent,
    tags: ['AI'],
    subject: 'AI 기술 분석',
    tone: '객관적',
    filters: {
      titleLen: { min: 50, max: 55 },
      mustInclude: ['AI'],
      mustExclude: ['충격', '대박', '미쳤다', '소름']
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('✅ 엄격한 필터 테스트 완료');
    console.log('- 필터링된 제목:', result.title);
    console.log('- 제목 길이:', [...result.title].length, '자');
    
    // 필터 조건 검증
    const titleLength = [...result.title].length;
    const hasValidLength = titleLength >= 50 && titleLength <= 55;
    const hasAI = result.title.toLowerCase().includes('ai');
    const hasBannedWords = ['충격', '대박', '미쳤다', '소름'].some(word => 
      result.title.toLowerCase().includes(word)
    );
    
    console.log('✅ 길이 조건 만족:', hasValidLength);
    console.log('✅ AI 키워드 포함:', hasAI);
    console.log('✅ 금지 단어 없음:', !hasBannedWords);
    
    return result;
    
  } catch (error) {
    console.error('❌ 엄격한 필터 테스트 실패:', error.message);
    return null;
  }
}

/**
 * 짧은 내용 테스트
 */
async function testShortContent() {
  console.log('\n=== 짧은 내용 테스트 ===');
  
  const shortContent = `테슬라 주가가 5% 상승했다. 일론 머스크의 새로운 발표가 영향을 미친 것으로 보인다.`;
  
  const requestBody = {
    content: shortContent,
    tags: ['테슬라', '주가'],
    subject: '테슬라 주가 상승',
    tone: '중립적'
  };

  try {
    const response = await fetch('http://localhost:3000/api/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    
    console.log('✅ 짧은 내용 처리 완료');
    console.log('- 생성된 제목:', result.title);
    console.log('- 후보 개수:', result.candidates?.length || 0);
    
    return result;
    
  } catch (error) {
    console.error('❌ 짧은 내용 테스트 실패:', error.message);
    return null;
  }
}

/**
 * 성능 테스트
 */
async function testPerformance() {
  console.log('\n=== 성능 테스트 ===');
  
  const requestBody = {
    content: sampleContent,
    tags: ['AI', '반도체'],
    subject: 'AI 반도체 시장 분석',
    tone: '분석적'
  };

  const iterations = 5;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch('http://localhost:3000/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      await response.json();
      const endTime = Date.now();
      times.push(endTime - startTime);
      
      console.log(`테스트 ${i + 1}/${iterations}: ${endTime - startTime}ms`);
      
    } catch (error) {
      console.error(`테스트 ${i + 1} 실패:`, error.message);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log('\n성능 결과:');
    console.log('- 평균 응답 시간:', avgTime.toFixed(2), 'ms');
    console.log('- 최소 응답 시간:', minTime, 'ms');
    console.log('- 최대 응답 시간:', maxTime, 'ms');
  }
}

/**
 * 전체 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 enhance.js 통합 테스트 시작\n');
  
  try {
    await testEnhanceAPI();
    await testAIFailureScenario();
    await testStrictFilters();
    await testShortContent();
    await testPerformance();
    
    console.log('\n✅ 모든 통합 테스트 완료!');
  } catch (error) {
    console.error('\n❌ 통합 테스트 실패:', error.message);
  }
}

// 개별 테스트 함수들을 export
export {
  testEnhanceAPI,
  testAIFailureScenario,
  testStrictFilters,
  testShortContent,
  testPerformance,
  runAllTests
};

// 직접 실행 시 전체 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}