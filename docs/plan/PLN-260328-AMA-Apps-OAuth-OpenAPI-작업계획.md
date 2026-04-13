# 작업 계획서: AMA × Apps OAuth 2.0 + Open API 구현

> **문서번호**: PLAN-AMA-Apps-OAuth-OpenAPI-작업계획-20260328  
> **작성일**: 2026-03-28  
> **관련 분석서**: [REQ-AMA-Apps-OAuth-OpenAPI-20260328.md](../analysis/REQ-AMA-Apps-OAuth-OpenAPI-20260328.md)  
> **관련 조사**: [REQ-AMA-Apps-통합아키텍처-20260328.md](../analysis/REQ-AMA-Apps-통합아키텍처-20260328.md)

---

## 1. 시스템 개발 현황 기반 분석

### 1.1 활용 가능한 기존 시스템

| 기존 시스템 | 활용 방법 | 수정 필요 |
|------------|---------|---------|
| **PartnerApp 엔티티** | OAuth Client로 확장 (컬럼 추가) | 4개 컬럼 추가 |
| **PartnerAppInstall 엔티티** | 법인별 Scope 승인 저장 | 1개 컬럼 추가 |
| **JwtService (@nestjs/jwt)** | OAuth Token 서명에 재사용 | 설정 추가 |
| **CryptoService (AES-256-GCM)** | client_secret 암호화 | 그대로 사용 |
| **OwnEntityGuard** | Open API 데이터 격리 패턴 참고 | 새 Guard 작성 |
| **resolveEntityId()** | OAuth 토큰에서 ent_id 추출 패턴 | 참고 |
| **@nestjs/throttler** | Open API Rate Limiting | 데코레이터 적용 |
| **AssetService.findAll/findById** | Open API Asset 엔드포인트에서 호출 | 그대로 사용 |
| **IssueService.getIssues** | Open API Issue 엔드포인트에서 호출 | 그대로 사용 |
| **ProjectService** | Open API Project 엔드포인트에서 호출 | 그대로 사용 |
| **UnitService** | Open API Unit 엔드포인트에서 호출 | 그대로 사용 |
| **EntityService** | Open API Entity 엔드포인트에서 호출 | 그대로 사용 |

### 1.2 신규 구현 필요 영역

| 영역 | 신규 파일 수 | 설명 |
|------|------------|------|
| OAuth 모듈 | ~12개 | Entity 3, Controller 1, Service 2, Guard 2, Decorator 2, DTO 2 |
| Open API 모듈 | ~10개 | Controller 5~6, DTO 5~6 (Service는 기존 재사용) |
| DB 마이그레이션 | 1개 | ALTER + CREATE TABLE SQL |
| 프론트엔드 | ~5개 | OAuth 동의 화면, 앱 설치 Scope 관리 UI |

---

## 2. Phase별 구현 계획

### Phase 1: OAuth 2.0 서버 핵심 (백엔드)
> **목표**: Authorization Code + PKCE 기반 토큰 발급/갱신/폐기  
> **산출물**: OAuthModule (Entity + Controller + Service + Guard + Decorator)

### Phase 2: Open API Gateway (백엔드)
> **목표**: 파트너 앱이 호출하는 공개 API 엔드포인트 구현  
> **산출물**: OpenApiModule (Controller + DTO, 기존 Service 재사용)

### Phase 3: 프론트엔드 + 앱 설치 Scope 관리
> **목표**: OAuth 동의 화면, 앱 Scope 설치 UI  
> **산출물**: AMA Web 페이지 추가

---

## 3. Phase 1: OAuth 2.0 서버 핵심

### 3.1 DB 마이그레이션

#### 3.1.1 `amb_partner_apps` 컬럼 추가

```sql
-- OAuth Client 관련 필드 추가
ALTER TABLE amb_partner_apps
  ADD COLUMN pap_client_id VARCHAR(100) UNIQUE,
  ADD COLUMN pap_client_secret_hash VARCHAR(255),
  ADD COLUMN pap_redirect_uris TEXT[],
  ADD COLUMN pap_scopes TEXT[] DEFAULT '{}';

-- client_id 인덱스
CREATE UNIQUE INDEX idx_partner_apps_client_id 
  ON amb_partner_apps(pap_client_id) WHERE pap_client_id IS NOT NULL;
```

