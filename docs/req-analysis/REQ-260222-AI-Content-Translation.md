---
document_id: REQ-AI-CONTENT-TRANSLATION
version: 1.0.0
status: Draft
created: 2026-02-22
updated: 2026-02-22
author: Claude (AI Architect)
reviewers: [김익용]
---

# AI 콘텐츠 번역 — 요구사항 분석서

## 1. AS-IS 현황 분석

### 1.1 시스템 개요

AMB Management는 한국-베트남 이중 법인(아메바 컴퍼니) 16명 직원이 사용하는 전사 관리 시스템이다.
현재 5개 부서(법무, 회계, 번역, PM, 개발)의 AI 에이전트 체계와 함께, 할 일, 회의록, 공지사항, 프로젝트 메모, 작업항목 등의 콘텐츠를 관리하고 있다.

### 1.2 현재 문제점

| # | 문제 | 영향 |
|---|------|------|
| 1 | 한국어/베트남어 작성 콘텐츠를 타 언어 사용자가 이해 불가 | 16명 중 베트남 팀원이 한국어 회의록/공지 이해 어려움 |
| 2 | 개별 번역 도구(구글번역 등)로 수동 번역 | 비효율적, 도메인 용어 일관성 없음 |
| 3 | 번역된 결과가 시스템에 저장되지 않음 | 동일 콘텐츠를 여러 사용자가 반복 번역 |
| 4 | 원문 수정 시 기존 번역의 유효성 파악 불가 | 구버전 번역을 최신으로 오인할 위험 |

### 1.3 기존 구현 현황 (코드 스캐폴딩)

현재 코드베이스에는 다음 항목이 **이미 스캐폴딩** 되어 있다:

#### 백엔드 (apps/api/src/domain/translation/)

| 구분 | 파일 | 구현 수준 |
|------|------|-----------|
| 엔티티 4개 | content-translation, translation-history, translation-glossary, translation-usage | ✅ 완료 |
| 번역 서비스 | translation.service.ts (542줄) | ✅ 핵심 로직 구현 (SSE 스트리밍, 브릿지 번역, staleness) |
| 용어집 서비스 | glossary.service.ts | ✅ CRUD + 프롬프트 주입 |
| 번역 컨트롤러 | translation.controller.ts (7 엔드포인트) | ✅ 완료 |
| 용어집 컨트롤러 | glossary.controller.ts (4 엔드포인트) | ✅ 완료 |
| DTO 4개 | translate, save-with-translation, update, glossary | ✅ 완료 |
| 매퍼 | translation.mapper.ts | ✅ 완료 |
| 모듈 등록 | translation.module.ts → app.module.ts | ✅ 완료 |

#### 프론트엔드 (apps/web/src/domain/translations/)

| 구분 | 파일 | 구현 수준 |
|------|------|-----------|
| 번역 패널 | TranslationPanel.tsx (329줄) | ✅ 3언어 탭, SSE 스트리밍, 상태 배지 |
| 편집 모달 | TranslationEditModal.tsx | ✅ 필드별 편집 + change_reason |
| 이력 모달 | TranslationHistoryModal.tsx | ✅ 버전별 이력 |
| 저장 다이얼로그 | SaveTranslationDialog.tsx (254줄) | ✅ Save-time 4단계 플로우 |
| React Query 훅 | useTranslations.ts (11개 훅) | ✅ 완료 |
| API 클라이언트 | translation.service.ts | ✅ REST + SSE fetch |

#### 공유 타입 (packages/types/)

| 구분 | 구현 수준 |
|------|-----------|
| TranslationSourceType, TranslationLang, TranslationMethod 등 | ✅ ~70줄 정의 |

#### 통합 현황

