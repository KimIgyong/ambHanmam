# AMB Management 메뉴 상세 설명서

> **문서 버전**: 1.0.0
> **최종 수정일**: 2026-02-18
> **대상 시스템**: AMB Management (Amoeba KMS)

---

## 1. 개요

AMB Management는 아메바 그룹의 통합 업무 관리 플랫폼으로, 9개 부서별 AI 에이전트를 중심으로 인사, 회계, 계약, 프로젝트 관리, 웹메일, 지식관리(KMS) 등 전사 업무를 하나의 시스템에서 처리합니다.

본 문서는 시스템에 구현된 모든 메뉴와 페이지를 사이트맵 형태로 정리합니다.

---

## 2. 메뉴 구조 개요

```
AMB Management
├── 🏠 Dashboard (홈)
├── ✅ TODO
├── 🤖 AI 에이전트 (9개 부서)
├── 📋 회의록
├── 💬 아메바톡
├── 📅 근무일정
├── 📢 공지사항
├── 📁 문서관리
├── 🏦 회계관리
├── 👥 인사관리 (16개 서브메뉴)
├── 🧾 계약/거래처 관리 (14개 서브메뉴)
├── ✉️ 웹메일 (6개 서브메뉴)
├── 📊 프로젝트 관리 (5개 서브메뉴)
├── 🏷️ KMS 지식관리 (3개 서브메뉴)
├── ⚙️ 설정 (8개 서브메뉴)
└── 🔐 인증 (로그인/회원가입)
```

---

## 3. 메인 사이드바 메뉴

권한 기반 메뉴 제어: 각 메뉴는 `MENU_CODE`에 의해 역할별 접근이 제어됩니다.

| # | 메뉴명 | 아이콘 | 경로 | 권한 코드 | 설명 |
|---|--------|--------|------|-----------|------|
| 1 | TODO | CheckSquare | `/todos` | `TODO` | 할일 및 작업 항목 관리 |
| 2 | AI 에이전트 | Bot | `/agents` | `AGENTS` | 9개 부서별 AI 에이전트 |
| 3 | 회의록 | FileText | `/meeting-notes` | `MEETING_NOTES` | 회의록 작성 및 관리 |
| 4 | 아메바톡 | MessageCircle | `/amoeba-talk` | `AMOEBA_TALK` | 사내 커뮤니케이션 |
| 5 | 근무일정 | CalendarDays | `/work-schedule` | `WORK_SCHEDULE` | 근무 스케줄 관리 |
| 6 | 공지사항 | Megaphone | `/notices` | `NOTICES` | 전사 공지사항 |
| 7 | 문서관리 | FolderOpen | `/documents` | `DOCUMENTS` | Google Drive 연동 문서 관리 |
| 8 | 회계관리 | Landmark | `/accounting` | `ACCOUNTING` | 계좌 및 입출금 관리 |
| 9 | 인사관리 | Users | `/hr` | `HR` | 인사/급여/근태 통합 관리 |
| 10 | 계약/거래처 | Receipt | `/billing` | `BILLING` | 계약/인보이스/수금 관리 |
| 11 | 웹메일 | Mail | `/mail` | `MAIL` | 이메일 수신/발송 |
| - | 설정 | Settings | `/settings` | `SETTINGS_*` | 시스템 설정 |

> **참고**: 프로젝트 관리(`PROJECT_MANAGEMENT`)와 KMS(`KMS`)는 사이드바에서 관련 메뉴를 통해 접근합니다.

---

## 4. 서브 메뉴 상세

### 4.1 Dashboard (홈)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | DashboardPage | 메인 대시보드 — 주요 지표, 최근 활동, 알림 요약 |

---

### 4.2 TODO / 작업 관리

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/todos` | TodoPage | 개인 할일 목록 — 생성, 완료, 필터링 |
| `/work-items` | WorkItemsPage | ACL 작업 항목 — 모듈 연동 자동 생성 작업 추적 |

**주요 기능**:
- 할일 CRUD (생성/조회/수정/삭제)
- 우선순위 및 상태 필터
- 모듈 연동 자동 작업 생성 (인보이스 결재, 프로젝트 리뷰 등)

---

### 4.3 AI 에이전트 (부서별 채팅)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/agents` | AgentsPage | 9개 부서별 AI 에이전트 목록 |
| `/chat/management` | ChatPage | 경영관리 AI 채팅 |
| `/chat/accounting` | ChatPage | 회계 AI 채팅 |
| `/chat/hr` | ChatPage | 인사 AI 채팅 |
| `/chat/legal` | ChatPage | 법무 AI 채팅 |
| `/chat/sales` | ChatPage | 영업 AI 채팅 |
| `/chat/it` | ChatPage | IT AI 채팅 |
| `/chat/marketing` | ChatPage | 마케팅 AI 채팅 |
| `/chat/general-affairs` | ChatPage | 총무 AI 채팅 |
| `/chat/planning` | ChatPage | 기획 AI 채팅 |
| `/chat/:department/:conversationId` | ChatPage | 기존 대화 이어가기 |

