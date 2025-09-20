/**
 * 검색 인덱스 시스템 테스트 스크립트
 */

const { loadOrCreateSearchIndex } = require('./search-index');
const { performSearch, highlightSearchTerms } = require('./search-algorithms');

async function testSearchIndex() {
  console.log('🔍 검색 인덱스 시스템 테스트 시작...\n');
  
  try {
    // 1. 검색 인덱스 로드
    console.log('1. 검색 인덱스 생성 중...');
    const searchIndex = await loadOrCreateSearchIndex();
    
    console.log(`✅ 검색 인덱스 생성 완료`);
    console.log(`   - 총 기사 수: ${Object.keys(searchIndex.articles).length}`);
    console.log(`   - 인덱싱된 용어 수: ${Object.keys(searchIndex.termIndex).length}`);
    console.log(`   - 작성자 수: ${searchIndex.metadata.authors.length}`);
    console.log(`   - AI 모델 수: ${searchIndex.metadata.sources.length}`);
    console.log(`   - 날짜 범위: ${searchIndex.metadata.dateRange.earliest} ~ ${searchIndex.metadata.dateRange.latest}\n`);
    
    // 2. 키워드 검색 테스트
    console.log('2. 키워드 검색 테스트...');
    const searchResults1 = performSearch(searchIndex, {
      query: 'AI 인공지능',
      sort: 'relevance',
      pageSize: 5
    });
    
    console.log(`✅ "AI 인공지능" 검색 결과: ${searchResults1.totalCount}개`);
    if (searchResults1.articleSlugs.length > 0) {
      searchResults1.articleSlugs.slice(0, 3).forEach((slug, index) => {
        const article = searchIndex.articles[slug];
        console.log(`   ${index + 1}. ${article.title} (${article.author})`);
      });
    }
    console.log('');
    
    // 3. 필터 검색 테스트
    console.log('3. 필터 검색 테스트...');
    const searchResults2 = performSearch(searchIndex, {
      query: '',
      filters: {
        aiModels: ['OpenAI'],
        dateRange: {
          start: '2025-08-01',
          end: '2025-08-31'
        }
      },
      sort: 'newest',
      pageSize: 3
    });
    
    console.log(`✅ OpenAI 모델 + 8월 기사 필터 결과: ${searchResults2.totalCount}개`);
    if (searchResults2.articleSlugs.length > 0) {
      searchResults2.articleSlugs.forEach((slug, index) => {
        const article = searchIndex.articles[slug];
        console.log(`   ${index + 1}. ${article.title} (${article.source}, ${new Date(article.date).toLocaleDateString()})`);
      });
    }
    console.log('');
    
    // 4. 하이라이트 테스트
    console.log('4. 검색어 하이라이트 테스트...');
    const sampleText = '한국의 인공지능 기술이 글로벌 시장에서 주목받고 있다.';
    const highlightedText = highlightSearchTerms(sampleText, 'AI 인공지능');
    console.log(`✅ 원본: ${sampleText}`);
    console.log(`✅ 하이라이트: ${highlightedText}\n`);
    
    // 5. 메타데이터 출력
    console.log('5. 검색 메타데이터...');
    console.log(`✅ 사용 가능한 작성자: ${searchIndex.metadata.authors.slice(0, 5).join(', ')}${searchIndex.metadata.authors.length > 5 ? '...' : ''}`);
    console.log(`✅ 사용 가능한 AI 모델: ${searchIndex.metadata.sources.join(', ')}`);
    
    console.log('\n🎉 모든 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
if (require.main === module) {
  testSearchIndex();
}

module.exports = { testSearchIndex };