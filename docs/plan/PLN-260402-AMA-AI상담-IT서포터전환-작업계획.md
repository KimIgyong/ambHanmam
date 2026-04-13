# 작업 계획서
## AMA AI 상담 및 관리자 대화 관제 기능 개선 작업계획

- 문서 ID: PLAN-AMA-AI상담-IT서포터전환-작업계획-20260402
- 작성일: 2026-04-02
- 연계 분석서: `docs/analysis/REQ-AMA-AI상담-IT서포터전환-20260402.md`

---

## 1. 시스템 개발 현황 분석

### 1.1 이미 구현된 항목

1. 우측 상단 Assistant 모달 구조 존재
2. 대화 저장/메시지 저장/에이전트 라우팅 구조 존재
3. IT 에이전트 코드 및 문서 기반 프롬프트 컨텍스트 로딩 구현 완료
4. 관리자 대화 조회용 `/admin/conversations` 화면 및 관리자 API 존재
5. 대화 상세 조회 및 `convertToKnowledge` 액션 존재
6. 이슈 시스템, 프로젝트 조회, 노트/미팅노트 관련 모듈 존재
7. 관리자 Entity 컨텍스트 선택 및 `X-Entity-Id` 전송 구조 존재

### 1.2 미구현 항목

1. Assistant 화면 명칭 변경 및 Welcome 화면 단순화 미완료
2. 상담 intent 기반 자동 접수 미구현
3. 요청자 스냅샷 저장 규격 미확정
4. 관리자 통합 메시지 타임라인 미구현
5. Entity별 대화방 탐색 UI 미구현
6. 관리자 대화 참여 기능 미구현
7. 대화 -> 이슈 전환 기능 미구현
8. 대화 -> 노트 전환 기능 미구현
9. 전환 시 Entity / Project 선택 UX 미구현
10. 관리자 DTO에 Entity 메타데이터 미포함

### 1.3 구현 방향

1. 기존 Assistant 모달/대화 시스템은 유지하고 화면만 AMA AI 상담으로 정리
2. 기존 IT 에이전트를 기반으로 intent 분류와 접수 액션을 추가
3. 기존 `/admin/conversations`를 새 관리자 관제 콘솔로 확장
4. 기존 이슈/노트 시스템을 재사용해 전환 기능을 구현

---

## 2. 단계별 구현 계획

### 2.1 1단계: Assistant UI/문구 정리

목표:
1. 사용자 노출 명칭을 AMA AI 상담으로 통일
2. Welcome 화면에서 Today's Tasks / My Issues 제거
3. IT 서포터 중심 시작 경험 정리

대상 작업:
1. assistant locale title 변경
2. common sidebar agents 라벨 변경
3. `WelcomeSection.tsx`에서 todo/issue 데이터 조회와 렌더링 제거
4. 필요 시 시작 안내 문구를 IT 상담 목적에 맞게 수정

사이드 임팩트:
1. 기존 투두/이슈 진입 동선 하나가 사라짐
2. 번역 리소스 변경으로 다국어 QA 필요

### 2.2 2단계: IT 상담 intent 분류 및 접수 액션

목표:
1. HELP / BUG / IMPROVEMENT / NEW_FEATURE 의도 분류
2. 의도에 따라 자동 응답 정책 적용
3. 버그/기능요청을 이슈 시스템으로 연결

대상 작업:
1. IT 프롬프트에 intent 분류 규칙 보강
2. 서버에서 상담 결과 메타데이터를 구조화해 후처리 가능하도록 확장
3. 이슈 생성용 orchestration 서비스 추가
4. 이슈 description 또는 별도 필드에 요청자 정보 스냅샷 저장
5. 중복 등록 방지 최소 규칙 정의

사이드 임팩트:
1. 자동 이슈 생성 오탐 가능성
2. 이슈 작성자 정책(HQ 대리 등록) 정합성 검토 필요

### 2.3 3단계: 관리자 관제 콘솔 확장

목표:
1. 모든 Entity 대화를 통합 타임라인으로 조회
2. Entity별/대화방별 탐색 지원
3. 운영자가 한 화면에서 관제와 후처리를 수행

