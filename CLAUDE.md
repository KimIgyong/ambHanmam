# AMB Management - Claude Code 지침

## 프로젝트 개요
다법인 글로벌 기업의 미션·태스크·이슈·프로젝트를 지식 자산으로 성장시키고, 채팅·노트·공지의 기본 번역 협업과 Today AI Analysis 기반 일일 업무 분석으로 글로벌 운영 효율을 높이는 엔터프라이즈 플랫폼 (React + NestJS 풀스택)

### 핵심 관점
- **업무 성장 흐름**: 오늘의 미션에서 시작한 업무가 태스크, 이슈, 프로젝트를 거쳐 KMS 자산으로 축적된다.
- **글로벌 협업 기본값**: 채팅과 주요 협업 콘텐츠는 번역 기반 협업을 전제로 설계된다.
- **일일 운영 최적화**: Today AI Analysis를 통해 매일의 실행 결과를 분석하고 다음 업무 계획으로 연결한다.

## 기술 스택
- **Frontend**: React 18 + TypeScript 5 + TailwindCSS 3 + Vite 5
- **Backend**: NestJS 10 + TypeORM + PostgreSQL 15
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **실시간 통신**: SSE (Server-Sent Events)
- **모노레포**: npm workspaces + Turborepo

## 프로젝트 구조
```
apps/api/           - @amb/api        NestJS 메인 백엔드 (포트 3019)
apps/web/           - @amb/web        React 메인 프론트엔드 (포트 5189)
apps/portal-api/    - @amb/portal-api NestJS 포털 백엔드 (포트 3020)
apps/portal-web/    - @amb/portal-web React 포털 프론트엔드 (포트 5190)
packages/types/     - 공유 TypeScript 타입
packages/common/    - 공유 유틸리티/상수
packages/portal-shared/ - 포털 전용 공유 모듈
```

## 코드 컨벤션

### DB 네이밍
- 테이블: `amb_` prefix + snake_case 복수형
- 컬럼: 3자 prefix + snake_case (예: `usr_email`, `cvs_title`)
- PK: `{prefix}_id` (UUID)
- Soft Delete: `{prefix}_deleted_at`

### API 규칙
- Base Path: `/api/v1`
- Request DTO: `snake_case`
- Response DTO: `camelCase`
- 표준 응답: `{ success, data, error?, timestamp }`

### 파일 네이밍
- 컴포넌트: PascalCase (`ChatPage.tsx`)
- 서비스: kebab-case (`.service.ts`)
- 스토어: kebab-case (`.store.ts`)
- 훅: `use` + PascalCase (`useChat.ts`)

## 데이터 격리 규칙 (USER_LEVEL - ent_id 기반)

### 사용자 레벨 (`USER_LEVEL_CODE`)
| 레벨 | 범위 | 설명 |
|------|------|------|
| `ADMIN_LEVEL` | 전체 | HQ 관리자, 모든 법인 데이터 접근 가능 |
| `USER_LEVEL` | 소속 법인 | **ent_id 기반 격리 필수**, 자기 법인 범위만 CRUD |
| `PARTNER_LEVEL` | 파트너사 | 자사 파트너 데이터 범위 내 활동 |
| `CLIENT_LEVEL` | 고객사 | 배정 프로젝트 범위 내 활동 |

### 격리 필수 규칙
1. **모든 `USER_LEVEL` API 엔드포인트**는 반드시 `ent_id`로 데이터를 필터링해야 한다
2. **컨트롤러 패턴**: `@Auth()` → `@UseGuards(OwnEntityGuard)` → `resolveEntityId(query, user)` → 서비스 호출
3. **서비스 쿼리**: `entityId`를 WHERE 조건에 포함하여 타 법인 데이터 접근 차단
4. `ADMIN_LEVEL`은 `OwnEntityGuard`에서 자동 바이패스 (모든 법인 접근 가능)
5. `resolveEntityId()`: Query Parameter `entity_id` 우선 → JWT `entityId` fallback