**주요 기능**:
- Claude API 기반 실시간 AI 채팅 (SSE 스트리밍)
- 부서별 전문 시스템 프롬프트
- 대화 이력 저장 및 재개
- 다국어 응답 (Accept-Language 헤더 기반)

**권한 코드**:

| 부서 | 권한 코드 |
|------|-----------|
| 경영관리 | `CHAT_MANAGEMENT` |
| 회계 | `CHAT_ACCOUNTING` |
| 인사 | `CHAT_HR` |
| 법무 | `CHAT_LEGAL` |
| 영업 | `CHAT_SALES` |
| IT | `CHAT_IT` |
| 마케팅 | `CHAT_MARKETING` |
| 총무 | `CHAT_GENERAL_AFFAIRS` |
| 기획 | `CHAT_PLANNING` |

---

### 4.4 협업 도구

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/meeting-notes` | MeetingNotesPage | 회의록 목록 — 검색, 필터 |
| `/meeting-notes/:id` | MeetingNoteDetailPage | 회의록 상세 — 내용 확인, 편집 |
| `/amoeba-talk` | AmoebaTalkPage | 사내 커뮤니케이션 — 실시간 메시지 |
| `/work-schedule` | WorkSchedulePage | 근무일정 — 캘린더 뷰, 일정 등록 |
| `/notices` | NoticesPage | 공지사항 목록 — 전사/부서별 공지 |
| `/notices/:id` | NoticeDetailPage | 공지사항 상세 |
| `/documents` | DocumentsPage | 문서 관리 — Google Drive 연동 파일 탐색 |

**주요 기능**:
- 회의록: 작성, AI 요약, 참석자 관리, 액션 아이템 추적
- 아메바톡: 실시간 사내 채팅
- 근무일정: 캘린더 기반 스케줄 관리
- 공지사항: 전사/부서별 공지 CRUD
- 문서관리: Google Drive 폴더 연동, 파일 업로드/다운로드

---

### 4.5 회계관리 (Accounting)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/accounting` | AccountingPage | 은행 계좌 목록, 통화별 잔액 요약, Excel 가져오기 |
| `/accounting/:accountId` | AccountTransactionsPage | 계좌별 거래 내역 — 필터, 정렬, 페이지네이션 |

**주요 기능**:
- 다통화 계좌 관리 (VND / USD / KRW)
- 입금/출금 거래 기록 및 누적잔액 자동 계산
- Excel 일괄 가져오기 (전체 워크북 / 계좌별)
- 통화별 잔액 합계 대시보드

---

### 4.6 인사관리 (HR)

