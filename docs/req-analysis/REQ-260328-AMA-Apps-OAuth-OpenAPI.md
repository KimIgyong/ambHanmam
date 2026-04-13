# 요구사항 분석서: AMA × Apps 통합 (OAuth 2.0 + Open API)

> **문서번호**: REQ-AMA-Apps-OAuth-OpenAPI-20260328  
> **작성일**: 2026-03-28  
> **관련 조사**: [REQ-AMA-Apps-통합아키텍처-20260328.md](../analysis/REQ-AMA-Apps-통합아키텍처-20260328.md)

---

## 1. 요구사항 개요

### 1.1 배경
AMA(ama.amoeba.site)는 사내 업무 통합 시스템으로, 파트너사가 개발한 외부 앱(apps.amoeba.site)과 API를 통해 데이터를 양방향 교환해야 한다. 현재 파트너 앱 등록/심사/설치 시스템은 구현되어 있으나, 실제 인증 연동(SSO)과 데이터 교환(Open API)이 미구현 상태이다.

### 1.2 핵심 요구사항

| # | 요구사항 | 우선순위 |
|---|---------|---------|
| R1 | AMA 사용자가 파트너 앱에 별도 로그인 없이 자동 접근 (SSO) | **P0** |
| R2 | 파트너 앱이 AMA 데이터를 API로 읽기 (Read) | **P0** |
| R3 | 파트너 앱이 AMA 데이터를 API로 쓰기 (Write) | **P1** |
| R4 | 법인(ent_id) 기반 데이터 격리 유지 | **P0** |
| R5 | Scope 기반 세밀한 접근 제어 | **P0** |
| R6 | API Rate Limiting 및 사용량 추적 | **P1** |
| R7 | 양방향 이벤트 알림 (Webhook) | **P2** |

---

## 2. AS-IS 현황 분석

### 2.1 Partner App 시스템 (✅ 이미 구현)

파트너 앱의 등록/심사/설치 워크플로우가 이미 완성되어 있다.

#### 테이블 구조
```
amb_partner_apps (파트너 앱 마스터)
├── pap_id (UUID PK)
├── ptn_id (FK → amb_partners)         -- 파트너사
├── pap_code (varchar 50, UNIQUE)      -- 앱 코드
├── pap_name, pap_description, pap_icon
├── pap_url (varchar 500)              -- 앱 URL
├── pap_auth_mode: jwt | api_key | none | SSO_JWT | OAUTH2
├── pap_open_mode: iframe | new_tab | POPUP
├── pap_category (varchar 100)
├── pap_status: DRAFT→SUBMITTED→IN_REVIEW→APPROVED→PUBLISHED
├── pap_version (varchar 20)
├── pap_review_note, pap_reviewed_by, pap_reviewed_at
└── pap_published_at, pap_created_at, pap_updated_at, pap_deleted_at

amb_partner_app_installs (법인별 설치)
├── pai_id (UUID PK)
├── pap_id (FK → amb_partner_apps)     -- 앱 ID
├── ent_id (UUID)                      -- 설치한 법인
├── pai_installed_by (UUID)
├── pai_is_active (boolean)
├── pai_allowed_roles (text, JSON)
├── pai_sort_order (int)
└── pai_installed_at (timestamp)
UNIQUE (pap_id, ent_id)                -- 법인당 1회 설치

amb_partner_app_versions (버전 관리)
├── pav_id (UUID PK)
├── pap_id (FK → amb_partner_apps)
├── pav_version, pav_url, pav_change_log
└── pav_status, pav_reviewed_by, pav_reviewed_at
```

#### 기존 엔드포인트
| 기능 | 경로 | Guard | 대상 |
|------|------|-------|------|
| 파트너 앱 CRUD | `/partner/apps/*` | PartnerGuard | 파트너사 |
| 심사 제출 | `POST /partner/apps/:id/submit` | PartnerGuard | 파트너사 |
| 심사/승인/발행 | `/admin/partner-apps/:id/*` | AdminGuard | 어드민 |
| 버전 관리 | `/partner/apps/:id/versions` | PartnerGuard | 파트너사 |

