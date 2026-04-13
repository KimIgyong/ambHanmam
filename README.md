# AMB Management

> 다법인 글로벌 기업의 미션·태스크·이슈·프로젝트를 지식 자산으로 성장시키고, 채팅·노트·공지의 기본 번역 협업과 Today AI Analysis 기반 일일 업무 분석으로 글로벌 운영 효율을 높이는 엔터프라이즈 플랫폼

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)

## 프로젝트 소개

AMB Management는 다법인 글로벌 기업 환경에서 **미션 > 태스크 > 이슈 > 프로젝트**로 이어지는 업무 흐름을 축적하고 이를 **지식 자산(KMS)** 으로 성장시키는 웹 애플리케이션입니다. 채팅, 회의록, 공지사항, 할일 등 주요 협업 콘텐츠에 번역 기반 협업 체계를 제공하여 EN/KO/VI 다국적 직원 간 커뮤니케이션을 원활하게 지원하며, **Today AI Analysis**가 매일의 작업 내용과 진행 현황을 분석해 더 효율적이고 계획적인 업무 수행을 돕습니다. 여기에 법인별 권한 통제, Entity 기반 데이터 격리, 고객/파트너 포털까지 통합하여 내부 운영과 외부 협업을 함께 지원합니다.

### 업무가 지식으로 성장하는 흐름

`오늘의 미션` → `태스크 실행` → `이슈 관리` → `프로젝트 축적` → `KMS 지식 자산화`

이 시스템은 단순히 업무를 기록하는 도구가 아니라, 매일의 실행 데이터를 다음 업무와 조직 지식으로 연결하는 운영 기반을 목표로 한다.

### 핵심 기능

| 기능 | 설명 |
|------|------|
| **업무 지식 성장 체계** | 오늘의 미션에서 시작한 업무를 태스크, 이슈, 프로젝트로 연결하고 KMS 자산으로 축적 |
| **Today AI Analysis** | 매일의 작업 내용과 진행 현황을 AI가 분석하여 업무 효율화, 병목 파악, 계획 수립 지원 |
| **기본 번역 협업** | 채팅, 회의록, 공지사항, 할일 등 주요 콘텐츠에 번역 기능을 제공하고 용어집 기반 다국어 협업 지원 |
| **KMS** | 태그, 태그 클라우드, 지식 그래프, 문서 기반 지식 축적과 재검색 지원 |
| **프로젝트/이슈 연계** | 태스크, 이슈, 프로젝트를 연결하여 실행 업무가 프로젝트 자산으로 이어지도록 지원 |
| **AI 에이전트** | 9개 부서별 전문 AI 에이전트 (경영/회계/인사/법무/영업/IT/마케팅/총무/기획) |
| **SSE 스트리밍** | 실시간 AI 응답 스트리밍 (Server-Sent Events) |
| **다법인 권한 통제** | Entity 기반 데이터 격리, 법인별 권한, Unit/Cell 기반 운영 제어 지원 |
| **고객/파트너 포털** | 외부 고객과 파트너 사용자를 위한 별도 포털 및 초대/접근 관리 지원 |
| **HR 관리** | 직원/프리랜서 관리, 급여 계산 (VN/KR), 근태, 초과근무, 연차, 퇴직금, 연말정산 |
| **Billing 관리** | 거래처, 계약, SOW, 인보이스, 결제 관리, 자동 청구, 리포트 |
| **회계** | 은행 계좌/거래 관리, Excel 가져오기, 잔액 추적 |
| **웹메일** | Postal 메일 서버 연동, IMAP/SMTP, 사내 이메일 시스템 (@amoeba.site) |
| **할일 관리** | 개인 할일 CRUD, 상태 관리 (예정/진행/완료) |
| **회의록** | 리치텍스트 회의록, 공개범위 설정 (개인/부서/전체) |
| **근무 일정** | 팀 테이블 뷰, 출근/원격/반차/휴가 관리 |
| **공지사항** | 어드민 공지 등록, 파일 첨부, 조회수/읽음 추적 |
| **문서함** | Google Drive 통합 (공유 드라이브 탐색/검색/다운로드) |
| **멤버 관리** | 사용자/그룹/초대 관리, 역할 기반 접근 제어 |
| **설정** | API 키, SMTP, 메뉴 권한, Drive 설정, 법인 관리 |
| **다국어** | EN / KO / VI 3개 언어, 전역 UI 번역 및 번역 네임스페이스 지원 |
| **대시보드** | 어제 완료 할일, 오늘 할일, 최근 공지, 아메바톡 |

