-- ═══════════════════════════════════════════════════════════════════
-- MASTER 역할 추가 및 권한 체계 강화 마이그레이션
-- 작성일: 2026-03-01
-- 대상: ADMIN_LEVEL / USER_LEVEL 레벨 구분 강화, MASTER 역할 추가
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 2-1. 포탈 ↔ 내부 사용자 매핑 테이블
-- ═══════════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_pum_status ON amb_portal_user_mappings(pum_status);
CREATE INDEX IF NOT EXISTS idx_pum_pct_id ON amb_portal_user_mappings(pct_id);
CREATE INDEX IF NOT EXISTS idx_pum_usr_id ON amb_portal_user_mappings(usr_id);

-- ═══════════════════════════════════════════════════════════════════
-- 2-2. 신규 ENTITY_* 메뉴 설정 + MASTER 역할 메뉴 권한
-- ═══════════════════════════════════════════════════════════════════

-- 신규 메뉴 설정 (amb_menu_config)
INSERT INTO amb_menu_config (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
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
  ('DRIVE', 'MASTER', true),
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

-- 다른 역할에 대한 ENTITY_MEMBERS/ENTITY_PERMISSIONS 권한
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

-- ═══════════════════════════════════════════════════════════════════
-- 2-3. MANAGER Settings 차단 + Admin Module USER_LEVEL 전면 차단
-- ═══════════════════════════════════════════════════════════════════

-- MANAGER의 기존 Settings 접근 차단
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

-- ═══════════════════════════════════════════════════════════════════
-- 2-4. amb_api_keys에 ent_id 컬럼 추가 (법인별 API Key)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE amb_api_keys
  ADD COLUMN IF NOT EXISTS ent_id UUID REFERENCES amb_hr_entities(ent_id);

-- NULL = 시스템 공동 키, UUID = 법인 전용 키
COMMENT ON COLUMN amb_api_keys.ent_id IS 'NULL: 시스템 공동 키, UUID: 법인 전용 키';

-- 법인별 유니크 (provider + ent_id 조합)
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_provider_entity
  ON amb_api_keys(apk_provider, ent_id) WHERE ent_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 2-5. amb_drive_settings에 ent_id 컬럼 추가 (법인별 Drive)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE amb_drive_settings
  ADD COLUMN IF NOT EXISTS ent_id UUID REFERENCES amb_hr_entities(ent_id);

-- NULL = 시스템 기본 설정 (폴백), UUID = 법인별 설정
COMMENT ON COLUMN amb_drive_settings.ent_id IS 'NULL: 시스템 기본 설정, UUID: 법인별 설정';

CREATE UNIQUE INDEX IF NOT EXISTS uq_drive_settings_entity
  ON amb_drive_settings(ent_id) WHERE ent_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 2-6. AI 토큰 사용 이력 테이블 (건별 기록)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_ai_token_usage (
  atu_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  usr_id            UUID NOT NULL REFERENCES amb_users(usr_id),
  cvs_id            UUID REFERENCES amb_conversations(cvs_id),
  atu_source_type   VARCHAR(30) NOT NULL DEFAULT 'CHAT',
  atu_model         VARCHAR(100) NOT NULL,
  atu_input_tokens  INTEGER NOT NULL DEFAULT 0,
  atu_output_tokens INTEGER NOT NULL DEFAULT 0,
  atu_total_tokens  INTEGER NOT NULL DEFAULT 0,
  atu_key_source    VARCHAR(20) NOT NULL DEFAULT 'SHARED',
  atu_created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atu_ent_date ON amb_ai_token_usage(ent_id, atu_created_at);
CREATE INDEX IF NOT EXISTS idx_atu_usr_date ON amb_ai_token_usage(usr_id, atu_created_at);
CREATE INDEX IF NOT EXISTS idx_atu_source ON amb_ai_token_usage(atu_source_type, atu_created_at);

-- ═══════════════════════════════════════════════════════════════════
-- 2-7. AI 토큰 법인별 일별 집계 테이블 (대시보드/한도 확인)
-- ═══════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════
-- 2-8. 법인별 API 사용 한도 테이블
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS amb_entity_api_quotas (
  eaq_id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                   UUID NOT NULL UNIQUE REFERENCES amb_hr_entities(ent_id),
  eaq_daily_token_limit    BIGINT DEFAULT 0,
  eaq_monthly_token_limit  BIGINT DEFAULT 0,
  eaq_action_on_exceed     VARCHAR(20) DEFAULT 'BLOCK',
  eaq_is_shared_key        BOOLEAN DEFAULT true,
  eaq_credit_balance       DECIMAL(10,2) DEFAULT 0,
  eaq_updated_by           UUID REFERENCES amb_users(usr_id),
  eaq_created_at           TIMESTAMPTZ DEFAULT NOW(),
  eaq_updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════
-- 2-9. 확장 ENTITY_* 메뉴 설정 (Drive, API Keys, Usage)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO amb_menu_config (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
VALUES
  ('ENTITY_DRIVE', true, 930, 'settings.entityDrive', 'HardDrive', '/entity-settings/drive', 'ENTITY_SETTINGS'),
  ('ENTITY_API_KEYS', true, 940, 'settings.entityApiKeys', 'Key', '/entity-settings/api-keys', 'ENTITY_SETTINGS'),
  ('ENTITY_USAGE', true, 950, 'settings.entityUsage', 'BarChart3', '/entity-settings/usage', 'ENTITY_SETTINGS')
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- ENTITY_DRIVE / ENTITY_API_KEYS / ENTITY_USAGE 역할별 권한
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

COMMIT;
