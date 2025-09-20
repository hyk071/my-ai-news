# Design Document

## Overview

기사 검색 및 필터링 시스템은 사용자가 My AI News 플랫폼에서 원하는 콘텐츠를 효율적으로 찾을 수 있도록 하는 핵심 기능입니다. 이 시스템은 클라이언트 사이드에서 실시간 검색과 필터링을 제공하며, 서버 사이드에서는 최적화된 데이터 구조와 API를 통해 빠른 응답을 보장합니다.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Data Layer    │
│                 │    │                 │    │                 │
│ - Search UI     │◄──►│ /api/articles   │◄──►│ articles.json   │
│ - Filter UI     │    │ /api/search     │    │ search-index.js │
│ - Results UI    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

```
SearchPage
├── SearchBar
├── FilterPanel
│   ├── DateRangeFilter
│   ├── AIModelFilter
│   ├── AuthorFilter
│   └── SortOptions
├── ActiveFilters
├── SearchResults
│   ├── ArticleCard (repeated)
│   └── Pagination
└── MobileFilterModal
```

## Components and Interfaces

### 1. SearchBar Component

**Purpose:** 키워드 검색 입력 및 실행

**Props:**
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
}
```

**Features:**
- 실시간 검색 제안 (debounced)
- 검색 히스토리 저장 (localStorage)
- 키보드 단축키 지원 (Ctrl+K)

### 2. FilterPanel Component

**Purpose:** 다양한 필터 옵션 제공

**Props:**
```typescript
interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableAuthors: string[];
  availableModels: string[];
}

interface SearchFilters {
  dateRange: {
    start?: Date;
    end?: Date;
  };
  aiModels: string[];
  authors: string[];
  sortBy: 'newest' | 'oldest' | 'title' | 'relevance';
}
```

### 3. SearchResults Component

**Purpose:** 검색 결과 표시 및 페이지네이션

**Props:**
```typescript
interface SearchResultsProps {
  articles: Article[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  searchQuery?: string;
  loading?: boolean;
}
```

### 4. API Interfaces

**Search API Endpoint:** `/api/search`

**Request:**
```typescript
interface SearchRequest {
  query?: string;
  filters: {
    dateRange?: {
      start?: string;
      end?: string;
    };
    aiModels?: string[];
    authors?: string[];
  };
  sort: 'newest' | 'oldest' | 'title' | 'relevance';
  page: number;
  pageSize: number;
}
```

**Response:**
```typescript
interface SearchResponse {
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: {
    availableAuthors: string[];
    availableModels: string[];
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
}
```

## Data Models

### Enhanced Article Model

기존 Article 모델에 검색 최적화를 위한 필드 추가:

```typescript
interface Article {
  // 기존 필드들
  title: string;
  contentHTML: string;
  source: string;
  date: string;
  author: string;
  slug: string;
  generatedAt: string;
  seo?: {
    title: string;
    description: string;
  };
  
  // 검색 최적화를 위한 새 필드들
  searchableContent: string; // HTML 태그 제거된 순수 텍스트
  keywords: string[]; // 추출된 키워드들
  wordCount: number; // 단어 수
  readingTime: number; // 예상 읽기 시간 (분)
}
```

### Search Index Structure

빠른 검색을 위한 인덱스 구조:

```typescript
interface SearchIndex {
  articles: {
    [slug: string]: {
      title: string;
      content: string;
      author: string;
      source: string;
      date: string;
      keywords: string[];
      wordCount: number;
    };
  };
  
  // 역색인 (Inverted Index)
  termIndex: {
    [term: string]: string[]; // term -> article slugs
  };
  
