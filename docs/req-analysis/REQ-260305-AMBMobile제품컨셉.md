# 요구사항 분석서: AMB Mobile 제품 컨셉

| 항목 | 내용 |
|------|------|
| 문서 ID | REQ-AMBMobile제품컨셉-20260305 |
| 작성일 | 2026-03-05 |
| 작성자 | Claude Code |
| 상태 | 분석 완료 |

---

## 1. AS-IS 현황 분석

### 1.1 시스템 전체 구조

AMB Management는 **npm workspaces + Turborepo** 기반 모노레포로 구성되며, 현재 다음 애플리케이션이 존재한다:

| 앱 | 경로 | 설명 | 포트 |
|----|------|------|------|
| API | `apps/api/` | NestJS 백엔드 | 3009 |
| Web | `apps/web/` | React 프론트엔드 (PC) | 5179 |
| Portal API | `apps/portal-api/` | 포탈 백엔드 | - |
| Portal Web | `apps/portal-web/` | 포탈 프론트엔드 | - |

**공유 패키지:**
- `packages/types/` — 공유 TypeScript 타입 (domain.types.ts 등)
- `packages/common/` — 공유 유틸리티, 상수
- `packages/portal-shared/` — 포탈 공유 패키지

**모바일 앱은 현재 존재하지 않음** — Capacitor 프로젝트, 모바일 전용 코드 모두 미구현 상태.

### 1.2 로비챗 (Amoeba Talk) — 현재 구현 현황

> **완성도: 95% (프로덕션 수준)**

#### 1.2.1 데이터베이스 (5개 테이블)

| 테이블 | 엔티티 | 역할 |
|--------|--------|------|
| `amb_talk_channels` | TalkChannelEntity | 채널 (PUBLIC/PRIVATE/DIRECT) |
| `amb_talk_messages` | TalkMessageEntity | 메시지 (TEXT/FILE/SYSTEM/TRANSLATION) |
| `amb_talk_channel_members` | TalkChannelMemberEntity | 채널 멤버 (OWNER/ADMIN/MEMBER) |
| `amb_talk_reactions` | TalkReactionEntity | 리액션 (LIKE/GOOD_JOB/SAD) |
| `amb_talk_read_status` | TalkReadStatusEntity | 읽음 상태 (채널-사용자 단위) |

#### 1.2.2 백엔드 API (25+ 엔드포인트)

**채널 관리** (`/api/v1/talk/channels`):
- GET `/` — 내 채널 목록 (법인별 격리)
- GET `/{id}` — 채널 상세 (멤버 포함)
- GET `/members` — 법인 사용자 목록 (DM 대상)
- GET `/unread` — 채널별 미읽음 수
- POST `/` — 채널 생성
- POST `/dm` — DM 채널 생성/조회
- PATCH `/{id}` — 채널 수정
- DELETE `/{id}` — 채널 삭제 (soft delete)
- POST `/{id}/members` — 멤버 추가
- DELETE `/{id}/members/{userId}` — 멤버 제거
- POST `/{id}/read` — 읽음 표시

**메시지 관리** (`/api/v1/talk/channels/{channelId}/messages`):
- GET `/` — 메시지 목록 (커서 기반 페이지네이션)
- GET `/search` — 메시지 검색 (ILIKE)
- POST `/` — 메시지 전송 (동시번역 지원)
- PATCH `/{messageId}` — 메시지 수정
- DELETE `/{messageId}` — 메시지 삭제
- POST `/{messageId}/react` — 리액션 토글
- POST `/{messageId}/translate` — AI 번역
- POST `/{messageId}/translate-and-post` — 번역 후 대화에 기록
- GET `/{messageId}/translations` — 번역 목록 조회

**Presence** (`/api/v1/talk/presence`):
- POST `/heartbeat` — 하트비트 (30초 간격)
- GET `/status` — 온라인 상태 조회
- GET `/events` — SSE 구독

#### 1.2.3 SSE 실시간 이벤트 (7종)

| 이벤트 | 설명 |
|--------|------|
| `message:new` | 새 메시지 |
| `message:update` | 메시지 수정 |
| `message:delete` | 메시지 삭제 |
| `message:reaction` | 리액션 변경 |
| `channel:read` | 읽음 표시 |
| `member:join` | 멤버 입장 |
| `member:leave` | 멤버 퇴장 |
| `presence:update` | 온라인 상태 |

#### 1.2.4 번역 시스템

- **엔진**: Claude AI 기반 (`MessageTranslateService`)
- **캐싱**: `amb_content_translations` 테이블에 영구 캐싱
- **동시번역**: 메시지 발송 시 `translate_to` 파라미터로 즉시 번역
- **번역 기록**: `msgType = TRANSLATION`으로 별도 메시지 저장, `parent_id`로 원본 연결
- **언어**: en, ko, vi, ja, zh 지원

#### 1.2.5 프론트엔드 (13개 컴포넌트)

```
apps/web/src/domain/amoeba-talk/
├── pages/AmoebaTalkPage.tsx          # 메인 페이지 (3-패널 레이아웃)
├── components/
│   ├── ChannelList.tsx               # 채널 목록 + 미읽음 뱃지
│   ├── ChannelHeader.tsx             # 채널 헤더 + 검색/멤버 토글
│   ├── TalkMessageList.tsx           # 메시지 목록 + 무한 스크롤
│   ├── TalkMessageInput.tsx          # 메시지 입력 + 동시번역 표시
│   ├── MemberPanel.tsx               # 멤버 패널
│   ├── CreateChannelModal.tsx        # 채널 생성 모달
│   ├── NewDmModal.tsx                # DM 시작 모달
│   ├── InviteMemberModal.tsx         # 멤버 초대 모달
│   ├── MessageTranslateButton.tsx    # 번역 버튼/팝오버
│   ├── MessageTranslation.tsx        # 번역 결과 표시
│   ├── TranslationMessage.tsx        # 번역 메시지 렌더링
│   └── ReplyPreview.tsx              # 대댓글 미리보기
├── hooks/
│   ├── useTalk.ts                    # React Query 기반 API 훅
│   ├── useTalkSSE.ts                 # SSE 연결 + 자동 재연결
│   └── usePresence.ts               # 하트비트 + 상태 SSE
├── service/talk.service.ts           # API 클라이언트
└── store/talk.store.ts               # Zustand 상태
```

