# AMA × Apps 통합 아키텍처 시스템 조사 리포트

> **작성일**: 2026-03-28  
> **목적**: AMA(ama.amoeba.site)와 외부 파트너 앱(apps.amoeba.site) 간 통합 아키텍처 수립을 위한 현행 시스템 분석  
> **범위**: 인증/인가, 데이터 구조, 포탈 구독, SSO, API 연동 패턴

---

## 1. 요구사항 요약

### 1.1 핵심 플로우
```
AMA 사용자 → Apps 포탈 접근 → 서비스 선택 → 사용신청/구독 → 승인
→ 자동 로그인 (AMA 인증정보 사용) → 앱 사용 (AMA 데이터 양방향 교환)
```

### 1.2 핵심 요구사항
| # | 요구사항 | 설명 |
|---|---------|------|
| R1 | **앱 마켓플레이스** | apps.amoeba.site에서 파트너 앱 카탈로그 제공 |
| R2 | **구독/승인 워크플로우** | 서비스 선택 → 사용신청 → 법인 관리자 승인 |
| R3 | **SSO 자동 로그인** | AMA 계정으로 Apps에 자동 로그인 (별도 가입 불필요) |
| R4 | **데이터 참조 (Read)** | 앱이 AMA 엔티티 데이터를 읽기 (예: 차량 정보) |
| R5 | **데이터 기록 (Write)** | 앱이 AMA에 데이터를 추가/수정 (양방향) |
| R6 | **법인 격리** | 앱은 구독한 법인(ent_id)의 데이터만 접근 가능 |

### 1.3 예시 시나리오
- **app-car-manager**: AMA `amb_assets` 테이블의 차량 자산 정보를 참조/추가
- 파트너사가 개발한 앱이 AMA의 프로젝트, 이슈, 자산, HR 데이터를 활용

---

## 2. 현행 시스템 분석

### 2.1 AMA 인증/인가 시스템 (apps/api)

#### JWT 토큰 구조
```typescript
// JwtPayload - 토큰에 저장되는 클레임
{
  sub: string;              // 사용자 ID (usr_id)
  email: string;
  level: string;            // ADMIN_LEVEL | USER_LEVEL | PARTNER_LEVEL | CLIENT_LEVEL
  role: string;             // SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER
  status: string;           // ACTIVE 등
  companyId: string | null; // 소속 조직 ID
  entityId?: string;        // USER_LEVEL의 법인 ID (데이터 격리 키)
  isHq: boolean;
  tokenVersion?: number;    // 토큰 무효화 버전
  timezone?: string;
  locale?: string;
}
```

#### 인증 흐름
- **토큰 추출**: Cookie(`access_token`) > Authorization Bearer 헤더
- **토큰 수명**: Access 4시간, Refresh 7일
- **토큰 무효화**: `tokenVersion` 비교로 즉시 무효화 가능
- **가드 체인**: `JwtAuthGuard` → `LevelRoleGuard` → `OwnEntityGuard`

#### 데이터 격리 (멀티테넌시)
```typescript
// DataScopeInfo - 자동 주입
{
  scope: 'ALL' | 'OWN_ORG' | 'PARTNER' | 'CLIENT';
  companyId: string | null;   // USER_LEVEL 필터링 키
}

// 컨트롤러 표준 패턴
const entityId = resolveEntityId(queryEntityId, user);
// → 모든 서비스 쿼리에 entityId WHERE 조건 필수
```

#### 기존 API 키 시스템 (M2M)
```
amb_api_keys 테이블
├── AES-256-GCM 암호화 (CryptoService)
├── 법인별 키 (ent_id=UUID) OR 시스템 공유 키 (ent_id=NULL)
├── provider: 'ANTHROPIC' | 'REDMINE' | 'ASANA' 등
└── getDecryptedKey(provider, entityId?) → 법인 키 우선 → 시스템 키 fallback
```

### 2.2 포탈 시스템 (apps/portal-api, apps/portal-web)