#### 3.1.2 `amb_partner_app_installs` 컬럼 추가

```sql
-- 법인별 승인된 scope
ALTER TABLE amb_partner_app_installs
  ADD COLUMN pai_approved_scopes TEXT[] DEFAULT '{}';
```

#### 3.1.3 `amb_oauth_authorization_codes` 신규 테이블

```sql
CREATE TABLE amb_oauth_authorization_codes (
  oac_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oac_code                VARCHAR(255) NOT NULL UNIQUE,
  pap_id                  UUID NOT NULL REFERENCES amb_partner_apps(pap_id),
  usr_id                  UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id                  UUID NOT NULL,
  oac_scopes              TEXT[] NOT NULL DEFAULT '{}',
  oac_redirect_uri        VARCHAR(500) NOT NULL,
  oac_code_challenge      VARCHAR(128),
  oac_code_challenge_method VARCHAR(10) DEFAULT 'S256',
  oac_state               VARCHAR(255),
  oac_expires_at          TIMESTAMPTZ NOT NULL,
  oac_used_at             TIMESTAMPTZ,
  oac_created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_codes_code ON amb_oauth_authorization_codes(oac_code);
CREATE INDEX idx_oauth_codes_expires ON amb_oauth_authorization_codes(oac_expires_at);
```

#### 3.1.4 `amb_oauth_tokens` 신규 테이블

```sql
CREATE TABLE amb_oauth_tokens (
  oat_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pap_id                  UUID NOT NULL REFERENCES amb_partner_apps(pap_id),
  usr_id                  UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id                  UUID NOT NULL,
  oat_access_token_hash   VARCHAR(64) NOT NULL,
  oat_refresh_token_hash  VARCHAR(64),
  oat_scopes              TEXT[] NOT NULL DEFAULT '{}',
  oat_expires_at          TIMESTAMPTZ NOT NULL,
  oat_refresh_expires_at  TIMESTAMPTZ,
  oat_revoked_at          TIMESTAMPTZ,
  oat_created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oauth_tokens_access ON amb_oauth_tokens(oat_access_token_hash) 
  WHERE oat_revoked_at IS NULL;
CREATE INDEX idx_oauth_tokens_refresh ON amb_oauth_tokens(oat_refresh_token_hash) 
  WHERE oat_revoked_at IS NULL;
CREATE INDEX idx_oauth_tokens_user ON amb_oauth_tokens(usr_id, pap_id);
CREATE INDEX idx_oauth_tokens_expires ON amb_oauth_tokens(oat_expires_at);
```

#### 3.1.5 `amb_open_api_logs` 신규 테이블

```sql
CREATE TABLE amb_open_api_logs (
  oal_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pap_id          UUID NOT NULL,
  usr_id          UUID,
  ent_id          UUID NOT NULL,
  oal_method      VARCHAR(10) NOT NULL,
  oal_path        VARCHAR(500) NOT NULL,
  oal_status_code INT NOT NULL,
  oal_ip          VARCHAR(45),
  oal_user_agent  VARCHAR(500),
  oal_duration_ms INT,
  oal_created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_open_api_logs_app ON amb_open_api_logs(pap_id, oal_created_at);
CREATE INDEX idx_open_api_logs_entity ON amb_open_api_logs(ent_id, oal_created_at);
CREATE INDEX idx_open_api_logs_created ON amb_open_api_logs(oal_created_at);
```

### 3.2 백엔드 파일 목록

#### 3.2.1 Entity (신규 3개, 수정 2개)

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/api/src/domain/oauth/entity/oauth-authorization-code.entity.ts` | **신규** | 인가 코드 엔티티 |
| `apps/api/src/domain/oauth/entity/oauth-token.entity.ts` | **신규** | 발급 토큰 엔티티 |
| `apps/api/src/domain/oauth/entity/open-api-log.entity.ts` | **신규** | API 감사 로그 엔티티 |
| `apps/api/src/domain/partner-app/entity/partner-app.entity.ts` | **수정** | OAuth 컬럼 4개 추가 |
| `apps/api/src/domain/partner-app/entity/partner-app-install.entity.ts` | **수정** | approved_scopes 컬럼 추가 |

#### 3.2.2 DTO (신규 4개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/oauth/dto/authorize.request.ts` | Authorization Code 요청 DTO |
| `apps/api/src/domain/oauth/dto/token.request.ts` | Token 발급/갱신 요청 DTO |
| `apps/api/src/domain/oauth/dto/token.response.ts` | Token 응답 DTO |
| `apps/api/src/domain/oauth/dto/consent.request.ts` | 동의 화면 응답 DTO |

