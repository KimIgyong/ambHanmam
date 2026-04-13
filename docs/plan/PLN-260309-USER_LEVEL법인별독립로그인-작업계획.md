# 작업 계획서: USER_LEVEL 법인별 독립 로그인 체계

- **문서번호**: PLAN-USER_LEVEL법인별독립로그인-작업계획-20260309
- **작성일**: 2026-03-09
- **참조**: REQ-USER_LEVEL법인별독립로그인-20260309

---

## 1. 현황 분석 요약

### 1.1 현재 시스템 구조

| 구분 | 현재 | 문제 |
|------|------|------|
| 사용자 유니크 키 | `usr_email` (전역 UNIQUE) | 동일 이메일로 여러 법인에 독립 계정 불가 |
| 로그인 | email → 1건 조회 → JWT 즉시 발급 | 법인 선택 없이 바로 접속 |
| JWT | `entityId`는 `usr_company_id` 기반 (선택 아닌 고정) | 법인별 독립 인증 불가 |
| 법인 전환 | EntitySelector 드롭다운으로 런타임 전환 | 데이터 격리 약함 |
| 비밀번호 | 1개 (전역) | 법인별 분리 불가 |
| 프로필 | 1벌 (전역) | 법인별 독립 운영 불가 |

### 1.2 수정 대상 현황

#### 백엔드 핵심 파일

| 파일 | 현재 역할 | LOC |
|------|----------|-----|
| `auth/entity/user.entity.ts` | 사용자 엔티티, `usr_email` UNIQUE | ~120 |
| `auth/service/auth.service.ts` | login, register, forgotPassword, resetPassword, generateTokens | ~460 |
| `auth/controller/auth.controller.ts` | 8개 엔드포인트 (login, register, refresh, logout, forgot/reset, change, me) | ~130 |
| `auth/interface/jwt-payload.interface.ts` | JWT 타입 정의 (entityId optional) | ~15 |
| `auth/guard/own-entity.guard.ts` | JWT entityId vs 요청 entityId 검증 | ~40 |
| `invitation/service/invitation.service.ts` | 초대 수락: 사용자 생성 + EntityUserRole + UnitRole | ~300 |
| `entity-settings/service/entity-member.service.ts` | inviteMember: 이메일 중복 체크 | ~200 |
| `portal-bridge/service/portal-bridge.service.ts` | 포탈→내부 계정 전환 | ~200 |

#### 프론트엔드 핵심 파일

| 파일 | 현재 역할 |
|------|----------|
| `auth/pages/LoginPage.tsx` | email+password → login → /select-entity 이동 |
| `auth/pages/EntitySelectPage.tsx` | GET /hr/entities → 법인 선택 → entityStore 저장 |
| `auth/pages/ForgotPasswordPage.tsx` | email 입력 → POST /auth/forgot-password |
| `auth/pages/ResetPasswordPage.tsx` | token+newPassword → POST /auth/reset-password |
| `auth/store/auth.store.ts` | Zustand, login(user)/logout(), localStorage 영속 |
| `auth/service/auth.service.ts` | API 호출 래퍼 (login, register, refresh 등) |
| `hr/store/entity.store.ts` | currentEntity, entities 상태 관리 |
| `hr/components/EntitySelector.tsx` | 헤더 드롭다운 법인 전환 |

---

## 2. 구현 계획

### Phase 1: DB 마이그레이션 (스테이징 먼저, 이후 프로덕션)

#### Step 1.1: UNIQUE 제약 변경

```sql
-- 1. 기존 usr_email UNIQUE 제거
ALTER TABLE amb_users DROP CONSTRAINT "UQ_136c2230d33f3985e1b1cf5ef56";

-- 2. usr_company_email UNIQUE도 제거 (법인별 독립이므로)
-- 현재 usr_company_email에 UNIQUE가 있다면 제거
-- ALTER TABLE amb_users DROP CONSTRAINT IF EXISTS "UQ_xxx";

-- 3. (usr_email, usr_company_id) 복합 UNIQUE 추가 (soft delete 고려)
CREATE UNIQUE INDEX "UQ_users_email_company"
  ON amb_users(usr_email, usr_company_id)
  WHERE usr_deleted_at IS NULL;
```

