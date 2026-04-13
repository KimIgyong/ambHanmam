# AI 콘텐츠 번역 시스템 - 작업 완료 보고

## 개요
- **작업 기간**: 2026-02-22
- **Plan 문서**: `docs/plan/PLAN-AI-Content-Translation-작업계획-20250220.md`
- **빌드 상태**: ✅ 4/4 성공 (types, common, api, web)
- **스테이징 배포**: ✅ 완료 (https://mng.amoeba.site)

---

## Phase 0: DB 마이그레이션 ✅

### 신규 테이블 (4개)
| 테이블 | 설명 | 컬럼 수 |
|--------|------|---------|
| `amb_content_translations` | 콘텐츠 번역 저장 | 22개 + UNIQUE + 4 인덱스 |
| `amb_translation_glossary` | 번역 용어집 | 10개 + 3 인덱스 |
| `amb_content_translation_history` | 번역 수정 이력 | 7개 + FK + 1 인덱스 |
| `amb_translation_usage` | AI 번역 사용량 | 9개 + 3 인덱스 |

### 기존 테이블 컬럼 추가 (4개)
| 테이블 | 컬럼 | 타입 |
|--------|------|------|
| `amb_todos` | `tdo_original_lang` | VARCHAR(5) DEFAULT 'ko' |
| `amb_notices` | `ntc_original_lang` | VARCHAR(5) DEFAULT 'ko' |
| `amb_meeting_notes` | `mtn_original_lang` | VARCHAR(5) DEFAULT 'ko' |
| `amb_users` | `usr_translation_prefs` | JSONB |

### 마이그레이션 파일
- `scripts/migration-translation.sql`

---

## Phase 1: 백엔드 구현 ✅

### 1-1. Usage Tracking (AI 사용량 기록)
- **ClaudeService** (`claude.service.ts`)
  - `ClaudeUsage` 인터페이스 추가 (`inputTokens`, `outputTokens`)
  - `ClaudeSendResult` 인터페이스 추가 (`text` + `usage`)
  - `sendMessage()`: overload로 `{ withUsage: true }` 옵션 시 usage 포함 반환
  - `streamMessage()`: `done` 이벤트에 `usage` 필드 포함
- **TranslationService** (`translation.service.ts`)
  - `recordUsage()` private 메서드 추가 → `amb_translation_usage` 테이블에 기록
  - `translateStream()`: 스트리밍 완료 시 usage 기록 (fire-and-forget)
  - `reTranslateStream()`: 재번역 완료 시 usage 기록
  - `translateDirect()`: Bridge 번역 시 usage 기록
  - 비용 계산: Claude Opus 4 기준 ($15/M input, $75/M output)

### 1-2. Lock/Unlock API
- **TranslationService**
  - `lockTranslation(trnId, userId)`: 번역 잠금 설정
  - `unlockTranslation(trnId)`: 번역 잠금 해제
- **TranslationController**
  - `PATCH /translations/:trnId/lock`: 번역 잠금
  - `PATCH /translations/:trnId/unlock`: 번역 잠금 해제

### 1-3. Translation Preferences
- **UserEntity** (`user.entity.ts`)
  - `usrTranslationPrefs: JSONB` 컬럼 추가
  - 기본값: `{"save_prompt":"ASK","preferred_view_lang":"original"}`
- **UserController** (`user.controller.ts`)
  - `GET /users/me/translation-prefs`: 내 번역 설정 조회
  - `PATCH /users/me/translation-prefs`: 내 번역 설정 수정
  - 유효성 검증: `save_prompt` ∈ {ASK, ALWAYS, NEVER}, `preferred_view_lang` ∈ {original, en, ko, vi}

### 1-4. Notice 자동번역
- **NoticeService** (`notice.service.ts`)
  - `triggerAutoTranslation()`: 공지 생성 시 다른 언어로 비동기 번역
  - `createNotice()` 후 fire-and-forget으로 호출
  - originalLang 이외의 모든 지원 언어(en, ko, vi)로 자동 번역

---

## Phase 2: 프론트엔드 통합 ✅

### 2-1. Todo SaveTranslationDialog 연동
- **TodoPage** (`TodoPage.tsx`)
  - Todo 생성/수정 후 `SaveTranslationDialog` 자동 표시
  - 영어 번역 함께 저장 여부 확인

### 2-2. GlossaryPage (용어집 관리)
- **GlossaryPage** (`translations/pages/GlossaryPage.tsx`) - 신규
  - 용어 CRUD (추가, 수정, 삭제)
  - 검색 필터, 카테고리 자동완성
  - 3개 언어(EN/KO/VI) + 카테고리 + 컨텍스트
- **라우터**: `/settings/glossary`

### 2-3. Lock/Unlock UI
- **translation.service.ts**: `lockTranslation`, `unlockTranslation` API 추가
- **useTranslations.ts**: `useLockTranslation`, `useUnlockTranslation` hooks 추가
- **TranslationEditModal** (`TranslationEditModal.tsx`)
  - Lock/Unlock 토글 버튼 (잠금 시 amber 색상)
  - 잠금 상태에서 편집 비활성화 + 경고 메시지

### 2-4. i18n (3개 언어)
- `en/translation.json`: lock/unlock 관련 키 5개 추가
- `ko/translation.json`: lock/unlock 관련 키 5개 추가
- `vi/translation.json`: lock/unlock 관련 키 5개 추가

---

## 변경 파일 목록

### 백엔드 (apps/api/)
| 파일 | 변경 내용 |
|------|----------|
| `infrastructure/external/claude/claude.service.ts` | ClaudeUsage, ClaudeSendResult 타입 + sendMessage overload + streamMessage usage |
| `domain/translation/service/translation.service.ts` | recordUsage, lockTranslation, unlockTranslation + usage 기록 |
| `domain/translation/controller/translation.controller.ts` | PATCH lock/unlock 엔드포인트 |
| `domain/auth/entity/user.entity.ts` | usrTranslationPrefs JSONB 컬럼 |
| `domain/auth/controller/user.controller.ts` | GET/PATCH translation-prefs |
| `domain/notices/service/notice.service.ts` | triggerAutoTranslation |

### 프론트엔드 (apps/web/)
| 파일 | 변경 내용 |
|------|----------|
| `domain/translations/service/translation.service.ts` | lockTranslation, unlockTranslation API |
| `domain/translations/hooks/useTranslations.ts` | useLockTranslation, useUnlockTranslation hooks |
| `domain/translations/components/TranslationEditModal.tsx` | Lock/Unlock UI |
| `domain/translations/pages/GlossaryPage.tsx` | 신규 - 용어집 관리 |
| `domain/todos/pages/TodoPage.tsx` | SaveTranslationDialog 연동 |
| `router/index.tsx` | /settings/glossary 라우트 |
| `locales/en/translation.json` | lock/unlock 키 |
| `locales/ko/translation.json` | lock/unlock 키 |
| `locales/vi/translation.json` | lock/unlock 키 |

### 인프라
| 파일 | 변경 내용 |
|------|----------|
| `scripts/migration-translation.sql` | 4 테이블 + 4 컬럼 DDL |

---

## 스테이징 검증 결과
- ✅ API 정상 기동
- ✅ `tdo_original_lang` 에러 해소
- ✅ `ntc_original_lang` 에러 해소
- ✅ `mtn_original_lang` 에러 해소
- ✅ 4개 번역 테이블 정상 생성
- ✅ `usr_translation_prefs` 컬럼 추가 완료

## Git 커밋
- `8477497` feat: 권한 관리 페이지 5역할 2그룹 체계 적용 (이전 작업 포함)
- `c011b9a` fix: vi locale에 lock/unlock 번역 키 추가
- `7bc5e23` fix: migration SQL에 mtn_original_lang 컬럼 추가
