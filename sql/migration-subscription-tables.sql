-- ============================================================
-- Subscription Module DDL Migration
-- Tables: amb_sub_plans, amb_sub_subscriptions, 
--         amb_sub_token_wallets, amb_sub_token_ledgers,
--         amb_sub_storage_quotas
-- Date: 2026-04-07
-- ============================================================

-- 1. Plans
CREATE TABLE IF NOT EXISTS amb_sub_plans (
  pln_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pln_code            VARCHAR(20) NOT NULL UNIQUE,
  pln_name            VARCHAR(100) NOT NULL,
  pln_tier            VARCHAR(20) NOT NULL,

  -- Token policy
  pln_price_per_user        NUMERIC(10,4) NOT NULL DEFAULT 0,
  pln_token_onetime         INT NOT NULL DEFAULT 0,
  pln_token_per_user_monthly INT NOT NULL DEFAULT 0,
  pln_token_addon_unit      INT NOT NULL DEFAULT 10000,
  pln_token_addon_price     NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  pln_is_token_monthly_reset BOOLEAN NOT NULL DEFAULT false,

  -- Storage policy
  pln_storage_base_gb       INT NOT NULL DEFAULT 1,
  pln_storage_max_gb        INT NOT NULL DEFAULT 1,
  pln_storage_addon_unit_gb INT NOT NULL DEFAULT 0,
  pln_storage_addon_price_gb NUMERIC(10,4) NOT NULL DEFAULT 1.0,
  pln_storage_warn_pct      INT NOT NULL DEFAULT 100,
  pln_storage_block_pct     INT NOT NULL DEFAULT 120,

  -- User policy
  pln_max_users             INT NOT NULL DEFAULT 5,
  pln_min_users             INT NOT NULL DEFAULT 1,
  pln_user_slot_size        INT NOT NULL DEFAULT 5,
  pln_free_user_count       INT NOT NULL DEFAULT 5,

  -- Referral
  pln_is_referral_enabled   BOOLEAN NOT NULL DEFAULT true,
  pln_referral_reward_tokens INT NOT NULL DEFAULT 50000,
  pln_referral_invite_required INT NOT NULL DEFAULT 10,

  -- Annual billing
  pln_is_annual_available   BOOLEAN NOT NULL DEFAULT false,
  pln_annual_free_months    INT NOT NULL DEFAULT 0,

  -- Meta
  pln_is_active             BOOLEAN NOT NULL DEFAULT true,
  pln_sort_order            INT NOT NULL DEFAULT 0,
  pln_created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  pln_updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  pln_deleted_at            TIMESTAMP
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS amb_sub_subscriptions (
  sbn_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                    UUID NOT NULL,
  pln_id                    UUID NOT NULL REFERENCES amb_sub_plans(pln_id),
  sbn_status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  sbn_billing_cycle         VARCHAR(10) NOT NULL DEFAULT 'MONTHLY',
  sbn_user_count            INT NOT NULL DEFAULT 5,
  sbn_paid_user_count       INT NOT NULL DEFAULT 0,
  sbn_current_period_start  TIMESTAMPTZ,
  sbn_current_period_end    TIMESTAMPTZ,
  sbn_trial_end_at          TIMESTAMPTZ,
  sbn_cancelled_at          TIMESTAMPTZ,
  sbn_is_cancel_scheduled   BOOLEAN NOT NULL DEFAULT false,
  sbn_pg_subscription_id    VARCHAR(200),
  sbn_pg_customer_id        VARCHAR(200),
  sbn_created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  sbn_updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  sbn_deleted_at            TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_subscriptions_ent_id ON amb_sub_subscriptions(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_subscriptions_status ON amb_sub_subscriptions(sbn_status);

-- 3. Token Wallets
CREATE TABLE IF NOT EXISTS amb_sub_token_wallets (
  tkw_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                    UUID NOT NULL,
  sbn_id                    UUID NOT NULL REFERENCES amb_sub_subscriptions(sbn_id),
  tkw_token_type            VARCHAR(20) NOT NULL,
  tkw_balance               INT NOT NULL DEFAULT 0,
  tkw_lifetime_granted      INT NOT NULL DEFAULT 0,
  tkw_lifetime_consumed     INT NOT NULL DEFAULT 0,
  tkw_last_reset_at         TIMESTAMPTZ,
  tkw_next_reset_at         TIMESTAMPTZ,
  tkw_created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  tkw_updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_token_wallets_ent_id ON amb_sub_token_wallets(ent_id);

-- 4. Token Ledgers
CREATE TABLE IF NOT EXISTS amb_sub_token_ledgers (
  tkl_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                    UUID NOT NULL,
  tkw_id                    UUID NOT NULL REFERENCES amb_sub_token_wallets(tkw_id),
  tkl_token_type            VARCHAR(20) NOT NULL,
  tkl_direction             VARCHAR(10) NOT NULL,
  tkl_amount                INT NOT NULL,
  tkl_balance_after         INT NOT NULL,
  tkl_reason                VARCHAR(50) NOT NULL,
  tkl_ref_id                VARCHAR(200),
  tkl_meta                  JSONB,
  tkl_created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_ent_id ON amb_sub_token_ledgers(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_tkw_id ON amb_sub_token_ledgers(tkw_id);
CREATE INDEX IF NOT EXISTS idx_amb_sub_token_ledgers_created_at ON amb_sub_token_ledgers(tkl_created_at);

-- 5. Storage Quotas
CREATE TABLE IF NOT EXISTS amb_sub_storage_quotas (
  sqt_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                    UUID NOT NULL UNIQUE,
  sbn_id                    UUID NOT NULL REFERENCES amb_sub_subscriptions(sbn_id),
  sqt_base_gb               INT NOT NULL DEFAULT 1,
  sqt_addon_gb              INT NOT NULL DEFAULT 0,
  sqt_max_gb                INT NOT NULL DEFAULT 1,
  sqt_used_bytes            BIGINT NOT NULL DEFAULT 0,
  sqt_is_upload_blocked     BOOLEAN NOT NULL DEFAULT false,
  sqt_last_checked_at       TIMESTAMPTZ,
  sqt_created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  sqt_updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_storage_quotas_ent_id ON amb_sub_storage_quotas(ent_id);

-- ============================================================
-- Seed: Default Plans (FREE / BASIC / PREMIUM)
-- ============================================================

INSERT INTO amb_sub_plans (
  pln_code, pln_name, pln_tier,
  pln_price_per_user,
  pln_token_onetime, pln_token_per_user_monthly,
  pln_token_addon_unit, pln_token_addon_price,
  pln_is_token_monthly_reset,
  pln_storage_base_gb, pln_storage_max_gb,
  pln_storage_addon_unit_gb, pln_storage_addon_price_gb,
  pln_storage_warn_pct, pln_storage_block_pct,
  pln_max_users, pln_min_users, pln_user_slot_size, pln_free_user_count,
  pln_is_referral_enabled, pln_referral_reward_tokens, pln_referral_invite_required,
  pln_is_annual_available, pln_annual_free_months,
  pln_is_active, pln_sort_order
) VALUES
  -- FREE Plan
  ('FREE', 'Free', 'FREE',
   0, 50000, 0,
   10000, 1.0,
   false,
   1, 1,
   0, 0,
   100, 120,
   5, 1, 5, 5,
   true, 50000, 10,
   false, 0,
   true, 1),
  -- BASIC Plan
  ('BASIC', 'Basic', 'BASIC',
   5.0, 100000, 10000,
   10000, 0.8,
   true,
   10, 50,
   5, 0.5,
   80, 100,
   50, 1, 5, 5,
   true, 50000, 10,
   true, 2,
   true, 2),
  -- PREMIUM Plan
  ('PREMIUM', 'Premium', 'PREMIUM',
   10.0, 500000, 50000,
   50000, 0.5,
   true,
   50, 500,
   10, 0.3,
   80, 100,
   500, 1, 10, 10,
   true, 100000, 5,
   true, 3,
   true, 3)
ON CONFLICT (pln_code) DO NOTHING;