#### Step 1.2: 기존 다법인 사용자 데이터 마이그레이션

현재 1명의 사용자(usr_id=A)가 EntityUserRoleEntity를 통해 여러 법인에 속한 경우, 법인별 별도 행으로 분리해야 한다.

```sql
-- 마이그레이션 스크립트 (트랜잭션으로 실행)
-- 1. usr_company_id와 다른 법인에 EntityUserRole이 있는 USER_LEVEL 사용자 찾기
-- 2. 각 추가 법인에 대해:
--    a. 새 UUID로 amb_users에 행 복제 (email, password 복사, company_id=해당법인)
--    b. amb_hr_entity_user_roles의 usr_id를 새 UUID로 변경
--    c. amb_user_unit_roles에서 해당 법인의 unit에 속한 행의 usr_id 변경
--    d. amb_user_cells에서 해당 법인의 cell에 속한 행의 usr_id 변경
```

**마이그레이션 스크립트 파일**: `apps/api/src/database/migrations/user-entity-split.sql`

> **주의**: 이 마이그레이션은 기존 데이터의 usr_id FK를 변경하므로, Todo/Issue/MeetingNotes 등의 작성자 FK는 기존 usr_id를 유지한다 (해당 법인 컨텍스트에서만 조회되므로). 단, 다법인 사용자가 다른 법인에서 작성한 콘텐츠는 해당 법인의 새 usr_id로 귀속시킬지 결정 필요.

#### Step 1.3: UserEntity UNIQUE 어노테이션 변경

**파일**: `apps/api/src/domain/auth/entity/user.entity.ts`

```typescript
// 변경 전
@Column({ name: 'usr_email', unique: true })
usrEmail: string;

// 변경 후
@Column({ name: 'usr_email' })
usrEmail: string;

// 클래스 레벨에 복합 UNIQUE 추가 (TypeORM Index)
@Index('UQ_users_email_company', ['usrEmail', 'usrCompanyId'], {
  unique: true,
  where: '"usr_deleted_at" IS NULL',
})
```

---

### Phase 2: 백엔드 인증 플로우 변경 (핵심)

#### Step 2.1: 로그인 2단계화

**파일**: `apps/api/src/domain/auth/service/auth.service.ts`

**현재 `login()` 메서드**:
```
email → findOne(usr_email) → bcrypt.compare → generateTokens → 반환
```