#### 중요 발견: `pap_auth_mode`
- **`OAUTH2`와 `SSO_JWT` 옵션이 이미 DTO에 정의되어 있으나 구현되지 않음**
- 현재는 `jwt`(EntityCustomApp과 동일한 간단 토큰)만 실동작

### 2.2 EntityCustomApp 시스템 (JWT 토큰 발급 구현)

법인별 커스텀 앱 관리 시스템으로, JWT 토큰 발급이 구현되어 있다.

#### JWT 토큰 발급 로직
```typescript
// EntityCustomAppService.generateAppToken()
const payload = {
  sub: user.userId,
  email: user.email,
  role: user.role,
  entityId,
  appId: app.ecaId,
  appCode: app.ecaCode,
  scope: 'custom_app:context',
};
const token = this.jwtService.sign(payload, { expiresIn: '1h' });
```

#### 한계점
- 고정 scope (`custom_app:context` 단일 값)
- 앱별 scope 차별화 없음
- 토큰 추적/폐기 메커니즘 없음
- 외부 앱이 호출할 API 엔드포인트 없음

### 2.3 AMA 인증 시스템

| 항목 | 현황 |
|------|------|
| JWT 구조 | sub, email, level, role, entityId, tokenVersion 등 |
| Access Token | 4시간 유효 |
| Refresh Token | 7일 유효 |
| 데이터 격리 | ent_id 기반, OwnEntityGuard + resolveEntityId() |
| API Key (M2M) | AES-256-GCM 암호화, 법인별/시스템 공유 키 |
| Rate Limiting | @nestjs/throttler 적용 (로그인 5~10/분, 일반 60/분) |
| CORS | 환경변수 CORS_ORIGINS (도메인 화이트리스트) |

### 2.4 외부 연동 패턴

| 연동 | 방향 | 인증 | 데이터 교환 |
|------|------|------|-----------|
| Slack | 양방향 | HMAC-SHA256 서명 | 메시지 동기화 |
| Asana | AMA←Asana | PAT(EntityCustomApp) | 태스크 임포트 |
| Redmine | AMA←Redmine | API Key | 이슈 임포트 |
| MegaPay | AMA←MegaPay | SHA256 토큰 | 결제 IPN |
| Postal | AMA←Postal | 토큰 검증 | 메일 웹훅 |

---

## 3. TO-BE 요구사항

### 3.1 OAuth 2.0 Authorization Code + PKCE

AMA를 OAuth 2.0 Authorization Server로 구현하여 파트너 앱에 표준 방식으로 인증/인가를 제공한다.

#### 3.1.1 OAuth Client = Partner App

기존 `amb_partner_apps` 테이블에 OAuth 관련 필드를 추가한다 (별도 테이블 불필요).

**추가 필드**:
```
pap_client_id       VARCHAR(100) UNIQUE  -- OAuth client_id (자동 생성)
pap_client_secret_hash VARCHAR(255)      -- bcrypt 해시
pap_redirect_uris   TEXT[]               -- 허용 콜백 URL 목록
pap_scopes          TEXT[]               -- 허용 scope 목록
```

