/**
 * 메타데이터 API 테스트 스크립트
 */

const handler = require('../pages/api/search/metadata');

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

async function testMetadataAPI() {
  console.log('📊 메타데이터 API 테스트 시작...\n');
  
  try {
    // 1. 기본 메타데이터 테스트
    console.log('1. 기본 메타데이터 테스트...');
    const req1 = createMockReq({});
    const res1 = createMockRes();
    
    await handler(req1, res1);
    
    if (res1.statusCode === 200 && res1.data) {
      console.log(`✅ 상태 코드: ${res1.statusCode}`);
      console.log(`✅ 총 기사 수: ${res1.data.totalArticles}개`);
      console.log(`✅ 작성자 수: ${res1.data.authors.length}명`);
      console.log(`✅ AI 모델 수: ${res1.data.models.length}개`);
      console.log(`✅ 날짜 범위: ${res1.data.dateRange.earliest} ~ ${res1.data.dateRange.latest}`);
      console.log(`✅ 마지막 업데이트: ${res1.data.lastUpdated}`);
    } else {
      console.log(`❌ 기본 메타데이터 오류: 상태 코드 ${res1.statusCode}`);
    }
    console.log('');
    
    // 2. 상세 메타데이터 테스트
    console.log('2. 상세 메타데이터 테스트...');
    const req2 = createMockReq({ detailed: 'true' });
    const res2 = createMockRes();
    
    await handler(req2, res2);
    
    if (res2.statusCode === 200 && res2.data) {
      console.log(`✅ 상세 메타데이터 로드 성공`);
      console.log(`✅ 기본 정보:`);
      console.log(`   - 총 기사: ${res2.data.statistics.totalArticles}개`);
      console.log(`   - 총 단어: ${res2.data.statistics.totalWords.toLocaleString()}개`);
      console.log(`   - 평균 단어/기사: ${res2.data.statistics.averageWordsPerArticle}개`);
      console.log(`   - 총 키워드: ${res2.data.statistics.totalKeywords}개`);
      
      console.log(`✅ 작성자 통계 (상위 5명):`);
      res2.data.authors.slice(0, 5).forEach((author, index) => {
        console.log(`   ${index + 1}. ${author.name}: ${author.articleCount}개 기사`);
      });
      
      console.log(`✅ AI 모델 통계:`);
      res2.data.models.forEach((model, index) => {
        console.log(`   ${index + 1}. ${model.name}: ${model.articleCount}개 기사`);
      });
      
      console.log(`✅ 인기 키워드 (상위 10개):`);
      res2.data.popularKeywords.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.keyword}: ${item.count}회`);
      });
      
      console.log(`✅ 월별 통계 (최근 3개월):`);
      res2.data.monthlyStats.slice(-3).forEach(stat => {
        console.log(`   ${stat.month}: ${stat.count}개 기사`);
      });
      
    } else {
      console.log(`❌ 상세 메타데이터 오류: 상태 코드 ${res2.statusCode}`);
      if (res2.data && res2.data.error) {
        console.log(`❌ 오류 메시지: ${res2.data.error.message}`);
      }
    }
    console.log('');
    
    // 3. 잘못된 메서드 테스트
    console.log('3. 잘못된 메서드 테스트...');
    const req3 = { method: 'POST', query: {} };
    const res3 = createMockRes();
    
    await handler(req3, res3);
    
    console.log(`✅ POST 메서드 처리: 상태 코드 ${res3.statusCode}`);
    if (res3.data && res3.data.error) {
      console.log(`✅ 오류 메시지: ${res3.data.error.message}`);
    }
    
    console.log('\n🎉 메타데이터 API 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 메타데이터 API 테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
if (require.main === module) {
  testMetadataAPI();
}

module.exports = { testMetadataAPI };