# 작업 계획서: ADMIN_LEVEL / USER_LEVEL 구분 강화 및 MASTER 역할 추가

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-01 |
| 관련 분석서 | `docs/analysis/REQ-ADMIN_USER레벨구분강화-MASTER역할추가-20260301.md` |
| 영향 범위 | packages/types, packages/common, apps/api, apps/web, sql |
| 최종 수정 | 2026-03-01 (법인별 API Key/Drive/AI 사용량/Quota/Admin Module 분리 추가) |

---

## 시스템 현황 요약

### 현재 아키텍처 핵심 사항
- **DB 공유**: portal-api(포트 3010)와 api(포트 3009)는 동일 DB(`db_amb`) 사용
- **엔티티 분리**: 내부 API에 `PortalCustomerEntity` 미등록 → 등록 필요
- **인증 독립**: portal-jwt / jwt 전략 완전 분리 → 별도 계정 생성 방식
- **MANAGER의 Settings 접근**: 현재 6개 Settings 메뉴 접근 가능 (TO-BE: 차단)
- **역할 계층**: VIEWER(1) < MEMBER(2) < MANAGER(3) < ADMIN(4) < SUPER_ADMIN(5)
- **API Key**: 시스템 전역 단일 키 (`amb_api_keys`에 `ent_id` 없음)
- **Drive 설정**: 시스템 전역 단일 (`amb_drive_settings`에 `ent_id` 없음)
- **AI 사용량**: 번역만 추적 (`amb_translation_usage`), 전체 AI 호출 추적 미구현
- **Work Module**: AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT가 일반 모듈과 혼재

---

## 단계별 구현 계획

### Phase 1: 타입 · 상수 · 유틸 기반 작업

> MASTER 역할 정의와 권한 체계의 코드 기반을 먼저 확립한다.

#### 1-1. USER_ROLE에 MASTER 추가

**파일**: `packages/types/src/user-level.types.ts`

```typescript
// AS-IS
export const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

// TO-BE
export const USER_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MASTER: 'MASTER',          // 신규: 법인 관리자
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
```

**VALID_LEVEL_ROLES 수정**:
```typescript
// AS-IS
USER_LEVEL: [USER_ROLE.MANAGER, USER_ROLE.MEMBER, USER_ROLE.VIEWER],

// TO-BE
USER_LEVEL: [USER_ROLE.MASTER, USER_ROLE.MANAGER, USER_ROLE.MEMBER, USER_ROLE.VIEWER],
```

#### 1-2. ROLE_DATA_SCOPE에 MASTER 추가

**파일**: `packages/types/src/permission.types.ts`

```typescript
// TO-BE
export const ROLE_DATA_SCOPE: Record<UserRole, DataScope> = {
  SUPER_ADMIN: 'ALL',
  ADMIN: 'ALL',
  MASTER: 'OWN_ORG',        // 신규
  MANAGER: 'OWN_ORG',
  MEMBER: 'OWN_ORG',
  VIEWER: 'OWN_ORG',
} as const;
```

**MENU_PERMISSIONS에 MASTER 추가**: 각 메뉴 항목의 `allowedRoles`, `writeRoles`, `readOnlyRoles`에 MASTER 반영
- Work Tool/Module 메뉴: `allowedRoles`에 MASTER 추가, `writeRoles`에 MASTER 추가
- Settings 메뉴(members, settings): `allowedRoles`에서 MASTER 제외

#### 1-3. ROLE_HIERARCHY에 MASTER 추가

**파일**: `apps/api/src/global/guard/roles.guard.ts`

```typescript
// AS-IS
const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

// TO-BE
const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  MASTER: 4,              // 신규: MANAGER 위, ADMIN 아래
  ADMIN: 5,               // 4 → 5
  SUPER_ADMIN: 6,         // 5 → 6
};
```

#### 1-4. DEFAULT_PERMISSIONS에 MASTER 추가

**파일**: `apps/api/src/global/constant/menu-code.constant.ts`

MASTER 기본 권한 정의:

```typescript
MASTER: {
  // Chat — 전체 접근
  CHAT_MANAGEMENT: true,
  CHAT_ACCOUNTING: true,
  CHAT_HR: true,
  CHAT_LEGAL: true,
  CHAT_SALES: true,
  CHAT_IT: true,
  CHAT_MARKETING: true,
  CHAT_GENERAL_AFFAIRS: true,
  CHAT_PLANNING: true,

  // Work Tools — 전체 접근
  TODO: true,
  MEETING_NOTES: true,
  AMOEBA_TALK: true,
  ATTENDANCE: true,
  NOTICES: true,
  DOCUMENTS: true,
  MAIL: true,
  CALENDAR: true,
  ISSUES: true,

  // Work Modules — 전체 접근
  ACCOUNTING: true,
  HR: true,
  BILLING: true,
  DEPARTMENTS: true,
  WORK_ITEMS: true,
  KMS: true,
  PROJECT_MANAGEMENT: true,
  ASSET_MANAGEMENT: true,

  // Admin Module — ADMIN_LEVEL 전용 (USER_LEVEL 차단)
  AGENTS: false,                  // ADMIN 전용
  SERVICE_MANAGEMENT: false,      // ADMIN 전용
  SITE_MANAGEMENT: false,         // ADMIN 전용

  // 기존 Settings — 전부 차단
  SETTINGS_MEMBERS: false,
  SETTINGS_API_KEYS: false,
  SETTINGS_SMTP: false,
  SETTINGS_PERMISSIONS: false,
  SETTINGS_DRIVE: false,
  SETTINGS_ENTITIES: false,
  SETTINGS_CONVERSATIONS: false,
  SETTINGS_MAIL_ACCOUNTS: false,
  SETTINGS_AGENTS: false,
  SETTINGS_SITE: false,

  // MASTER 전용 Settings — 신규 메뉴 코드
  ENTITY_MEMBERS: true,         // 법인 멤버 관리/초대
  ENTITY_PERMISSIONS: true,     // 법인 멤버 권한 설정
  ENTITY_DRIVE: true,           // 법인 Drive 설정
  ENTITY_API_KEYS: true,        // 법인 API Key 관리
  ENTITY_USAGE: true,           // 법인 AI 사용량 조회
},
```

**MANAGER 권한 수정** — 기존 Settings 접근 차단:

```typescript
// AS-IS (MANAGER)
SETTINGS_MEMBERS: true,
SETTINGS_CONVERSATIONS: true,
SETTINGS_MAIL_ACCOUNTS: true,
SETTINGS_AGENTS: true,

// TO-BE (MANAGER)
SETTINGS_MEMBERS: false,          // 차단
SETTINGS_CONVERSATIONS: false,    // 차단
SETTINGS_MAIL_ACCOUNTS: false,    // 차단
SETTINGS_AGENTS: false,           // 차단
// Admin Module — ADMIN 전용 (MANAGER도 차단)
AGENTS: false,                    // 차단
SERVICE_MANAGEMENT: false,        // 차단
SITE_MANAGEMENT: false,           // 차단 (기존에도 false)
```

**MEMBER / VIEWER에도 Admin Module 차단 확인**:
```typescript
// MEMBER, VIEWER (기존에 AGENTS: true → TO-BE: false)
AGENTS: false,
SERVICE_MANAGEMENT: false,
SITE_MANAGEMENT: false,
```

**신규 메뉴 코드 상수 추가**:
```typescript
// MENU_CODES에 추가
ENTITY_MEMBERS: 'ENTITY_MEMBERS',
ENTITY_PERMISSIONS: 'ENTITY_PERMISSIONS',
ENTITY_DRIVE: 'ENTITY_DRIVE',
ENTITY_API_KEYS: 'ENTITY_API_KEYS',
ENTITY_USAGE: 'ENTITY_USAGE',
```

#### 1-5. 권한 유틸 함수 업데이트

**파일**: `packages/common/src/permission.util.ts`

- `isValidLevelRole()`: MASTER 포함 자동 반영 (VALID_LEVEL_ROLES 참조)
- `getDataScope()`: MASTER → OWN_ORG 자동 반영 (ROLE_DATA_SCOPE 참조)
- 신규 함수 추가 불필요 (기존 함수가 상수 참조 기반이므로 자동 적용)

#### 1-6. 가입경로 상수 추가

**파일**: `packages/types/src/user-level.types.ts` (또는 해당 위치)

```typescript
// 기존: SEED, REGISTER, INVITE
// 추가
export const JOIN_METHOD = {
  SEED: 'SEED',
  REGISTER: 'REGISTER',
  INVITE: 'INVITE',
  PORTAL: 'PORTAL',        // 신규: 포탈 전환
} as const;
```

---

### Phase 2: 데이터베이스 마이그레이션

> 신규 테이블 생성, 기존 테이블 데이터 추가

**파일**: `sql/migration_master_role.sql` (신규)

