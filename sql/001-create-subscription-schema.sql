-- ============================================================
-- AMA Subscription & Payment Schema
-- Domain: subscription (amb_sub_*, amb_pg_*)
-- Convention: amoeba_code_convention_v2
-- Created: 2026-04-05
-- ============================================================

-- ─────────────────────────────────────────
-- 1. amb_sub_plans  (pln_)
--    SaaS 요금제 정의 마스터
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_plans (
  pln_id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  pln_code                     VARCHAR(20)  NOT NULL,
  pln_name                     VARCHAR(100) NOT NULL,
  pln_tier                     VARCHAR(20)  NOT NULL,
  pln_price_per_user           NUMERIC(10,4) NOT NULL DEFAULT 0,
  -- Token policy
  pln_token_onetime            INT          NOT NULL DEFAULT 0,
  pln_token_per_user_monthly   INT          NOT NULL DEFAULT 0,
  pln_token_addon_unit         INT          NOT NULL DEFAULT 10000,
  pln_token_addon_price        NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  pln_is_token_monthly_reset   BOOLEAN      NOT NULL DEFAULT FALSE,
  -- Storage policy
  pln_storage_base_gb          INT          NOT NULL DEFAULT 1,
  pln_storage_max_gb           INT          NOT NULL DEFAULT 1,
  pln_storage_addon_unit_gb    INT          NOT NULL DEFAULT 0,
  pln_storage_addon_price_gb   NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  pln_storage_warn_pct         INT          NOT NULL DEFAULT 100,
  pln_storage_block_pct        INT          NOT NULL DEFAULT 120,
  -- User policy
  pln_max_users                INT          NOT NULL DEFAULT 5,
  pln_min_users                INT          NOT NULL DEFAULT 1,
  pln_user_slot_size           INT          NOT NULL DEFAULT 5,
  pln_free_user_count          INT          NOT NULL DEFAULT 5,
  -- Referral policy
  pln_is_referral_enabled      BOOLEAN      NOT NULL DEFAULT TRUE,
  pln_referral_reward_tokens   INT          NOT NULL DEFAULT 50000,
  pln_referral_invite_required INT          NOT NULL DEFAULT 10,
  -- Annual billing
  pln_is_annual_available      BOOLEAN      NOT NULL DEFAULT FALSE,
  pln_annual_free_months       INT          NOT NULL DEFAULT 0,
  -- Meta
  pln_is_active                BOOLEAN      NOT NULL DEFAULT TRUE,
  pln_sort_order               INT          NOT NULL DEFAULT 0,
  pln_created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  pln_updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
  pln_deleted_at               TIMESTAMPTZ,

  CONSTRAINT uq_amb_sub_plans_code UNIQUE (pln_code),
  CONSTRAINT ck_amb_sub_plans_tier CHECK (pln_tier IN ('FREE','BASIC','PREMIUM')),
  CONSTRAINT ck_amb_sub_plans_storage_pct CHECK (pln_storage_block_pct > pln_storage_warn_pct)
);

