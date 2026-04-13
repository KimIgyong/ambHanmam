# RPT-AMA-Apps-OAuth-OpenAPI-작업완료보고-20260328

## 작업 완료 보고서

- **프로젝트**: AMA × Apps (OAuth 2.0 Authorization Code + PKCE + Open API Gateway)
- **작성일**: 2026-03-28
- **관련 문서**:
  - 요구사항 분석서: `docs/analysis/REQ-AMA-Apps-OAuth-OpenAPI-20260328.md`
  - 작업 계획서: `docs/plan/PLAN-AMA-Apps-OAuth-OpenAPI-작업계획-20260328.md`
  - 테스트 케이스: `docs/test/TC-AMA-Apps-OAuth-OpenAPI-Test-20260328.md`

---

## 1. 구현 내용 요약

### 1.1 Phase 1: OAuth 2.0 Authorization Server

파트너 앱이 AMA 사용자 데이터에 안전하게 접근할 수 있도록 OAuth 2.0 Authorization Code + PKCE 인증 서버를 구현했다.

**핵심 기능:**
- Authorization Code Flow (RFC 6749)
- PKCE (S256) 지원 (RFC 7636)
- `ama_session` Grant Type (내부 JWT → OAuth 토큰 교환)
- Access Token (JWT, 1시간) + Refresh Token Rotation (30일)
- Token Revocation
- Userinfo endpoint
- Scope 기반 접근 제어 (10개 scope)
- Admin 앱 승인 시 자동 Client Credentials 발급 (bcrypt 해시 저장)
- Authorization Code 재사용 감지 → 전체 토큰 폐기 (보안)

### 1.2 Phase 2: Open API Gateway

6개 도메인에 대한 읽기 전용 Open API를 구현했다. 모든 엔드포인트는 OAuth Bearer 토큰 인증 + Scope 검증 + 법인 데이터 격리를 적용한다.

**엔드포인트 (12개):**
| API | Scope | 메서드 |
|-----|-------|--------|
| `GET /open/assets` | assets:read | 자산 목록 |
| `GET /open/assets/:id` | assets:read | 자산 상세 |
| `GET /open/issues` | issues:read | 이슈 목록 |
| `GET /open/issues/:id` | issues:read | 이슈 상세 |
| `GET /open/issues/:id/comments` | issues:read | 이슈 코멘트 |
| `GET /open/projects` | projects:read | 프로젝트 목록 |
| `GET /open/projects/:id` | projects:read | 프로젝트 상세 |
| `GET /open/units` | units:read | 부서 목록 |
| `GET /open/units/tree` | units:read | 부서 트리 |
| `GET /open/users` | users:read | 사용자 목록 |
| `GET /open/entity` | entity:read | 법인 정보 |

**공통 기능:**
- `@Public()` + `OAuthTokenGuard` + `RequireScopeGuard` 인증/인가 체인
- `OpenApiLogInterceptor`로 모든 API 호출 감사 로그 자동 기록
- 기존 서비스 재사용 (AssetService, IssueService, ProjectService, UnitService, MemberService, EntityService)

### 1.3 Phase 3: Frontend

**OAuth 동의 화면 (`/oauth/consent`):**
- URL 쿼리 파라미터에서 client_id, redirect_uri, scope, PKCE 정보 파싱
- `GET /oauth/authorize`로 앱 정보 + 허용 가능 scope 조회
- 체크박스로 scope 선택/해제
- 승인 → redirect_uri로 code+state 전달
- 거부 → redirect_uri로 error=access_denied 전달
- 법인명+사용자명 표시 (데이터 범위 명시)

**앱 마켓플레이스 (`/entity-settings/apps`):**
- "사용 가능" / "설치됨" 탭 전환
- PUBLISHED 앱 카드 목록 (앱명, 파트너명, 버전, 카테고리, 설명)
- 앱 설치 다이얼로그 (scope 선택)
- 설치된 앱 scope 편집 (확장/축소 UI)
- 앱 제거 확인 다이얼로그
- React Query로 데이터 fetching + 캐시 무효화

**Entity 앱 관리 API (추가 구현):**
- `GET /entity/apps/marketplace` - PUBLISHED 앱 목록
- `GET /entity/apps/installed` - 내 법인 설치 앱 목록
- `POST /entity/apps/:appId/install` - 앱 설치
- `DELETE /entity/apps/:appId/uninstall` - 앱 제거
- `PATCH /entity/apps/:installId/scopes` - scope 수정
- 모두 `@Auth()` + `@UseGuards(OwnEntityGuard)` + `resolveEntityId()` 적용

**i18n:**
- `oauth` 네임스페이스 추가 (en/ko/vi 3개 언어)
- consent, scopes, marketplace 섹션 번역

---

## 2. 변경 파일 목록

### 2.1 신규 파일 (29개)