대상 작업:
1. 관리자 대화 목록 API에 Entity 메타데이터 추가
2. 메시지 단위 타임라인 API 신규 추가 또는 기존 API 확장
3. 프론트 `/admin/conversations`를 3패널 구조로 개편
4. 필터: Entity, 사용자, 에이전트, 날짜, 상태
5. 선택한 대화의 상세 메시지와 메타데이터 표시

사이드 임팩트:
1. 기존 단순 테이블 UI와 사용성이 크게 달라짐
2. 메시지량 증가 시 페이지네이션/가상 스크롤 고려 필요

### 2.4 4단계: 관리자 대화 참여

목표:
1. 관리자가 대화방에 직접 참여 가능
2. AI 메시지와 관리자 메시지를 명확히 구분

대상 작업:
1. Message role에 `admin` 지원
2. 관리자 메시지 전송 API 추가
3. 대화 상세 조회 응답에 관리자 정보 포함
4. 사용자 채팅 화면에서 관리자 메시지 렌더링 정책 정의
5. 관리자 작성 이력 감사 로그 검토

사이드 임팩트:
1. 기존 role 기반 UI 분기 수정 필요
2. SSE/스트리밍 흐름과 충돌하지 않도록 메시지 order 관리 필요

### 2.5 5단계: 대화 -> 이슈 전환

목표:
1. 선택한 대화/메시지에서 직접 이슈 생성
2. 대상 Entity와 프로젝트를 운영자가 선택 가능
3. `admin@amoeba.group`가 VN01 이슈를 생성 가능하게 보장

대상 작업:
1. 관리자 전환 API 추가
2. 변환 모달에서 제목/설명/우선순위/유형/Entity/Project 선택
3. 선택 Entity 기준 프로젝트 조회 API 연계
4. Issue 생성 후 conversation/message reference 저장
5. SUPER_ADMIN + `X-Entity-Id` 컨텍스트 검증

사이드 임팩트:
1. 잘못된 Entity 선택 시 데이터 귀속 오류 가능
2. 프로젝트 조회 시 Entity 스코프 검증 누락 주의

### 2.6 6단계: 대화 -> 노트 전환

목표:
1. 상담 내용을 메모/노트로 전환
2. 운영 기록을 별도 문서화

대상 작업:
1. 노트 생성 대상 모듈 확인 및 재사용
2. 대화 요약 + 원문 링크 포함한 노트 생성 API 추가
3. 관리자 관제 콘솔에 노트 전환 액션 추가

사이드 임팩트:
1. 어떤 노트 모듈을 표준으로 쓸지 결정 필요
2. 중복 생성 정책 필요

### 2.7 7단계: 검증 및 배포

목표:
1. 로컬 빌드/타입체크 통과
2. 관리자/일반 사용자 시나리오 검증
3. 스테이징 배포 및 운영 확인

대상 작업:
1. web build, api build 수행
2. 주요 시나리오 수동 테스트
3. 필요 시 SQL migration 적용
4. staging deploy script 실행

사이드 임팩트:
1. 스키마 변경 시 수동 SQL 누락 위험
2. 스테이징 env 누락 시 프런트 빌드 오염 위험

---

## 3. 변경 파일 목록