### 제품 관점 핵심 가치

- **업무가 지식으로 누적됨**: 오늘의 미션과 태스크 실행 결과가 이슈와 프로젝트로 이어지고, 다시 KMS 자산으로 축적된다.
- **글로벌 협업 마찰을 줄임**: 채팅과 주요 협업 콘텐츠에 기본 번역과 용어집 체계를 제공해 다국적 직원 간 커뮤니케이션 비용을 낮춘다.
- **매일의 실행을 AI가 해석함**: Today AI Analysis가 작업 현황과 병목을 분석해 다음 업무를 더 계획적으로 정리할 수 있게 돕는다.

### 주요 사용자 시나리오

- **실무자**: 오늘의 미션을 작성하고 태스크를 수행하며, 발생한 이슈를 연결하고 결과를 프로젝트와 KMS 지식으로 축적한다.
- **다국적 협업팀**: 채팅, 회의록, 공지사항, 할일의 번역 기능과 용어집을 활용해 언어 장벽 없이 협업한다.
- **운영 리더**: Today AI Analysis로 일일 업무 현황과 병목을 파악하고, 법인별 권한과 조직 단위로 실행 상태를 관리한다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | React 18, TypeScript 5, TailwindCSS 3, Vite 5 |
| 상태 관리 | Zustand (전역), React Query (서버), React Hook Form + Zod (폼) |
| 리치 텍스트 | Tiptap Editor |
| Backend | NestJS 10, TypeORM, PostgreSQL 15 |
| AI | Anthropic Claude API (@anthropic-ai/sdk) |
| 메일 서버 | Postal (오픈소스), Nodemailer (SMTP), ImapFlow (IMAP) |
| 파일/문서 | Multer (업로드), Google Drive API, ExcelJS, PDFKit |
| i18n | i18next, react-i18next (EN/KO/VI) |
| 인증 | Passport + JWT (Access 15m / Refresh 7d) |
| 암호화 | AES-256-GCM (API 키, SMTP/메일 비밀번호), bcrypt (비밀번호) |
| 인프라 | Docker Compose, Turborepo (모노레포), Nginx (리버스 프록시) |

## 프로젝트 구조

```
ambManagement/
├── apps/
│   ├── api/                       # NestJS 백엔드 (포트 3019)
│   │   └── src/
│   │       ├── domain/
│   │       │   ├── auth/          # 인증 (JWT, 비밀번호 재설정)
│   │       │   ├── agent/         # 9개 부서 AI 에이전트
│   │       │   ├── chat/          # 대화 관리 (SSE 스트리밍)
│   │       │   ├── todo/          # 할일 관리
│   │       │   ├── meeting-notes/ # 회의록
│   │       │   ├── work-schedule/ # 근무 일정
│   │       │   ├── notices/       # 공지사항 (파일 첨부)
│   │       │   ├── drive/         # Google Drive 문서함
│   │       │   ├── accounting/    # 은행 계좌/거래 관리
│   │       │   ├── hr/            # HR (직원/급여/근태/연차/초과근무/퇴직금/연말정산)
│   │       │   ├── billing/       # Billing (거래처/계약/SOW/인보이스/결제)
│   │       │   ├── webmail/       # 웹메일 (Postal IMAP/SMTP)
│   │       │   ├── members/       # 멤버/그룹 관리
│   │       │   ├── settings/      # API 키, SMTP, 메뉴 권한, Drive, 법인
│   │       │   └── invitation/    # 초대
│   │       ├── global/            # 전역 가드/필터/인터셉터/상수
│   │       └── infrastructure/    # Claude AI, Mail, File, Google Drive
│   │
│   └── web/                       # React 프론트엔드 (포트 5189)
│       └── src/
│           ├── domain/
│           │   ├── auth/          # 로그인/회원가입/비밀번호 재설정
│           │   ├── dashboard/     # 대시보드
│           │   ├── chat/          # 채팅 (SSE 스트리밍)
│           │   ├── agents/        # AI 에이전트 소개
│           │   ├── todos/         # 할일
│           │   ├── meeting-notes/ # 회의록
│           │   ├── work-schedule/ # 근무 일정
│           │   ├── notices/       # 공지사항
│           │   ├── documents/     # Google Drive 문서함
│           │   ├── accounting/    # 회계
│           │   ├── hr/            # HR 관리 (17 페이지, 16 서비스)
│           │   ├── billing/       # Billing 관리 (11 페이지, 7 서비스)
│           │   ├── mail/          # 웹메일
│           │   ├── members/       # 멤버 관리
│           │   ├── settings/      # 설정 (6 하위 페이지)
│           │   └── amoeba-talk/   # 아메바톡
│           ├── components/        # 공통 컴포넌트
│           ├── layouts/           # Main, Sub, Auth, HR, Billing 레이아웃
│           ├── locales/           # i18n (en, ko, vi) × 18 네임스페이스
│           ├── lib/               # API 클라이언트, SSE, 유틸리티
│           └── router/            # 라우팅
│
├── packages/
│   ├── types/                     # 공유 TypeScript 타입 (1,200+ 줄)
│   └── common/                    # 공유 유틸리티/상수
│
├── env/                           # 환경 변수 (backend, frontend)
├── docker/                        # Docker 설정
│   ├── docker-compose.dev.yml     # 개발 환경 (PostgreSQL + Adminer)
│   ├── staging/                   # 스테이징 (API + Web + DB + Nginx)
│   └── postal/                    # Postal 메일 서버
└── reference/                     # 참고 문서 및 가이드
```

