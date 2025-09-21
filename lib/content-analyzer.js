/**
 * ContentAnalyzer - 기사 내용 분석 클래스
 * 기사 내용에서 헤딩, 키워드, 통계 등을 추출하여 제목 생성에 필요한 정보를 제공
 */

import { getCacheManager } from './cache-manager.js';
import { getMemoryOptimizer } from './memory-optimizer.js';

class ContentAnalyzer {
  constructor(content, tags = [], subject = "", tone = "객관적") {
    this.content = content || "";
    this.tags = Array.isArray(tags) ? tags : [];
    this.subject = subject || "";
    this.tone = tone || "객관적";
    this.analysis = null;
    this.cacheManager = getCacheManager();
    this.memoryOptimizer = getMemoryOptimizer();
  }

  /**
   * 전체 콘텐츠 분석 수행 (캐싱 지원)
   * @returns {Object} 분석 결과 객체
   */
  analyze() {
    if (this.analysis) {
      return this.analysis;
    }

    // 캐시에서 분석 결과 조회 시도
    const cachedAnalysis = this.cacheManager.getCachedContentAnalysis(
      this.content, this.tags, this.subject, this.tone
    );

    if (cachedAnalysis) {
      this.analysis = cachedAnalysis;
      console.log('캐시된 콘텐츠 분석 결과 사용:', {
        contentLength: this.content.length,
        headings: cachedAnalysis.headings.length,
        keyPhrases: cachedAnalysis.keyPhrases.length
      });
      return this.analysis;
    }

    // 캐시 미스 - 새로운 분석 수행
    console.log('콘텐츠 분석 시작 (캐시 미스):', {
      contentLength: this.content.length,
      tags: this.tags,
      subject: this.subject,
      tone: this.tone
    });

    const startTime = Date.now();

    // 원본 분석 수행
    const rawAnalysis = {
      headings: this.extractHeadings(),
      keyPhrases: this.extractKeyPhrases(),
      firstParagraph: this.extractFirstParagraph(),
      statistics: this.extractStatistics(),
      entities: this.extractEntities(),
      sentiment: this.analyzeSentiment()
    };

    // 메모리 최적화 적용
    this.analysis = this.memoryOptimizer.optimizeAnalysisResult(rawAnalysis);

    const analysisTime = Date.now() - startTime;

    // 최적화된 분석 결과를 캐시에 저장
    this.cacheManager.cacheContentAnalysis(
      this.content, this.tags, this.subject, this.tone, this.analysis
    );

    console.log('콘텐츠 분석 완료 및 캐시 저장:', {
      analysisTime: `${analysisTime}ms`,
      headings: this.analysis.headings.length,
      keyPhrases: this.analysis.keyPhrases.length,
      statistics: this.analysis.statistics.length,
      entities: this.analysis.entities.length
    });

    return this.analysis;
  }

  /**
   * H1, H2, H3 태그에서 제목 후보 추출
   * @returns {Array} 헤딩 정보 배열
   */
  extractHeadings() {
    const headings = [];
    const lines = this.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // H1 제목 찾기 (# 제목)
      if (line.startsWith('# ') && !line.startsWith('##')) {
        const text = line.replace(/^#\s+/, '').trim();
        if (text && text.length > 5) {
          headings.push({
            level: 1,
            text: text,
            position: i,
            chars: [...text].length
          });
        }
      }
      
      // H2 제목 찾기 (## 제목)
      else if (line.startsWith('## ') && !line.startsWith('###')) {
        const text = line.replace(/^##\s+/, '').trim();
        if (text && text.length > 3) {
          headings.push({
            level: 2,
            text: text,
            position: i,
            chars: [...text].length
          });
        }
      }
      
      // H3 제목 찾기 (### 제목)
      else if (line.startsWith('### ')) {
        const text = line.replace(/^###\s+/, '').trim();
        if (text && text.length > 3) {
          headings.push({
            level: 3,
            text: text,
            position: i,
            chars: [...text].length
          });
        }
      }
    }

    console.log('헤딩 추출 완료:', headings.length, '개');
    return headings;
  }

  /**
   * 핵심 키워드와 구문 추출
   * @returns {Array} 키워드 정보 배열
   */
  extractKeyPhrases() {
    const keyPhrases = [];
    const text = this.content.toLowerCase();
    
    // 입력된 태그들의 빈도 계산
    this.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      const regex = new RegExp(tagLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = this.content.match(regex) || [];
      
      if (matches.length > 0) {
        keyPhrases.push({
          phrase: tag,
          frequency: matches.length,
          importance: Math.min(0.9, 0.3 + (matches.length * 0.1)),
          source: 'tag'
        });
      }
    });

    // 주제에서 키워드 추출
    if (this.subject) {
      const subjectWords = this.subject.split(/\s+/).filter(word => word.length > 2);
      subjectWords.forEach(word => {
        const wordLower = word.toLowerCase();
        const regex = new RegExp(wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = this.content.match(regex) || [];
        
        if (matches.length > 0) {
          keyPhrases.push({
            phrase: word,
            frequency: matches.length,
            importance: Math.min(0.8, 0.2 + (matches.length * 0.1)),
            source: 'subject'
          });
        }
      });
    }

    // 일반적인 기술/비즈니스 키워드 추출
    const commonKeywords = [
      'AI', '인공지능', '생성형', '반도체', '기술', '시장', '투자', '성장', '개발', '혁신',
      '디지털', '플랫폼', '서비스', '솔루션', '데이터', '분석', '전략', '경쟁', '협력', '파트너십'
    ];

    commonKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = this.content.match(regex) || [];
      
      if (matches.length > 0) {
        keyPhrases.push({
          phrase: keyword,
          frequency: matches.length,
          importance: Math.min(0.7, 0.1 + (matches.length * 0.05)),
          source: 'common'
        });
      }
    });

    // 중복 제거 및 정렬
    const uniquePhrases = [];
    const seen = new Set();
    
    keyPhrases.forEach(phrase => {
      const key = phrase.phrase.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniquePhrases.push(phrase);
      }
    });