#### 2-1. 포탈-내부 매핑 테이블

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 1: 포탈 ↔ 내부 사용자 매핑 테이블
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_portal_user_mappings (
  pum_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pct_id          UUID NOT NULL,
  usr_id          UUID NOT NULL,
  pum_status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  pum_created_by  UUID NOT NULL,
  pum_revoked_by  UUID,
  pum_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pum_revoked_at  TIMESTAMPTZ,
  CONSTRAINT fk_pum_customer FOREIGN KEY (pct_id)
    REFERENCES amb_svc_portal_customers(pct_id),
  CONSTRAINT fk_pum_user FOREIGN KEY (usr_id)
    REFERENCES amb_users(usr_id),
  CONSTRAINT fk_pum_created_by FOREIGN KEY (pum_created_by)
    REFERENCES amb_users(usr_id),
  CONSTRAINT uq_pum_pct UNIQUE (pct_id),
  CONSTRAINT uq_pum_usr UNIQUE (usr_id)
);

CREATE INDEX idx_pum_status ON amb_portal_user_mappings(pum_status);
CREATE INDEX idx_pum_pct_id ON amb_portal_user_mappings(pct_id);
CREATE INDEX idx_pum_usr_id ON amb_portal_user_mappings(usr_id);
```

#### 2-2. MASTER 역할 메뉴 권한 데이터

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 2: MASTER 역할 메뉴 권한 INSERT
-- ═══════════════════════════════════════════════════════

-- 신규 메뉴 설정 (amb_menu_configs)
INSERT INTO amb_menu_configs (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
VALUES
  ('ENTITY_MEMBERS', true, 910, 'settings.entityMembers', 'Users', '/entity-settings/members', 'ENTITY_SETTINGS'),
  ('ENTITY_PERMISSIONS', true, 920, 'settings.entityPermissions', 'Shield', '/entity-settings/permissions', 'ENTITY_SETTINGS')
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- MASTER 역할 기본 권한 (amb_menu_permissions)
INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  -- Chat 메뉴
  ('CHAT_MANAGEMENT', 'MASTER', true),
  ('CHAT_ACCOUNTING', 'MASTER', true),
  ('CHAT_HR', 'MASTER', true),
  ('CHAT_LEGAL', 'MASTER', true),
  ('CHAT_SALES', 'MASTER', true),
  ('CHAT_IT', 'MASTER', true),
  ('CHAT_MARKETING', 'MASTER', true),
  ('CHAT_GENERAL_AFFAIRS', 'MASTER', true),
  ('CHAT_PLANNING', 'MASTER', true),
  -- Work Tools
  ('TODO', 'MASTER', true),
  ('MEETING_NOTES', 'MASTER', true),
  ('AMOEBA_TALK', 'MASTER', true),
  ('ATTENDANCE', 'MASTER', true),
  ('NOTICES', 'MASTER', true),
  ('DOCUMENTS', 'MASTER', true),
  ('MAIL', 'MASTER', true),
  ('CALENDAR', 'MASTER', true),
  ('ISSUES', 'MASTER', true),
  -- Work Modules
  ('ACCOUNTING', 'MASTER', true),
  ('HR', 'MASTER', true),
  ('BILLING', 'MASTER', true),
  ('DEPARTMENTS', 'MASTER', true),
  ('WORK_ITEMS', 'MASTER', true),
  ('KMS', 'MASTER', true),
  ('PROJECT_MANAGEMENT', 'MASTER', true),
  ('ASSET_MANAGEMENT', 'MASTER', true),
  -- Admin Module — ADMIN 전용 (MASTER 차단)
  ('AGENTS', 'MASTER', false),
  ('SERVICE_MANAGEMENT', 'MASTER', false),
  ('SITE_MANAGEMENT', 'MASTER', false),
  -- 기존 Settings 차단
  ('SETTINGS_MEMBERS', 'MASTER', false),
  ('SETTINGS_API_KEYS', 'MASTER', false),
  ('SETTINGS_SMTP', 'MASTER', false),
  ('SETTINGS_PERMISSIONS', 'MASTER', false),
  ('SETTINGS_DRIVE', 'MASTER', false),
  ('SETTINGS_ENTITIES', 'MASTER', false),
  ('SETTINGS_CONVERSATIONS', 'MASTER', false),
  ('SETTINGS_MAIL_ACCOUNTS', 'MASTER', false),
  ('SETTINGS_AGENTS', 'MASTER', false),
  ('SETTINGS_SITE', 'MASTER', false),
  -- MASTER 전용 (법인 설정)
  ('ENTITY_MEMBERS', 'MASTER', true),
  ('ENTITY_PERMISSIONS', 'MASTER', true)
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;

-- 다른 역할에 대한 ENTITY_* 메뉴 권한 (기본 차단)
INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  ('ENTITY_MEMBERS', 'SUPER_ADMIN', true),
  ('ENTITY_MEMBERS', 'ADMIN', true),
  ('ENTITY_MEMBERS', 'MANAGER', false),
  ('ENTITY_MEMBERS', 'MEMBER', false),
  ('ENTITY_MEMBERS', 'VIEWER', false),
  ('ENTITY_PERMISSIONS', 'SUPER_ADMIN', true),
  ('ENTITY_PERMISSIONS', 'ADMIN', true),
  ('ENTITY_PERMISSIONS', 'MANAGER', false),
  ('ENTITY_PERMISSIONS', 'MEMBER', false),
  ('ENTITY_PERMISSIONS', 'VIEWER', false)
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;
```

#### 2-3. MANAGER Settings 차단 + Admin Module USER_LEVEL 전면 차단

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 3: MANAGER의 기존 Settings 접근 차단
-- ═══════════════════════════════════════════════════════

UPDATE amb_menu_permissions
SET mpm_accessible = false, mpm_updated_at = NOW()
WHERE mpm_role = 'MANAGER'
  AND mpm_menu_code IN (
    'SETTINGS_MEMBERS',
    'SETTINGS_CONVERSATIONS',
    'SETTINGS_MAIL_ACCOUNTS',
    'SETTINGS_AGENTS'
  );

-- Admin Module (AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT) — USER_LEVEL 전면 차단
UPDATE amb_menu_permissions
SET mpm_accessible = false, mpm_updated_at = NOW()
WHERE mpm_role IN ('MANAGER', 'MEMBER', 'VIEWER')
  AND mpm_menu_code IN ('AGENTS', 'SERVICE_MANAGEMENT', 'SITE_MANAGEMENT');
```

#### 2-4. 법인별 API Key 테이블 확장

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 4: amb_api_keys에 ent_id 컬럼 추가
-- ═══════════════════════════════════════════════════════

ALTER TABLE amb_api_keys
  ADD COLUMN IF NOT EXISTS ent_id UUID REFERENCES amb_hr_entities(ent_id);

-- NULL = 시스템 공동 키, UUID = 법인 전용 키
COMMENT ON COLUMN amb_api_keys.ent_id IS 'NULL: 시스템 공동 키, UUID: 법인 전용 키';

-- 법인별 유니크 (provider + ent_id 조합)
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_provider_entity
  ON amb_api_keys(apk_provider, ent_id) WHERE ent_id IS NOT NULL;
```

#### 2-5. 법인별 Drive 설정 테이블 확장

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 5: amb_drive_settings에 ent_id 컬럼 추가
-- ═══════════════════════════════════════════════════════

ALTER TABLE amb_drive_settings
  ADD COLUMN IF NOT EXISTS ent_id UUID REFERENCES amb_hr_entities(ent_id);

-- NULL = 시스템 기본 설정 (폴백), UUID = 법인별 설정
COMMENT ON COLUMN amb_drive_settings.ent_id IS 'NULL: 시스템 기본 설정, UUID: 법인별 설정';

CREATE UNIQUE INDEX IF NOT EXISTS uq_drive_settings_entity
  ON amb_drive_settings(ent_id) WHERE ent_id IS NOT NULL;
```

#### 2-6. AI 토큰 사용 이력 테이블 (신규)

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 6: 전체 AI API 호출 건별 사용량 기록
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_ai_token_usage (
  atu_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  usr_id            UUID NOT NULL REFERENCES amb_users(usr_id),
  cvs_id            UUID REFERENCES amb_conversations(cvs_id),  -- 대화 연결 (nullable)
  atu_source_type   VARCHAR(30) NOT NULL DEFAULT 'CHAT',        -- CHAT | TRANSLATION | KMS | PROJECT | BILLING | TALK
  atu_model         VARCHAR(100) NOT NULL,
  atu_input_tokens  INTEGER NOT NULL DEFAULT 0,
  atu_output_tokens INTEGER NOT NULL DEFAULT 0,
  atu_total_tokens  INTEGER NOT NULL DEFAULT 0,                 -- input + output 합계
  atu_key_source    VARCHAR(20) NOT NULL DEFAULT 'SHARED',      -- ENTITY | SHARED
  atu_created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_atu_ent_date ON amb_ai_token_usage(ent_id, atu_created_at);
CREATE INDEX idx_atu_usr_date ON amb_ai_token_usage(usr_id, atu_created_at);
CREATE INDEX idx_atu_source ON amb_ai_token_usage(atu_source_type, atu_created_at);
```

