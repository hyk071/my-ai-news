# Search API Contract

이 문서는 `/api/search` 엔드포인트의 요청·응답 계약과 오류 코드를 정의합니다. Next.js API 라우트는 서버·클라이언트 모두 동일한 스키마를 사용하며, 모든 응답은 `application/json` 헤더를 포함합니다.

## Endpoint

- **Method**: `GET`
- **URL**: `/api/search`
- **Content-Type**: `application/json`
- **CORS**: `Access-Control-Allow-Origin: *`

## Query Parameters

| 이름 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `q` | `string` | `''` | 검색어. 공백만 포함 시 빈 문자열로 처리합니다. |
| `filters` | `JSON` | `{}` | 객체 문자열 또는 직렬화된 JSON. `dateRange`, `sources`, `authors` 키를 지원합니다. |
| `sort` | `'newest'\| 'oldest'\| 'title'\| 'relevance'` | `'newest'` | 정렬 기준. 유효하지 않은 값은 400 오류를 반환합니다. |
| `page` | `number` | `1` | 1 이상의 정수. 음수/0/실수는 400 오류. |
| `pageSize` | `number` | `20` | 1 이상 100 이하 정수. 범위를 벗어나면 400 오류. |
| `advanced` | `boolean` | `false` | 퍼지 검색 및 동의어 확장을 활성화합니다. |
| `suggestions` | `boolean` | `false` | 응답에 `suggestions` 필드를 강제로 포함합니다. (고급 검색 시 자동 활성화)

### Filters Object

```json
{
  "dateRange": { "start": "2026-01-01", "end": "2026-01-31" },
  "sources": ["OpenAI", "DeepMind"],
  "authors": ["홍길동"]
}
```

- `dateRange.start`, `dateRange.end`: ISO8601 문자열. `start > end`이면 400 오류.
- `sources`: 문자열 배열. `aiModels` 키 역시 동일하게 허용되며 `sources`로 병합됩니다.
- `authors`: 문자열 배열.

## 성공 응답 (200)

```json
{
  "articles": [
    {
      "slug": "gpt-updates-2026",
      "title": "GPT 업그레이드",
      "contentHTML": "...",
      "source": "OpenAI",
      "author": "AI Team",
      "publishedAt": "2026-02-12T09:00:00.000Z"
    }
  ],
  "pagination": {
    "totalCount": 42,
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "availableAuthors": ["AI Team"],
    "availableSources": ["DeepMind", "OpenAI"],
    "dateRange": {
      "earliest": "2025-01-03T00:00:00.000Z",
      "latest": "2026-02-12T09:00:00.000Z"
    }
  },
  "searchParams": {
    "query": "gpt",
    "filters": {
      "sources": ["OpenAI"]
    },
    "sort": "relevance",
    "advanced": false,
    "includeSuggestions": true
  },
  "suggestions": {
    "corrections": [
      {
        "original": "gptt",
        "suggestions": ["gpt"]
      }
    ],
    "related": ["인공지능", "머신러닝"]
  }
}
```

- `articles`는 `data/articles.json`의 원본 슬러그 데이터를 그대로 확장합니다.
- `filters.availableSources`는 알파벳 정렬, `availableAuthors`도 정렬된 배열입니다.
- 하위 호환을 위해 `filters.availableModels`도 동일한 배열을 노출합니다.
- `suggestions` 필드는 `suggestions=true` 또는 `advanced=true` & 쿼리 사용 시 항상 포함됩니다. 데이터가 없어도 빈 배열이 리턴됩니다.

## 오류 응답

```json
{
  "error": {
    "code": "INVALID_FILTERS",
    "message": "filters 파라미터는 JSON 형식이어야 합니다.",
    "timestamp": "2026-02-12T09:00:00.000Z",
    "details": {
      "raw": "not-json"
    }
  }
}
```

### 오류 코드 요약

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| `METHOD_NOT_ALLOWED` | 405 | GET 이외의 메서드를 호출한 경우 |
| `INVALID_QUERY` | 400 | `q` 파라미터가 문자열이 아닌 경우 |
| `INVALID_FILTERS` | 400 | `filters` JSON 파싱 실패 또는 구조 오류 |
| `INVALID_SORT` | 400 | 허용되지 않은 정렬 값 |
| `INVALID_PAGE` | 400 | 페이지가 1 미만이거나 정수가 아닌 경우 |
| `INVALID_PAGE_SIZE` | 400 | 페이지 크기 범위 위반 |
| `INDEX_LOAD_FAILED` | 503 | `data/articles.json`을 읽거나 인덱스 생성 실패 |
| `SEARCH_ERROR` | 400 | 검색 수행 중 내부 알고리즘 오류 |
| `INTERNAL_SERVER_ERROR` | 500 | 처리되지 않은 예외 (기본값) |

오류 응답은 항상 `timestamp`를 포함하며, 유효한 경우 `details` 객체로 추가 컨텍스트를 제공합니다.

## 메타데이터 캐싱

`lib/search-index.js`는 `data/articles.json`의 `mtime`을 기준으로 메모리 캐시를 유지합니다.

- 동일 프로세스 내 중복 호출은 인덱스를 재사용합니다.
- `force` 플래그 또는 파일 수정 시 인덱스를 재빌드합니다.
- API 응답의 `filters.available*` 값은 캐시에서 제공됩니다.

## 테스트 커버리지

- `lib/test-search-basic.js`: 기본 검색 파이프라인 및 필터 페이지네이션 확인.
- `lib/test-search-index.js`: 인덱스 캐시 재사용, 강제 재빌드, 메타데이터 정렬 검증.
- `lib/test-search-api.js`: 파라미터 검증, 오류 코드, 제안 응답 스키마 확인.

테스트 실행: `npm test`

리포트 저장: `npm run test:save -- --save-report`
