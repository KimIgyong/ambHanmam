# AMB Management - 프로젝트 개요서

> **문서 버전**: 1.0.0
> **작성일**: 2026-02-14
> **상태**: 현행

---

## 1. 프로젝트 소개

**AMB Management**는 아메바(Amoeba) 회사의 9개 부서별 전문 AI 에이전트 시스템과 통합 업무 관리 플랫폼입니다.

각 부서(경영, 회계, 인사, 법무, 영업, IT, 마케팅, 총무, 기획)에 특화된 AI 에이전트가 SSE(Server-Sent Events) 기반 실시간 스트리밍 대화를 지원하며, 할일 관리, 회의록, 근무 일정, 공지사항 등의 업무 기능을 통합 제공합니다.

---

## 2. 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| **Frontend** | React + TypeScript + TailwindCSS + Vite | 18.2 / 5.4 / 3.4 / 5.2 |
| **Backend** | NestJS + TypeORM + PostgreSQL | 10.3 / 0.3 / 15 |
| **AI** | Anthropic Claude API (`@anthropic-ai/sdk`) | claude-sonnet-4-5 |
| **실시간 통신** | SSE (Server-Sent Events) | — |
| **상태 관리** | Zustand (전역) + React Query (서버) | 4.5 / 5.28 |
| **인증** | JWT + Passport (Access 15m / Refresh 7d) | — |
| **다국어** | i18next (EN / KO / VI) | 25.8 |
| **모노레포** | npm workspaces + Turborepo | 2.8 |
| **리치 텍스트** | Tiptap Editor | 3.19 |

---

## 3. 프로젝트 구조

```
ambManagement/
├── apps/
│   ├── api/                    # NestJS 백엔드 (포트 3009)
│   │   └── src/
│   │       ├── domain/         # 비즈니스 도메인 모듈 (10개)
│   │       ├── global/         # 공통 가드/필터/인터셉터/데코레이터
│   │       └── infrastructure/ # 외부 서비스 (Claude AI, Mail, File)
│   │
│   └── web/                    # React 프론트엔드 (포트 5179)
│       └── src/
│           ├── domain/         # 도메인별 페이지/컴포넌트/훅
│           ├── components/     # 공통 컴포넌트
│           ├── layouts/        # 레이아웃 (Main, Sub, Auth)
│           ├── router/         # React Router 설정
│           └── locales/        # i18n 번역 파일 (en, ko, vi)
│
├── packages/
│   ├── types/                  # 공유 TypeScript 타입
│   └── common/                 # 공유 상수/유틸리티
│
├── env/                        # 환경 변수 (.env.development)
├── docker/                     # Docker 설정 (PostgreSQL)
├── docs/                       # 문서
└── reference/                  # 참고 문서 및 가이드
```

---

## 4. 도메인 모듈 현황

### 4.1 백엔드 모듈 (apps/api/src/domain)

| 모듈 | 엔티티 | API 경로 | 주요 기능 |
|------|--------|----------|----------|
| **auth** | `amb_users` | `/api/v1/auth` | 로그인, 회원가입, 토큰 갱신 (JWT) |
| **agent** | — | `/api/v1/agents` | 9개 부서 AI 에이전트 정보 조회 |
| **chat** | `amb_conversations`, `amb_messages` | `/api/v1/conversations` | 대화 CRUD, SSE 스트리밍 메시지 전송 |
| **todo** | `amb_todos` | `/api/v1/todos` | 할일 CRUD (상태: SCHEDULED/IN_PROGRESS/COMPLETED) |
| **meeting-notes** | `amb_meeting_notes` | `/api/v1/meeting-notes` | 회의록 CRUD (공개범위: PRIVATE/DEPARTMENT/PUBLIC) |
| **work-schedule** | `amb_work_schedules` | `/api/v1/work-schedules` | 근무 일정 관리 (출근/원격/반차/휴가) |
| **notices** | `amb_notices`, `amb_notice_attachments`, `amb_notice_reads` | `/api/v1/notices` | 공지사항 CRUD, 파일 첨부, 조회수, 읽음 추적 |
| **members** | `amb_groups`, `amb_user_groups` | `/api/v1/members`, `/api/v1/groups` | 멤버/그룹 관리, 역할 변경 |
| **settings** | `amb_api_keys`, `amb_smtp_settings`, `amb_menu_permissions` | `/api/v1/api-keys`, `/api/v1/smtp-settings`, `/api/v1/menu-permissions` | API 키 관리 (AES-256-GCM 암호화), SMTP, 메뉴 권한 |
| **invitation** | `amb_invitations` | `/api/v1/invitations` | 이메일 초대, 토큰 검증, 상태 관리 |