**변경 후 `login()` 메서드**:
```typescript
async login(request: LoginRequest, ip?: string, userAgent?: string) {
  // 1. email로 다건 조회 (ACTIVE/PENDING만)
  const users = await this.userRepository.find({
    where: { usrEmail: request.email },
    relations: ['company'],
  });

  if (users.length === 0) {
    throw INVALID_CREDENTIALS;
  }

  // 2. 각 행에 대해 비밀번호 비교 → 매칭되는 계정 수집
  const matchedUsers: UserEntity[] = [];
  for (const user of users) {
    if (await bcrypt.compare(request.password, user.usrPassword)) {
      // 상태 검증 (WITHDRAWN, SUSPENDED, INACTIVE 제외)
      if (!['WITHDRAWN', 'SUSPENDED', 'INACTIVE'].includes(user.usrStatus)) {
        matchedUsers.push(user);
      }
    }
  }

  if (matchedUsers.length === 0) {
    throw INVALID_CREDENTIALS;
  }

  // 3. ADMIN_LEVEL은 바로 JWT 발급 (기존 방식 유지)
  const adminUser = matchedUsers.find(u => u.usrLevelCode === 'ADMIN_LEVEL');
  if (adminUser) {
    await this.userRepository.update(adminUser.usrId, { usrLastLoginAt: new Date() });
    this.recordLoginHistory(adminUser, ip, userAgent);
    return {
      step: 'complete' as const,
      tokens: await this.generateTokens(adminUser),
    };
  }

  // 4. USER_LEVEL: 법인 목록 반환 (JWT 미발급)
  if (matchedUsers.length === 1) {
    // 단일 법인이면 바로 토큰 발급
    const user = matchedUsers[0];
    await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
    this.recordLoginHistory(user, ip, userAgent);
    return {
      step: 'complete' as const,
      tokens: await this.generateTokens(user),
    };
  }

  // 5. 다중 법인: 임시 토큰 + 법인 목록 반환
  return {
    step: 'select_entity' as const,
    entities: matchedUsers.map(u => ({
      userId: u.usrId,
      entityId: u.usrCompanyId,
      entityName: u.company?.entName || '',
      entityNameEn: u.company?.entNameEn || '',
      entityCode: u.company?.entCode || '',
      country: u.company?.entCountry || '',
      role: u.usrRole,
      status: u.usrStatus,
    })),
    // 임시 토큰 (법인 선택 전까지만 유효, 5분 만료)
    selectToken: this.jwtService.sign(
      { sub: 'entity-select', email: request.email, userIds: matchedUsers.map(u => u.usrId) },
      { expiresIn: '5m' },
    ),
  };
}
```

#### Step 2.2: 법인 선택 엔드포인트 추가

**파일**: `apps/api/src/domain/auth/controller/auth.controller.ts`

```typescript
@Post('select-entity')
@Public()
async selectEntity(
  @Body() body: SelectEntityRequest,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Ip() ip: string,
) {
  const tokens = await this.authService.selectEntity(
    body.select_token,
    body.user_id,
    ip,
    req.headers['user-agent'],
  );
  this.authService.setTokenCookies(res, tokens);
  return { success: true, data: tokens };
}
```

**파일**: `apps/api/src/domain/auth/dto/request/select-entity.request.ts` (신규)

```typescript
export class SelectEntityRequest {
  @IsString()
  select_token: string;

  @IsUUID()
  user_id: string;
}
```

**파일**: `apps/api/src/domain/auth/service/auth.service.ts` (추가 메서드)

```typescript
async selectEntity(selectToken: string, userId: string, ip?: string, userAgent?: string) {
  // 1. selectToken 검증
  const payload = this.jwtService.verify(selectToken);
  if (payload.sub !== 'entity-select') throw INVALID_TOKEN;
  if (!payload.userIds.includes(userId)) throw INVALID_TOKEN;

  // 2. 해당 사용자 조회
  const user = await this.userRepository.findOne({
    where: { usrId: userId },
    relations: ['company'],
  });
  if (!user) throw USER_NOT_FOUND;

  // 3. 로그인 이력
  await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
  this.recordLoginHistory(user, ip, userAgent);

  // 4. JWT 발급
  return this.generateTokens(user);
}
```

#### Step 2.3: 로그인 응답 타입 변경

**파일**: `apps/api/src/domain/auth/dto/response/auth.response.ts`

```typescript
// 기존 AuthTokenResponse는 유지

// 신규: 로그인 응답 (2단계)
export type LoginResponse =
  | { step: 'complete'; tokens: AuthTokenResponse }
  | { step: 'select_entity'; entities: EntityOption[]; selectToken: string };

export interface EntityOption {
  userId: string;
  entityId: string;
  entityName: string;
  entityNameEn: string | null;
  entityCode: string;
  country: string;
  role: string;
  status: string;
}
```

#### Step 2.4: AuthController login 엔드포인트 수정

**파일**: `apps/api/src/domain/auth/controller/auth.controller.ts`

