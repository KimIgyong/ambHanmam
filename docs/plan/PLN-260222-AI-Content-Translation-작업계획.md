---
document_id: PLAN-AI-CONTENT-TRANSLATION
version: 2.0.0
status: In Progress
created: 2026-02-22
updated: 2026-02-22
author: Claude (AI Architect)
reviewers: [김익용]
related: REQ-AI-Content-Translation-20260222.md
---

# AI 콘텐츠 번역 — 작업 계획서

## 1. 시스템 개발 현황 분석

### 1.1 현재 구현 수준

> **v2.0 업데이트**: 2026-02-22 코드베이스 감사 결과 및 UserGroupPermission 작업 완료 후 반영

전체 번역 기능의 **약 70%가 이미 스캐폴딩/구현** 되어 있다.

| 영역 | 완성도 | 세부 | 진행 상태 |
|------|--------|------|-----------|
| DB 엔티티 (TypeORM) | 100% | 4개 테이블 엔티티 완료 | ✅ 완료 |
| Translation API | 80% | 7개 엔드포인트 완료 (잠금/해제 API, Usage 기록 로직 미구현) | 🔶 부분 |
| Glossary API | 80% | 4/6 엔드포인트 완료 (CSV import/export 미구현) | 🔶 부분 |
| Frontend 공통 컴포넌트 | 90% | TranslationPanel, EditModal, HistoryModal, SaveDialog 완성 | ✅ 완료 |
| Frontend 훅/서비스 | 95% | 9개 React Query 훅 + 2개 SSE 함수 완료 | ✅ 완료 |
| 모듈 통합 (상세보기) | 75% | MeetingNote/Todo/Notice 상세에 TranslationPanel 연동 완료 | ✅ 완료 |
| 모듈 통합 (저장다이얼로그) | 33% | MeetingNote만 SaveTranslationDialog 연동, **Todo/Notice 미연동** | ⚠️ 미완 |
| 용어집 관리 UI | 0% | 페이지 미구현, 라우트 미등록 | ❌ 미진행 |
| Usage 추적 | 5% | 엔티티만 존재, **기록 로직/조회 API 없음** | ❌ 미진행 |
| DB 마이그레이션 | 0% | **스테이징 DB에 번역 테이블 4개 미생성, 기존 테이블 컬럼 미추가** | 🚨 긴급 |
| 사용자 번역 설정 | 0% | usr_translation_prefs JSONB 컬럼 미생성, API/UI 없음 | ❌ 미진행 |
| 에이전트 설정 관리 | 90% | 백엔드 완성, 프론트엔드 완성, 라우트 등록 완료 | ✅ 거의 완료 |
| Project Memo 번역 | 0% | TranslationPanel 미통합 | ❌ 미진행 |

### 1.2 스테이징 긴급 이슈 🚨

UserGroupPermission 배포 후 스테이징 API에서 다음 에러 발생:
```
column todo.tdo_original_lang does not exist
column notice.ntc_original_lang does not exist
```
원인: 엔티티에 `tdo_original_lang`, `ntc_original_lang` 컬럼이 정의되어 있으나, **TypeORM synchronize가 해당 컬럼을 DB에 생성하지 못함**. 번역 4개 테이블도 스테이징 DB에 미생성.

→ **Phase 0 (DB 마이그레이션)을 최우선 실행해야 함**

### 1.3 사이드 임팩트 분석

| 변경 대상 | 사이드 임팩트 | 위험도 |
|-----------|-------------|--------|
| amb_users 테이블 컬럼 추가 | 기존 사용자 조회 쿼리에 영향 없음 (JSONB 컬럼). **주의**: UserGroupPermission에서 이미 9개 컬럼 추가됨 | 낮음 |
| Todo/Notice 폼에 SaveDialog 추가 | 저장 플로우 변경 — 기존 저장 로직은 유지, 다이얼로그만 추가 | 낮음 |
| Usage 기록 로직 추가 | translateStream() 내부에 DB write 추가 — 실패 시 번역은 정상 동작 필요 (try-catch) | 낮음 |
| 에이전트 설정 관리 | 백엔드/프론트엔드 이미 구현 완료로 추가 영향 최소 | 낮음 |
| DB 마이그레이션 SQL | 스테이징 즉시 실행 필요 — 현재 API 에러 발생 중 | 🚨 높음 |
| SSE fetch Auth 헤더 | 쿠키 기반 인증이라 현재 동작하나, token refresh 실패 가능성 있음 | 중간 |