#### 포탈 JWT - AMA와 완전 분리
```typescript
// Portal JWT Payload
{
  sub: customer.pctId,    // Portal Customer ID
  email: customer.pctEmail,
  type: 'portal'          // ← AMA 토큰과 구분 (AMA는 type 필드 없음)
}
```

| 항목 | AMA (apps/api) | Portal (apps/portal-api) |
|------|----------------|--------------------------|
| 사용자 모델 | UserEntity (직원) | PortalCustomerEntity (고객사) |
| 조직 모델 | HrEntityEntity (법인) | SvcClientEntity (고객사) |
| 인증 전략 | `jwt` strategy | `portal-jwt` strategy |
| 토큰 Type | 없음 | `type: 'portal'` 필수 |
| 격리 키 | `ent_id` | `cli_id` |
| 포트 | 3009 | 3010 |

#### 구독/과금 시스템 (이미 구현됨)
```
PortalCustomerEntity (인증)
  └─ SvcClientEntity (과금 계정)
     ├─ SvcSubscriptionEntity (구독)
     │   ├─ SvcServiceEntity (서비스 카탈로그)
     │   └─ SvcPlanEntity (요금제)
     ├─ SvcUsageRecordEntity (사용량 추적)
     └─ PortalPaymentEntity (결제 기록)
```

#### 서비스 카탈로그
- `GET /api/portal/services` → ACTIVE 서비스 + 중첩 요금제 반환
- 다국어 지원: `svc_name_ko`, `svc_name_vi`
- 결제: Stripe (+ VNPAY, TOSS 확장 가능)
- 무료 체험: `spl_trial_days` (기본 14일)

#### 포탈 ↔ AMA 엔티티 연결: **현재 미구현**
- `amb_portal_user_mappings` 테이블 설계 문서에만 존재
- Portal Customer → AMA User 간 직접 링크 없음
- **이것이 SSO 구현의 핵심 갭**

### 2.3 기존 외부 앱 통합 패턴

#### EntityCustomApp (법인별 커스텀 앱)
```typescript
// amb_entity_custom_apps
{
  ecaCode: string;           // 앱 코드
  ecaUrl: string;            // 외부 앱 URL
  ecaAuthMode: 'jwt' | 'api_key' | 'none';
  ecaOpenMode: 'iframe' | 'new_tab';
  ecaAllowedRoles: string[]; // 접근 허용 역할
  ecaApiKeyEnc: string;      // 암호화 API Key (api_key 모드)
}
```

