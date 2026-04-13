# REQ-260413-env-setup: 프로젝트 환경 정비 및 의존성 설치

**작성일:** 2026-04-13
**Feature:** env-setup
**우선순위:** Critical (전체 구현의 선행 조건)

---

## 1. 요구사항 요약

프로젝트 초기 스캐폴딩 이후 잔존하는 구조 정리, SPEC 문서와 실 환경 간 불일치 해소, SPEC에 명시된 필수 패키지 설치, 그리고 기존 서비스와의 포트 충돌 방지를 위한 포트 설정 체계를 구축한다.

| # | 요구사항 | 분류 |
|---|---------|------|
| R1 | `hanmam-backend/`, `hanmam-frontend/` 미사용 scaffold 폴더 삭제 | 구조 정리 |
| R2 | SPEC/README 문서의 기술 스택 버전을 실제 사용 버전으로 일치시킴 | 문서 정비 |
| R3 | Frontend: SPEC 명시 패키지(Ant Design, Zustand, TanStack Query 등) 설치 | FE 의존성 |
| R4 | Backend: SPEC 명시 패키지(TypeORM, Passport, class-validator 등) 설치 | BE 의존성 |
| R5 | 포트 충돌 방지용 `.env` 기반 포트 설정 체계 구축 | 인프라 |

---

## 2. AS-IS 현황 분석

### 2.1 미사용 폴더

| 경로 | 내용 | 상태 |
|------|------|------|
| `hanmam-backend/` | NestJS scaffold (package.json, eslint, nest-cli만 존재, src/ 없음) | **미사용** |
| `hanmam-frontend/` | Next.js 잔존 (next-env.d.ts, node_modules만 존재) | **미사용** |

> 실제 개발은 `backend/`, `frontend/` 디렉토리에서 진행 중. 두 폴더는 초기 scaffold 잔재.

### 2.2 SPEC/README 버전 불일치

| 기술 | SPEC/README 명시 | 실제 package.json 버전 | 갭 |
|------|-----------------|----------------------|-----|
| Next.js | 14.x | **16.2.3** | ❌ 불일치 |
| React | 미명시(18.x 가정) | **19.2.4** | ❌ 불일치 |
| NestJS | 10.x | **11.x** | ❌ 불일치 |
| TailwindCSS | 미명시 | **4.x** (설치됨) | 누락 |
| Jest | 미명시 | **30.x** | 누락 |

### 2.3 Frontend 미설치 패키지 (SPEC 명시)

| 패키지 | SPEC 버전 | 현 package.json | 상태 |
|--------|----------|----------------|------|
| Ant Design (`antd`) | 5.x | 없음 | ❌ 미설치 |
| `@ant-design/icons` | - | 없음 | ❌ 미설치 |
| Zustand | 4.x | 없음 | ❌ 미설치 |
| TanStack Query (`@tanstack/react-query`) | 5.x | 없음 | ❌ 미설치 |
| React Hook Form | 7.x | 없음 | ❌ 미설치 |
| Zod | 3.x | 없음 | ❌ 미설치 |
| `@hookform/resolvers` | - | 없음 | ❌ 미설치 |
| Axios | 1.x | 없음 | ❌ 미설치 |
| dayjs | - | 없음 | ❌ 미설치 (날짜 유틸) |

### 2.4 Backend 미설치 패키지 (SPEC 명시)

| 패키지 | SPEC 버전 | 현 package.json | 상태 |
|--------|----------|----------------|------|
| `@nestjs/typeorm` + `typeorm` | 0.3.x | 없음 | ❌ 미설치 |
| `pg` (PostgreSQL 드라이버) | - | 없음 | ❌ 미설치 |
| `@nestjs/passport` + `passport` | - | 없음 | ❌ 미설치 |
| `passport-jwt` + `@types/passport-jwt` | - | 없음 | ❌ 미설치 |
| `@nestjs/jwt` | - | 없음 | ❌ 미설치 |
| `class-validator` + `class-transformer` | 0.14.x | 없음 | ❌ 미설치 |
| `@nestjs/swagger` | 7.x | 없음 | ❌ 미설치 |
| `@nestjs/config` | - | 없음 | ❌ 미설치 |
| `@nestjs/event-emitter` | - | 없음 | ❌ 미설치 |
| `@anthropic-ai/sdk` | latest | 없음 | ❌ 미설치 |
| `bcrypt` + `@types/bcrypt` | - | 없음 | ❌ 미설치 |
| `helmet` | - | 없음 | ❌ 미설치 |
| `cookie-parser` + `@types/cookie-parser` | - | 없음 | ❌ 미설치 |

### 2.5 포트 현황 분석