    uniquePhrases.sort((a, b) => b.importance - a.importance);
    
    console.log('키워드 추출 완료:', uniquePhrases.length, '개');
    return uniquePhrases.slice(0, 10); // 상위 10개만 반환
  }

  /**
   * 첫 번째 의미있는 문단 추출
   * @returns {Object} 첫 문단 정보
   */
  extractFirstParagraph() {
    const lines = this.content.split('\n');
    let firstParagraph = null;
    let sentences = [];
    let keyPoints = [];

    // 첫 번째 의미있는 문단 찾기
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 헤딩, 메타데이터, 특수 문자로 시작하는 줄 제외
      if (trimmed && 
          !trimmed.startsWith('#') && 
          !trimmed.startsWith('(') && 
          !trimmed.startsWith('-') &&
          !trimmed.startsWith('*') &&
          !trimmed.includes('개요') && 
          !trimmed.includes('리드') && 
          !trimmed.includes('넛그래프') &&
          !trimmed.includes('By ') && 
          !trimmed.includes('년 ') && 
          !trimmed.includes('※') &&
          trimmed.length > 20) {
        
        firstParagraph = trimmed;
        break;
      }
    }

    if (firstParagraph) {
      // 문장 분리
      sentences = firstParagraph.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 5);
      
      // 핵심 포인트 추출 (첫 번째와 마지막 문장)
      if (sentences.length > 0) {
        keyPoints.push(sentences[0]);
        if (sentences.length > 1) {
          keyPoints.push(sentences[sentences.length - 1]);
        }
      }
    }

    const result = {
      text: firstParagraph || "",
      sentences: sentences,
      keyPoints: keyPoints,
      chars: firstParagraph ? [...firstParagraph].length : 0
    };

    console.log('첫 문단 추출 완료:', result.chars, '자');
    return result;
  }

  /**
   * 숫자, 퍼센트, 통계 데이터 추출
   * @returns {Array} 통계 정보 배열
   */
  extractStatistics() {
    const statistics = [];
    const lines = this.content.split('\n');

    // 퍼센트 패턴 찾기
    const percentRegex = /(\d+(?:\.\d+)?)\s*%/g;
    let match;
    
    while ((match = percentRegex.exec(this.content)) !== null) {
      const value = match[1] + '%';
      const context = this.getContextAroundMatch(match.index, 20);
      
      statistics.push({
        value: value,
        context: context,
        position: match.index,
        type: 'percentage'
      });
    }

    // 큰 숫자 패턴 찾기 (천 단위 이상)
    const numberRegex = /(\d{1,3}(?:,\d{3})+|\d{4,})/g;
    
    while ((match = numberRegex.exec(this.content)) !== null) {
      const value = match[1];
      const context = this.getContextAroundMatch(match.index, 20);
      
      statistics.push({
        value: value,
        context: context,
        position: match.index,
        type: 'number'
      });
    }

    // 배수 표현 찾기 (2배, 3배 등)
    const multipleRegex = /(\d+)\s*배/g;
    
    while ((match = multipleRegex.exec(this.content)) !== null) {
      const value = match[1] + '배';
      const context = this.getContextAroundMatch(match.index, 20);
      
      statistics.push({
        value: value,
        context: context,
        position: match.index,
        type: 'multiple'
      });
    }

    // 중복 제거 및 정렬
    const uniqueStats = [];
    const seen = new Set();
    
    statistics.forEach(stat => {
      const key = `${stat.value}-${stat.position}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueStats.push(stat);
      }
    });

    uniqueStats.sort((a, b) => a.position - b.position);
    
    console.log('통계 추출 완료:', uniqueStats.length, '개');
    return uniqueStats.slice(0, 5); // 상위 5개만 반환
  }

  /**
   * 특정 위치 주변의 컨텍스트 텍스트 추출
   * @param {number} position 위치
   * @param {number} radius 반경
   * @returns {string} 컨텍스트 텍스트
   */
  getContextAroundMatch(position, radius) {
    const start = Math.max(0, position - radius);
    const end = Math.min(this.content.length, position + radius);
    return this.content.slice(start, end).trim();
  }

  /**
   * 회사명, 인명, 지명 등 개체명 추출 (간단한 휴리스틱 방식)
   * @returns {Array} 개체명 정보 배열
   */
  extractEntities() {
    const entities = [];
    
    // 한국 대기업 패턴
    const koreanCompanies = [
      '삼성', '삼성전자', 'LG', 'LG전자', 'SK', 'SK하이닉스', '현대', '현대자동차',
      '네이버', '카카오', '쿠팡', '배달의민족', '토스', '크래프톤', '엔씨소프트'
    ];

    // 글로벌 기업 패턴
    const globalCompanies = [
      'Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Tesla', 'NVIDIA',
      'OpenAI', 'Anthropic', 'ChatGPT', 'GPT', 'Claude'
    ];

    // 지역명 패턴
    const locations = [
      '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
      '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
      '미국', '중국', '일본', '유럽', '아시아'
    ];

    const allPatterns = [
      ...koreanCompanies.map(name => ({ name, type: 'ORGANIZATION', subtype: 'korean' })),
      ...globalCompanies.map(name => ({ name, type: 'ORGANIZATION', subtype: 'global' })),
      ...locations.map(name => ({ name, type: 'LOCATION', subtype: 'region' }))
    ];

    allPatterns.forEach(pattern => {
      const regex = new RegExp(pattern.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = this.content.match(regex) || [];
      
      if (matches.length > 0) {
        entities.push({
          text: pattern.name,
          type: pattern.type,
          subtype: pattern.subtype,
          frequency: matches.length,
          confidence: 0.8 + (matches.length * 0.05)
        });
      }
    });

    // 빈도순 정렬
    entities.sort((a, b) => b.frequency - a.frequency);
    
    console.log('개체명 추출 완료:', entities.length, '개');
    return entities.slice(0, 8); // 상위 8개만 반환
  }

  /**
   * 기사의 전반적인 감정 및 톤 분석 (간단한 휴리스틱 방식)
   * @returns {Object} 감정 분석 결과
   */
  analyzeSentiment() {
    const positiveWords = [
      '성장', '증가', '상승', '개선', '발전', '혁신', '성공', '기회', '확대', '강화',
      '긍정', '우수', '뛰어난', '탁월', '효과적', '유망', '전망', '기대'
    ];

    const negativeWords = [
      '감소', '하락', '악화', '문제', '위기', '리스크', '우려', '부족', '어려움', '한계',
      '부정', '실패', '손실', '위험', '취약', '불안', '침체', '둔화'
    ];

    const neutralWords = [
      '분석', '검토', '조사', '연구', '발표', '보고', '계획', '전략', '방안', '정책'
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    const contentLower = this.content.toLowerCase();

    positiveWords.forEach(word => {
      const matches = contentLower.match(new RegExp(word, 'g')) || [];
      positiveCount += matches.length;
    });

    negativeWords.forEach(word => {
      const matches = contentLower.match(new RegExp(word, 'g')) || [];
      negativeCount += matches.length;
    });

    neutralWords.forEach(word => {
      const matches = contentLower.match(new RegExp(word, 'g')) || [];
      neutralCount += matches.length;
    });

    const total = positiveCount + negativeCount + neutralCount;
    let overall = 'neutral';
    let confidence = 0.5;

    if (total > 0) {
      const positiveRatio = positiveCount / total;
      const negativeRatio = negativeCount / total;

      if (positiveRatio > 0.4) {
        overall = 'positive';
        confidence = Math.min(0.9, 0.5 + positiveRatio);
      } else if (negativeRatio > 0.4) {
        overall = 'negative';
        confidence = Math.min(0.9, 0.5 + negativeRatio);
      }
    }

    const result = {
      overall: overall,
      confidence: confidence,
      aspects: {
        technology: positiveCount > negativeCount ? 'positive' : 'neutral',
        market: total > 5 ? (positiveCount > negativeCount ? 'positive' : 'negative') : 'neutral',
        future: positiveCount > 0 ? 'optimistic' : 'neutral'
      },
      wordCounts: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      }
    };

    console.log('감정 분석 완료:', result.overall, '(신뢰도:', result.confidence, ')');
    return result;
  }

  /**
   * 분석 결과 요약 정보 반환
   * @returns {Object} 요약 정보
   */
  getSummary() {
    if (!this.analysis) {
      this.analyze();
    }

    return {
      contentLength: this.content.length,
      headingsCount: this.analysis.headings.length,
      keyPhrasesCount: this.analysis.keyPhrases.length,
      statisticsCount: this.analysis.statistics.length,
      entitiesCount: this.analysis.entities.length,
      sentiment: this.analysis.sentiment.overall,
      hasFirstParagraph: !!this.analysis.firstParagraph.text,
      topKeywords: this.analysis.keyPhrases.slice(0, 3).map(kp => kp.phrase)
    };
  }
}

export { ContentAnalyzer };