### 1.4 최근 변경 사항 반영 (UserGroupPermission 작업)

| 변경 항목 | 번역 작업에 미치는 영향 |
|-----------|----------------------|
| 5단계 역할 체계 (SUPER_ADMIN→VIEWER) | Glossary 가드에 이미 `MANAGER`/`ADMIN` 적용 → **호환됨** |
| GroupRoleGuard 추가 | 번역 API에 선택적 적용 검토 필요 |
| DataScopeInterceptor 글로벌 등록 | 번역 조회 시 법인별 필터 자동 적용 → **ent_id 기반 필터 활용 가능** |
| UserEntity 9개 신규 컬럼 | usr_translation_prefs 추가 시 기존 컬럼과 공존 확인 필요 |
| JWT 2h 만료 | SSE fetch 중 token 만료 가능성 감소 → **긍정적** |

---

## 2. 단계별 구현 계획

### Phase 0: DB 기반 작업 — 🚨 최우선 (0.5일)

> **목표**: 스테이징 API 에러 해소 + 번역 기능 DB 기반 확보
> **긴급도**: 현재 스테이징에서 Todo/Notice 조회 시 에러 발생 중

| # | 작업 | 파일 | 설명 | 상태 |
|---|------|------|------|------|
| 0-1 | 번역 4개 테이블 CREATE SQL | `scripts/migration-translation.sql` | amb_content_translations, amb_translation_glossary, amb_content_translation_history, amb_translation_usage | ❌ |
| 0-2 | 기존 테이블 ALTER SQL | 위와 동일 | amb_todos → tdo_original_lang, amb_notices → ntc_original_lang | ❌ |
| 0-3 | amb_users ALTER SQL | 위와 동일 | usr_translation_prefs JSONB 컬럼 추가 | ❌ |
| 0-4 | 스테이징 DB 반영 | SSH 접속 | SQL 실행 → API 에러 해소 확인 | ❌ |

**완료 기준**: 스테이징 API에서 `column does not exist` 에러 0건, 번역 4개 테이블 생성 확인

---

### Phase 1: 핵심 갭 해소 — 백엔드 (1.5일)

> **목표**: 누락된 백엔드 로직 완성

| # | 작업 | 파일 | 관련 갭 | 상태 |
|---|------|------|---------|------|
| 1-1 | Usage 기록 로직 구현 | `translation.service.ts` | GAP-01 | ❌ |
| | `translateStream()` 완료 시 Claude API usage 메타데이터 → usageRepo.save() | | | |
| | `translateDirect()` 완료 시 동일 처리 | | | |
| | `saveTranslation()` 시 usage 기록 (save-time 번역) | | | |
| 1-2 | 잠금/해제 API 구현 | `translation.controller.ts`, `translation.service.ts` | GAP-02 | ❌ |
| | PATCH /translations/:trnId/lock | | | |
| | PATCH /translations/:trnId/unlock | | | |
| | @Roles('MANAGER') 가드 적용 | | | |
| 1-3 | 사용자 번역 설정 API | `user.entity.ts`, `auth.service.ts` 또는 신규 | GAP-07 | ❌ |
| | UserEntity에 `usr_translation_prefs` JSONB 필드 추가 (type: 'jsonb' 명시!) | | | |
| | GET /auth/me/translation-prefs | | | |
| | PATCH /auth/me/translation-prefs | | | |
| 1-4 | 공지사항 자동 번역 훅 | `notice.service.ts` | GAP-08 | ❌ |
| | Notice publish 시 EN/VI 자동 번역 트리거 | | | |

**주의사항**:
- UserEntity에 컬럼 추가 시 반드시 `type: 'jsonb'` 명시 (nullable일 경우 `string | null` → TypeORM Object 에러 방지)
- 역할 가드는 기존 `@Roles()` 데코레이터 사용 (5단계 계층 이미 적용됨: VIEWER=1→SUPER_ADMIN=5)

**완료 기준**: 모든 API 엔드포인트 정상 동작, Usage가 DB에 기록됨

---

### Phase 2: 핵심 갭 해소 — 프론트엔드 (2일)

> **목표**: 누락된 프론트엔드 연동 및 UI 완성