서브 네비게이션 레이아웃: `HrLayout`

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/hr/employees` | EmployeeListPage | 직원 목록 — 상태/부서 필터 |
| `/hr/employees/new` | EmployeeDetailPage | 직원 신규 등록 |
| `/hr/employees/:id` | EmployeeDetailPage | 직원 상세 — 기본정보/급여/부양가족/KR정보 탭 |
| `/hr/freelancers` | FreelancerListPage | 프리랜서 목록 |
| `/hr/freelancers/new` | FreelancerDetailPage | 프리랜서 등록 |
| `/hr/freelancers/:id` | FreelancerDetailPage | 프리랜서 상세 |
| `/hr/business-income` | BusinessIncomePage | 사업소득 지급 관리 (프리랜서 원천징수) |
| `/hr/yearend` | YearendAdjustmentPage | 연말정산 — 입력, Excel 가져오기, 급여 반영 |
| `/hr/timesheet` | TimesheetPage | 근태 관리 — 월별 그리드 입력 |
| `/hr/overtime` | OvertimePage | 초과근무 — OT 기록, 승인 워크플로우 |
| `/hr/leave` | LeavePage | 연차 관리 — 부여/사용/잔여 현황 |
| `/hr/payroll` | PayrollListPage | 급여 기간 목록 — 상태별 관리 |
| `/hr/payroll/:periodId` | PayrollDetailPage | 급여 상세 — VN/KR 급여 계산 결과 |
| `/hr/severance` | SeverancePage | 퇴직금 계산 — 근속연수 기반 산출 |
| `/hr/reports` | HrReportsPage | 리포트 다운로드 센터 (PDF/Excel) |
| `/hr/settings` | HrSettingsPage | HR 설정 — 보험요율, 세율, 공휴일, KR 파라미터 |

**주요 기능**:
- 다국가 인사관리 (베트남 + 한국)
- VN 급여: 사회보험/건강보험/실업보험 + 누진 PIT
- KR 급여: 4대보험 + 간이세액표 기반 소득세
- 급여 결재: DRAFT → CALCULATING → CALCULATED → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → FINALIZED
- 리포트: 급여대장, 보험 리포트, PIT 리포트, 급여명세서 (PDF), 직원 명부, 세무사 제출용

---

### 4.7 계약/거래처 관리 (Billing)

서브 네비게이션 레이아웃: `BillingLayout`

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/billing/dashboard` | BillingDashboardPage | 청구 대시보드 — KPI 카드, 매출/비용 차트, 만료 알림 |
| `/billing/partners` | PartnerListPage | 거래처 목록 — 유형/상태 필터 |
| `/billing/partners/new` | PartnerDetailPage | 거래처 등록 |
| `/billing/partners/:id` | PartnerDetailPage | 거래처 상세 — 기본정보/계약/인보이스/SOW 탭 |
| `/billing/contracts` | ContractListPage | 계약 목록 — 방향/카테고리/상태 필터 |
| `/billing/contracts/new` | ContractDetailPage | 계약 등록 (마일스톤 포함) |
| `/billing/contracts/:id` | ContractDetailPage | 계약 상세 — 변경 이력, 갱신 |
| `/billing/sow` | SowListPage | SOW(작업 명세서) 목록 |
| `/billing/sow/new` | SowDetailPage | SOW 등록 |
| `/billing/sow/:id` | SowDetailPage | SOW 상세 |
| `/billing/invoices` | InvoiceListPage | 인보이스 목록 — 상태/방향/월별 필터 |
| `/billing/invoices/new` | InvoiceDetailPage | 인보이스 생성 (항목 편집) |
| `/billing/invoices/:id` | InvoiceDetailPage | 인보이스 상세 — 결재, PDF, 이메일 발송 |
| `/billing/payments` | PaymentListPage | 수금/지급 관리 — 미수금/미지급 현황 |

**주요 기능**:
- P&L 전체 사이클: 거래처 → 계약 → SOW → 인보이스 → 수금/지급
- 매출(RECEIVABLE) / 매입(PAYABLE) 양방향 관리
- 4가지 계약 유형: 정액(FIXED), 사용량 기반(USAGE_BASED), 마일스톤(MILESTONE), 수시(AD_HOC)
- 3단계 인보이스 결재: 검토 → 매니저 승인 → 관리자 최종 승인
- 월간 자동 청구 (BillingAutomation)
- 인보이스 PDF 생성, 이메일 발송, Void & Re-issue
- Google Drive 문서 관리, Google Sheets 사용량 연동
- 리포트: 매출/비용 요약, 월별 과금 매트릭스, 세금계산서, 법인 통합 뷰, Excel 내보내기

---

### 4.8 웹메일 (Mail)

서브 네비게이션 레이아웃: `MailLayout`

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/mail/inbox` | MailInboxPage | 받은편지함 — 메일 목록, 읽음 상태 |
| `/mail/sent` | MailSentPage | 보낸편지함 |
| `/mail/drafts` | MailDraftsPage | 임시보관함 |
| `/mail/trash` | MailTrashPage | 휴지통 |
| `/mail/compose` | MailComposePage | 메일 작성 — 리치 에디터, 첨부파일 |
| `/mail/message/:id` | MailDetailPage | 메일 상세 — HTML 렌더링, 답장/전달 |

**주요 기능**:
- Postal 메일 서버 연동 (IMAP + SMTP)
- 실시간 수신 동기화 (ImapFlow)
- HTML 메일 보안 렌더링 (DOMPurify)
- 첨부파일 지원
- 메일 계정 비밀번호 AES-256-GCM 암호화

---

### 4.9 프로젝트 관리 (Project)

서브 네비게이션 레이아웃: `ProjectLayout`

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/project/proposals` | ProposalListPage | 제안서 목록 — 상태 탭 필터 |
| `/project/proposals/new` | ProposalFormPage | 제안서 작성 — AI 초안 자동 생성 |
| `/project/proposals/:id` | ProposalDetailPage | 제안서 상세 — AI 분석, 리뷰 이력 |
| `/project/projects` | ProjectListPage | 승인된 프로젝트 목록 |
| `/project/projects/:id` | ProjectDetailPage | 프로젝트 상세 — 멤버/파일 관리 |