#### 2-7. AI 토큰 법인별 일별 집계 테이블 (신규)

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 7: 법인별 일별 토큰 사용량 집계 (대시보드/한도 확인용)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_ai_token_entity_summary (
  ats_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  ats_date          DATE NOT NULL,
  ats_total_tokens  BIGINT NOT NULL DEFAULT 0,
  ats_input_tokens  BIGINT NOT NULL DEFAULT 0,
  ats_output_tokens BIGINT NOT NULL DEFAULT 0,
  ats_request_count INTEGER NOT NULL DEFAULT 0,
  ats_created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ats_ent_date UNIQUE (ent_id, ats_date)
);
```

#### 2-8. 법인별 API 사용 한도 테이블 (신규)

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 8: 법인별 API 사용 한도 / 크레딧
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_entity_api_quotas (
  eaq_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                   UUID NOT NULL UNIQUE REFERENCES amb_hr_entities(ent_id),
  eaq_daily_token_limit    BIGINT DEFAULT 0,            -- 일일 토큰 한도 (0 = 무제한)
  eaq_monthly_token_limit  BIGINT DEFAULT 0,            -- 월간 토큰 한도 (0 = 무제한)
  eaq_action_on_exceed     VARCHAR(20) DEFAULT 'BLOCK', -- WARN | BLOCK
  eaq_is_shared_key        BOOLEAN DEFAULT true,         -- 공동 키 사용 여부
  eaq_credit_balance       DECIMAL(10,2) DEFAULT 0,      -- 충전 잔액 (향후 충전 기능용)
  eaq_updated_by           UUID REFERENCES amb_users(usr_id),
  eaq_created_at           TIMESTAMPTZ DEFAULT NOW(),
  eaq_updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2-9. 신규 ENTITY_* 메뉴 설정 (확장)

```sql
-- ═══════════════════════════════════════════════════════
-- Phase 9: 확장 ENTITY_* 메뉴 코드 및 권한
-- ═══════════════════════════════════════════════════════

INSERT INTO amb_menu_configs (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
VALUES
  ('ENTITY_DRIVE', true, 930, 'settings.entityDrive', 'HardDrive', '/entity-settings/drive', 'ENTITY_SETTINGS'),
  ('ENTITY_API_KEYS', true, 940, 'settings.entityApiKeys', 'Key', '/entity-settings/api-keys', 'ENTITY_SETTINGS'),
  ('ENTITY_USAGE', true, 950, 'settings.entityUsage', 'BarChart3', '/entity-settings/usage', 'ENTITY_SETTINGS')
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- MASTER 권한
INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  ('ENTITY_DRIVE', 'MASTER', true),
  ('ENTITY_API_KEYS', 'MASTER', true),
  ('ENTITY_USAGE', 'MASTER', true),
  ('ENTITY_DRIVE', 'SUPER_ADMIN', true),
  ('ENTITY_DRIVE', 'ADMIN', true),
  ('ENTITY_DRIVE', 'MANAGER', false),
  ('ENTITY_DRIVE', 'MEMBER', false),
  ('ENTITY_DRIVE', 'VIEWER', false),
  ('ENTITY_API_KEYS', 'SUPER_ADMIN', true),
  ('ENTITY_API_KEYS', 'ADMIN', true),
  ('ENTITY_API_KEYS', 'MANAGER', false),
  ('ENTITY_API_KEYS', 'MEMBER', false),
  ('ENTITY_API_KEYS', 'VIEWER', false),
  ('ENTITY_USAGE', 'SUPER_ADMIN', true),
  ('ENTITY_USAGE', 'ADMIN', true),
  ('ENTITY_USAGE', 'MANAGER', false),
  ('ENTITY_USAGE', 'MEMBER', false),
  ('ENTITY_USAGE', 'VIEWER', false)
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;
```

---

### Phase 3: 백엔드 — 포탈 고객 조회 및 계정 전환 API

> ADMIN이 포탈 고객을 내부 사용자로 전환하는 기능

#### 3-1. PortalCustomerEntity 내부 API 등록

**신규 파일**: `apps/api/src/domain/portal-bridge/entity/portal-customer-readonly.entity.ts`

포탈 고객 테이블을 읽기 전용으로 내부 API에서 참조:

```typescript
@Entity('amb_svc_portal_customers')
export class PortalCustomerReadonlyEntity {
  @PrimaryColumn({ name: 'pct_id', type: 'uuid' })
  pctId: string;

  @Column({ name: 'pct_email', length: 200 })
  pctEmail: string;

  @Column({ name: 'pct_name', length: 100 })
  pctName: string;

  @Column({ name: 'pct_phone', length: 30, nullable: true })
  pctPhone: string;

  @Column({ name: 'pct_company_name', length: 300, nullable: true })
  pctCompanyName: string;

  @Column({ name: 'pct_status', length: 20 })
  pctStatus: string;

  @Column({ name: 'pct_email_verified', type: 'boolean' })
  pctEmailVerified: boolean;

  @Column({ name: 'pct_cli_id', type: 'uuid', nullable: true })
  pctCliId: string;

  @CreateDateColumn({ name: 'pct_created_at' })
  pctCreatedAt: Date;
}
```

#### 3-2. PortalUserMappingEntity

**신규 파일**: `apps/api/src/domain/portal-bridge/entity/portal-user-mapping.entity.ts`

```typescript
@Entity('amb_portal_user_mappings')
export class PortalUserMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pum_id' })
  pumId: string;

  @Column({ name: 'pct_id', type: 'uuid' })
  pctId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pum_status', length: 20, default: 'ACTIVE' })
  pumStatus: string;

  @Column({ name: 'pum_created_by', type: 'uuid' })
  pumCreatedBy: string;

  @Column({ name: 'pum_revoked_by', type: 'uuid', nullable: true })
  pumRevokedBy: string;

  @CreateDateColumn({ name: 'pum_created_at' })
  pumCreatedAt: Date;

  @Column({ name: 'pum_revoked_at', type: 'timestamptz', nullable: true })
  pumRevokedAt: Date;

  // Relations
  @ManyToOne(() => PortalCustomerReadonlyEntity)
  @JoinColumn({ name: 'pct_id' })
  portalCustomer: PortalCustomerReadonlyEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
```

#### 3-3. PortalBridgeModule

**신규 파일**: `apps/api/src/domain/portal-bridge/portal-bridge.module.ts`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalCustomerReadonlyEntity,
      PortalUserMappingEntity,
      UserEntity,
      HrEntityEntity,
    ]),
    MailModule,  // 임시 비밀번호 이메일 발송
  ],
  controllers: [PortalBridgeController],
  providers: [PortalBridgeService],
  exports: [PortalBridgeService],
})
export class PortalBridgeModule {}
```

**등록**: `apps/api/src/app.module.ts`의 imports에 `PortalBridgeModule` 추가, entities 배열에 `PortalCustomerReadonlyEntity`, `PortalUserMappingEntity` 추가

#### 3-4. PortalBridgeService

**신규 파일**: `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts`

핵심 메서드:

| 메서드 | 설명 |
|--------|------|
| `findPortalCustomers(query)` | 포탈 고객 목록 조회 (검색, 페이징, 매핑 여부 표시) |
| `findPortalCustomerDetail(pctId)` | 포탈 고객 상세 (구독 정보 포함) |
| `createInternalAccount(dto, adminUser)` | 포탈 고객 → 내부 계정 생성 |
| `findMappings()` | 매핑 목록 조회 |
| `revokeMapping(pumId, adminUser)` | 매핑 해제 (내부 계정 비활성화) |

**`createInternalAccount` 상세 로직**:

```
1. 포탈 고객 존재 확인 (pctId)
2. 이미 매핑된 계정이 있는지 확인
3. 내부 시스템에 동일 이메일 사용자 존재 확인
   - 있으면: 기존 계정에 매핑 연결 (법인/역할 업데이트)
   - 없으면: 신규 amb_users 레코드 생성
4. 내부 계정 생성:
   - usr_email = pct_email
   - usr_name = pct_name
   - usr_password = 임시 비밀번호 (bcrypt 해싱)
   - usr_level_code = 'USER_LEVEL'
   - usr_role = dto.role (MASTER / MANAGER / MEMBER / VIEWER)
   - usr_company_id = dto.entity_id (선택한 법인)
   - usr_status = 'ACTIVE' (ADMIN이 직접 생성이므로 즉시 활성)
   - usr_join_method = 'PORTAL'
   - usr_must_change_pw = true
   - usr_approved_by = adminUser.userId
   - usr_approved_at = NOW()
5. 매핑 테이블 INSERT (amb_portal_user_mappings)
6. 임시 비밀번호 이메일 발송
7. 결과 반환
```

#### 3-5. PortalBridgeController

**신규 파일**: `apps/api/src/domain/portal-bridge/controller/portal-bridge.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/portal-bridge/customers` | AdminOnly | 포탈 고객 목록 |
| GET | `/portal-bridge/customers/:pctId` | AdminOnly | 포탈 고객 상세 |
| POST | `/portal-bridge/customers/:pctId/create-account` | AdminOnly | 내부 계정 생성 |
| GET | `/portal-bridge/mappings` | AdminOnly | 매핑 목록 |
| PATCH | `/portal-bridge/mappings/:pumId/revoke` | AdminOnly | 매핑 해제 |

#### 3-6. DTO 정의

**신규 파일**: `apps/api/src/domain/portal-bridge/dto/`

```typescript
// create-internal-account.request.ts
export class CreateInternalAccountRequest {
  @IsUUID()
  entity_id: string;            // 법인 ID (필수)

  @IsIn(['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'])
  role: string;                 // 역할 (필수)

  @IsOptional()
  @IsString()
  department?: string;          // 부서 (선택)

  @IsOptional()
  @IsBoolean()
  create_company_email?: boolean;  // 회사 이메일 생성 여부 (선택, 기본 false)
}
```

---

### Phase 4: 백엔드 — MASTER 법인 설정 API

> MASTER가 자신의 법인 내 멤버를 초대하고 권한을 설정하는 기능

#### 4-1. OwnEntityGuard (법인 범위 제한 가드)

**신규 파일**: `apps/api/src/domain/auth/guard/own-entity.guard.ts`

```typescript
@Injectable()
export class OwnEntityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    // ADMIN_LEVEL은 모든 법인 접근 가능
    if (user.level === 'ADMIN_LEVEL') return true;

    // USER_LEVEL + MASTER만 통과
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('E1013');
    }

    // 요청 대상 법인과 사용자 소속 법인 일치 여부 확인
    // (서비스 레이어에서 추가 검증)
    return true;
  }
}
```

#### 4-2. EntitySettingsModule

**신규 파일**: `apps/api/src/domain/entity-settings/entity-settings.module.ts`

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      InvitationEntity,
      UserMenuPermissionEntity,
      MenuPermissionEntity,
      MenuConfigEntity,
      HrEntityEntity,
      CellEntity,
      UserCellEntity,
    ]),
    MailModule,
  ],
  controllers: [EntityMemberController, EntityPermissionController],
  providers: [EntityMemberService, EntityPermissionService],
})
export class EntitySettingsModule {}
```

**등록**: `apps/api/src/app.module.ts`에 `EntitySettingsModule` 추가

#### 4-3. EntityMemberService — 법인 멤버 관리

**신규 파일**: `apps/api/src/domain/entity-settings/service/entity-member.service.ts`

| 메서드 | 설명 |
|--------|------|
| `findMembers(entityId, user)` | 소속 법인 멤버 목록 (MASTER: 자신의 법인만) |
| `inviteMember(dto, user)` | 법인 멤버 초대 (법인 범위 제한) |
| `findInvitations(entityId, user)` | 법인 초대 목록 |
| `cancelInvitation(invId, user)` | 초대 취소 |
| `resendInvitation(invId, user)` | 초대 재발송 |

**`inviteMember` 검증 로직**:

```
1. 사용자가 MASTER인 경우:
   - dto.company_id 강제 = user.companyId (자신의 법인만)
   - dto.role 검증: MANAGER / MEMBER / VIEWER만 허용 (MASTER/ADMIN 불가)
   - dto.level_code 강제 = 'USER_LEVEL'
