-- =============================================================================
-- OAuth 2.0 + Open API 마이그레이션
-- 작성일: 2026-03-28
-- 설명: Partner App OAuth Client 확장 + 인가 코드/토큰/감사 로그 테이블 생성
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. amb_partner_apps: OAuth Client 관련 컬럼 추가
-- -----------------------------------------------------------------------------
ALTER TABLE amb_partner_apps
  ADD COLUMN IF NOT EXISTS pap_client_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pap_client_secret_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pap_redirect_uris TEXT[],
  ADD COLUMN IF NOT EXISTS pap_scopes TEXT[] DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_apps_client_id
  ON amb_partner_apps(pap_client_id) WHERE pap_client_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. amb_partner_app_installs: 법인별 승인 scope 추가
-- -----------------------------------------------------------------------------
ALTER TABLE amb_partner_app_installs
  ADD COLUMN IF NOT EXISTS pai_approved_scopes TEXT[] DEFAULT '{}';

-- -----------------------------------------------------------------------------
-- 3. amb_oauth_authorization_codes: 인가 코드 (단기 수명, 10분)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amb_oauth_authorization_codes (
  oac_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oac_code                  VARCHAR(255) NOT NULL UNIQUE,
  pap_id                    UUID NOT NULL REFERENCES amb_partner_apps(pap_id),
  usr_id                    UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id                    UUID NOT NULL,
  oac_scopes                TEXT[] NOT NULL DEFAULT '{}',
  oac_redirect_uri          VARCHAR(500) NOT NULL,
  oac_code_challenge        VARCHAR(128),
  oac_code_challenge_method VARCHAR(10) DEFAULT 'S256',
  oac_state                 VARCHAR(255),
  oac_expires_at            TIMESTAMPTZ NOT NULL,
  oac_used_at               TIMESTAMPTZ,
  oac_created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_codes_code
  ON amb_oauth_authorization_codes(oac_code);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires
  ON amb_oauth_authorization_codes(oac_expires_at);

-- -----------------------------------------------------------------------------
-- 4. amb_oauth_tokens: 발급 토큰 추적
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amb_oauth_tokens (
  oat_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pap_id                    UUID NOT NULL REFERENCES amb_partner_apps(pap_id),
  usr_id                    UUID NOT NULL REFERENCES amb_users(usr_id),
  ent_id                    UUID NOT NULL,
  oat_access_token_hash     VARCHAR(64) NOT NULL,
  oat_refresh_token_hash    VARCHAR(64),
  oat_scopes                TEXT[] NOT NULL DEFAULT '{}',
  oat_expires_at            TIMESTAMPTZ NOT NULL,
  oat_refresh_expires_at    TIMESTAMPTZ,
  oat_revoked_at            TIMESTAMPTZ,
  oat_created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_access
  ON amb_oauth_tokens(oat_access_token_hash) WHERE oat_revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_refresh
  ON amb_oauth_tokens(oat_refresh_token_hash) WHERE oat_revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user
  ON amb_oauth_tokens(usr_id, pap_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires
  ON amb_oauth_tokens(oat_expires_at);

-- -----------------------------------------------------------------------------
-- 5. amb_open_api_logs: Open API 감사 로그
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amb_open_api_logs (
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

CREATE INDEX IF NOT EXISTS idx_open_api_logs_app
  ON amb_open_api_logs(pap_id, oal_created_at);
CREATE INDEX IF NOT EXISTS idx_open_api_logs_entity
  ON amb_open_api_logs(ent_id, oal_created_at);
CREATE INDEX IF NOT EXISTS idx_open_api_logs_created
  ON amb_open_api_logs(oal_created_at);