| # | 작업 | 파일 | 관련 갭 | 상태 |
|---|------|------|---------|------|
| 2-1 | Todo SaveTranslationDialog 연동 | Todo 생성/수정 폼 | GAP-04 | ❌ |
| | Todo 생성/수정 저장 시 SaveTranslationDialog 표시 | | | |
| 2-2 | Notice SaveTranslationDialog 연동 | Notice 생성/수정 폼 | GAP-04 | ❌ |
| | Notice 작성 시 SaveTranslationDialog 표시 | | | |
| 2-3 | 용어집 관리 페이지 구현 | `apps/web/src/domain/settings/pages/GlossaryPage.tsx` | GAP-03 | ❌ |
| | 용어 목록 테이블 (검색, 카테고리 필터) | | | |
| | 용어 추가/수정/삭제 모달 | | | |
| | Settings 라우트에 등록 | | | |
| 2-4 | 사용자 번역 설정 UI | `ProfilePage.tsx` 또는 Settings 신규 섹션 | GAP-07 | ❌ |
| | save_prompt: ASK/ALWAYS/NEVER 라디오 | | | |
| | preferred_view_lang: 원문/EN/KO/VI 라디오 | | | |
| 2-5 | Project Memo TranslationPanel 통합 | 프로젝트 메모 상세 페이지 | GAP-11 | ❌ |
| | TranslationPanel 삽입 + markStale 연동 | | | |
| 2-6 | SSE fetch Auth 보강 | `translation.service.ts` (frontend) | GAP-09 | ❌ |
| | fetch 호출에 쿠키 인증은 동작하지만, apiClient interceptor 우회로 401 자동 refresh 불가 | | | |
| | 해결: fetch 전에 token 유효성 확인 또는 에러 시 수동 refresh | | | |

**완료 기준**: 모든 대상 콘텐츠에서 번역 UI 동작, 용어집 관리 가능

---

### Phase 3: 에이전트 설정 관리 (0.5일) — ✅ 거의 완료

> **목표**: 관리자가 에이전트 설정을 UI에서 관리
> **상태**: 백엔드 API 완성, 프론트엔드 페이지 완성, 라우트 등록 완료

| # | 작업 | 파일 | 상태 |
|---|------|------|------|
| 3-1 | AgentConfig CRUD API 검증 | `agent-config.controller.ts`, `agent-config.service.ts` | ✅ 완료 |
| 3-2 | AgentSettingsPage 검증 | `AgentSettingsPage.tsx`, `AgentConfigEditModal.tsx` | ✅ 완료 |
| 3-3 | 5개 부서 에이전트 초기 데이터 시딩 | SQL 또는 entity-seed | ❌ 미진행 |
| 3-4 | Settings 메뉴에 에이전트 관리 라우트 | 라우팅 (`/settings/agents`) | ✅ 등록됨 |

**잔여 작업**: 5개 부서 에이전트 초기 시드 데이터만 추가하면 완료

---

### Phase 4: 통합 테스트 및 배포 (1일)

> **목표**: 전체 테스트 + 스테이징 배포

| # | 작업 | 설명 |
|---|------|------|
| 4-1 | 모노레포 빌드 검증 | TypeScript 컴파일 에러 0건 확인 |
| 4-2 | 스테이징 배포 | `bash docker/staging/deploy-staging.sh` |
| 4-3 | E2E 수동 테스트 | 스테이징에서 실제 번역 플로우 검증 |
| 4-4 | 기능별 검증 | 저장 시점/열람 시점/staleness/용어집/사용량 |

**완료 기준**: 스테이징에서 전체 번역 플로우 정상 동작

---

## 3. 구현 우선순위 매트릭스

> **v2.0 업데이트**: 스테이징 에러 해소를 최우선으로 재정렬

