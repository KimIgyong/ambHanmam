# 아메바컴퍼니 개발표준패키지 v1.1

**작성일:** 2026-04-11
**기반 프로젝트:** AMB Management (AMA)
**대상:** 아메바컴퍼니 신규 프로젝트

---

## 1. 패키지 개요

본 문서는 AMB Management(AMA) 프로젝트에서 검증된 개발 표준을 패키지화하여, 아메바컴퍼니의 모든 신규 프로젝트에서 일관된 품질과 생산성을 보장하기 위한 종합 가이드입니다.

### 1.1 패키지 구성

| 문서 | 파일 | 용도 |
|------|------|------|
| **개발표준패키지** (본 문서) | `spec/DEVELOPMENT-STANDARD-PACKAGE.md` | 전체 표준 개요 및 프로젝트 시작 가이드 |
| **코드 컨벤션** | `spec/CODE-CONVENTION.md` | 코딩 표준, 네이밍 규칙, 아키텍처 패턴 |
| **시스템 스펙** | `SPEC.md` | DB 스키마, API 엔드포인트, 에러 코드 |
| **인프라 가이드** | `spec/INFRASTRUCTURE.md` | Docker, 서버, 네트워크 구성 |
| **배포 가이드** | `spec/DEPLOYMENT-GUIDE.md` | 환경별 배포 절차 |
| **Git 브랜치 전략** | `spec/GIT-BRANCH-STRATEGY.md` | 브랜치 모델, 커밋 규칙 |
| **프로젝트 지침** | `CLAUDE.md` | AI 개발 에이전트 지침 |

### 1.2 기술 스택 표준

| 영역 | 기술 | 버전 |
|------|------|------|
| **런타임** | Node.js | 24.x |
| **백엔드** | NestJS + TypeORM | 10.x + 0.3.x |
| **프론트엔드** | React + TypeScript + Vite | 18.x + 5.x + 5.x |
| **스타일** | TailwindCSS | 3.x |
| **DB** | PostgreSQL + pgvector + pg_trgm | 15+ |
| **AI** | Anthropic Claude API | `@anthropic-ai/sdk` |
| **실시간** | SSE (Server-Sent Events) | 네이티브 |
| **i18n** | i18next + react-i18next | 최신 |
| **상태관리** | Zustand (영속) + React Query (서버) | 최신 |
| **모노레포** | npm workspaces + Turborepo | - |
| **컨테이너** | Docker + Docker Compose | - |

---

## 2. 신규 프로젝트 시작 가이드

### 2.1 모노레포 구조 초기화

```
{project-name}/
├── apps/
│   ├── api/          # NestJS 백엔드
│   ├── web/          # React 프론트엔드
│   ├── portal-api/   # (선택) SaaS 포털 API
│   ├── portal-web/   # (선택) SaaS 포털 웹
│   └── mobile/       # (선택) React Native
├── packages/
│   ├── types/        # 공유 TypeScript 타입
│   ├── common/       # 공유 유틸리티/상수
│   └── portal-shared/ # (선택) 포털 공유 코드
├── docker/
│   ├── dev/          # 개발 환경 Docker
│   ├── staging/      # 스테이징 환경
│   └── production/   # 프로덕션 환경
├── env/
│   ├── backend/      # .env.development (api + portal-api 공용)
│   ├── frontend/     # .env.development
│   └── portal-frontend/ # .env.development (선택)
├── spec/             # 프로젝트 사양 문서
├── docs/             # 프로젝트 문서
│   ├── analysis/     # 요구사항 분석서
│   ├── plan/         # 작업 계획서
│   ├── implementation/ # 완료 보고서
│   ├── test/         # 테스트 케이스
│   └── log/          # 대화 로그 (git 제외)
├── package.json      # 루트 워크스페이스
├── turbo.json        # Turborepo 설정
├── tsconfig.json     # 루트 TypeScript
├── CLAUDE.md         # AI 개발 에이전트 지침
└── SPEC.md           # 시스템 스펙
```

### 2.2 필수 설정 파일

#### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*"],
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {}
  }
}
```

#### 루트 package.json
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "npm run dev -w @{prefix}/api",
    "dev:web": "npm run dev -w @{prefix}/web",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:up": "docker compose -f docker/docker-compose.dev.yml up -d",
    "db:down": "docker compose -f docker/docker-compose.dev.yml down"
  }
}
```