예상 변경 범위:
1. `apps/web/src/domain/assistant/components/AIAssistantModal.tsx`
2. `apps/web/src/domain/assistant/components/WelcomeSection.tsx`
3. `apps/web/src/locales/ko/assistant.json`
4. `apps/web/src/locales/en/assistant.json`
5. `apps/web/src/locales/vi/assistant.json`
6. `apps/web/src/locales/ko/common.json`
7. `apps/web/src/locales/en/common.json`
8. `apps/web/src/locales/vi/common.json`
9. `apps/api/src/domain/agent/prompt/it.prompt.ts`
10. `apps/api/src/domain/agent/service/it-agent.service.ts`
11. `apps/api/src/domain/chat/service/chat.service.ts`
12. `apps/api/src/domain/chat/controller/chat.controller.ts`
13. `apps/api/src/domain/chat/dto/response/chat.response.ts`
14. `apps/api/src/domain/chat/mapper/chat.mapper.ts`
15. `apps/api/src/domain/chat/entity/message.entity.ts` 또는 관련 타입
16. `apps/web/src/domain/settings/pages/ConversationManagementPage.tsx`
17. `apps/web/src/domain/settings/components/ConversationDetailModal.tsx`
18. `apps/web/src/domain/settings/service/conversation-admin.service.ts`
19. `apps/web/src/domain/settings/hooks/useConversationAdmin.ts`
20. 이슈 생성/프로젝트 조회/노트 생성 관련 서비스 및 DTO
21. 필요 시 SQL migration 파일
22. `docs/test/TC-AMA-AI상담-IT서포터전환-Test-20260402.md`
23. `docs/implementation/RPT-AMA-AI상담-IT서포터전환-작업완료보고-20260402.md`

---

## 4. 사이드 임팩트 분석

### 4.1 보안/권한

1. USER_LEVEL 데이터 격리 규칙 유지 필요
2. 관리자 전용 관제 API는 반드시 ADMIN_LEVEL 이상으로 제한
3. Entity 선택 기반 이슈 등록 시 대상 Entity 검증 필요

### 4.2 데이터 모델

1. 메시지 role 확장 시 기존 채팅 렌더링 영향 확인 필요
2. 전환 reference 저장 방식 결정 필요
3. 요청자 스냅샷 저장 필드가 부족하면 스키마 확장 필요

### 4.3 운영

1. 자동 이슈 생성이 과도하면 운영 부담 증가 가능
2. 관리자 개입 메시지는 AI 답변과 책임 주체가 달라 로그 구분 필요
3. 노트/이슈 전환 기록의 추적성 확보 필요

### 4.4 성능

1. 통합 타임라인 조회는 메시지 테이블 기준으로 부담이 커질 수 있음
2. 관리자 화면은 페이지네이션, 검색 인덱스, 최근순 기본 정렬 고려 필요

---

## 5. DB 마이그레이션

현재 시점 판단:
1. UI/문구 변경만으로는 DB 변경 불필요
2. 관리자 메시지 role 확장, 요청자 스냅샷 구조화, 전환 참조 저장 방식에 따라 DB 변경 가능성 높음

예상 후보:
1. `amb_messages.msg_role` 허용값 확장 또는 enum/text 검토
2. conversation/message -> issue/note reference 저장 컬럼 또는 매핑 테이블 추가
3. support request 전용 테이블은 2차 단계에서 검토

주의사항:
1. staging/production은 TypeORM synchronize 비활성으로 수동 SQL 필수
2. 신규 컬럼/테이블을 사용하는 배포는 반드시 SQL 반영 후 앱 배포

---

## 6. 권장 구현 순서

1. Assistant UI/문구 변경 마무리 및 배포
2. IT 상담 intent 분류/자동 접수 구현
3. 관리자 관제 콘솔 API/DTO 확장
4. 관리자 참여 기능 구현
5. 이슈 전환 구현
6. 노트 전환 구현
7. 테스트 케이스/완료보고 작성

---

## 7. 완료 기준

다음 조건을 모두 만족하면 완료로 본다.
1. 사용자가 AMA AI 상담 명칭으로 IT 상담을 시작할 수 있음
2. Welcome 화면에 Today's Tasks / My Issues가 보이지 않음
3. IT 에이전트가 AMA 기능 설명/사용팁을 제공함
4. BUG/개선/신규기능 요청이 정책에 맞게 접수됨
5. 관리자가 전체 Entity 대화를 통합 타임라인으로 조회 가능함
6. 관리자가 각 Entity 대화방에서 직접 메시지 참여 가능함
7. 관리자가 대화를 이슈 또는 노트로 전환 가능함
8. 이슈 전환 시 Entity/Project 선택 가능하며 VN01 등록 시나리오가 동작함
9. 웹/API 빌드와 스테이징 검증이 완료됨