| # | 파일 경로 | Phase | 설명 |
|---|----------|-------|------|
| 1 | `sql/migration_oauth_open_api.sql` | 1 | DB 마이그레이션 (ALTER 2 + CREATE 3) |
| 2 | `apps/api/src/domain/oauth/interface/oauth-scope.ts` | 1 | 10개 OAuth scope 정의 |
| 3 | `apps/api/src/domain/oauth/interface/oauth-context.interface.ts` | 1 | OAuthTokenContext 인터페이스 |
| 4 | `apps/api/src/domain/oauth/entity/oauth-authorization-code.entity.ts` | 1 | Authorization Code 엔티티 |
| 5 | `apps/api/src/domain/oauth/entity/oauth-token.entity.ts` | 1 | OAuth Token 엔티티 |
| 6 | `apps/api/src/domain/oauth/entity/open-api-log.entity.ts` | 1 | API 감사 로그 엔티티 |
| 7 | `apps/api/src/domain/oauth/dto/authorize.request.ts` | 1 | 인가 요청 DTO |
| 8 | `apps/api/src/domain/oauth/dto/consent.request.ts` | 1 | 동의 요청 DTO |
| 9 | `apps/api/src/domain/oauth/dto/token.request.ts` | 1 | 토큰 교환 DTO |
| 10 | `apps/api/src/domain/oauth/dto/token.response.ts` | 1 | 토큰 응답 DTO |
| 11 | `apps/api/src/domain/oauth/service/oauth-client.service.ts` | 1 | Client 생성/검증 서비스 |
| 12 | `apps/api/src/domain/oauth/service/oauth.service.ts` | 1 | OAuth 코어 로직 |
| 13 | `apps/api/src/domain/oauth/guard/oauth-token.guard.ts` | 1 | Bearer 토큰 검증 Guard |
| 14 | `apps/api/src/domain/oauth/guard/require-scope.guard.ts` | 1 | Scope 검증 Guard |
| 15 | `apps/api/src/domain/oauth/decorator/oauth.decorator.ts` | 1 | @RequireScope, @OAuthContext |
| 16 | `apps/api/src/domain/oauth/controller/oauth.controller.ts` | 1 | OAuth 엔드포인트 5개 |
| 17 | `apps/api/src/domain/oauth/oauth.module.ts` | 1 | OAuth 모듈 |
| 18 | `apps/api/src/domain/open-api/dto/open-common.dto.ts` | 2 | 공통 페이지네이션 DTO |
| 19 | `apps/api/src/domain/open-api/dto/open-asset.dto.ts` | 2 | Asset 쿼리 DTO |
| 20 | `apps/api/src/domain/open-api/dto/open-issue.dto.ts` | 2 | Issue 쿼리 DTO |
| 21 | `apps/api/src/domain/open-api/dto/open-project.dto.ts` | 2 | Project 쿼리 DTO |
| 22 | `apps/api/src/domain/open-api/interceptor/open-api-log.interceptor.ts` | 2 | API 감사 로그 인터셉터 |
| 23 | `apps/api/src/domain/open-api/controller/open-asset.controller.ts` | 2 | Asset Open API |
| 24 | `apps/api/src/domain/open-api/controller/open-issue.controller.ts` | 2 | Issue Open API |
| 25 | `apps/api/src/domain/open-api/controller/open-project.controller.ts` | 2 | Project Open API |
| 26 | `apps/api/src/domain/open-api/controller/open-unit.controller.ts` | 2 | Unit Open API |
| 27 | `apps/api/src/domain/open-api/controller/open-user.controller.ts` | 2 | User Open API |
| 28 | `apps/api/src/domain/open-api/controller/open-entity.controller.ts` | 2 | Entity Open API |
| 29 | `apps/api/src/domain/open-api/open-api.module.ts` | 2 | Open API 모듈 |
| 30 | `apps/api/src/domain/partner-app/controller/entity-partner-app.controller.ts` | 3 | Entity 앱 설치 관리 API |
| 31 | `apps/web/src/locales/en/oauth.json` | 3 | 영어 번역 |
| 32 | `apps/web/src/locales/ko/oauth.json` | 3 | 한국어 번역 |
| 33 | `apps/web/src/locales/vi/oauth.json` | 3 | 베트남어 번역 |
| 34 | `apps/web/src/domain/oauth/pages/OAuthConsentPage.tsx` | 3 | OAuth 동의 화면 |
| 35 | `apps/web/src/domain/entity-settings/pages/EntityAppsPage.tsx` | 3 | 앱 마켓플레이스 |

### 2.2 수정 파일 (6개)

| # | 파일 경로 | Phase | 변경 내용 |
|---|----------|-------|----------|
| 1 | `apps/api/src/domain/partner-app/entity/partner-app.entity.ts` | 1 | +4 OAuth 컬럼 (papClientId, papClientSecretHash, papRedirectUris, papScopes) |
| 2 | `apps/api/src/domain/partner-app/entity/partner-app-install.entity.ts` | 1 | +paiApprovedScopes 컬럼 |
| 3 | `apps/api/src/domain/partner-app/service/admin-partner-app.service.ts` | 1 | approve() 시 client credentials 자동 생성 |
| 4 | `apps/api/src/domain/partner-app/partner-app.module.ts` | 1+3 | EntityPartnerAppController 등록 |
| 5 | `apps/api/src/app.module.ts` | 1+2 | OAuthModule + OpenApiModule import |
| 6 | `apps/web/src/i18n.ts` | 3 | oauth 네임스페이스 등록 (3언어) |
| 7 | `apps/web/src/router/index.tsx` | 3 | /oauth/consent + entity-settings/apps 라우트 |