### 2.3 백엔드 초기화 체크리스트

- [ ] NestJS 프로젝트 생성 (`nest new`)
- [ ] TypeORM + PostgreSQL 연동 설정
- [ ] JWT 인증 모듈 구현 (Access 15분 / Refresh 7일)
- [ ] 전역 가드 설정 (JwtAuthGuard, RolesGuard)
- [ ] BusinessException + 에러 코드 체계 설정
- [ ] TransformInterceptor (표준 응답 포맷)
- [ ] 커스텀 데코레이터 (@Public, @CurrentUser, @Roles)
- [ ] CORS 설정 (도메인 명시)
- [ ] Rate Limiting (ThrottlerModule)
- [ ] 파일 업로드 모듈 (Multer, 10MB 제한)
- [ ] Claude AI 연동 모듈 (스트리밍 SSE)
- [ ] 환경변수 검증 (@nestjs/config + Joi)

### 2.4 프론트엔드 초기화 체크리스트

- [ ] Vite + React + TypeScript 생성
- [ ] TailwindCSS 설정
- [ ] i18n 초기화 (en/ko/vi)
- [ ] Zustand 인증 스토어 (persist)
- [ ] Axios 인스턴스 (인터셉터, 401 자동 갱신)
- [ ] React Router 설정 (인증 가드)
- [ ] ESLint + Prettier 설정
- [ ] 공통 컴포넌트 (Button, Input, Modal, Toast)

---

## 3. 아키텍처 패턴 표준

### 3.1 백엔드 레이어 아키텍처

```
Controller → Service → Repository (TypeORM)
     ↓          ↓           ↓
  Request    Business     Database
  Validation   Logic       Query
  DTO → ←Response DTO
```

**원칙:**
- Controller: 요청 검증, 라우팅만 담당. 비즈니스 로직 금지
- Service: 핵심 비즈니스 로직. 트랜잭션 관리
- Repository: TypeORM EntityManager/Repository 사용
- DTO: Request는 snake_case, Response는 camelCase

### 3.2 모듈 구조 표준

```
domain/{module-name}/
├── {module-name}.module.ts        # NestJS 모듈 정의
├── {module-name}.controller.ts    # API 엔드포인트
├── {module-name}.service.ts       # 비즈니스 로직
├── entities/
│   └── {entity-name}.entity.ts    # TypeORM 엔티티
├── dto/
│   ├── create-{name}.dto.ts       # 생성 DTO
│   ├── update-{name}.dto.ts       # 수정 DTO
│   └── {name}-response.dto.ts     # 응답 DTO
├── enums/
│   └── {name}.enum.ts             # 열거형
└── interfaces/
    └── {name}.interface.ts        # 인터페이스
```

### 3.3 프론트엔드 도메인 구조

```
domain/{module-name}/
├── components/           # 도메인 전용 컴포넌트
├── hooks/                # 커스텀 훅 (useXxx)
├── stores/               # Zustand 스토어
├── types/                # TypeScript 타입
├── api/                  # API 호출 함수
└── pages/                # 라우트 페이지
```

### 3.4 인증/인가 패턴

| 패턴 | 구현 |
|------|------|
| 인증 | JWT Bearer Token (httpOnly 쿠키 또는 Authorization 헤더) |
| 역할 계층 | CLIENT_MEMBER(0) → CLIENT_ADMIN(0) → USER(1) → MANAGER(2) → ADMIN(3) → SUPER_ADMIN(4) |
| 메뉴 권한 | 메뉴 코드별 역할 매핑 (amb_menu_permissions) |
| 엔티티 격리 | x-entity-id 헤더 기반 멀티테넌시 |
| 토큰 갱신 | Axios 인터셉터에서 401 시 자동 refresh |

### 3.5 AI 통합 패턴

```typescript
// SSE 스트리밍 응답 표준 패턴
@Post(':id/generate')
async generate(@Res() res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await this.claudeService.streamMessage(messages);
  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
```

---

## 4. DB 설계 표준

### 4.1 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 테이블 | `{app_prefix}_` + snake_case 복수형 | `amb_users`, `amb_todos` |
| 컬럼 | 3자 prefix + snake_case | `usr_email`, `tdo_title` |
| PK | `{prefix}_id` (UUID) | `usr_id`, `tdo_id` |
| FK | 참조 테이블의 PK 이름 유지 | `usr_id` (FK → amb_users) |
| Soft Delete | `{prefix}_deleted_at` | `usr_deleted_at` |
| 생성/수정일 | `{prefix}_created_at`, `{prefix}_updated_at` | |
| Boolean | `{prefix}_is_` + 형용사 | `ntc_is_pinned` |
| Enum | VARCHAR + CHECK 또는 TypeORM enum | `iss_status` |

