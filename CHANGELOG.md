# Changelog

All notable changes to the AMB Management project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-14

### Added (추가)

- **Todo Management**: Personal todo CRUD with status tracking (SCHEDULED/IN_PROGRESS/COMPLETED), date filtering, tag support (할일 관리 — 상태 추적, 날짜 필터, 태그)
- **Meeting Notes**: Rich text meeting notes with Tiptap editor, visibility scope (PRIVATE/DEPARTMENT/PUBLIC), PDF export support (회의록 — 리치텍스트, 공개범위, PDF 내보내기)
- **Work Schedule**: Team schedule table view, individual schedule registration, bulk week registration, schedule types (WORK/REMOTE/DAY_OFF/AM_HALF/PM_HALF) (근무 일정 — 팀 테이블 뷰, 일정 유형 관리)
- **Notices**: Admin-only notice CRUD with rich text content, file attachments (up to 5 files, 10MB each), pin to top, view count tracking, read tracking, visibility scope (PUBLIC/DEPARTMENT) (공지사항 — 파일 첨부, 상단 고정, 조회수, 읽음 추적)
- **File Upload Infrastructure**: Multer-based file upload with UUID naming, local disk storage, MIME type validation, static file serving at `/api/v1/files/:filename` (파일 업로드 인프라 — Multer, UUID 파일명, 로컬 저장)
- **Settings Module**: API key management with AES-256-GCM encryption, SMTP settings management, menu permission management per role (설정 — API 키 암호화, SMTP 설정, 메뉴 권한)
- **Member Management**: User listing, role change (ADMIN only), group CRUD, group member management (멤버 관리 — 역할 변경, 그룹 CRUD)
- **Invitation System**: Email-based invitation with token validation, role/department/group assignment, status tracking (PENDING/ACCEPTED/CANCELLED/EXPIRED), Nodemailer integration (초대 시스템 — 이메일 초대, 토큰 검증)
- **Amoeba Talk**: Cross-department integrated chat page (아메바톡 — 전체 부서 통합 채팅)
- **Dashboard Enhancement**: Yesterday completed todos, today's tasks, recent notices (API-backed), recent Amoeba Talk (대시보드 강화 — 어제 완료, 오늘 할일, 최근 공지 API 연동)
- **Sidebar Navigation**: Dynamic menu with permission-based access control (TODO, AGENTS, MEETING_NOTES, AMOEBA_TALK, WORK_SCHEDULE, NOTICES, SETTINGS) (사이드바 — 권한 기반 메뉴 접근 제어)
- **Role-Based Access Control**: Three-tier role hierarchy (USER < MANAGER < ADMIN) with RolesGuard, AdminGuard, @Roles decorator (역할 기반 접근 제어 — 3단계 역할 계층)
- **i18n Enhancement**: 12 namespaces (common, auth, chat, settings, dashboard, departments, members, todos, meetingNotes, agents, workSchedule, notices), Vietnamese language added (다국어 — 12개 네임스페이스, 베트남어 추가)
- **Rich Text Editor**: Tiptap-based editor shared between meeting notes and notices (리치텍스트 에디터 — Tiptap 기반, 회의록/공지 공유)

### Changed (변경)

- **Dashboard**: Replaced sample announcements with real API data via `useRecentNotices(5)` (대시보드 — 샘플 공지를 실제 API 데이터로 교체)
- **User Roles**: Extended from USER/ADMIN to USER/MANAGER/ADMIN hierarchy (사용자 역할 — MANAGER 역할 추가)

### Database (데이터베이스)

New tables added (총 15개 테이블):
- `amb_todos` — 할일
- `amb_meeting_notes` — 회의록
- `amb_work_schedules` — 근무 일정
- `amb_notices` — 공지사항
- `amb_notice_attachments` — 공지 첨부파일
- `amb_notice_reads` — 공지 읽음 기록
- `amb_groups` — 그룹
- `amb_user_groups` — 사용자-그룹 연결
- `amb_api_keys` — API 키 (AES-256-GCM 암호화)
- `amb_smtp_settings` — SMTP 설정
- `amb_menu_permissions` — 메뉴 권한
- `amb_invitations` — 초대

---

## [1.0.0] - 2026-02-14

### Added (추가)

- **Authentication**: JWT-based login, registration, token refresh with bcrypt password hashing (JWT 인증 — 로그인, 회원가입, 토큰 갱신)
- **9 Department AI Agents**: Management, Accounting, HR, Legal, Sales, IT, Marketing, General Affairs, Planning — each with specialized system prompts (9개 부서별 전문 AI 에이전트)
- **SSE Streaming**: Real-time AI response streaming via Server-Sent Events (SSE 실시간 스트리밍 응답)
- **Conversation Management**: Create, list (with pagination), detail, delete (soft delete) conversations (대화 관리 CRUD)
- **Message History**: Ordered message storage with role tracking (user/assistant) and token counting (메시지 이력 관리)
- **Dashboard**: 9-department grid card layout for agent selection (부서 선택 대시보드)
- **Chat UI**: MessageList with markdown rendering, MessageInput with Shift+Enter support (채팅 UI)
- **Mock Mode**: Development mode when Claude API key is not configured (Mock 모드 — API 키 미설정 시)
- **Security**: Helmet, CORS, rate limiting (5/min auth, 60/min general) (보안 설정)
- **Infrastructure**: Docker Compose (PostgreSQL + Adminer), monorepo (npm workspaces + Turborepo) (인프라 설정)
- **i18n**: English, Korean, Vietnamese support with react-i18next (다국어 — 영어, 한국어, 베트남어)
- **SDLC Documentation**: Full analysis, design, implementation, and test documents per Amoeba Spec Generator v3.1 (SDLC 문서 체계)

### Technical Stack (기술 스택)

- Frontend: React 18 + TypeScript 5 + TailwindCSS 3 + Vite 5
- State: Zustand + React Query
- Backend: NestJS 10 + TypeORM + PostgreSQL 15
- AI: Anthropic Claude API (@anthropic-ai/sdk) — claude-sonnet-4-5-20250929
- Auth: Passport + JWT (15min access / 7d refresh)
