/**
 * 검색 메타데이터 API 엔드포인트
 * GET /api/search/metadata
 * 
 * 검색 필터에 사용할 수 있는 메타데이터 정보를 반환합니다.
 * - 사용 가능한 작성자 목록
 * - 사용 가능한 AI 모델 목록  
 * - 기사 날짜 범위
 * - 전체 기사 통계
 */

import { loadOrCreateSearchIndex } from '../../../lib/search-index.js';
import { promises as fs } from 'fs';
import path from 'path';

// 메타데이터 캐시
let metadataCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

/**
 * 상세 메타데이터 생성
 */
async function generateDetailedMetadata() {
  try {
    // 검색 인덱스 로드
    const searchIndex = await loadOrCreateSearchIndex();
    
    // 원본 기사 데이터 로드
    const articlesPath = path.join(process.cwd(), 'data', 'articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const allArticles = JSON.parse(articlesData);
    
    // 통계 계산
    const totalArticles = allArticles.length;
    const totalWords = Object.values(searchIndex.articles)
      .reduce((sum, article) => sum + (article.wordCount || 0), 0);
    
    // 작성자별 통계
    const authorStats = {};
    allArticles.forEach(article => {
      if (article.author) {
        if (!authorStats[article.author]) {
          authorStats[article.author] = { count: 0, articles: [] };
        }
        authorStats[article.author].count++;
        authorStats[article.author].articles.push({
          title: article.title,
          slug: article.slug,
          date: article.date || article.generatedAt
        });
      }
    });
    
    // AI 모델별 통계
    const modelStats = {};
    allArticles.forEach(article => {
      if (article.source) {
        if (!modelStats[article.source]) {
          modelStats[article.source] = { count: 0, articles: [] };
        }
        modelStats[article.source].count++;
        modelStats[article.source].articles.push({
          title: article.title,
          slug: article.slug,
          date: article.date || article.generatedAt
        });
      }
    });
    
    // 월별 통계
    const monthlyStats = {};
    allArticles.forEach(article => {
      const date = new Date(article.date || article.generatedAt);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = 0;
        }
        monthlyStats[monthKey]++;
      }
    });
    
    // 인기 키워드 (상위 20개)
    const keywordFrequency = {};
    Object.values(searchIndex.articles).forEach(article => {
      if (article.keywords) {
        article.keywords.forEach(keyword => {
          keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
        });
      }
    });
    
    const popularKeywords = Object.entries(keywordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
    
    return {
      basic: searchIndex.metadata,
      statistics: {
        totalArticles,
        totalWords,
        averageWordsPerArticle: totalArticles > 0 ? Math.round(totalWords / totalArticles) : 0,
        totalAuthors: searchIndex.metadata.authors.length,
        totalModels: searchIndex.metadata.sources.length,
        totalKeywords: Object.keys(searchIndex.termIndex).length
      },
      authors: Object.entries(authorStats)
        .map(([name, stats]) => ({
          name,
          articleCount: stats.count,
          recentArticles: stats.articles
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3)
        }))
        .sort((a, b) => b.articleCount - a.articleCount),
      models: Object.entries(modelStats)
        .map(([name, stats]) => ({
          name,
          articleCount: stats.count,
          recentArticles: stats.articles
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3)
        }))
        .sort((a, b) => b.articleCount - a.articleCount),
      monthlyStats: Object.entries(monthlyStats)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      popularKeywords,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    throw error;
  }
}

/**
 * 캐시된 메타데이터 반환
 */
async function getCachedMetadata() {
  const now = Date.now();
  
  // 캐시가 유효한 경우 반환
  if (metadataCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return metadataCache;
  }
  
  // 새로운 메타데이터 생성
  metadataCache = await generateDetailedMetadata();
  cacheTimestamp = now;
  
  return metadataCache;
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
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'GET 메서드만 지원됩니다.',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  try {
    // 상세 정보 요청 여부 확인
    const detailed = req.query.detailed === 'true';
    
    if (detailed) {
      // 상세 메타데이터 반환
      const metadata = await getCachedMetadata();
      res.status(200).json(metadata);
    } else {
      // 기본 메타데이터만 반환
      const searchIndex = await loadOrCreateSearchIndex();
      res.status(200).json({
        authors: searchIndex.metadata.authors,
        models: searchIndex.metadata.sources,
        dateRange: searchIndex.metadata.dateRange,
        totalArticles: Object.keys(searchIndex.articles).length,
        lastUpdated: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('메타데이터 API 오류:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '메타데이터 로드 중 오류가 발생했습니다.',
        timestamp: new Date().toISOString()
      }
    });
  }
}