### 4.2 공통 컬럼 패턴

모든 테이블에 포함:
```sql
{prefix}_id        UUID PRIMARY KEY DEFAULT gen_random_uuid()
{prefix}_created_at TIMESTAMPTZ DEFAULT NOW()
{prefix}_updated_at TIMESTAMPTZ DEFAULT NOW()
{prefix}_deleted_at TIMESTAMPTZ        -- Soft Delete (nullable)
```

### 4.3 인덱스 전략

| 패턴 | 적용 |
|------|------|
| 외래키 | 모든 FK 컬럼에 인덱스 |
| 복합 키 | Unique constraint는 인덱스 자동 생성 |
| 검색 필터 | 자주 쿼리되는 status, type 컬럼 |
| 날짜 범위 | created_at, date 컬럼 (BTREE) |
| 텍스트 검색 | pg_trgm GIN 인덱스 |
| 벡터 검색 | pgvector ivfflat 인덱스 |

### 4.4 TypeORM 엔티티 표준

```typescript
@Entity('amb_todos')
export class TodoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'tdo_title', type: 'varchar', length: 200 })
  tdoTitle: string;

  @Column({ name: 'tdo_status', type: 'varchar', length: 20, default: 'SCHEDULED' })
  tdoStatus: string;

  @CreateDateColumn({ name: 'tdo_created_at', type: 'timestamptz' })
  tdoCreatedAt: Date;

  @UpdateDateColumn({ name: 'tdo_updated_at', type: 'timestamptz' })
  tdoUpdatedAt: Date;

  @DeleteDateColumn({ name: 'tdo_deleted_at', type: 'timestamptz' })
  tdoDeletedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
```

---

## 5. API 설계 표준

### 5.1 URL 규칙

```
Base Path: /api/v1
리소스:    복수형 kebab-case (/api/v1/expense-requests)
중첩:      2단계까지 (/api/v1/projects/:id/members)
액션:      비-REST 동사 허용 (/api/v1/auth/login)
```

### 5.2 표준 응답 포맷

```typescript
// 성공
{ success: true, data: { ... }, timestamp: '2026-03-21T...' }

// 페이지네이션
{ success: true, data: { items: [...], total: 100, page: 1, limit: 20 }, timestamp: '...' }

// 에러
{ success: false, error: { code: 'E1001', message: 'Invalid credentials' }, timestamp: '...' }
```

### 5.3 에러 코드 체계

| 범위 | 할당 규칙 |
|------|-----------|
| E1xxx | 인증/인가 |
| E2xxx~E9xxx | 기본 모듈 (사용자, 대화, 에이전트, API키, 초대, 그룹, SMTP, 시스템) |
| E10xxx~E20xxx | 핵심 업무 모듈 (할일, 회의록, 근무일정, 공지, Drive, 회계, HR, Billing, 웹메일, ACL, KMS) |
| E21xxx~ | 확장 모듈 (프로젝트, 서비스, 이슈, 번역, 자산, 캘린더, CMS...) |

**규칙:** 신규 모듈은 기존 최대값+1000 범위 할당

### 5.4 DTO 표준

```typescript
// Request DTO (snake_case)
export class CreateTodoDto {
  @IsString() @MaxLength(200)
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(TodoStatus)
  status: TodoStatus;

  @IsOptional() @IsDateString()
  due_date?: string;
}

// Response는 class-transformer로 camelCase 자동 변환
```

---

## 6. 프론트엔드 표준

### 6.1 상태관리 전략

| 분류 | 도구 | 예시 |
|------|------|------|
| 전역 영속 | Zustand + persist | 인증 토큰, 선택된 엔티티, 언어 |
| 서버 상태 | React Query | API 조회/변경, 캐시 무효화 |
| URL 상태 | React Router searchParams | 페이지네이션, 필터, 검색어 |
| 로컬 UI | useState/useReducer | 모달 열림, 폼 입력 |

### 6.2 i18n 표준

```typescript
// i18n.ts 초기화
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('{app}-lang') || 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth', ...],
  defaultNS: 'common',
});
```

