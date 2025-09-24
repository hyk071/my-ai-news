/**
 * 검색 알고리즘 및 필터링 로직
 * 키워드 매칭, 관련성 점수 계산, 다중 필터 조합, 정렬 알고리즘 구현
 */

import { normalizeAndTokenize } from './search-index.js';

/**
 * 관련성 점수 계산
 * @param {Object} article - 기사 객체 (인덱스에서 가져온 형태)
 * @param {string} query - 검색 쿼리
 * @returns {number} 관련성 점수
 */
function calculateRelevanceScore(article, query) {
    if (!query || !article) return 0;

    const queryTerms = normalizeAndTokenize(query);
    if (queryTerms.length === 0) return 0;

    let score = 0;

    queryTerms.forEach(term => {
        const titleLower = (article.title || '').toLowerCase();
        const contentLower = (article.content || '').toLowerCase();
        const keywords = article.keywords || [];

        // 제목에서 발견시 높은 점수 (가중치: 10)
        if (titleLower.includes(term)) {
            score += 10;

            // 제목에서 정확히 일치하는 경우 추가 점수
            if (titleLower === term) {
                score += 5;
            }
        }

        // 키워드에서 발견시 중간 점수 (가중치: 5)
        const keywordMatch = keywords.some(keyword =>
            keyword.toLowerCase().includes(term)
        );
        if (keywordMatch) {
            score += 5;
        }

        // 본문에서 발견시 기본 점수 (가중치: 1)
        if (contentLower.includes(term)) {
            score += 1;

            // 본문에서 여러 번 등장하는 경우 추가 점수 (최대 3점)
            const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
            score += Math.min(matches - 1, 3) * 0.5;
        }
    });

    // 쿼리 용어 중 매칭된 비율에 따른 보너스
    const matchedTerms = queryTerms.filter(term => {
        const titleLower = (article.title || '').toLowerCase();
        const contentLower = (article.content || '').toLowerCase();
        const keywords = article.keywords || [];

        return titleLower.includes(term) ||
            contentLower.includes(term) ||
            keywords.some(keyword => keyword.toLowerCase().includes(term));
    });

    const matchRatio = matchedTerms.length / queryTerms.length;
    score *= matchRatio;

    return score;
}

/**
 * 키워드 검색 수행
 * @param {Object} searchIndex - 검색 인덱스
 * @param {string} query - 검색 쿼리
 * @returns {string[]} 매칭된 기사 slug 배열
 */
function performKeywordSearch(searchIndex, query) {
    if (!query || !searchIndex.termIndex) return [];

    const queryTerms = normalizeAndTokenize(query);
    if (queryTerms.length === 0) return [];

    // 각 용어에 대해 매칭되는 기사들 찾기
    const termMatches = queryTerms.map(term => {
        return searchIndex.termIndex[term] || [];
    });

    if (termMatches.length === 0) return [];

    // AND 검색: 모든 용어가 포함된 기사만 반환
    let results = termMatches[0];
    for (let i = 1; i < termMatches.length; i++) {
        results = results.filter(slug => termMatches[i].includes(slug));
    }

    return results;
}

/**
 * 날짜 범위 필터 적용
 * @param {string[]} articleSlugs - 기사 slug 배열
 * @param {Object} searchIndex - 검색 인덱스
 * @param {Object} dateRange - 날짜 범위 { start?: string, end?: string }
 * @returns {string[]} 필터링된 기사 slug 배열
 */
function applyDateRangeFilter(articleSlugs, searchIndex, dateRange) {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
        return articleSlugs;
    }

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    // 날짜 유효성 검증
    if (startDate && endDate && startDate > endDate) {
        throw new Error('시작 날짜가 종료 날짜보다 늦습니다.');
    }

    return articleSlugs.filter(slug => {
        const article = searchIndex.articles[slug];
        if (!article || !article.date) return false;

        const articleDate = new Date(article.date);
        if (isNaN(articleDate.getTime())) return false;

        if (startDate && articleDate < startDate) return false;
        if (endDate && articleDate > endDate) return false;

        return true;
    });
}

/**
 * AI 모델 필터 적용
 * @param {string[]} articleSlugs - 기사 slug 배열
 * @param {Object} searchIndex - 검색 인덱스
 * @param {string[]} aiModels - 선택된 AI 모델 배열
 * @returns {string[]} 필터링된 기사 slug 배열
 */
function applySourceFilter(articleSlugs, searchIndex, sources) {
    if (!sources || sources.length === 0) {
        return articleSlugs;
    }

    return articleSlugs.filter(slug => {
        const article = searchIndex.articles[slug];
        if (!article || !article.source) return false;

        return sources.includes(article.source);
    });
}

function applyAIModelFilter(articleSlugs, searchIndex, aiModels) {
    return applySourceFilter(articleSlugs, searchIndex, aiModels);
}

/**
 * 작성자 필터 적용
 * @param {string[]} articleSlugs - 기사 slug 배열
 * @param {Object} searchIndex - 검색 인덱스
 * @param {string[]} authors - 선택된 작성자 배열
 * @returns {string[]} 필터링된 기사 slug 배열
 */