#### 3.1.2 Authorization Code 흐름

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Partner App  │     │  AMA Web     │     │  AMA API     │
│ (앱 프론트)   │     │  (동의 화면)  │     │  (OAuth 서버) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ 1. 앱 실행 (사이드바/새탭)                │
       ├─────────────────────────────────────────→│
       │ GET /api/v1/oauth/authorize              │
       │   ?client_id=pap_client_id               │
       │   &redirect_uri=https://app.partner.com  │
       │   &response_type=code                    │
       │   &scope=assets:read+issues:read         │
       │   &state=random &code_challenge=xxx      │
       │                    │                     │
       │                    │←────────────────────│
       │                    │ 2. 동의 화면 렌더    │
       │                    │ (이미 로그인됨 확인)  │
       │                    │                     │
       │                    │ 3. 사용자 "허용" 클릭│
       │                    ├────────────────────→│
       │                    │ POST consent        │
       │                    │                     │
       │←───────────────────────────────────────  │
       │ 4. redirect_uri?code=AUTH_CODE&state=xxx │
       │                                          │
       │ 5. Code → Token Exchange                 │
       ├─────────────────────────────────────────→│
       │ POST /api/v1/oauth/token                 │
       │   grant_type=authorization_code          │
       │   code=AUTH_CODE                         │
       │   client_id & client_secret              │
       │   code_verifier (PKCE)                   │
       │                                          │
       │←─────────────────────────────────────────│
       │ { access_token, refresh_token,           │
       │   expires_in, scope, token_type }        │
       │                                          │
       │ 6. Open API 호출                         │
       ├─────────────────────────────────────────→│
       │ GET /api/v1/open/assets                  │
       │ Authorization: Bearer {access_token}     │
       │                                          │
       │←─────────────────────────────────────────│
       │ { success: true, data: [...] }           │
```

#### 3.1.3 간소화 플로우 (AMA 사이드바 iframe)

AMA Web 내 사이드바에서 앱을 iframe으로 열 때는 이미 로그인 상태이므로 동의 화면을 생략할 수 있다 (법인 관리자가 앱 설치 시 scope를 사전 승인).

```
AMA Web → POST /api/v1/oauth/token (grant_type=ama_session)
  → AMA Session Cookie로 인증 → Scoped Token 즉시 발급
  → iframe postMessage로 토큰 전달
  → Partner App이 토큰으로 Open API 호출
```

### 3.2 Open API Gateway

파트너 앱이 호출하는 공개 API 엔드포인트.

#### 3.2.1 Scope 체계

```
# 자산
assets:read              자산 조회 (목록, 상세, 카테고리 필터)
assets:write             자산 생성/수정

# 이슈
issues:read              이슈 조회
issues:write             이슈 생성/수정

# 프로젝트
projects:read            프로젝트 조회

# 사용자/조직
users:read               사용자 기본정보 조회 (이름, 이메일, 부서)
units:read               부서/조직 트리

# 법인
entity:read              법인 기본정보

# 프로필
profile                  현재 사용자 프로필 (sub, email, name, entityId)