#### 3.2.3 Service (신규 2개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/oauth/service/oauth.service.ts` | OAuth 핵심 로직 (코드 발급, 토큰 교환, 갱신, 폐기) |
| `apps/api/src/domain/oauth/service/oauth-client.service.ts` | Client 관리 (client_id/secret 생성, 검증) |

#### 3.2.4 Controller (신규 1개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/oauth/controller/oauth.controller.ts` | OAuth 엔드포인트 (/oauth/*) |

#### 3.2.5 Guard + Decorator (신규 4개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/oauth/guard/oauth-token.guard.ts` | OAuth Access Token 검증 Guard |
| `apps/api/src/domain/oauth/guard/require-scope.guard.ts` | Scope 검증 Guard |
| `apps/api/src/domain/oauth/decorator/require-scope.decorator.ts` | `@RequireScope('assets:read')` |
| `apps/api/src/domain/oauth/decorator/oauth-context.decorator.ts` | `@OAuthContext()` 요청 컨텍스트 주입 |

#### 3.2.6 Interface (신규 2개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/oauth/interface/oauth-context.interface.ts` | OAuthTokenContext 타입 정의 |
| `apps/api/src/domain/oauth/interface/oauth-scope.enum.ts` | Scope enum 정의 |

#### 3.2.7 Module (신규 1개, 수정 2개)

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/api/src/domain/oauth/oauth.module.ts` | **신규** | OAuthModule 정의 |
| `apps/api/src/domain/partner-app/partner-app.module.ts` | **수정** | OAuthClientService export |
| `apps/api/src/app.module.ts` | **수정** | OAuthModule import 추가 |

### 3.3 구현 상세

#### 3.3.1 OAuth Controller 엔드포인트

```typescript
@Controller('oauth')
export class OAuthController {

  // 1. Authorization Code 요청
  @Get('authorize')
  @Auth()  // AMA 로그인 필수
  async authorize(
    @Query() query: AuthorizeRequestDto,
    @CurrentUser() user: UserPayload,
  ): Promise<AuthorizeResponse>
  // → client_id 검증 → redirect_uri 검증 → scope 검증
  // → 동의 화면 데이터 반환 (appName, requestedScopes, approvedScopes)
  // → 또는 이미 승인된 경우 즉시 code 발급

  // 2. 동의 승인 → Authorization Code 발급
  @Post('authorize/consent')
  @Auth()
  async consent(
    @Body() body: ConsentRequestDto,
    @CurrentUser() user: UserPayload,
  ): Promise<{ redirect_uri: string }>
  // → code 생성 (crypto random 32bytes hex)
  // → PKCE code_challenge 저장
  // → redirect_uri?code=xxx&state=yyy 반환

  // 3. Token 발급/갱신
  @Post('token')
  @Public()  // 외부 앱 서버에서 호출
  async token(@Body() body: TokenRequestDto): Promise<TokenResponse>
  // grant_type:
  //   authorization_code → code 교환 (+ PKCE 검증)
  //   refresh_token → 토큰 갱신 (Rotation)
  //   ama_session → AMA 세션 기반 즉시 발급 (iframe용)

  // 4. Token 폐기
  @Post('revoke')
  @Public()
  async revoke(@Body() body: { token: string; client_id: string; client_secret: string })
  // → access_token 또는 refresh_token 폐기

  // 5. 사용자 정보
  @Get('userinfo')
  @UseGuards(OAuthTokenGuard)
  @RequireScope('profile')
  async userInfo(@OAuthContext() ctx: OAuthTokenContext)
  // → { sub, email, name, entityId, entityName }
}
```

#### 3.3.2 OAuth Service 핵심 로직

```typescript
@Injectable()
export class OAuthService {

  // Authorization Code 생성
  async createAuthorizationCode(params: {
    clientId: string;
    userId: string;
    entityId: string;
    scopes: string[];
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    state?: string;
  }): Promise<string>
  // 1. 랜덤 코드 생성 (32 bytes → hex)
  // 2. DB 저장 (만료: 10분)
  // 3. code 반환

