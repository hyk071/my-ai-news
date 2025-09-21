#!/usr/bin/env node

/**
 * 현재 기사들의 제목을 더 매력적으로 개선하는 스크립트
 */

import { readFile, writeFile } from 'fs/promises';

class CurrentTitleImprover {
    constructor() {
        this.articlesPath = 'data/articles.json';
        this.improvements = new Map();
        this.setupImprovements();
    }

    setupImprovements() {
        // 현재 기사들의 제목 개선 매핑
        this.improvements.set(
            "한국 AI 기술, 글로벌 시장에서 주목받으며 3조원 투자 성과",
            "한국 AI 기술 3조원 투자 성과, 글로벌 시장 주목받는 이유는?"
        );
        
        this.improvements.set(
            "한국 AI 기술, 3조원 R&D 투자로 글로벌 경쟁력 확보",
            "3조원 R&D 투자의 힘, 한국 AI가 글로벌 경쟁력 확보한 비결"
        );
        
        this.improvements.set(
            "김건희 특검 vs 내란특검, 윤석열 정부 특검 정국 어디까지 왔나",
            "특검 정국의 현주소: 김건희 특검과 내란특검 논의, 어디까지 왔나"
        );
        
        this.improvements.set(
            "생성형 AI가 열어가는 혁신의 시대: 산업 전반의 패러다임 변화",
            "GPT부터 ChatGPT까지, 생성형 AI 발전사와 미래 전망"
        );
        
        this.improvements.set(
            "코스피 2,480선 등락 반복, 글로벌 금리와 정책 방향성 사이 갈등",
            "코스피 2,480선 박스권, 글로벌 금리 변화가 증시에 미치는 영향"
        );
        
        this.improvements.set(
            "한국 AI 기술, 글로벌 시장에서 주목받으며 ICT 산업 성장 견인",
            "한국 AI 기술이 ICT 산업 성장 견인, 글로벌 시장 진출 가속화"
        );
        
        this.improvements.set(
            "'아무거나 넣어봐라', AI가 일상 문제 해결의 열쇠가 되다",
            "AI가 바꾸는 일상: '아무거나 넣어봐라'에서 문제 해결까지"
        );
        
        this.improvements.set(
            "결혼 후 사랑의 진화, 책임과 의사소통의 변화",
            "결혼 후 달라지는 사랑의 모습, 책임감과 소통이 핵심"
        );
        
        this.improvements.set(
            "과자 아무거나 먹기, 소비 트렌드의 함정과 기회",
            "무분별한 과자 소비의 함정, 건강한 소비 트렌드로의 전환"
        );
        
        this.improvements.set(
            "인구 증가가 경제에 미치는 긍정적·부정적 영향 분석",
            "인구 증가의 양면성: 경제 성장 동력 vs 사회적 부담"
        );
        
        this.improvements.set(
            "등산으로 얻는 신체적, 정신적 이점 분석",
            "등산의 숨겨진 효과: 몸과 마음 모두 건강해지는 이유"
        );
    }