| 통합 포인트 | 상태 |
|-------------|------|
| MeetingNote → markStale() 호출 | ✅ 연동 완료 |
| Todo → markStale() 호출 | ✅ 연동 완료 |
| Notice → markStale() 호출 | ✅ 연동 완료 |
| MeetingNoteDetailPage → TranslationPanel 삽입 | ✅ 연동 완료 |
| TodoDetailModal → TranslationPanel 삽입 | ✅ 연동 완료 |
| NoticeDetailPage → TranslationPanel 삽입 | ✅ 연동 완료 |
| MeetingNoteFormModal → SaveTranslationDialog 삽입 | ✅ 연동 완료 |
| i18n translation.json (en/ko/vi) | ✅ 완료 |
| 에러 코드 E24001~E24008 | ✅ 등록 완료 |

---

## 2. TO-BE 요구사항

### 2.1 핵심 번역 기능 (P0 — 필수)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FR-TRN-001 | 모든 대상 콘텐츠(Todo, Meeting Note, Notice, Project Memo, Work Item)에 AI 번역 버튼 | REQ v1.0 §2.1 |
| FR-TRN-002 | 3개 언어(EN/KO/VI) 중 선택 번역 | REQ v1.0 §1.4 |
| FR-TRN-003 | 번역 결과 언어별 영구 저장 | REQ v1.0 §2.1 |
| FR-TRN-006 | 원문 언어 자동 감지 | REQ v1.0 §2.1 |
| FR-TRN-010 | 상세 화면 언어 전환 토글 (탭) | REQ v1.0 §2.2 |
| FR-TRN-012 | 사용자 선호 언어 자동 선택 | REQ v1.0 §2.2 |
| FR-TRN-020 | READ 권한자 번역 수정 가능 | REQ v1.0 §2.3 |
| FR-TRN-021 | 최종 수정자 추적 | REQ v1.0 §2.3 |

### 2.2 2시점 번역 아키텍처 (P0 — 필수)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FL-SAV-001 | 저장 시점: KO/VI 콘텐츠 저장 시 "영문도 함께 저장할까요?" 프롬프트 | Addendum v1.1 §B |
| FL-SAV-002 | SSE 스트리밍 번역 미리보기 및 수정/이대로 저장 선택 | Addendum v1.1 §B.2 |
| FL-SAV-003 | 사용자 설정: ASK/ALWAYS/NEVER 모드 | Addendum v1.1 §B.4 |
| FL-VIW-001 | 열람 시점: 언어 탭에서 미번역 언어 클릭 시 On-Demand 번역 | Addendum v1.1 §C |
| FL-VIW-002 | 캐시 히트 시 DB에서 즉시 표시, 캐시 미스 시 AI 번역 후 DB 저장 | Addendum v1.1 §C.1 |
| FL-VIW-003 | 한번 번역 저장되면 이후 모든 열람자가 캐시된 번역 공유 | Addendum v1.1 §C.2 |

### 2.3 브릿지 번역 (P1 — 중요)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FR-TRN-007 | EN을 브릿지 언어로 사용: KO→EN→VI 경로 | REQ v1.0 §1.4 |
| FL-BRG-001 | KO→VI 요청 시 EN 번역이 있으면 EN→VI 실행 | Addendum v1.1 §C.4 |
| FL-BRG-002 | EN 번역이 없으면 KO→EN 먼저 생성+저장 후 EN→VI 실행 (부산물 EN 보존) | Addendum v1.1 §C.4 |

### 2.4 번역 품질 관리 (P1 — 중요)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FR-TRN-014 | 원문 수정 시 SHA-256 해시 비교로 stale 표시 | REQ v1.0 §4.3 |
| FR-TRN-022 | 번역 수정 이력 (버전 관리) | REQ v1.0 §2.3 |
| FR-TRN-023 | 재번역 버튼 (이전 버전 이력 보존) | REQ v1.0 §2.3 |
| FR-TRN-032 | 도메인 용어집 기반 번역 (Claude 프롬프트에 주입) | REQ v1.0 §2.5 |
| FR-TRN-040 | 용어집 CRUD 관리 | REQ v1.0 §2.5 |