  // Token Exchange (Authorization Code → Access/Refresh Token)
  async exchangeCode(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<TokenResponse>
  // 1. code DB 조회 (미사용 + 미만료)
  // 2. client_id/secret 검증
  // 3. redirect_uri 일치 확인
  // 4. PKCE code_verifier 검증 (SHA256(verifier) === code_challenge)
  // 5. code used_at 마킹
  // 6. Access Token 발급 (JWT, 1h)
  // 7. Refresh Token 발급 (opaque, 30d)
  // 8. DB에 토큰 해시 저장

  // Token 갱신
  async refreshToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<TokenResponse>
  // 1. refresh_token 해시로 DB 조회
  // 2. 유효성 확인 (미폐기 + 미만료)
  // 3. 이전 토큰 폐기 (Rotation)
  // 4. 새 Access + Refresh Token 발급

  // Token 검증 (Guard에서 호출)
  async validateAccessToken(token: string): Promise<OAuthTokenContext>
  // 1. JWT 서명 검증
  // 2. 만료 확인
  // 3. DB에서 revoked_at 확인
  // 4. OAuthTokenContext 반환 {userId, entityId, clientId, scopes}
}
```

#### 3.3.3 OAuthTokenGuard

```typescript
@Injectable()
export class OAuthTokenGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Authorization: Bearer {token} 추출
    const token = extractBearerToken(request);
    if (!token) throw new UnauthorizedException('Missing access token');
    
    // 2. 토큰 검증
    const oauthContext = await this.oauthService.validateAccessToken(token);
    
    // 3. request에 OAuthContext 저장
    request.oauthContext = oauthContext;
    
    return true;
  }
}
```

#### 3.3.4 RequireScopeGuard

```typescript
@Injectable()
export class RequireScopeGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. @RequireScope() 메타데이터에서 필요 scope 추출
    const requiredScopes = this.reflector.get<string[]>('oauth_scopes', ...);
    if (!requiredScopes?.length) return true;
    
    // 2. OAuthContext에서 발급된 scope 확인
    const oauthContext = request.oauthContext;
    
    // 3. 필요 scope가 모두 포함되어 있는지 검증
    const hasScope = requiredScopes.every(s => oauthContext.scopes.includes(s));
    if (!hasScope) throw new ForbiddenException('Insufficient scope');
    
    return true;
  }
}
```

#### 3.3.5 OAuth Access Token (JWT 구조)

```typescript
// OAuth Access Token Payload
{
  sub: string;        // 사용자 ID
  ent_id: string;     // 법인 ID (데이터 격리)
  client_id: string;  // Partner App client_id
  scope: string;      // 공백 구분 scope 목록 ("assets:read issues:read")
  type: 'oauth';      // AMA JWT와 구분
  iat: number;
  exp: number;        // 1시간
}
```

### 3.4 Partner App Client 관리

#### 3.4.1 Admin이 앱 승인 시 Client Credentials 자동 생성

```typescript
// AdminPartnerAppService.approve() 확장
async approve(appId: string, adminUserId: string) {
  // 기존: 상태 → APPROVED
  // 추가: client_id + client_secret 생성
  const clientId = `pap_${generateSecureId(24)}`;       // 예: pap_a1b2c3d4e5f6...
  const clientSecret = generateSecureId(48);             // 랜덤 48자
  const clientSecretHash = await bcrypt.hash(clientSecret, 10);
  
  app.papClientId = clientId;
  app.papClientSecretHash = clientSecretHash;
  
  // client_secret는 이 응답에서만 1회 노출 (이후 조회 불가)
  return { ...appResponse, clientId, clientSecret };
}
```

#### 3.4.2 Client Secret 재발급

```typescript
// POST /admin/partner-apps/:id/regenerate-secret
// AdminGuard
async regenerateSecret(appId: string, adminUserId: string) {
  // 1. 새 secret 생성
  // 2. 기존 모든 OAuth 토큰 폐기
  // 3. 새 해시 저장
  return { clientId, clientSecret };  // 1회만 노출
}
```

---

## 4. Phase 2: Open API Gateway

### 4.1 백엔드 파일 목록

#### 4.1.1 Controller (신규 6개)

| 파일 | Scope | 설명 |
|------|-------|------|
| `apps/api/src/domain/open-api/controller/open-asset.controller.ts` | assets:read/write | 자산 CRUD |
| `apps/api/src/domain/open-api/controller/open-issue.controller.ts` | issues:read/write | 이슈 CRUD |
| `apps/api/src/domain/open-api/controller/open-project.controller.ts` | projects:read | 프로젝트 조회 |
| `apps/api/src/domain/open-api/controller/open-user.controller.ts` | users:read | 사용자 조회 |
| `apps/api/src/domain/open-api/controller/open-unit.controller.ts` | units:read | 부서 트리 조회 |
| `apps/api/src/domain/open-api/controller/open-entity.controller.ts` | entity:read | 법인 정보 조회 |

#### 4.1.2 DTO (신규 ~6개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/open-api/dto/open-asset.dto.ts` | 자산 요청/응답 DTO |
| `apps/api/src/domain/open-api/dto/open-issue.dto.ts` | 이슈 요청/응답 DTO |
| `apps/api/src/domain/open-api/dto/open-project.dto.ts` | 프로젝트 응답 DTO |
| `apps/api/src/domain/open-api/dto/open-user.dto.ts` | 사용자 응답 DTO |
| `apps/api/src/domain/open-api/dto/open-unit.dto.ts` | 부서 응답 DTO |
| `apps/api/src/domain/open-api/dto/open-common.dto.ts` | 공통 페이징/필터 DTO |

