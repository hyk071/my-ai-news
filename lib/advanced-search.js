/**
 * 고급 검색 기능
 * 부분 매칭, 퍼지 검색, 동의어 처리, 고급 관련성 점수 계산
 */

const { normalizeAndTokenize } = require('./search-index');

/**
 * 레벤슈타인 거리 계산 (문자열 유사도)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} 레벤슈타인 거리
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 문자열 유사도 계산 (0-1 사이 값)
 * @param {string} str1 - 첫 번째 문자열
 * @param {string} str2 - 두 번째 문자열
 * @returns {number} 유사도 (0: 완전히 다름, 1: 완전히 같음)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * 퍼지 매칭 (유사한 단어 찾기)
 * @param {string} term - 검색 용어
 * @param {string[]} vocabulary - 검색할 어휘 목록
 * @param {number} threshold - 유사도 임계값 (기본값: 0.7)
 * @returns {string[]} 유사한 용어들
 */
function fuzzyMatch(term, vocabulary, threshold = 0.7) {
  if (!term || !vocabulary) return [];
  
  const matches = [];
  
  vocabulary.forEach(word => {
    const similarity = calculateSimilarity(term.toLowerCase(), word.toLowerCase());
    if (similarity >= threshold) {
      matches.push({
        word,
        similarity
      });
    }
  });
  
  // 유사도 순으로 정렬
  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .map(match => match.word);
}

/**
 * 동의어 사전 (확장 가능)
 */
const synonyms = {
  'ai': ['인공지능', '머신러닝', '딥러닝', 'artificial intelligence', 'machine learning'],
  '인공지능': ['ai', 'artificial intelligence', '머신러닝', '딥러닝'],
  '기술': ['테크', 'tech', 'technology', '테크놀로지'],
  '개발': ['development', '개발자', 'developer', '프로그래밍'],
  '시장': ['market', '마켓', '경제', 'economy'],
  '기업': ['회사', 'company', '비즈니스', 'business'],
  '정부': ['government', '행정', '정책', 'policy'],
  '연구': ['research', '조사', 'study', '분석'],
  '투자': ['investment', '자금', 'funding', '펀딩'],
  '성장': ['growth', '발전', 'development', '확장']
};

/**
 * 동의어 확장
 * @param {string[]} terms - 원본 검색 용어들
 * @returns {string[]} 동의어가 포함된 확장된 용어들
 */
function expandWithSynonyms(terms) {
  const expandedTerms = new Set(terms);
  
  terms.forEach(term => {
    const termLower = term.toLowerCase();
    if (synonyms[termLower]) {
      synonyms[termLower].forEach(synonym => {
        expandedTerms.add(synonym);
      });
    }
  });
  
  return Array.from(expandedTerms);
}

/**
 * 고급 키워드 검색 (퍼지 매칭 + 동의어 포함)
 * @param {Object} searchIndex - 검색 인덱스
 * @param {string} query - 검색 쿼리
 * @param {Object} options - 검색 옵션
 * @returns {Object} 검색 결과와 메타데이터
 */
function performAdvancedKeywordSearch(searchIndex, query, options = {}) {
  const {
    fuzzyThreshold = 0.8,
    includeSynonyms = true,
    maxFuzzyMatches = 5
  } = options;
  
  if (!query || !searchIndex.termIndex) {
    return { matches: [], expandedTerms: [], fuzzyMatches: [] };
  }
  
  let queryTerms = normalizeAndTokenize(query);
  if (queryTerms.length === 0) {
    return { matches: [], expandedTerms: [], fuzzyMatches: [] };
  }
  
  // 동의어 확장
  let expandedTerms = queryTerms;
  if (includeSynonyms) {
    expandedTerms = expandWithSynonyms(queryTerms);
  }
  
  // 정확한 매칭 먼저 수행
  const exactMatches = new Set();
  expandedTerms.forEach(term => {
    const matches = searchIndex.termIndex[term] || [];
    matches.forEach(slug => exactMatches.add(slug));
  });
  
  // 퍼지 매칭 수행
  const vocabulary = Object.keys(searchIndex.termIndex);
  const fuzzyMatches = new Set();
  const fuzzyTermsUsed = [];
  
  queryTerms.forEach(term => {
    const similarTerms = fuzzyMatch(term, vocabulary, fuzzyThreshold)
      .slice(0, maxFuzzyMatches);
    
    similarTerms.forEach(similarTerm => {
      if (!expandedTerms.includes(similarTerm)) {
        fuzzyTermsUsed.push({ original: term, fuzzy: similarTerm });
        const matches = searchIndex.termIndex[similarTerm] || [];
        matches.forEach(slug => fuzzyMatches.add(slug));
      }
    });
  });
  
  // 결과 합치기 (정확한 매칭이 우선)
  const allMatches = [...exactMatches, ...fuzzyMatches];
  
  return {
    matches: allMatches,
    expandedTerms,
    fuzzyMatches: fuzzyTermsUsed,
    exactMatchCount: exactMatches.size,
    fuzzyMatchCount: fuzzyMatches.size
  };
}