| 서비스 | 기본 포트 | 설정 위치 | 변경 가능 여부 |
|--------|----------|----------|-------------|
| Backend API (NestJS) | 3010 | `docker-compose.dev.yml:64`, `backend/src/main.ts:23` | `PORT` env만 (호스트 포트 하드코딩) |
| Frontend (Next.js) | 3011 (호스트) → 3000 (컨테이너) | `docker-compose.dev.yml:84` | 호스트 포트 하드코딩 |
| PostgreSQL | 5432 | `docker-compose.dev.yml:11`, `.env` | `DB_PORT` env 지원 |
| Redis | 6379 | `docker-compose.dev.yml:26`, `.env` | `REDIS_PORT` env 지원 |
| Nginx HTTP | 80 | `docker-compose.prod.yml:84` | 하드코딩 |
| Nginx HTTPS | 443 | `docker-compose.prod.yml:85` | 하드코딩 |

**문제점:**
- Backend 호스트 포트 `3010` 하드코딩 → 다른 서비스(예: 다른 NestJS 프로젝트)와 충돌 가능
- Frontend 호스트 포트 `3011` 하드코딩 → 충돌 가능
- Nginx 포트 하드코딩 → prod 환경 포트 변경 불가
- `.env`에 포트 변수가 부분적으로만 존재 (Backend/Frontend 호스트 포트 없음)

---

## 3. TO-BE 요구사항

### 3.1 구조 정리 (R1)

- `hanmam-backend/` 폴더 삭제
- `hanmam-frontend/` 폴더 삭제 (node_modules 포함)
- `.gitignore`에 해당 폴더가 있으면 제거

### 3.2 문서 버전 갱신 (R2)

**HANMAM_SPEC.md** 및 **HANMAM_README.md** 내 기술 스택 테이블을 아래로 갱신:

| 기술 | AS-IS (문서) | TO-BE (실제) |
|------|------------|-------------|
| Next.js | 14.x | **16.x** |
| React | (미명시) | **19.x** |
| NestJS | 10.x | **11.x** |
| TailwindCSS | (미명시) | **4.x** (추가) |
| Jest (BE) | (미명시) | **30.x** (추가) |

### 3.3 Frontend 패키지 설치 (R3)

```bash
# dependencies
npm install antd @ant-design/icons zustand @tanstack/react-query \
  react-hook-form @hookform/resolvers zod axios dayjs

# devDependencies
npm install -D @tanstack/react-query-devtools
```

### 3.4 Backend 패키지 설치 (R4)

```bash
# dependencies
npm install @nestjs/typeorm typeorm pg \
  @nestjs/passport passport passport-jwt @nestjs/jwt \
  class-validator class-transformer \
  @nestjs/swagger @nestjs/config @nestjs/event-emitter \
  @anthropic-ai/sdk bcrypt helmet cookie-parser

# devDependencies
npm install -D @types/passport-jwt @types/bcrypt @types/cookie-parser
```

### 3.5 포트 설정 체계 (R5)

`.env` / `.env.example`에 모든 포트를 환경 변수로 통합하고, `docker-compose.dev.yml` / `docker-compose.prod.yml`에서 참조하도록 변경:

| 환경 변수 | 기본값 | 용도 |
|-----------|-------|------|
| `BACKEND_PORT` | 3010 | Backend API 호스트 포트 |
| `FRONTEND_PORT` | 3011 | Frontend 호스트 포트 |
| `DB_PORT` | 5432 | PostgreSQL 호스트 포트 (기존) |
| `REDIS_PORT` | 6379 | Redis 호스트 포트 (기존) |
| `NGINX_HTTP_PORT` | 80 | Nginx HTTP 포트 |
| `NGINX_HTTPS_PORT` | 443 | Nginx HTTPS 포트 |

---

## 4. 갭 분석

| # | 항목 | AS-IS 갭 | 해소 방안 | 우선순위 |
|---|------|----------|----------|---------|
| G1 | 미사용 폴더 잔존 | 혼동 유발 | 삭제 | High |
| G2 | 문서 버전 불일치 | 개발자 오인 | 문서 갱신 | Medium |
| G3 | FE 핵심 패키지 없음 | 어떤 기능도 구현 불가 | npm install | Critical |
| G4 | BE 핵심 패키지 없음 | DB/인증/API 문서 불가 | npm install | Critical |
| G5 | 포트 하드코딩 | 타 서비스 충돌 | env 변수화 | High |

---

## 5. 사용자 플로우

해당 없음 (인프라/환경 설정 작업)

---

## 6. 기술 제약사항

| # | 제약 | 대응 |
|---|------|------|
| C1 | Next.js 16은 최신 버전 — Ant Design 5.x와 SSR 호환성 검증 필요 | 설치 후 빌드 테스트 |
| C2 | NestJS 11 + TypeORM 최신 호환 확인 필요 | 공식 문서 기준 검증 |
| C3 | React 19 + antd 호환 | antd 5.x는 React 19 공식 지원 |
| C4 | `hanmam-frontend/node_modules` 삭제 시 용량 주의 | rm -rf 전 확인 |