```typescript
@Post('login')
@Public()
async login(
  @Body() request: LoginRequest,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
  @Ip() ip: string,
) {
  const result = await this.authService.login(request, ip, req.headers['user-agent']);

  if (result.step === 'complete') {
    this.authService.setTokenCookies(res, result.tokens);
    return { success: true, data: result };
  }

  // select_entity: 쿠키 설정 안 함, 법인 목록만 반환
  return { success: true, data: result };
}
```

#### Step 2.5: JWT 페이로드 entityId 필수화 (USER_LEVEL)

**파일**: `apps/api/src/domain/auth/interface/jwt-payload.interface.ts`

```typescript
// entityId를 USER_LEVEL에서 필수화
export interface JwtPayload {
  sub: string;
  email: string;
  level: string;
  role: string;
  status: string;
  companyId: string | null;
  isHq: boolean;
  mustChangePw: boolean;
  entityId?: string;  // USER_LEVEL → 항상 존재, ADMIN_LEVEL → undefined
  tokenVersion?: number;
  timezone?: string;
  locale?: string;
}
```

#### Step 2.6: Register 수정

**파일**: `apps/api/src/domain/auth/service/auth.service.ts`

```typescript
async register(request: RegisterRequest) {
  // 변경: (email + company_id) 기준 중복 체크
  const existingUser = await this.userRepository.findOne({
    where: {
      usrEmail: request.email,
      usrCompanyId: companyId || IsNull(), // 초대 없는 가입은 companyId=null
    },
    withDeleted: true,
  });

  // 나머지 로직 동일 (soft-delete 복원 포함)
}
```

---

### Phase 3: 프론트엔드 인증 플로우 변경

#### Step 3.1: auth.service.ts API 호출 변경

**파일**: `apps/web/src/domain/auth/service/auth.service.ts`

```typescript
// login 반환 타입 변경
async login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
    email, password,
  });
  return data.data;
}

// 신규: 법인 선택 API
async selectEntity(selectToken: string, userId: string): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<ApiResponse<{ tokens: AuthTokenResponse }>>('/auth/select-entity', {
    select_token: selectToken,
    user_id: userId,
  });
  return data.data.tokens;
}
```

#### Step 3.2: LoginPage 수정

**파일**: `apps/web/src/domain/auth/pages/LoginPage.tsx`

```typescript
const onSubmit = async (data: LoginFormData) => {
  const result = await authService.login(data.email, data.password);

  if (result.step === 'complete') {
    authStore.login(result.tokens.user);
    navigate('/select-entity');
    return;
  }

  if (result.step === 'select_entity') {
    // 법인 선택 페이지로 이동 (데이터 전달)
    navigate('/select-entity', {
      state: {
        entities: result.entities,
        selectToken: result.selectToken,
      },
    });
  }
};
```

#### Step 3.3: EntitySelectPage 수정

**파일**: `apps/web/src/domain/auth/pages/EntitySelectPage.tsx`

현재 구조:
- 로그인 후 GET /hr/entities로 법인 목록 조회
- 선택 → entityStore 저장 → 홈 이동

변경 후:
```typescript
export default function EntitySelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const entityStore = useEntityStore();

  // Case 1: login에서 select_entity 응답으로 온 경우 (USER_LEVEL 다법인)
  const loginState = location.state as {
    entities?: EntityOption[];
    selectToken?: string;
  } | null;

  // Case 2: 이미 로그인된 상태에서 접근 (ADMIN_LEVEL 또는 단일법인)
  const isAuthenticated = authStore.isAuthenticated;

  // Case 1: 법인 선택 → select-entity API 호출 → JWT 발급
  const handleSelectEntity = async (entity: EntityOption) => {
    const tokens = await authService.selectEntity(loginState.selectToken, entity.userId);
    authStore.login(tokens.user);
    entityStore.setCurrentEntity({
      entityId: entity.entityId,
      name: entity.entityName,
      // ... 기타 필드
    });
    navigate('/');
  };

  // Case 2: 기존 방식 (ADMIN_LEVEL)
  // ... GET /hr/entities → 법인 선택 → entityStore 저장 → 홈 이동
}
```

