# Amoeba Basic README v1

## Amoeba Company 표준 README 템플릿

**문서버전:** v2.1
**작성일:** 2026-04-11
**작성:** Amoeba Company
**적용 범위:** Amoeba Company 전체 웹 프로젝트

---

> 아래는 Amoeba Company 프로젝트의 README.md 표준 템플릿입니다.
> `{프로젝트명}`, `{설명}` 등 플레이스홀더를 실제 내용으로 교체하여 사용합니다.

---

# {프로젝트코드} - {프로젝트명}
# {Project Code} - {Project Name}

## 프로젝트 정보 | Project Info

| 항목 / Item | 내용 / Value |
|-------------|--------------|
| **버전 / Version** | 1.0.0 |
| **라이선스 / License** | Private (비공개 / Proprietary) |
| **Node.js** | 20.x LTS |
| **TypeScript** | 5.x |
| **작성일 / Date** | YYYY-MM-DD |

> **{프로젝트 한줄 소개}**
> **{One-line project description in English}**

---

## 목차 | Table of Contents

1. [프로젝트 소개 | Introduction](#1-프로젝트-소개--introduction)
2. [기술 스택 | Tech Stack](#2-기술-스택--tech-stack)
3. [프로젝트 구조 | Project Structure](#3-프로젝트-구조--project-structure)
4. [시작하기 | Getting Started](#4-시작하기--getting-started)
5. [개발 가이드 | Development Guide](#5-개발-가이드--development-guide)
6. [API 문서 | API Documentation](#6-api-문서--api-documentation)
7. [테스트 | Testing](#7-테스트--testing)
8. [배포 | Deployment](#8-배포--deployment)
9. [기여 가이드 | Contributing](#9-기여-가이드--contributing)
10. [참고 문서 | References](#10-참고-문서--references)
11. [문의 및 라이선스 | Contact & License](#11-문의-및-라이선스--contact--license)

---

## 1. 프로젝트 소개 | Introduction

### 개요 | Overview

{프로젝트에 대한 간략한 소개를 작성합니다. 2~3문장으로 서비스의 목적과 핵심 가치를 설명합니다.}

{Brief project description in English. 2-3 sentences about the service purpose and core values.}

### 핵심 가치 | Core Values

| 기능 / Feature | 설명 / Description |
|----------------|-------------------|
| **{기능1}** | {설명} / {Description} |
| **{기능2}** | {설명} / {Description} |
| **{기능3}** | {설명} / {Description} |

### 서비스 대상 | Target Users

| 사용자 유형 / User Type | 설명 / Description | 주요 기능 / Main Features |
|------------------------|-------------------|-------------------------|
| **일반 사용자 (User)** | 부서별 AI 채팅 사용 / Department AI chat users | 대시보드, 채팅 / Dashboard, Chat |
| **매니저 (Manager)** | 팀 관리자 / Team managers | User + 멤버 조회, 초대 관리 / User + Member view, Invitation mgmt |
| **관리자 (Admin)** | 플랫폼 운영팀 / Platform operators | Manager + 역할 변경, 그룹 관리, API 키 관리 / Manager + Role change, Group mgmt, API key mgmt |

---

## 2. 기술 스택 | Tech Stack

### Frontend

> 프로젝트 성격에 따라 React 또는 Vue.js를 선택합니다. 모노레포 내에서 앱별로 서로 다른 프레임워크를 사용할 수도 있습니다.
> Choose React or Vue.js based on the project. Different apps in the monorepo can use different frameworks.

**공통 / Common:**

| 기술 / Tech | 버전 / Version | 용도 / Purpose |
|-------------|---------------|---------------|
| TypeScript | 5.x | 타입 시스템 / Type System |
| Vite | 5.x | 빌드 도구 / Build Tool |
| TailwindCSS | 3.x | 스타일링 / Styling |
| Zod | 3.x | 스키마 검증 / Schema Validation |

**React 선택 시 / When using React:**

| 기술 / Tech | 버전 / Version | 용도 / Purpose |
|-------------|---------------|---------------|
| React | 18.x | UI 라이브러리 / UI Library |
| Zustand | 4.x | 전역 상태 관리 / Global State Management |
| React Query | 5.x | 서버 상태 관리 / Server State Management |
| React Hook Form | 7.x | 폼 관리 / Form Management |
| React Router | 6.x | 라우팅 / Routing |
| react-i18next | 14.x | 다국어 지원 / i18n Support |

**Vue.js 선택 시 / When using Vue.js:**

| 기술 / Tech | 버전 / Version | 용도 / Purpose |
|-------------|---------------|---------------|
| Vue.js | 3.x | UI 프레임워크 / UI Framework |
| Pinia | 2.x | 전역 상태 관리 / Global State Management |
| Vue Query | 5.x | 서버 상태 관리 / Server State Management |
| VeeValidate | 4.x | 폼 관리 / Form Management |
| Vue Router | 4.x | 라우팅 / Routing |
| vue-i18n | 9.x | 다국어 지원 / i18n Support |

### Backend

| 기술 / Tech | 버전 / Version | 용도 / Purpose |
|-------------|---------------|---------------|
| NestJS | 10.x | 서버 프레임워크 / Server Framework |
| TypeScript | 5.x | 타입 시스템 / Type System |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 15.x | 주 데이터베이스 / Primary Database |
| Redis | 7.x | 캐시, 세션, 큐 / Cache, Session, Queue (선택 / Optional) |
| Bull | 4.x | 작업 큐 / Job Queue (선택 / Optional) |
| Passport | 10.x | 인증 / Authentication |

> **Note:** Redis 및 Bull은 서비스 확장 시 도입을 검토합니다. 기본 인증은 JWT(stateless), 작업 큐 미사용 시 생략 가능합니다.
> **Note:** Redis and Bull are optional and should be considered when scaling services. Default auth uses JWT (stateless); job queue can be omitted if not needed.
| nestjs-i18n | 10.x | 다국어 지원 / i18n Support |

### Infrastructure

| 서비스 / Service | 제공사 / Provider | 용도 / Purpose |
|-----------------|------------------|---------------|
| Compute Engine | GCP | API 서버 호스팅 / API Server Hosting |
| Cloud SQL | GCP | PostgreSQL 관리형 / Managed PostgreSQL |
| Memorystore | GCP | Redis 관리형 / Managed Redis |
| Cloud Storage | GCP | 파일 스토리지 / File Storage |

### 개발 도구 | Development Tools

| 도구 / Tool | 용도 / Purpose |
|-------------|---------------|
| ESLint | 코드 린팅 / Code Linting |
| Prettier | 코드 포매팅 / Code Formatting |
| Jest/Vitest | 단위 테스트 / Unit Testing |
| Playwright | E2E 테스트 / E2E Testing |
| Swagger | API 문서화 / API Documentation |
| Storybook | 컴포넌트 문서화 / Component Documentation (선택 / Optional) |
| MSW | Mock 데이터 시스템 / Mock Data System |

### 다국어 (i18n) 지원 | Internationalization Support

| 코드 / Code | 언어 / Language | 상태 / Status |
|-------------|-----------------|--------------|
| `ko` | 한국어 / Korean | 기본 제공 (Fallback) / Default |
| `en` | 영어 / English | 기본 제공 / Supported |

---

## 3. 프로젝트 구조 | Project Structure

### Monorepo 구조 | Monorepo Structure

```
{project}/
├── apps/
│   ├── api/                         # NestJS 백엔드 / NestJS Backend
│   ├── web/                         # 프론트엔드 (React 또는 Vue.js) / Frontend (React or Vue.js)
│   └── admin/                       # 관리자 포털 (React 또는 Vue.js, 선택) / Admin Portal (Optional)
│
├── packages/
│   ├── common/                      # 공통 유틸리티 / Common Utilities
│   ├── types/                       # 공유 타입 정의 / Shared Types
│   └── ui/                          # 공유 UI 컴포넌트 / Shared UI Components
│
├── docker/
│   └── docker-compose.yml
│
├── docs/                            # 문서 / Documentation
├── scripts/                         # 스크립트 / Scripts
├── .github/                         # GitHub Actions
│
├── package.json
├── turbo.json                       # Turborepo 설정 / Turborepo Config
├── tsconfig.json
└── README.md
```

### Backend 구조 | Backend Structure (NestJS)

```
apps/api/src/
├── domain/                          # 도메인별 모듈 / Domain Modules
│   └── {domain}/
│       ├── controller/
│       ├── service/
│       ├── entity/
│       ├── repository/
│       ├── dto/
│       │   ├── request/
│       │   └── response/
│       └── {domain}.module.ts
│
├── database/
│   └── migrations/
│
├── global/                          # 전역 모듈 / Global Modules
│   ├── config/
│   ├── filter/
│   ├── interceptor/
│   └── i18n/
│
├── infrastructure/                  # 인프라 계층 / Infrastructure Layer
│   ├── cache/
│   ├── redis/
│   └── queue/
│
├── app.module.ts
└── main.ts
```

### Frontend 구조 | Frontend Structure

> React 또는 Vue.js에 따라 파일 확장자와 일부 디렉토리명이 달라집니다.
> File extensions and some directory names differ depending on React or Vue.js.

**React:**
```
apps/web/src/
├── domain/{domain}/
│   ├── pages/                       # .tsx
│   ├── components/                  # .tsx
│   ├── hooks/                       # use{Xxx}.ts (커스텀 훅)
│   ├── service/, store/, types/
├── components/, service/, hooks/, store/
├── router/                          # React Router
├── App.tsx
└── main.tsx
```

**Vue.js:**
```
apps/web/src/
├── domain/{domain}/
│   ├── pages/                       # .vue
│   ├── components/                  # .vue
│   ├── composables/                 # use{Xxx}.ts (컴포저블)
│   ├── service/, store/, types/
├── components/, service/, composables/, store/
├── router/                          # Vue Router
├── App.vue
└── main.ts
```

---

## 4. 시작하기 | Getting Started

### 필수 요구사항 | Prerequisites

- Node.js 20.x LTS
- npm 10.x 또는 / or yarn 4.x
- Docker & Docker Compose
- PostgreSQL 15.x
- Redis 7.x (선택, 서비스 확장 시 / Optional, for scaling)

### 설치 | Installation

```bash
# 저장소 클론 / Clone repository
git clone https://github.com/{org}/{project}.git
cd {project}

# 의존성 설치 / Install dependencies
npm install

# 환경 변수 설정 / Setup environment variables
cp .env.example .env.development

# Docker 컨테이너 실행 / Start Docker containers (PostgreSQL)
docker-compose -f docker/docker-compose.dev.yml up -d

# 데이터베이스 마이그레이션 / Run database migrations
npm run migration:run

# 개발 서버 실행 / Start development server
npm run dev
```

### 환경 변수 설정 | Environment Variables

```bash
# .env.development

# 환경 설정 / Environment
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT={port}
DB_USERNAME={username}
DB_PASSWORD={password}
DB_DATABASE={database}

# Redis (선택, 서비스 확장 시 도입 / Optional, for scaling)
# REDIS_HOST=localhost
# REDIS_PORT={port}

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# API 서버 / API Server
API_PORT={port}
API_PREFIX=api/v1

# CORS
CORS_ORIGINS=http://localhost:{frontend_port}

# Swagger
SWAGGER_ENABLED=true

# SMTP (Mail) - 초대 이메일 발송용 / For invitation emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=App Name <noreply@domain.com>

# Frontend URL - 초대 링크 생성용 / For invitation link generation
FRONTEND_URL=http://localhost:{frontend_port}
```

### Frontend 환경 변수 | Frontend Environment Variables

```bash
# apps/web/.env.development

# API 설정 / API Config
VITE_API_BASE_URL=http://localhost:{api_port}/api/v1

# Mock 데이터 설정 / Mock Data Config
VITE_ENABLE_MOCK=false

# 앱 정보 / App Info
VITE_APP_NAME={AppName}
```

### 개발 서버 실행 | Run Development Server

```bash
# 전체 실행 / Run all (API + Web)
npm run dev

# Backend만 실행 / Run backend only
npm run dev:api

# Frontend만 실행 / Run frontend only
npm run dev:web
```

### 개발 서버 재시작 | Restart Development Server

```bash
# 전체 재시작 (패키지 빌드 포함) / Restart all (includes package build)
npm run restart

# 개별 서버 재시작 / Restart individual servers
npm run restart:api
npm run restart:web

# 모든 서버 중지 / Stop all servers
npm run stop
```

### Mock 데이터 시스템 | Mock Data System

Backend API 없이도 프론트엔드 개발과 테스트를 진행할 수 있는 Mock 데이터 시스템을 제공합니다.

Provides a Mock data system that enables frontend development without backend API.

**활성화 방법 / Enable:**
```javascript
// 브라우저 콘솔에서 / In browser console
localStorage.setItem('{project}_mock_enabled', 'true');
window.location.reload();
```

### 접속 URL | Access URLs

| 서비스 / Service | URL |
|-----------------|-----|
| API 서버 / API Server | http://localhost:{api_port} |
| Swagger 문서 / Swagger Docs | http://localhost:{api_port}/api-docs |
| Web 프론트엔드 / Web Frontend | http://localhost:{web_port} |
| Adminer (DB 관리 / DB Management) | http://localhost:{adminer_port} |
| Storybook (선택 / Optional) | http://localhost:6006 |

---

## 5. 개발 가이드 | Development Guide

### 코드 컨벤션 | Code Convention

이 프로젝트는 **Amoeba Basic Code Convention v1**을 따릅니다.
This project follows **Amoeba Basic Code Convention v1**.

#### 네이밍 규칙 | Naming Rules

| 항목 / Item | 규칙 / Rule | 예시 / Example |
|-------------|------------|---------------|
| 파일명 (컴포넌트) / File (Component) | PascalCase | React: `CampaignCard.tsx` / Vue: `CampaignCard.vue` |
| 파일명 (훅/컴포저블) / File (Hook/Composable) | camelCase | `useCampaignList.ts` |
| 파일명 (서비스) / File (Service) | kebab-case | `campaign.service.ts` |
| 변수/함수 / Variables/Functions | camelCase | `getCampaignById` |
| 상수 / Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| 타입/인터페이스 / Types/Interfaces | PascalCase | `CampaignResponse` |
| DB 테이블 / DB Tables | snake_case + prefix | `{prefix}_campaigns` |
| DB 컬럼 / DB Columns | snake_case | `cmp_created_at` |

#### 브랜치 전략 | Branch Strategy

```
main
 └── develop
      ├── feature/{CODE}-123-campaign-create
      ├── bugfix/{CODE}-124-login-error
      └── hotfix/{CODE}-125-critical-fix
```

#### 커밋 메시지 | Commit Messages

```
feat(campaign): 캠페인 생성 API 구현 / Implement campaign creation API

- CampaignController 추가 / Add CampaignController
- CreateCampaignRequest DTO 정의 / Define CreateCampaignRequest DTO

Closes #{CODE}-123
```

---

## 6. API 문서 | API Documentation

### Swagger UI

개발 서버 실행 후 확인 / Check after running development server:
http://localhost:{api_port}/api-docs

### API 응답 형식 | API Response Format

```json
// 성공 응답 (단일) / Success Response (Single)
{
  "success": true,
  "data": { ... }
}

// 성공 응답 (목록) / Success Response (List)
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalCount": 100,
    "totalPages": 5
  }
}

// 에러 응답 / Error Response
{
  "success": false,
  "error": {
    "code": "E3001",
    "message": "리소스를 찾을 수 없습니다. / Resource not found."
  }
}
```

---

## 7. 테스트 | Testing

### 테스트 실행 | Run Tests

```bash
# 전체 테스트 / Run all tests
npm run test

# 단위 테스트 (watch 모드) / Unit tests (watch mode)
npm run test:watch

# 커버리지 리포트 / Coverage report
npm run test:coverage

# E2E 테스트 / E2E tests
npm run test:e2e
```

### 테스트 커버리지 목표 | Test Coverage Goals

| 테스트 유형 / Test Type | 목표 / Goal |
|------------------------|------------|
| 단위 테스트 / Unit Tests | 80% 이상 / 80%+ |
| 통합 테스트 / Integration Tests | 핵심 API 100% / Core APIs 100% |
| E2E 테스트 / E2E Tests | 핵심 시나리오 100% / Core scenarios 100% |

---

## 8. 배포 | Deployment

### 환경별 배포 | Environment Deployment

| 환경 / Environment | 브랜치 / Branch | URL |
|-------------------|----------------|-----|
| Development | develop | dev.{domain} |
| Staging | release/* | stg.{domain} |
| Production | main | www.{domain} |

### Docker 빌드 | Docker Build

```bash
# 개발 환경 / Development
docker-compose -f docker/docker-compose.dev.yml up -d

# 프로덕션 빌드 / Production build
docker build -t {project}-api:latest -f docker/Dockerfile.api .
docker build -t {project}-web:latest -f docker/Dockerfile.web .
```

---

## 9. 기여 가이드 | Contributing

### 기여 방법 | How to Contribute

1. 이슈 생성 또는 할당받기 / Create or get assigned to an issue
2. 브랜치 생성 / Create branch (`feature/{CODE}-XXX-description`)
3. 코드 작성 및 테스트 / Write code and tests
4. PR 생성 및 코드 리뷰 요청 / Create PR and request code review
5. 리뷰 승인 후 병합 / Merge after review approval

### 코드 리뷰 체크리스트 | Code Review Checklist

- [ ] 코드 컨벤션 준수 / Follow code conventions
- [ ] 타입 안정성 확보 (any 사용 금지) / Type safety (no `any`)
- [ ] 적절한 에러 처리 / Proper error handling
- [ ] 단위 테스트 작성 / Write unit tests
- [ ] API 문서 업데이트 / Update API documentation
- [ ] 불필요한 console.log 제거 / Remove unnecessary console.log

---

## 10. 참고 문서 | References

| 문서명 / Document | 파일명 / Filename | 설명 / Description |
|------------------|------------------|-------------------|
| 프로젝트 명세서 | `SPEC.md` | 기술 명세, 아키텍처, API 설계 / Tech Spec, Architecture, API Design |
| 개발 스킬 가이드 | `SKILL.md` | 프로젝트 개발 스킬 가이드 / Development Skills Guide |
| 코드 컨벤션 | `amoeba_code_convention.md` | 코드 작성 규칙 / Code Convention |
| 웹 스타일 가이드 | `amoeba_web_style_guide.md` | 레이아웃, 컬러, 타이포그래피 / Web Style Guide |

---

## 11. 문의 및 라이선스 | Contact & License

### 문의 | Contact

| 구분 / Type | 연락처 / Contact |
|-------------|-----------------|
| 기술 문의 / Technical | dev@{domain} |
| 일반 문의 / General | support@{domain} |

### 라이선스 | License

이 프로젝트는 비공개 소프트웨어입니다. 무단 복제 및 배포를 금지합니다.
This project is proprietary software. Unauthorized copying and distribution is prohibited.

Copyright (c) {YEAR} {Company Name}. All rights reserved.

---

## Amoeba Basic README 템플릿 사용 안내

### 사용 방법

1. 이 파일을 프로젝트 루트에 `README.md`로 복사합니다.
2. `{프로젝트명}`, `{설명}` 등 플레이스홀더를 실제 내용으로 교체합니다.
3. 프로젝트에 해당하지 않는 섹션은 제거합니다.
4. 프로젝트 고유 섹션이 필요하면 추가합니다.


### 플레이스홀더 치환 검증 (CI 권장)

배포/병합 전 템플릿 플레이스홀더가 남아있는지 자동 검사합니다.

```bash
# 예시: README/SPEC/docs에서 미치환 플레이스홀더 탐지 시 실패
if grep -RInE '\{(project|domain|port|CODE|AppName|프로젝트명|설명)\}' README.md SPEC.md docs/*.md; then
  echo "[FAIL] Unresolved placeholders found"
  exit 1
fi
```

### 필수 섹션

- 프로젝트 소개 (Introduction)
- 기술 스택 (Tech Stack)
- 프로젝트 구조 (Project Structure)
- 시작하기 (Getting Started)

### 권장 섹션

- 개발 가이드 (Development Guide)
- API 문서 (API Documentation)
- 테스트 (Testing)
- 배포 (Deployment)

### 선택 섹션

- 기여 가이드 (Contributing)
- 참고 문서 (References)
- 문의 및 라이선스 (Contact & License)

---

## 문서 이력 | Document History

### 프로젝트 문서 이력 (작성용)

| 버전 / Version | 날짜 / Date | 작성자 / Author | 변경 내용 / Changes |
|----------------|------------|----------------|-------------------|
| v1.0.0 | YYYY-MM-DD | {팀명} / {Team} | 최초 작성 / Initial creation |

### 템플릿 문서 이력 (Amoeba 관리)

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| v1.0 | 2026-02-12 | Amoeba Company | 최초 작성 - README 표준 템플릿 |
| v1.1 | 2026-02-12 | Amoeba Company | React + Vue.js 듀얼 프레임워크 지원 반영 |
| v1.2 | 2026-02-13 | Amoeba Company | 문서 이력 섹션 통합, 플레이스홀더 CI 체크 항목 추가 |