#### 4.1.3 Interceptor (신규 1개)

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/open-api/interceptor/open-api-log.interceptor.ts` | 감사 로그 자동 기록 |

#### 4.1.4 Module (신규 1개, 수정 1개)

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/api/src/domain/open-api/open-api.module.ts` | **신규** | OpenApiModule (OAuthModule + 도메인 Service import) |
| `apps/api/src/app.module.ts` | **수정** | OpenApiModule import 추가 |

### 4.2 구현 상세

#### 4.2.1 Open API 공통 패턴

모든 Open API Controller는 동일한 패턴을 따른다:

```typescript
@Controller('open/assets')
@UseGuards(OAuthTokenGuard, RequireScopeGuard)
@UseInterceptors(OpenApiLogInterceptor)
@ApiTags('Open API - Assets')
export class OpenAssetController {
  constructor(
    private readonly assetService: AssetService,  // 기존 서비스 재사용
  ) {}

  @Get()
  @RequireScope('assets:read')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async list(
    @OAuthContext() ctx: OAuthTokenContext,
    @Query() query: OpenAssetListDto,
  ) {
    // ctx.entityId로 자동 격리
    return this.assetService.findAll(
      ctx.entityId,
      ctx.userId,
      'MEMBER',  // Open API는 MEMBER 역할 기준
      { category: query.category, status: query.status, q: query.q },
    );
  }

  @Get(':id')
  @RequireScope('assets:read')
  async detail(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.assetService.findById(id, ctx.entityId, ctx.userId, 'MEMBER');
  }

  @Post()
  @RequireScope('assets:write')
  async create(
    @OAuthContext() ctx: OAuthTokenContext,
    @Body() body: CreateOpenAssetDto,
  ) {
    return this.assetService.create(ctx.entityId, ctx.userId, body);
  }

  @Patch(':id')
  @RequireScope('assets:write')
  async update(
    @OAuthContext() ctx: OAuthTokenContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOpenAssetDto,
  ) {
    return this.assetService.update(id, ctx.entityId, ctx.userId, body);
  }
}
```

#### 4.2.2 Open API 응답 형식

```typescript
// 성공 응답 (AMA 표준과 동일)
{
  "success": true,
  "data": { ... } | [ ... ],
  "timestamp": "2026-03-28T10:30:00.000Z"
}

// 에러 응답
{
  "success": false,
  "error": {
    "code": "E5001",         // Open API 전용 코드 (E5xxx)
    "message": "Insufficient scope: assets:write required"
  },
  "timestamp": "2026-03-28T10:30:00.000Z"
}

// 페이징 응답
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2026-03-28T10:30:00.000Z"
}
```

#### 4.2.3 감사 로그 Interceptor