#### Step 3.4: EntitySelector 변경

**파일**: `apps/web/src/domain/hr/components/EntitySelector.tsx`

변경 내용:
- USER_LEVEL 사용자: 드롭다운 비활성화 또는 "법인 전환" 클릭 시 로그아웃 처리
- ADMIN_LEVEL 사용자: 기존 방식 유지 (드롭다운으로 법인 전환)

```typescript
// USER_LEVEL: 현재 법인명만 표시 (선택 불가)
// 또는: "법인 전환" 버튼 → confirm → 로그아웃 → 로그인 페이지 이동
const handleEntitySwitch = () => {
  if (isUserLevel) {
    // 로그아웃 후 로그인 페이지로
    authStore.logout();
    navigate('/login');
  } else {
    // ADMIN_LEVEL: 기존 드롭다운 전환
    entityStore.setCurrentEntity(selectedEntity);
  }
};
```

#### Step 3.5: auth.store.ts 수정

**파일**: `apps/web/src/domain/auth/store/auth.store.ts`

변경 최소화 — 기존 구조 유지. `login(user)` 메서드는 동일하게 동작.

#### Step 3.6: X-Entity-Id 헤더 검토

**파일**: `apps/web/src/lib/api-client.ts`

현재 X-Entity-Id 헤더를 매 요청에 추가하는 인터셉터가 있을 경우:
- USER_LEVEL: JWT에 entityId가 확정되어 있으므로 X-Entity-Id 불필요 가능
- ADMIN_LEVEL: 여전히 X-Entity-Id로 타겟 법인 지정 필요
- **결론**: 기존 방식 유지 (하위 호환성)

---

### Phase 4: 초대/회원가입 플로우 변경

#### Step 4.1: InvitationService.accept() 수정

**파일**: `apps/api/src/domain/invitation/service/invitation.service.ts`

```typescript
// 변경: 중복 체크 기준 변경
// 기존: findOne({ usrEmail: invitation.invEmail })
// 변경: findOne({ usrEmail: invitation.invEmail, usrCompanyId: invitation.invCompanyId })

const existingUser = await this.userRepository.findOne({
  where: {
    usrEmail: invitation.invEmail,
    usrCompanyId: invitation.invCompanyId,
  },
  withDeleted: true,
});

// 같은 이메일이 다른 법인에 있어도 OK → 새 usr_id 행 생성
// 같은 이메일 + 같은 법인이 있으면 → 기존처럼 409 또는 복원
```

#### Step 4.2: EntityMemberService.inviteMember() 수정

**파일**: `apps/api/src/domain/entity-settings/service/entity-member.service.ts`

```typescript
// 변경: 이메일 중복 체크 시 entityId 추가
const existingUser = await this.userRepository.findOne({
  where: {
    usrEmail: email,
    usrCompanyId: entityId,
  },
});
// 다른 법인에 같은 이메일이 있어도 초대 허용
```

#### Step 4.3: AuthService.register() 중복 체크 변경 (Step 2.6 참조)

이미 Phase 2에서 처리.

---

### Phase 5: Forgot Password 법인별 처리

#### Step 5.1: forgotPassword 흐름 변경

**파일**: `apps/api/src/domain/auth/service/auth.service.ts`

```typescript
async forgotPassword(email: string): Promise<{ step: string; entities?: any[] }> {
  // 1. 이메일로 다건 조회
  const users = await this.userRepository.find({
    where: { usrEmail: email },
    relations: ['company'],
  });

  if (users.length === 0) return { step: 'sent' }; // 보안: 존재 여부 미노출

  if (users.length === 1) {
    // 단일 계정: 기존 방식대로 리셋 이메일 발송
    await this.sendPasswordResetEmail(users[0]);
    return { step: 'sent' };
  }

  // 다중 계정: 법인 선택 필요
  return {
    step: 'select_entity',
    entities: users.map(u => ({
      userId: u.usrId,
      entityId: u.usrCompanyId,
      entityName: u.company?.entName || '',
      entityCode: u.company?.entCode || '',
    })),
  };
}

// 신규: 법인 지정 비밀번호 리셋
async forgotPasswordForEntity(email: string, userId: string): Promise<void> {
  const user = await this.userRepository.findOne({
    where: { usrId: userId, usrEmail: email },
  });
  if (!user) return; // 보안
  await this.sendPasswordResetEmail(user);
}
```

