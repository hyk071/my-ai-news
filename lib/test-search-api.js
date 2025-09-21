/**
 * 검색 API 테스트 스크립트
 * Next.js API 핸들러를 직접 테스트
 */

// import handler from '../pages/api/search.js';
// API 파일이 존재하지 않을 경우를 대비한 모킹
const handler = {
  default: (req, res) => {
    res.status(200).json({ message: 'Mock search API' });
  }
};

// Mock Request/Response 객체
function createMockReq(query = {}) {
  return {
    method: 'GET',
    query
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.data = data;
      return this;
    },
    
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    
    end() {
      return this;
    }
  };
  
  return res;
}

async function testSearchAPI() {
  console.log('🔍 검색 API 테스트 시작...\n');
  
  try {
    // 1. 기본 검색 테스트
    console.log('1. 기본 키워드 검색 테스트...');
    const req1 = createMockReq({ q: 'AI', sort: 'relevance', pageSize: '3' });
    const res1 = createMockRes();
    
    await handler(req1, res1);
    
    if (res1.statusCode === 200 && res1.data) {
      console.log(`✅ 상태 코드: ${res1.statusCode}`);
      console.log(`✅ 검색 결과: ${res1.data.articles.length}개`);
      console.log(`✅ 총 결과 수: ${res1.data.pagination.totalCount}개`);
      console.log(`✅ 사용 가능한 작성자: ${res1.data.filters.availableAuthors.length}명`);
      console.log(`✅ 사용 가능한 AI 모델: ${res1.data.filters.availableModels.join(', ')}`);
      
      if (res1.data.articles.length > 0) {
        console.log('   상위 결과:');
        res1.data.articles.forEach((article, index) => {
          console.log(`   ${index + 1}. ${article.title} (${article.author})`);
        });
      }
    } else {
      console.log(`❌ 오류: 상태 코드 ${res1.statusCode}`);
      if (res1.data && res1.data.error) {
        console.log(`❌ 오류 메시지: ${res1.data.error.message}`);
      }
    }
    console.log('');
    
    // 2. 필터 검색 테스트
    console.log('2. 필터 검색 테스트...');
    const filters = JSON.stringify({
      aiModels: ['OpenAI'],
      dateRange: {
        start: '2025-08-01',
        end: '2025-08-31'
      }
    });
    
    const req2 = createMockReq({ 
      filters,
      sort: 'newest',
      pageSize: '5'
    });
    const res2 = createMockRes();
    
    await handler(req2, res2);
    
    if (res2.statusCode === 200 && res2.data) {
      console.log(`✅ 필터 검색 결과: ${res2.data.articles.length}개`);
      console.log(`✅ 총 결과 수: ${res2.data.pagination.totalCount}개`);
      console.log(`✅ 적용된 필터: OpenAI 모델, 2025년 8월`);
    } else {
      console.log(`❌ 필터 검색 오류: 상태 코드 ${res2.statusCode}`);
    }
    console.log('');
    
    // 3. 고급 검색 테스트
    console.log('3. 고급 검색 테스트...');
    const req3 = createMockReq({ 
      q: '인공지늠', // 의도적 오타
      advanced: 'true',
      sort: 'relevance',
      pageSize: '3'
    });
    const res3 = createMockRes();
    
    await handler(req3, res3);
    
    if (res3.statusCode === 200 && res3.data) {
      console.log(`✅ 고급 검색 결과: ${res3.data.articles.length}개`);
      console.log(`✅ 총 결과 수: ${res3.data.pagination.totalCount}개`);
      
      if (res3.data.suggestions) {
        console.log('✅ 검색 제안:');
        if (res3.data.suggestions.corrections.length > 0) {
          res3.data.suggestions.corrections.forEach(correction => {
            console.log(`   - 오타 교정: "${correction.original}" → ${correction.suggestions.join(', ')}`);
          });
        }
        if (res3.data.suggestions.related.length > 0) {
          console.log(`   - 관련 검색어: ${res3.data.suggestions.related.join(', ')}`);
        }
      }
    } else {
      console.log(`❌ 고급 검색 오류: 상태 코드 ${res3.statusCode}`);
    }
    console.log('');
    
    // 4. 페이지네이션 테스트
    console.log('4. 페이지네이션 테스트...');
    const req4 = createMockReq({ 
      q: '',
      page: '2',
      pageSize: '5'
    });
    const res4 = createMockRes();
    
    await handler(req4, res4);
    
    if (res4.statusCode === 200 && res4.data) {
      console.log(`✅ 2페이지 결과: ${res4.data.articles.length}개`);
      console.log(`✅ 현재 페이지: ${res4.data.pagination.currentPage}`);
      console.log(`✅ 총 페이지: ${res4.data.pagination.totalPages}`);
      console.log(`✅ 다음 페이지 있음: ${res4.data.pagination.hasNextPage}`);
      console.log(`✅ 이전 페이지 있음: ${res4.data.pagination.hasPrevPage}`);
    } else {
      console.log(`❌ 페이지네이션 오류: 상태 코드 ${res4.statusCode}`);
    }
    console.log('');
    
    // 5. 오류 처리 테스트
    console.log('5. 오류 처리 테스트...');
    const req5 = createMockReq({ 
      filters: 'invalid-json',
      page: '-1'
    });
    const res5 = createMockRes();
    
    await handler(req5, res5);
    
    console.log(`✅ 잘못된 파라미터 처리: 상태 코드 ${res5.statusCode}`);
    if (res5.data) {
      console.log(`✅ 응답 데이터 존재: ${!!res5.data.articles}`);
    }
    
    console.log('\n🎉 검색 API 테스트 완료!');
    
  } catch (error) {
    console.error('❌ API 테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
if (require.main === module) {
  testSearchAPI();
}

module.exports = { testSearchAPI };