# Refresh Token
offline_access           Refresh Token 발급 허용
```

#### 3.2.2 엔드포인트 설계

| 메서드 | 경로 | Scope 필요 | 설명 |
|--------|------|-----------|------|
| **인증** | | | |
| GET | `/api/v1/oauth/authorize` | - | Authorization Code 요청 |
| POST | `/api/v1/oauth/token` | - | Token 발급/갱신 |
| POST | `/api/v1/oauth/revoke` | - | Token 폐기 |
| GET | `/api/v1/oauth/userinfo` | profile | 현재 사용자 정보 |
| **자산** | | | |
| GET | `/api/v1/open/assets` | assets:read | 자산 목록 (category, status 필터) |
| GET | `/api/v1/open/assets/:id` | assets:read | 자산 상세 |
| POST | `/api/v1/open/assets` | assets:write | 자산 생성 |
| PATCH | `/api/v1/open/assets/:id` | assets:write | 자산 수정 |
| **이슈** | | | |
| GET | `/api/v1/open/issues` | issues:read | 이슈 목록 |
| GET | `/api/v1/open/issues/:id` | issues:read | 이슈 상세 |
| POST | `/api/v1/open/issues` | issues:write | 이슈 생성 |
| PATCH | `/api/v1/open/issues/:id` | issues:write | 이슈 수정 |
| **프로젝트** | | | |
| GET | `/api/v1/open/projects` | projects:read | 프로젝트 목록 |
| GET | `/api/v1/open/projects/:id` | projects:read | 프로젝트 상세 |
| **사용자/조직** | | | |
| GET | `/api/v1/open/users` | users:read | 사용자 목록 |
| GET | `/api/v1/open/units` | units:read | 부서 트리 |
| **법인** | | | |
| GET | `/api/v1/open/entity` | entity:read | 법인 기본정보 |

### 3.3 데이터 격리 및 보안

#### ent_id 격리 강제
- OAuth Token에 `ent_id` 내장 (발급 시점의 사용자 소속 법인)
- 모든 Open API 쿼리에 `ent_id` WHERE 조건 자동 적용
- `OAuthScopeGuard`가 scope + ent_id 동시 검증

#### Rate Limiting
- 앱별 분당 호출 제한 (기본 60 req/min)
- 플랜별 차별화 가능 (추후)
- 429 Too Many Requests + `Retry-After` 헤더

#### 감사 로그
- 모든 Open API 호출 기록: client_id, user_id, ent_id, endpoint, method, status, timestamp

---

## 4. 갭 분석

### 4.1 기능별 갭 상세

| 영역 | AS-IS | TO-BE | 갭 유형 |
|------|-------|-------|---------|
| **앱 등록/심사** | PartnerApp CRUD + Admin 심사 완성 | 그대로 활용 | ✅ 갭 없음 |
| **앱 설치 (법인별)** | PartnerAppInstall 완성 | scope 필드 추가 | 🟡 필드 추가 |
| **OAuth Client 등록** | pap_auth_mode에 OAUTH2 옵션만 있음 | client_id/secret/redirect_uris 저장 | 🔴 신규 |
| **Authorization Code** | 미구현 | /oauth/authorize + 동의 화면 | 🔴 신규 |
| **Token 발급** | EntityCustomApp JWT 간단 발급 | OAuth2 표준 토큰 발급/갱신/폐기 | 🔴 신규 |
| **OAuth Token Guard** | 없음 | OAuthTokenGuard + RequireScope | 🔴 신규 |
| **Open API 엔드포인트** | 없음 | /open/assets, /open/issues 등 | 🔴 신규 |
| **앱→AMA 데이터 Write** | Slack만 양방향 | assets:write, issues:write 등 | 🔴 신규 |
| **Rate Limiting** | @nestjs/throttler 기본 적용 | 앱별/scope별 차별화 | 🟡 확장 |
| **감사 로그** | 없음 | Open API 호출 기록 | 🔴 신규 |

### 4.2 DB 변경 범위

#### 기존 테이블 변경
- `amb_partner_apps`: OAuth 관련 4개 컬럼 추가
- `amb_partner_app_installs`: 승인 scope 컬럼 추가

#### 신규 테이블
- `amb_oauth_authorization_codes`: 인가 코드 (단기)
- `amb_oauth_tokens`: 발급 토큰 추적
- `amb_open_api_logs`: API 감사 로그

---

## 5. 사용자 플로우

### 5.1 법인 관리자: 앱 설치 + Scope 승인
```
1. 법인 관리자가 AMA Web > 설정 > Apps Marketplace 접근
2. PUBLISHED 상태의 파트너 앱 카탈로그 조회
3. 앱 선택 → 상세 (설명, 스크린샷, 요청 Scope 목록)
4. "설치" 클릭 → Scope 확인/조정 → 허용 역할 선택
5. amb_partner_app_installs 레코드 생성 (승인된 scope 포함)
6. 설치 완료 → 해당 법인 사용자 사이드바에 앱 표시
```

### 5.2 일반 사용자: 앱 실행 + 자동 로그인
```
1. AMA Web 사이드바에 설치된 앱 표시 (역할 기반 필터)
2. 앱 아이콘 클릭
3-A. [iframe 모드]
    - AMA Web이 POST /oauth/token (grant_type=ama_session) 호출
    - Scoped Access Token 수신
    - iframe src에 앱 URL + token 파라미터 전달
3-B. [new_tab 모드]
    - GET /oauth/authorize로 리다이렉트
    - 이미 로그인 + 이미 설치(승인) → 동의 화면 스킵
    - Authorization Code → redirect_uri 콜백
    - Partner App이 code→token 교환