```typescript
@Injectable()
export class OpenApiLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();
    
    return next.handle().pipe(
      tap({
        next: () => this.logAsync(request, 200, Date.now() - start),
        error: (err) => this.logAsync(request, err.status || 500, Date.now() - start),
      }),
    );
  }

  private async logAsync(request, statusCode, duration) {
    // 비동기 저장 (응답 지연 없음)
    const ctx = request.oauthContext;
    await this.openApiLogRepo.save({
      papId: ctx.clientAppId,
      usrId: ctx.userId,
      entId: ctx.entityId,
      oalMethod: request.method,
      oalPath: request.path,
      oalStatusCode: statusCode,
      oalIp: request.ip,
      oalUserAgent: request.headers['user-agent']?.substring(0, 500),
      oalDurationMs: duration,
    });
  }
}
```

#### 4.2.4 Open API 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| E5001 | 401 | Invalid or expired access token |
| E5002 | 401 | Revoked access token |
| E5003 | 403 | Insufficient scope |
| E5004 | 403 | App not installed for this entity |
| E5005 | 404 | Resource not found |
| E5006 | 429 | Rate limit exceeded |
| E5007 | 400 | Invalid request parameters |

---

## 5. Phase 3: 프론트엔드

### 5.1 파일 목록

#### 5.1.1 OAuth 동의 화면 (AMA Web)

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/web/src/pages/oauth/OAuthConsentPage.tsx` | **신규** | OAuth 동의 화면 |
| `apps/web/src/pages/oauth/OAuthCallbackPage.tsx` | **신규** | 콜백 처리 (ama_session grant 시) |

#### 5.1.2 앱 설치/Scope 관리 (AMA Web - 설정)

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/web/src/pages/settings/AppsMarketplacePage.tsx` | **신규** | 앱 마켓플레이스 (PUBLISHED 앱 목록) |
| `apps/web/src/pages/settings/AppInstallDialog.tsx` | **신규** | 앱 설치 + Scope 승인 다이얼로그 |
| `apps/web/src/pages/settings/InstalledAppsPage.tsx` | **신규** | 설치된 앱 관리 (비활성화, scope 수정) |

#### 5.1.3 i18n (3개 언어)

| 파일 | 유형 | 네임스페이스 |
|------|------|------------|
| `apps/web/public/locales/en/oauth.json` | **신규** | oauth |
| `apps/web/public/locales/ko/oauth.json` | **신규** | oauth |
| `apps/web/public/locales/vi/oauth.json` | **신규** | oauth |
| `apps/web/src/i18n.ts` | **수정** | oauth 네임스페이스 등록 |

#### 5.1.4 라우터

| 파일 | 유형 | 설명 |
|------|------|------|
| `apps/web/src/router.tsx` | **수정** | /oauth/consent, /settings/apps 라우트 추가 |

### 5.2 OAuth 동의 화면 설계

```
┌──────────────────────────────────────────┐
│          AMA ← App Authorization         │
│                                          │
│  [앱 아이콘] App Car Manager             │
│  by Partner ABC Corp.                    │
│                                          │
│  이 앱이 다음 권한을 요청합니다:          │
│                                          │
│  ☑ 자산 정보 읽기 (assets:read)          │
│  ☑ 자산 정보 수정 (assets:write)         │
│  ☑ 이슈 생성 (issues:write)             │
│  ☐ 사용자 목록 조회 (users:read)         │
│                                          │
│  ⚠ 이 앱은 {법인명} 데이터에만            │
│    접근할 수 있습니다.                    │
│                                          │
│  [거부]                    [허용]         │
│                                          │
│  {법인명} · {사용자명}                    │
└──────────────────────────────────────────┘
```

---

## 6. 변경 대상 파일 전체 목록

### 6.1 신규 파일 (28개)