**규칙:**
- 컴포넌트에 텍스트 하드코딩 금지 → `t()` 함수 사용
- 네임스페이스: 도메인 모듈 단위 (1 모듈 = 1 네임스페이스)
- 새 네임스페이스 추가 시 `i18n.ts`에 등록
- 번역 파일: `locales/{en,ko,vi}/{namespace}.json`

### 6.3 API 클라이언트 표준

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 요청 인터셉터: Authorization 헤더, x-entity-id 헤더
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const entityId = useEntityStore.getState().currentEntityId;
  if (entityId) config.headers['x-entity-id'] = entityId;
  return config;
});

// 응답 인터셉터: 401 → 토큰 갱신 → 재요청
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await refreshToken();
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 6.4 타임존 처리

```typescript
// 날짜 데이터 저장: UTC (timestamptz)
// 표시: 사용자 로컬 타임존
// 날짜 전용 필드(생년월일, 급여일): DATE 타입, 타임존 변환 없음

import { format, utcToZonedTime } from 'date-fns-tz';
const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const zonedDate = utcToZonedTime(utcDate, userTz);
```

---

## 7. 보안 표준

### 7.1 필수 보안 설정

| 항목 | 설정 |
|------|------|
| 비밀번호 해싱 | bcrypt, salt rounds 12 |
| JWT Access Token | 15분 만료 |
| JWT Refresh Token | 7일 만료, httpOnly 쿠키 |
| API 키 암호화 | AES-256-GCM (IV + Auth Tag) |
| CORS | 허용 도메인 명시 (와일드카드 금지) |
| Rate Limiting | ThrottlerModule (60req/60s) |
| 파일 업로드 | 10MB 제한, MIME 화이트리스트, UUID 파일명 |
| HTML 콘텐츠 | DOMPurify (XSS 방어) |
| SQL 인젝션 | TypeORM 파라미터 바인딩 (raw query 금지) |
| 비밀번호 재설정 | UUID 토큰, 1시간 만료, 1회 사용 |

### 7.2 역할 계층

```
SUPER_ADMIN (4) — 시스템 전체 관리
    ↑
  ADMIN (3) — 엔티티(조직) 관리
    ↑
  MANAGER (2) — 팀 관리, 멤버 조회
    ↑
  USER (1) — 일반 사용자
    ↑
CLIENT_MEMBER (0) — 고객 포털 사용자
```

---

## 8. 배포 표준

### 8.1 환경 구성