2. 사용자가 ADMIN인 경우:
   - 모든 법인/역할 허용
3. 기존 InvitationService.create() 호출 (재사용)
```

#### 4-4. EntityPermissionService — 법인 멤버 권한 설정

**신규 파일**: `apps/api/src/domain/entity-settings/service/entity-permission.service.ts`

| 메서드 | 설명 |
|--------|------|
| `getMemberPermissions(userId, entityId, user)` | 법인 멤버의 현재 메뉴 권한 조회 |
| `setMemberPermissions(userId, dto, user)` | 법인 멤버 메뉴 권한 설정 |
| `removeMemberPermission(userId, menuCode, user)` | 법인 멤버 메뉴 권한 제거 |
| `getAvailableMenus()` | 설정 가능한 메뉴 목록 (WORK_TOOL + MODULE만) |

**법인 범위 검증**:

```
1. 대상 사용자(userId)가 같은 법인 소속인지 확인
   → SELECT * FROM amb_users WHERE usr_id = :userId AND usr_company_id = :entityId
2. 대상 사용자가 USER_LEVEL인지 확인 (ADMIN_LEVEL 수정 불가)
3. 대상 사용자 역할이 MASTER보다 낮은지 확인 (MASTER가 MASTER 수정 불가)
4. 설정 가능한 메뉴 범위: SETTINGS_* 제외, ENTITY_* 제외
5. 기존 UserMenuPermissionService.setPermissions() 호출 (재사용)
```

#### 4-5. EntityMemberController

**신규 파일**: `apps/api/src/domain/entity-settings/controller/entity-member.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/entity-settings/members` | Auth + OwnEntityGuard | 법인 멤버 목록 |
| POST | `/entity-settings/members/invite` | Auth + OwnEntityGuard | 법인 멤버 초대 |
| GET | `/entity-settings/invitations` | Auth + OwnEntityGuard | 법인 초대 목록 |
| PATCH | `/entity-settings/invitations/:id/cancel` | Auth + OwnEntityGuard | 초대 취소 |
| POST | `/entity-settings/invitations/:id/resend` | Auth + OwnEntityGuard | 초대 재발송 |

#### 4-6. EntityPermissionController

**신규 파일**: `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/entity-settings/permissions/available-menus` | Auth + OwnEntityGuard | 설정 가능 메뉴 목록 |
| GET | `/entity-settings/permissions/users/:userId` | Auth + OwnEntityGuard | 멤버 권한 조회 |
| PUT | `/entity-settings/permissions/users/:userId` | Auth + OwnEntityGuard | 멤버 권한 설정 |
| DELETE | `/entity-settings/permissions/users/:userId/:menuCode` | Auth + OwnEntityGuard | 멤버 권한 제거 |

---

### Phase 5: 백엔드 — 기존 코드 수정

> 기존 가드, 초대 서비스, 프로젝트 서비스에 MASTER 반영

#### 5-1. 인증 데코레이터 업데이트

**파일**: `apps/api/src/domain/auth/decorator/auth.decorator.ts`

신규 데코레이터 추가:

```typescript
/** MASTER 이상 (MASTER + ADMIN_LEVEL) */
export const MasterOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireRoles('MASTER', 'ADMIN', 'SUPER_ADMIN'),
  );
```

#### 5-2. LevelRoleGuard 수정 — MASTER 상태 처리

**파일**: `apps/api/src/domain/auth/guard/level-role.guard.ts`

변경 없음 — 기존 로직이 `requiredRoles` 배열 기반이므로 MASTER 자동 지원

#### 5-3. AdminGuard 수정 — MASTER 포함 옵션

**파일**: `apps/api/src/domain/settings/guard/admin.guard.ts`

변경 없음 — AdminGuard는 ADMIN/SUPER_ADMIN만 허용 (MASTER는 별도 가드 사용)

#### 5-4. 프로젝트 법인 격리 강화

**파일**: `apps/api/src/domain/project/service/project.service.ts`

```
수정 포인트:
1. createProject(): USER_LEVEL 사용자는 ent_id를 본인 법인으로 강제 설정
2. addProjectMember(): USER_LEVEL 사용자는 같은 법인 소속 멤버만 추가 가능
3. findProjects(): USER_LEVEL 사용자는 본인 법인 프로젝트만 조회
```

#### 5-5. DataScopeInterceptor 확인

**파일**: `apps/api/src/domain/auth/interceptor/data-scope.interceptor.ts`

변경 없음 — MASTER는 USER_LEVEL이므로 기존 `scope: 'OWN_ORG'` 자동 적용

#### 5-6. JWT Payload에 MASTER 반영

**파일**: `apps/api/src/domain/auth/interface/jwt-payload.interface.ts`

변경 없음 — `role` 필드가 string 타입이므로 MASTER 값 자동 지원

---

### Phase 5B: 백엔드 — 법인별 API Key / Drive / AI 사용량 / Quota

> 법인별 설정 관리 및 AI 사용량 추적·제한 시스템

#### 5B-1. 법인별 API Key 서비스

**수정 파일**: `apps/api/src/infrastructure/external/claude/claude.service.ts`

```
수정 포인트:
1. getApiKey(entityId?: string) 시그니처 변경
2. API Key 해석 우선순위:
   - 법인 전용 키: amb_api_keys WHERE ent_id = :entityId AND apk_is_active = true
   - 시스템 공동 키: amb_api_keys WHERE ent_id IS NULL AND apk_is_active = true
   - 환경변수: CLAUDE_API_KEY (개발 환경 폴백)
