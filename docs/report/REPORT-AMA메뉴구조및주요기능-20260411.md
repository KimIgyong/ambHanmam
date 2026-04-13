# AMA 프로젝트 — 메뉴 구조 및 주요 기능 정리

**작성일:** 2026-04-11
**기준:** apps/web (AMA 메인) + apps/portal-web (Portal)
**소스 코드 기준:** `menu-config.service.ts`, `menu-code.constant.ts`, `router/index.tsx`

---

## 목차

1. [메뉴 구조 개요](#1-메뉴-구조-개요)
2. [업무도구 (Work Tools)](#2-업무도구-work-tools)
3. [업무모듈 (Work Modules)](#3-업무모듈-work-modules)
4. [커스텀 앱 (Custom Apps)](#4-커스텀-앱-custom-apps)
5. [AI 에이전트 채팅 (Chat)](#5-ai-에이전트-채팅-chat)
6. [하단 고정 메뉴](#6-하단-고정-메뉴)
7. [법인 설정 (Entity Settings)](#7-법인-설정-entity-settings)
8. [관리자 설정 (Admin Settings)](#8-관리자-설정-admin-settings)
9. [클라이언트 포탈](#9-클라이언트-포탈)
10. [파트너 포탈](#10-파트너-포탈)
11. [포탈 웹 (www.amoeba.site)](#11-포탈-웹-wwwamoebasite)
12. [역할별 메뉴 접근 권한](#12-역할별-메뉴-접근-권한)

---

## 1. 메뉴 구조 개요

AMA 사이드바는 **3개 카테고리**로 구성됩니다:

```
┌─────────────────────────────────┐
│  🏢 법인 선택 (Entity Selector)   │
├─────────────────────────────────┤
│  ■ 업무도구 (Work Tools)         │  ← 일상 업무 도구 (11개)
│    Today, Todo, Chat, Notes...   │
├─────────────────────────────────┤
│  ■ 업무모듈 (Work Modules)       │  ← 전문 업무 모듈 (10개)
│    회계, HR, 거래처, 메일...       │
├─────────────────────────────────┤
│  ■ 커스텀 앱 (Custom Apps)       │  ← 법인별 동적 앱
│    (Entity별 등록된 앱)            │
├─────────────────────────────────┤
│  👤 마이페이지                     │
│  🏢 법인 설정 (MASTER)            │
│  ⚙️ 설정 (ADMIN)                 │
└─────────────────────────────────┘
```

---

## 2. 업무도구 (Work Tools)

일상 업무에 사용하는 핵심 도구. `category: WORK_TOOL`

### 2.1 오늘의 미션 Today (`/today`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `TODAY` |
| **아이콘** | CalendarCheck |
| **도메인** | `today` |

**주요 기능:**
- 오늘의 미션 목록 — 미션 생성·완료·보류·삭제
- AI 분석 (Today AI Analysis) — 일일 업무 실행 결과 분석, 다음 업무 계획 연결
- 어제의 미션 체크 — 미완료 미션 자동 이월/피드백
- 달력 뷰 — 날짜별 미션 이력 조회
- 미션 → 태스크/이슈 전환 (업무 성장 흐름)

### 2.2 나의 할일 (`/todos`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `TODO` |
| **아이콘** | CheckSquare |
| **도메인** | `todos` |

**주요 기능:**
- 할일 CRUD (생성·수정·완료·삭제)
- 우선순위/상태/기한 관리
- 카테고리별 분류
- 반복 할일 설정
- Today 미션으로 등록 연동

### 2.3 AMA AI User Guide (`/agents`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `AGENTS` |
| **아이콘** | Bot |
| **도메인** | `agents` |

**주요 기능:**
- AI 에이전트 목록 (부서별 9개 에이전트)
- 에이전트별 기능 설명 및 사용 가이드
- 에이전트 대화 시작 바로가기

### 2.4 노트 (`/meeting-notes`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `MEETING_NOTES` |
| **아이콘** | FileText |
| **도메인** | `meeting-notes` |

**주요 기능:**
- 회의록/노트 작성 (Tiptap 리치텍스트 에디터)
- AI 자동 번역 (기본 번역 협업)
- 참가자 지정 및 공유
- 카테고리/태그 분류
- 검색 및 필터링

### 2.5 로비 채팅 (`/amoeba-talk`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `AMOEBA_TALK` |
| **아이콘** | MessageCircle |
| **도메인** | `amoeba-talk` |

**주요 기능:**
- 실시간 로비 채팅 (법인 전체 공개)
- 메시지 자동 번역 (글로벌 협업)
- 이미지/파일 첨부
- 메시지 검색

### 2.6 공지사항 (`/notices`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `NOTICES` |
| **아이콘** | Megaphone |
| **도메인** | `notices` |

**주요 기능:**
- 공지사항 작성·수정·삭제
- 공지 고정 (핀 기능)
- 자동 번역 지원
- 첨부파일 업로드
- 조회수 추적

### 2.7 드라이브 (`/drive`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `DRIVE` |
| **아이콘** | HardDrive |
| **도메인** | `drive` |

**주요 기능:**
- Google Drive 연동 (공유 드라이브)
- 폴더 탐색 및 파일 목록
- 파일 업로드/다운로드
- 법인별 드라이브 격리 (ent_id 기반)

### 2.8 이슈 (`/issues`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `ISSUES` |
| **아이콘** | AlertCircle |
| **도메인** | `issues` |

**주요 기능:**
- 이슈 CRUD + 상태 워크플로우 (NEW → IN_PROGRESS → RESOLVED → CLOSED)
- 칸반 보드 뷰
- 이슈 유형 (Bug, Feature, Task, Improvement)
- 담당자 배정, 우선순위 설정
- 프로젝트/마일스톤 연결
- AI 이슈 분석
- 외부 도구 연동 (Redmine, Asana, Slack)

### 2.9 프로젝트 (`/project`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `PROJECT_MANAGEMENT` |
| **아이콘** | Briefcase |
| **도메인** | `project` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 프로젝트 목록 | `/project/projects` | 프로젝트 생성·관리, 상태별 필터 |
| 프로젝트 상세 | `/project/projects/:id` | WBS 간트차트, 멤버 관리, 마일스톤, 이슈 연결 |
| 제안 목록 | `/project/proposals` | 프로젝트 제안서 관리 |
| 제안 작성 | `/project/proposals/new` | AI 지원 제안서 작성 |
| 제안 상세 | `/project/proposals/:id` | 제안서 상세·수정 |

### 2.10 캘린더 (`/calendar`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `CALENDAR` |
| **아이콘** | Calendar |
| **도메인** | `calendar` |

**주요 기능:**
- 월간/주간/일간 캘린더 뷰
- 일정 생성·수정·삭제
- 카테고리별 색상 구분
- 할일/미션/이슈 일정 통합 표시

### 2.11 출퇴근 (`/attendance`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `ATTENDANCE` |
| **아이콘** | CalendarDays |
| **도메인** | `attendance` |

**주요 기능:**
- 출근/퇴근 기록 (버튼 클릭)
- 월간 출퇴근 이력 조회
- 근무시간 자동 계산
- 지각/조퇴/결근 표시
- 법인별 출퇴근 정책 적용

---

## 3. 업무모듈 (Work Modules)

전문 업무를 위한 모듈. `category: MODULE`

### 3.1 회계 (`/accounting`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `ACCOUNTING` |
| **아이콘** | Landmark |
| **도메인** | `accounting` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 대시보드 | `/accounting/dashboard` | 재무 요약, 수입/지출 차트 |
| 계좌별 거래 | `/accounting/:accountId` | 거래 내역 조회·등록, 은행 명세서 매칭 |

- 계정과목 관리 (Chart of Accounts)
- 입출금 거래 기록
- 은행 명세서 업로드 및 자동 매칭
- 외화 거래 지원
- 월별/분기별 재무 리포트

### 3.2 인사관리 (`/hr`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `HR` |
| **아이콘** | Users |
| **도메인** | `hr` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 직원 목록 | `/hr/employees` | 직원 조회·등록·수정, 재직/퇴직 필터 |
| 직원 상세 | `/hr/employees/:id` | 인사정보, 급여, 계약, 이력 관리 |
| 프리랜서 | `/hr/freelancers` | 프리랜서 관리 |
| 사업소득 | `/hr/business-income` | 사업소득 내역 관리 |
| 연말정산 | `/hr/yearend` | 연말정산 관리 |
| 근태 | `/hr/timesheet` | 근태 기록·관리 |
| 야근관리 | `/hr/overtime` | 야근 시간 관리 |
| 휴가관리 | `/hr/leave` | 휴가 유형·잔여일 관리 |
| 휴가신청 관리 | `/hr/leave-requests` | 휴가 승인/거절 (관리자) |
| 급여 목록 | `/hr/payroll` | 급여 기간별 목록 |
| 급여 상세 | `/hr/payroll/:periodId` | 급여 명세서, 공제·수당 관리 |
| 퇴직금 | `/hr/severance` | 퇴직금 산정 |
| HR 리포트 | `/hr/reports` | 인사 통계 리포트 |
| HR 설정 | `/hr/settings` | 급여 항목, 공제율 등 설정 |

### 3.3 거래처 관리 (`/billing`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `BILLING` |
| **아이콘** | Receipt |
| **도메인** | `billing` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 대시보드 | `/billing/dashboard` | 청구/결제 현황 요약 |
| 거래처 | `/billing/partners` | 거래처 목록·등록·관리 |
| 거래처 상세 | `/billing/partners/:id` | 거래처 정보, 계약·인보이스 연결 |
| 계약 | `/billing/contracts` | 계약 목록·관리, 만기 알림 |
| 계약 상세 | `/billing/contracts/:id` | 계약 조건, SOW 연결 |
| SOW | `/billing/sow` | Statement of Work 관리 |
| 인보이스 | `/billing/invoices` | 인보이스 발행·관리 |
| 인보이스 상세 | `/billing/invoices/:id` | 인보이스 상세, PDF 생성 |
| 결제 | `/billing/payments` | 결제 내역 관리 |

### 3.4 웹메일 (`/mail`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `MAIL` |
| **아이콘** | Mail |
| **도메인** | `mail` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 받은편지함 | `/mail/inbox` | 수신 메일 목록 (IMAP 동기화) |
| 보낸편지함 | `/mail/sent` | 발신 메일 이력 |
| 임시보관함 | `/mail/drafts` | 임시 저장 메일 |
| 휴지통 | `/mail/trash` | 삭제 메일 |
| 메일 작성 | `/mail/compose` | 새 메일 작성 (Tiptap 에디터) |
| 메일 상세 | `/mail/message/:id` | 메일 읽기, 답장, 전달 |

- Postal 메일 서버 연동 (SMTP/IMAP)
- 자동 번역 지원
- 이메일 템플릿

### 3.5 지식관리 KMS (`/kms`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `KMS` |
| **아이콘** | Tags |
| **도메인** | `kms` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 문서 빌더 | `/kms/doc-builder` | AI 지원 문서 생성 |
| DDD | `/kms/ddd` | Domain-Driven Design 관리 |
| DDD 설정 | `/kms/ddd-settings` | DDD 설정 |
| 태그 클라우드 | `/kms/tag-cloud` | 태그 시각화 |
| 태그 관리 | `/kms/tags` | 태그 CRUD, Folksonomy |
| 지식 그래프 | `/kms/knowledge-graph` | 지식 관계 그래프 시각화 |
| AMB 그래프 | `/kms/amb-graph` | AMB 지식 그래프 |

- 업무 자산 축적 (미션 → 태스크 → 이슈 → KMS)
- 자동 태깅 (AI)
- 검색 (pgvector 벡터 + pg_trgm 텍스트)

### 3.6 서비스 관리 (`/admin/service`) — ADMIN 전용

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `SERVICE_MANAGEMENT` |
| **아이콘** | Building2 |
| **도메인** | `service-management` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 대시보드 | `/admin/service/dashboard` | 서비스 현황 요약 |
| 서비스 목록 | `/admin/service/services` | SaaS 서비스 관리 |
| 고객 관리 | `/admin/service/clients` | 고객사 관리 |
| 구독 관리 | `/admin/service/subscriptions` | 구독 상태·갱신·해지 |
| 요금제 | `/admin/service/priceplan` | 요금 플랜 설정 |

### 3.7 자산관리 (`/assets`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `ASSET_MANAGEMENT` |
| **아이콘** | Package |
| **도메인** | `asset` |

**주요 기능:**
- IT 자산/장비 등록·관리
- 자산 배정 및 반납 이력
- 자산 분류·검색

### 3.8 사이트관리 (`/admin/site`) — ADMIN 전용

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `SITE_MANAGEMENT` |
| **아이콘** | Globe |
| **도메인** | `site-management` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 사이트 메뉴 | `/admin/site/menus` | CMS 메뉴 구조 관리 |
| 페이지 목록 | `/admin/site/pages` | CMS 페이지 관리 |
| 페이지 편집 | `/admin/site/pages/:pageId` | 페이지 콘텐츠 편집 (Tiptap) |
| 분석 | `/admin/site/analytics` | 사이트 방문 통계 |
| GA 설정 | `/admin/site/ga-settings` | Google Analytics 연결 |

### 3.9 업무항목 (`/work-items`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `WORK_ITEMS` |
| **아이콘** | ClipboardList |
| **도메인** | `work-items` |

**주요 기능:**
- 업무 항목 통합 관리
- 상태별 필터링 (대기/진행/완료)

### 3.10 지출관리 (`/expense-requests`)

| 항목 | 내용 |
|------|------|
| **메뉴 코드** | `EXPENSE_REQUEST` |
| **아이콘** | Wallet |
| **도메인** | `expense-request` |

**주요 기능:**

| 하위 메뉴 | 경로 | 기능 |
|----------|------|------|
| 지출 목록 | `/expense-requests` | 지출 내역 목록 |
| 지출 신청 | `/expense-requests/new` | 지출 신청서 작성 |
| 지출 상세 | `/expense-requests/:id` | 지출 상세·승인·반려 |
| 월별 리포트 | `/expense-requests/reports/monthly` | 월간 지출 분석 |
| 예산 예측 | `/expense-requests/reports/forecast` | 예산 예측 리포트 |

---

## 4. 커스텀 앱 (Custom Apps)

사이드바 세 번째 섹션. 법인(Entity)별로 등록된 외부 앱을 동적으로 표시합니다.

| 항목 | 내용 |
|------|------|
| **라우트** | `/apps/:appCode` |
| **관리** | 법인 설정 → 커스텀 앱 / 앱스토어 |
| **연동** | ambAppStore (apps.amoeba.site) 또는 외부 URL |

**주요 기능:**
- 법인별 앱 등록·활성화·비활성화
- 앱스토어에서 앱 검색 및 설치
- 커스텀 앱 URL 직접 등록
- SSO Passthrough (AMA JWT 기반)

---

## 5. AI 에이전트 채팅 (Chat)

부서별 AI 에이전트와 대화하는 채팅 시스템.

| 항목 | 내용 |
|------|------|
| **라우트** | `/chat/:unit/:conversationId?` |
| **AI 엔진** | Anthropic Claude API |
| **통신** | SSE (Server-Sent Events) 스트리밍 |

### 부서별 에이전트

| Unit 경로 | 메뉴 코드 | 한국어 | 주요 역할 |
|-----------|-----------|--------|----------|
| `management` | `CHAT_MANAGEMENT` | 경영 | 경영 자문, 전략 분석 |
| `accounting` | `CHAT_ACCOUNTING` | 회계 | 회계 처리 가이드, 세무 상담 |
| `hr` | `CHAT_HR` | 인사 | HR 규정, 급여·복리후생 안내 |
| `legal` | `CHAT_LEGAL` | 법무 | 법률 검토, 계약서 분석 |
| `sales` | `CHAT_SALES` | 영업 | 영업 전략, 고객 관리 |
| `it` | `CHAT_IT` | IT | 기술 지원, 시스템 관리 |
| `marketing` | `CHAT_MARKETING` | 마케팅 | 마케팅 전략, 콘텐츠 기획 |
| `general-affairs` | `CHAT_GENERAL_AFFAIRS` | 총무 | 총무/시설 관리 |
| `planning` | `CHAT_PLANNING` | 기획 | 사업 기획, 프로젝트 계획 |

**주요 기능:**
- 부서별 전문 AI 에이전트 대화
- 대화 이력 저장·검색
- 대화 내용 자동 번역
- 파일 첨부 지원
- 대화 → 이슈/태스크 전환

---

## 6. 하단 고정 메뉴

사이드바 하단에 항상 표시되는 메뉴.

| 메뉴 | 라우트 | 아이콘 | 접근 조건 | 주요 기능 |
|------|--------|--------|----------|----------|
| 마이페이지 | `/my-page` | CircleUser | 모든 사용자 | 프로필 수정, 비밀번호 변경, 언어 설정, 알림 설정 |
| 내 휴가 | `/my-leave` | Palmtree | 모든 사용자 | 휴가 잔여일, 휴가 신청, 신청 이력 |
| 법인 설정 | `/entity-settings` | Building2 | `MASTER` 역할 | → [7. 법인 설정](#7-법인-설정-entity-settings) 참조 |
| 설정 | `/admin` | Settings | `ADMIN_LEVEL` | → [8. 관리자 설정](#8-관리자-설정-admin-settings) 참조 |

---

## 7. 법인 설정 (Entity Settings)

법인 관리자(`MASTER` 역할)가 소속 법인의 설정을 관리하는 영역.

| 메뉴 코드 | 라우트 | 한국어 | 아이콘 | 주요 기능 |
|-----------|--------|--------|--------|----------|
| `ENTITY_ORGANIZATION` | `/entity-settings/organization` | 조직 관리 | Building2 | 부서·팀 구조 관리, 조직도 |
| `ENTITY_MEMBERS` | `/entity-settings/members` | 구성원 | Users | 멤버 초대·관리, 역할 배정 |
| `ENTITY_CLIENT_MANAGEMENT` | `/entity-settings/clients` | 고객사 관리 | UserRoundPlus | 고객사 등록·관리, 프로젝트 배정 |
| `ENTITY_PERMISSIONS` | `/entity-settings/permissions` | 권한 | Shield | 메뉴별 역할 권한 설정 |
| `ENTITY_WORK_STATISTICS` | `/entity-settings/work-statistics` | 업무 통계 | Activity | 구성원별 업무 실적 통계 |
| `ENTITY_ACTIVITY_INDEX` | `/entity-settings/activity-index` | 활동 지수 | TrendingUp | 구성원 활동 지수 분석 |
| `ENTITY_ATTENDANCE_POLICY` | `/entity-settings/attendance-policy` | 출퇴근 정책 | Clock | 근무시간, 유연근무, 휴일 설정 |
| `ENTITY_EXTERNAL_CONNECT` | `/entity-settings/external-connect` | 외부연결설정 | Plug | 외부 서비스 연동 (Slack, Asana 등) |
| `ENTITY_USAGE` | `/entity-settings/usage` | 사용량 | BarChart3 | API/AI 사용량 모니터링 |
| `ENTITY_CUSTOM_APPS` | `/entity-settings/custom-apps` | 커스텀 앱 | AppWindow | 법인용 커스텀 앱 관리 |
| — | `/entity-settings/app-store` | 앱스토어 | Store | 앱 검색·설치 |
| `ENTITY_EMAIL_TEMPLATE` | `/entity-settings/email-templates` | 이메일 템플릿 | Mail | 법인 전용 이메일 템플릿 관리 |
| `ENTITY_SITE_CONFIG` | `/entity-settings/site-config` | 사이트 설정 | Settings2 | 법인 사이트 커스터마이징 |
| `ENTITY_USAGE` | `/entity-settings/subscription` | 구독 관리 | CreditCard | SaaS 구독 플랜·결제 관리 |

### 추가 하위 페이지

| 라우트 | 한국어 | 기능 |
|--------|--------|------|
| `/entity-settings/external-task-tools` | 외부 태스크 도구 | Redmine/Asana/Jira 연동 설정 |
| `/entity-settings/slack-integration` | Slack 연동 | Slack 웹훅·알림 설정 |
| `/entity-settings/asana-integration` | Asana 연동 | Asana 프로젝트 양방향 동기화 |

---

## 8. 관리자 설정 (Admin Settings)

HQ 관리자(`ADMIN_LEVEL`)가 전체 시스템을 관리하는 영역.

### 8.1 관리자 대시보드

- **라우트:** `/admin`
- **기능:** 전체 법인 현황, 사용자 통계, 시스템 상태 요약

### 8.2 사용자·조직 관리

| 메뉴 코드 | 라우트 | 한국어 | 기능 |
|-----------|--------|--------|------|
| `SETTINGS_USER_MANAGEMENT` | `/admin/user-management` | 법인 관리 | 법인(Entity) CRUD |
| `SETTINGS_TOTAL_USERS` | `/admin/total-users` | 전체 사용자 | 전체 사용자 조회·검색 |
| `SETTINGS_MEMBERS` | `/admin/members` | 멤버 관리 | 멤버 초대·역할 변경 |
| `SETTINGS_PERMISSIONS` | `/admin/permissions` | 접근권한 관리 | 전역 메뉴 권한 설정 |
| `SETTINGS_ENTITIES` | `/admin/entities` | 조직관리 | 법인 조직 구조 관리 |
| `UNITS` | `/admin/units` | Unit 관리 | 부서·유닛 관리 |

### 8.3 시스템 설정

| 메뉴 코드 | 라우트 | 한국어 | 기능 |
|-----------|--------|--------|------|
| `SETTINGS_API_KEYS` | `/admin/api-keys` | API 키 관리 | API 키 생성·비활성화 |
| `SETTINGS_PAYMENT_GATEWAY` | `/admin/payment-gateway` | 전자결제(PG) 설정 | Stripe/Toss/VnPay 설정 |
| `SETTINGS_PAYMENT_TRANSACTION` | `/admin/payment-transactions` | 결제 내역 관리 | 결제 이력 조회 |
| `SETTINGS_SMTP` | `/admin/smtp` | SMTP 설정 | 메일 서버 설정 (Postal) |
| `SETTINGS_EMAIL_TEMPLATES` | `/admin/email-templates` | 이메일 템플릿 | 시스템 이메일 템플릿 관리 |
| `SETTINGS_DRIVE` | `/admin/drive` | Google Drive | 글로벌 드라이브 설정 |
| `SETTINGS_SITE` | `/admin/site-settings` | 사이트 설정 | 전역 사이트 설정 |

### 8.4 AI·에이전트 관리

| 메뉴 코드 | 라우트 | 한국어 | 기능 |
|-----------|--------|--------|------|
| `SETTINGS_CONVERSATIONS` | `/admin/conversations` | 에이전트 대화 관리 | 대화 이력 모니터링 |
| `SETTINGS_AGENTS` | `/admin/agents` | AI 에이전트 설정 | 에이전트 설정·프롬프트 관리 |
| `SETTINGS_AI_USAGE` | `/admin/ai-usage` | AI 사용량 관리 | 토큰 사용량·비용 모니터링 |
| `SETTINGS_MAIL_ACCOUNTS` | `/admin/mail-accounts` | 웹메일 계정 관리 | 메일 계정 할당·관리 |

### 8.5 파트너·포탈 관리

| 라우트 | 한국어 | 기능 |
|--------|--------|------|
| `/admin/portal-bridge` | 포탈 브릿지 | AMA↔Portal 연동 설정 |
| `/admin/partners` | 파트너 관리 | 파트너사 등록·관리 |
| `/admin/partner-apps` | 파트너 앱 관리 | 파트너 앱 승인·관리 |
| `/admin/partner-users` | 파트너 유저 관리 | 파트너 사용자 관리 |
| `/admin/partner-invitations` | 파트너 초대 | 파트너 초대 발송 |

### 8.6 기타 관리 도구

| 라우트 | 한국어 | 기능 |
|--------|--------|------|
| `/admin/glossary` | 용어집 | 프로젝트 용어 사전 관리 |
| `/admin/custom-apps` | 커스텀 앱 | 전역 커스텀 앱 관리 |
| `/admin/redmine-migration` | Redmine 가져오기 | Redmine 이슈 마이그레이션 |
| `/admin/redmine-imported` | 가져온 이슈 관리 | 마이그레이션된 이슈 관리 |
| `/admin/admin-users` | 어드민 유저 관리 | 관리자 계정 관리 |
| `/admin/site-analytics` | 사이트 통계 | 사이트 방문·사용 통계 |
| `/admin/site-errors` | 에러 로그 | 시스템 에러 모니터링 |
| `/admin/app-store-oauth` | 앱스토어 OAuth | OAuth 클라이언트 관리 |

---

## 9. 클라이언트 포탈

고객사 사용자(`CLIENT_LEVEL`)가 접근하는 전용 영역.

| 라우트 | 한국어 | 주요 기능 |
|--------|--------|----------|
| `/client` | 대시보드 | 배정된 프로젝트·이슈 현황 |
| `/client/projects` | 프로젝트 목록 | 참여 프로젝트 조회 |
| `/client/projects/:id` | 프로젝트 상세 | 프로젝트 진행 상황, 이슈 목록 |
| `/client/issues` | 이슈 목록 | 고객 이슈 조회·필터 |
| `/client/issues/new` | 이슈 생성 | 새 이슈 등록 |
| `/client/issues/:id` | 이슈 상세 | 이슈 상세·댓글 |
| `/client/chat/:channelId?` | 채팅 | 프로젝트 담당자 실시간 채팅 |
| `/client/profile` | 프로필 | 프로필 수정 |

---

## 10. 파트너 포탈

파트너사 사용자(`PARTNER_LEVEL`)가 접근하는 전용 영역.

| 라우트 | 한국어 | 주요 기능 |
|--------|--------|----------|
| `/partner` | 대시보드 | 파트너 현황 요약 |
| `/partner/apps` | 앱 목록 | 파트너 등록 앱 관리 |
| `/partner/my-page` | 마이페이지 | 파트너 프로필·설정 |

---

## 11. 포탈 웹 (www.amoeba.site)

서비스 소개 및 SaaS 포탈 (apps/portal-web).

### 11.1 공개 페이지

| 라우트 | 한국어 | 기능 |
|--------|--------|------|
| `/` | 랜딩 페이지 | 서비스 소개, CTA |
| `/pricing` | 가격표 | SaaS 요금 플랜 비교 |
| `/services/:code` | 서비스 상세 | 개별 서비스 설명 |
| `/page/:slug` | CMS 페이지 | 동적 콘텐츠 페이지 |
| `/guide/:slug` | 가이드 | 사용 가이드 문서 |

### 11.2 SaaS 포탈 (인증 필요)

| 라우트 | 한국어 | 기능 |
|--------|--------|------|
| `/portal` | 대시보드 | 구독 현황, 사용량 요약 |
| `/portal/subscriptions` | 구독 관리 | 구독 상태·갱신·해지 |
| `/portal/subscriptions/plans` | 플랜 선택 | 요금 플랜 변경 |
| `/portal/usage` | 사용량 | API/AI 사용량 모니터링 |
| `/portal/billing` | 결제 | 결제 이력, 카드 관리 |
| `/portal/settings` | 설정 | 계정·회사 정보 설정 |

---

## 12. 역할별 메뉴 접근 권한

`DEFAULT_PERMISSIONS` 기준 역할별 메뉴 접근 매트릭스.

### 12.1 역할 계층

```
SUPER_ADMIN (4) → ADMIN (3) → MASTER (2) → MANAGER (2) → MEMBER (1) → VIEWER (0)
```

> **USER_LEVEL 내부 역할**: MASTER, MANAGER, MEMBER, VIEWER
> **ADMIN_LEVEL**: SUPER_ADMIN, ADMIN
> **CLIENT_LEVEL**: CLIENT_ADMIN, CLIENT_MEMBER
> **PARTNER_LEVEL**: PARTNER_ADMIN, PARTNER_MEMBER

### 12.2 접근 권한 매트릭스

| 메뉴 | SA | ADMIN | MASTER | MGR | MEMBER | VIEWER |
|------|:--:|:-----:|:------:|:---:|:------:|:------:|
| **업무도구** | | | | | | |
| Today (오늘의 미션) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Todo (나의 할일) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agents (AI 가이드) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Meeting Notes (노트) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Amoeba Talk (로비 채팅) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notices (공지사항) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Drive (드라이브) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Issues (이슈) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Project (프로젝트) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Calendar (캘린더) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Attendance (출퇴근) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **업무모듈** | | | | | | |
| Accounting (회계) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| HR (인사관리) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Billing (거래처 관리) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mail (웹메일) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| KMS (지식관리) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Work Items (업무항목) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Asset (자산관리) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Expense (지출관리) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Service Mgmt (서비스) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Site Mgmt (사이트) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **AI 채팅** | | | | | | |
| Chat (전 부서) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **설정** | | | | | | |
| Entity Settings | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Admin Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 통계 요약

| 항목 | 수량 |
|------|------|
| 사이드바 업무도구 메뉴 | 11개 |
| 사이드바 업무모듈 메뉴 | 10개 |
| AI 에이전트 (부서별 채팅) | 9개 |
| 법인 설정 메뉴 | 14개+ |
| 관리자 설정 메뉴 | 30개+ |
| 클라이언트 포탈 페이지 | 8개 |
| 파트너 포탈 페이지 | 3개 |
| 포탈 웹 페이지 | 11개 |
| 전체 고유 라우트 수 | 120개+ |
| 백엔드 도메인 모듈 | 51개 (api) + 8개 (portal-api) |
| i18n 네임스페이스 | 43개 (web) + 1개 (portal-web) |

---

*본 문서는 소스 코드 (`menu-config.service.ts`, `menu-code.constant.ts`, `router/index.tsx`) 기준으로 작성되었습니다.*
*작성일: 2026-04-11*