| # | 파일 경로 | Phase |
|---|----------|-------|
| 1 | `apps/api/src/domain/oauth/entity/oauth-authorization-code.entity.ts` | 1 |
| 2 | `apps/api/src/domain/oauth/entity/oauth-token.entity.ts` | 1 |
| 3 | `apps/api/src/domain/oauth/entity/open-api-log.entity.ts` | 1 |
| 4 | `apps/api/src/domain/oauth/interface/oauth-context.interface.ts` | 1 |
| 5 | `apps/api/src/domain/oauth/interface/oauth-scope.enum.ts` | 1 |
| 6 | `apps/api/src/domain/oauth/dto/authorize.request.ts` | 1 |
| 7 | `apps/api/src/domain/oauth/dto/token.request.ts` | 1 |
| 8 | `apps/api/src/domain/oauth/dto/token.response.ts` | 1 |
| 9 | `apps/api/src/domain/oauth/dto/consent.request.ts` | 1 |
| 10 | `apps/api/src/domain/oauth/service/oauth.service.ts` | 1 |
| 11 | `apps/api/src/domain/oauth/service/oauth-client.service.ts` | 1 |
| 12 | `apps/api/src/domain/oauth/controller/oauth.controller.ts` | 1 |
| 13 | `apps/api/src/domain/oauth/guard/oauth-token.guard.ts` | 1 |
| 14 | `apps/api/src/domain/oauth/guard/require-scope.guard.ts` | 1 |
| 15 | `apps/api/src/domain/oauth/decorator/require-scope.decorator.ts` | 1 |
| 16 | `apps/api/src/domain/oauth/decorator/oauth-context.decorator.ts` | 1 |
| 17 | `apps/api/src/domain/oauth/oauth.module.ts` | 1 |
| 18 | `apps/api/src/domain/open-api/controller/open-asset.controller.ts` | 2 |
| 19 | `apps/api/src/domain/open-api/controller/open-issue.controller.ts` | 2 |
| 20 | `apps/api/src/domain/open-api/controller/open-project.controller.ts` | 2 |
| 21 | `apps/api/src/domain/open-api/controller/open-user.controller.ts` | 2 |
| 22 | `apps/api/src/domain/open-api/controller/open-unit.controller.ts` | 2 |
| 23 | `apps/api/src/domain/open-api/controller/open-entity.controller.ts` | 2 |
| 24 | `apps/api/src/domain/open-api/dto/open-api.dto.ts` | 2 |
| 25 | `apps/api/src/domain/open-api/interceptor/open-api-log.interceptor.ts` | 2 |
| 26 | `apps/api/src/domain/open-api/open-api.module.ts` | 2 |
| 27 | `apps/web/src/pages/oauth/OAuthConsentPage.tsx` | 3 |
| 28 | `apps/web/src/pages/settings/AppsMarketplacePage.tsx` | 3 |

### 6.2 수정 파일 (8개)

| # | 파일 경로 | Phase | 변경 내용 |
|---|----------|-------|----------|
| 1 | `apps/api/src/domain/partner-app/entity/partner-app.entity.ts` | 1 | OAuth 4컬럼 추가 |
| 2 | `apps/api/src/domain/partner-app/entity/partner-app-install.entity.ts` | 1 | approved_scopes 추가 |
| 3 | `apps/api/src/domain/partner-app/service/admin-partner-app.service.ts` | 1 | approve() 시 client_id 생성 |
| 4 | `apps/api/src/domain/partner-app/partner-app.module.ts` | 1 | OAuthModule 의존성 |
| 5 | `apps/api/src/app.module.ts` | 1+2 | 모듈 import 추가 |
| 6 | `apps/web/src/router.tsx` | 3 | 라우트 추가 |
| 7 | `apps/web/src/i18n.ts` | 3 | oauth 네임스페이스 등록 |
| 8 | `apps/web/public/locales/*/common.json` | 3 | 앱 관련 공통 번역 |

### 6.3 DB 마이그레이션 (1개)

| 파일 | 내용 |
|------|------|
| `sql/migration_oauth_open_api.sql` | ALTER TABLE 2개 + CREATE TABLE 3개 + INDEX |

---

## 7. 사이드 임팩트 분석

### 7.1 기존 기능 영향도

| 기존 기능 | 영향 | 대응 |
|----------|------|------|
| **Partner App CRUD** | 🟢 없음 | 추가 컬럼은 nullable, 기존 DTO 변경 없음 |
| **Partner App 심사** | 🟡 낮음 | approve() 메서드에 client_id 생성 추가 |
| **EntityCustomApp** | 🟢 없음 | 기존 JWT 발급 로직 그대로 유지 |
| **AMA 인증 (JWT)** | 🟢 없음 | OAuth Guard는 별도 경로, 기존 Guard 병행 |
| **Asset/Issue/Project 서비스** | 🟢 없음 | 기존 서비스 메서드를 읽기 전용으로 호출 |
| **OwnEntityGuard** | 🟢 없음 | Open API는 OAuthTokenGuard로 별도 격리 |
| **Rate Limiting** | 🟢 없음 | Open API 엔드포인트에 별도 throttle 적용 |

