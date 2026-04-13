-- ============================================================
-- AMA Subscription Migration: Free Plan Token Update + Seed
-- 1) FREE 플랜 토큰을 20,000으로 업데이트
-- 2) 기존 법인에 FREE 구독 + 토큰 20,000 + 스토리지 1GB 일괄 생성
-- 실행 전: amb_sub_plans에 FREE 플랜이 있어야 함
-- ============================================================

-- Step 1: FREE 플랜 토큰을 20,000으로 업데이트
UPDATE amb_sub_plans
SET pln_token_onetime = 20000
WHERE pln_code = 'FREE';

-- Step 2: 기존 법인에 FREE 구독 일괄 생성
WITH free_plan AS (
  SELECT pln_id, pln_storage_base_gb, pln_storage_max_gb, pln_free_user_count
  FROM amb_sub_plans
  WHERE pln_code = 'FREE' AND pln_is_active = true
  LIMIT 1
),
entities AS (
  SELECT DISTINCT usr_company_id AS ent_id
  FROM amb_users
  WHERE usr_deleted_at IS NULL
    AND usr_company_id IS NOT NULL
    AND usr_company_id NOT IN (SELECT ent_id FROM amb_sub_subscriptions)
),
inserted_subs AS (
  INSERT INTO amb_sub_subscriptions (
    sbn_id, ent_id, pln_id, sbn_status, sbn_billing_cycle,
    sbn_user_count, sbn_paid_user_count
  )
  SELECT
    gen_random_uuid(), e.ent_id, fp.pln_id,
    'ACTIVE', 'MONTHLY', fp.pln_free_user_count, 0
  FROM entities e, free_plan fp
  RETURNING sbn_id, ent_id
),
inserted_quotas AS (
  INSERT INTO amb_sub_storage_quotas (
    sqt_id, ent_id, sbn_id, sqt_base_gb, sqt_max_gb
  )
  SELECT
    gen_random_uuid(), s.ent_id, s.sbn_id,
    fp.pln_storage_base_gb, fp.pln_storage_max_gb
  FROM inserted_subs s, free_plan fp
  RETURNING ent_id, sbn_id
)
INSERT INTO amb_sub_token_wallets (
  tkw_id, ent_id, sbn_id, tkw_token_type,
  tkw_balance, tkw_lifetime_granted
)
SELECT
  gen_random_uuid(), s.ent_id, s.sbn_id, 'BASE',
  20000, 20000
FROM inserted_subs s;
