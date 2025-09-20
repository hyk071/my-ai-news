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

const { loadOrCreateSearchIndex } = require('../../lib/search-index');
const { performSearch } = require('../../lib/search-algorithms');
const { 
  performAdvancedKeywordSearch, 
  calculateAdvancedRelevanceScore,
  generateSearchSuggestions 
} = require('../../lib/advanced-search');
const fs = require('fs');
const path = require('path');

// 검색 인덱스 캐시 (메모리 캐싱)
let searchIndexCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 검색 인덱스 로드 (캐싱 포함)
 */
async function getSearchIndex() {
  const now = Date.now();
  
  // 캐시가 유효한 경우 캐시된 인덱스 반환
  if (searchIndexCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return searchIndexCache;
  }
  
  try {
    // 새로운 인덱스 로드
    searchIndexCache = await loadOrCreateSearchIndex();
    cacheTimestamp = now;
    return searchIndexCache;
  } catch (error) {
    console.error('검색 인덱스 로드 실패:', error);
    // 캐시된 인덱스가 있으면 반환, 없으면 빈 인덱스 반환
    return searchIndexCache || {
      articles: {},
      termIndex: {},
      metadata: { authors: [], sources: [], dateRange: { earliest: null, latest: null } }
    };
  }
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
    advanced: false
  };
  
  // 검색 쿼리
  if (query.q && typeof query.q === 'string') {
    params.query = query.q.trim();
  }
  
  // 필터 파싱
  if (query.filters) {
    try {
      const filters = typeof query.filters === 'string' 
        ? JSON.parse(query.filters) 
        : query.filters;
      
      if (filters && typeof filters === 'object') {
        // 날짜 범위 필터
        if (filters.dateRange && typeof filters.dateRange === 'object') {
          params.filters.dateRange = {};
          if (filters.dateRange.start) {
            params.filters.dateRange.start = filters.dateRange.start;
          }
          if (filters.dateRange.end) {
            params.filters.dateRange.end = filters.dateRange.end;
          }
        }
        
        // AI 모델 필터
        if (Array.isArray(filters.aiModels)) {
          params.filters.aiModels = filters.aiModels.filter(model => 
            typeof model === 'string' && model.trim()
          );
        }
        
        // 작성자 필터
        if (Array.isArray(filters.authors)) {
          params.filters.authors = filters.authors.filter(author => 
            typeof author === 'string' && author.trim()
          );
        }
      }
    } catch (error) {
      console.warn('필터 파싱 오류:', error);
    }
  }
  
  // 정렬 방식
  const validSortOptions = ['newest', 'oldest', 'title', 'relevance'];
  if (query.sort && validSortOptions.includes(query.sort)) {
    params.sort = query.sort;
  }
  
  // 페이지 번호
  if (query.page) {
    const page = parseInt(query.page, 10);
    if (!isNaN(page) && page > 0) {
      params.page = page;
    }
  }
  
  // 페이지 크기
  if (query.pageSize) {
    const pageSize = parseInt(query.pageSize, 10);
    if (!isNaN(pageSize) && pageSize > 0 && pageSize <= 100) { // 최대 100개로 제한
      params.pageSize = pageSize;
    }
  }
  
  // 고급 검색 사용 여부
  if (query.advanced === 'true' || query.advanced === true) {
    params.advanced = true;
  }
  
  return params;
}

/**
 * 검색 결과를 완전한 기사 객체로 변환
 */
async function enrichSearchResults(articleSlugs, searchIndex) {
  try {
    // 원본 기사 데이터 로드
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.promises.readFile(articlesPath, 'utf8');
    const allArticles = JSON.parse(articlesData);
    
    // slug를 키로 하는 맵 생성
    const articleMap = {};
    allArticles.forEach(article => {
      if (article.slug) {
        articleMap[article.slug] = article;
      }
    });
    
    // 검색 결과에 해당하는 완전한 기사 객체 반환
    return articleSlugs
      .map(slug => articleMap[slug])
      .filter(article => article); // null/undefined 제거
      
  } catch (error) {
    console.error('기사 데이터 로드 실패:', error);
    return [];
  }
}

/**
 * 메인 핸들러
 */
async function handler(req, res) {
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
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET 메서드만 지원됩니다.',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  try {
    // 파라미터 파싱 및 검증
    const params = parseAndValidateParams(req.query);
    
    // 검색 인덱스 로드
    const searchIndex = await getSearchIndex();
    
    let searchResult;
    let suggestions = null;
    
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
        const { applyFilters } = require('../../lib/search-algorithms');
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
        const { sortResults } = require('../../lib/search-algorithms');
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
      suggestions = generateSearchSuggestions(params.query, searchIndex);
      
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
      if (params.query) {
        suggestions = generateSearchSuggestions(params.query, searchIndex);
      }
    }
    
    // 오류가 있는 경우 오류 응답
    if (searchResult.error) {
      return res.status(400).json({
        error: {
          code: 'SEARCH_ERROR',
          message: searchResult.error,
          timestamp: new Date().toISOString()
        }
      });
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
        availableModels: searchIndex.metadata.sources,
        dateRange: searchIndex.metadata.dateRange
      },
      searchParams: {
        query: params.query,
        filters: params.filters,
        sort: params.sort,
        advanced: params.advanced
      }
    };
    
    // 검색 제안 추가 (있는 경우)
    if (suggestions) {
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

module.exports = handler;
module.exports.default = handler;