#### 1.2.6 미구현/개선 필요 항목

| 항목 | 현재 상태 | 모바일 필요 여부 |
|------|-----------|----------------|
| 파일 업로드 | `msgType=FILE` 정의만 존재, 실제 업로드 미구현 | Phase 1 필수 |
| @mention 파싱 | 미구현 | Phase 2 |
| 스레드 UI | 대댓글 지원하지만 축약 표시 없음 | Phase 2 |
| 음성/영상 메시지 | 미구현 | Phase 3+ |
| 메시지별 읽음 영수증 | 채널 단위만 추적 | Phase 2 |
| **메시지 번역 인라인 표시** | 번역은 별도 팝오버/메시지로 표시 | **모바일에서 인라인 필수** |
| **amb_talk_message_translations** | **미구현** (현재 amb_content_translations 사용) | **모바일 컨셉의 핵심 테이블** |
| 푸시 알림 | 미구현 | Phase 1 필수 |

### 1.3 할일 (Todo) — 현재 구현 현황

> **완성도: 85%**

#### 테이블 구조

| 테이블 | 역할 |
|--------|------|
| `amb_todos` | 할일 (제목, 설명, 상태, 마감일, 공개범위, 태그) |
| `amb_todo_comments` | 할일 코멘트 |
| `amb_todo_status_logs` | 상태 변경 이력 |
| `amb_todo_participants` | 참여자 |

#### API 엔드포인트

- `GET /api/v1/todos` — 목록 (필터: status, date_from/to, search)
- `GET /api/v1/todos/cell` — 그룹 할일
- `GET /api/v1/todos/company` — 회사 할일
- `POST /api/v1/todos` — 생성
- `PATCH /api/v1/todos/:id` — 수정
- `DELETE /api/v1/todos/:id` — 삭제
- `GET/POST/DELETE /api/v1/todos/:id/comments` — 코멘트 CRUD
- `GET /api/v1/todos/:id/status-logs` — 상태 이력

#### 프론트엔드

```
apps/web/src/domain/todos/
├── pages/TodoPage.tsx
├── components/
│   ├── ScopedTodoList.tsx
│   ├── TodoFormModal.tsx
│   ├── TodoDetailModal.tsx
│   ├── TodoItem.tsx
│   ├── TodoStatusHistory.tsx
│   └── TodoDeleteConfirmModal.tsx
```

#### 주요 Entity 속성
- `tdoStatus`: SCHEDULED → IN_PROGRESS → DONE
- `tdoVisibility`: PRIVATE | CELL | ENTITY
- `tdoDueDate`: 마감일
- Issue, Project 연결 관계 지원

### 1.4 노트/회의록 (Meeting Notes) — 현재 구현 현황

> **완성도: 90%**

#### 테이블 구조

| 테이블 | 역할 |
|--------|------|
| `amb_meeting_notes` | 회의록/메모 (제목, 내용, 타입, 회의일, 공개범위) |
| `amb_meeting_note_comments` | 코멘트 |
| `amb_meeting_note_participants` | 참여자 |
| `amb_meeting_note_projects` | 연관 프로젝트 |
| `amb_meeting_note_issues` | 연관 이슈 |
| `amb_meeting_note_ratings` | 별점 평가 |

#### API: 13개 엔드포인트 (CRUD + 코멘트 + 별점)
#### 프론트엔드: 2개 페이지 (`/meeting-notes`, `/meeting-notes/:id`) + 5개 컴포넌트

### 1.5 이슈 (Issues) — 현재 구현 현황

> **완성도: 95%**

#### 테이블 구조

| 테이블 | 역할 |
|--------|------|
| `amb_issues` | 이슈 (타입, 제목, 심각도, 상태, 우선순위, 진행률) |
| `amb_issue_comments` | 코멘트 |
| `amb_issue_status_logs` | 상태 변경 이력 |

#### API: 17개 엔드포인트 (CRUD + 상태관리 + 승인/반려 + 코멘트 + 필터 프리셋)

#### 상태 흐름
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
     ↘ PENDING_APPROVAL → APPROVED/REJECTED
