# Implementation Plan

- [ ] 1. 콘텐츠 분석기 구현
  - 기사 내용에서 헤딩, 키워드, 통계 등을 추출하는 ContentAnalyzer 클래스 구현
  - 다양한 마크다운 형식과 HTML 태그 파싱 지원
  - 핵심 키워드와 구문 추출 알고리즘 구현
  - _Requirements: 1.1, 1.2, 2.2, 2.3_

- [x] 1.1 기본 콘텐츠 분석 기능 구현
  - ContentAnalyzer 클래스의 기본 구조와 생성자 구현
  - extractHeadings() 메서드로 H1, H2, H3 태그에서 제목 후보 추출
  - extractFirstParagraph() 메서드로 첫 번째 의미있는 문단 추출
  - _Requirements: 2.2, 2.3_

- [ ] 1.2 고급 콘텐츠 분석 기능 구현
  - extractKeyPhrases() 메서드로 핵심 키워드와 구문 추출
  - extractStatistics() 메서드로 숫자, 퍼센트, 통계 데이터 추출
  - extractEntities() 메서드로 회사명, 인명, 지명 등 개체명 추출
  - _Requirements: 1.2, 5.2_

- [ ] 1.3 콘텐츠 분석 테스트 작성
  - 다양한 기사 형식에 대한 단위 테스트 작성
  - 헤딩, 키워드, 통계 추출 정확성 테스트
  - 엣지 케이스 처리 테스트 (빈 내용, 특수 문자 등)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. 제목 생성 파이프라인 구현
  - 다단계 제목 생성을 관리하는 TitleGenerator 클래스 구현
  - AI 제목 생성, 콘텐츠 기반 제목, 휴리스틱 제목, 태그 기반 제목 생성 메서드 구현
  - 각 단계별 폴백 로직 구현
  - _Requirements: 1.1, 2.1, 2.4_

- [x] 2.1 TitleGenerator 기본 구조 구현
  - TitleGenerator 클래스의 기본 구조와 생성자 구현
  - generateTitles() 메인 메서드로 전체 파이프라인 조율
  - 각 제목 생성 방법별 메서드 스텁 구현
  - _Requirements: 1.1, 2.1_

- [ ] 2.2 콘텐츠 기반 제목 생성 구현
  - generateContentBasedTitles() 메서드 구현
  - ContentAnalyzer 결과를 활용한 제목 생성 로직
  - 헤딩과 첫 문단에서 의미있는 제목 추출
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.3 휴리스틱 및 태그 기반 제목 생성 구현
  - generateHeuristicTitles() 메서드로 규칙 기반 제목 생성
  - generateTagBasedTitles() 메서드로 태그와 주제 조합 제목 생성
  - 기존 단순한 폴백 로직을 개선된 알고리즘으로 대체
  - _Requirements: 2.4_

- [ ] 2.4 AI 제목 생성 개선
  - 기존 generateAITitles() 메서드 개선
  - AI 제목 생성 실패 시 더 나은 오류 처리
  - 제목 품질 검증 로직 추가
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. 제목 품질 평가 시스템 구현
  - 제목의 품질을 평가하고 필터링하는 TitleQualityEvaluator 클래스 구현
  - 관련성, 길이, 가독성, SEO, 참여도, 준수성 점수 계산
  - 필터 조건 통과 여부 확인 및 평가 이유 제공
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_

- [ ] 3.1 기본 품질 평가 구조 구현
  - TitleQualityEvaluator 클래스의 기본 구조와 생성자 구현
  - evaluateTitle() 메인 메서드로 전체 평가 프로세스 관리
  - 점수 계산을 위한 기본 프레임워크 구현
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 개별 점수 계산 메서드 구현
  - calculateRelevanceScore() 메서드로 기사 내용과의 관련성 점수 계산
  - calculateLengthScore() 메서드로 제목 길이 적절성 점수 계산
  - calculateReadabilityScore() 메서드로 가독성 점수 계산
  - _Requirements: 3.2, 3.3_

- [ ] 3.3 SEO 및 참여도 점수 계산 구현
  - calculateSEOScore() 메서드로 SEO 최적화 점수 계산
  - calculateEngagementScore() 메서드로 클릭 유도 가능성 점수 계산
  - calculateComplianceScore() 메서드로 가이드라인 준수 점수 계산
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3.4 필터링 및 평가 이유 제공 구현
  - passesFilters() 메서드로 필터 조건 통과 여부 확인
  - getEvaluationReasons() 메서드로 평가 결과에 대한 상세한 이유 제공
  - 중복 제거 및 품질 기준 미달 후보 필터링
  - _Requirements: 3.1, 3.4_

