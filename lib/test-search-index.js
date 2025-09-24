import assert from 'node:assert/strict';
import {
  loadOrCreateSearchIndex,
  resetSearchIndexCache
} from './search-index.js';
import { performSearch, highlightSearchTerms } from './search-algorithms.js';

async function run() {
  console.log('🔍 검색 인덱스 시스템 테스트 시작...\n');

  resetSearchIndexCache();
  const index = await loadOrCreateSearchIndex();

  assert.ok(index.metadata.counts.totalArticles > 0, '최소 1개 이상의 기사가 인덱싱되어야 합니다.');
  assert.ok(index.metadata.counts.totalTerms > 0, '최소 1개 이상의 검색 용어가 인덱싱되어야 합니다.');
  console.log(`✅ 인덱스 기사 수: ${index.metadata.counts.totalArticles}`);
  console.log(`✅ 인덱스 용어 수: ${index.metadata.counts.totalTerms}`);

  const secondLoad = await loadOrCreateSearchIndex();
  assert.strictEqual(secondLoad, index, '동일한 경로 로드는 캐시된 인덱스를 재사용해야 합니다.');
  console.log('✅ 캐시 재사용 확인');

  const searchResult = performSearch(index, { query: 'AI', pageSize: 5 });
  assert.ok(Array.isArray(searchResult.articleSlugs), '검색 결과는 slug 배열을 포함해야 합니다.');
  assert.ok(searchResult.totalCount >= searchResult.articleSlugs.length, '총 개수는 반환된 기사 수 이상이어야 합니다.');
  console.log(`✅ "AI" 검색 결과: ${searchResult.articleSlugs.length}/${searchResult.totalCount}`);

  const sampleText = '한국의 인공지능 기술이 글로벌 시장을 선도한다.';
  const highlighted = highlightSearchTerms(sampleText, '인공지능');
  assert.ok(highlighted.includes('<span'), '하이라이트 함수는 span 태그를 삽입해야 합니다.');
  console.log('✅ 검색어 하이라이트 처리 확인');

  const authorsSorted = [...index.metadata.authors].sort();
  assert.deepEqual(index.metadata.authors, authorsSorted, '작성자 목록은 정렬되어야 합니다.');
  console.log(`✅ 사용 가능한 작성자 수: ${index.metadata.authors.length}`);

  resetSearchIndexCache();
  const rebuilt = await loadOrCreateSearchIndex('data/articles.json', { force: true });
  assert.notStrictEqual(rebuilt, index, 'force 옵션 사용 시 새 인덱스를 생성해야 합니다.');
  console.log('✅ 강제 재빌드 옵션 확인');

  console.log('\n🎉 검색 인덱스 시스템 테스트 완료');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });
}