## 시작하기

### 필수 요구사항
- Node.js 20+
- Docker & Docker Compose
- Anthropic Claude API Key

### 설치

```bash
# 의존성 설치
npm install

# PostgreSQL 실행
npm run db:up

# 환경 변수 설정
# env/backend/.env.development 에서 CLAUDE_API_KEY 설정
```

### 환경 변수

**Backend** (`env/backend/.env.development`)
```env
CLAUDE_API_KEY=your_claude_api_key_here
API_KEY_ENCRYPTION_SECRET=amb_api_key_encryption_32byte_k
```

**Frontend** (`env/frontend/.env.development`)
```env
VITE_API_BASE_URL=http://localhost:3019/api/v1
```

### 개발 서버 실행

```bash
# API + Web 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:api    # API 서버 (localhost:3019)
npm run dev:web    # Web 서버 (localhost:5189)
```

### 빌드 및 배포

```bash
npm run build      # 전체 빌드 (Turborepo 병렬)
npm run lint       # 린트 검사
```

### 접속 URL

| 서비스 | URL |
|--------|-----|
| Web | http://localhost:5189 |
| API | http://localhost:3019 |
| Swagger | http://localhost:3019/api-docs |
| Adminer | http://localhost:8099 |
| Postal Web UI | http://localhost:5000 |
| RabbitMQ | http://localhost:15672 |

## 사이드바 메뉴

| 메뉴 | 아이콘 | 경로 | 설명 |
|------|--------|------|------|
| 할일 | CheckSquare | /todos | 할일 관리 |
| AI 에이전트 | Bot | /agents | 부서별 AI 에이전트 |
| 회의록 | FileText | /meeting-notes | 회의록 관리 |
| 아메바톡 | MessageCircle | /amoeba-talk | 전체 부서 채팅 |
| 근무 일정 | CalendarDays | /work-schedule | 팀 근무 일정 |
| 공지사항 | Megaphone | /notices | 공지사항 |
| 문서함 | FolderOpen | /documents | Google Drive 문서 |
| 회계 | Calculator | /accounting | 은행 계좌/거래 관리 |
| HR | Users | /hr | 인사 관리 (15+ 서브메뉴) |
| Billing | Receipt | /billing | 청구 관리 (8+ 서브메뉴) |
| 설정 | Settings | /settings | 시스템 설정 |

### HR 서브메뉴

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 직원 관리 | /hr/employees | 직원 CRUD, 부양가족, 급여 이력 |
| 프리랜서 | /hr/freelancers | 프리랜서/사업소득 관리 |
| 사업소득 | /hr/business-income | 사업소득 지급 관리 |
| 연말정산 | /hr/yearend | 연말정산 처리 |
| 근태관리 | /hr/timesheet | 출근/근무시간 기록 |
| 초과근무 | /hr/overtime | OT 기록/승인/환산 |
| 연차관리 | /hr/leave | 연차 잔액/사용 추적 |
| 급여관리 | /hr/payroll | 급여 기간/계산/승인 (VN/KR) |
| 퇴직금 | /hr/severance | 퇴직금 계산 |
| 리포트 | /hr/reports | HR 리포트 |
| 설정 | /hr/settings | HR 시스템 파라미터, 공휴일, 보험료율 |