```

#### 프론트엔드: 3개 뷰 (리스트/칸반/간트) + 10개 컴포넌트

### 1.6 공지사항 (Notices) — 현재 구현 현황

> **완성도: 90%**

- 3개 테이블: `amb_notices`, `amb_notice_reads`, `amb_notice_attachments`
- 7개 API 엔드포인트 (CRUD + 첨부파일 + 최근 공지)
- 2개 페이지 (`/notices`, `/notices/:id`)

### 1.7 출근/스케줄 (Attendance) — 현재 구현 현황

> **완성도: 85%**

- 1개 테이블: `amb_attendances`
- 5개 API 엔드포인트 (개인/팀 조회 + CRUD)
- 1개 페이지 + 4개 컴포넌트
- 최근 업데이트: 휴가 신청 + 잔여 연차 확인 기능 추가 (2026-03-04)

### 1.8 AI 에이전트 — 현재 구현 현황

> **완성도: 100%**

- 9개 부서별 전문 에이전트 운영 중
- 1개 테이블: `amb_agent_configs`
- 7개 API 엔드포인트
- Claude API 기반, 부서별 커스텀 프롬프트

### 1.9 인증 체계

| 항목 | 현재 구현 |
|------|-----------|
| 방식 | JWT (Passport.js) |
| 토큰 추출 | 1순위: Cookie (`access_token`), 2순위: Bearer 토큰 |
| 만료 | 2시간 |
| Payload | sub, email, role, level, status, companyId, entityId, isHq, mustChangePw |
| 전역 가드 | `APP_GUARD` (JwtAuthGuard) |

**모바일 전환 시**: Cookie → **Secure Storage** (Capacitor) 방식으로 토큰 저장 필요

### 1.10 i18n / 번역

- **지원 언어**: en, ko, vi (3개)
- **프론트엔드**: i18next + react-i18next, 35개 네임스페이스
- **번역 파일**: `apps/web/src/locales/{lang}/{namespace}.json`
- **로컬 저장소**: `localStorage('amb-lang')`
- **번역 관련 테이블**: `amb_content_translations`, `amb_content_translation_history`, `amb_translation_glossary`, `amb_translation_usage` (4개)

### 1.11 메뉴 권한 시스템 (ACL) — 현재 구현 현황

> **완성도: 100% (프로덕션 운영 중)**

#### 4계층 권한 구조

| 계층 | 테이블 | 설명 | 우선순위 |
|------|--------|------|----------|
| **역할별 기본 권한** | `amb_menu_permissions` | 6개 역할(SUPER_ADMIN~VIEWER)별 메뉴 접근 | 3순위 (기본값) |
| **Unit별 권한** | `amb_menu_unit_permissions` | 부서별 메뉴 접근 (법인별 설정) | 2순위 |
| **사용자별 개별 권한** | `amb_user_menu_permissions` | 특정 사용자에게 메뉴 추가/차단 | 1순위 (최우선) |
| **Cell별 권한** | `amb_menu_cell_permissions` | 그룹(Cell)별 필터링 | 보조 필터 |

#### 메뉴 설정

| 테이블 | 설명 |
|--------|------|
| `amb_menu_config` | 메뉴 코드, 라벨, 아이콘, 경로, 카테고리(WORK_TOOL/MODULE/SETTINGS), 활성화 여부, 정렬순서 |

#### 메뉴 카테고리

| 카테고리 | 메뉴 코드 예시 |
|----------|---------------|
| **CHAT** | CHAT_MANAGEMENT, CHAT_HR, CHAT_ACCOUNTING 등 9개 |
| **WORK_TOOL** | TODO, MEETING_NOTES, AMOEBA_TALK, ATTENDANCE, NOTICES, ISSUES, CALENDAR, PROJECT_MANAGEMENT 등 |
| **MODULE** | ACCOUNTING, HR, BILLING, MAIL, KMS, SERVICE_MANAGEMENT, ASSET_MANAGEMENT 등 |
| **SETTINGS** | SETTINGS_MEMBERS, SETTINGS_PERMISSIONS, SETTINGS_API_KEYS 등 |
| **ENTITY_SETTINGS** | ENTITY_MEMBERS, ENTITY_PERMISSIONS 등 (MASTER 전용) |

#### 권한 판정 로직 (백엔드)

```
MenuPermissionService.getMyMenus(userId, role)

1. 메뉴 활성화 여부 확인 (enabled=false → 숨김)
2. ADMIN_LEVEL → 모든 활성 메뉴 접근 가능
3. MASTER → Admin 전용(AGENTS, SERVICE_MANAGEMENT 등) + SETTINGS 제외 전부 접근
4. 사용자별 개별 설정 (최우선) → ump_accessible
5. Unit별 권한 → mup_accessible
6. 역할별 기본 권한 → mpm_accessible
7. Cell별 필터 → 소속 Cell 중 하나라도 접근 가능이면 OK
```

#### API

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /settings/permissions/me` | **내 접근 가능 메뉴 목록** (통합 판정 결과) |
| `GET /settings/permissions` | 역할별 권한 조회 (AdminGuard) |
| `PUT /settings/permissions` | 역할별 권한 수정 (AdminGuard) |
| `PUT /settings/permissions/users/:userId` | 사용자 개별 권한 설정 (AdminGuard) |
| `PUT /settings/permissions/groups` | Cell 권한 수정 (AdminGuard) |

#### 프론트엔드

- **`useMyMenus()` 훅**: 현재 사용자의 접근 가능 메뉴 조회 (React Query)
- **`MenuGuard` 컴포넌트**: 라우트별 권한 재검증, 권한 없으면 홈으로 리다이렉트
- **`MainLayout.tsx`**: `useMyMenus()` 결과로 사이드바 메뉴 동적 렌더링

### 1.12 알림 시스템

- **테이블**: `amb_notifications` (타입, 제목, 메시지, 수신자, 발신자, 리소스 연결, 읽음 여부)
- **현재**: DB 기반 알림 저장만 구현
- **푸시 알림**: **미구현** (FCM/APNs 인프라 없음)

---

## 2. TO-BE 요구사항

### 2.1 제품 포지셔닝

**"로비챗 + 번역 기반 협업 메신저"** — 한국-베트남 팀이 언어 장벽 없이 실시간 소통하는 모바일 워크 메신저. 채팅하면서 바로 업무(할일/노트/이슈)를 처리하는 경험 제공.

### 2.2 모바일 메뉴 접근 권한 정책

> **모바일 앱의 메뉴 접근 권한은 웹/어드민에서 설정한 기존 권한 체계를 그대로 따른다.**

#### 핵심 원칙

- 모바일 전용 별도 권한 시스템을 만들지 않음
- 기존 `GET /api/v1/settings/permissions/me` API를 모바일에서 동일하게 호출
- 어드민이 웹에서 설정한 역할별/Unit별/사용자별/Cell별 권한이 모바일에 즉시 반영

#### 모바일 메뉴 권한 적용 방식

```
모바일 앱 로그인 → JWT 토큰 획득
    ↓
GET /api/v1/settings/permissions/me (기존 API 그대로 호출)
    ↓
MyMenuItemResponse[] 반환 (접근 가능한 메뉴 목록)
    ↓
모바일 탭/카드뷰 메뉴 동적 렌더링:
  ├─ ② 업무도구 탭: WORK_TOOL 카테고리 중 접근 가능한 메뉴만 카드 표시
  ├─ ③ 업무모듈 탭: MODULE 카테고리 중 접근 가능한 메뉴만 카드 표시
  └─ 권한 없는 메뉴 카드는 숨김 처리
```

