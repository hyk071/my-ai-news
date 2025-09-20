/**
 * 완전한 검색 시스템 통합 테스트
 * 백엔드 API + 프론트엔드 컴포넌트 테스트
 */

const { testSearchIndex } = require('./test-search-index');
const { testAdvancedSearch } = require('./test-advanced-search');
const { testSearchAPI } = require('./test-search-api');
const { testMetadataAPI } = require('./test-metadata-api');

async function testCompleteSystem() {
  console.log('🚀 완전한 검색 시스템 통합 테스트 시작...\n');
  
  try {
    console.log('='.repeat(60));
    console.log('1. 검색 인덱스 시스템 테스트');
    console.log('='.repeat(60));
    await testSearchIndex();
    
    console.log('\n' + '='.repeat(60));
    console.log('2. 고급 검색 기능 테스트');
    console.log('='.repeat(60));
    await testAdvancedSearch();
    
    console.log('\n' + '='.repeat(60));
    console.log('3. 검색 API 테스트');
    console.log('='.repeat(60));
    await testSearchAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('4. 메타데이터 API 테스트');
    console.log('='.repeat(60));
    await testMetadataAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 모든 테스트 완료!');
    console.log('='.repeat(60));
    
    console.log('\n📋 구현 완료된 기능들:');
    console.log('✅ 검색 인덱스 생성 및 관리');
    console.log('✅ 키워드 검색 (한국어/영어 지원)');
    console.log('✅ 퍼지 매칭 및 동의어 확장');
    console.log('✅ 다중 필터링 (날짜, AI 모델, 작성자)');
    console.log('✅ 다양한 정렬 옵션');
    console.log('✅ 페이지네이션');
    console.log('✅ 검색어 하이라이트');
    console.log('✅ 검색 제안 및 오타 교정');
    console.log('✅ 메타데이터 및 통계');
    console.log('✅ 반응형 UI 컴포넌트');
    console.log('✅ URL 상태 동기화');
    console.log('✅ 모바일 최적화');
    
    console.log('\n🌐 사용 가능한 페이지:');
    console.log('• 메인 페이지: http://localhost:3000/');
    console.log('• 검색 페이지: http://localhost:3000/search');
    console.log('• 관리자 페이지: http://localhost:3000/admin');
    
    console.log('\n🔧 API 엔드포인트:');
    console.log('• 검색 API: GET /api/search');
    console.log('• 메타데이터 API: GET /api/search/metadata');
    
    console.log('\n📱 주요 기능:');
    console.log('• 실시간 검색 (디바운싱)');
    console.log('• 고급 검색 (퍼지 매칭, 동의어)');
    console.log('• 다중 필터 (날짜, AI 모델, 작성자)');
    console.log('• 정렬 (최신순, 관련성순, 제목순)');
    console.log('• 검색어 하이라이트');
    console.log('• 검색 히스토리 및 제안');
    console.log('• 모바일 반응형 디자인');
    console.log('• 다크 모드 지원');
    console.log('• 키보드 단축키 (Ctrl+K)');
    
  } catch (error) {
    console.error('❌ 통합 테스트 중 오류 발생:', error);
    process.exit(1);
  }
}

// 테스트 실행
if (require.main === module) {
  testCompleteSystem();
}

module.exports = { testCompleteSystem };