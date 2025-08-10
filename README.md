# My AI News (Next.js MVP)

## 요구사항
- Node.js 18+
- 로컬 테스트 전용(파일 시스템 JSON 저장). 서버리스 배포 시 DB 사용 필요.

## 설치
```bash
npm install
```

## 환경변수 설정
`.env.local` 파일 생성 후 키 입력 (예시는 `.env.local.example` 참고)
```
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
PERPLEXITY_API_KEY=...
```

## 실행
```bash
npm run dev
# http://localhost:3000
# 관리자 홈: /admin
# 기사 생성: /admin/generate
# 프롬프트 관리: /admin/prompts
```

## 기능
- 프롬프트 CRUD(JSON): /admin/prompts
- 기사 생성(OpenAI/Gemini/Claude/Perplexity): /admin/generate
- 기사 저장: /api/saveArticle → data/articles.json
- 메인 목록: data/articles.json 표시
