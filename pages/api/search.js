/**
 * 검색 API 엔드포인트
 * GET /api/search
 * 
 * 쿼리 파라미터:
 * - q: 검색 쿼리
 * - filters: JSON 형태의 필터 (dateRange, aiModels, authors)
 * - sort: 정렬 방식 (newest, oldest, title, relevance)
 * - page: 페이지 번호 (기본값: 1)
 * - pageSize: 페이지 크기 (기본값: 20)
 * - advanced: 고급 검색 사용 여부 (기본값: false)
 */

import { loadOrCreateSearchIndex, SearchIndexError } from '../../lib/search-index.js';
import { performSearch, applyFilters, sortResults } from '../../lib/search-algorithms.js';
import { 
  performAdvancedKeywordSearch, 
  calculateAdvancedRelevanceScore,
  generateSearchSuggestions 
} from '../../lib/advanced-search.js';
class SearchApiError extends Error {
  constructor(code, message, statusCode = 400, details) {
    super(message);
    this.name = 'SearchApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function respondWithError(res, error) {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'UNKNOWN_ERROR';
  const message = error.message || '알 수 없는 오류가 발생했습니다.';

  const payload = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (error.details) {
    payload.error.details = error.details;
  }

  res.status(statusCode).json(payload);
}

function parseBooleanFlag(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

/**
 * 요청 파라미터 검증 및 파싱
 */
function parseAndValidateParams(query) {
  const params = {
    query: '',
    filters: {},
    sort: 'newest',
    page: 1,
    pageSize: 20,
    advanced: false,
    includeSuggestions: false
  };

  if (query.q !== undefined) {
    if (typeof query.q !== 'string') {
      throw new SearchApiError('INVALID_QUERY', 'q 파라미터는 문자열이어야 합니다.');
    }
    params.query = query.q.trim();
  }

  const suggestionsFlag = parseBooleanFlag(query.suggestions);
  if (suggestionsFlag !== null) {
    params.includeSuggestions = suggestionsFlag;
  }

  if (query.filters !== undefined) {
    let filters;
    if (typeof query.filters === 'string') {
      try {
        filters = JSON.parse(query.filters);
      } catch (error) {
        throw new SearchApiError('INVALID_FILTERS', 'filters 파라미터는 JSON 형식이어야 합니다.', 400, {
          raw: query.filters
        });
      }
    } else if (typeof query.filters === 'object' && query.filters !== null) {
      filters = query.filters;
    } else {
      throw new SearchApiError('INVALID_FILTERS', 'filters 파라미터 형식이 올바르지 않습니다.');
    }

    if (filters.dateRange) {
      if (typeof filters.dateRange !== 'object') {
        throw new SearchApiError('INVALID_FILTERS', 'dateRange 필터는 객체여야 합니다.');
      }

      const { start, end } = filters.dateRange;
      if (start) {
        const parsed = new Date(start);
        if (Number.isNaN(parsed.getTime())) {
          throw new SearchApiError('INVALID_FILTERS', 'dateRange.start 값이 유효한 날짜가 아닙니다.');
        }
        params.filters.dateRange = params.filters.dateRange || {};
        params.filters.dateRange.start = parsed.toISOString();
      }
      if (end) {
        const parsed = new Date(end);
        if (Number.isNaN(parsed.getTime())) {
          throw new SearchApiError('INVALID_FILTERS', 'dateRange.end 값이 유효한 날짜가 아닙니다.');
        }
        params.filters.dateRange = params.filters.dateRange || {};
        params.filters.dateRange.end = parsed.toISOString();
      }
      if (params.filters.dateRange?.start && params.filters.dateRange?.end) {
        if (new Date(params.filters.dateRange.start) > new Date(params.filters.dateRange.end)) {
          throw new SearchApiError('INVALID_FILTERS', 'dateRange.start 는 dateRange.end 보다 이전이어야 합니다.');
        }
      }
    }

    if (Array.isArray(filters.sources)) {
      const sources = filters.sources.filter(source => typeof source === 'string' && source.trim().length > 0);
      if (sources.length > 0) {
        params.filters.sources = [...new Set(sources)];
      }
    }

    if (Array.isArray(filters.aiModels)) {
      const aiModels = filters.aiModels.filter(model => typeof model === 'string' && model.trim().length > 0);
      if (aiModels.length > 0) {
        params.filters.sources = [...new Set([...(params.filters.sources || []), ...aiModels])];
      }
    }

    if (Array.isArray(filters.authors)) {
      const authors = filters.authors.filter(author => typeof author === 'string' && author.trim().length > 0);
      if (authors.length > 0) {
        params.filters.authors = [...new Set(authors)];
      }
    }
  }

  const validSortOptions = ['newest', 'oldest', 'title', 'relevance'];
  if (query.sort !== undefined) {
    if (validSortOptions.includes(query.sort)) {
      params.sort = query.sort;
    } else {
      throw new SearchApiError('INVALID_SORT', `sort 파라미터는 ${validSortOptions.join(', ')} 중 하나여야 합니다.`);
    }
  }

  if (query.page !== undefined) {
    const page = Number(query.page);
    if (!Number.isInteger(page) || page <= 0) {
      throw new SearchApiError('INVALID_PAGE', 'page 파라미터는 1 이상의 정수여야 합니다.');
    }
    params.page = page;
  }

  if (query.pageSize !== undefined) {
    const pageSize = Number(query.pageSize);
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new SearchApiError('INVALID_PAGE_SIZE', 'pageSize 파라미터는 1 이상의 정수여야 합니다.');
    }
    if (pageSize > 100) {
      throw new SearchApiError('INVALID_PAGE_SIZE', 'pageSize 파라미터는 최대 100까지만 허용됩니다.', 400, {
        maxPageSize: 100
      });
    }
    params.pageSize = pageSize;
  }

  const advancedFlag = parseBooleanFlag(query.advanced);
  if (advancedFlag !== null) {
    params.advanced = advancedFlag;
  }

  return params;
}

/**
 * 검색 결과를 완전한 기사 객체로 변환
 */
async function enrichSearchResults(articleSlugs, searchIndex) {
  if (!Array.isArray(articleSlugs) || articleSlugs.length === 0) {
    return [];
  }

  const articleMap = searchIndex?.articleMap || {};
  const enriched = articleSlugs
    .map(slug => articleMap[slug])
    .filter(Boolean);

  return enriched;
}

/**
 * 메인 핸들러
 */
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'GET') {
    return respondWithError(res, new SearchApiError('METHOD_NOT_ALLOWED', 'GET 메서드만 지원됩니다.', 405));
  }
  
  try {
    // 파라미터 파싱 및 검증
    let params;
    try {
      params = parseAndValidateParams(req.query);
    } catch (error) {
      if (error instanceof SearchApiError) {
        return respondWithError(res, error);
      }
      throw error;
    }
    
    // 검색 인덱스 로드
    let searchIndex;
    try {
      searchIndex = await loadOrCreateSearchIndex();
    } catch (error) {
      const message = '검색 인덱스를 불러오지 못했습니다.';
      const wrapped = error instanceof SearchIndexError
        ? new SearchApiError('INDEX_LOAD_FAILED', message, 503, error.meta)
        : new SearchApiError('INDEX_LOAD_FAILED', message, 503);
      console.error('검색 인덱스 로드 실패:', error);
      return respondWithError(res, wrapped);
    }
    
    let searchResult;
    let suggestions = null;
    const wantsSuggestions = params.includeSuggestions || (params.advanced && !!params.query);
    
    if (params.advanced && params.query) {
      // 고급 검색 수행
      const advancedResult = performAdvancedKeywordSearch(searchIndex, params.query, {
        fuzzyThreshold: 0.8,
        includeSynonyms: true,
        maxFuzzyMatches: 5
      });
      
      // 고급 검색 결과를 기본 검색 형태로 변환
      let results = advancedResult.matches;
      
      // 필터 적용
      if (Object.keys(params.filters).length > 0) {
        results = applyFilters(results, searchIndex, params.filters);
      }
      
      // 고급 관련성 점수로 정렬 (관련성 정렬인 경우)
      if (params.sort === 'relevance' && params.query) {
        const articles = results.map(slug => ({
          slug,
          ...searchIndex.articles[slug]
        }));
        
        results = articles
          .map(article => ({
            ...article,
            relevanceScore: calculateAdvancedRelevanceScore(article, params.query)
          }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .map(article => article.slug);
      } else {
        // 다른 정렬 방식 적용
        results = sortResults(results, searchIndex, params.sort, params.query);
      }
      
      // 페이지네이션
      const totalCount = results.length;
      const totalPages = Math.ceil(totalCount / params.pageSize);
      const startIndex = (params.page - 1) * params.pageSize;
      const endIndex = startIndex + params.pageSize;
      const paginatedResults = results.slice(startIndex, endIndex);
      
      searchResult = {
        articleSlugs: paginatedResults,
        totalCount,
        currentPage: params.page,
        totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1
      };
      
      // 검색 제안 생성
      if (wantsSuggestions) {
        suggestions = generateSearchSuggestions(params.query || '', searchIndex);
      }
      
    } else {
      // 기본 검색 수행
      searchResult = performSearch(searchIndex, {
        query: params.query,
        filters: params.filters,
        sort: params.sort,
        page: params.page,
        pageSize: params.pageSize
      });
      
      // 검색 제안 생성 (쿼리가 있는 경우)
      if (wantsSuggestions) {
        suggestions = generateSearchSuggestions(params.query || '', searchIndex);
      }
    }
    
    // 오류가 있는 경우 오류 응답
    if (searchResult.error) {
      return respondWithError(res, new SearchApiError('SEARCH_ERROR', searchResult.error));
    }
    
    // 검색 결과를 완전한 기사 객체로 변환
    const articles = await enrichSearchResults(searchResult.articleSlugs, searchIndex);
    
    // 응답 생성
    const response = {
      articles,
      pagination: {
        totalCount: searchResult.totalCount,
        currentPage: searchResult.currentPage,
        totalPages: searchResult.totalPages,
        pageSize: params.pageSize,
        hasNextPage: searchResult.hasNextPage,
        hasPrevPage: searchResult.hasPrevPage
      },
      filters: {
        availableAuthors: searchIndex.metadata.authors,
        availableSources: searchIndex.metadata.sources,
        availableModels: searchIndex.metadata.sources,
        dateRange: searchIndex.metadata.dateRange
      },
      searchParams: {
        query: params.query,
        filters: params.filters,
        sort: params.sort,
        advanced: params.advanced,
        includeSuggestions: params.includeSuggestions
      }
    };
    
    // 검색 제안 추가 (있는 경우)
    if (wantsSuggestions && !suggestions) {
      suggestions = generateSearchSuggestions(params.query || '', searchIndex);
    }

    if (suggestions && (suggestions.corrections.length > 0 || suggestions.related.length > 0 || params.includeSuggestions)) {
      response.suggestions = suggestions;
    }
    
    // 성공 응답
    res.status(200).json(response);
    
  } catch (error) {
    console.error('검색 API 오류:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '검색 중 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      }
    });
  }
}
