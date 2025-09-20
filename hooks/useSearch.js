/**
 * useSearch 커스텀 훅
 * 검색 상태 관리, API 호출, URL 동기화
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

const useSearch = () => {
  const router = useRouter();
  
  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    aiModels: [],
    authors: []
  });
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [advancedSearch, setAdvancedSearch] = useState(false);
  
  // API 응답 상태
  const [searchResults, setSearchResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  
  // 메타데이터 상태
  const [metadata, setMetadata] = useState({
    availableAuthors: [],
    availableModels: [],
    dateRange: { earliest: null, latest: null }
  });

  // URL에서 초기 상태 로드
  useEffect(() => {
    if (router.isReady) {
      const { q, filters: filtersParam, sort, page, pageSize: pageSizeParam, advanced } = router.query;
      
      if (q) setSearchQuery(q);
      if (sort) setSortBy(sort);
      if (page) setCurrentPage(parseInt(page, 10) || 1);
      if (pageSizeParam) setPageSize(parseInt(pageSizeParam, 10) || 20);
      if (advanced === 'true') setAdvancedSearch(true);
      
      if (filtersParam) {
        try {
          const parsedFilters = JSON.parse(filtersParam);
          setFilters(prevFilters => ({
            ...prevFilters,
            ...parsedFilters
          }));
        } catch (e) {
          console.warn('필터 파라미터 파싱 실패:', e);
        }
      }
    }
  }, [router.isReady, router.query]);

  // URL 업데이트
  const updateURL = useCallback((params) => {
    const query = { ...router.query };
    
    if (params.q !== undefined) {
      if (params.q) {
        query.q = params.q;
      } else {
        delete query.q;
      }
    }
    
    if (params.filters !== undefined) {
      if (Object.keys(params.filters).some(key => {
        const value = params.filters[key];
        return Array.isArray(value) ? value.length > 0 : 
               (typeof value === 'object' && value !== null) ? 
               Object.values(value).some(v => v) : value;
      })) {
        query.filters = JSON.stringify(params.filters);
      } else {
        delete query.filters;
      }
    }
    
    if (params.sort !== undefined) {
      if (params.sort !== 'newest') {
        query.sort = params.sort;
      } else {
        delete query.sort;
      }
    }
    
    if (params.page !== undefined) {
      if (params.page > 1) {
        query.page = params.page.toString();
      } else {
        delete query.page;
      }
    }
    
    if (params.pageSize !== undefined) {
      if (params.pageSize !== 20) {
        query.pageSize = params.pageSize.toString();
      } else {
        delete query.pageSize;
      }
    }
    
    if (params.advanced !== undefined) {
      if (params.advanced) {
        query.advanced = 'true';
      } else {
        delete query.advanced;
      }
    }
    
    router.push({
      pathname: router.pathname,
      query
    }, undefined, { shallow: true });
  }, [router]);

  // 검색 실행
  const performSearch = useCallback(async (resetPage = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (searchQuery) searchParams.set('q', searchQuery);
      if (Object.keys(filters).some(key => {
        const value = filters[key];
        return Array.isArray(value) ? value.length > 0 : 
               (typeof value === 'object' && value !== null) ? 
               Object.values(value).some(v => v) : value;
      })) {
        searchParams.set('filters', JSON.stringify(filters));
      }
      if (sortBy !== 'newest') searchParams.set('sort', sortBy);
      
      const page = resetPage ? 1 : currentPage;
      if (page > 1) searchParams.set('page', page.toString());
      if (pageSize !== 20) searchParams.set('pageSize', pageSize.toString());
      if (advancedSearch) searchParams.set('advanced', 'true');
      
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`서버에서 잘못된 응답을 받았습니다. (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || '검색 중 오류가 발생했습니다.');
      }
      
      setSearchResults(data.articles || []);
      setTotalCount(data.pagination?.totalCount || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setSuggestions(data.suggestions || null);
      
      if (data.filters) {
        setMetadata({
          availableAuthors: data.filters.availableAuthors || [],
          availableModels: data.filters.availableModels || [],
          dateRange: data.filters.dateRange || { earliest: null, latest: null }
        });
      }
      
      if (resetPage && currentPage !== page) {
        setCurrentPage(page);
      }
      
      // URL 업데이트
      updateURL({
        q: searchQuery,
        filters,
        sort: sortBy,
        page,
        pageSize,
        advanced: advancedSearch
      });
      
    } catch (err) {
      console.error('검색 오류:', err);
      setError(err.message);
      setSearchResults([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, currentPage, pageSize, advancedSearch, updateURL]);

  // 메타데이터 로드
  const loadMetadata = useCallback(async () => {
    try {
      const response = await fetch('/api/search/metadata');
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`메타데이터 API에서 잘못된 응답을 받았습니다. (${response.status})`);
      }
      
      const data = await response.json();
      
      if (response.ok) {
        setMetadata({
          availableAuthors: data.authors || [],
          availableModels: data.models || [],
          dateRange: data.dateRange || { earliest: null, latest: null }
        });
      }
    } catch (err) {
      console.warn('메타데이터 로드 실패:', err);
    }
  }, []);

  // 초기 메타데이터 로드
  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  // 검색 쿼리 변경
  const handleSearchQueryChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  // 검색 실행 (쿼리 변경시)
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // 검색어가 있으면 관련성순으로 자동 변경
    if (query && sortBy !== 'relevance') {
      setSortBy('relevance');
    }
  }, [sortBy]);

  // 필터 변경
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // 개별 필터 제거
  const handleRemoveFilter = useCallback((filterType, value) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'query':
        setSearchQuery('');
        break;
      case 'dateRange':
        newFilters.dateRange = { start: '', end: '' };
        break;
      case 'aiModel':
        newFilters.aiModels = newFilters.aiModels.filter(model => model !== value);
        break;
      case 'author':
        newFilters.authors = newFilters.authors.filter(author => author !== value);
        break;
    }
    
    if (filterType !== 'query') {
      setFilters(newFilters);
    }
    setCurrentPage(1);
  }, [filters]);

  // 모든 필터 제거
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({
      dateRange: { start: '', end: '' },
      aiModels: [],
      authors: []
    });
    setSortBy('newest');
    setCurrentPage(1);
  }, []);

  // 정렬 변경
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  }, []);

  // 페이지 변경
  const handlePageChange = useCallback((page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  }, [pageSize]);

  // 고급 검색 토글
  const handleAdvancedToggle = useCallback((enabled) => {
    setAdvancedSearch(enabled);
    setCurrentPage(1);
  }, []);

  // 검색 실행 트리거 (상태 변경시)
  useEffect(() => {
    if (router.isReady) {
      const timeoutId = setTimeout(() => {
        performSearch(false);
      }, 300); // 디바운싱
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, filters, sortBy, currentPage, pageSize, advancedSearch, router.isReady]);

  // 활성 필터 확인
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() || 
           filters.dateRange.start || 
           filters.dateRange.end ||
           filters.aiModels.length > 0 || 
           filters.authors.length > 0;
  }, [searchQuery, filters]);

  return {
    // 상태
    searchQuery,
    filters,
    sortBy,
    currentPage,
    pageSize,
    advancedSearch,
    
    // 결과
    searchResults,
    totalCount,
    totalPages,
    loading,
    error,
    suggestions,
    metadata,
    hasActiveFilters,
    
    // 액션
    handleSearchQueryChange,
    handleSearch,
    handleFiltersChange,
    handleRemoveFilter,
    handleClearAllFilters,
    handleSortChange,
    handlePageChange,
    handleAdvancedToggle,
    performSearch,
    loadMetadata
  };
};

export default useSearch;