4. Partner App이 Access Token으로 AMA Open API 호출
```

### 5.3 파트너 앱: 데이터 교환

```
# 예시: app-car-manager가 차량 자산 조회
GET /api/v1/open/assets?category=VEHICLE&status=IN_USE
Authorization: Bearer {access_token}
→ 해당 법인(ent_id)의 VEHICLE 카테고리 자산만 반환

# 예시: app-car-manager가 정비 기록을 자산에 추가
PATCH /api/v1/open/assets/{ast_id}
Authorization: Bearer {access_token}
{ "ast_note": "정기 정비 완료 (2026-03-28)" }
→ 해당 법인 소유 자산만 수정 가능

# 예시: app-car-manager가 정비 이슈 생성
POST /api/v1/open/issues
Authorization: Bearer {access_token}
{
  "title": "차량 VN-001 엔진오일 교체 필요",
  "category": "MAINTENANCE",
  "priority": "MEDIUM",
  "assignee_id": "담당자 UUID"
}
→ 해당 법인의 이슈로 생성
```

---

## 6. 기술 제약사항

### 6.1 보안 요구사항

| # | 요구사항 | 구현 방안 |
|---|---------|---------|
| S1 | PKCE 필수 (code_challenge_method=S256) | Authorization Code 발급 시 검증 |
| S2 | client_secret bcrypt 해시 저장 | Token Exchange 시 검증 |
| S3 | Authorization Code 10분 만료 + 1회 사용 | used_at 마킹 |
| S4 | Access Token 1시간, Refresh Token 30일 | configurable |
| S5 | Refresh Token Rotation | 갱신 시 이전 토큰 즉시 폐기 |
| S6 | redirect_uri 사전 등록 검증 | 배열 포함 여부 정확 매칭 |
| S7 | state 파라미터 CSRF 방지 | 클라이언트 검증 책임 |
| S8 | Token DB 저장은 SHA256 해시 | 원본 토큰 DB에 미저장 |
| S9 | 법인 격리 (ent_id) | 모든 Open API 쿼리에 강제 |
| S10 | Rate Limiting | @nestjs/throttler 확장 |

### 6.2 호환성

- 기존 AMA JWT 인증과 OAuth Token Guard 병행 운용
- 기존 EntityCustomApp JWT 발급 로직은 유지 (하위 호환)
- PartnerApp 테이블 컬럼 추가는 기존 CRUD에 영향 없음 (nullable 컬럼)

### 6.3 성능

- OAuth Token Guard: DB 조회 1회 (SHA256 인덱스)
- Open API: 기존 서비스 로직 재사용 (추가 오버헤드 최소)
- 감사 로그: 비동기 저장 (요청 응답 지연 없음)

### 6.4 인프라

- `apps.amoeba.site` 도메인은 별도 nginx vhost로 구성 필요 (추후)
- 현재는 AMA API(`/api/v1/oauth/*`, `/api/v1/open/*`)에 통합하여 추가 인프라 불필요
- CORS: OAuth client의 `redirect_uri` 도메인을 동적 화이트리스트에 추가

---

## 7. 비기능 요구사항

| # | 항목 | 요구수준 |
|---|------|---------|
| NF1 | Open API 응답 시간 | p95 < 500ms |
| NF2 | OAuth Token 발급 | < 200ms |
| NF3 | Rate Limiting | 앱별 60 req/min (기본) |
| NF4 | 가용성 | AMA API와 동일 (nginx 프록시) |
| NF5 | 감사 로그 보존 | 90일 |
| NF6 | API 문서 | Public Swagger (별도 경로) |

---

## 8. 구현 범위 결정

### 구현 대상 (이번 작업)
- Phase 1: OAuth 2.0 서버 (Authorization Code + PKCE + Token)
- Phase 2: Open API Gateway (Asset, Issue, Project, User, Unit, Entity)
- Phase 3: 앱 설치 Scope 관리 + 프론트엔드

### 제외 (추후)
- Webhook 이벤트 시스템 (Phase 4)
- apps.amoeba.site 전용 마켓플레이스 UI
- Usage-based 과금 연동 (Portal 구독 시스템 연계)
- Partner App SDK / 개발자 문서 포털
