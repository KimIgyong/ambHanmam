-- ================================================
-- 포탈 회원가입 GDPR 약관동의 - DB 마이그레이션
-- 대상: amb_svc_portal_customers 테이블
-- 날짜: 2026-03-28
-- ================================================

-- 약관 동의 일시
ALTER TABLE amb_svc_portal_customers
  ADD COLUMN IF NOT EXISTS pct_terms_agreed_at TIMESTAMPTZ DEFAULT NULL;

-- 개인정보처리방침 동의 일시
ALTER TABLE amb_svc_portal_customers
  ADD COLUMN IF NOT EXISTS pct_privacy_agreed_at TIMESTAMPTZ DEFAULT NULL;

-- 마케팅 수신 동의 일시
ALTER TABLE amb_svc_portal_customers
  ADD COLUMN IF NOT EXISTS pct_marketing_agreed_at TIMESTAMPTZ DEFAULT NULL;

-- 약관 버전
ALTER TABLE amb_svc_portal_customers
  ADD COLUMN IF NOT EXISTS pct_terms_version VARCHAR(20) DEFAULT NULL;

-- 개인정보처리방침 버전
ALTER TABLE amb_svc_portal_customers
  ADD COLUMN IF NOT EXISTS pct_privacy_version VARCHAR(20) DEFAULT NULL;

-- 확인
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'amb_svc_portal_customers'
--   AND column_name LIKE 'pct_%agreed%' OR column_name LIKE 'pct_%version%'
-- ORDER BY ordinal_position;