**주요 기능**:
- AI 기반 제안서 초안 생성 (Claude API)
- 유사 프로젝트 자동 탐지
- AI 사전분석 (타당성 점수, 리스크, 강점/약점)
- 2단계 승인 워크플로우 (팀장 → 경영진)
- 9단계 프로젝트 상태 관리: DRAFT → SUBMITTED → REVIEW → APPROVED → IN_PROGRESS → COMPLETED
- KMS 태그 자동 추출, ACL WorkItem 자동 생성

---

### 4.10 KMS 지식관리

서브 네비게이션 레이아웃: `KmsLayout`

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/kms/tag-cloud` | TagCloudPage | 태그 클라우드 — MY/TEAM/COMPANY 범위 |
| `/kms/tags` | TagManagementPage | 태그 관리 — CRUD, 정규화, 병합 |
| `/kms/knowledge-graph` | KnowledgeGraphPage | 지식 그래프 — 태그 관계 시각화 |

**주요 기능**:
- 3단계 분류 체계: DOMAIN → TOPIC → CONTEXT
- AI 자동 태깅 (Claude API + 4단계 정규화 파이프라인)
- 태그 클라우드 (개인/팀/전사 범위)
- 지식 그래프 시각화
- 유사 태그 탐지 (pg_trgm 퍼지 매칭)

---

### 4.11 설정 (Settings)

| 경로 | 페이지 | 권한 코드 | 설명 |
|------|--------|-----------|------|
| `/settings` | SettingsPage | `SETTINGS_*` | 설정 메인 페이지 |
| `/settings/api-keys` | ApiKeyManagementPage | `SETTINGS_API_KEYS` | API 키 관리 (Claude API 등) |
| `/settings/members` | MemberManagementPage | `SETTINGS_MEMBERS` | 시스템 멤버 관리 (초대/역할) |
| `/settings/smtp` | SmtpSettingsPage | `SETTINGS_SMTP` | SMTP 메일 서버 설정 |
| `/settings/permissions` | PermissionManagementPage | `SETTINGS_PERMISSIONS` | 메뉴별 역할 접근 권한 관리 |
| `/settings/drive` | DriveSettingsPage | - | Google Drive 연동 설정 |
| `/settings/entities` | EntityManagementPage | `SETTINGS_ENTITIES` | 법인(Entity) 관리 |
| `/settings/departments` | DepartmentManagementPage | `DEPARTMENTS` | 부서 관리 |

**주요 기능**:
- 멤버 초대 및 역할 할당
- 메뉴별 접근 권한 제어 (역할 × 메뉴 매트릭스)
- API 키 관리 (암호화 저장)
- SMTP 설정 (Postal 메일 서버)
- Google Drive 서비스 계정 연동
- 법인 관리 (다법인 지원)
- 부서 관리 (9개 부서)

---

### 4.12 인증 (Authentication)

비로그인 상태에서 접근 가능한 공개 페이지입니다.

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/login` | LoginPage | 로그인 (이메일 + 비밀번호) |
| `/register` | RegisterPage | 회원가입 |
| `/forgot-password` | ForgotPasswordPage | 비밀번호 찾기 (이메일 발송) |
| `/reset-password` | ResetPasswordPage | 비밀번호 재설정 (토큰 기반) |

**인증 방식**: JWT (Access Token 15분 + Refresh Token 7일)

---

## 5. 페이지 통계 요약