### 사용 가드/데코레이터
- `@Auth()`: 인증 + 상태 검증 (`JwtAuthGuard` + `LevelRoleGuard`)
- `@UseGuards(OwnEntityGuard)`: 법인 범위 접근 제어 (USER_LEVEL은 MASTER만 통과)
- `@DataScope()`: DataScopeInterceptor가 설정한 범위 정보 주입
- `resolveEntityId(queryEntityId, user)`: entity_id 결정 유틸

### 컨트롤러 표준 패턴 예시
```typescript
@Get('list')
@Auth()
@UseGuards(OwnEntityGuard)
async getList(
  @Query('entity_id') queryEntityId: string | undefined,
  @CurrentUser() user: UserPayload,
) {
  const entityId = resolveEntityId(queryEntityId, user);
  return this.service.findByEntity(entityId);
}
```

### ⚠️ 위반 시 심각도
- `ent_id` 필터 누락 = **타 법인 데이터 노출** → 보안 사고
- 새 엔드포인트 추가 시 반드시 `OwnEntityGuard` + `resolveEntityId` 적용 확인

## 주요 명령어
```bash
npm run dev             # api + web 동시 실행
npm run dev:api         # api만 실행
npm run dev:web         # web만 실행
npm run dev:portal      # portal-api + portal-web 동시 실행
npm run dev:portal-api  # portal-api만 실행
npm run dev:portal-web  # portal-web만 실행
npm run dev:all         # 전체 실행
npm run db:up           # PostgreSQL Docker 실행
npm run db:down         # PostgreSQL Docker 중지
npm run build           # 전체 빌드
npm run lint            # 린트 검사
```

## 환경 변수
- Backend: `env/backend/.env.development`
- Frontend: `env/frontend/.env.development`
- Portal Backend: `env/backend/.env.development` (portal-api 공용)
- Portal Frontend: `env/portal-frontend/.env.development`
- Staging: `docker/staging/.env.staging` (git 미포함, 서버에 직접 관리)
- Production: `docker/production/.env.production` (git 미포함, 서버에 직접 관리)
- `CLAUDE_API_KEY` 설정 필수

## SMTP 메일 발송 정책
- **시스템 초대메일 등 발송 SMTP는 Gmail SMTP만 사용한다** (`smtp.gmail.com:587`)
- Postal 메일 서버는 웹메일(수신/발신) 전용이며, 시스템 자동 발송에는 사용하지 않는다
- 환경변수: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Gmail App Password 사용 (Google 계정 → 2단계 인증 → 앱 비밀번호)

## Git 브랜치 전략

상세 전략 문서: `docs/plan/PLAN-Git브랜치전략-20260228.md`

### 브랜치 구조
| 브랜치 | 용도 | 배포 환경 | 보호 |
|--------|------|-----------|------|
| `production` | 프로덕션 릴리즈 | 프로덕션 서버 | PR 필수, 1명 승인 |
| `main` | 개발 통합 (기본 브랜치) | 스테이징 서버 | PR 필수, 1명 승인 |
| `feature/*` | 기능 개발 | 로컬 | - |
| `hotfix/*` | 긴급 버그 수정 | - | - |

### 개발 플로우
1. `main`에서 `feature/{이름}` 브랜치 생성
2. 작업 완료 후 `main`으로 PR → Squash Merge
3. 스테이징 테스트 후 `main` → `production` PR → Merge Commit
4. Hotfix: `production`에서 분기 → `production` + `main` 둘 다 머지

### GitHub 브랜치 보호 규칙 점검 (gh api)