**JWT 모드 토큰** (외부 앱에 전달):
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "MASTER",
  "entityId": "법인_id",
  "appId": "eca_id",
  "appCode": "앱_코드",
  "scope": "custom_app:context",
  "exp": 3600
}
```

#### ExternalTaskMapping (Asana/Redmine/Jira 임포트)
- `amb_external_task_mappings`: 외부 태스크 → AMA Issue 매핑
- 단방향 임포트 (외부 → AMA), 중복 방지 UNIQUE 제약
- provider별 API 클라이언트로 외부 시스템 호출

#### Slack 통합 (양방향)
- **Inbound**: Slack → AMA (webhook 수신, 서명 검증)
- **Outbound**: AMA → Slack (EventEmitter2 → @slack/web-api)
- OAuth 토큰 암호화 저장, workspace별 설정

### 2.4 주요 데이터 도메인 (외부 앱 접근 대상)

| 도메인 | 테이블 | 격리 키 | 외부 앱 활용 예 |
|--------|--------|---------|----------------|
| **법인** | `amb_hr_entities` | PK: `ent_id` | 법인 기본정보 참조 |
| **사용자** | `amb_users` | `ent_id` | 담당자 조회 |
| **부서** | `amb_units` | `ent_id` | 조직 구조 참조 |
| **자산** | `amb_assets` | `ent_id` | 차량/장비 조회/등록 |
| **이슈** | `amb_issues` | `ent_id` | 작업 연동 |
| **프로젝트** | `amb_projects` | `ent_id` | 프로젝트 참조 |
| **할일** | `amb_todos` | `ent_id` | 업무 연동 |
| **채팅** | `amb_talk_channels` | `ent_id` | 알림/메시지 |

#### Asset 테이블 상세 (app-car-manager 시나리오)
```typescript
// amb_assets 주요 필드
{
  ast_id: UUID,
  ent_id: UUID,              // 데이터 격리 키
  ast_code: string,          // 자산코드 (UNIQUE)
  ast_name: string,          // 자산명
  ast_category: string,      // 카테고리 (예: VEHICLE)
  ast_status: string,        // STORED | IN_USE | REPAIRING | DISPOSED
  ast_manufacturer: string,  // 제조사
  ast_model_name: string,    // 모델명
  ast_serial_no: string,     // 일련번호
  ast_purchase_date: Date,
  ast_purchase_amount: number,
  ast_currency: string,
  ast_manager_id: UUID,      // 담당자
  ast_location: string,      // 위치
  ast_barcode: string,       // 바코드
}
// 인덱스: (ent_id, ast_category), (ent_id, ast_status)
```

---

## 3. 갭 분석 (AS-IS vs TO-BE)

### 3.1 기능별 갭

| 요구사항 | AS-IS | TO-BE | 갭 크기 |
|---------|-------|-------|---------|
| **앱 마켓플레이스** | Portal에 서비스 카탈로그 존재 (Pricing Page) | apps.amoeba.site 전용 마켓플레이스 | 🟡 중간 (리브랜딩/확장) |
| **구독/승인** | Stripe 기반 구독 시스템 구현됨 | + 법인 관리자 승인 워크플로우 추가 | 🟡 중간 |
| **SSO (AMA→Apps)** | **미구현** (Portal과 AMA 완전 분리) | AMA JWT로 Apps 자동 로그인 | 🔴 큰 갭 |
| **데이터 참조 (Read)** | EntityCustomApp JWT 모드 있음 | Open API 엔드포인트 필요 | 🟡 중간 |
| **데이터 기록 (Write)** | Slack만 양방향, 나머지 단방향 | 모든 도메인 양방향 API | 🔴 큰 갭 |
| **법인 격리** | ent_id 기반 완벽 격리 시스템 | 앱 토큰에 ent_id scope 포함 | 🟢 작음 (패턴 재사용) |

### 3.2 핵심 미구현 영역

1. **AMA → Apps SSO 브릿지**
   - Portal JWT(`type: 'portal'`)와 AMA JWT는 완전 분리
   - `amb_portal_user_mappings` 미구현
   - AMA 사용자가 Apps에 별도 가입 없이 접근하는 경로 없음

2. **Open API Gateway**
   - 현재 AMA API는 내부 프론트엔드 전용 설계
   - 외부 앱이 호출할 수 있는 공개 API 엔드포인트 없음
   - API Rate Limiting, Throttling 없음
   - API 문서화 (public Swagger) 없음

3. **앱 → AMA 데이터 쓰기**
   - 기존 Slack 양방향만 구현, 기타 도메인은 읽기 위주
   - 외부 앱이 AMA에 자산/이슈 등을 생성하는 API 미존재

---

## 4. 제안 통합 아키텍처

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    사용자 (AMA 법인 직원)                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  AMA Web     │ │  Apps Portal │ │  Partner App      │
│  (ama.*)     │ │  (apps.*)    │ │  (*.partner.com)  │
│              │ │  마켓플레이스  │ │  app-car-manager  │
└──────┬───────┘ └──────┬───────┘ └────────┬──────────┘
       │                │                   │
       │           SSO Token Exchange       │ Scoped API Token
       │                │                   │
       ▼                ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                    AMA API Gateway                        │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────┐  │
│  │ Auth API   │  │ Apps API   │  │ Open API (v1)     │  │
│  │ (내부용)    │  │ (SSO/구독) │  │ (파트너 앱용)      │  │
│  └────────────┘  └────────────┘  └───────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Data Layer (ent_id 기반 격리)                      │  │
│  │  Users | Assets | Issues | Projects | HR | Talk    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4.2 SSO 방식 비교

| 방식 | 장점 | 단점 | 적합도 |
|------|------|------|--------|
| **A. OAuth 2.0 Authorization Code** | 업계 표준, 세밀한 scope 제어 | 구현 복잡도 높음, Authorization Server 필요 | ⭐⭐⭐⭐⭐ |
| **B. JWT Token Exchange** | AMA 기존 JWT 활용, 구현 간단 | 보안 범위 제한, 표준화 부족 | ⭐⭐⭐ |
| **C. API Key + JWT Proxy** | EntityCustomApp 패턴 재사용 | 사용자별 인증 불가 | ⭐⭐ |
| **D. SAML 2.0** | 엔터프라이즈 표준 | 과도한 복잡도, XML 기반 | ⭐ |

### 4.3 권장안: OAuth 2.0 Authorization Code + PKCE

#### 이유
1. **업계 표준**: 파트너사가 이해하기 쉬운 표준 프로토콜
2. **Scope 기반 접근 제어**: `assets:read`, `assets:write`, `issues:read` 등
3. **토큰 분리**: AMA 내부 JWT와 Apps용 Access Token 분리
4. **확장성**: 향후 파트너 앱 증가 시 일관된 인증 체계 유지
5. **기존 패턴 활용**: EntityCustomApp의 JWT 모드를 확장하는 형태

#### SSO 플로우
```
1. AMA 사용자가 Apps Portal에서 앱 클릭
   AMA Web → apps.amoeba.site/launch/{appCode}