- [ ] 4. 로깅 및 디버깅 시스템 구현
  - 제목 생성 과정의 상세한 로그를 관리하는 TitleGenerationLogger 클래스 구현
  - 각 단계별 실행 시간, 성공/실패 상태, 오류 정보 기록
  - 디버깅을 위한 상세한 정보 제공
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 기본 로깅 시스템 구현
  - TitleGenerationLogger 클래스의 기본 구조와 생성자 구현
  - logStep(), logError(), logWarning() 메서드 구현
  - 타임스탬프와 로그 레벨을 포함한 구조화된 로그 형식
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 고급 로깅 기능 구현
  - getSummary() 메서드로 전체 실행 요약 정보 제공
  - 성능 메트릭 수집 (실행 시간, 메모리 사용량)
  - 제목 생성 성공률 및 품질 통계 수집
  - _Requirements: 4.3, 4.4_

- [ ] 5. 기존 enhance.js API 통합
  - 새로운 제목 생성 시스템을 기존 enhance.js API에 통합
  - 기존 인터페이스 호환성 유지하면서 내부 로직 교체
  - 점진적 마이그레이션을 위한 기능 플래그 구현
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5.1 새로운 제목 생성 시스템 통합
  - enhance.js에서 새로운 TitleGenerator 클래스 사용
  - 기존 제목 생성 로직을 새로운 파이프라인으로 교체
  - 기존 API 응답 형식 유지
  - _Requirements: 1.1, 2.1_

- [x] 5.2 폴백 및 오류 처리 개선
  - AI 제목 생성 실패 시 새로운 폴백 로직 적용
  - 더 나은 오류 메시지와 디버깅 정보 제공
  - 제목 생성 실패 시에도 의미있는 제목 보장
  - _Requirements: 2.1, 2.4, 4.2_

- [x] 5.3 성능 최적화 및 캐싱
  - 콘텐츠 분석 결과 캐싱으로 성능 개선
  - 불필요한 AI API 호출 최소화
  - 메모리 사용량 최적화
  - _Requirements: 1.4_

- [ ] 6. 테스트 구현
  - 각 컴포넌트별 단위 테스트 작성
  - 통합 테스트 및 end-to-end 테스트 구현
  - 다양한 기사 유형에 대한 테스트 케이스 작성
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 6.1 단위 테스트 작성
  - ContentAnalyzer 클래스의 모든 메서드에 대한 단위 테스트
  - TitleGenerator 클래스의 각 제목 생성 방법별 테스트
  - TitleQualityEvaluator 클래스의 점수 계산 로직 테스트
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 6.2 통합 테스트 구현
  - 전체 제목 생성 파이프라인의 end-to-end 테스트
  - 다양한 기사 유형 (기술, 경제, 사회 등)에 대한 테스트
  - AI API 모킹을 통한 안정적인 테스트 환경 구축
  - _Requirements: 1.2, 2.2, 3.2_

- [ ] 6.3 품질 보증 테스트
  - 생성된 제목과 기사 내용의 관련성 평가 테스트
  - 제목 품질 점수의 정확성 검증
  - 성능 및 메모리 사용량 테스트
  - _Requirements: 1.3, 3.3, 5.1_

- [ ] 7. 문서화 및 배포 준비
  - 새로운 제목 생성 시스템의 사용법 문서 작성
  - API 변경사항 및 마이그레이션 가이드 작성
  - 성능 모니터링 및 품질 메트릭 대시보드 구성
  - _Requirements: 4.4, 5.4_

- [ ] 7.1 사용자 문서 작성
  - 새로운 제목 생성 기능의 사용법 가이드
  - 제목 품질 개선을 위한 팁과 모범 사례
  - 문제 해결 가이드 및 FAQ
  - _Requirements: 4.4_

- [ ] 7.2 개발자 문서 작성
  - 새로운 아키텍처와 컴포넌트 설명
  - API 변경사항 및 하위 호환성 정보
  - 확장 및 커스터마이징 가이드
  - _Requirements: 4.4_

- [ ] 7.3 모니터링 및 메트릭 구성
  - 제목 생성 성공률 모니터링 대시보드
  - 제목 품질 점수 분포 추적
  - 사용자 만족도 및 클릭률 분석 도구
  - _Requirements: 5.4_