#### 권한 매핑 예시

| 웹 메뉴 코드 | 모바일 표시 위치 | 카드 표시 조건 |
|-------------|-----------------|---------------|
| `TODO` | ② 업무도구 탭 | `permissions/me`에 TODO 포함 시 |
| `MEETING_NOTES` | ② 업무도구 탭 | `permissions/me`에 MEETING_NOTES 포함 시 |
| `ISSUES` | ② 업무도구 탭 | `permissions/me`에 ISSUES 포함 시 |
| `HR` | ③ 업무모듈 탭 | `permissions/me`에 HR 포함 시 |
| `ACCOUNTING` | ③ 업무모듈 탭 | `permissions/me`에 ACCOUNTING 포함 시 |
| `BILLING` | ③ 업무모듈 탭 | `permissions/me`에 BILLING 포함 시 |
| `KMS` | ③ 업무모듈 탭 | `permissions/me`에 KMS 포함 시 |
| `AMOEBA_TALK` | ① 채팅 탭 | `permissions/me`에 AMOEBA_TALK 포함 시 |

#### 관리자 운영 관점

- **권한 설정**: 기존 웹 관리자 화면 (`/settings/permissions`)에서 동일하게 관리
- **모바일 별도 설정 불필요**: 웹에서 역할/사용자/Unit/Cell 권한 변경 → 모바일에 자동 반영
- **메뉴 활성화/비활성화**: `amb_menu_config.mcf_enabled = false` → 웹/모바일 동시 숨김

### 2.3 모바일 vs PC 역할 분담

| 영역 | 모바일 앱 | PC 웹 |
|------|-----------|-------|
| **로비챗** | ★ 메인 기능 (채널, DM, 스레드, @멘션, 파일공유, 선택 번역) | 동일 (3-패널 레이아웃) |
| **업무도구** | 카드뷰 메뉴 → 웹뷰로 모바일 웹 화면 접근 (할일/노트/이슈) | 네이티브 PC UI |
| **업무모듈** | 카드뷰 메뉴 → 웹뷰로 모바일 웹 화면 접근 (HR/회계/KMS 등) | 네이티브 PC UI |
| **알림 허브** | 공지 읽기, 스케줄 확인, AI 간편 질의 | 모든 관리 기능 |
| **사이트 바로가기** | 웹뷰로 아메바매니지먼트 포탈 웹사이트 접근 | 브라우저 직접 접근 |

### 2.3 화면 구성 (5탭 구조)

```
┌────────────────────────────────────────────┐
│ ① 채팅  ② 업무도구  ③ 업무모듈  ④ 사이트  ⑤ 더보기 │
└────────────────────────────────────────────┘
```