/**
 * 고급 관련성 점수 계산
 * @param {Object} article - 기사 객체
 * @param {string} query - 검색 쿼리
 * @param {Object} searchMetadata - 검색 메타데이터
 * @returns {number} 고급 관련성 점수
 */
function calculateAdvancedRelevanceScore(article, query, searchMetadata = {}) {
  if (!query || !article) return 0;
  
  const queryTerms = normalizeAndTokenize(query);
  if (queryTerms.length === 0) return 0;
  
  let score = 0;
  const titleLower = (article.title || '').toLowerCase();
  const contentLower = (article.content || '').toLowerCase();
  const keywords = article.keywords || [];
  
  queryTerms.forEach(term => {
    let termScore = 0;
    
    // 1. 제목에서의 매칭 (가중치: 15)
    if (titleLower.includes(term)) {
      termScore += 15;
      
      // 제목 시작 부분에 있으면 추가 점수
      if (titleLower.startsWith(term)) {
        termScore += 5;
      }
      
      // 제목에서 정확히 일치하면 추가 점수
      if (titleLower === term) {
        termScore += 10;
      }
    }
    
    // 2. 키워드에서의 매칭 (가중치: 8)
    const keywordMatch = keywords.some(keyword => 
      keyword.toLowerCase().includes(term)
    );
    if (keywordMatch) {
      termScore += 8;
      
      // 정확한 키워드 매칭시 추가 점수
      const exactKeywordMatch = keywords.some(keyword => 
        keyword.toLowerCase() === term
      );
      if (exactKeywordMatch) {
        termScore += 4;
      }
    }
    
    // 3. 본문에서의 매칭 (가중치: 2)
    if (contentLower.includes(term)) {
      termScore += 2;
      
      // 본문에서 여러 번 등장하는 경우 추가 점수 (최대 6점)
      const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      termScore += Math.min(matches - 1, 3) * 1;
      
      // 본문 앞부분에 등장하면 추가 점수
      const firstIndex = contentLower.indexOf(term);
      if (firstIndex >= 0 && firstIndex < contentLower.length * 0.1) {
        termScore += 2;
      }
    }
    
    score += termScore;
  });
  
  // 4. 쿼리 용어 매칭 비율 보너스
  const matchedTerms = queryTerms.filter(term => {
    return titleLower.includes(term) || 
           contentLower.includes(term) || 
           keywords.some(keyword => keyword.toLowerCase().includes(term));
  });
  
  const matchRatio = matchedTerms.length / queryTerms.length;
  score *= (0.5 + matchRatio * 0.5); // 50% 기본 + 50% 매칭 비율
  
  // 5. 기사 품질 지표 (단어 수, 키워드 수 등)
  const wordCount = article.wordCount || 0;
  const keywordCount = keywords.length;
  
  // 적절한 길이의 기사에 보너스 (500-2000 단어)
  if (wordCount >= 500 && wordCount <= 2000) {
    score *= 1.1;
  }
  
  // 키워드가 많은 기사에 소폭 보너스
  if (keywordCount >= 5) {
    score *= 1.05;
  }
  
  // 6. 최신성 보너스 (최근 30일 내 기사)
  if (article.date) {
    const articleDate = new Date(article.date);
    const now = new Date();
    const daysDiff = (now - articleDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 30) {
      score *= 1.1;
    } else if (daysDiff <= 90) {
      score *= 1.05;
    }
  }
  
  return Math.round(score * 100) / 100; // 소수점 2자리로 반올림
}

/**
 * 검색 제안 생성 (오타 교정, 관련 검색어)
 * @param {string} query - 원본 검색 쿼리
 * @param {Object} searchIndex - 검색 인덱스
 * @param {number} maxSuggestions - 최대 제안 수
 * @returns {Object} 검색 제안
 */
function generateSearchSuggestions(query, searchIndex, maxSuggestions = 5) {
  if (!query || !searchIndex.termIndex) {
    return { corrections: [], related: [] };
  }
  
  const queryTerms = normalizeAndTokenize(query);
  const vocabulary = Object.keys(searchIndex.termIndex);
  
  const corrections = [];
  const related = [];
  
  queryTerms.forEach(term => {
    // 오타 교정 제안
    const similarTerms = fuzzyMatch(term, vocabulary, 0.6)
      .filter(similarTerm => similarTerm !== term)
      .slice(0, 3);
    
    if (similarTerms.length > 0) {
      corrections.push({
        original: term,
        suggestions: similarTerms
      });
    }
    
    // 관련 검색어 (동의어)
    const termLower = term.toLowerCase();
    if (synonyms[termLower]) {
      related.push(...synonyms[termLower].slice(0, 3));
    }
  });
  
  return {
    corrections: corrections.slice(0, maxSuggestions),
    related: [...new Set(related)].slice(0, maxSuggestions)
  };
}

module.exports = {
  levenshteinDistance,
  calculateSimilarity,
  fuzzyMatch,
  expandWithSynonyms,
  performAdvancedKeywordSearch,
  calculateAdvancedRelevanceScore,
  generateSearchSuggestions
};