3. 캐시 키를 `provider:entityId` 조합으로 확장 (기존 5분 TTL 유지)
4. 키 변경 시 캐시 즉시 무효화 메서드 추가
```

**수정 파일**: `apps/api/src/domain/settings/entity/api-key.entity.ts`

```typescript
// ent_id 컬럼 추가
@Column({ name: 'ent_id', type: 'uuid', nullable: true })
@ManyToOne(() => HrEntityEntity)
@JoinColumn({ name: 'ent_id' })
entId: string;
```

#### 5B-2. 법인별 Drive 설정 서비스

**수정 파일**: `apps/api/src/domain/settings/entity/drive-settings.entity.ts`

```typescript
// ent_id 컬럼 추가
@Column({ name: 'ent_id', type: 'uuid', nullable: true })
@ManyToOne(() => HrEntityEntity)
@JoinColumn({ name: 'ent_id' })
entId: string;
```

**수정 파일**: `apps/api/src/domain/settings/service/drive-settings.service.ts`

```
수정 포인트:
1. getDriveSettings(entityId?: string) — 법인별 설정 우선, NULL 폴백
2. saveDriveSettings(dto, entityId?) — 법인별 설정 저장
3. MASTER 호출 시 자동으로 자신의 법인 ID 바인딩
```

#### 5B-3. AI 사용량 기록 서비스 (신규)

**신규 파일**: `apps/api/src/domain/ai-usage/ai-usage.module.ts`
**신규 파일**: `apps/api/src/domain/ai-usage/entity/ai-token-usage.entity.ts`
**신규 파일**: `apps/api/src/domain/ai-usage/entity/ai-token-entity-summary.entity.ts`
**신규 파일**: `apps/api/src/domain/ai-usage/entity/entity-api-quota.entity.ts`
**신규 파일**: `apps/api/src/domain/ai-usage/service/ai-usage.service.ts`

```typescript
// AiTokenUsageEntity — 건별 사용 이력
@Entity('amb_ai_token_usage')
export class AiTokenUsageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'atu_id' })
  atuId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'cvs_id', type: 'uuid', nullable: true })
  cvsId: string;

  @Column({ name: 'atu_source_type', length: 30, default: 'CHAT' })
  atuSourceType: string;  // CHAT | TRANSLATION | KMS | PROJECT | BILLING | TALK

  @Column({ name: 'atu_model', length: 100 })
  atuModel: string;

  @Column({ name: 'atu_input_tokens', type: 'int', default: 0 })
  atuInputTokens: number;

  @Column({ name: 'atu_output_tokens', type: 'int', default: 0 })
  atuOutputTokens: number;

  @Column({ name: 'atu_total_tokens', type: 'int', default: 0 })
  atuTotalTokens: number;

  @Column({ name: 'atu_key_source', length: 20, default: 'SHARED' })
  atuKeySource: string;  // ENTITY | SHARED

  @CreateDateColumn({ name: 'atu_created_at' })
  atuCreatedAt: Date;
}

// AiTokenEntitySummaryEntity — 법인별 일별 집계
@Entity('amb_ai_token_entity_summary')
export class AiTokenEntitySummaryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ats_id' })
  atsId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'ats_date', type: 'date' })
  atsDate: Date;

  @Column({ name: 'ats_total_tokens', type: 'bigint', default: 0 })
  atsTotalTokens: number;

  @Column({ name: 'ats_input_tokens', type: 'bigint', default: 0 })
  atsInputTokens: number;

  @Column({ name: 'ats_output_tokens', type: 'bigint', default: 0 })
  atsOutputTokens: number;

  @Column({ name: 'ats_request_count', type: 'int', default: 0 })
  atsRequestCount: number;

  @CreateDateColumn({ name: 'ats_created_at' })
  atsCreatedAt: Date;
}
```

**AiUsageService 핵심 메서드**:

| 메서드 | 설명 |
|--------|------|
| `recordUsage(dto: RecordUsageDto)` | 건별 사용량 기록 (amb_ai_token_usage INSERT) + 일별 집계 UPSERT |
| `getEntityDailyUsage(entityId, date)` | 법인 일일 사용량 (집계 테이블 조회) |
| `getEntityMonthlyUsage(entityId, yearMonth)` | 법인 월간 사용량 (집계 테이블 SUM) |
| `getEntityUsageSummary(entityId)` | 법인 사용량 요약 (총토큰, 남은 한도, 80%/95% 경고 여부) |
| `getUserUsage(userId, entityId, period)` | 사용자별 사용량 조회 (건별 테이블) |
| `getAllEntitiesUsage(yearMonth)` | 전체 법인 사용량 (ADMIN용, 집계 테이블) |
| `checkQuota(entityId)` | 법인 일일/월간 Quota 초과 여부 확인 (집계 테이블 기반 — 빠른 조회) |

#### 5B-4. API Quota 검증 인터셉터

**신규 파일**: `apps/api/src/domain/ai-usage/interceptor/api-quota.interceptor.ts`

```
동작:
1. AI API 호출 전 법인의 Quota 확인 (checkQuota — 집계 테이블 기반, 빠른 조회)
2. 일일 한도 확인: amb_ai_token_entity_summary WHERE ent_id AND ats_date = TODAY
3. 월간 한도 확인: amb_ai_token_entity_summary WHERE ent_id AND ats_date BETWEEN 월초~월말 SUM
4. action_on_exceed에 따른 처리:
   - WARN: 사용 허용 + 관리자 알림 (MASTER + ADMIN)
   - BLOCK: ForbiddenException('E4010'/'E4011') — 일일/월간 한도 초과
5. 80%, 95% 도달 시 사전 경고 알림 발송
6. Quota 테이블이 없는 법인: 제한 없음 (무제한)
```

#### 5B-5. AI 사용량 기록 연동 (기존 서비스 수정)

모든 Claude API 호출점에 사용량 기록 로직 추가:

| 수정 파일 | 호출점 | source_type |
|----------|--------|-------------|
| `apps/api/src/domain/chat/service/base-agent.service.ts` | `chat()`, `chatStream()` | `CHAT` |
| `apps/api/src/domain/translation/service/translation.service.ts` | `translateStream()`, `translateDirect()` | `TRANSLATION` |
| `apps/api/src/domain/kms/service/kms.service.ts` | AI 태깅, 문서 생성 | `KMS` |
| `apps/api/src/domain/project/service/project.service.ts` | AI 분석 | `PROJECT` |
| `apps/api/src/domain/billing/service/billing.service.ts` | 청구 자동화 | `BILLING` |
| `apps/api/src/domain/talk/service/talk.service.ts` | 메시지 처리 | `TALK` |

**공통 패턴**:
```typescript
// 각 서비스에서 Claude API 호출 후 (비동기 — 응답 지연 무영향)
const result = await this.claudeService.sendMessage(...);
const inputTokens = result.usage?.input_tokens ?? 0;
const outputTokens = result.usage?.output_tokens ?? 0;
this.aiUsageService.recordUsage({
  entId: user.companyId,
  usrId: user.userId,
  cvsId: conversationId,          // 대화 ID (nullable)
  sourceType: 'CHAT',
  model: result.model,
  inputTokens,
  outputTokens,
  totalTokens: inputTokens + outputTokens,
  keySource: isEntityKey ? 'ENTITY' : 'SHARED',
}).catch(err => this.logger.warn('Usage recording failed', err));
// → amb_ai_token_usage INSERT + amb_ai_token_entity_summary UPSERT
```

#### 5B-6. Entity API Key / Drive / Usage API 컨트롤러

**신규 파일**: `apps/api/src/domain/entity-settings/controller/entity-api-key.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/entity-settings/api-keys` | Auth + OwnEntityGuard | 법인 API Key 조회 |
| POST | `/entity-settings/api-keys` | Auth + OwnEntityGuard | 법인 API Key 등록 |
| PATCH | `/entity-settings/api-keys/:id` | Auth + OwnEntityGuard | 법인 API Key 수정 (활성/비활성) |
| DELETE | `/entity-settings/api-keys/:id` | Auth + OwnEntityGuard | 법인 API Key 삭제 |

**신규 파일**: `apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/entity-settings/drive` | Auth + OwnEntityGuard | 법인 Drive 설정 조회 |
| PUT | `/entity-settings/drive` | Auth + OwnEntityGuard | 법인 Drive 설정 저장 |

**신규 파일**: `apps/api/src/domain/entity-settings/controller/entity-usage.controller.ts`

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| GET | `/entity-settings/usage` | Auth + OwnEntityGuard | 법인 사용량 요약 |
| GET | `/entity-settings/usage/monthly` | Auth + OwnEntityGuard | 법인 월간 사용량 상세 |
| GET | `/entity-settings/usage/users` | Auth + OwnEntityGuard | 사용자별 사용량 |
| GET | `/entity-settings/quota` | Auth + OwnEntityGuard | 법인 Quota 조회 |
| PUT | `/entity-settings/quota` | Auth + AdminOnly | Quota 설정 (ADMIN만) |

---

### Phase 5C: 백엔드 — Admin Module 분리 (AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT)

> USER_LEVEL 사용자의 Admin Module 접근을 완전 차단

#### 5C-1. 메뉴 카테고리 상수 정의

**수정 파일**: `apps/api/src/global/constant/menu-code.constant.ts`

```typescript
// 메뉴 카테고리 정의 (신규)
export const MENU_CATEGORY = {
  CHAT: 'CHAT',
  WORK_TOOL: 'WORK_TOOL',
  WORK_MODULE: 'WORK_MODULE',
  ADMIN_MODULE: 'ADMIN_MODULE',     // 신규: ADMIN 전용
  SETTINGS: 'SETTINGS',
  ENTITY_SETTINGS: 'ENTITY_SETTINGS',
} as const;