```bash
# 0) gh 인증 확인
gh auth status

# 1) 저장소 변수
OWNER=KimIgyong
REPO=ambHanmam

# 2) 브랜치 보호 여부 (true/false)
gh api repos/$OWNER/$REPO/branches/main --jq '{name: .name, protected: .protected}'
gh api repos/$OWNER/$REPO/branches/production --jq '{name: .name, protected: .protected}'

# 3) Classic Branch Protection 상세 (PR 승인 수, 관리자 강제 등)
gh api repos/$OWNER/$REPO/branches/main/protection --jq '{required_pull_request_reviews: .required_pull_request_reviews.required_approving_review_count, dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews, enforce_admins: .enforce_admins.enabled, required_status_checks: .required_status_checks}'
gh api repos/$OWNER/$REPO/branches/production/protection --jq '{required_pull_request_reviews: .required_pull_request_reviews.required_approving_review_count, dismiss_stale_reviews: .required_pull_request_reviews.dismiss_stale_reviews, enforce_admins: .enforce_admins.enabled, required_status_checks: .required_status_checks}'

# 4) Ruleset 기반 규칙 확인 (Classic 미사용 시 필수 점검)
gh api repos/$OWNER/$REPO/rules/branches/main
gh api repos/$OWNER/$REPO/rules/branches/production
gh api repos/$OWNER/$REPO/rulesets --paginate --jq '.[] | {id: .id, name: .name, target: .target, enforcement: .enforcement}'
```

### 브랜치 보호 자동 점검 스크립트 (PASS/FAIL)

```bash
# 기본 저장소(KimIgyong/ambManagement) 점검
bash scripts/check-branch-protection.sh

# 다른 저장소 점검 (선택)
bash scripts/check-branch-protection.sh <OWNER> <REPO>
```

> 운영 기준: `main`, `production` 모두 `protected: true` + `required_approving_review_count >= 1` 유지

### 커밋 메시지 규칙
```
{type}: {설명}

type: feat | fix | docs | style | refactor | test | chore | hotfix
예: feat: 사용자 프로필 페이지 추가
```

## 인프라 및 배포

상세 인프라 구성은 `spec/INFRASTRUCTURE.md`, 배포 가이드는 `spec/DEPLOYMENT-GUIDE.md` 참조.

### 환경별 접속 정보

| 환경 | Web | API | Portal Web | Portal API | DB |
|------|-----|-----|-----------|-----------|-----|
| **개발** | http://localhost:5189 | http://localhost:3019 | http://localhost:5190 | http://localhost:3020 | localhost:5442 |
| **스테이징** | https://hm-stg.hanmam.kr | https://hm-stg.hanmam.kr/api/v1 | - | - | Docker 내부 |
| **프로덕션** | 미정 | 미정 | 미정 | 미정 | 미정 |

### 배포

#### 배포 스크립트 (환경별)
| 환경 | 스크립트 | 실행 위치 |
|------|---------|----------|
| **개발** | `bash docker/dev/deploy-dev.sh` | 로컬 |
| **스테이징** | `bash docker/staging/deploy-staging.sh` | 스테이징 서버 |
| **프로덕션** | `bash docker/production/deploy-production.sh` | 프로덕션 서버 (미구성) |

#### 환경별 배포 명령
- **개발**: `bash docker/dev/deploy-dev.sh`
- **스테이징**: `ssh -p 20002 fremd@172.16.30.159 "cd ~/ambHanmam && bash docker/staging/deploy-staging.sh"`
- **프로덕션**: 미구성
- **주의**: 각 환경의 배포 스크립트는 반드시 해당 서버에서 실행 (로컬 실행 시 로컬 Docker에 배포됨)
- **금지**: `docker compose build` 직접 실행 금지 → 반드시 `deploy-*.sh` 스크립트를 통해 빌드 (`--env-file` 누락 방지)
- **VITE 변수**: `VITE_*` 환경변수는 빌드 시점 인라인이므로 변경 시 이미지 재빌드 필수

### 스테이징 서버
- **SSH**: `ssh -p 20002 fremd@172.16.30.159`
- **프로젝트 경로**: `~/ambHanmam`
- **Git**: `git@github.com:KimIgyong/ambHanmam.git` (main)