-- ─────────────────────────────────────────
-- 2. amb_sub_subscriptions  (sbn_)
--    Entity(법인)별 SaaS 구독 현황
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_subscriptions (
  sbn_id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                   UUID        NOT NULL,
  pln_id                   UUID        NOT NULL,
  sbn_status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sbn_billing_cycle        VARCHAR(10) NOT NULL DEFAULT 'MONTHLY',
  sbn_user_count           INT         NOT NULL DEFAULT 5,
  sbn_paid_user_count      INT         NOT NULL DEFAULT 0,
  sbn_current_period_start TIMESTAMPTZ,
  sbn_current_period_end   TIMESTAMPTZ,
  sbn_trial_end_at         TIMESTAMPTZ,
  sbn_cancelled_at         TIMESTAMPTZ,
  sbn_is_cancel_scheduled  BOOLEAN     NOT NULL DEFAULT FALSE,
  sbn_pg_subscription_id   VARCHAR(200),
  sbn_pg_customer_id       VARCHAR(200),
  sbn_created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  sbn_updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  sbn_deleted_at           TIMESTAMPTZ,

  CONSTRAINT fk_amb_sub_subscriptions_entities FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id),
  CONSTRAINT fk_amb_sub_subscriptions_plans    FOREIGN KEY (pln_id) REFERENCES amb_sub_plans(pln_id),
  CONSTRAINT uq_amb_sub_subscriptions_ent      UNIQUE (ent_id),
  CONSTRAINT ck_amb_sub_subscriptions_status   CHECK (sbn_status IN ('ACTIVE','SUSPENDED','CANCELLED','PAST_DUE','TRIALING')),
  CONSTRAINT ck_amb_sub_subscriptions_cycle    CHECK (sbn_billing_cycle IN ('MONTHLY','ANNUAL')),
  CONSTRAINT ck_amb_sub_subscriptions_users    CHECK (sbn_user_count >= 1)
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_subscriptions_ent_id ON amb_sub_subscriptions(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_subscriptions_status ON amb_sub_subscriptions(sbn_status);
CREATE INDEX IF NOT EXISTS idx_amb_sub_subscriptions_pg_id  ON amb_sub_subscriptions(sbn_pg_subscription_id);

-- ─────────────────────────────────────────
-- 3. amb_sub_token_wallets  (tkw_)
--    토큰 잔액 지갑 (타입별 1행)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_token_wallets (
  tkw_id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                UUID        NOT NULL,
  sbn_id                UUID        NOT NULL,
  tkw_token_type        VARCHAR(20) NOT NULL,
  tkw_balance           INT         NOT NULL DEFAULT 0,
  tkw_lifetime_granted  INT         NOT NULL DEFAULT 0,
  tkw_lifetime_consumed INT         NOT NULL DEFAULT 0,
  tkw_last_reset_at     TIMESTAMPTZ,
  tkw_next_reset_at     TIMESTAMPTZ,
  tkw_created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  tkw_updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_amb_sub_token_wallets_entities      FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id),
  CONSTRAINT fk_amb_sub_token_wallets_subscriptions FOREIGN KEY (sbn_id) REFERENCES amb_sub_subscriptions(sbn_id),
  CONSTRAINT uq_amb_sub_token_wallets_ent_type      UNIQUE (ent_id, tkw_token_type),
  CONSTRAINT ck_amb_sub_token_wallets_type           CHECK (tkw_token_type IN ('BASE','ADDON','REFERRAL')),
  CONSTRAINT ck_amb_sub_token_wallets_balance        CHECK (tkw_balance >= 0)
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_token_wallets_ent_id ON amb_sub_token_wallets(ent_id);

-- ─────────────────────────────────────────
-- 4. amb_sub_token_ledgers  (tkl_)
--    토큰 변동 원장 (불변 이력)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_token_ledgers (
  tkl_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID        NOT NULL,
  tkw_id            UUID        NOT NULL,
  tkl_token_type    VARCHAR(20) NOT NULL,
  tkl_direction     VARCHAR(10) NOT NULL,
  tkl_amount        INT         NOT NULL,
  tkl_balance_after INT         NOT NULL,
  tkl_reason        VARCHAR(50) NOT NULL,
  tkl_ref_id        VARCHAR(200),
  tkl_meta          JSONB,
  tkl_created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_amb_sub_token_ledgers_entities FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id),
  CONSTRAINT fk_amb_sub_token_ledgers_wallets  FOREIGN KEY (tkw_id) REFERENCES amb_sub_token_wallets(tkw_id),
  CONSTRAINT ck_amb_sub_token_ledgers_direction CHECK (tkl_direction IN ('CREDIT','DEBIT')),
  CONSTRAINT ck_amb_sub_token_ledgers_amount    CHECK (tkl_amount > 0),
  CONSTRAINT ck_amb_sub_token_ledgers_reason    CHECK (tkl_reason IN (
    'MONTHLY_GRANT','ONETIME_GRANT','ADDON_PURCHASE','REFERRAL_REWARD',
    'AI_USAGE','RESET','MANUAL_ADJUST'
  ))
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_ent_id     ON amb_sub_token_ledgers(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_tkw_id     ON amb_sub_token_ledgers(tkw_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_created_at ON amb_sub_token_ledgers(tkl_created_at DESC);

-- ─────────────────────────────────────────
-- 5. amb_sub_storage_quotas  (sqt_)
--    스토리지 할당량 및 사용량
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_storage_quotas (
  sqt_id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                UUID        NOT NULL,
  sbn_id                UUID        NOT NULL,
  sqt_base_gb           INT         NOT NULL DEFAULT 1,
  sqt_addon_gb          INT         NOT NULL DEFAULT 0,
  sqt_max_gb            INT         NOT NULL DEFAULT 1,
  sqt_used_bytes        BIGINT      NOT NULL DEFAULT 0,
  sqt_is_upload_blocked BOOLEAN     NOT NULL DEFAULT FALSE,
  sqt_last_checked_at   TIMESTAMPTZ,
  sqt_created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  sqt_updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_amb_sub_storage_quotas_entities      FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id),
  CONSTRAINT fk_amb_sub_storage_quotas_subscriptions FOREIGN KEY (sbn_id) REFERENCES amb_sub_subscriptions(sbn_id),
  CONSTRAINT uq_amb_sub_storage_quotas_ent           UNIQUE (ent_id),
  CONSTRAINT ck_amb_sub_storage_quotas_used          CHECK (sqt_used_bytes >= 0),
  CONSTRAINT ck_amb_sub_storage_quotas_addon         CHECK (sqt_addon_gb >= 0)
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_storage_quotas_ent_id ON amb_sub_storage_quotas(ent_id);

-- ─────────────────────────────────────────
-- 6. amb_pg_subscriptions  (pgs_)
--    Polar.sh 구독 데이터 미러
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_pg_subscriptions (
  pgs_id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                      UUID         NOT NULL,
  sbn_id                      UUID         NOT NULL,
  pgs_polar_subscription_id   VARCHAR(200) NOT NULL,
  pgs_polar_customer_id       VARCHAR(200) NOT NULL,
  pgs_polar_product_id        VARCHAR(200),
  pgs_polar_price_id          VARCHAR(200),
  pgs_status                  VARCHAR(50)  NOT NULL,
  pgs_current_period_start    TIMESTAMPTZ,
  pgs_current_period_end      TIMESTAMPTZ,
  pgs_is_cancel_at_period_end BOOLEAN      NOT NULL DEFAULT FALSE,
  pgs_raw_data                JSONB,
  pgs_created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  pgs_updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT fk_amb_pg_subscriptions_entities      FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id),
  CONSTRAINT fk_amb_pg_subscriptions_subscriptions FOREIGN KEY (sbn_id) REFERENCES amb_sub_subscriptions(sbn_id),
  CONSTRAINT uq_amb_pg_subscriptions_polar_id      UNIQUE (pgs_polar_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_amb_pg_subscriptions_ent_id   ON amb_pg_subscriptions(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_pg_subscriptions_polar_id ON amb_pg_subscriptions(pgs_polar_subscription_id);

-- ─────────────────────────────────────────
-- 7. amb_pg_webhook_events  (pgw_)
--    Polar.sh 웹훅 이벤트 로그 (멱등성 보장)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_pg_webhook_events (
  pgw_id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  pgw_event_type     VARCHAR(100) NOT NULL,
  pgw_polar_event_id VARCHAR(200) NOT NULL,
  pgw_payload        JSONB        NOT NULL,
  pgw_status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  pgw_processed_at   TIMESTAMPTZ,
  pgw_error_message  TEXT,
  pgw_retry_count    INT          NOT NULL DEFAULT 0,
  pgw_created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT uq_amb_pg_webhook_events_polar_id UNIQUE (pgw_polar_event_id),
  CONSTRAINT ck_amb_pg_webhook_events_status   CHECK (pgw_status IN ('PENDING','PROCESSED','FAILED','IGNORED'))
);

CREATE INDEX IF NOT EXISTS idx_amb_pg_webhook_events_status     ON amb_pg_webhook_events(pgw_status);
CREATE INDEX IF NOT EXISTS idx_amb_pg_webhook_events_created_at ON amb_pg_webhook_events(pgw_created_at DESC);