### 2.5 자동화 (P1 — 중요)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FR-TRN-030 | 공지사항 발행 시 전체 언어 자동 번역 | REQ v1.0 §2.4 |
| FR-TRN-033 | 미번역 콘텐츠 열람 시 번역 제안 배너 | REQ v1.0 §2.4 |
| FR-TRN-034 | 구버전 번역 감지 및 재번역 제안 | REQ v1.0 §2.4 |

### 2.6 고급 기능 (P2 — 향후)

| ID | 요구사항 | 참조 |
|----|----------|------|
| FR-TRN-004 | 목록에서 번역 상태 표시 (배지) | REQ v1.0 §2.1 |
| FR-TRN-005 | 일괄 번역 (다중 항목 선택) | REQ v1.0 §2.1 |
| FR-TRN-011 | 원문/번역 나란히 보기 (Side-by-side) | REQ v1.0 §2.2 |
| FR-TRN-025 | 번역 잠금 (MANAGER) | REQ v1.0 §2.3 |
| FR-TRN-031 | 번역 품질 신뢰도 점수 표시 | REQ v1.0 §2.4 |
| FR-TRN-042 | 법인별 용어집 | REQ v1.0 §2.5 |
| FR-TRN-043 | 용어집 CSV 가져오기/내보내기 | REQ v1.0 §2.5 |

### 2.7 에이전트 구조 변경 (추가 요구사항)

| ID | 요구사항 | 비고 |
|----|----------|------|
| AGT-001 | 법무/회계 에이전트 유지 | 기존 유지 |
| AGT-002 | 나머지 에이전트(인사, 마케팅, 전략, 재무 등) 삭제 | 9개 → 5개 리팩토링 완료 상태 |
| AGT-003 | 번역/PM/개발 에이전트 추가 | 부서 코드 TRANSLATION, PM, DEVELOPMENT 이미 등록 |
| AGT-004 | 관리자 설정에서 에이전트 설정(시스템 프롬프트, 모델, Temperature 등) 관리 | AgentConfig 엔티티/페이지 스캐폴딩 존재 |

---

## 3. 갭 분석 (AS-IS → TO-BE)

### 3.1 이미 구현 완료 (갭 없음)

| 항목 | 상태 |
|------|------|
| 4개 DB 엔티티 (amb_content_translations, history, glossary, usage) | ✅ |
| SSE 스트리밍 번역 (Claude API → RxJS Observable) | ✅ |
| 브릿지 번역 로직 (KO→EN→VI) | ✅ |
| 번역 CRUD API (7 엔드포인트) | ✅ |
| 용어집 CRUD API (4 엔드포인트) | ✅ |
| TranslationPanel 컴포넌트 (3언어 탭, 상태 배지, SSE) | ✅ |
| SaveTranslationDialog (4단계 Save-time 플로우) | ✅ |
| TranslationEditModal / TranslationHistoryModal | ✅ |
| React Query 훅 11개 | ✅ |
| Staleness markStale() → Meeting Note, Todo, Notice | ✅ |
| MeetingNote 상세 → TranslationPanel 통합 | ✅ |
| Todo 상세 → TranslationPanel 통합 | ✅ |
| Notice 상세 → TranslationPanel 통합 | ✅ |
| MeetingNote 폼 → SaveTranslationDialog 통합 | ✅ |
| 공유 타입 정의 (domain.types.ts ~70줄) | ✅ |
| i18n translation.json (en/ko/vi) | ✅ |
| 부서 코드 5개 정리 (LEGAL, ACCOUNTING, TRANSLATION, PM, DEVELOPMENT) | ✅ |

### 3.2 주요 갭 (구현 필요)