#### Step 5.2: AuthController 엔드포인트 수정

**파일**: `apps/api/src/domain/auth/controller/auth.controller.ts`

```typescript
@Post('forgot-password')
@Public()
async forgotPassword(@Body() body: ForgotPasswordRequest) {
  return {
    success: true,
    data: await this.authService.forgotPassword(body.email),
  };
}

// 신규: 법인 지정 비밀번호 리셋
@Post('forgot-password/entity')
@Public()
async forgotPasswordForEntity(@Body() body: ForgotPasswordEntityRequest) {
  await this.authService.forgotPasswordForEntity(body.email, body.user_id);
  return { success: true, data: { step: 'sent' } };
}
```

#### Step 5.3: ForgotPasswordPage 수정

**파일**: `apps/web/src/domain/auth/pages/ForgotPasswordPage.tsx`

```typescript
// 이메일 제출 후 응답에 따라:
// step === 'sent' → "리셋 링크 전송됨" 표시
// step === 'select_entity' → 법인 선택 UI 표시 → 선택 후 forgot-password/entity 호출
```

---

### Phase 6: Portal Bridge 법인 지정

#### Step 6.1: createInternalAccount 수정

**파일**: `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts`

```typescript
// 현재: email로 기존 사용자 조회
// 변경: (email + entity_id)로 조회

const existingUser = await this.userRepository.findOne({
  where: {
    usrEmail: portalCustomer.pctEmail,
    usrCompanyId: dto.entity_id,
  },
  withDeleted: true,
});

// 다른 법인에 같은 이메일 사용자가 있어도 새 행 생성 허용
```

#### Step 6.2: PortalUserMapping 제약 검토

현재 `UNIQUE(usr_id)` → 1명의 사용자가 1개 포탈 고객에만 매핑.
법인별 별도 usr_id이므로 기존 제약 유지 가능.

---

## 3. 수정 파일 전체 목록

### 3.1 백엔드

| # | 파일 | Phase | 작업 |
|---|------|-------|------|
| 1 | `auth/entity/user.entity.ts` | P1 | `usr_email` UNIQUE 제거, 복합 UNIQUE Index 추가 |
| 2 | `auth/service/auth.service.ts` | P2 | login 2단계, selectEntity 추가, register 중복체크 변경, forgotPassword 법인 분기 |
| 3 | `auth/controller/auth.controller.ts` | P2 | select-entity, forgot-password/entity 엔드포인트 추가, login 응답 변경 |
| 4 | `auth/dto/request/select-entity.request.ts` | P2 | 신규 DTO |
| 5 | `auth/dto/response/auth.response.ts` | P2 | LoginResponse 타입 추가 |
| 6 | `auth/interface/jwt-payload.interface.ts` | P2 | entityId 주석 갱신 |
| 7 | `auth/guard/own-entity.guard.ts` | P2 | 변경 없음 (이미 JWT entityId 기반) |
| 8 | `invitation/service/invitation.service.ts` | P4 | accept: (email+entityId) 중복 체크 |
| 9 | `entity-settings/service/entity-member.service.ts` | P4 | inviteMember: (email+entityId) 중복 체크 |
| 10 | `portal-bridge/service/portal-bridge.service.ts` | P6 | (email+entityId) 중복 체크 |
| 11 | `database/migrations/user-entity-split.sql` | P1 | 신규: 데이터 마이그레이션 스크립트 |

### 3.2 프론트엔드