---

## 3. DB 변경사항

### 3.1 기존 테이블 변경

```sql
-- amb_partner_apps: OAuth 컬럼 4개 추가
ALTER TABLE amb_partner_apps ADD COLUMN pap_client_id VARCHAR(100) UNIQUE;
ALTER TABLE amb_partner_apps ADD COLUMN pap_client_secret_hash VARCHAR(255);
ALTER TABLE amb_partner_apps ADD COLUMN pap_redirect_uris TEXT[];
ALTER TABLE amb_partner_apps ADD COLUMN pap_scopes TEXT[] DEFAULT '{}';

-- amb_partner_app_installs: 승인 scope 컬럼 추가
ALTER TABLE amb_partner_app_installs ADD COLUMN pai_approved_scopes TEXT[] DEFAULT '{}';
```

### 3.2 신규 테이블 3개

| 테이블 | 설명 | PK |
|--------|------|-----|
| `amb_oauth_authorization_codes` | Authorization Code 저장 | `oac_id` (UUID) |
| `amb_oauth_tokens` | Access/Refresh 토큰 추적 | `otk_id` (UUID) |
| `amb_open_api_logs` | API 호출 감사 로그 | `oal_id` (UUID) |

### 3.3 마이그레이션 파일

- `sql/migration_oauth_open_api.sql`
- **스테이징/프로덕션 배포 전 반드시 수동 실행 필요** (synchronize: false)

---

## 4. 빌드 결과

| 대상 | 결과 | 검증 명령 |
|------|------|----------|
| **API (Backend)** | ✅ `webpack 5.97.1 compiled successfully` | `npm run -w @amb/api build` |
| **Web (Frontend)** | ✅ `built in 11.94s` | `npm run -w @amb/web build` |

---

## 5. 보안 검증

| 항목 | 적용 |
|------|------|
| PKCE (S256) | ✅ code_challenge/code_verifier 검증 |
| Authorization Code 재사용 감지 | ✅ → 전체 토큰 폐기 |
| Refresh Token Rotation | ✅ 매 refresh 시 새 토큰 발급, 이전 폐기 |
| Client Secret bcrypt 해싱 | ✅ salt round 10 |
| Access Token 1시간 만료 | ✅ JWT exp claim |
| 법인 데이터 격리 | ✅ 토큰 내 entityId 바인딩 |
| Scope 교차 검증 | ✅ install 승인 scope ∩ 요청 scope |
| Open API 감사 로그 | ✅ 모든 호출 자동 기록 |
| Entity 레벨 API 가드 | ✅ @Auth() + OwnEntityGuard + resolveEntityId() |

---

## 6. 배포 상태

| 환경 | 상태 | 비고 |
|------|------|------|
| 로컬 개발 | ✅ 빌드 완료 | TypeORM synchronize로 스키마 자동 생성 |
| 스테이징 | ⬜ 미배포 | DB 마이그레이션 SQL 수동 실행 후 배포 필요 |
| 프로덕션 | ⬜ 미배포 | |

### 스테이징 배포 절차

```bash
# 1) DB 마이그레이션
ssh amb-staging "docker exec amb-postgres-staging psql -U amb_user -d db_amb -f /dev/stdin" < sql/migration_oauth_open_api.sql

# 2) 코드 배포
ssh amb-staging "cd ~/ambManagement && git pull origin main && bash docker/staging/deploy-staging.sh"
```

---

## 7. 후속 작업

| # | 항목 | 우선순위 | 설명 |
|---|------|---------|------|
| 1 | Open API Swagger 문서 | MEDIUM | `/open-api-docs` 경로에 파트너 개발자용 Swagger 제공 |
| 2 | Rate Limiting | HIGH | per-client throttle 적용 (Open API 남용 방지) |
| 3 | Webhook 시스템 | LOW | 이벤트 기반 파트너 앱 알림 |
| 4 | Partner Developer Portal | MEDIUM | 파트너 개발자가 앱 테스트할 수 있는 sandbox |
| 5 | Admin 앱 관리 UI 개선 | LOW | OAuth client 관리, 토큰 현황, API 사용량 대시보드 |
| 6 | 메뉴 코드 등록 | LOW | ENTITY_APPS 메뉴 코드 추가 → MenuGuard 적용 |

---

## 8. 요약

| 항목 | 수량 |
|------|------|
| 신규 파일 | 35개 (백엔드 30 + 프론트 5) |
| 수정 파일 | 7개 |
| 신규 DB 테이블 | 3개 |
| 기존 DB 테이블 변경 | 2개 |
| OAuth 엔드포인트 | 5개 |
| Open API 엔드포인트 | 11개 |
| Entity 앱 관리 API | 5개 |
| 프론트엔드 페이지 | 2개 (동의 화면 + 마켓플레이스) |
| i18n 네임스페이스 | 1개 (oauth, 3언어) |
| 테스트 케이스 | 94개 |