| # | 갭 항목 | 우선순위 | 설명 |
|---|---------|----------|------|
| GAP-01 | **Usage 기록 로직** | P1 | 엔티티만 존재, translateStream()/translateDirect()에서 usageRepo.save() 미호출. 토큰 수/비용 계산 로직 완전 부재 |
| GAP-02 | **잠금/해제 API** | P2 | is_locked 필드/체크는 있으나, PATCH /lock, /unlock 엔드포인트 미구현 |
| GAP-03 | **용어집 관리 페이지** | P1 | API/훅은 완비, But 독립 UI 페이지 미구현 (Settings 하위 또는 Translation 섹션에 필요) |
| GAP-04 | **SaveTranslationDialog → Todo/Notice 미연동** | P1 | MeetingNote에만 연동됨. Todo 생성 모달, Notice 생성 폼에 미삽입 |
| GAP-05 | **DB 마이그레이션 SQL** | P0 | 4개 테이블 DDL + 인덱스 SQL 파일 미생성 (현재 TypeORM synchronize 의존 추정) |
| GAP-06 | **사용량 조회 API + 대시보드** | P2 | 엔드포인트/서비스 메서드/프론트 대시보드 모두 없음 |
| GAP-07 | **사용자 번역 설정 (save_prompt, preferred_view_lang)** | P1 | DB 컬럼/API/UI 모두 미구현. Addendum §B.4 정의 |
| GAP-08 | **공지사항 자동 번역** | P1 | Notice 발행 시 전체 언어 자동 번역 훅 미구현 |
| GAP-09 | **Auth 토큰 → SSE fetch** | P0 | SSE fetch 시 credentials:'include'만 사용. Bearer 토큰 헤더 미전달 가능성 검증 필요 |
| GAP-10 | **에이전트 설정 관리 페이지** | P1 | AgentConfig 엔티티/기본 페이지 스캐폴딩 있으나, 실제 CRUD 동작 완성도 검증 필요 |
| GAP-11 | **Project Memo / Work Item TranslationPanel 통합** | P1 | 현재 3개 모듈(MeetingNote, Todo, Notice)만 연동. Project Memo, Work Item 미연동 |

### 3.3 갭 미포함 (향후 검토)

| 항목 | 사유 |
|------|------|
| 부분 재번역 (FR-TRN-024) | P2, 인라인 선택 → 부분 번역은 UX 복잡도 높음 |
| 번역 메모리 (REQ §10.2) | P2, pg_trgm 유사도 매칭은 고급 기능 |
| 인라인 목록 미리보기 (REQ §10.3) | P2, 호버 시 번역 타이틀 툴팁 |
| 번역 알림 (REQ §10.4) | P2, 알림 시스템 자체가 미구현 |
| 키보드 단축키 (REQ §10.6) | P2, Alt+T 등 |

---

## 4. 사용자 플로우

### 4.1 저장 시점 플로우 (Save-time)

```
작성자(KO/VI) → 콘텐츠 작성 → [저장] 클릭
    → 언어 감지: KO, Visibility: SHARED 이상
    → "영문도 함께 저장할까요?" 다이얼로그 표시
    → [예] → SSE 스트리밍 번역 → 미리보기 → [수정/이대로 저장]
    → DB: 원문(KO) + 번역(EN) 동시 저장
    → [아니오] → 원문만 저장
```

### 4.2 열람 시점 플로우 (View-time)

```
열람자 → 문서 상세 열기
    → 언어 탭: KO(원문), EN(✅/⚡), VI(✅/⚡)
    → Case 1: 번역 있음(✅) → DB 캐시 즉시 표시
    → Case 2: 번역 없음(⚡) → "번역이 없습니다. 번역할까요?"
        → [번역하기] → SSE 스트리밍 → DB 저장 → 번역 완료 표시
        → 이후 다른 사용자도 캐시 공유
    → Case 3: 번역 구버전(⚠️) → "번역이 최신이 아닐 수 있습니다"
        → [재번역] → 새 버전 생성 + 이전 이력 보존
```

### 4.3 원문 수정 → Staleness 플로우