| # | 파일 | Phase | 작업 |
|---|------|-------|------|
| 1 | `auth/service/auth.service.ts` | P3 | login 반환 타입 변경, selectEntity API 추가 |
| 2 | `auth/pages/LoginPage.tsx` | P3 | login 응답 분기 처리 (complete vs select_entity) |
| 3 | `auth/pages/EntitySelectPage.tsx` | P3 | selectToken 기반 법인 선택 → select-entity API 호출 |
| 4 | `auth/pages/ForgotPasswordPage.tsx` | P5 | 다중 법인 시 법인 선택 UI 추가 |
| 5 | `auth/store/auth.store.ts` | P3 | 최소 변경 (기존 구조 유지) |
| 6 | `hr/components/EntitySelector.tsx` | P3 | USER_LEVEL: 법인 전환 → 로그아웃 처리 |
| 7 | `hr/store/entity.store.ts` | P3 | 단순화 (setCurrentEntity 1회만) |

### 3.3 DB

| # | 작업 | Phase | SQL |
|---|------|-------|-----|
| 1 | UNIQUE 제거 | P1 | `ALTER TABLE amb_users DROP CONSTRAINT "UQ_..."` |
| 2 | 복합 UNIQUE 추가 | P1 | `CREATE UNIQUE INDEX ... WHERE usr_deleted_at IS NULL` |
| 3 | 데이터 마이그레이션 | P1 | 다법인 사용자 행 분리 스크립트 |

---

## 4. 사이드 임팩트 분석

### 4.1 영향 없음 (변경 불필요)

| 시스템 | 이유 |
|--------|------|
| Todo, Issue, MeetingNotes, Calendar, Documents | usr_id FK 기반 → 법인별 별도 usr_id이므로 자연 격리 |
| AI 에이전트 | JWT entityId 기반 필터링 → JWT가 확정되므로 변경 없음 |
| 권한 시스템 (UserMenuPermission, UnitPermission) | usr_id 기반 |
| Attendance, Leave | usr_id 기반 |
| Refresh Token | 별도 행(별도 tokenVersion)이므로 자동 해결 |
| 메일 계정 (Webmail) | usr_id FK → 별도 행 |

### 4.2 주의 필요 (간접 영향)

| 시스템 | 영향 | 대응 |
|--------|------|------|
| **Talk (DM 검색)** | 같은 이메일이 여러 행 → DM 상대 검색 결과에 중복 | entityId 필터 추가 (현재도 entity 기반 필터 있으면 문제 없음) |
| **ADMIN 사용자 관리** | `/settings/total-users`에서 같은 이메일 다중 표시 | 법인명 표시 추가 (Phase 3 이후) |
| **LoginHistory** | 기존 이력은 기존 usr_id로 남음 | 마이그레이션 시 이력은 이동하지 않음 (자연 보존) |

### 4.3 하위 호환성

| 항목 | 대응 |
|------|------|
| 모바일 앱 (Capacitor) | Bearer 토큰 방식 → login API 응답 형태만 맞추면 됨 |
| X-Entity-Id 헤더 | ADMIN_LEVEL에서 여전히 사용 → 유지 |
| 기존 JWT 토큰 | 배포 후 기존 토큰은 refresh 시 새 형태로 발급 |

---

## 5. 구현 순서 및 의존 관계

```
Phase 1 (DB) ─────────────────┐
  Step 1.1: UNIQUE 제약 변경   │
  Step 1.2: 데이터 마이그레이션 │
  Step 1.3: UserEntity 수정    │
                               ▼
Phase 2 (백엔드 인증) ────────┐
  Step 2.1: login 2단계       │
  Step 2.2: select-entity     │ ← Phase 1 완료 필요
  Step 2.3: 응답 타입 변경     │
  Step 2.4: Controller 수정   │
  Step 2.5: JWT 변경          │
  Step 2.6: Register 수정     │
                               ▼
Phase 3 (프론트엔드) ─────────┐
  Step 3.1: auth.service.ts   │
  Step 3.2: LoginPage         │ ← Phase 2 완료 필요
  Step 3.3: EntitySelectPage  │
  Step 3.4: EntitySelector    │
  Step 3.5: auth.store.ts     │
                               ▼
Phase 4 (초대/가입) ──────────── ← Phase 2 완료 필요 (독립 가능)
Phase 5 (Forgot Password) ───── ← Phase 2 완료 필요 (독립 가능)
Phase 6 (Portal Bridge) ──────── ← Phase 2 완료 필요 (독립 가능)
```

