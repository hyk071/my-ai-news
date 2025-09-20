/**
 * 검색 인덱스 생성 및 관리 유틸리티
 * HTML 태그 제거, 텍스트 정규화, 키워드 추출, 역색인 구조 구현
 */

/**
 * HTML 태그를 제거하고 순수 텍스트를 반환
 * @param {string} html - HTML 문자열
 * @returns {string} 태그가 제거된 순수 텍스트
 */
function stripHtmlTags(html) {
  if (!html) return '';
  
  // HTML 태그 제거
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // HTML 엔티티 디코딩
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  
  text = text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entityMap[entity] || entity;
  });
  
  // 연속된 공백을 하나로 통합
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * 텍스트를 정규화하고 토큰화
 * @param {string} text - 정규화할 텍스트
 * @returns {string[]} 정규화된 토큰 배열
 */
function normalizeAndTokenize(text) {
  if (!text) return [];
  
  // 소문자 변환
  let normalized = text.toLowerCase();
  
  // 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
  normalized = normalized.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ');
  
  // 토큰화 (공백 기준 분리)
  const tokens = normalized.split(/\s+/).filter(token => token.length > 0);
  
  // 불용어 제거 (한국어 + 영어 기본 불용어)
  const stopWords = new Set([
    // 한국어 불용어
    '이', '그', '저', '것', '들', '의', '가', '을', '를', '에', '와', '과', '도', '는', '은', '이다', '있다', '없다',
    '하다', '되다', '같다', '다른', '새로운', '많은', '작은', '큰', '좋은', '나쁜', '첫', '마지막', '전체', '일부',
    '그리고', '또는', '하지만', '그러나', '따라서', '그래서', '왜냐하면', '만약', '비록', '아직', '이미', '항상',
    '때문에', '위해', '통해', '대해', '관해', '에서', '으로', '부터', '까지', '동안', '이후', '이전', '중에',
    // 영어 불용어
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
    'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);
  
  // 불용어 제거 및 최소 길이 필터링 (2글자 이상)
  return tokens.filter(token => !stopWords.has(token) && token.length >= 2);
}

/**
 * 텍스트에서 키워드 추출
 * @param {string} text - 키워드를 추출할 텍스트
 * @param {number} maxKeywords - 최대 키워드 수 (기본값: 10)
 * @returns {string[]} 추출된 키워드 배열
 */
function extractKeywords(text, maxKeywords = 10) {
  const tokens = normalizeAndTokenize(text);
  
  // 토큰 빈도 계산
  const frequency = {};
  tokens.forEach(token => {
    frequency[token] = (frequency[token] || 0) + 1;
  });
  
  // 빈도순으로 정렬하여 상위 키워드 추출
  const sortedKeywords = Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([keyword]) => keyword);
  
  return sortedKeywords;
}

/**
 * 단어 수 계산
 * @param {string} text - 단어 수를 계산할 텍스트
 * @returns {number} 단어 수
 */
function countWords(text) {
  if (!text) return 0;
  const tokens = normalizeAndTokenize(text);
  return tokens.length;
}

/**
 * 예상 읽기 시간 계산 (분 단위)
 * @param {number} wordCount - 단어 수
 * @param {number} wordsPerMinute - 분당 읽기 단어 수 (기본값: 200)
 * @returns {number} 예상 읽기 시간 (분)
 */
function calculateReadingTime(wordCount, wordsPerMinute = 200) {
  if (wordCount <= 0) return 0;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * 기사 데이터를 검색 최적화된 형태로 변환
 * @param {Object} article - 원본 기사 객체
 * @returns {Object} 검색 최적화된 기사 객체
 */
function enhanceArticleForSearch(article) {
  if (!article) return null;
  
  // HTML 태그 제거하여 순수 텍스트 추출
  const searchableContent = stripHtmlTags(article.contentHTML || '');
  
  // 제목과 내용을 합친 전체 텍스트
  const fullText = `${article.title || ''} ${searchableContent}`.trim();
  
  // 키워드 추출
  const keywords = extractKeywords(fullText);
  
  // 단어 수 계산
  const wordCount = countWords(searchableContent);
  
  // 읽기 시간 계산
  const readingTime = calculateReadingTime(wordCount);
  
  return {
    ...article,
    searchableContent,
    keywords,
    wordCount,
    readingTime
  };
}

/**
 * 역색인(Inverted Index) 생성
 * @param {Object[]} articles - 기사 배열
 * @returns {Object} 역색인 객체
 */
function createInvertedIndex(articles) {
  const termIndex = {};
  
  articles.forEach(article => {
    if (!article.slug) return;
    
    // 제목, 내용, 키워드에서 모든 토큰 추출
    const titleTokens = normalizeAndTokenize(article.title || '');
    const contentTokens = normalizeAndTokenize(article.searchableContent || '');
    const keywordTokens = (article.keywords || []).flatMap(keyword => normalizeAndTokenize(keyword));
    
    // 모든 토큰을 합치고 중복 제거
    const allTokens = [...new Set([...titleTokens, ...contentTokens, ...keywordTokens])];
    
    // 각 토큰에 대해 역색인 업데이트
    allTokens.forEach(token => {
      if (!termIndex[token]) {
        termIndex[token] = [];
      }
      if (!termIndex[token].includes(article.slug)) {
        termIndex[token].push(article.slug);
      }
    });
  });
  
  return termIndex;
}

/**
 * 검색 인덱스 생성
 * @param {Object[]} articles - 원본 기사 배열
 * @returns {Object} 완전한 검색 인덱스
 */
function createSearchIndex(articles) {
  if (!Array.isArray(articles)) {
    return {
      articles: {},
      termIndex: {},
      metadata: {
        authors: [],
        sources: [],
        dateRange: { earliest: null, latest: null }
      }
    };
  }
  
  // 기사들을 검색 최적화된 형태로 변환
  const enhancedArticles = articles
    .map(enhanceArticleForSearch)
    .filter(article => article && article.slug);
  
  // 기사 객체를 slug를 키로 하는 맵으로 변환
  const articlesMap = {};
  enhancedArticles.forEach(article => {
    articlesMap[article.slug] = {
      title: article.title,
      content: article.searchableContent,
      author: article.author,
      source: article.source,
      date: article.date || article.generatedAt,
      keywords: article.keywords,
      wordCount: article.wordCount,
      readingTime: article.readingTime
    };
  });
  
  // 역색인 생성
  const termIndex = createInvertedIndex(enhancedArticles);
  
  // 메타데이터 생성
  const authors = [...new Set(enhancedArticles.map(a => a.author).filter(Boolean))];
  const sources = [...new Set(enhancedArticles.map(a => a.source).filter(Boolean))];
  
  // 날짜 범위 계산
  const dates = enhancedArticles
    .map(a => a.date || a.generatedAt)
    .filter(Boolean)
    .map(date => new Date(date))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a - b);
  
  const dateRange = {
    earliest: dates.length > 0 ? dates[0].toISOString() : null,
    latest: dates.length > 0 ? dates[dates.length - 1].toISOString() : null
  };
  
  return {
    articles: articlesMap,
    termIndex,
    metadata: {
      authors: authors.sort(),
      sources: sources.sort(),
      dateRange
    }
  };
}

/**
 * 검색 인덱스를 파일에서 로드하거나 생성
 * @param {string} articlesPath - articles.json 파일 경로
 * @returns {Promise<Object>} 검색 인덱스
 */
async function loadOrCreateSearchIndex(articlesPath = 'data/articles.json') {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // articles.json 파일 읽기
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // 검색 인덱스 생성
    const searchIndex = createSearchIndex(articles);
    
    return searchIndex;
  } catch (error) {
    console.error('검색 인덱스 생성 중 오류:', error);
    return createSearchIndex([]); // 빈 인덱스 반환
  }
}

module.exports = {
  stripHtmlTags,
  normalizeAndTokenize,
  extractKeywords,
  countWords,
  calculateReadingTime,
  enhanceArticleForSearch,
  createInvertedIndex,
  createSearchIndex,
  loadOrCreateSearchIndex
};