```
원문 수정 → SHA-256 해시 변경 감지
    → 해당 콘텐츠의 모든 번역 → trn_is_stale = TRUE
    → 다음 열람자에게 ⚠️ 배지 + "Translation may be outdated" 표시
    → [재번역] 클릭 → 새 번역 생성 → stale = FALSE
```

---

## 5. 기술 제약사항

### 5.1 인프라

| 제약 | 내용 |
|------|------|
| Claude API 의존 | 번역 품질/속도가 Claude API 성능에 종속 |
| SSE 스트리밍 | POST 기반 SSE는 브라우저 EventSource API 미지원 → fetch + ReadableStream 사용 |
| 토큰 비용 | 월별 사용량 모니터링 필요. 브릿지 번역 시 2회 호출로 비용 증가 |
| DB 동기화 | TypeORM synchronize 모드 의존 → 프로덕션 전 마이그레이션 SQL 필수 |

### 5.2 보안

| 제약 | 내용 |
|------|------|
| ACL 연동 | 번역은 원본 콘텐츠의 접근 제어를 상속해야 함 |
| PRIVATE 콘텐츠 제외 | visibility = PRIVATE인 콘텐츠는 번역 대상에서 제외 |
| 번역 수정 권한 | 원본 READ 권한이 있으면 번역 수정 가능 (별도 권한 불필요) |

### 5.3 성능

| 제약 | 내용 |
|------|------|
| 단일 번역 응답 | ≤ 5초 (SSE 스트리밍 시 첫 토큰 1초 내) |
| 일괄 번역 | ≤ 30초 (10개 항목, 비동기 처리) |
| 브릿지 번역 | KO→VI 시 2단계 실행으로 지연 발생 가능 |

---

## 6. 데이터 모델

### 6.1 신규 테이블 (4개)

| 테이블 | 설명 | Prefix |
|--------|------|--------|
| `amb_content_translations` | 콘텐츠 번역 저장 (Polymorphic) | trn_ |
| `amb_content_translation_history` | 번역 수정 이력 | thi_ |
| `amb_translation_glossary` | 도메인 용어집 | gls_ |
| `amb_translation_usage` | API 사용량 추적 | tus_ |

### 6.2 기존 테이블 변경

| 테이블 | 변경 내용 |
|--------|-----------|
| `amb_users` | `usr_translation_prefs JSONB` 컬럼 추가 (save_prompt, auto_translate_lang, preferred_view_lang) |
| `amb_todos` | `tod_original_lang VARCHAR(5)` 컬럼 추가 |
| `amb_meeting_notes` | `mtn_original_lang VARCHAR(5)` 컬럼 추가 |
| `amb_notices` | `ntc_original_lang VARCHAR(5)` 컬럼 추가 |

### 6.3 ERD 관계

```
amb_content_translations —||—o{ amb_content_translation_history : "version history"
amb_content_translations }o—|| amb_users : "translated_by"
amb_content_translations }o—|| amb_hr_entities : "belongs_to"
amb_translation_glossary }o—o| amb_hr_entities : "scoped_to"
amb_translation_usage }o—|| amb_hr_entities : "tracked_for"
amb_todos / amb_meeting_notes / amb_notices ||—o{ amb_content_translations : "translated"
```

---

## 7. API 설계 요약

### 7.1 번역 엔드포인트 (Translation)

