import assert from 'node:assert/strict';
import handler from '../pages/api/search.js';
import { resetSearchIndexCache } from './search-index.js';

function createMockReq(query = {}, method = 'GET') {
  return {
    method,
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
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    end(payload) {
      this.data = payload;
      return this;
    }
  };

  return res;
}

async function invokeHandler(query = {}, method = 'GET') {
  const req = createMockReq(query, method);
  const res = createMockRes();
  await handler(req, res);
  return res;
}

async function run() {
  console.log('🧪 검색 API 테스트 시작...\n');
  resetSearchIndexCache();

  const baseline = await invokeHandler({ q: 'AI', pageSize: '3', suggestions: 'true' });
  assert.equal(baseline.statusCode, 200, '기본 검색은 성공해야 합니다.');
  assert.ok(Array.isArray(baseline.data.articles), '검색 결과는 기사 배열을 포함해야 합니다.');
  assert.ok(baseline.data.filters.availableSources, 'availableSources 필드가 존재해야 합니다.');
  assert.deepEqual(
    baseline.data.filters.availableModels,
    baseline.data.filters.availableSources,
    'availableModels 는 하위 호환을 위해 availableSources 와 동일해야 합니다.'
  );
  assert.equal(baseline.data.searchParams.includeSuggestions, true, 'suggestions 플래그가 반영되어야 합니다.');
  assert.ok('suggestions' in baseline.data, 'suggestions 필드가 응답에 포함되어야 합니다.');
  console.log('✅ 기본 검색 및 제안 응답 확인');

  const invalidFilters = await invokeHandler({ filters: 'not-json' });
  assert.equal(invalidFilters.statusCode, 400, '잘못된 필터는 400을 반환해야 합니다.');
  assert.equal(invalidFilters.data.error.code, 'INVALID_FILTERS');
  console.log('✅ 잘못된 필터 처리 확인');

  const invalidPage = await invokeHandler({ page: '-1' });
  assert.equal(invalidPage.statusCode, 400, '잘못된 페이지 값은 400을 반환해야 합니다.');
  assert.equal(invalidPage.data.error.code, 'INVALID_PAGE');
  console.log('✅ 잘못된 페이지 값 처리 확인');

  const outOfRange = await invokeHandler({ page: '9999', pageSize: '5' });
  assert.equal(outOfRange.statusCode, 200, '범위를 벗어난 페이지도 200을 반환해야 합니다.');
  assert.ok(Array.isArray(outOfRange.data.articles));
  assert.equal(outOfRange.data.articles.length, 0, '범위를 벗어난 페이지는 빈 결과여야 합니다.');
  console.log('✅ 페이지 범위 초과 처리 확인');

  const wrongMethod = await invokeHandler({}, 'POST');
  assert.equal(wrongMethod.statusCode, 405, '지원하지 않는 메서드는 405를 반환해야 합니다.');
  assert.equal(wrongMethod.data.error.code, 'METHOD_NOT_ALLOWED');
  console.log('✅ 메서드 제한 처리 확인');

  console.log('\n🎉 검색 API 테스트 완료');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(error => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });
}
