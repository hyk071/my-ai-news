#!/usr/bin/env node

/**
 * 기사 제목 수정 스크립트
 * 내용에 맞지 않는 제목들을 내용 기반으로 적절하게 수정합니다.
 */

import fs from 'fs/promises';
import path from 'path';

async function fixArticleTitles() {
    console.log('📝 기사 제목 수정 시작...\n');

    try {
        // 기사 데이터 읽기
        const articlesPath = 'data/articles.json';
        const articlesData = await fs.readFile(articlesPath, 'utf-8');
        const articles = JSON.parse(articlesData);

        console.log(`총 ${articles.length}개 기사 발견`);

        // 제목 수정 규칙
        const titleFixes = [
            {
                // 한국 AI 기술 관련 기사들
                condition: (article) => 
                    article.contentHTML.includes('한국의 인공지능') || 
                    article.contentHTML.includes('AI 기술') ||
                    article.contentHTML.includes('네이버와 카카오'),
                newTitle: (article, index) => {
                    if (article.contentHTML.includes('3조 원')) {
                        return '한국 AI 기술, 3조원 R&D 투자로 글로벌 경쟁력 확보';
                    } else if (article.contentHTML.includes('네이버') && article.contentHTML.includes('일본')) {
                        return '네이버·카카오 AI 번역서비스, 일본 시장 성공적 진출';
                    } else {
                        return `한국 AI 기술, 글로벌 시장에서 주목받으며 ICT 산업 성장 견인`;
                    }
                }
            },
            {
                // 특검 관련 기사
                condition: (article) => 
                    article.contentHTML.includes('김건희') || 
                    article.contentHTML.includes('특검') ||
                    article.contentHTML.includes('내란특검'),
                newTitle: (article, index) => 
                    '김건희 특검 vs 내란특검, 윤석열 정부 특검 정국 어디까지 왔나'
            },
            {
                // 생성형 AI 역사 관련 기사
                condition: (article) => 
                    article.contentHTML.includes('생성형 AI') || 
                    article.contentHTML.includes('GPT') ||
                    article.contentHTML.includes('트랜스포머'),
                newTitle: (article, index) => 
                    '생성형 AI 발전사: GPT 중심으로 본 역사와 현주소'
            },
            {
                // 주식시장 관련 기사
                condition: (article) => 
                    article.contentHTML.includes('코스피') || 
                    article.contentHTML.includes('주식시장') ||
                    article.contentHTML.includes('2,480포인트'),
                newTitle: (article, index) => 
                    '코스피 2,480선 등락 반복, 글로벌 금리와 정책 방향성 사이 갈등'
            }
        ];

        let fixedCount = 0;

        // 각 기사의 제목 수정
        articles.forEach((article, index) => {
            // 현재 제목이 "개요", "리드·넛그래프" 등 구조적 제목인 경우만 수정
            if (article.title === '개요' || 
                article.title === '리드·넛그래프' || 
                article.title.length < 10) {
                
                // 적절한 수정 규칙 찾기
                for (const fix of titleFixes) {
                    if (fix.condition(article)) {
                        const newTitle = fix.newTitle(article, index);
                        
                        console.log(`📰 기사 ${index + 1}: "${article.title}" → "${newTitle}"`);
                        
                        article.title = newTitle;
                        if (article.seo) {
                            article.seo.title = newTitle;
                        }
                        
                        fixedCount++;
                        break;
                    }
                }
                
                // 규칙에 맞지 않는 경우 기본 제목 생성
                if (article.title === '개요' || article.title === '리드·넛그래프') {
                    // HTML에서 첫 번째 h1 태그 추출 시도
                    const h1Match = article.contentHTML.match(/<h1[^>]*>(.*?)<\/h1>/);
                    if (h1Match && h1Match[1]) {
                        const newTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
                        if (newTitle.length > 10) {
                            console.log(`📰 기사 ${index + 1}: "${article.title}" → "${newTitle}" (H1에서 추출)`);
                            article.title = newTitle;
                            if (article.seo) {
                                article.seo.title = newTitle;
                            }
                            fixedCount++;
                        }
                    }
                }
            }
        });

        // 수정된 데이터 저장
        await fs.writeFile(articlesPath, JSON.stringify(articles, null, 2), 'utf-8');

        console.log(`\n✅ 총 ${fixedCount}개 기사 제목 수정 완료!`);
        console.log(`📁 수정된 파일: ${articlesPath}`);

    } catch (error) {
        console.error('❌ 제목 수정 중 오류 발생:', error);
        process.exit(1);
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    fixArticleTitles();
}

export { fixArticleTitles };