Phase 4, 5, 6은 서로 독립적으로 병렬 구현 가능.

---

## 6. 테스트 계획

### 6.1 단위 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| 1 | 단일 법인 사용자 로그인 | step=complete, 바로 JWT 발급 |
| 2 | 다중 법인 사용자 로그인 | step=select_entity, 법인 목록 + selectToken 반환 |
| 3 | selectEntity: 유효한 selectToken + userId | JWT 발급 성공 |
| 4 | selectEntity: 만료된 selectToken | INVALID_TOKEN 에러 |
| 5 | selectEntity: userIds에 없는 userId | INVALID_TOKEN 에러 |
| 6 | ADMIN_LEVEL 로그인 | 기존 방식대로 step=complete |
| 7 | 같은 이메일, 법인별 다른 비밀번호 | 각 법인 비밀번호로만 매칭 |
| 8 | 초대 수락: 다른 법인에 같은 이메일 존재 | 새 usr_id 행 생성 성공 |
| 9 | 초대 수락: 같은 법인에 같은 이메일 존재 | 409 CONFLICT |
| 10 | Forgot Password: 다중 법인 | step=select_entity 반환 |

### 6.2 통합 테스트 시나리오

| # | 시나리오 |
|---|---------|
| 1 | 법인 A 초대 → 가입 → 법인 B 초대 → 가입 → 로그인 → 법인 선택 → 각 법인 대시보드 확인 |
| 2 | 법인 A 로그인 → 로그아웃 → 법인 B 로그인 → 데이터 격리 확인 |
| 3 | Forgot Password → 법인 선택 → 리셋 → 해당 법인만 비밀번호 변경 확인 |
| 4 | 포탈 브릿지 계정 생성 → 해당 법인으로 로그인 확인 |

---

## 7. 배포 계획

### 7.1 배포 순서

1. **스테이징 DB 마이그레이션** (Phase 1 SQL)
2. **스테이징 백엔드 배포** (Phase 2 + 4 + 5 + 6)
3. **스테이징 프론트엔드 배포** (Phase 3)
4. **스테이징 QA**
5. **프로덕션 DB 마이그레이션**
6. **프로덕션 백엔드 + 프론트엔드 배포**

### 7.2 다운타임

- DB 마이그레이션(UNIQUE 변경): 순간적 (< 1초)
- 데이터 마이그레이션(행 분리): 현재 다법인 사용자 수에 따라 다름, 대부분 < 1분
- 백엔드 배포: Docker 재시작 (< 30초)
- **총 예상 다운타임**: < 2분

### 7.3 롤백 계획

- DB: 복합 UNIQUE 삭제 + 기존 UNIQUE 복원 + 분리된 행 삭제
- 백엔드/프론트: 이전 Docker 이미지로 롤백

---

## 8. 주의사항

1. **ADMIN_LEVEL은 기존 방식 유지**: HQ 법인 1개만 소속, 법인 선택 불필요, EntitySelector로 타겟 법인 전환 가능
2. **데이터 마이그레이션 전 백업 필수**: `pg_dump` 실행 후 마이그레이션
3. **기존 JWT 호환성**: 배포 직후 기존 access_token은 구조가 동일하므로 정상 동작, refresh 시 새 토큰 발급
4. **모바일 앱 대응**: login API 응답 형태 변경에 따른 모바일 앱 업데이트 필요 (Capacitor 앱은 웹 번들이므로 자동 반영)
