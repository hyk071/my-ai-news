#!/usr/bin/env node

/**
 * 이전에 개선된 제목들을 다시 적용하는 스크립트
 */

import { readFile, writeFile } from 'fs/promises';

class TitleApplier {
    constructor() {
        this.articlesPath = 'data/articles.json';
        // 이전 세션에서 개선된 제목 매핑
        this.titleMappings = {
            "AI 혁신의 새로운 전환점: 생성형 AI가 바꾸는 미래": "생성형 AI가 열어가는 혁신의 시대: 산업 전반의 패러다임 변화",
            "디지털 트랜스포메이션의 핵심: AI 기술이 이끄는 변화": "AI가 주도하는 디지털 혁명: 기업들의 생존 전략은?",
            "머신러닝과 딥러닝: 차세대 AI 기술의 발전 방향": "머신러닝에서 딥러닝까지: AI 기술 진화의 핵심 동력",
            "클라우드 컴퓨팅과 AI의 융합: 새로운 비즈니스 모델": "클라우드 + AI = 무한 가능성, 새로운 비즈니스 기회 창출",
            "데이터 사이언스의 미래: AI가 만드는 인사이트": "빅데이터 시대의 핵심, AI가 발견하는 숨겨진 인사이트",
            "사이버 보안의 새로운 패러다임: AI 기반 보안 솔루션": "AI vs 해커: 차세대 사이버 보안 전쟁의 승부수",
            "스마트 시티와 IoT: 연결된 세상의 미래": "모든 것이 연결되는 스마트 시티, IoT가 그리는 미래 도시",
            "블록체인 기술의 진화: 탈중앙화된 미래": "블록체인 혁명 2.0: 탈중앙화가 바꾸는 디지털 경제",
            "양자 컴퓨팅의 혁명: 컴퓨팅 패러다임의 변화": "양자 컴퓨터 시대 개막: 기존 컴퓨팅의 한계를 뛰어넘다",
            "메타버스와 가상현실: 디지털 세상의 새로운 경험": "메타버스 열풍 속 가상현실, 현실과 디지털의 경계가 사라진다"
        };
    }

    async applyImprovedTitles() {
        console.log('📝 개선된 제목 적용 시작...\n');

        try {
            const articlesData = await readFile(this.articlesPath, 'utf-8');
            const articles = JSON.parse(articlesData);

            let appliedCount = 0;

            for (let i = 0; i < articles.length; i++) {
                const article = articles[i];
                const currentTitle = article.title;
                
                // 제목 매핑에서 개선된 제목 찾기
                const improvedTitle = this.titleMappings[currentTitle];
                
                if (improvedTitle) {
                    console.log(`[${i + 1}] 제목 개선 적용:`);
                    console.log(`  기존: "${currentTitle}"`);
                    console.log(`  개선: "${improvedTitle}"`);
                    
                    // 제목 업데이트
                    article.title = improvedTitle;
                    
                    // SEO 제목도 업데이트
                    if (article.seo && article.seo.title) {
                        article.seo.title = improvedTitle;
                    }
                    
                    appliedCount++;
                    console.log(`  ✅ 적용 완료\n`);
                } else {
                    // 부분 매칭 시도 (키워드 기반)
                    const partialMatch = this.findPartialMatch(currentTitle);
                    if (partialMatch) {
                        console.log(`[${i + 1}] 부분 매칭으로 제목 개선:`);
                        console.log(`  기존: "${currentTitle}"`);
                        console.log(`  개선: "${partialMatch}"`);
                        
                        article.title = partialMatch;
                        if (article.seo && article.seo.title) {
                            article.seo.title = partialMatch;
                        }
                        
                        appliedCount++;
                        console.log(`  ✅ 적용 완료\n`);
                    }
                }
            }

            // 수정된 데이터 저장
            await writeFile(this.articlesPath, JSON.stringify(articles, null, 2));
            
            console.log('=' .repeat(60));
            console.log(`🎉 제목 개선 적용 완료!`);
            console.log(`총 ${articles.length}개 기사 중 ${appliedCount}개 제목이 개선되었습니다.`);
            console.log('=' .repeat(60));

        } catch (error) {
            console.error('❌ 제목 적용 중 오류 발생:', error);
            throw error;
        }
    }

    /**
     * 부분 매칭으로 개선된 제목 찾기
     */
    findPartialMatch(title) {
        // AI 관련 키워드 매칭
        if (title.includes('AI') || title.includes('인공지능')) {
            if (title.includes('생성형') || title.includes('GPT') || title.includes('ChatGPT')) {
                return "생성형 AI가 열어가는 혁신의 시대: 산업 전반의 패러다임 변화";
            }
            if (title.includes('디지털') || title.includes('트랜스포메이션')) {
                return "AI가 주도하는 디지털 혁명: 기업들의 생존 전략은?";
            }
            if (title.includes('머신러닝') || title.includes('딥러닝')) {
                return "머신러닝에서 딥러닝까지: AI 기술 진화의 핵심 동력";
            }
            if (title.includes('데이터') || title.includes('사이언스')) {
                return "빅데이터 시대의 핵심, AI가 발견하는 숨겨진 인사이트";
            }
            if (title.includes('보안') || title.includes('사이버')) {
                return "AI vs 해커: 차세대 사이버 보안 전쟁의 승부수";
            }
        }
        
        // 클라우드 관련
        if (title.includes('클라우드')) {
            return "클라우드 + AI = 무한 가능성, 새로운 비즈니스 기회 창출";
        }
        
        // IoT/스마트시티 관련
        if (title.includes('IoT') || title.includes('스마트') || title.includes('시티')) {
            return "모든 것이 연결되는 스마트 시티, IoT가 그리는 미래 도시";
        }
        
        // 블록체인 관련
        if (title.includes('블록체인')) {
            return "블록체인 혁명 2.0: 탈중앙화가 바꾸는 디지털 경제";
        }
        
        // 양자컴퓨팅 관련
        if (title.includes('양자')) {
            return "양자 컴퓨터 시대 개막: 기존 컴퓨팅의 한계를 뛰어넘다";
        }
        
        // 메타버스/VR 관련
        if (title.includes('메타버스') || title.includes('가상현실') || title.includes('VR')) {
            return "메타버스 열풍 속 가상현실, 현실과 디지털의 경계가 사라진다";
        }
        
        return null;
    }

    /**
     * 현재 제목들 확인
     */
    async checkCurrentTitles() {
        try {
            const articlesData = await readFile(this.articlesPath, 'utf-8');
            const articles = JSON.parse(articlesData);
            
            console.log('📋 현재 기사 제목들:\n');
            articles.forEach((article, index) => {
                console.log(`${index + 1}. "${article.title}"`);
            });
            
            console.log(`\n총 ${articles.length}개 기사`);
            
        } catch (error) {
            console.error('제목 확인 중 오류:', error);
        }
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const applier = new TitleApplier();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--check')) {
        // 현재 제목들만 확인
        applier.checkCurrentTitles();
    } else {
        // 개선된 제목 적용
        applier.applyImprovedTitles()
            .then(() => {
                console.log('\n✨ 제목 개선 적용 작업 완료!');
                process.exit(0);
            })
            .catch((error) => {
                console.error('오류:', error.message);
                process.exit(1);
            });
    }
}

export { TitleApplier };