## 에러 코드 체계
- E1xxx: 인증/인가
- E2xxx: 사용자
- E3xxx: 대화
- E4xxx: 에이전트
- E9xxx: 시스템

## 요구사항 작업 워크플로우
`[요구사항]` 타이틀로 요청된 건은 반드시 아래 순서로 진행한다:

1. **요구사항 분석서** → `docs/analysis/REQ-{YYMMDD}-{제목}.md`
   - AS-IS 현황 분석, TO-BE 요구사항, 갭 분석, 사용자 플로우, 기술 제약사항
2. **작업 계획서** → `docs/plan/PLN-{YYMMDD}-{제목}.md`
   - 시스템 개발 현황 분석 기반, 단계별 구현 계획, 사이드 임팩트 분석
3. **구현** → 작업 계획서에 따른 코드 구현
4. **테스트 케이스** → `docs/test/TCR-{YYMMDD}-{제목}.md`
   - 단위 테스트 케이스, 통합 테스트 시나리오, 엣지 케이스
5. **작업 완료 보고** → `docs/implementation/RPT-{YYMMDD}-{제목}.md`
   - 구현 내용 정리, 변경 파일 목록, 테스트 결과, 배포 상태

## 대화 기록 및 데일리 리포트

세션 간 작업 연속성을 위해 모든 대화 내용을 로컬에 기록한다.

### 대화 로그 기록
- **경로**: `docs/log/YYYY-MM-DD/`
- **파일명**: `{HH}_{순번}_{작업요약}.md` (예: `14_01_베트남전자세금계산서구현.md`)
- **기록 시점**: 세션 시작 시 자동으로 로그 파일을 생성하고, 주요 작업 단위마다 기록을 갱신한다
- **기록 내용**:
  - 사용자 요청 원문
  - 수행한 작업 내용 요약
  - 변경된 파일 목록
  - 발생한 이슈 및 해결 방법
  - 미완료 항목 (다음 세션에서 이어갈 내용)
- **git 제외**: `docs/log/` 폴더는 `.gitignore`에 등록되어 git에 동기화하지 않음

### 데일리 작업 리포트
- **경로**: `docs/log/YYYY-MM-DD/DAILY-REPORT.md`
- **생성 시점**: 해당 날짜의 마지막 세션 종료 시 또는 사용자 요청 시
- **내용**: 당일 모든 세션의 작업 내용을 통합 요약
  - 완료된 작업 목록
  - 변경된 파일 전체 목록
  - 배포 상태
  - 미해결 이슈 / 다음 작업 예정

## i18n 규칙
- 프론트엔드 UI 텍스트는 반드시 번역 파일(`locales/`)을 사용하고, 컴포넌트에 직접 하드코딩 금지
- 번역 키는 `useTranslation()` 훅의 `t()` 함수로 사용
- 새 네임스페이스 추가 시 `i18n.ts`에 등록 필요
- 백엔드 에러 메시지는 영어 고정 (프론트에서 에러 코드 기반 번역)
- AI 에이전트 응답 언어는 `Accept-Language` 헤더로 제어

## UX 규칙: 버튼 동작 피드백 필수
- **모든 버튼 동작 후 반드시 모달(AlertModal)로 결과 안내 표시**
  - 성공 시: 성공 안내 모달 (자동 닫힘 3초)
  - 실패 시: 에러 상세 메시지 모달 (수동 닫기)
- 버튼 클릭 후 진행 상태 안내가 없으면 사용자가 중복 클릭하거나 동작 실패로 오해함
- 사용 컴포넌트: `@/components/ui/AlertModal` (portal-web 기준)
- 모달 상태 관리: `ModalState` 인터페이스 (`{ isOpen, type, title, message }`)
- 모달 텍스트는 반드시 i18n 키 사용 (`modal_*` prefix)