| Method | Path | Auth | 설명 | 구현 상태 |
|--------|------|------|------|-----------|
| POST | `/translations/translate` | USER | AI 번역 요청 (SSE) | ✅ |
| GET | `/translations/:sourceType/:sourceId` | USER | 콘텐츠 번역 목록 | ✅ |
| GET | `/translations/:sourceType/:sourceId/:targetLang` | USER | 특정 언어 번역 | ✅ |
| POST | `/translations/save` | USER | Save-time 번역 저장 | ✅ |
| PATCH | `/translations/:trnId` | USER | 번역 수정 | ✅ |
| POST | `/translations/:trnId/re-translate` | USER | 재번역 (SSE) | ✅ |
| GET | `/translations/:trnId/history` | USER | 수정 이력 | ✅ |
| PATCH | `/translations/:trnId/lock` | MANAGER | 번역 잠금/해제 | ❌ GAP-02 |
| POST | `/translations/batch` | USER | 일괄 번역 | ❌ P2 |
| GET | `/translations/usage` | ADMIN | 사용량 대시보드 | ❌ GAP-06 |
| GET | `/translations/usage/monthly` | ADMIN | 월별 사용량 | ❌ GAP-06 |

### 7.2 용어집 엔드포인트 (Glossary)

| Method | Path | Auth | 설명 | 구현 상태 |
|--------|------|------|------|-----------|
| GET | `/glossary` | USER | 용어집 목록 | ✅ |
| POST | `/glossary` | MANAGER | 용어 등록 | ✅ |
| PATCH | `/glossary/:glsId` | MANAGER | 용어 수정 | ✅ |
| DELETE | `/glossary/:glsId` | ADMIN | 용어 삭제 | ✅ |
| POST | `/glossary/import` | ADMIN | CSV 가져오기 | ❌ P2 |
| GET | `/glossary/export` | MANAGER | CSV 내보내기 | ❌ P2 |

---

## 8. 비기능 요구사항

| ID | 범주 | 요구사항 | 목표치 |
|----|------|----------|--------|
| NFR-001 | 성능 | 단일 번역 응답 | ≤ 5초 (SSE) |
| NFR-002 | 성능 | 일괄 번역 (10개) | ≤ 30초 |
| NFR-003 | 보안 | 번역 ACL = 원본 콘텐츠 ACL | 필수 |
| NFR-004 | 비용 | 사용량 추적 + 월별 대시보드 | 필수 |
| NFR-005 | 가용성 | 번역 실패 시 원문 표시 fallback | 필수 |
| NFR-006 | 무결성 | SHA-256 해시 기반 staleness | 필수 |
| NFR-007 | 확장성 | 콘텐츠당 3언어 × 다중 버전 | 필수 |

---

## 9. 에러 코드 체계

| 코드 | 설명 |
|------|------|
| E7001 | 번역 서비스 불가 (Claude API 오류) |
| E7002 | 원본 콘텐츠 미발견 |
| E7003 | 번역 미발견 |
| E7004 | 번역 잠금 — 수정 불가 |
| E7005 | 원문 언어 = 대상 언어 |
| E7006 | 번역 내용 비어있음 |
| E7007 | 일괄 번역 한도 초과 (최대 20개) |
| E7008 | 월별 번역 할당량 초과 |
| E7009 | 용어집 용어 중복 |
| E7010 | 유효하지 않은 언어 코드 |

---

## 10. 결론

AI 콘텐츠 번역 기능의 **핵심 아키텍처(4개 엔티티, SSE 스트리밍, 브릿지 번역, TranslationPanel UI)는 이미 높은 완성도로 스캐폴딩**되어 있다.

주요 잔여 작업은:
1. **DB 마이그레이션 SQL 생성** (GAP-05, P0)
2. **Usage 기록 로직 구현** (GAP-01, P1)
3. **용어집 관리 UI 페이지** (GAP-03, P1)
4. **Todo/Notice SaveTranslationDialog 연동** (GAP-04, P1)
5. **사용자 번역 설정 구현** (GAP-07, P1)
6. **에이전트 설정 관리 페이지 완성** (GAP-10, P1)
7. **잠금/해제 API** (GAP-02, P2)
8. **사용량 대시보드** (GAP-06, P2)

이 갭들을 해소하면 참조 문서(Requirements v1.0 + Addendum v1.1)에 정의된 Phase 1~2 수준의 기능을 완성할 수 있다.

---

*End of Document*