### Billing 서브메뉴

| 메뉴 | 경로 | 설명 |
|------|------|------|
| 대시보드 | /billing/dashboard | Billing 현황 요약 |
| 거래처 | /billing/partners | CLIENT/AFFILIATE/PARTNER/OUTSOURCING 관리 |
| 계약 | /billing/contracts | INBOUND/OUTBOUND 계약, 마일스톤, 이력 |
| SOW | /billing/sow | Scope of Work 관리 |
| 인보이스 | /billing/invoices | 매출/매입 인보이스 (PDF 생성, 메일 발송) |
| 결제 | /billing/payments | 결제 기록 관리 |

## 권한 체계

| 역할 | 레벨 | 접근 영역 |
|------|------|----------|
| USER | 1 | 대시보드, 채팅, 할일, 회의록, 일정, 공지사항 열람 |
| MANAGER | 2 | USER + 멤버 조회, 초대 관리 |
| ADMIN | 3 | MANAGER + 역할 변경, 그룹 CRUD, API 키, SMTP, 메뉴 권한, 법인 관리, 공지사항 관리 |

메뉴별 접근 권한은 `amb_menu_permissions` 테이블에서 `menu_code + role` 단위로 제어됩니다. (23개 메뉴 코드)

## 다국어 (i18n)

| 코드 | 언어 | 비고 |
|------|------|------|
| en | English | 기본 언어 |
| ko | 한국어 | - |
| vi | Tiếng Việt | - |

### 번역 네임스페이스 (18개)
```
common, auth, chat, settings, dashboard, departments, members,
todos, meetingNotes, agents, workSchedule, notices, documents,
accounting, hr, billing, mail
```

### 새 번역 추가
1. `apps/web/src/locales/` 아래 새 언어 폴더 생성 (예: `ja/`)
2. 기존 네임스페이스 JSON 파일 복사 후 번역
3. `apps/web/src/i18n.ts`에 리소스 등록
4. `apps/web/src/components/common/LanguageSelector.tsx`에 옵션 추가
5. `apps/api/src/domain/agent/service/base-agent.service.ts`의 `getLanguageInstruction()`에 언어 추가

## Docker 인프라

| 환경 | 파일 | 서비스 |
|------|------|--------|
| 개발 | `docker/docker-compose.dev.yml` | PostgreSQL 15, Adminer |
| 스테이징 | `docker/staging/docker-compose.staging.yml` | PostgreSQL, NestJS API, React+Nginx |
| 메일서버 | `docker/postal/docker-compose.yml` | Postal, MariaDB, RabbitMQ |

### 스테이징 배포
```bash
cd docker/staging
cp .env.example .env.staging  # 환경변수 설정
docker-compose -f docker-compose.staging.yml up -d
```

## 코드 컨벤션

| 영역 | 규칙 |
|------|------|
| 컴포넌트 | PascalCase (`ChatPage.tsx`) |
| 서비스 | kebab-case (`.service.ts`) |
| 훅 | `use` + PascalCase (`useChat.ts`) |
| DB 테이블 | `amb_` + snake_case 복수형 |
| DB 컬럼 | 3자 prefix + snake_case |
| Request DTO | snake_case |
| Response DTO | camelCase |

## 참고 문서

| 문서 | 경로 |
|------|------|
| 프로젝트 명세서 | `SPEC.md` |
| 코드 컨벤션 | `reference/amoeba_code_convention.md` |
| 웹 스타일 가이드 | `reference/amoeba_web_style_guide.md` |
| 개발 스킬 가이드 | `reference/amoeba_basic_skill.md` |
| 웹메일 요구사항 | `reference/webmail-requirements.md` |
| Billing 요구사항 | `reference/billing-requirements-v2.md` |
| KR 급여 요구사항 | `reference/kr-payroll-requirements.md` |

## 라이선스

Private - Amoeba Company
