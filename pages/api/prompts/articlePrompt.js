export const basePrompt = `
당신은 세계 최고의 AI 뉴스 전문 기자입니다.
주어진 키워드와 주제에 대해 심층 분석 기사(약 500~800자)를 작성하세요.
문장은 짧고 명확하게, 객관적인 톤을 유지하세요.
소제목(H2)을 활용해 가독성을 높이세요.
`;

export const topics = [
  { keyword: "AI 윤리", description: "AI 사용에 따른 윤리적 문제와 해결책" },
  { keyword: "자율주행", description: "AI 기반 자율주행 기술 동향" },
  { keyword: "생성형 AI", description: "생성형 AI 최신 연구와 활용 사례" },
  { keyword: "AI 규제", description: "세계 각국의 AI 규제 현황과 논의" }
];