    async improveCurrentTitles() {
        console.log('✨ 현재 기사 제목 개선 시작...\n');

        try {
            const articlesData = await readFile(this.articlesPath, 'utf-8');
            const articles = JSON.parse(articlesData);

            let improvedCount = 0;

            for (let i = 0; i < articles.length; i++) {
                const article = articles[i];
                const currentTitle = article.title;
                
                // 개선된 제목이 있는지 확인
                if (this.improvements.has(currentTitle)) {
                    const improvedTitle = this.improvements.get(currentTitle);
                    
                    console.log(`[${i + 1}] 제목 개선:`);
                    console.log(`  기존: "${currentTitle}"`);
                    console.log(`  개선: "${improvedTitle}"`);
                    
                    // 제목 업데이트
                    article.title = improvedTitle;
                    
                    // SEO 제목도 업데이트
                    if (article.seo && article.seo.title) {
                        article.seo.title = improvedTitle;
                    }
                    
                    improvedCount++;
                    console.log(`  ✅ 업데이트 완료\n`);
                } else if (this.shouldImproveTitle(currentTitle)) {
                    // 자동 개선이 필요한 제목들
                    const autoImproved = this.autoImproveTitle(currentTitle);
                    if (autoImproved && autoImproved !== currentTitle) {
                        console.log(`[${i + 1}] 자동 제목 개선:`);
                        console.log(`  기존: "${currentTitle}"`);
                        console.log(`  개선: "${autoImproved}"`);
                        
                        article.title = autoImproved;
                        if (article.seo && article.seo.title) {
                            article.seo.title = autoImproved;
                        }
                        
                        improvedCount++;
                        console.log(`  ✅ 자동 개선 완료\n`);
                    }
                }
            }

            // 수정된 데이터 저장
            await writeFile(this.articlesPath, JSON.stringify(articles, null, 2));
            
            console.log('=' .repeat(60));
            console.log(`🎉 제목 개선 완료!`);
            console.log(`총 ${articles.length}개 기사 중 ${improvedCount}개 제목이 개선되었습니다.`);
            console.log('=' .repeat(60));

            // 개선된 제목들 요약 출력
            if (improvedCount > 0) {
                console.log('\n📋 개선된 제목 요약:');
                let count = 1;
                articles.forEach((article) => {
                    if (this.improvements.has(article.title) || this.isImprovedTitle(article.title)) {
                        console.log(`${count}. ${article.title}`);
                        count++;
                    }
                });
            }

        } catch (error) {
            console.error('❌ 제목 개선 중 오류 발생:', error);
            throw error;
        }
    }

    /**
     * 개선이 필요한 제목인지 판단
     */
    shouldImproveTitle(title) {
        // 너무 짧거나 의미없는 제목들
        const badTitles = [
            '배경과 맥락',
            '핵심 데이터/사실',
            '리드(핵심 요약)',
            '리드',
            'AI 뉴스',
            'AI가 만든 첫 기사'
        ];
        
        return badTitles.includes(title) || 
               title.length < 10 || 
               title.includes('핵심 데이터') ||
               title.includes('전망과 과제');
    }

    /**
     * 자동으로 제목 개선
     */
    autoImproveTitle(title) {
        if (title === '배경과 맥락') {
            return 'AI 기술 발전의 배경과 미래 전망';
        }
        if (title === '핵심 데이터/사실') {
            return 'AI 산업 핵심 데이터와 주요 동향';
        }
        if (title === '리드(핵심 요약)' || title === '리드') {
            return 'AI 뉴스 핵심 요약: 오늘의 주요 이슈';
        }
        if (title === 'AI 뉴스') {
            return 'AI 업계 최신 뉴스: 오늘의 주요 소식';
        }
        if (title === 'AI가 만든 첫 기사') {
            return 'AI 저널리즘의 시작: 인공지능이 작성한 첫 번째 기사';
        }
        if (title.includes('핵심 데이터/사실')) {
            return title.replace('핵심 데이터/사실', 'AI 산업 동향과 주요 데이터');
        }
        if (title.includes('전망과 과제')) {
            return title.replace('전망과 과제', '미래 전망과 해결 과제');
        }
        
        return title;
    }

    /**
     * 개선된 제목인지 확인
     */
    isImprovedTitle(title) {
        return Array.from(this.improvements.values()).includes(title) ||
               title.includes('AI 기술 발전의 배경') ||
               title.includes('AI 산업 핵심 데이터') ||
               title.includes('AI 뉴스 핵심 요약') ||
               title.includes('AI 업계 최신 뉴스') ||
               title.includes('AI 저널리즘의 시작');
    }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
    const improver = new CurrentTitleImprover();
    
    improver.improveCurrentTitles()
        .then(() => {
            console.log('\n✨ 현재 기사 제목 개선 작업 완료!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('오류:', error.message);
            process.exit(1);
        });
}

export { CurrentTitleImprover };