### 7.2 보안 영향

| 리스크 | 대응 |
|--------|------|
| OAuth Token 탈취 | PKCE 필수, Access Token 1h, Refresh Token Rotation |
| Scope 에스컬레이션 | 토큰 발급 시 install 승인 scope와 교차 검증 |
| CSRF | state 파라미터 + redirect_uri 정확 매칭 |
| 타 법인 데이터 접근 | 토큰 내 ent_id 기반 강제 격리 |
| 과도한 API 호출 | per-client throttle + 감사 로그로 모니터링 |

### 7.3 DB 마이그레이션 주의

- **Staging/Production**: `synchronize: false` → 수동 SQL 필수
- ALTER TABLE은 nullable 컬럼 추가이므로 기존 데이터 영향 없음
- CREATE TABLE은 신규 테이블이므로 충돌 없음
- 인덱스 생성은 소규모 테이블이므로 lock 시간 무시 가능

---

## 8. 구현 순서 상세

### Phase 1 구현 순서 (OAuth 2.0 서버)

```
Step 1-1: DB 마이그레이션 SQL 작성
Step 1-2: Entity 정의 (3개 신규 + 2개 수정)
Step 1-3: Interface + Scope Enum 정의
Step 1-4: DTO 정의 (4개)
Step 1-5: OAuthClientService (client_id 생성/검증)
Step 1-6: OAuthService (코드 발급, 토큰 교환, 갱신, 폐기, 검증)
Step 1-7: OAuthTokenGuard + RequireScopeGuard
Step 1-8: Decorator (@RequireScope, @OAuthContext)
Step 1-9: OAuthController (5개 엔드포인트)
Step 1-10: OAuthModule + app.module.ts 등록
Step 1-11: AdminPartnerAppService.approve() 확장
Step 1-12: API 빌드 검증 (npm run -w @amb/api build)
```

### Phase 2 구현 순서 (Open API Gateway)

```
Step 2-1: OpenApiLogInterceptor
Step 2-2: DTO 정의 (공통 + 도메인별)
Step 2-3: OpenAssetController (R/W)
Step 2-4: OpenIssueController (R/W)
Step 2-5: OpenProjectController (R)
Step 2-6: OpenUserController (R)
Step 2-7: OpenUnitController (R)
Step 2-8: OpenEntityController (R)
Step 2-9: OpenApiModule + app.module.ts 등록
Step 2-10: API 빌드 검증
```

### Phase 3 구현 순서 (프론트엔드)

```
Step 3-1: i18n oauth 네임스페이스 (ko/en/vi)
Step 3-2: OAuthConsentPage.tsx
Step 3-3: AppsMarketplacePage.tsx + AppInstallDialog.tsx
Step 3-4: router.tsx 라우트 추가
Step 3-5: Web 빌드 검증 (npm run -w @amb/web build)
```

---

## 9. Swagger / API 문서

### Open API 전용 Swagger

기존 AMA Swagger(`/api-docs`)와 별도로 Open API 전용 문서를 제공:

```typescript
// main.ts에 추가
if (configService.get('SWAGGER_ENABLED') === 'true') {
  // 기존 Swagger (내부 API)
  SwaggerModule.setup('api-docs', app, ...);
  
  // Open API Swagger (파트너 개발자용)
  const openApiConfig = new DocumentBuilder()
    .setTitle('AMA Open API')
    .setDescription('Partner App Integration API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const openApiDoc = SwaggerModule.createDocument(app, openApiConfig, {
    include: [OpenApiModule],
  });
  SwaggerModule.setup('open-api-docs', app, openApiDoc);
}
```

---

## 10. 요약

| 항목 | 수량 |
|------|------|
| **신규 파일** | 28개 (백엔드 17 + 프론트 6 + i18n 3 + SQL 1 + Swagger 1) |
| **수정 파일** | 8개 |
| **신규 DB 테이블** | 3개 |
| **기존 DB 테이블 변경** | 2개 (nullable 컬럼 추가) |
| **신규 API 엔드포인트** | OAuth 5개 + Open API ~15개 |
| **기존 서비스 재사용** | AssetService, IssueService, ProjectService, UnitService, EntityService |
