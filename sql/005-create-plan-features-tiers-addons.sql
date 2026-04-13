-- ============================================================
-- Migration: Plan Features, Tiers, Addons
-- Date: 2026-04-07
-- Description: 가격 플랜 비교표, 티어, 애드온 테이블 생성 + 시드 데이터
-- ============================================================

-- ── 1. Plan Features (비교 항목) ────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_plan_features (
  plf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plf_feature_key VARCHAR(50) NOT NULL UNIQUE,
  plf_label_i18n_key VARCHAR(100) NOT NULL,
  plf_value_free VARCHAR(200),
  plf_value_basic VARCHAR(200),
  plf_value_premium VARCHAR(200),
  plf_is_check BOOLEAN DEFAULT FALSE,
  plf_highlight BOOLEAN DEFAULT FALSE,
  plf_sort_order INT DEFAULT 0,
  plf_is_active BOOLEAN DEFAULT TRUE,
  plf_created_at TIMESTAMP DEFAULT NOW(),
  plf_updated_at TIMESTAMP DEFAULT NOW()
);

-- ── 2. Plan Tiers (플랜별 티어 상세) ────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_plan_tiers (
  plt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pln_id UUID NOT NULL REFERENCES amb_sub_plans(pln_id) ON DELETE CASCADE,
  plt_tier_number INT NOT NULL,
  plt_users_min INT NOT NULL,
  plt_users_max INT NOT NULL,
  plt_monthly_price NUMERIC(10,2) NOT NULL,
  plt_annual_price NUMERIC(10,2) NOT NULL,
  plt_savings NUMERIC(10,2) DEFAULT 0,
  plt_tokens_monthly INT NOT NULL,
  plt_sort_order INT DEFAULT 0,
  plt_is_active BOOLEAN DEFAULT TRUE,
  plt_created_at TIMESTAMP DEFAULT NOW(),
  plt_updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_sub_plan_tiers_pln_id ON amb_sub_plan_tiers(pln_id);

-- ── 3. Plan Addons (ADD-ON 상품) ────────────────────────
CREATE TABLE IF NOT EXISTS amb_sub_plan_addons (
  pla_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pla_addon_key VARCHAR(50) NOT NULL UNIQUE,
  pla_label_i18n_key VARCHAR(100) NOT NULL,
  pla_value_free VARCHAR(200),
  pla_value_basic VARCHAR(200),
  pla_unit VARCHAR(50),
  pla_price VARCHAR(50),
  pla_sort_order INT DEFAULT 0,
  pla_is_active BOOLEAN DEFAULT TRUE,
  pla_created_at TIMESTAMP DEFAULT NOW(),
  pla_updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ── Features (14행 — Portal Comparison Table 기반) ──────
INSERT INTO amb_sub_plan_features (plf_feature_key, plf_label_i18n_key, plf_value_free, plf_value_basic, plf_value_premium, plf_is_check, plf_highlight, plf_sort_order)
VALUES
  ('monthly_price',      'pricing.comparison.monthly_price',      '$0',                     '$2 / user / mo',         'Contact us',    false, false, 1),
  ('user_config',        'pricing.comparison.user_config',        '1–5',                    '6–49 (5-user units)',     '50+',           false, false, 2),
  ('monthly_fee',        'pricing.comparison.monthly_fee',        '$0',                     '$10 ~ $88',              'Contact us',    false, false, 3),
  ('token_base',         'pricing.comparison.token_base',         '50,000T (one-time)',     '20,000T / user / mo',    'Contact us',    false, false, 4),
  ('token_add_method',   'pricing.comparison.token_add_method',   '10K units · $1/10K',    '50K units · $5/session', 'Contact us',    false, false, 5),
  ('token_reset',        'pricing.comparison.token_reset',        'None',                   'Monthly reset',          'Contact us',    false, true,  6),
  ('storage_base',       'pricing.comparison.storage_base',       '1GB',                    '3GB',                    'Contact us',    false, false, 7),
  ('storage_addon',      'pricing.comparison.storage_addon',      'N/A',                    '5GB · $1/GB',            'Contact us',    false, false, 8),
  ('storage_cap',        'pricing.comparison.storage_cap',        '1GB',                    '100GB max',              'Contact us',    false, false, 9),
  ('referral',           'pricing.comparison.referral',           'N/A',                    '50,000T',                'Contact us',    false, false, 10),
  ('annual_discount_row','pricing.comparison.annual_discount_row','—',                      '✓ (2 mo free)',          '✓',             false, false, 11),
  ('dedicated_support',  'pricing.comparison.dedicated_support',  '',                       '',                       '✓',             true,  false, 12),
  ('sla',                'pricing.comparison.sla',                '',                       '',                       '✓',             true,  false, 13),
  ('custom_integration', 'pricing.comparison.custom_integration', '',                       '',                       '✓',             true,  false, 14)
ON CONFLICT (plf_feature_key) DO NOTHING;

-- ── Tiers (9행 — BASIC 플랜 티어 상세) ──────────────────
-- BASIC 플랜 pln_id 조회 후 삽입
DO $$
DECLARE
  v_basic_plan_id UUID;
BEGIN
  SELECT pln_id INTO v_basic_plan_id FROM amb_sub_plans WHERE pln_code = 'BASIC';
  IF v_basic_plan_id IS NOT NULL THEN
    INSERT INTO amb_sub_plan_tiers (pln_id, plt_tier_number, plt_users_min, plt_users_max, plt_monthly_price, plt_annual_price, plt_savings, plt_tokens_monthly, plt_sort_order)
    VALUES
      (v_basic_plan_id, 1,  6, 10, 10, 100, 20,  100000, 1),
      (v_basic_plan_id, 2, 11, 15, 20, 200, 40,  200000, 2),
      (v_basic_plan_id, 3, 16, 20, 30, 300, 60,  300000, 3),
      (v_basic_plan_id, 4, 21, 25, 40, 400, 80,  400000, 4),
      (v_basic_plan_id, 5, 26, 30, 50, 500, 100, 500000, 5),
      (v_basic_plan_id, 6, 31, 35, 60, 600, 120, 600000, 6),
      (v_basic_plan_id, 7, 36, 40, 70, 700, 140, 700000, 7),
      (v_basic_plan_id, 8, 41, 45, 80, 800, 160, 800000, 8),
      (v_basic_plan_id, 9, 46, 49, 88, 880, 176, 880000, 9)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ── Addons (3행) ────────────────────────────────────────
INSERT INTO amb_sub_plan_addons (pla_addon_key, pla_label_i18n_key, pla_value_free, pla_value_basic, pla_unit, pla_price, pla_sort_order)
VALUES
  ('token_addon',    'pricing.addon.token_addon',    '10K T',   '50K T',   '10K tokens', '$1.00', 1),
  ('storage_addon',  'pricing.addon.storage_addon',  'N/A',     '5GB',     '1GB',        '$1.00', 2),
  ('referral_reward','pricing.addon.referral_reward', 'Applied', 'Applied', '50K tokens / 1x', 'Free', 3)
ON CONFLICT (pla_addon_key) DO NOTHING;