| 환경 | 브랜치 | 도메인 패턴 | 특징 |
|------|--------|------------|------|
| 개발 | feature/* | localhost | 로컬 Docker |
| 스테이징 | main | stg-{app}.{domain} | PR 머지 후 자동/수동 배포 |
| 프로덕션 | production | {app}.{domain} | main→production PR 필수 |

### 8.2 핵심 규칙

1. **배포 스크립트 필수 사용** — `docker compose build` 직접 실행 금지
2. **VITE_* 변수 주의** — 빌드 시점 인라인, 변경 시 이미지 재빌드 필수
3. **환경변수 파일** — git 미포함, 서버에 직접 관리
4. **DB 마이그레이션** — TypeORM synchronize는 개발만, 스테이징/프로덕션은 수동 SQL 실행 필수

### 8.3 배포 스크립트 구조

```bash
#!/bin/bash
# deploy-{env}.sh
set -e

ENV_FILE="docker/{env}/.env.{env}"
COMPOSE_FILE="docker/docker-compose.{env}.yml"

echo "Building with env: $ENV_FILE"
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE build
docker compose -f $COMPOSE_FILE --env-file $ENV_FILE up -d

echo "Deployed successfully!"
```

---

## 9. 문서화 표준

### 9.1 요구사항 작업 워크플로우

1. **요구사항 분석서** → `docs/analysis/REQ-{제목}-{YYYYMMDD}.md`
2. **작업 계획서** → `docs/plan/PLAN-{제목}-작업계획-{YYYYMMDD}.md`
3. **구현** → 작업 계획서 기반 코드 작성
4. **테스트 케이스** → `docs/test/TC-{제목}-Test-{YYYYMMDD}.md`
5. **완료 보고** → `docs/implementation/RPT-{제목}-작업완료보고-{YYYYMMDD}.md`

### 9.2 문서 관리 규칙

- 모든 스펙 문서는 `spec/` 디렉토리
- 대화 로그는 `docs/log/` (git 제외)
- 데일리 리포트: `docs/log/YYYY-MM-DD/DAILY-REPORT.md`
- 커밋 메시지: `{type}: {설명}` (feat/fix/docs/style/refactor/test/chore/hotfix)

---

## 10. 신규 모듈 추가 체크리스트

### 백엔드
- [ ] `apps/api/src/domain/{module}/` 디렉토리 생성
- [ ] `{module}.module.ts` — NestJS 모듈 정의
- [ ] `{module}.controller.ts` — REST 엔드포인트
- [ ] `{module}.service.ts` — 비즈니스 로직
- [ ] `entities/*.entity.ts` — DB 엔티티 (PK UUID, 3자 prefix)
- [ ] `dto/*.dto.ts` — Request/Response DTO
- [ ] 에러 코드 추가 (`global/error-codes.ts`)
- [ ] AppModule에 import 등록
- [ ] SPEC.md에 테이블/API 문서화

### 프론트엔드
- [ ] `apps/web/src/domain/{module}/` 디렉토리 생성
- [ ] 페이지 컴포넌트 → `pages/`
- [ ] 도메인 컴포넌트 → `components/`
- [ ] API 호출 함수 → `api/`
- [ ] i18n 번역 파일 → `locales/{lang}/{module}.json` (en/ko/vi)
- [ ] `i18n.ts`에 네임스페이스 등록
- [ ] 라우터에 경로 추가 + 가드 설정
- [ ] 메뉴 항목 추가 (사이드바)

### 공통
- [ ] 공유 타입 → `packages/types/`
- [ ] 메뉴 권한 코드 등록 (`amb_menu_permissions`)
- [ ] CLAUDE.md에 모듈 설명 추가
- [ ] SPEC.md 업데이트 (테이블, API, 에러코드)

---

## 부록 A. 프로젝트 규모별 적용 가이드

### A.1 소규모 프로젝트 (MVP)

필수 모듈만 적용:
- auth, members, settings (기본 인프라)
- 도메인 모듈 2-3개
- i18n 단일 언어로 시작 가능
- Docker 개발 환경만 구성

### A.2 중규모 프로젝트

핵심 + 필요 확장 선택 적용:
- 기본 인프라 + ACL/KMS
- 도메인 모듈 5-10개
- i18n 다국어 (en + 1-2개 언어)
- 스테이징 + 프로덕션 환경 구성

### A.3 대규모 프로젝트 (AMA급)

전체 표준 적용:
- 51개+ 도메인 모듈 기반 선택적 구성
- Portal 아키텍처 (portal-api + portal-web)
- 전체 i18n (en/ko/vi, 43+ 네임스페이스)
- 전체 배포 파이프라인 (스테이징 + 프로덕션)
- 고객포털/CMS/서비스관리/구독/결제 포함

---

## 부록 B. 기술 의사결정 기록 (ADR)

| 결정 | 근거 |
|------|------|
| SSE > WebSocket | 단방향 스트리밍 충분, 구현/운영 단순, AI 응답에 최적 |
| Zustand > Redux | 보일러플레이트 최소, persist 미들웨어 내장, 학습곡선 낮음 |
| TypeORM > Prisma | NestJS 공식 통합, Active Record + Data Mapper 지원, Migration 유연 |
| UUID > Auto Increment | 분산 시스템 호환, 보안 (ID 추측 불가), 병합 시 충돌 없음 |
| Soft Delete > Hard Delete | 데이터 복구 가능, 감사 로그, 참조 무결성 유지 |
| 3자 컬럼 prefix | 테이블 간 컬럼명 충돌 방지, SQL 조인 시 명확성 |
| snake_case 요청 / camelCase 응답 | 백엔드 DB 호환 + 프론트엔드 JS 컨벤션 양립 |
| env 파일 git 미포함 | 보안 (비밀키), 환경별 독립 관리 |
| 배포 스크립트 강제 | VITE_* 인라인 문제 방지, 환경변수 누락 차단 |

---

*본 문서는 AMB Management(AMA) 프로젝트의 실전 경험에 기반하여 작성되었습니다.*
*v5.0+ SPEC 기준: 51개+ 백엔드 도메인 모듈, 8개 포털 모듈, 219개+ DB 엔티티, 43개 i18n 네임스페이스*
