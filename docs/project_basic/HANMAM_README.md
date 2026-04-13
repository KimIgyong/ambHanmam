# HANMAM by AMA - README

## 프로젝트 정보 | Project Info

| 항목 | 내용 |
|------|------|
| **프로젝트명** | HANMAM by AMA (한마음 시스템 차세대) |
| **버전** | v1.0.0 |
| **라이선스** | Private (비공개 / Proprietary) |
| **Node.js** | 20.x LTS |
| **TypeScript** | 5.x |
| **작성일** | 2026-04-11 |

> **기존 Java Spring 기반 사내 그룹웨어(hm.hanmam.kr)를 AMA 플랫폼과 통합하여 Next.js + NestJS + PostgreSQL 기반 Modular Monolith 아키텍처로 재구축하는 차세대 통합 업무 시스템입니다.**
>
> **AMA 업무도구** (AI 채팅·협업 기반) + **HANMAM 업무모듈** (경영·영업·자금·서비스) = **HANMAM by AMA**

---

## 목차 | Table of Contents

1. [프로젝트 소개](#1-프로젝트-소개)
2. [플랫폼 구성 (AMA + HANMAM)](#2-플랫폼-구성-ama--hanmam)
3. [기술 스택](#3-기술-스택)
4. [프로젝트 구조](#4-프로젝트-구조)
5. [시작하기](#5-시작하기)
6. [개발 가이드](#6-개발-가이드)
7. [API 문서](#7-api-문서)
8. [테스트](#8-테스트)
9. [배포](#9-배포)
10. [참고 문서](#10-참고-문서)

---

## 1. 프로젝트 소개

### 개요

**HANMAM by AMA**는 AMA(AI 업무 플랫폼)의 AI 협업 도구를 기반으로, 기존 Java Spring 사내 그룹웨어(한마음 시스템)의 업무 모듈을 현대적인 기술 스택으로 완전히 재구축한 **사내 통합 업무 플랫폼**입니다.

AMA가 제공하는 AI 채팅·근태·업무연락·전자결재·쪽지 등 협업 도구 위에, HANMAM 특화 업무 모듈(경영정보·영업업무·서비스업무·업무지원·알림게시판·자금업무)을 결합하여 하나의 통합 포털로 운영합니다.

### 핵심 가치 | Core Values

| 가치 | 설명 |
|------|------|
| **AMA + HANMAM 통합** | AMA AI 협업 도구 + HANMAM 업무 모듈의 단일 포털 통합 |
| **AI 기반 업무 자동화** | Claude API 연동으로 경영분석·문서생성·상담처리 AI 지원 |
| **Modular Monolith** | 도메인별 엄격한 모듈 분리, 향후 MSA 전환 준비 완료 |
| **자금 자동 매칭** | 카드·통장 내역과 결의서/계산서의 지능형 자동 정산 |
| **관리자 중심 계정 관리** | 폐쇄형 사내 전용, 관리자가 계정 직접 발급/관리 |

### 서비스 대상 | Target Users

| 사용자 유형 | 설명 | 주요 기능 |
|-------------|------|---------|
| **ADMIN (관리자)** | 시스템 전체 관리자 | 사용자 등록/관리, 마스터 코드, 권한 설정, AI 쿼터 관리 |
| **MANAGER (부서장)** | 팀/부서 책임자 | 결재 승인, 경영보고 조회, 팀원 모니터링, AI 분석 리포트 |
| **USER (일반 직원)** | 일반 임직원 | AMA 도구 + 나의업무, 업무연락, 전자결재, 지출신청 등 |

---

## 2. 플랫폼 구성 (AMA + HANMAM)

HANMAM by AMA는 두 개의 레이어로 구성됩니다.

### 2.1 AMA 업무도구 레이어 (AMA 기반 개발)

AMA 플랫폼이 제공하는 기본 협업/AI 도구로, AMA 베이스 코드 기반으로 개발됩니다.

| 기능 | 설명 |
|------|------|
| 🤖 **AI 채팅 (부서별 AI 에이전트)** | Claude API 기반 부서 전문화 에이전트 대화 (SSE 스트리밍) |
| 📋 **나의 업무** | 개인 일별 업무 계획 및 실적 타임라인 |
| 📞 **업무연락** | 사내 업무 협조 요청 및 처리/담당/관심 탭 관리 |
| 📄 **전자결재** | 기안·승인·반려 워크플로우 (일반결재·지출보고·휴가신청 등) |
| ✉ **쪽지** | 임직원 간 1:1 단문 메시지 |
| 📅 **일정공유** | 월간 캘린더 기반 조직 일정 공유 |
| 🔔 **공용자원 예약** | 회의실/법인차량 예약 관리 |
| 📊 **근태현황** | 출근·외근·출장 실시간 집계 |

### 2.2 HANMAM 업무모듈 레이어 (HANMAM 특화 개발)

기존 한마음 시스템(hm.hanmam.kr) 분석을 기반으로 HANMAM에서 신규 개발하는 도메인 특화 업무 모듈입니다.

| 메뉴 | 주요 기능 |
|------|---------|
| 📈 **경영정보** | 회의관리, 프로젝트현황, 연간사업계획, 경영성과분석, 수금현황, 지출예산/실적, 상품관리, 총괄경영정보 |
| 💼 **영업업무** | 고객사관리, 계약관리, 계산서발행요청, 사외/사내매출, 사내매입, 수금분석, 인건비관리, 지출예산관리, 지출관리 |
| 🛠 **서비스업무** | 상담접수, 상담관리, 상담통계, IP관리 |
| 📁 **업무지원** | 슬기로운회사생활, 개발관리게시판, 설계문서관리/조회, 문서발송/수신대장 |
| 📢 **알림게시판** | 일정공유, 공용예약 |
| 💰 **자금업무** | 계산서발행, 경비지급관리, 카드사용내역, 통장입출금, 미처리지출, 미처리수금 |

---

## 3. 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | React 기반 풀스택 (App Router) |
| TypeScript | 5.x | 타입 시스템 |
| Ant Design | 5.x | B2B 어드민 UI 컴포넌트 |
| Zustand | 4.x | 전역 상태 관리 |
| TanStack Query | 5.x | 서버 상태 관리 (API 캐싱) |
| React Hook Form | 7.x | 폼 관리 |
| Zod | 3.x | 스키마 검증 |
| Axios | 1.x | HTTP 클라이언트 |
| EventSource | - | SSE 실시간 스트리밍 (AI 채팅) |

### Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | 10.x | 서버 프레임워크 (Modular Monolith) |
| TypeScript | 5.x | 타입 시스템 |
| Node.js | 20.x LTS | 런타임 |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 15.x | 주 데이터베이스 |
| Redis | 7.x | AI 채팅 세션 캐시 (선택, 확장 시) |
| Passport + JWT | - | 인증 |
| class-validator | 0.14.x | DTO 검증 |
| @nestjs/swagger | 7.x | API 문서화 |
| @anthropic-ai/sdk | latest | **Claude AI 연동 (AMA 통합)** |
| @nestjs/event-emitter | - | 도메인 이벤트 처리 |

### Infrastructure

| 서비스 | 용도 |
|--------|------|
| Docker / Docker Compose | 컨테이너 오케스트레이션 |
| Nginx | 리버스 프록시, 정적 파일 서빙 |
| PostgreSQL 15 | 운영 데이터베이스 |
| Redis 7 | AI 세션 캐시 (선택) |
| SMTP | 알림 이메일 발송 |

### 개발 도구

| 도구 | 용도 |
|------|------|
| ESLint | 코드 린팅 |
| Prettier | 코드 포매팅 |
| Jest / Vitest | 단위 테스트 |
| Swagger (OpenAPI) | API 문서화 |

---

## 4. 프로젝트 구조

### 전체 구조

```
Hanmam/
├── frontend/                        # Next.js 14 프론트엔드
├── backend/                         # NestJS 백엔드 (Modular Monolith)
├── docs/
│   ├── analysis/                    # 기존 시스템 기능 분석 문서
│   ├── specifications/              # 화면별 기능명세서 (40+ 파일)
│   └── project_basic/               # 프로젝트 기준 문서
├── docker/
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
└── README.md
```

### Backend 구조 (NestJS Modular Monolith)

```
backend/src/
├── modules/
│   │
│   │  ── [ AMA 업무도구 레이어 ] ──────────────────────────────────
│   ├── auth/                        # 인증 모듈 (JWT, 관리자 계정 발급)
│   ├── collaboration/               # 협업 모듈
│   │   ├── business-call/           # 업무연락
│   │   ├── approval/                # 전자결재
│   │   ├── message/                 # 쪽지
│   │   ├── daily-task/              # 나의 업무
│   │   ├── schedule/                # 일정공유
│   │   └── reservation/             # 공용자원 예약
│   ├── ai/                          # AMA AI 통합 모듈 ★
│   │   ├── claude/                  # Claude API 싱글 게이트웨이
│   │   ├── chat/                    # AI 채팅 (부서별 에이전트, SSE)
│   │   └── ai-usage/                # AI 쿼터 관리
│   │
│   │  ── [ HANMAM 업무모듈 레이어 ] ────────────────────────────────
│   ├── core-biz/                    # 경영정보 + 영업업무 모듈
│   │   ├── management-info/         # 경영정보 (회의·프로젝트·성과분석 등)
│   │   ├── customer/                # 고객사 관리
│   │   ├── contract/                # 계약 관리
│   │   ├── project/                 # 프로젝트 관리
│   │   ├── invoice/                 # 계산서 발행요청
│   │   ├── trade-record/            # 사외/사내 매출/매입/인건비
│   │   ├── expense/                 # 지출 관리
│   │   └── budget/                  # 지출예산 관리
│   ├── service-biz/                 # 서비스업무 모듈
│   │   ├── consultation/            # 상담 접수/관리/통계
│   │   └── ip-management/           # IP 관리
│   ├── support/                     # 업무지원 + 알림게시판 모듈
│   │   ├── board/                   # 슬기로운회사생활, 개발관리 게시판
│   │   ├── design-doc/              # 설계문서 관리/조회
│   │   └── doc-register/            # 문서발송/수신대장
│   └── finance/                     # 자금업무 모듈
│       ├── card-transaction/        # 카드사용내역
│       ├── bank-transaction/        # 통장입출금내역
│       └── finance-matching/        # 미처리 수금/지출 매칭
│
├── global/
│   ├── config/
│   ├── filter/
│   ├── interceptor/
│   ├── decorator/
│   └── guard/
├── app.module.ts
└── main.ts
```

### Frontend 구조 (Next.js App Router)

```
frontend/src/
├── app/
│   ├── (auth)/                      # 로그인 레이아웃
│   └── (main)/                      # 메인 레이아웃 (인증 필요)
│       ├── layout.tsx               # GNB + LNB (AMA 도구 포함)
│       ├── dashboard/               # 메인 대시보드
│       │
│       │   ── [ AMA 도구 영역 ] ──
│       ├── ai-chat/                 # AI 채팅 (부서별 에이전트, SSE)
│       ├── collaboration/           # 업무연락·결재·쪽지·나의업무
│       │
│       │   ── [ HANMAM 업무모듈 영역 ] ──
│       ├── management-info/         # 경영정보
│       ├── sales/                   # 영업업무
│       ├── service/                 # 서비스업무
│       ├── support/                 # 업무지원
│       ├── notice/                  # 알림게시판
│       └── finance/                 # 자금업무
│
├── features/
│   ├── auth/
│   ├── ai/                          # AI 채팅 기능 (SSE 클라이언트)
│   ├── collaboration/
│   ├── core-biz/
│   ├── service-biz/
│   ├── support/
│   └── finance/
├── components/
│   ├── layout/                      # GNB, LNB, Footer
│   ├── common/                      # 공통 UI
│   └── ai/                          # AI 채팅 UI 컴포넌트
└── lib/
    ├── api-client.ts
    ├── sse-client.ts                # SSE 클라이언트 유틸리티
    └── utils.ts
```

---

## 5. 시작하기

### 필수 요구사항

- Node.js 20.x LTS
- npm 10.x
- Docker & Docker Compose
- PostgreSQL 15.x (Docker로 실행 권장)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/{org}/hanmam.git
cd hanmam

# 백엔드 의존성 설치
cd backend && npm install

# 프론트엔드 의존성 설치 (별도 터미널)
cd frontend && npm install && npm install antd @ant-design/nextjs-registry

# 환경 변수 설정
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development

# Docker PostgreSQL 실행
docker-compose -f docker/docker-compose.dev.yml up -d

# 백엔드 개발 서버
cd backend && npm run start:dev

# 프론트엔드 개발 서버
cd frontend && npm run dev
```

### 환경 변수 설정

```bash
# backend/.env.development

NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=hanmam
DB_PASSWORD=hanmam1234
DB_DATABASE=db_hanmam

# JWT
JWT_SECRET=hanmam_jwt_secret_key_here
JWT_ACCESS_EXPIRATION=8h
JWT_REFRESH_EXPIRATION=7d

# API 서버
API_PORT=3000
API_PREFIX=api/v1

# CORS
CORS_ORIGINS=http://localhost:3001

# Swagger
SWAGGER_ENABLED=true

# ── AMA AI 통합 ──────────────────────
ANTHROPIC_API_KEY=your_claude_api_key_here
AI_DAILY_TOKEN_LIMIT=500000
AI_MONTHLY_TOKEN_LIMIT=10000000

# SMTP (알림 이메일)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=HANMAM <noreply@hanmam.co.kr>
```

```bash
# frontend/.env.development

NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=HANMAM by AMA
```

### 접속 URL

| 서비스 | URL |
|--------|-----|
| API 서버 | http://localhost:3000 |
| Swagger 문서 | http://localhost:3000/api-docs |
| 프론트엔드 | http://localhost:3001 |
| Adminer (DB 관리) | http://localhost:8080 |

---

## 6. 개발 가이드

### 코드 컨벤션

#### 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 파일명 (컴포넌트) | PascalCase | `ContractManagementPage.tsx` |
| 파일명 (훅) | camelCase + use 접두사 | `useContractList.ts` |
| 파일명 (서비스) | kebab-case | `contract.service.ts` |
| 변수/함수 | camelCase | `getContractById` |
| 상수 | SCREAMING_SNAKE_CASE | `MAX_PAGE_SIZE` |
| 타입/인터페이스 | PascalCase | `ContractResponse` |
| DB 테이블 | `hm_` 접두사 + snake_case | `hm_contracts` |
| DB 컬럼 | 3자 prefix + snake_case | `ctr_id`, `ctr_name` |

#### 브랜치 전략

```
main (production)
 └── develop
      ├── feature/HM-123-contract-create
      ├── feature/HM-200-ai-chat-stream
      ├── bugfix/HM-124-login-error
      └── hotfix/HM-125-critical-fix
```

#### 커밋 메시지

```
feat(ai): Claude API SSE 스트리밍 채팅 구현

- ClaudeService.streamMessage() 추가
- SSE Controller 엔드포인트 구현
- 프론트엔드 EventSource 클라이언트 연동

Closes #HM-200
```

---

## 7. API 문서

개발 서버 실행 후: http://localhost:3000/api-docs

```json
// 성공 응답
{ "success": true, "data": { ... }, "timestamp": "..." }

// 목록 응답
{ "success": true, "data": [...], "pagination": { ... }, "timestamp": "..." }

// 에러 응답
{ "success": false, "error": { "code": "E3001", "message": "..." }, "timestamp": "..." }
```

---

## 8. 테스트

```bash
cd backend
npm run test          # 전체 테스트
npm run test:watch    # watch 모드
npm run test:coverage # 커버리지
npm run test:e2e      # E2E 테스트
```

| 테스트 유형 | 목표 |
|-------------|------|
| 단위 테스트 | 핵심 서비스 로직 80%+ |
| 통합 테스트 | 핵심 API 100% |

---

## 9. 배포

| 환경 | 브랜치 | URL |
|------|--------|-----|
| Development | develop | http://localhost |
| Staging | release/* | https://stg.hanmam.co.kr |
| Production | main | https://hanmam.co.kr |

---

## 10. 참고 문서

| 문서명 | 파일 경로 | 설명 |
|--------|---------|------|
| 화면 기능명세서 | `docs/specifications/*.md` | 전체 40개 화면 입출력/와이어프레임 |
| ERD 설계서 | `docs/erd_draft.md` | 데이터베이스 초기 설계 |
| 기능 분석서 | `docs/analysis/*.md` | 기존 시스템 화면/기능 분석 |
| SPEC | `docs/project_basic/HANMAM_SPEC.md` | 기술 명세 및 아키텍처 |
| SKILL | `docs/project_basic/HANMAM_SKILL.md` | 개발 패턴 가이드 |

---

## 문의 및 라이선스

이 프로젝트는 사내 비공개 소프트웨어입니다. 무단 복제 및 배포를 금지합니다.
Copyright (c) 2026 Hanmam Company. All rights reserved.

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|---------|
| v1.0.0 | 2026-04-11 | 개발팀 | 최초 작성 |
| v1.1.0 | 2026-04-11 | 개발팀 | AMA 통합 적용 (AI 채팅, SSE, 플랫폼 구성 이원화) |