| 도메인 | 페이지 수 | 비고 |
|--------|-----------|------|
| 대시보드 | 1 | 메인 홈 |
| TODO / 작업 | 2 | 할일 + ACL 작업 |
| AI 에이전트 / 채팅 | 11 | 에이전트 목록 + 9개 부서 + 대화 상세 |
| 협업 도구 | 7 | 회의록, 톡, 일정, 공지, 문서 |
| 회계관리 | 2 | 계좌 + 거래내역 |
| 인사관리 | 16 | VN+KR 통합, 급여/근태/연차/퇴직금 |
| 계약/거래처 관리 | 14 | 대시보드, 거래처, 계약, SOW, 인보이스, 수금 |
| 웹메일 | 6 | 받은/보낸/임시/휴지통/작성/상세 |
| 프로젝트 관리 | 5 | 제안서 + 프로젝트 |
| KMS 지식관리 | 3 | 태그 클라우드, 관리, 그래프 |
| 설정 | 8 | API키, 멤버, SMTP, 권한, Drive, 법인, 부서 |
| 인증 | 4 | 로그인, 가입, 비밀번호 |
| **합계** | **~79** | |

---

## 6. 권한 코드 전체 목록

총 25개 메뉴 권한 코드:

| # | 권한 코드 | 대상 메뉴 |
|---|-----------|-----------|
| 1 | `CHAT_MANAGEMENT` | 경영관리 AI 채팅 |
| 2 | `CHAT_ACCOUNTING` | 회계 AI 채팅 |
| 3 | `CHAT_HR` | 인사 AI 채팅 |
| 4 | `CHAT_LEGAL` | 법무 AI 채팅 |
| 5 | `CHAT_SALES` | 영업 AI 채팅 |
| 6 | `CHAT_IT` | IT AI 채팅 |
| 7 | `CHAT_MARKETING` | 마케팅 AI 채팅 |
| 8 | `CHAT_GENERAL_AFFAIRS` | 총무 AI 채팅 |
| 9 | `CHAT_PLANNING` | 기획 AI 채팅 |
| 10 | `SETTINGS_MEMBERS` | 멤버 관리 |
| 11 | `SETTINGS_API_KEYS` | API 키 관리 |
| 12 | `SETTINGS_SMTP` | SMTP 설정 |
| 13 | `SETTINGS_PERMISSIONS` | 권한 관리 |
| 14 | `SETTINGS_ENTITIES` | 법인 관리 |
| 15 | `TODO` | 할일 관리 |
| 16 | `AGENTS` | AI 에이전트 |
| 17 | `MEETING_NOTES` | 회의록 |
| 18 | `AMOEBA_TALK` | 아메바톡 |
| 19 | `WORK_SCHEDULE` | 근무일정 |
| 20 | `NOTICES` | 공지사항 |
| 21 | `DOCUMENTS` | 문서관리 |
| 22 | `ACCOUNTING` | 회계관리 |
| 23 | `HR` | 인사관리 |
| 24 | `BILLING` | 계약/거래처 관리 |
| 25 | `MAIL` | 웹메일 |
| 26 | `DEPARTMENTS` | 부서 관리 |
| 27 | `WORK_ITEMS` | 작업 항목 |
| 28 | `KMS` | 지식관리 |
| 29 | `PROJECT_MANAGEMENT` | 프로젝트 관리 |

---

## 7. 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript 5 + TailwindCSS 3 + Vite 5 |
| 백엔드 | NestJS 10 + TypeORM + PostgreSQL 15 |
| AI | Anthropic Claude API (SSE 스트리밍) |
| 인증 | JWT (Access + Refresh Token) |
| 라우팅 | React Router v6 (createBrowserRouter) |
| 상태관리 | Zustand + TanStack React Query |
| 국제화 | i18next (EN / KO / VI, 20개 네임스페이스) |
| 아이콘 | Lucide React |
| 모노레포 | npm workspaces + Turborepo |

---

## 8. 접근 제어 체계

```
┌─────────────────────────────────────────────────┐
│                  인증 계층                        │
│  PublicRoute (비인증) ←→ ProtectedRoute (인증)    │
├─────────────────────────────────────────────────┤
│                  권한 계층                        │
│  MENU_CODE 기반 사이드바 메뉴 표시/숨김            │
│  역할별 접근: ADMIN / MANAGER / USER              │
├─────────────────────────────────────────────────┤
│                  모듈 계층                        │
│  EntityGuard: 법인(Entity) 격리                   │
│  AdminGuard: 관리자 전용 기능                     │
│  ManagerGuard: 매니저 이상 기능                    │
├─────────────────────────────────────────────────┤
│                  데이터 계층                       │
│  Soft Delete: 모든 데이터 논리 삭제               │
│  법인별 데이터 격리 (ent_id FK)                   │
└─────────────────────────────────────────────────┘
```