2. Apps Portal → AMA Authorization Endpoint로 리다이렉트
   GET /api/v1/oauth/authorize
     ?client_id={app_client_id}
     &redirect_uri={app_callback_url}
     &response_type=code
     &scope=assets:read+issues:read
     &state={random}
     &code_challenge={PKCE}

3. AMA에서 이미 로그인된 상태면 동의 화면 → 승인
   (세션 없으면 AMA 로그인 페이지 → 로그인 → 동의)

4. Authorization Code 발급 → redirect_uri 콜백
   GET {redirect_uri}?code={auth_code}&state={state}

5. Partner App → AMA Token Endpoint로 코드 교환
   POST /api/v1/oauth/token
   {
     grant_type: "authorization_code",
     code: "{auth_code}",
     client_id: "{app_client_id}",
     client_secret: "{app_secret}",
     code_verifier: "{PKCE_verifier}"
   }

6. AMA 발급 → Scoped Access Token
   {
     access_token: "eyJ...",
     token_type: "Bearer",
     expires_in: 3600,
     refresh_token: "eyJ...",
     scope: "assets:read issues:read"
   }

7. Partner App → AMA Open API 호출
   GET /api/v1/open/assets?category=VEHICLE
   Authorization: Bearer {access_token}
```

### 4.4 신규 테이블 설계안

#### `amb_oauth_clients` (OAuth 클라이언트 = 파트너 앱 등록)
```sql
CREATE TABLE amb_oauth_clients (
  oac_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oac_client_id   VARCHAR(100) NOT NULL UNIQUE,  -- public client_id
  oac_client_secret_hash VARCHAR(255) NOT NULL,   -- bcrypt hashed
  oac_name        VARCHAR(200) NOT NULL,
  oac_description TEXT,
  oac_redirect_uris TEXT[] NOT NULL,              -- 허용 콜백 URL 목록
  oac_scopes      TEXT[] NOT NULL DEFAULT '{}',   -- 허용 scope 목록
  oac_app_url     VARCHAR(500),                   -- 앱 메인 URL
  oac_icon_url    VARCHAR(500),
  oac_partner_id  UUID REFERENCES amb_partners(ptn_id), -- 파트너사
  oac_is_active   BOOLEAN DEFAULT true,
  oac_created_at  TIMESTAMPTZ DEFAULT NOW(),
  oac_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  oac_deleted_at  TIMESTAMPTZ
);
```

#### `amb_oauth_authorization_codes` (인가 코드 - 단기 수명)
```sql
CREATE TABLE amb_oauth_authorization_codes (
  oaa_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oaa_code          VARCHAR(255) NOT NULL UNIQUE,
  oac_id            UUID NOT NULL REFERENCES amb_oauth_clients(oac_id),
  usr_id            UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  oaa_scopes        TEXT[] NOT NULL,
  oaa_redirect_uri  VARCHAR(500) NOT NULL,
  oaa_code_challenge VARCHAR(255),         -- PKCE
  oaa_code_challenge_method VARCHAR(10),   -- 'S256'
  oaa_expires_at    TIMESTAMPTZ NOT NULL,  -- 보통 10분
  oaa_used_at       TIMESTAMPTZ,           -- 사용 후 즉시 마킹
  oaa_created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `amb_oauth_tokens` (발급된 토큰 추적)
```sql
CREATE TABLE amb_oauth_tokens (
  oat_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oac_id            UUID NOT NULL REFERENCES amb_oauth_clients(oac_id),
  usr_id            UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  oat_access_token_hash  VARCHAR(255) NOT NULL,   -- SHA256 해시
  oat_refresh_token_hash VARCHAR(255),
  oat_scopes        TEXT[] NOT NULL,
  oat_expires_at    TIMESTAMPTZ NOT NULL,
  oat_refresh_expires_at TIMESTAMPTZ,
  oat_revoked_at    TIMESTAMPTZ,
  oat_created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_oauth_tokens_access ON amb_oauth_tokens(oat_access_token_hash);
CREATE INDEX idx_oauth_tokens_refresh ON amb_oauth_tokens(oat_refresh_token_hash);
```

#### `amb_app_subscriptions` (법인별 앱 구독)
```sql
CREATE TABLE amb_app_subscriptions (
  aps_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id          UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  oac_id          UUID NOT NULL REFERENCES amb_oauth_clients(oac_id),
  aps_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED
  aps_approved_by UUID REFERENCES amb_users(usr_id),
  aps_approved_at TIMESTAMPTZ,
  aps_scopes      TEXT[] NOT NULL DEFAULT '{}',  -- 승인된 scope
  aps_max_users   INT,                           -- 사용자 수 제한
  spl_id          UUID REFERENCES amb_svc_plans(spl_id), -- 요금제
  aps_starts_at   TIMESTAMPTZ,
  aps_expires_at  TIMESTAMPTZ,
  aps_created_at  TIMESTAMPTZ DEFAULT NOW(),
  aps_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  aps_deleted_at  TIMESTAMPTZ,
  UNIQUE (ent_id, oac_id)  -- 법인당 앱 1개 구독
);
```

#### `amb_app_user_grants` (개인별 앱 접근 권한)
```sql
CREATE TABLE amb_app_user_grants (
  aug_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aps_id    UUID NOT NULL REFERENCES amb_app_subscriptions(aps_id),
  usr_id    UUID NOT NULL REFERENCES amb_users(usr_id),
  aug_scopes TEXT[],  -- 개인별 scope 제한 (NULL = 구독 scope 전체)
  aug_is_active BOOLEAN DEFAULT true,
  aug_created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aps_id, usr_id)
);
```

### 4.5 Scope 체계

```
# 읽기 범위
assets:read          # 자산 조회
assets:write         # 자산 생성/수정
issues:read          # 이슈 조회
issues:write         # 이슈 생성/수정
projects:read        # 프로젝트 조회
users:read           # 사용자 기본정보 조회
units:read           # 부서/조직 조회
entity:read          # 법인 기본정보 조회
talk:read            # 채팅 채널/메시지 조회
talk:write           # 채팅 메시지 전송

# 복합 범위
profile              # 현재 사용자 프로필 (sub, email, name, entityId)
offline_access       # Refresh Token 발급 허용
```

### 4.6 Open API 엔드포인트 설계안

```
# Base Path: /api/v1/open

# 인증
GET  /oauth/authorize          # Authorization Code 요청
POST /oauth/token              # Token 발급/갱신
POST /oauth/revoke             # Token 폐기
GET  /oauth/userinfo           # 현재 사용자 정보

# 자산 (assets:read/write)
GET  /open/assets              # 자산 목록 (category, status 필터)
GET  /open/assets/:id          # 자산 상세
POST /open/assets              # 자산 생성 (assets:write)
PUT  /open/assets/:id          # 자산 수정 (assets:write)

# 이슈 (issues:read/write)
GET  /open/issues              # 이슈 목록
GET  /open/issues/:id          # 이슈 상세
POST /open/issues              # 이슈 생성 (issues:write)
PUT  /open/issues/:id          # 이슈 수정 (issues:write)

# 프로젝트 (projects:read)
GET  /open/projects            # 프로젝트 목록
GET  /open/projects/:id        # 프로젝트 상세

# 사용자 (users:read)
GET  /open/users               # 사용자 목록 (이름, 이메일, 부서)
GET  /open/users/:id           # 사용자 상세

# 조직 (units:read)
GET  /open/units               # 부서 트리

# Webhook 등록 (구독 앱용)
POST /open/webhooks            # 이벤트 구독
GET  /open/webhooks            # 등록된 webhook 목록
DELETE /open/webhooks/:id      # 구독 해제
```

### 4.7 보안 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                    Security Layers                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. OAuth Token 검증                                 │
│     - Bearer Token → SHA256 해시 → DB 조회           │
│     - 만료/폐기 확인                                  │
│     - scope 확인                                     │
│                                                      │
│  2. 법인 격리 (ent_id)                               │
│     - 토큰에 ent_id 포함                             │
│     - 모든 Open API 쿼리에 ent_id WHERE 조건         │
│     - 타 법인 데이터 접근 원천 차단                    │
│                                                      │
│  3. Scope 기반 접근 제어                              │
│     - 토큰 scope vs 엔드포인트 required scope        │
│     - @RequireScope('assets:read') 데코레이터         │
│                                                      │
│  4. Rate Limiting                                    │
│     - 앱별 분당/시간당 호출 제한                       │
│     - 429 Too Many Requests 응답                     │
│                                                      │
│  5. Audit Logging                                    │
│     - 모든 Open API 호출 기록                         │
│     - client_id, user_id, endpoint, timestamp        │
│                                                      │
│  6. CORS                                             │
│     - OAuth client redirect_uri 화이트리스트          │
│     - Origin 헤더 검증                                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 5. 구현 단계 제안

### Phase 1: OAuth 2.0 서버 + SSO (핵심)
| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| 1-1 | `amb_oauth_clients` 테이블 + CRUD | Entity + Service + Controller |
| 1-2 | Authorization Code 발급 (`/oauth/authorize`) | OAuth Controller + UI (동의 화면) |
| 1-3 | Token Exchange (`/oauth/token`) | Token Service (발급/갱신/폐기) |
| 1-4 | OAuth Token Guard (`OAuthTokenGuard`) | 기존 JwtAuthGuard 병행 |
| 1-5 | PKCE 지원 | code_challenge 검증 로직 |

### Phase 2: 앱 구독/승인 워크플로우
| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| 2-1 | `amb_app_subscriptions` 테이블 + CRUD | Entity + Service |
| 2-2 | 법인 관리자 승인 UI (AMA Web) | 프론트엔드 페이지 |
| 2-3 | 앱 마켓플레이스 UI (Apps Portal) | 카탈로그 확장 |
| 2-4 | 구독 상태 연동 (Stripe + 내부 승인) | 이중 승인 로직 |
| 2-5 | `amb_app_user_grants` 사용자별 접근 | 관리자 설정 UI |

### Phase 3: Open API 엔드포인트
| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| 3-1 | Open API 모듈 구조 (`open/` 프리픽스) | NestJS Module |
| 3-2 | Scope Guard (`@RequireScope`) | 데코레이터 + Guard |
| 3-3 | Asset Open API (Read/Write) | Controller + Service |
| 3-4 | Issue/Project/User Open API | 도메인별 Controller |
| 3-5 | Rate Limiting (Throttle) | NestJS Throttler |
| 3-6 | API 문서 (Public Swagger) | Swagger 별도 경로 |

### Phase 4: 양방향 데이터 연동
| 단계 | 작업 | 예상 범위 |
|------|------|----------|
| 4-1 | Webhook 시스템 (이벤트 구독) | 외부 앱에 이벤트 전달 |
| 4-2 | 변경 감지 → 이벤트 발행 | EventEmitter2 활용 |
| 4-3 | Webhook 호출 + 재시도 | Queue + 비동기 처리 |
| 4-4 | 앱 → AMA 데이터 쓰기 검증 | Validation + Audit |

---

## 6. 기존 시스템 활용 가능 항목

| 기존 시스템 | 활용 방법 |
|------------|---------|
| **EntityCustomApp** | OAuth Client 등록의 기초 모델로 확장 |
| **CryptoService (AES-256-GCM)** | client_secret 암호화, API 키 관리 |
| **ApiKeyService** | partner 앱별 API 키 관리 재사용 |
| **OwnEntityGuard** | Open API에서 ent_id 격리 로직 재사용 |
| **resolveEntityId()** | OAuth 토큰 내 ent_id로 동일 패턴 적용 |
| **DataScopeInterceptor** | scope 기반 데이터 범위 자동 설정 |
| **ExternalTaskMapping** | 양방향 ID 매핑 패턴 재사용 |
| **Slack 통합 패턴** | Webhook Outbound 처리 패턴 재사용 |
| **Portal 구독 시스템** | 과금/결제 인프라 그대로 활용 |

---

## 7. 리스크 및 고려사항

### 보안 리스크
| 리스크 | 대응 |
|--------|------|
| OAuth Token 탈취 | PKCE 필수, short-lived access token (1h), Refresh Token Rotation |
| Scope 에스컬레이션 | 구독 승인 시 scope 제한, 토큰 재발급 시 scope 축소만 가능 |
| 타 법인 데이터 접근 | 모든 Open API에 ent_id 필터 강제 (OwnEntityGuard 재사용) |
| DDoS / 남용 | Rate Limiting, 비정상 트래픽 모니터링, 앱 정지 기능 |
| API 키 유출 | client_secret → AES-256-GCM 암호화, 정기 로테이션 정책 |

### 기술 고려사항
| 항목 | 설명 |
|------|------|
| **인프라** | apps.amoeba.site 전용 nginx vhost + Docker 컨테이너 필요 |
| **DB 마이그레이션** | Staging/Production synchronize=false → 수동 SQL 필요 |
| **AMA API 확장** | 기존 api 앱에 `/oauth/*`, `/open/*` 라우트 추가 (별도 앱 불필요) |
| **CORS** | OAuth redirect_uri 기반 동적 CORS 설정 필요 |
| **성능** | Open API 호출량 증가 시 캐싱 전략 (Redis) 검토 |
| **파트너 온보딩** | 앱 등록 프로세스, SDK, 개발자 문서 필요 |

---

## 8. 결론

### 현행 시스템 평가
- **인증/인가**: JWT + 멀티테넌시 격리가 견고하게 구현됨
- **외부 통합**: EntityCustomApp + ExternalTaskMapping으로 기본 패턴 존재
- **포탈 구독**: Stripe 기반 과금 시스템 이미 운영 중
- **핵심 갭**: OAuth 2.0 서버, Open API Gateway, AMA↔Apps SSO 브릿지 미구현

### 권장 접근법
1. **OAuth 2.0 Authorization Code + PKCE**를 AMA API에 구현
2. 기존 EntityCustomApp을 OAuth Client로 확장/마이그레이션
3. `/api/v1/open/*` 경로로 Open API Gateway 구현
4. Portal 구독 시스템과 연계하여 앱 마켓플레이스 확장
5. Phase별 점진적 구현 (SSO → 구독 승인 → Open API → Webhook)

### 예상 구현 규모
- **Phase 1 (OAuth + SSO)**: NestJS 모듈 3~4개, 테이블 3개, 프론트 1~2페이지
- **Phase 2 (구독/승인)**: 테이블 2개, 관리자 UI 2~3페이지
- **Phase 3 (Open API)**: 도메인별 Controller 5~6개, Guard/Decorator 2~3개
- **Phase 4 (Webhook)**: 테이블 1~2개, 비동기 처리 서비스
