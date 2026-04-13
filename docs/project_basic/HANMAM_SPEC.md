# HANMAM by AMA - SPEC 기술 명세서

**문서버전:** v1.1
**작성일:** 2026-04-11
**프로젝트명:** HANMAM by AMA (한마음 시스템 차세대)
**도메인:** hanmam.co.kr

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [플랫폼 구성 (AMA + HANMAM)](#2-플랫폼-구성-ama--hanmam)
3. [기술 스택](#3-기술-스택)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [프로젝트 구조](#5-프로젝트-구조)
6. [AI 통합 설계 (AMA)](#6-ai-통합-설계-ama-)
7. [데이터베이스 설계](#7-데이터베이스-설계)
8. [API 설계](#8-api-설계)
9. [인증/인가](#9-인증인가)
10. [개발 환경](#10-개발-환경)
11. [코드 컨벤션](#11-코드-컨벤션)
12. [배포 환경](#12-배포-환경)
13. [비기능 요구사항](#13-비기능-요구사항)
14. [참고 문서](#14-참고-문서)

---

## 1. 프로젝트 개요

### 1.1 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | SPEC.md |
| 프로젝트명 | HANMAM by AMA (한마음 시스템 차세대) |
| 버전 | v1.1 |
| 작성일 | 2026-04-11 |
| 도메인 | hanmam.co.kr |

### 1.2 서비스 소개

**HANMAM by AMA**는 AMA(AI 업무 플랫폼)의 AI 협업 도구와 기존 한마음 시스템(hm.hanmam.kr)의 업무 모듈을 결합한 통합 사내 업무 플랫폼입니다.

- **AMA 업무도구**: Claude API 기반 AI 채팅·분석, 업무연락, 전자결재, 쪽지 등 (AMA 베이스 기반 개발)
- **HANMAM 업무모듈**: Java Spring 기반 기존 시스템을 완전 재구축 (경영정보·영업·자금·서비스 등)

두 레이어를 **MSA 확장이 용이한 Modular Monolith** 구조 위에서 단일 포털로 통합합니다.

### 1.3 핵심 가치

| 가치 | 설명 |
|------|------|
| **AMA + HANMAM 통합** | AMA AI 협업 도구 + HANMAM 업무 모듈의 단일 포털 통합 |
| **AI 기반 업무 자동화** | Claude API 연동 경영분석·문서생성·상담처리·채팅 AI |
| **Modular Monolith** | 도메인별 엄격한 모듈 분리, MSA 전환 준비 완료 |
| **자금 자동 매칭** | 카드·통장 내역과 결의서/계산서의 자동 정산 |

### 1.4 사용자 유형

| 유형 | 역할 | 주요 기능 |
|------|------|---------|
| **ADMIN** | 시스템 전체 운영 | 사용자 등록/관리, AI 쿼터 설정, 마스터 코드 관리 |
| **MANAGER** | 팀장/부서장 | 결재 승인, 팀 업무 모니터링, 경영보고, AI 분석 |
| **USER** | 일반 직원 | AMA 도구 + 나의업무, 업무연락, 결재 기안, 지출 신청 |

> **중요:** 사용자 계정은 ADMIN이 직접 발급 — 이메일 초대·자가 가입 없음

### 1.5 주요 기능

| 기능 ID | 레이어 | 기능명 | 설명 |
|---------|--------|--------|------|
| FN-001 | AMA | AI 채팅 (Claude) | 부서별 AI 에이전트, SSE 스트리밍 |
| FN-002 | AMA | 업무연락 | 처리중/담당/관심 탭 협조 관리 |
| FN-003 | AMA | 전자결재 | 기안·승인·반려 워크플로우 |
| FN-004 | AMA | 쪽지 | 1:1 단문 메시지 |
| FN-005 | AMA | 나의 업무 | 일별 업무 계획/실적 타임라인 |
| FN-006 | HANMAM | 경영정보 | 회의관리, 성과분석, 수금현황, 총괄경영 대시보드 |
| FN-007 | HANMAM | 영업업무 | 고객사·계약·매출·지출 관리 |
| FN-008 | HANMAM | 서비스업무 | 상담 접수/관리/통계, IP 관리 |
| FN-009 | HANMAM | 업무지원 | 게시판, 설계문서, 문서대장 |
| FN-010 | HANMAM | 알림게시판 | 일정공유, 공용자원 예약 |
| FN-011 | HANMAM | 자금업무 | 계산서발행, 카드·통장내역, 미처리 매칭 |

---

## 2. 플랫폼 구성 (AMA + HANMAM)

### 2.1 이원화 레이어 구조

```
┌──────────────────────────────────────────────────────────────────────┐
│                     HANMAM by AMA - 통합 플랫폼                       │
├───────────────────────────────┬──────────────────────────────────────┤
│  AMA 업무도구 레이어            │  HANMAM 업무모듈 레이어               │
│  (AMA 베이스 기반 개발)          │  (HANMAM 신규 개발)                  │
│                               │                                      │
│  ✦ AI 채팅 (Claude API/SSE)   │  ✦ 경영정보                          │
│  ✦ 나의 업무                   │  ✦ 영업업무                          │
│  ✦ 업무연락                    │  ✦ 서비스업무                        │
│  ✦ 전자결재                    │  ✦ 업무지원                          │
│  ✦ 쪽지                       │  ✦ 알림게시판                        │
│  ✦ 일정공유                    │  ✦ 자금업무                          │
│  ✦ 공용자원 예약                │                                      │
│  ✦ 근태현황                    │                                      │
└───────────────────────────────┴──────────────────────────────────────┘
```

### 2.2 데이터 공유 원칙

- 두 레이어는 **공통 사용자(`hm_users`) 및 부서(`hm_departments`) 테이블을 공유**합니다.
- AMA 도구 AI 쿼터 사용량은 `hm_ai_usage`에 사용자별로 기록됩니다.
- 모듈 간 데이터 공유는 직접 import 금지 → **이벤트(EventEmitter) 또는 API 경유**

---

## 3. 기술 스택

### 3.1 Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 14.x | React 기반 풀스택 (App Router) |
| TypeScript | 5.x | 타입 시스템 |
| Ant Design | 5.x | B2B 어드민 UI |
| Zustand | 4.x | 전역 상태 관리 |
| TanStack Query | 5.x | 서버 상태 관리 |
| React Hook Form | 7.x | 폼 관리 |
| Zod | 3.x | 스키마 검증 |
| Axios | 1.x | HTTP 클라이언트 |
| EventSource | - | SSE AI 스트리밍 수신 |

### 3.2 Backend

| 기술 | 버전 | 용도 |
|------|------|------|
| NestJS | 10.x | 서버 프레임워크 (Modular Monolith) |
| TypeScript | 5.x | 타입 시스템 |
| Node.js | 20.x LTS | 런타임 |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 15.x | 주 데이터베이스 |
| Redis | 7.x | AI 세션 캐시 (선택, 확장 시) |
| Passport + JWT | - | 인증 |
| class-validator | 0.14.x | DTO 검증 |
| @nestjs/swagger | 7.x | API 문서화 |
| **@anthropic-ai/sdk** | latest | **Claude AI 연동 (AMA 핵심)** |
| RxJS | - | SSE Observable 스트리밍 |
| @nestjs/event-emitter | - | 도메인 간 이벤트 처리 |

### 3.3 인프라

| 서비스 | 용도 |
|--------|------|
| Docker / Docker Compose | 컨테이너 오케스트레이션 |
| Nginx | 리버스 프록시, 정적 파일 서빙 |
| PostgreSQL 15 | 운영 데이터베이스 |
| Redis 7 | AI 채팅 세션 캐시 (선택) |
| SMTP (nodemailer) | 알림 이메일 발송 |
| Let's Encrypt | SSL 인증서 |

---

## 4. 시스템 아키텍처

### 4.1 아키텍처 원칙

| 원칙 | 설명 | 적용 |
|------|------|------|
| **Clean Architecture** | 관심사 분리, 의존성 역전 | 4-Layer 구조 |
| **Modular Monolith** | 도메인별 엄격한 모듈 분리 | AMA 도구 + HANMAM 모듈 이원화 |
| **AI First (AMA)** | AMA ClaudeService 싱글 게이트웨이 | 모든 AI 호출은 ClaudeService 경유 |
| **Type Safety** | TypeScript strict 모드 | 전체 코드베이스 적용 |

### 4.2 계층 구조 (4-Layer)

```
┌────────────────────────────────────────────────────────────────┐
│              Presentation Layer (프레젠테이션 계층)               │
│         Controller, Request/Response DTO, Validation             │
├────────────────────────────────────────────────────────────────┤
│              Application Layer (애플리케이션 계층)                │
│                    Service, Mapper                               │
├────────────────────────────────────────────────────────────────┤
│                Domain Layer (도메인 계층)                         │
│             Entity, Repository Interface                         │
├────────────────────────────────────────────────────────────────┤
│             Infrastructure Layer (인프라 계층)                   │
│    Repository Impl, ClaudeService(AI), DB, External API          │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 전체 시스템 구성도

```
                     ┌─────────────────┐
                     │   Cloud DNS      │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │  Nginx Proxy    │
                     │  (SSL/HTTPS)    │
                     └────────┬────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                          │
┌────────▼────────┐                    ┌────────────▼────────────┐
│  Next.js (FE)   │                    │   NestJS API (BE)        │
│  (AntD Admin UI)│ ←─── API/SSE ───→ │   (Modular Monolith)     │
└─────────────────┘                    └────────────┬────────────┘
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                   ┌──────────▼──────┐  ┌───────────▼──────┐  ┌─────────▼────────┐
                   │  PostgreSQL 15   │  │  Claude API      │  │  SMTP/External   │
                   │  (db_hanmam)     │  │  (Anthropic)     │  │  (Email 등)      │
                   └─────────────────┘  └──────────────────┘  └──────────────────┘
                              │
                   ┌──────────▼──────┐
                   │  Redis 7        │
                   │  (AI Cache, 선택)│
                   └─────────────────┘
```

---

## 5. 프로젝트 구조

### 5.1 전체 구조

```
Hanmam/
├── frontend/                        # Next.js 14 프론트엔드
├── backend/                         # NestJS 백엔드
├── docs/
│   ├── analysis/
│   ├── specifications/              # 화면별 기능명세서 (40개+)
│   └── project_basic/
└── docker/
```

### 5.2 Backend 구조 (NestJS Modular Monolith)

```
backend/src/
├── modules/
│   │  ── [ AMA 업무도구 레이어 ] ─────────────────────────────────
│   ├── auth/                        # 인증 (JWT, 관리자 계정 발급)
│   ├── ai/                          # ★ AMA AI 통합 모듈
│   │   ├── claude/                  # ClaudeService (싱글 게이트웨이)
│   │   ├── chat/                    # AI 채팅 도메인 (SSE)
│   │   └── ai-usage/                # AI 쿼터 관리
│   ├── collaboration/               # AMA 협업 도구
│   │   ├── business-call/           # 업무연락
│   │   ├── approval/                # 전자결재
│   │   ├── message/                 # 쪽지
│   │   ├── daily-task/              # 나의 업무
│   │   ├── schedule/                # 일정공유
│   │   └── reservation/             # 공용자원 예약
│   │
│   │  ── [ HANMAM 업무모듈 레이어 ] ──────────────────────────────
│   ├── core-biz/                    # 경영정보 + 영업업무
│   │   ├── management-info/
│   │   ├── customer/
│   │   ├── contract/
│   │   ├── project/
│   │   ├── invoice/
│   │   ├── trade-record/
│   │   ├── expense/
│   │   └── budget/
│   ├── service-biz/                 # 서비스업무
│   │   ├── consultation/
│   │   └── ip-management/
│   ├── support/                     # 업무지원 + 알림게시판
│   │   ├── board/
│   │   ├── design-doc/
│   │   └── doc-register/
│   └── finance/                     # 자금업무
│       ├── card-transaction/
│       ├── bank-transaction/
│       └── finance-matching/
│
├── global/
│   ├── config/
│   ├── filter/                      # BusinessException 필터
│   ├── interceptor/                 # 응답 변환 인터셉터
│   ├── decorator/                   # @CurrentUser, @Roles
│   └── guard/                       # JwtAuthGuard, RolesGuard
├── app.module.ts
└── main.ts
```

### 5.3 Frontend 구조

```
frontend/src/
├── app/
│   ├── (auth)/login/
│   └── (main)/
│       ├── layout.tsx               # GNB + LNB
│       ├── dashboard/
│       ├── ai-chat/                 # ★ AI 채팅 (AMA)
│       ├── collaboration/           # AMA 협업 도구
│       ├── management-info/
│       ├── sales/
│       ├── service/
│       ├── support/
│       ├── notice/
│       └── finance/
├── features/
│   ├── auth/
│   ├── ai/                          # AI 채팅 기능 (SSE 클라이언트)
│   ├── collaboration/
│   ├── core-biz/
│   ├── service-biz/
│   ├── support/
│   └── finance/
├── components/
│   ├── layout/
│   ├── common/
│   └── ai/                          # AI 채팅 UI 컴포넌트
└── lib/
    ├── api-client.ts
    └── sse-client.ts                # SSE 클라이언트 유틸리티
```

---

## 6. AI 통합 설계 (AMA) ★

### 6.1 AI 서비스 아키텍처 (ClaudeService 싱글 게이트웨이)

```
사용자 요청
  └── Controller
       └── DomainService
            └── ClaudeService (ai/claude 모듈)
                 ├── checkQuotaIfNeeded()   ─→ AiUsageService.checkQuota()
                 ├── sendMessage()          ─→ 동기 응답
                 └── streamMessage()        ─→ SSE Observable 스트리밍
```

### 6.2 AI 쿼터 관리

| 항목 | 설명 |
|------|------|
| 일일 쿼터 | 사용자별 일일 토큰 한도 (기본: 500,000 tokens) |
| 월간 쿼터 | 사용자별 월간 토큰 한도 (기본: 10,000,000 tokens) |
| 강제 시점 | ClaudeService 호출 전 자동 검증 |
| 에러 코드 | `E4010` (일간 초과), `E4011` (월간 초과) |

### 6.3 HANMAM 특화 AI 적용 영역

| 도메인 | 기능 | 방식 |
|--------|------|------|
| 경영정보 | 경영성과 AI 분석 리포트 | 동기 응답 |
| 영업업무 | 계약서 요약·핵심 조항 추출 | 동기 응답 |
| 서비스업무 | 상담 접수 유형 자동 분류 | 동기 응답 |
| 업무지원 | 설계문서 AI 자동 생성 | 동기 응답 |
| AI 채팅 | 부서별 전문 에이전트 대화 | SSE 스트리밍 |
| 업무연락 | 스레드 내용 AI 요약 | 동기 응답 |

### 6.4 SSE 실시간 처리

| 영역 | 목적 |
|------|------|
| AI 채팅 | Claude 응답을 청크 단위로 스트리밍 전달 |
| 알림 | 업무연락·결재 실시간 알림 Push |

```
BE: @Sse() + RxJS Observable → SSE MessageEvent 스트리밍
FE: EventSource (Browser) → onmessage 콜백으로 텍스트 누적
```

---

## 7. 데이터베이스 설계

### 7.1 데이터베이스 정보

| 항목 | 값 |
|------|-----|
| 데이터베이스명 | `db_hanmam` |
| DBMS | PostgreSQL 15+ |
| Charset | UTF-8 |
| 테이블 접두사 | `hm_` |
| 컬럼 접두사 | 3자 (테이블별 고유) |

### 7.2 네이밍 컨벤션

| 구분 | 규칙 | 예시 |
|------|------|------|
| 테이블명 | `hm_{domain}_{name_plural}` | `hm_contracts`, `hm_ai_usage` |
| 컬럼명 | 3자 prefix + snake_case | `ctr_name`, `aiu_tokens` |
| PK | `{col_prefix}_id` (UUID) | `ctr_id` |
| FK | 참조 테이블 PK명 그대로 | `usr_id`, `ctr_id` |
| Boolean | `{col_prefix}_is_{name}` | `ctr_is_active` |
| Soft Delete | `{col_prefix}_deleted_at` | `ctr_deleted_at` |

### 7.3 도메인별 테이블 구성

| 도메인 | 레이어 | 주요 테이블 |
|--------|--------|---------|
| **인증/조직** | 공용 | `hm_users`, `hm_departments` |
| **AI (AMA)** | AMA | `hm_ai_usage`, `hm_ai_chat_sessions`, `hm_ai_chat_messages` |
| **협업 (AMA)** | AMA | `hm_approval_docs`, `hm_business_calls`, `hm_messages`, `hm_daily_tasks`, `hm_schedules`, `hm_reservations` |
| **경영·영업** | HANMAM | `hm_customers`, `hm_projects`, `hm_contracts`, `hm_products`, `hm_trade_records`, `hm_invoices`, `hm_expenses`, `hm_budgets` |
| **자금** | HANMAM | `hm_card_transactions`, `hm_bank_transactions` |
| **서비스** | HANMAM | `hm_consultations`, `hm_ip_allocations` |
| **공통** | HANMAM | `hm_boards`, `hm_doc_registers` |

### 7.4 자금 매칭 핵심 관계

```
hm_invoices (계산서 발행)
    └── linked_bank_tx_id → hm_bank_transactions (수금 매칭)

hm_expenses (지출결의)
    └── linked_bank_tx_id → hm_bank_transactions (지급 매칭)
    └── linked_card_tx_id → hm_card_transactions (카드 매칭)
```

### 7.5 스키마 마이그레이션

| 환경 | 방식 |
|------|------|
| 개발 | TypeORM `synchronize: true` |
| 스테이징/프로덕션 | 수동 SQL (`synchronize: false`) |

---

## 8. API 설계

### 8.1 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `/api/v1` |
| 인증 방식 | Bearer Token (JWT) |
| Content-Type | `application/json` |
| 문서화 | Swagger `/api-docs` |

### 8.2 API 응답 구조

```typescript
// 단일 응답
interface BaseSingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: { code: string; message: string; };
}

// 목록 응답
interface BaseListResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; size: number; totalCount: number; totalPages: number; };
  timestamp: string;
}
```

### 8.3 에러 코드 체계

| 코드 | 유형 |
|------|------|
| E1xxx | 인증/인가 오류 |
| E2xxx | 사용자 관련 오류 |
| E3xxx | 데이터 조회/처리 오류 |
| **E4010** | **AI 일일 쿼터 초과 (AMA)** |
| **E4011** | **AI 월간 쿼터 초과 (AMA)** |
| E5xxx | 비즈니스 도메인 오류 |
| E9xxx | 시스템 오류 |

### 8.4 주요 API 엔드포인트

**인증:**
| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/auth/login` | 로그인 |
| POST | `/auth/refresh` | 토큰 갱신 |
| POST | `/auth/users` | 사용자 등록 (ADMIN 전용) |

**AI 채팅 (AMA):**
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET(SSE) | `/ai/chat/stream` | **AI 채팅 SSE 스트리밍** |
| POST | `/ai/chat` | AI 채팅 동기 응답 |
| GET | `/ai/usage` | AI 사용량 조회 |

**영업/경영(HANMAM):**
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | `/customers` | 고객사 목록/등록 |
| GET/POST | `/contracts` | 계약 목록/등록 |
| GET/POST | `/invoices` | 계산서 발행요청 |
| GET/POST | `/expenses` | 지출 목록/등록 |

**자금(HANMAM):**
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/finance/card-transactions` | 카드내역 |
| GET | `/finance/bank-transactions` | 통장내역 |
| PATCH | `/finance/card-transactions/:id/match` | 카드 매칭 |
| PATCH | `/finance/bank-transactions/:id/match` | 통장 매칭 |

**협업(AMA):**
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | `/approvals` | 전자결재 목록/기안 |
| PATCH | `/approvals/:id/approve` | 승인 |
| PATCH | `/approvals/:id/reject` | 반려 |
| GET/POST | `/business-calls` | 업무연락 |
| GET/POST | `/messages` | 쪽지 |

---

## 9. 인증/인가

### 9.1 토큰 정책

| 항목 | Access Token | Refresh Token |
|------|-------------|---------------|
| 유효기간 | 8시간 | 7일 |
| 저장 위치 | Memory / Authorization Header | HttpOnly Cookie |

### 9.2 권한 체계

| 역할 | 권한 범위 |
|------|---------|
| `ADMIN` | 전체 시스템, 사용자 등록, AI 쿼터 설정 |
| `MANAGER` | 결재 승인, 경영보고, AI 기능, 팀원 모니터링 |
| `USER` | 본인 데이터, 결재 기안, AI 채팅 사용 |

### 9.3 보안 정책

| 정책 | 값 |
|------|-----|
| 비밀번호 해싱 | bcrypt (salt rounds: 12) |
| 로그인 시도 제한 | 5회 실패 → 30분 잠금 |
| HTTPS | 필수 (TLS 1.3) |
| CORS | 허용 도메인 명시 |
| 보안 헤더 | helmet 미들웨어 |
| AI Key 관리 | 서버 사이드 전용 (클라이언트 직접 호출 금지) |
| AI 프롬프트 보안 | 사용자 입력을 system prompt에 직접 삽입 금지 |

---

## 10. 개발 환경

### 10.1 포트 매핑

| 서비스 | 포트 | 용도 |
|--------|------|------|
| Backend API (NestJS) | 3000 | REST API + SSE |
| Frontend (Next.js) | 3001 | 개발 서버 |
| PostgreSQL | 5432 | 데이터베이스 |
| Redis | 6379 | AI 세션 캐시 (선택) |
| Adminer | 8080 | DB 관리 UI |

### 10.2 환경 변수 핵심 항목

```bash
# backend/.env.development

# Database
DB_HOST=localhost / DB_PORT=5432 / DB_DATABASE=db_hanmam

# JWT
JWT_SECRET=... / JWT_ACCESS_EXPIRATION=8h / JWT_REFRESH_EXPIRATION=7d

# AMA AI 통합
ANTHROPIC_API_KEY=your_claude_api_key
AI_DAILY_TOKEN_LIMIT=500000
AI_MONTHLY_TOKEN_LIMIT=10000000

# SMTP
SMTP_HOST=smtp.gmail.com / SMTP_PORT=587 / SMTP_USER=... / SMTP_PASS=...
```

---

## 11. 코드 컨벤션

### 11.1 파일명 규칙

| 유형 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase | `ContractManagementPage.tsx` |
| 훅 | camelCase + use | `useContractList.ts` |
| 서비스 | kebab-case + .service | `contract.service.ts` |
| 컨트롤러 | kebab-case + .controller | `contract.controller.ts` |
| 엔티티 | kebab-case + .entity | `contract.entity.ts` |

### 11.2 브랜치 전략

| 브랜치 | 용도 | 배포 |
|--------|------|------|
| `main` | 프로덕션 릴리즈 | 프로덕션 서버 |
| `develop` | 개발 통합 | 스테이징 서버 |
| `feature/HM-*` | 기능 개발 | 로컬 |
| `hotfix/*` | 긴급 수정 | - |

---

## 12. 배포 환경

| 환경 | Web | API |
|------|-----|-----|
| 개발 | http://localhost:3001 | http://localhost:3000 |
| 스테이징 | https://stg.hanmam.co.kr | https://stg.hanmam.co.kr/api/v1 |
| 프로덕션 | https://hanmam.co.kr | https://hanmam.co.kr/api/v1 |

```yaml
# docker-compose.prod.yml
services:
  web:       # Nginx + Next.js 정적 빌드
  api:       # NestJS (Modular Monolith)
  postgres:  # PostgreSQL 15
  redis:     # Redis 7 (선택, AI 세션)
```

---

## 13. 비기능 요구사항

| 요구사항 | 목표 |
|---------|------|
| 응답 시간 | 일반 API 500ms 이내 / AI 동기 5초 이내 |
| AI 스트리밍 | 첫 토큰 응답 2초 이내 (TTFT) |
| 동시 사용자 | 최대 50명 동시 접속 지원 |
| 가용성 | 99.5% 이상 |
| 보안 | HTTPS 필수, JWT, bcrypt, AI Key 서버 사이드 전용 |
| 접근성 | 크롬/엣지 최신 버전 지원 |

---

## 14. 참고 문서

| 문서명 | 파일 경로 |
|--------|---------|
| 메뉴 구조 | `docs/analysis/menu_structure.md` |
| 화면 기능명세서 | `docs/specifications/*.md` (40개+) |
| ERD 초안 | `docs/erd_draft.md` |
| 기능 분석서 | `docs/analysis/*.md` |
| SKILL 가이드 | `docs/project_basic/HANMAM_SKILL.md` |

---

## 문서 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|---------|
| v1.0 | 2026-04-11 | 개발팀 | 최초 작성 |
| v1.1 | 2026-04-11 | 개발팀 | HANMAM by AMA 통합 - AI 섹션 추가, 플랫폼 이원화 구조 반영 |