function applyAuthorFilter(articleSlugs, searchIndex, authors) {
    if (!authors || authors.length === 0) {
        return articleSlugs;
    }

    return articleSlugs.filter(slug => {
        const article = searchIndex.articles[slug];
        if (!article || !article.author) return false;

        return authors.includes(article.author);
    });
}

/**
 * 다중 필터 적용
 * @param {string[]} articleSlugs - 기사 slug 배열
 * @param {Object} searchIndex - 검색 인덱스
 * @param {Object} filters - 필터 객체
 * @returns {string[]} 필터링된 기사 slug 배열
 */
function applyFilters(articleSlugs, searchIndex, filters) {
    let results = [...articleSlugs];

    if (!filters) return results;

    // 날짜 범위 필터
    if (filters.dateRange) {
        results = applyDateRangeFilter(results, searchIndex, filters.dateRange);
    }

    const sourceFilters = filters.sources && filters.sources.length > 0
        ? filters.sources
        : (filters.aiModels && filters.aiModels.length > 0 ? filters.aiModels : null);

    if (sourceFilters) {
        results = applySourceFilter(results, searchIndex, sourceFilters);
    }

    // 작성자 필터
    if (filters.authors && filters.authors.length > 0) {
        results = applyAuthorFilter(results, searchIndex, filters.authors);
    }

    return results;
}

/**
 * 검색 결과 정렬
 * @param {string[]} articleSlugs - 기사 slug 배열
 * @param {Object} searchIndex - 검색 인덱스
 * @param {string} sortBy - 정렬 기준 ('newest', 'oldest', 'title', 'relevance')
 * @param {string} query - 검색 쿼리 (관련성 정렬시 필요)
 * @returns {string[]} 정렬된 기사 slug 배열
 */
function sortResults(articleSlugs, searchIndex, sortBy = 'newest', query = '') {
    const articles = articleSlugs.map(slug => ({
        slug,
        ...searchIndex.articles[slug]
    }));

    switch (sortBy) {
        case 'newest':
            return articles
                .sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateB - dateA; // 내림차순
                })
                .map(article => article.slug);

        case 'oldest':
            return articles
                .sort((a, b) => {
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    return dateA - dateB; // 오름차순
                })
                .map(article => article.slug);

        case 'title':
            return articles
                .sort((a, b) => {
                    const titleA = (a.title || '').toLowerCase();
                    const titleB = (b.title || '').toLowerCase();
                    return titleA.localeCompare(titleB);
                })
                .map(article => article.slug);

        case 'relevance':
            if (!query) {
                // 쿼리가 없으면 최신순으로 정렬
                return sortResults(articleSlugs, searchIndex, 'newest');
            }

            return articles
                .map(article => ({
                    ...article,
                    relevanceScore: calculateRelevanceScore(article, query)
                }))
                .sort((a, b) => b.relevanceScore - a.relevanceScore) // 관련성 점수 내림차순
                .map(article => article.slug);

        default:
            return articleSlugs;
    }
}

/**
 * 통합 검색 수행
 * @param {Object} searchIndex - 검색 인덱스
 * @param {Object} searchParams - 검색 파라미터
 * @returns {Object} 검색 결과
 */
function performSearch(searchIndex, searchParams) {
    const {
        query = '',
        filters = {},
        sort = 'newest',
        page = 1,
        pageSize = 20
    } = searchParams;

    try {
        let results;

        // 키워드 검색 수행
        if (query.trim()) {
            results = performKeywordSearch(searchIndex, query);
        } else {
            // 쿼리가 없으면 모든 기사 반환
            results = Object.keys(searchIndex.articles);
        }

        // 필터 적용
        results = applyFilters(results, searchIndex, filters);

        // 정렬
        results = sortResults(results, searchIndex, sort, query);

        // 페이지네이션
        const totalCount = results.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedResults = results.slice(startIndex, endIndex);

        return {
            articleSlugs: paginatedResults,
            totalCount,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };

    } catch (error) {
        console.error('검색 수행 중 오류:', error);
        return {
            articleSlugs: [],
            totalCount: 0,
            currentPage: page,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
            error: error.message
        };
    }
}

/**
 * 검색어 하이라이트를 위한 텍스트 처리
 * @param {string} text - 원본 텍스트
 * @param {string} query - 검색 쿼리
 * @param {string} highlightClass - 하이라이트 CSS 클래스 (기본값: 'highlight')
 * @returns {string} 하이라이트가 적용된 텍스트
 */
function highlightSearchTerms(text, query, highlightClass = 'highlight') {
    if (!text || !query) return text;

    const queryTerms = normalizeAndTokenize(query);
    if (queryTerms.length === 0) return text;

    let highlightedText = text;

    queryTerms.forEach(term => {
        // 대소문자 구분 없이 매칭하되 원본 텍스트의 대소문자는 유지
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="${highlightClass}">$1</span>`);
    });

    return highlightedText;
}

export {
    calculateRelevanceScore,
    performKeywordSearch,
    applyDateRangeFilter,
    applySourceFilter,
    applyAIModelFilter,
    applyAuthorFilter,
    applyFilters,
    sortResults,
    performSearch,
    highlightSearchTerms
};