### 4.2 인프라 모듈 (apps/api/src/infrastructure)

| 모듈 | 설명 |
|------|------|
| **claude** | Anthropic Claude API 연동 (스트리밍/비스트리밍, Mock 모드 지원) |
| **mail** | Nodemailer 기반 이메일 발송 (SMTP 설정은 DB 관리) |
| **file** | 파일 업로드/다운로드 (Multer, UUID 파일명, 로컬 저장) |

### 4.3 프론트엔드 모듈 (apps/web/src/domain)

| 모듈 | 페이지 | 주요 컴포넌트 |
|------|--------|------------|
| **auth** | LoginPage, RegisterPage | — |
| **dashboard** | DashboardPage | 어제 완료 할일, 오늘 할일, 최근 공지, 아메바톡 |
| **chat** | ChatPage | MessageList, MessageInput (SSE 스트리밍) |
| **agents** | AgentsPage | 9개 부서 에이전트 카드 |
| **todos** | TodoPage | 할일 목록/필터/생성/수정 |
| **meeting-notes** | MeetingNotesPage, MeetingNoteDetailPage | RichTextEditor (Tiptap) |
| **work-schedule** | WorkSchedulePage | 팀 테이블 뷰, ScheduleFormModal, WeekBulkFormModal |
| **notices** | NoticesPage, NoticeDetailPage | NoticeCard, NoticeFormModal (파일 첨부) |
| **members** | MemberManagementPage | MemberListTab, GroupListTab, InvitationListTab |
| **settings** | SettingsPage, ApiKeyManagementPage, SmtpSettingsPage, MenuPermissionsPage | ApiKeyCard, ApiKeyFormModal |
| **amoeba-talk** | AmoebaTalkPage | 전체 부서 통합 채팅 |

---

## 5. 라우터 구조

```
/                          → DashboardPage
├── /todos                 → TodoPage
├── /agents                → AgentsPage
├── /meeting-notes         → MeetingNotesPage
├── /meeting-notes/:id     → MeetingNoteDetailPage
├── /amoeba-talk           → AmoebaTalkPage
├── /work-schedule         → WorkSchedulePage
├── /notices               → NoticesPage
├── /notices/:id           → NoticeDetailPage
├── /settings              → SettingsPage
├── /settings/api-keys     → ApiKeyManagementPage      (ADMIN)
├── /settings/members      → MemberManagementPage      (MANAGER+)
├── /settings/smtp         → SmtpSettingsPage           (ADMIN)
├── /settings/permissions  → MenuPermissionsPage        (ADMIN)
└── /chat/:department      → SubMenuLayout → ChatPage
    └── /:conversationId   → ChatPage

/login                     → LoginPage                  (Public)
/register                  → RegisterPage               (Public)
```

---

## 6. 사이드바 메뉴

| 순서 | 메뉴 코드 | 라벨 (KO) | 아이콘 | 경로 | 색상 |
|------|----------|----------|--------|------|------|
| 1 | TODO | 할일 | CheckSquare | /todos | green |
| 2 | AGENTS | AI 에이전트 | Bot | /agents | indigo |
| 3 | MEETING_NOTES | 회의록 | FileText | /meeting-notes | amber |
| 4 | AMOEBA_TALK | 아메바톡 | MessageCircle | /amoeba-talk | blue |
| 5 | WORK_SCHEDULE | 근무 일정 | CalendarDays | /work-schedule | cyan |
| 6 | NOTICES | 공지사항 | Megaphone | /notices | amber |
| — | SETTINGS | 설정 | Settings | /settings | gray |

메뉴 접근 권한은 `amb_menu_permissions` 테이블에서 역할(ADMIN/MANAGER/USER)별로 관리됩니다.

---

## 7. 데이터베이스 설계

### 7.1 네이밍 규칙

- **테이블명**: `amb_` prefix + snake_case 복수형 (예: `amb_users`)
- **컬럼명**: 3자 prefix + snake_case (예: `usr_email`, `cvs_title`)
- **PK**: `{prefix}_id` (UUID, auto-generated)
- **Soft Delete**: `{prefix}_deleted_at` (nullable timestamp)
- **Sync**: TypeORM `synchronize: true` (개발 환경)