  // 필터 옵션들
  metadata: {
    authors: string[];
    sources: string[];
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
}
```

## Error Handling

### Client-Side Error Handling

1. **네트워크 오류**
   - 재시도 메커니즘 (최대 3회)
   - 오프라인 상태 감지
   - 사용자 친화적 오류 메시지

2. **검색 오류**
   - 빈 검색 결과 처리
   - 잘못된 날짜 범위 검증
   - 필터 충돌 감지

3. **성능 이슈**
   - 검색 요청 디바운싱 (300ms)
   - 로딩 상태 표시
   - 무한 스크롤 오류 처리

### Server-Side Error Handling

```typescript
// API 오류 응답 형식
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// 주요 오류 코드들
enum ErrorCodes {
  INVALID_QUERY = 'INVALID_QUERY',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  SEARCH_INDEX_ERROR = 'SEARCH_INDEX_ERROR',
  PAGINATION_ERROR = 'PAGINATION_ERROR'
}
```

## Testing Strategy

### Unit Tests

1. **Search Logic Tests**
   ```typescript
   describe('Search Functions', () => {
     test('should filter articles by keyword', () => {
       // 키워드 검색 로직 테스트
     });
     
     test('should apply date range filter correctly', () => {
       // 날짜 필터 로직 테스트
     });
     
     test('should sort results by relevance', () => {
       // 관련성 정렬 로직 테스트
     });
   });
   ```

2. **Component Tests**
   ```typescript
   describe('SearchBar Component', () => {
     test('should call onSearch when enter is pressed', () => {
       // 검색 실행 테스트
     });
     
     test('should debounce search input', () => {
       // 디바운싱 테스트
     });
   });
   ```

### Integration Tests

1. **API Integration**
   - 검색 API 엔드포인트 테스트
   - 필터 조합 테스트
   - 페이지네이션 테스트

2. **End-to-End Tests**
   - 전체 검색 플로우 테스트
   - 모바일 반응형 테스트
   - 성능 테스트

### Performance Tests

1. **Search Performance**
   - 대용량 데이터셋에서의 검색 속도
   - 메모리 사용량 모니터링
   - 동시 사용자 부하 테스트

2. **UI Performance**
   - 검색 결과 렌더링 시간
   - 스크롤 성능
   - 필터 적용 응답 시간

## Implementation Details

### Search Algorithm

1. **텍스트 검색**
   ```typescript
   function searchArticles(query: string, articles: Article[]): Article[] {
     const terms = query.toLowerCase().split(/\s+/);
     
     return articles.filter(article => {
       const searchableText = [
         article.title,
         article.searchableContent,
         ...article.keywords
       ].join(' ').toLowerCase();
       
       return terms.every(term => searchableText.includes(term));
     });
   }
   ```

2. **관련성 점수 계산**
   ```typescript
   function calculateRelevanceScore(article: Article, query: string): number {
     const terms = query.toLowerCase().split(/\s+/);
     let score = 0;
     
     terms.forEach(term => {
       // 제목에서 발견시 높은 점수
       if (article.title.toLowerCase().includes(term)) {
         score += 10;
       }
       
       // 키워드에서 발견시 중간 점수
       if (article.keywords.some(keyword => 
         keyword.toLowerCase().includes(term))) {
         score += 5;
       }
       
       // 본문에서 발견시 기본 점수
       if (article.searchableContent.toLowerCase().includes(term)) {
         score += 1;
       }
     });
     
     return score;
   }
   ```

### Caching Strategy

1. **Client-Side Caching**
   - React Query를 사용한 검색 결과 캐싱
   - 최근 검색어 localStorage 저장
   - 필터 상태 sessionStorage 저장

2. **Server-Side Caching**
   - 검색 인덱스 메모리 캐싱
   - 자주 사용되는 필터 조합 캐싱
   - CDN을 통한 정적 자산 캐싱

### Mobile Optimization

1. **Responsive Design**
   ```css
   /* 모바일 우선 디자인 */
   .search-container {
     padding: 1rem;
   }
   
   @media (min-width: 768px) {
     .search-container {
       padding: 2rem;
       display: grid;
       grid-template-columns: 300px 1fr;
       gap: 2rem;
     }
   }
   ```

2. **Touch Interactions**
   - 최소 터치 타겟 크기: 44px
   - 스와이프 제스처 지원
   - 풀 투 리프레시 기능

3. **Performance Optimizations**
   - 이미지 지연 로딩
   - 가상 스크롤링 (대용량 결과)
   - 번들 크기 최적화

## Security Considerations

1. **Input Sanitization**
   - XSS 방지를 위한 검색어 이스케이핑
   - SQL Injection 방지 (해당 없음, JSON 기반)
   - 악성 정규식 패턴 차단

2. **Rate Limiting**
   - 검색 API 호출 제한 (분당 100회)
   - IP 기반 제한
   - 사용자별 제한

3. **Data Privacy**
   - 검색 로그 익명화
   - 개인정보 포함 검색어 필터링
   - GDPR 준수를 위한 데이터 보존 정책