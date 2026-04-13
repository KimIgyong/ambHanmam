-- ============================================================
-- AMA Subscription SEED Data
-- FREE / BASIC / PREMIUM 요금제 초기 데이터
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
  pln_is_annual_available, pln_annual_free_months, pln_sort_order
) VALUES
-- FREE
(
  'FREE', 'Free', 'FREE',
  0,
  20000, 0,
  10000, 1.0,
  FALSE,
  1, 1,
  0, 1.0,
  100, 120,
  5, 1, 5, 5,
  TRUE, 50000, 10,
  FALSE, 0, 1
),
-- BASIC
(
  'BASIC', 'Basic', 'BASIC',
  2.0,
  0, 20000,
  50000, 1.0,
  TRUE,
  3, 100,
  5, 1.0,
  100, 120,
  49, 6, 5, 5,
  TRUE, 50000, 10,
  TRUE, 2, 2
),
-- PREMIUM (placeholder)
(
  'PREMIUM', 'Premium', 'PREMIUM',
  0,
  0, 0,
  0, 0,
  FALSE,
  0, 0,
  0, 0,
  100, 120,
  9999, 50, 1, 5,
  TRUE, 50000, 10,
  TRUE, 2, 3
)
ON CONFLICT (pln_code) DO NOTHING;