### 7.2 테이블 목록

| 테이블 | Prefix | PK | 설명 |
|--------|--------|-----|------|
| `amb_users` | usr | usr_id | 사용자 |
| `amb_conversations` | cvs | cvs_id | 대화 |
| `amb_messages` | msg | msg_id | 메시지 |
| `amb_todos` | tdo | tdo_id | 할일 |
| `amb_meeting_notes` | mtn | mtn_id | 회의록 |
| `amb_work_schedules` | wks | wks_id | 근무 일정 |
| `amb_notices` | ntc | ntc_id | 공지사항 |
| `amb_notice_attachments` | nta | nta_id | 공지 첨부파일 |
| `amb_notice_reads` | ntr | ntr_id | 공지 읽음 기록 |
| `amb_groups` | grp | grp_id | 그룹 |
| `amb_user_groups` | ugr | ugr_id | 사용자-그룹 연결 |
| `amb_api_keys` | apk | apk_id | API 키 (AES-256-GCM 암호화) |
| `amb_smtp_settings` | sms | sms_id | SMTP 설정 |
| `amb_menu_permissions` | mpm | mpm_id | 메뉴 권한 |
| `amb_invitations` | inv | inv_id | 초대 |

---

## 8. 인증/인가 시스템

### 8.1 JWT 인증

| 항목 | 값 |
|------|-----|
| Access Token 유효기간 | 15분 |
| Refresh Token 유효기간 | 7일 |
| 비밀번호 해싱 | bcrypt (salt rounds: 12) |
| 서명 알고리즘 | HS256 |

### 8.2 역할 기반 접근 제어 (RBAC)

역할 계층: **USER** (1) < **MANAGER** (2) < **ADMIN** (3)

| 데코레이터 | 용도 |
|-----------|------|
| `@Public()` | 인증 불필요 (로그인/회원가입) |
| `@CurrentUser()` | 요청 사용자 정보 주입 |
| `@Roles('ADMIN')` | 지정 역할 이상만 접근 허용 |
| `AdminGuard` | ADMIN 전용 (공지사항 CRUD 등) |
| `RolesGuard` | 역할 검증 가드 |

### 8.3 Rate Limiting

| 엔드포인트 | 제한 |
|-----------|------|
| 인증 (로그인) | 5회/분 |
| 인증 (회원가입) | 3회/분 |
| 일반 API | 60회/분 |

---

## 9. 글로벌 설정 (apps/api/src/global)

### 9.1 에러 코드 체계

| 범위 | 도메인 | 예시 |
|------|--------|------|
| E1xxx | 인증/인가 | E1001: 잘못된 인증 정보 |
| E2xxx | 사용자 | E2001: 사용자 미발견 |
| E3xxx | 대화 | E3001: 대화 미발견 |
| E4xxx | 에이전트 | E4001: 에이전트 미발견 |
| E5xxx | API 키 | E5001: API 키 미발견 |
| E6xxx | 초대 | E6001: 초대 미발견 |
| E7xxx | 그룹 | E7001: 그룹 미발견 |
| E8xxx | SMTP/메뉴 권한 | E8001: SMTP 설정 미발견 |
| E9xxx | 시스템 | E9001: 내부 서버 오류 |
| E10xxx | 할일 | E10001: 할일 미발견 |
| E11xxx | 회의록 | E11001: 회의록 미발견 |
| E12xxx | 근무 일정 | E12001: 일정 미발견 |
| E13xxx | 공지사항 | E13001: 공지 미발견 |

### 9.2 API 응답 표준

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-02-14T12:00:00.000Z"
}
```

에러 시:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "E1001", "message": "Invalid credentials" },
  "timestamp": "2026-02-14T12:00:00.000Z"
}
```

### 9.3 DTO 규칙

- **Request DTO**: `snake_case` (예: `is_pinned`, `due_date`)
- **Response DTO**: `camelCase` (예: `isPinned`, `dueDate`)

---

## 10. AI 에이전트 시스템

### 10.1 9개 부서 에이전트