| 우선순위 | Phase | 작업 | 소요일 | 의존성 | 상태 |
|----------|-------|------|--------|--------|------|
| **P0 (긴급)** | 0 | DB 마이그레이션 SQL + 스테이징 반영 | 0.5일 | 없음 | 🚨 |
| **P1 (중요)** | 1 | Usage 기록 로직 (GAP-01) | 0.5일 | Phase 0 | ❌ |
| **P1 (중요)** | 1 | 잠금/해제 API (GAP-02) | 0.3일 | 없음 | ❌ |
| **P1 (중요)** | 1 | 사용자 번역 설정 API (GAP-07) | 0.5일 | Phase 0 | ❌ |
| **P1 (중요)** | 2 | Todo/Notice SaveDialog 연동 (GAP-04) | 0.5일 | 없음 | ❌ |
| **P1 (중요)** | 2 | 용어집 관리 페이지 (GAP-03) | 1일 | 없음 | ❌ |
| **P1 (중요)** | 2 | 사용자 번역 설정 UI (GAP-07) | 0.5일 | Phase 1-3 | ❌ |
| **P1 (중요)** | 2 | SSE fetch Auth 보강 (GAP-09) | 0.3일 | 없음 | ❌ |
| **P1 (중요)** | 2 | Project Memo 통합 (GAP-11) | 0.5일 | 없음 | ❌ |
| **P1 (중요)** | 1 | 공지사항 자동 번역 (GAP-08) | 0.5일 | 없음 | ❌ |
| **P1 (중요)** | 3 | 에이전트 시드 데이터 (GAP-10) | 0.2일 | 없음 | ❌ |
| **P2 (향후)** | - | 사용량 대시보드 (GAP-06) | 1일 | Phase 1-1 | ❌ |
| **P2 (향후)** | - | 일괄 번역 | 1일 | 없음 | ❌ |
| **P2 (향후)** | - | CSV import/export | 0.5일 | 없음 | ❌ |

---

## 4. 파일 변경 목록 (예상)

> **v2.0 업데이트**: 실제 코드 감사 결과 기반으로 정확한 파일 경로로 수정

### 4.1 Backend 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `apps/api/src/domain/translation/service/translation.service.ts` | 수정 | Usage 기록, 잠금/해제 메서드 추가 (542줄 기존) |
| `apps/api/src/domain/translation/controller/translation.controller.ts` | 수정 | 잠금/해제 엔드포인트 추가 |
| `apps/api/src/domain/auth/entity/user.entity.ts` | 수정 | usr_translation_prefs JSONB 컬럼 추가 (**type: 'jsonb' 반드시 명시**) |
| `apps/api/src/domain/auth/controller/auth.controller.ts` | 수정 | 번역 설정 get/update 엔드포인트 추가 |
| `apps/api/src/domain/auth/service/auth.service.ts` | 수정 | 번역 설정 get/update 메서드 추가 |
| `apps/api/src/domain/notices/service/notice.service.ts` | 수정 | 발행 시 자동 번역 트리거 추가 |

### 4.2 Frontend 변경 파일

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| Todo 생성/수정 폼 (확인 필요) | 수정 | SaveTranslationDialog 연동 |
| Notice 생성/수정 폼 (확인 필요) | 수정 | SaveTranslationDialog 연동 |
| `apps/web/src/domain/settings/pages/GlossaryPage.tsx` | 신규 | 용어집 관리 페이지 |
| `apps/web/src/domain/settings/components/GlossaryModal.tsx` | 신규 | 용어 추가/수정 모달 |
| `apps/web/src/domain/translations/service/translation.service.ts` | 수정 | SSE fetch Auth 보강 (130줄 기존) |
| 사용자 번역 설정 UI 컴포넌트 | 신규 | save_prompt, preferred_view_lang  |
| 프로젝트 메모 상세 페이지 | 수정 | TranslationPanel 삽입 |
| `apps/web/src/router/index.tsx` | 수정 | 용어집 페이지 라우트 추가 |

### 4.3 공유 패키지

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `packages/types/src/domain.types.ts` | 수정 | TranslationPrefs 인터페이스 추가 |

### 4.4 i18n

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `apps/web/src/locales/{en,ko,vi}/translation.json` | 수정 | 용어집 관리/번역 설정 관련 키 추가 (기존 파일에 glossary 섹션 이미 존재) |

### 4.5 DB / 인프라

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `scripts/migration-translation.sql` | 신규 | 4개 테이블 CREATE + ALTER + 인덱스 DDL |

---

## 5. 전체 일정 요약

> **v2.0 업데이트**: Phase 3 대폭 축소 (에이전트 관리 이미 구현), Phase 0 긴급 우선

| Phase | 기간 | 주요 산출물 | 상태 |
|-------|------|------------|------|
| Phase 0: DB 기반 🚨 | 0.5일 | 마이그레이션 SQL, 스테이징 에러 해소 | ❌ 긴급 |
| Phase 1: 백엔드 갭 해소 | 1.5일 | Usage 로직, 잠금 API, 번역 설정 API, 자동 번역 | ❌ |
| Phase 2: 프론트엔드 갭 해소 | 2일 | 용어집 페이지, Todo/Notice 연동, 설정 UI, PM 통합 | ❌ |
| Phase 3: 에이전트 설정 | 0.5일 | 에이전트 시드 데이터 (나머지 이미 완료) | 🔶 거의 완료 |
| Phase 4: 테스트 + 배포 | 1일 | E2E 테스트, 스테이징 배포 | ❌ |
| **합계** | **~5.5일** | | |

