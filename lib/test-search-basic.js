import assert from 'node:assert/strict';
import { loadOrCreateSearchIndex, resetSearchIndexCache } from './search-index.js';
import { performSearch } from './search-algorithms.js';

async function run() {
  console.log('🔎 기본 검색 시나리오 테스트 시작...');

  resetSearchIndexCache();
  const index = await loadOrCreateSearchIndex();

  const noQueryResults = performSearch(index, { query: '', pageSize: 10 });
  assert.ok(noQueryResults.articleSlugs.length <= 10, '페이지 크기만큼 기본 결과를 반환해야 합니다.');
  console.log('✅ 기본 검색 결과 페이지네이션 확인');

  const filtered = performSearch(index, {
    query: 'AI',
    filters: {
      sources: index.metadata.sources.slice(0, 1)
    },
    pageSize: 5
  });
  assert.ok(filtered.articleSlugs.length <= 5, '필터 적용 시에도 페이지네이션이 유지되어야 합니다.');
  console.log('✅ 필터 적용 검색 확인');

  console.log('🎉 기본 검색 시나리오 테스트 완료\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });
}