| 코드 | 부서 (KO) | 부서 (EN) |
|------|----------|----------|
| MANAGEMENT | 경영 | Management |
| ACCOUNTING | 회계 | Accounting |
| HR | 인사 | Human Resources |
| LEGAL | 법무 | Legal |
| SALES | 영업 | Sales |
| IT | IT | Information Technology |
| MARKETING | 마케팅 | Marketing |
| GENERAL_AFFAIRS | 총무 | General Affairs |
| PLANNING | 기획 | Planning |

### 10.2 아키텍처

```
BaseAgentService (추상 클래스)
├── ManagementAgentService
├── AccountingAgentService
├── HRAgentService
├── LegalAgentService
├── SalesAgentService
├── ITAgentService
├── MarketingAgentService
├── GeneralAffairsAgentService
└── PlanningAgentService

AgentFactoryService → 부서 코드로 올바른 에이전트 인스턴스 반환
```

### 10.3 대화 흐름 (SSE 스트리밍)

```
1. 클라이언트 → POST /api/v1/conversations/{id}/messages (content)
2. 서버 → Claude API 스트리밍 요청 (부서별 시스템 프롬프트 + 언어 설정)
3. 서버 → SSE로 청크 단위 응답 전송 (text/event-stream)
4. 클라이언트 → 실시간 렌더링
5. 완료 시 → 메시지 DB 저장, 토큰 카운팅
```

### 10.4 언어별 응답

`Accept-Language` 헤더에 따라 시스템 프롬프트에 언어 지시 추가:
- `en` → "Always respond in English."
- `ko` → "항상 한국어로 응답합니다."
- `vi` → "Luôn phản hồi bằng tiếng Việt."

---

## 11. 다국어 지원 (i18n)

### 11.1 지원 언어

| 코드 | 언어 | 기본값 |
|------|------|-------|
| en | English | O (fallback) |
| ko | 한국어 | — |
| vi | Tiếng Việt | — |

### 11.2 네임스페이스 (12개)

`common`, `auth`, `chat`, `settings`, `dashboard`, `departments`, `members`, `todos`, `meetingNotes`, `agents`, `workSchedule`, `notices`

### 11.3 규칙

- 프론트엔드 UI 텍스트는 **반드시** `t()` 함수 사용 (하드코딩 금지)
- 백엔드 에러 메시지는 영어 고정 (프론트에서 에러 코드 기반 번역)
- 언어 설정은 `localStorage('amb-lang')`에 저장

---

## 12. 파일 업로드

| 항목 | 값 |
|------|-----|
| 저장 방식 | 로컬 디스크 (`apps/api/uploads/`) |
| 파일명 | UUID 기반 |
| 최대 크기 | 10MB |
| 최대 개수 | 공지당 5개 |
| 허용 이미지 | jpeg, png, gif, webp |
| 허용 문서 | pdf, doc, docx, xls, xlsx, ppt, pptx |
| 서빙 경로 | `GET /api/v1/files/:filename` |

---

## 13. 개발 환경

### 13.1 실행 명령어

```bash
npm run db:up       # PostgreSQL Docker 실행
npm run dev         # API(3009) + Web(5179) 동시 실행
npm run build       # 전체 빌드
npm run lint        # 린트 검사
```

### 13.2 환경 변수

**Backend** (`env/backend/.env.development`):
- DB 접속 정보 (host, port, username, password, database)
- JWT 시크릿 및 토큰 만료 시간
- Claude API 키
- API 키 암호화 시크릿 (32바이트)
- CORS 허용 도메인
- SMTP 설정

**Frontend** (`env/frontend/.env.development`):
- `VITE_API_BASE_URL=http://localhost:3019/api/v1`

### 13.3 Docker

```bash
# PostgreSQL 15 컨테이너
docker-compose -f docker/docker-compose.dev.yml up -d
# 컨테이너명: amb-postgres
# 포트: 5442
# DB: db_amb / 사용자: amb_user
```

---

## 14. 코드 컨벤션 요약

| 영역 | 규칙 |
|------|------|
| 컴포넌트 파일 | PascalCase (`ChatPage.tsx`) |
| 서비스 파일 | kebab-case (`.service.ts`) |
| 훅 파일 | `use` + PascalCase (`useChat.ts`) |
| DB 테이블 | `amb_` + snake_case 복수형 |
| DB 컬럼 | 3자 prefix + snake_case |
| Request DTO | snake_case |
| Response DTO | camelCase |
| API 경로 | `/api/v1/{resource}` (kebab-case) |
| 에러 코드 | `E{도메인코드}{순번}` (예: E13001) |