---

## 6. 리스크 및 대응 방안

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 🚨 스테이징 Todo/Notice 에러 | 확정 | 높음 | **Phase 0 즉시 실행으로 해소** |
| Claude API 비용 급증 | 중 | 높음 | Usage 기록 (Phase 1) + 월별 한도 설정으로 모니터링 |
| TypeORM nullable 컬럼 Object 에러 | 중 | 높음 | JSONB/varchar 타입 반드시 명시 (`type: 'jsonb'`, `type: 'varchar'`) |
| SSE 장시간 연결 시 token 만료 | 낮음 | 중 | JWT 2h (이전 15m→2h 변경)로 가능성 감소, Phase 2-6에서 추가 보강 |
| DB 마이그레이션 시 데이터 손실 | 낮음 | 높음 | ADD COLUMN IF NOT EXISTS 사용, 백업 선행 |
| 브릿지 번역 지연 (2회 API 호출) | 중 | 중 | 프로그레스 표시 + EN 캐시 적극 활용 |
| UserEntity 컬럼 과다 (UserGroupPermission 9개 + 번역 1개) | 낮음 | 낮음 | JSONB 단일 컬럼으로 번역 설정 통합 |

---

## 7. 진행 완료 / 미진행 현황 요약

### ✅ 진행 완료

| 항목 | 세부 |
|------|------|
| DB 엔티티 4개 | ContentTranslation, TranslationGlossary, TranslationHistory, TranslationUsage |
| Translation API 7개 엔드포인트 | translate(SSE), get, getByLang, save, update, reTranslate(SSE), history |
| Glossary API 4개 엔드포인트 | list, create, update, delete |
| Frontend 컴포넌트 4개 | TranslationPanel, SaveTranslationDialog, TranslationEditModal, TranslationHistoryModal |
| Frontend 훅 9개 | useContentTranslations, useTranslation, useSave/Update, useHistory, useGlossary, useCRUDTerms |
| Frontend 서비스 | translation.service.ts (API + SSE fetch) |
| TranslationPanel 통합 | MeetingNote, Todo, Notice 상세페이지 (3/4 — Project Memo 제외) |
| SaveTranslationDialog 통합 | MeetingNote 폼 (1/3 — Todo, Notice 제외) |
| 에이전트 설정 API | AgentConfig CRUD API 완성 |
| 에이전트 설정 UI | AgentSettingsPage + AgentConfigEditModal + 라우트 등록 |
| i18n | translation.json (en/ko/vi) 기본 키셋 |
| Todo/Notice 엔티티 | tdo_original_lang, ntc_original_lang 컬럼 추가됨 (엔티티만, DB 미반영) |

### ❌ 미진행

| 항목 | Phase | 우선순위 |
|------|-------|---------|
| **DB 마이그레이션 SQL** (번역 테이블 + 기존 ALTER) | 0 | 🚨 P0 |
| Usage 기록 로직 (translateStream 등에서 usage 저장) | 1 | P1 |
| 잠금/해제 API (lock/unlock 엔드포인트) | 1 | P1 |
| 사용자 번역 설정 (usr_translation_prefs JSONB + API + UI) | 1+2 | P1 |
| 공지사항 자동 번역 트리거 | 1 | P1 |
| Todo SaveTranslationDialog 연동 | 2 | P1 |
| Notice SaveTranslationDialog 연동 | 2 | P1 |
| 용어집 관리 페이지 (GlossaryPage) | 2 | P1 |
| Project Memo TranslationPanel 통합 | 2 | P1 |
| SSE fetch Auth 보강 (401 자동 refresh) | 2 | P1 |
| 에이전트 5개 부서 시드 데이터 | 3 | P1 |
| 사용량 대시보드 | 향후 | P2 |
| 일괄 번역 | 향후 | P2 |
| CSV import/export | 향후 | P2 |

---

## 8. 승인

- [ ] 작업 계획 v2.0 승인: 김익용
- [ ] Phase 0 DB 마이그레이션 즉시 실행 승인
- [ ] Phase 2 완료 후 스테이징 배포 승인

---

*End of Document — v2.0 (2026-02-22 updated)*