**① 채팅 탭 (로비챗 — 메인)**
- 채널 목록 (#dev, #marketing, ...)
- DM 목록
- 채널/DM 대화 화면
  - 메시지 버블 (원문 표시, 번역은 사용자 선택 시)
  - 메시지 액션: 답장, **번역 요청**, 할일변환, 이슈변환, 노트변환
  - 파일 첨부, 이미지, 링크 미리보기
- 채널 생성/설정
- 푸시 알림 (채널, DM, @멘션)

**② 업무도구 탭 (카드뷰 메뉴)**
- 카드 형태로 업무도구 목록 표시
  - 할일 (Todo) → 웹뷰로 모바일 웹 화면 접근
  - 노트/회의록 (Meeting Notes) → 웹뷰로 모바일 웹 화면 접근
  - 이슈 (Issues) → 웹뷰로 모바일 웹 화면 접근
- 각 카드 탭 시 Capacitor WebView로 해당 모듈의 모바일 웹 페이지 로드

**③ 업무모듈 탭 (카드뷰 메뉴)**
- 카드 형태로 업무모듈 목록 표시
  - HR 관리 → 웹뷰
  - 회계 (Accounting) → 웹뷰
  - 청구/계약 (Billing) → 웹뷰
  - KMS (지식관리) → 웹뷰
  - 프로젝트 관리 → 웹뷰
  - 서비스 관리 → 웹뷰
  - 웹메일 → 웹뷰
  - 캘린더 → 웹뷰
  - 자산 관리 → 웹뷰
- 각 카드 탭 시 Capacitor WebView로 해당 모듈의 모바일 웹 페이지 로드

**④ 사이트 탭 (웹뷰 바로가기)**
- 아메바매니지먼트 포탈 웹사이트 (`https://portal.amoeba.com` 등) 웹뷰로 접근
- 포탈 사이트의 주요 페이지 바로가기

**⑤ 더보기 탭**
- 공지사항 (읽기 전용)
- 출근스케줄 (내 스케줄 확인/등록)
- AI 에이전트 (간편 질의)
- 프로필/설정 (언어, 알림, 로그아웃)

### 2.4 핵심 차별 기능: 사용자 선택 번역 + 캐싱

**AS-IS 번역 방식:**
- 번역 버튼 클릭 → 팝오버에서 언어 선택 → 번역 결과 별도 표시
- 동시번역 시 원문에 구분자(---)로 번역 합침
- 번역은 `amb_content_translations` 범용 테이블에 캐싱

**TO-BE 번역 방식 (모바일):**
- **자동 번역이 아닌 사용자 선택 방식**
- **작성 시 번역**: 메시지 작성 시 번역 언어를 선택하여 번역본과 함께 전송
- **읽을 때 번역**: 수신된 메시지를 읽을 때 번역 버튼으로 원하는 언어로 번역 요청
- **번역 캐싱**: 한번 번역된 메시지는 `amb_talk_message_translations`에 저장 → 동일 메시지+언어 재요청 시 **캐시된 번역 즉시 반환** (API 호출 없음)

#### 2.4.1 작성 시 번역 플로우

```
┌─────────────────────────────────────────────┐
│ [🌐 KO→EN] ┌──────────────────┐ [📎] [⬆]  │
│             │ 메시지 입력...     │            │
│             └──────────────────┘            │
│  ☑ 번역 포함 전송 [EN ▼]                     │ ← 번역 언어 선택 토글
└─────────────────────────────────────────────┘

전송 결과:
┌─────────────────────────────────────┐
│ [09:30] 김개발 🇰🇷                   │
│ ┌─────────────────────────────────┐ │
│ │ DB 마이그레이션 완료했습니다.      │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│ │ 🌐 DB migration completed.     │ │ ← 작성자가 선택한 번역
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 2.4.2 읽을 때 번역 플로우

```
┌─────────────────────────────────────┐
│ [09:45] Nguyễn Văn A 🇻🇳             │
│ ┌─────────────────────────────────┐ │
│ │ Tôi sẽ kiểm tra phía frontend. │ │
│ └─────────────────────────────────┘ │
│                       [🌐 번역] [☑] │ ← 번역 버튼 클릭
│                                     │
│ 번역 언어 선택: [KO] [EN] [VI]       │ ← 언어 선택
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Tôi sẽ kiểm tra phía frontend. │ │
│ │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│ │ 🌐 프론트엔드 쪽 확인하겠습니다.  │ │ ← 번역 결과 인라인 표시
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

→ 이후 같은 메시지+언어 재요청 시 캐시에서 즉시 표시 (API 호출 없음)
```

#### 2.4.3 번역 캐싱 동작

```
번역 요청 → amb_talk_message_translations 조회
  ├─ 캐시 HIT: 저장된 번역 즉시 반환 (0ms)
  └─ 캐시 MISS: Claude AI 번역 → 결과 저장 → 반환
                 → 이후 동일 요청은 캐시 HIT
```

### 2.5 채팅 → 업무 변환 (핵심 가치)

메시지 롱프레스 → 액션 시트:
- ↩ 답장
- 🌐 번역하기 → 언어 선택 (KO/EN/VI) → 캐시 확인 후 번역
- ☑ 할일로 만들기 → 제목 자동 채움, 마감일 선택
- 📝 노트로 저장 → 메시지 내용을 노트 본문으로
- 🔴 이슈로 등록 → 제목 + 관련 채널 자동 연결
- 📋 복사 / 📌 고정

> **참고**: 할일/노트/이슈 생성 후 상세 보기는 해당 업무도구 탭의 웹뷰로 이동

### 2.6 신규 데이터 모델

```sql
-- 메시지별 번역 캐시 (신규 테이블)
CREATE TABLE amb_talk_message_translations (
  tmt_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msg_id          UUID NOT NULL REFERENCES amb_talk_messages(msg_id),
  tmt_lang        VARCHAR(5) NOT NULL,          -- 'en', 'ko', 'vi'
  tmt_content     TEXT NOT NULL,                 -- 번역된 메시지 본문
  tmt_method      VARCHAR(20) DEFAULT 'AI',     -- 'AI' | 'AI_EDITED' | 'HUMAN'
  tmt_source_hash VARCHAR(64),                  -- 원문 SHA-256 (구버전 감지)
  tmt_created_at  TIMESTAMPTZ DEFAULT NOW(),
  tmt_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(msg_id, tmt_lang)                      -- 메시지당 언어별 1건
);
```

---

## 3. 갭 분석 (GAP Analysis)

### 3.1 신규 개발 필요 항목

| 구분 | 항목 | 현재 상태 | 필요 작업 | 영향도 |
|------|------|-----------|-----------|--------|
| **인프라** | Capacitor 프로젝트 | ❌ 미구현 | `apps/mobile/` 신규 생성, android/ios 셋업 | 🔴 높음 |
| **인프라** | 모바일 전용 라우터/레이아웃 | ❌ 미구현 | App.tsx, MobileTabLayout.tsx | 🔴 높음 |
| **인프라** | 푸시 알림 (FCM/APNs) | ❌ 미구현 | Capacitor Push Plugin + 백엔드 발송 | 🔴 높음 |
| **인프라** | 모바일 인증 (Secure Storage) | ❌ 미구현 | JWT Cookie → Secure Storage 전환 | 🔴 높음 |
| **인프라** | 생체인증 앱 잠금 | ❌ 미구현 | Capacitor Biometrics Plugin | 🟡 중간 |
| **DB** | `amb_talk_message_translations` | ❌ 미구현 | 신규 테이블 + Entity + Migration | 🔴 높음 |
| **백엔드** | 메시지 번역 API (선택 번역) | ⚠️ 부분 (기존 번역 API 존재) | 작성 시 번역 포함 전송 + 읽을 때 번역 요청 + 캐싱 | 🔴 높음 |
| **백엔드** | 번역 캐시 조회 API | ❌ 미구현 | `amb_talk_message_translations` 캐시 조회/저장 | 🟡 중간 |
| **백엔드** | 푸시 알림 발송 서비스 | ❌ 미구현 | FCM/APNs 연동 서비스 | 🔴 높음 |
| **백엔드** | 디바이스 토큰 관리 | ❌ 미구현 | 디바이스 등록/해제 API | 🔴 높음 |
| **프론트** | 모바일 채팅 UI | ❌ 미구현 | MessageBubble (선택 번역), 채널 목록 등 | 🔴 높음 |
| **프론트** | 업무도구 카드뷰 메뉴 | ❌ 미구현 | 카드뷰 레이아웃 + 웹뷰 컨테이너 (할일/노트/이슈) | 🟡 중간 |
| **프론트** | 업무모듈 카드뷰 메뉴 | ❌ 미구현 | 카드뷰 레이아웃 + 웹뷰 컨테이너 (HR/회계/KMS 등) | 🟡 중간 |
| **프론트** | 사이트 바로가기 (웹뷰) | ❌ 미구현 | 아메바 포탈 웹사이트 웹뷰 접근 | 🟢 낮음 |
| **프론트** | 메시지→업무 변환 UI | ❌ 미구현 | MessageActionSheet, QuickCreateForm | 🟡 중간 |
| **프론트** | 기존 웹 모바일 반응형 | ⚠️ 부분 | 업무도구/모듈 웹뷰 접근을 위해 모바일 반응형 대응 필요 | 🟡 중간 |
| **프론트** | 오프라인 메시지 큐 | ❌ 미구현 | 오프라인 발송 → 재연결 시 재전송 | 🟢 낮음 |

### 3.2 기존 코드 재사용 가능 항목

| 구분 | 항목 | 재사용 방식 |
|------|------|------------|
| **백엔드** | 채널/메시지 API 전체 | **100% 재사용** — 모바일 클라이언트가 동일 API 호출 |
| **백엔드** | SSE 실시간 이벤트 | **100% 재사용** — EventSource는 모바일에서도 동작 |
| **백엔드** | Presence 서비스 | **100% 재사용** |
| **백엔드** | 할일/노트/이슈 API | **100% 재사용** |
| **백엔드** | 공지/스케줄/에이전트 API | **100% 재사용** |
| **백엔드** | 메뉴 권한 API (`/settings/permissions/me`) | **100% 재사용** — 모바일에서 동일 API로 접근 가능 메뉴 조회 |
| **백엔드** | 번역 서비스 (Claude AI) | **80% 재사용** — `amb_talk_message_translations` 저장 로직 추가 필요 |
| **백엔드** | 인증 (JWT 검증) | **90% 재사용** — Bearer 토큰 방식은 변경 불요 |
| **공유 패키지** | `packages/types/` | **90% 재사용** — 모바일 전용 DTO 타입 추가 |
| **공유 패키지** | `packages/common/` | **100% 재사용** |
| **프론트** | React Query 훅 (useTalk 등) | **70% 재사용** — 모바일 환경 최적화 필요 (캐시 전략, 재연결) |
| **프론트** | API 서비스 (talk.service.ts) | **90% 재사용** — baseURL만 변경 |
| **프론트** | Zustand 스토어 | **60% 재사용** — 모바일 UX에 맞게 상태 구조 조정 |
| **프론트** | i18n 번역 파일 | **80% 재사용** — 모바일 전용 키 추가 |

### 3.3 백엔드 변경 필요 사항

기존 백엔드는 **대부분 변경 없이 재사용 가능**하며, 다음 항목만 추가/확장 필요:

| 변경 유형 | 항목 | 상세 |
|-----------|------|------|
| **신규 테이블** | `amb_talk_message_translations` | Entity, Migration 생성 |
| **신규 테이블** | `amb_push_device_tokens` | 디바이스 토큰 저장 (userId, token, platform, createdAt) |
| **API 확장** | `GET /talk/channels/{id}/messages` | 메시지별 캐싱된 번역 포함 옵션 |
| **API 확장** | `POST /talk/channels/{id}/messages` | 번역 포함 전송 옵션 (작성 시 번역 선택) |
| **신규 API** | `POST /talk/messages/{id}/translate` | 읽을 때 번역 요청 (캐시 우선 조회 → MISS 시 AI 번역 → 저장) |
| **신규 API** | `POST /push/register` | 디바이스 토큰 등록 |
| **신규 API** | `DELETE /push/unregister` | 디바이스 토큰 해제 |
| **신규 서비스** | `PushNotificationService` | FCM/APNs 발송 |
| **서비스 확장** | `MessageTranslateService` | `amb_talk_message_translations` 캐시 저장/조회 로직 |
| **서비스 확장** | `TalkSseService` | 메시지 이벤트 시 푸시 알림 트리거 |

---

## 4. 기술 구현 전략

### 4.1 프로젝트 구조

```
ambManagement/
├── apps/
│   ├── web/              ← 기존 PC 웹 (변경 최소)
│   ├── api/              ← 기존 NestJS (번역 API 확장, 푸시 알림 추가)
│   └── mobile/           ← 🆕 Capacitor 프로젝트
│       ├── android/
│       ├── ios/
│       ├── capacitor.config.ts
│       └── src/
│           ├── App.tsx                        # 모바일 전용 라우터
│           ├── layouts/
│           │   └── MobileTabLayout.tsx        # 하단 5탭 레이아웃
│           ├── tabs/
│           │   ├── ChatTab/                   # 로비챗 (네이티브 구현)
│           │   ├── WorkToolsTab/              # 🆕 업무도구 카드뷰 메뉴
│           │   ├── WorkModulesTab/            # 🆕 업무모듈 카드뷰 메뉴
│           │   ├── SiteTab/                   # 🆕 사이트 바로가기 (웹뷰)
│           │   └── MoreTab/                   # 더보기
│           ├── components/
│           │   ├── MessageBubble.tsx           # 메시지 버블
│           │   ├── TranslationButton.tsx       # 번역 요청 버튼
│           │   ├── TranslationResult.tsx       # 번역 결과 인라인 표시
│           │   ├── MessageActionSheet.tsx      # 롱프레스 액션 시트
│           │   ├── QuickCreateForm.tsx         # 빠른 생성 폼
│           │   ├── CardMenu.tsx                # 🆕 카드뷰 메뉴 공통 컴포넌트
│           │   └── WebViewContainer.tsx        # 🆕 웹뷰 컨테이너 공통 컴포넌트
│           └── plugins/
│               ├── push.ts                    # FCM/APNs 푸시
│               └── biometrics.ts              # 생체인증 잠금
├── packages/
│   ├── types/            ← 공유 (모바일 DTO 타입 추가)
│   ├── common/           ← 공유
│   └── mobile-shared/    ← 🆕 모바일 전용 공유 유틸
│       ├── hooks/        # useTranslationCache 등
│       └── services/     # translation-cache.service.ts
```

### 4.2 기술 선택 근거

| 기술 | 선택 | 근거 |
|------|------|------|
| **모바일 프레임워크** | Capacitor | React 코드 재사용 극대화, 기존 팀 기술 스택 일치, 네이티브 플러그인 접근 |
| **UI 프레임워크** | React + TailwindCSS | 기존 웹 프론트엔드와 동일, 학습 비용 제로 |
| **상태 관리** | Zustand + React Query | 기존 패턴 재사용 |
| **푸시 알림** | FCM (Android) + APNs (iOS) | Capacitor Push 플러그인 기본 지원 |
| **인증 저장** | @capacitor/secure-storage | 네이티브 키체인/키스토어 활용 |
| **오프라인** | Capacitor SQLite + Queue | 오프라인 메시지 큐 + 재전송 |

---

## 5. 사용자 플로우

### 5.1 메시지 발송 + 선택 번역 플로우

#### 5.1.1 작성 시 번역 포함 전송

```
사용자(한국어) → 메시지 입력 → [번역 포함 전송 ☑ EN] → [전송]
    ↓
모바일 앱 → POST /talk/channels/{id}/messages
             body: { content: "원문", translate_to: "en" }
    ↓
NestJS API:
  1. amb_talk_messages에 원문 저장
  2. Claude AI로 EN 번역 생성
  3. amb_talk_message_translations에 번역 저장 (캐싱)
  4. SSE: message:new 브로드캐스트 (번역 포함)
  5. 오프라인 멤버에게 푸시 알림 발송
    ↓
수신자: 원문 + 번역(EN)이 함께 표시됨
```

#### 5.1.2 읽을 때 번역 요청

```
수신자(한국인) → 베트남어 메시지 수신 → [🌐 번역] 버튼 클릭 → [KO] 선택
    ↓
모바일 앱 → POST /talk/messages/{msgId}/translate
             body: { target_lang: "ko" }
    ↓
NestJS API:
  1. amb_talk_message_translations에서 캐시 조회 (msg_id + lang)
     ├─ 캐시 HIT → 저장된 번역 즉시 반환
     └─ 캐시 MISS → Claude AI 번역 → 결과 저장 → 반환
    ↓
수신자: 메시지 하단에 번역 인라인 표시
→ 이후 같은 메시지+언어 재요청 시 캐시에서 즉시 표시
```

### 5.2 메시지 → 할일 변환 플로우

```
사용자 → 메시지 롱프레스 → 액션 시트 → "할일로 만들기"
    ↓
QuickCreateForm:
  - 제목: 메시지 내용 자동 채움 (50자 이내)
  - 마감일: 날짜 선택
  - 채널: 현재 채널 자동 연결
    ↓
POST /api/v1/todos (기존 API 재사용)
    ↓
할일 탭에 즉시 반영
```

### 5.3 업무도구/업무모듈 웹뷰 접근 플로우

```
사용자 → ② 업무도구 탭 → 카드뷰 메뉴에서 "할일" 카드 탭
    ↓
WebViewContainer 열림:
  - URL: https://{환경별 도메인}/todos (모바일 반응형 웹 페이지)
  - JWT 토큰: Secure Storage → WebView Cookie 또는 Authorization 헤더 주입
  - 뒤로가기: 카드뷰 메뉴로 복귀
    ↓
사용자: 기존 웹 UI를 모바일 화면에서 그대로 사용
```

```
사용자 → ③ 업무모듈 탭 → 카드뷰 메뉴에서 "HR 관리" 카드 탭
    ↓
WebViewContainer 열림:
  - URL: https://{환경별 도메인}/hr (모바일 반응형 웹 페이지)
  - 동일한 인증 주입 방식
```

```
사용자 → ④ 사이트 탭
    ↓
WebViewContainer 열림:
  - URL: 아메바매니지먼트 포탈 웹사이트 URL
  - 포탈 사이트를 앱 내 웹뷰로 탐색
```

### 5.4 앱 로그인 플로우

```
앱 실행 → 생체인증 확인 (있으면)
    ↓
저장된 JWT 토큰 확인:
  - 유효: 자동 로그인 → 채팅 탭
  - 만료: 로그인 화면 → 이메일/비밀번호 입력
    ↓
POST /api/v1/auth/login (기존 API)
    ↓
JWT 토큰 → Secure Storage 저장
    ↓
POST /push/register (디바이스 토큰 등록)
    ↓
채팅 탭 (메인 화면)
```

---

## 6. 기술 제약사항 및 리스크

### 6.1 기술 제약

| 제약 | 설명 | 대응 |
|------|------|------|
| **SSE 백그라운드** | 모바일 앱이 백그라운드일 때 SSE 연결 끊김 | 푸시 알림으로 보완 + 앱 복귀 시 재연결 + 미수신 메시지 동기화 |
| **번역 지연** | Claude AI 번역에 1-3초 소요 | 사용자 선택 방식이므로 로딩 스피너 표시 → 완료 시 인라인 추가 |
| **오프라인 지원** | 네트워크 불안정 환경 | 메시지 큐 + SQLite 로컬 캐시 + 재전송 메커니즘 |
| **파일 크기** | 모바일 네트워크에서 대용량 파일 | 이미지 자동 압축 + 파일 크기 제한 (10MB) |
| **배터리 소모** | SSE 상시 연결 + 하트비트 | 적응형 하트비트 (포그라운드: 30초, 백그라운드: 비활성) |
| **웹뷰 인증** | 웹뷰에서 JWT 인증 세션 유지 필요 | Secure Storage 토큰 → WebView Cookie 또는 Header 주입 |
| **웹뷰 반응형** | 기존 PC 웹 페이지가 모바일 화면에 맞지 않을 수 있음 | 주요 업무 페이지 모바일 반응형 CSS 대응 필요 |
| **웹뷰 성능** | 무거운 PC 페이지는 모바일 웹뷰에서 느릴 수 있음 | 모바일 웹뷰 접근 시 경량 모드 또는 주요 기능만 표시 |
| **앱 심사** | iOS App Store / Google Play 심사 | Capacitor 가이드라인 준수, 최소 2주 심사 기간 고려. iOS는 앱 내 웹뷰 비율이 높으면 리젝 가능성 — 채팅 탭의 네이티브 구현이 핵심 |

### 6.2 사이드 임팩트

| 영향 영역 | 영향 내용 | 심각도 |
|-----------|-----------|--------|
| **백엔드 부하** | 모바일 사용자 추가 → API/SSE 연결 수 증가 | 🟡 중간 |
| **번역 비용** | 사용자 선택 번역 → 자동 번역 대비 호출량 낮지만 캐싱 전략 여전히 중요 | 🟡 중간 |
| **DB 용량** | 번역 캐시 테이블 → 메시지 수 × 2-3배 (언어 수) | 🟡 중간 |
| **기존 웹 앱** | 영향 최소 — 동일 API 공유, 신규 기능은 모바일 전용 | 🟢 낮음 |
| **packages/types** | 모바일 전용 타입 추가 — 기존 타입 변경 없음 | 🟢 낮음 |

### 6.3 번역 비용 최적화 전략

| 전략 | 설명 |
|------|------|
| 캐시 우선 | 동일 메시지+언어는 `amb_talk_message_translations`에서 캐시 반환 (API 호출 0) |
| 사용자 선택 | 자동 번역이 아닌 사용자 요청 시에만 번역 → 불필요한 번역 방지 |
| SHA-256 해시 | 원문 변경 감지 → 메시지 수정 시 구버전 번역 무효화 |
| 언어 감지 | 원문 언어와 요청 언어가 같으면 번역 생략 |
| 할당량 관리 | `amb_entity_api_quotas` 테이블로 법인별 API 사용량 제한 |

---

## 7. 구현 우선순위 로드맵

### Phase 1 (6주) — 로비챗 MVP

| 순서 | 작업 | 예상 규모 |
|------|------|-----------|
| 1 | Capacitor 프로젝트 셋업 + 앱 쉘 (5탭 레이아웃) | M |
| 2 | 로그인 (JWT + Secure Storage) | M |
| 3 | 채널 목록 + DM 목록 UI | L |
| 4 | 대화 화면 (메시지 송수신 + SSE) | XL |
| 5 | `amb_talk_message_translations` 테이블 + API 확장 | L |
| 6 | 사용자 선택 번역 (작성 시 번역 + 읽을 때 번역 + 캐싱) | L |
| 7 | 푸시 알림 (FCM/APNs) | L |

### Phase 2 (3주) — 업무도구/모듈 웹뷰 + 업무 변환

| 순서 | 작업 | 예상 규모 |
|------|------|-----------|
| 1 | WebViewContainer 공통 컴포넌트 (인증 주입, 네비게이션) | M |
| 2 | 업무도구 탭 — 카드뷰 메뉴 + 웹뷰 연결 (할일/노트/이슈) | M |
| 3 | 업무모듈 탭 — 카드뷰 메뉴 + 웹뷰 연결 (HR/회계/KMS 등) | M |
| 4 | 사이트 탭 — 아메바 포탈 웹뷰 바로가기 | S |
| 5 | 메시지 → 할일/노트/이슈 변환 액션 (MessageActionSheet) | M |
| 6 | 기존 웹 모바일 반응형 기본 대응 (주요 페이지) | L |

### Phase 3 (3주) — 완성도

| 순서 | 작업 | 예상 규모 |
|------|------|-----------|
| 1 | 더보기 탭 (공지, 스케줄, AI 에이전트) | M |
| 2 | 오프라인 메시지 큐 + 재전송 | L |
| 3 | 생체인증 앱 잠금 | S |
| 4 | 앱스토어 배포 준비 (iOS/Android) | M |

---

## 8. 결론

### 8.1 핵심 판단

1. **백엔드 재사용률 90% 이상** — 기존 25+ 채팅 API, 할일/노트/이슈 API를 그대로 사용. 신규 개발은 번역 캐시 테이블, 푸시 알림 서비스 정도.

2. **채팅만 네이티브, 나머지는 웹뷰** — 로비챗은 모바일 최적화 네이티브 UI로 구현하되, 업무도구(할일/노트/이슈)와 업무모듈(HR/회계/KMS 등)은 카드뷰 메뉴에서 웹뷰로 기존 웹 페이지에 접근. 이를 통해 프론트엔드 신규 개발 범위를 대폭 축소.

3. **사용자 선택 번역 + 캐싱** — 자동 번역이 아닌 사용자 선택 방식으로 번역 비용을 통제. 작성 시 번역 포함 전송, 읽을 때 번역 요청 두 가지 방식 제공. 한번 번역된 메시지는 `amb_talk_message_translations`에 저장하여 재사용.

4. **Capacitor 선택 적합** — React + TypeScript 기존 스택과 완벽 호환, 네이티브 푸시/생체인증 플러그인 + WebView 컨테이너 사용 가능, 팀 학습 비용 최소화.

5. **웹뷰 접근을 위한 모바일 반응형 대응 필요** — 기존 PC 웹 페이지들이 모바일 웹뷰에서 정상 표시되려면 주요 페이지의 반응형 레이아웃 대응이 선행되어야 함. 이는 Phase 2에서 병행 처리.

6. **메뉴 권한 100% 재사용** — 기존 4계층 메뉴 권한 시스템(역할/Unit/사용자/Cell)을 모바일에서 그대로 사용. `GET /settings/permissions/me` API 하나로 접근 가능 메뉴를 받아 카드뷰를 동적 렌더링. 어드민이 웹에서 설정한 권한이 모바일에 즉시 반영되므로 별도 모바일 권한 관리 불필요.

7. **포탈 사이트 바로가기** — 아메바매니지먼트 포탈 웹사이트를 앱 내 웹뷰로 접근하여 별도 브라우저 전환 없이 이용 가능.