// Admin Module 메뉴 코드
export const ADMIN_MODULE_CODES = [
  'AGENTS',
  'SERVICE_MANAGEMENT',
  'SITE_MANAGEMENT',
] as const;
```

#### 5C-2. 메뉴 권한 서비스에 Admin Module 필터

**수정 파일**: `apps/api/src/domain/settings/service/menu-permission.service.ts`

```
수정 포인트 (getMyMenus 4단계 로직):
- USER_LEVEL 사용자 → ADMIN_MODULE_CODES에 해당하는 메뉴 자동 필터링
- 이미 DB 권한(mpm_accessible=false)으로도 차단되지만, 서비스 레벨에서 이중 검증
```

---

### Phase 6: 프론트엔드 — 타입 및 Store 업데이트

#### 6-1. Auth Store에 MASTER 헬퍼 추가

**파일**: `apps/web/src/domain/auth/store/auth.store.ts`

```typescript
// 신규 헬퍼 메서드 추가
isMaster: () => get().user?.role === 'MASTER',
isMasterOrAdmin: () => {
  const role = get().user?.role;
  return ['MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
},
```

#### 6-2. i18n 번역 키 추가

**파일**: `apps/web/src/locales/en/`, `ko/`, `vi/`

```json
// common 또는 settings 네임스페이스
{
  "settings.entityMembers": "Entity Members",
  "settings.entityPermissions": "Entity Permissions",
  "entitySettings.title": "Entity Settings",
  "entitySettings.members.title": "Member Management",
  "entitySettings.members.invite": "Invite Member",
  "entitySettings.permissions.title": "Permission Settings",
  "roles.MASTER": "Master"
}
```

---

### Phase 7: 프론트엔드 — 가드 및 라우팅 업데이트

#### 7-1. EntitySettingsGuard 컴포넌트

**신규 파일**: `apps/web/src/components/common/EntitySettingsGuard.tsx`

```typescript
// MASTER 또는 ADMIN만 접근 허용
// MASTER: 자신의 법인 설정만
// ADMIN: 모든 법인 설정
```

#### 7-2. 라우터에 MASTER Settings 라우트 추가

**파일**: `apps/web/src/router/index.tsx`

```typescript
// 신규 라우트 추가
{
  path: 'entity-settings',
  element: <EntitySettingsGuard><EntitySettingsPage /></EntitySettingsGuard>,
},
{
  path: 'entity-settings/members',
  element: <EntitySettingsGuard>
    <MenuGuard menuCode="ENTITY_MEMBERS">
      <EntityMemberPage />
    </MenuGuard>
  </EntitySettingsGuard>,
},
{
  path: 'entity-settings/permissions',
  element: <EntitySettingsGuard>
    <MenuGuard menuCode="ENTITY_PERMISSIONS">
      <EntityPermissionPage />
    </MenuGuard>
  </EntitySettingsGuard>,
},
```

#### 7-3. MainLayout 사이드바 수정

**파일**: `apps/web/src/layouts/MainLayout.tsx`

```
수정 포인트:
1. 하단 메뉴에 Entity Settings 항목 추가
2. 표시 조건: isMasterOrAdmin() && ENTITY_* 메뉴 접근 가능
3. ADMIN은 기존 Settings + Entity Settings 모두 표시
4. MASTER는 Entity Settings만 표시
```

#### 7-4. AdminGuard 수정

**파일**: `apps/web/src/components/common/AdminGuard.tsx`

변경 없음 — MASTER는 기존 Settings 접근 불가, Entity Settings는 별도 가드 사용

---

### Phase 8: 프론트엔드 — ADMIN 포탈 고객 관리 페이지

#### 8-1. PortalBridge 페이지

**신규 파일**: `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx`

기능:
- 포탈 고객 목록 (검색, 매핑 상태 필터)
- 고객 선택 → "내부 계정 생성" 모달
- 모달: 법인 선택, 역할 선택, 부서 선택, 회사 이메일 생성 여부
- 매핑 목록 / 해제

#### 8-2. Settings 페이지에 포탈 고객 관리 카드 추가

**파일**: `apps/web/src/domain/settings/pages/SettingsPage.tsx`

```typescript
// 신규 카드 추가
{
  menuCode: 'SETTINGS_PORTAL_BRIDGE',  // 또는 기존 SETTINGS_MEMBERS에 탭 추가
  title: t('settings.portalBridge'),
  path: '/settings/portal-bridge',
  icon: Globe,
  color: 'text-emerald-500',
}
```

#### 8-3. 라우터에 포탈 관리 라우트 추가

**파일**: `apps/web/src/router/index.tsx`

```typescript
{
  path: 'settings/portal-bridge',
  element: <AdminGuard><PortalCustomerPage /></AdminGuard>,
},
```

---

### Phase 9: 프론트엔드 — MASTER Entity Settings 페이지

#### 9-1. EntitySettingsPage (진입점)

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntitySettingsPage.tsx`

Settings 카드 2개 표시:
- 법인 멤버 관리 (ENTITY_MEMBERS)
- 법인 권한 설정 (ENTITY_PERMISSIONS)

#### 9-2. EntityMemberPage

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx`

탭 구조:
- **멤버 목록 탭**: 법인 소속 멤버 목록 (역할, 상태 표시)
- **초대 관리 탭**: 초대 목록, 초대 생성 모달, 재발송, 취소

초대 생성 모달:
- 이메일 입력
- 역할 선택 (MANAGER / MEMBER / VIEWER — MASTER/ADMIN 제외)
- 부서 선택 (선택사항)
- 자동 승인 체크박스
- 법인은 자동 설정 (현재 사용자의 법인)

#### 9-3. EntityPermissionPage

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntityPermissionPage.tsx`

구성:
- 멤버 선택 드롭다운 (법인 소속 MANAGER/MEMBER/VIEWER만)
- Work Tool 메뉴 목록 + 토글
- Work Module 메뉴 목록 + 토글
- 역할 기본값 표시 (참고용)
- 저장 버튼

#### 9-4. API 서비스 및 훅

**신규 파일**:
- `apps/web/src/domain/entity-settings/service/entity-settings.service.ts`
- `apps/web/src/domain/entity-settings/hooks/useEntityMembers.ts`
- `apps/web/src/domain/entity-settings/hooks/useEntityPermissions.ts`

---

### Phase 10: 프론트엔드 — 법인 Drive / API Key / 사용량 페이지

> MASTER가 자신의 법인 Drive, API Key, AI 사용량을 관리하는 페이지

#### 10-1. EntityDrivePage

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntityDrivePage.tsx`

기능:
- 법인별 Google Drive 설정 조회/수정
- Impersonate Email, 루트 폴더 ID/이름 설정
- 시스템 기본 설정(폴백) 표시 (읽기 전용)
- MASTER: 소속 법인만, ADMIN: 법인 선택 드롭다운

#### 10-2. EntityApiKeyPage

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntityApiKeyPage.tsx`

기능:
- 법인 전용 API Key 등록/수정/삭제/활성화 토글
- "공동 키 사용 중" 상태 표시 (자체 키 미등록 시)
- API Key 마스킹 표시 (`sk-ant-...****`)
- Provider 선택 (기본: ANTHROPIC)

#### 10-3. EntityUsagePage

**신규 파일**: `apps/web/src/domain/entity-settings/pages/EntityUsagePage.tsx`

기능:
- 월간 사용량 차트 (input/output 토큰, 비용)
- Source별 사용량 분포 (CHAT, TRANSLATION, KMS 등)
- 사용자별 사용량 테이블
- Quota 정보 표시 (월간 한도, 현재 사용량, 남은 한도)
- 한도 초과 시 경고 배너

#### 10-4. ADMIN 전체 사용량 대시보드

**수정 파일**: `apps/web/src/domain/settings/pages/SettingsPage.tsx`

```
신규 카드 추가:
- "AI 사용량 관리" — /settings/ai-usage
- ADMIN/SUPER_ADMIN만 표시
```

**신규 파일**: `apps/web/src/domain/settings/pages/AdminAiUsagePage.tsx`

기능:
- 전체 법인 사용량 테이블 (법인별 월간 토큰/비용)
- 법인별 Quota 설정 (월간 한도, 초과 동작)
- 법인별 사용량 상세 드릴다운

#### 10-5. 라우터 추가

**수정 파일**: `apps/web/src/router/index.tsx`

```typescript
// Entity Settings 추가 라우트
{
  path: 'entity-settings/drive',
  element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_DRIVE"><EntityDrivePage /></MenuGuard></EntitySettingsGuard>,
},
{
  path: 'entity-settings/api-keys',
  element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_API_KEYS"><EntityApiKeyPage /></MenuGuard></EntitySettingsGuard>,
},
{
  path: 'entity-settings/usage',
  element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_USAGE"><EntityUsagePage /></MenuGuard></EntitySettingsGuard>,
},
// ADMIN 전용
{
  path: 'settings/ai-usage',
  element: <AdminGuard><AdminAiUsagePage /></AdminGuard>,
},
```

#### 10-6. API 서비스 및 훅 (신규)

**신규 파일**:
- `apps/web/src/domain/entity-settings/service/entity-drive.service.ts`
- `apps/web/src/domain/entity-settings/service/entity-api-key.service.ts`
- `apps/web/src/domain/entity-settings/service/entity-usage.service.ts`
- `apps/web/src/domain/entity-settings/hooks/useEntityDrive.ts`
- `apps/web/src/domain/entity-settings/hooks/useEntityApiKeys.ts`
- `apps/web/src/domain/entity-settings/hooks/useEntityUsage.ts`

---

### Phase 11: 프론트엔드 — Admin Module 분리 (사이드바 그룹핑)

> AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT를 Admin Module 그룹으로 분리

#### 11-1. MainLayout 사이드바 메뉴 그룹 변경

**수정 파일**: `apps/web/src/layouts/MainLayout.tsx`

```
현재:
- WORK_TOOL_CODES = [TODO, AGENTS, MEETING_NOTES, ...]
- MODULE_CODES = [ACCOUNTING, HR, SERVICE_MANAGEMENT, SITE_MANAGEMENT, ...]

TO-BE:
- WORK_TOOL_CODES = [TODO, MEETING_NOTES, AMOEBA_TALK, ...] (AGENTS 제거)
- WORK_MODULE_CODES = [ACCOUNTING, HR, BILLING, ...] (SERVICE_MANAGEMENT, SITE_MANAGEMENT 제거)
- ADMIN_MODULE_CODES = [AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT] (신규 그룹)

사이드바 렌더링:
- ADMIN_MODULE 섹션은 isAdmin() 또는 isSuperAdmin()일 때만 표시
- 섹션 레이블: "Admin" (i18n 키)
```

#### 11-2. i18n 번역 추가

```json
{
  "sidebar.adminModule": "Admin",
  "sidebar.workTools": "Tools",
  "sidebar.workModules": "Modules"
}
```

---

## 변경 파일 목록 요약

### 수정 파일 (기존)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `packages/types/src/user-level.types.ts` | MASTER 역할, VALID_LEVEL_ROLES, JOIN_METHOD 추가 |
| 2 | `packages/types/src/permission.types.ts` | ROLE_DATA_SCOPE, MENU_PERMISSIONS에 MASTER 추가 |
| 3 | `packages/common/src/permission.util.ts` | 상수 참조 기반이므로 자동 반영 (검증만) |
| 4 | `apps/api/src/global/guard/roles.guard.ts` | ROLE_HIERARCHY에 MASTER 추가, 순위 재조정 |
| 5 | `apps/api/src/global/constant/menu-code.constant.ts` | MASTER 기본권한, ENTITY_* 메뉴코드, ADMIN_MODULE 카테고리, MANAGER/MEMBER/VIEWER Admin Module 차단 |
| 6 | `apps/api/src/domain/auth/decorator/auth.decorator.ts` | MasterOrAdmin 데코레이터 추가 |
| 7 | `apps/api/src/app.module.ts` | PortalBridgeModule, EntitySettingsModule, AiUsageModule 등록 |
| 8 | `apps/api/src/domain/project/service/project.service.ts` | 법인 격리 강화 |
| 9 | `apps/api/src/infrastructure/external/claude/claude.service.ts` | getApiKey(entityId?) 법인별 분기, 캐시 키 확장 |
| 10 | `apps/api/src/domain/settings/entity/api-key.entity.ts` | `ent_id` 컬럼 추가 |
| 11 | `apps/api/src/domain/settings/entity/drive-settings.entity.ts` | `ent_id` 컬럼 추가 |
| 12 | `apps/api/src/domain/settings/service/drive-settings.service.ts` | 법인별 Drive 설정 조회/저장 |
| 13 | `apps/api/src/domain/settings/service/menu-permission.service.ts` | Admin Module USER_LEVEL 필터링 이중 검증 |
| 14 | `apps/api/src/domain/chat/service/base-agent.service.ts` | AI 사용량 기록 연동 |
| 15 | `apps/api/src/domain/translation/service/translation.service.ts` | AI 사용량 기록 연동 |
| 16 | `apps/api/src/domain/kms/service/kms.service.ts` | AI 사용량 기록 연동 |
| 17 | `apps/api/src/domain/billing/service/billing.service.ts` | AI 사용량 기록 연동 |
| 18 | `apps/web/src/domain/auth/store/auth.store.ts` | isMaster, isMasterOrAdmin 헬퍼 추가 |
| 19 | `apps/web/src/router/index.tsx` | entity-settings, portal-bridge, ai-usage 라우트 추가 |
| 20 | `apps/web/src/layouts/MainLayout.tsx` | Entity Settings + Admin Module 그룹 분리 |
| 21 | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | 포탈 고객 관리 + AI 사용량 카드 추가 |
| 22 | `apps/web/src/i18n.ts` | entitySettings 네임스페이스 등록 |
| 23 | `apps/web/src/locales/*/` | MASTER, Admin Module, 법인 설정 관련 번역 키 추가 (en, ko, vi) |

### 신규 파일

| # | 파일 | 설명 | Phase |
|---|------|------|:-----:|
| 1 | `sql/migration_master_role.sql` | DB 마이그레이션 (매핑, 메뉴 권한, API Key ent_id, Drive ent_id, AI Usage, Quota) | 2 |
| 2 | `apps/api/src/domain/portal-bridge/portal-bridge.module.ts` | 포탈 브릿지 모듈 | 3 |
| 3 | `apps/api/src/domain/portal-bridge/entity/portal-customer-readonly.entity.ts` | 포탈 고객 읽기 전용 엔티티 | 3 |
| 4 | `apps/api/src/domain/portal-bridge/entity/portal-user-mapping.entity.ts` | 매핑 엔티티 | 3 |
| 5 | `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` | 포탈 브릿지 서비스 | 3 |
| 6 | `apps/api/src/domain/portal-bridge/controller/portal-bridge.controller.ts` | 포탈 브릿지 컨트롤러 | 3 |
| 7 | `apps/api/src/domain/portal-bridge/dto/*.ts` | DTO 3~4개 | 3 |
| 8 | `apps/api/src/domain/entity-settings/entity-settings.module.ts` | 법인 설정 모듈 | 4 |
| 9 | `apps/api/src/domain/entity-settings/service/entity-member.service.ts` | 법인 멤버 서비스 | 4 |
| 10 | `apps/api/src/domain/entity-settings/service/entity-permission.service.ts` | 법인 권한 서비스 | 4 |
| 11 | `apps/api/src/domain/entity-settings/controller/entity-member.controller.ts` | 법인 멤버 컨트롤러 | 4 |
| 12 | `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts` | 법인 권한 컨트롤러 | 4 |
| 13 | `apps/api/src/domain/entity-settings/controller/entity-api-key.controller.ts` | 법인 API Key 컨트롤러 | 5B |
| 14 | `apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts` | 법인 Drive 컨트롤러 | 5B |
| 15 | `apps/api/src/domain/entity-settings/controller/entity-usage.controller.ts` | 법인 사용량 컨트롤러 | 5B |
| 16 | `apps/api/src/domain/auth/guard/own-entity.guard.ts` | 법인 범위 제한 가드 | 4 |
| 17 | `apps/api/src/domain/ai-usage/ai-usage.module.ts` | AI 사용량 모듈 | 5B |
| 18 | `apps/api/src/domain/ai-usage/entity/ai-token-usage.entity.ts` | AI 토큰 사용 이력 엔티티 | 5B |
| 19 | `apps/api/src/domain/ai-usage/entity/ai-token-entity-summary.entity.ts` | 법인별 일별 집계 엔티티 | 5B |
| 20 | `apps/api/src/domain/ai-usage/entity/entity-api-quota.entity.ts` | 법인 API Quota 엔티티 | 5B |
| 21 | `apps/api/src/domain/ai-usage/service/ai-usage.service.ts` | AI 사용량 서비스 | 5B |
| 22 | `apps/api/src/domain/ai-usage/interceptor/api-quota.interceptor.ts` | API Quota 검증 인터셉터 | 5B |
| 23 | `apps/web/src/components/common/EntitySettingsGuard.tsx` | 프론트 가드 | 7 |
| 24 | `apps/web/src/domain/entity-settings/pages/EntitySettingsPage.tsx` | 진입 페이지 | 9 |
| 25 | `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx` | 멤버 관리 | 9 |
| 26 | `apps/web/src/domain/entity-settings/pages/EntityPermissionPage.tsx` | 권한 설정 | 9 |
| 27 | `apps/web/src/domain/entity-settings/pages/EntityDrivePage.tsx` | 법인 Drive 설정 | 10 |
| 28 | `apps/web/src/domain/entity-settings/pages/EntityApiKeyPage.tsx` | 법인 API Key 관리 | 10 |
| 29 | `apps/web/src/domain/entity-settings/pages/EntityUsagePage.tsx` | 법인 사용량 대시보드 | 10 |
| 30 | `apps/web/src/domain/settings/pages/AdminAiUsagePage.tsx` | ADMIN 전체 사용량 대시보드 | 10 |
| 31 | `apps/web/src/domain/entity-settings/service/entity-settings.service.ts` | API 서비스 (멤버/권한) | 9 |
| 32 | `apps/web/src/domain/entity-settings/service/entity-drive.service.ts` | API 서비스 (Drive) | 10 |
| 33 | `apps/web/src/domain/entity-settings/service/entity-api-key.service.ts` | API 서비스 (API Key) | 10 |
| 34 | `apps/web/src/domain/entity-settings/service/entity-usage.service.ts` | API 서비스 (사용량) | 10 |
| 35 | `apps/web/src/domain/entity-settings/hooks/useEntityMembers.ts` | 멤버 훅 | 9 |
| 36 | `apps/web/src/domain/entity-settings/hooks/useEntityPermissions.ts` | 권한 훅 | 9 |
| 37 | `apps/web/src/domain/entity-settings/hooks/useEntityDrive.ts` | Drive 훅 | 10 |
| 38 | `apps/web/src/domain/entity-settings/hooks/useEntityApiKeys.ts` | API Key 훅 | 10 |
| 39 | `apps/web/src/domain/entity-settings/hooks/useEntityUsage.ts` | 사용량 훅 | 10 |
| 40 | `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx` | 포탈 고객 관리 | 8 |
| 41 | `apps/web/src/domain/portal-bridge/service/portal-bridge.service.ts` | API 서비스 | 8 |
| 42 | `apps/web/src/domain/portal-bridge/hooks/usePortalBridge.ts` | 포탈 훅 | 8 |
| 43 | `apps/web/src/locales/en/entitySettings.json` | 영문 번역 | 6 |
| 44 | `apps/web/src/locales/ko/entitySettings.json` | 한국어 번역 | 6 |
| 45 | `apps/web/src/locales/vi/entitySettings.json` | 베트남어 번역 | 6 |

---

## 사이드 임팩트 분석

### 영향받는 기존 기능

| # | 기능 | 영향 | 위험도 | 대응 |
|---|------|------|:------:|------|
| 1 | **MANAGER Settings 접근** | 6개 Settings 메뉴 차단됨 | 🟡 | DB 마이그레이션으로 일괄 처리, 사전 공지 |
| 2 | **RolesGuard 계층 순위** | ADMIN 4→5, SUPER_ADMIN 5→6 | 🟡 | `@Roles('ADMIN')` 사용 곳에서 MASTER도 통과됨 (계층 기반 OR 검증) |
| 3 | **초대 시스템** | MASTER가 초대 생성 가능 | 🟢 | 별도 EntityMemberController로 분리, 기존 InvitationController 미변경 |
| 4 | **메뉴 권한 캐싱** | MASTER 권한 데이터 추가 | 🟢 | DB INSERT로 즉시 반영 |
| 5 | **프론트 isAdmin() 체크** | MASTER는 isAdmin()=false | 🟢 | 별도 isMasterOrAdmin() 사용 |
| 6 | **프로젝트 멤버 초대** | 타 법인 멤버 추가 차단 | 🟡 | USER_LEVEL만 적용, ADMIN_LEVEL은 기존 동작 유지 |
| 7 | **JWT 토큰 크기** | 변경 없음 | 🟢 | role 필드 값만 변경 |
| 8 | **기존 MEMBER/VIEWER 권한** | 변경 없음 | 🟢 | MASTER 추가만, 기존 역할 미변경 |
| 9 | **ClaudeService API Key 조회** | 법인별 키 우선순위 분기 추가 | 🟡 | 기존 단일 키 = `ent_id IS NULL`로 폴백, 무중단 |
| 10 | **Drive Settings 단일 설정** | 법인별 설정 분리 | 🟡 | 기존 설정 = `ent_id IS NULL`로 폴백, 무중단 |
| 11 | **AGENTS/SERVICE_MANAGEMENT 접근** | USER_LEVEL 전면 차단 | 🟡 | ADMIN 전용으로 분리, MANAGER/MEMBER/VIEWER 사전 공지 |
| 12 | **사이드바 메뉴 그룹핑** | 3개 그룹으로 재편 | 🟢 | Work Tool / Work Module / Admin Module 구분 |
| 13 | **base-agent.service.ts 등 AI 호출** | 사용량 기록 로직 추가 | 🟢 | 비동기 기록 (호출 성능 미영향), 실패 시 silent ignore |

### 하위 호환성 보장

| 항목 | 보장 방법 |
|------|----------|
| 기존 API 엔드포인트 | 변경 없음, 신규 엔드포인트만 추가 |
| 기존 DB 스키마 | 신규 테이블 + nullable 컬럼 추가 (기존 데이터 미영향) |
| 기존 사용자 데이터 | 기존 사용자의 role/level 미변경 |
| 기존 프론트엔드 라우트 | 변경 없음, 신규 라우트만 추가 |
| 기존 가드 동작 | AdminGuard 미변경, 신규 OwnEntityGuard만 추가 |
| 기존 API Key (단일) | `ent_id IS NULL` 폴백으로 기존 동작 유지 |
| 기존 Drive 설정 (단일) | `ent_id IS NULL` 폴백으로 기존 동작 유지 |
| 기존 AI 호출 기능 | 사용량 기록은 비동기, 실패 시 silent → 기존 기능 무중단 |
| AGENTS/SERVICE_MANAGEMENT 메뉴 | DB 권한 + 사이드바 그룹핑으로 점진적 차단 |

---

## 구현 일정 (예상)

| Phase | 작업 | 의존성 |
|:-----:|------|--------|
| **1** | 타입/상수/유틸 기반 + Admin Module 분류 | 없음 |
| **2** | DB 마이그레이션 (매핑, 권한, API Key, Drive, AI Usage, Quota) | Phase 1 |
| **3** | 포탈 브릿지 API | Phase 1, 2 |
| **4** | MASTER 법인 멤버/권한 설정 API | Phase 1, 2 |
| **5** | 기존 코드 수정 (프로젝트 격리 등) | Phase 1 |
| **5B** | 법인별 API Key / Drive / AI 사용량 / Quota API | Phase 2, 4 |
| **5C** | Admin Module 분리 (AGENTS/SERVICE_MANAGEMENT/SITE_MANAGEMENT) | Phase 1, 2 |
| **6** | 프론트 타입/Store | Phase 1 |
| **7** | 프론트 가드/라우팅 | Phase 6 |
| **8** | 프론트 포탈 관리 페이지 | Phase 3, 7 |
| **9** | 프론트 MASTER 설정 페이지 (멤버/권한) | Phase 4, 7 |
| **10** | 프론트 법인 Drive/API Key/사용량 페이지 | Phase 5B, 7 |
| **11** | 프론트 Admin Module 사이드바 분리 | Phase 5C, 7 |

```
Phase 1 ──┬──→ Phase 2 ──┬──→ Phase 3 ──────────────→ Phase 8
           │              │                               ↑
           │              ├──→ Phase 4 ──┬──→ Phase 9 ──→┤
           │              │              │                │
           │              ├──→ Phase 5B ─┼──→ Phase 10 ──┤
           │              │              │                │
           │              └──→ Phase 5C ─┘──→ Phase 11 ──┘
           │
           ├──→ Phase 5 (기존 코드 수정)
           │
           └──→ Phase 6 ──→ Phase 7 ──→ Phase 8~11
```

**병렬 가능 구간**:
- 백엔드: Phase 3 + 4 + 5B + 5C (DB 마이그레이션 후 병렬)
- 프론트: Phase 8 + 9 + 10 + 11 (가드/라우팅 구축 후 병렬)

---

*작성: Claude Code (자동 분석)*
*분석 대상: apps/portal-api, apps/api, apps/web, packages/types, packages/common 전체 소스코드*
