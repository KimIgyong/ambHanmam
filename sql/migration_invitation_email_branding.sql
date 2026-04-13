-- ============================================================
-- 초대 이메일 법인별 브랜딩 지원
-- 대상 테이블: amb_hr_entities
-- 작성일: 2026-03-06
-- 관련 요구사항: REQ-초대이메일법인별디자인-20260306
-- ============================================================

-- 법인 이메일 브랜딩 컬럼 추가 (무중단 마이그레이션 - nullable)
ALTER TABLE amb_hr_entities
  ADD COLUMN IF NOT EXISTS ent_email_display_name VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS ent_email_brand_color  VARCHAR(10)  NULL,
  ADD COLUMN IF NOT EXISTS ent_email_logo_url     VARCHAR(500) NULL;

COMMENT ON COLUMN amb_hr_entities.ent_email_display_name
  IS '초대 이메일 표시 법인명 (미설정 시 ent_name_en → ent_name 순으로 사용)';
COMMENT ON COLUMN amb_hr_entities.ent_email_brand_color
  IS '초대 이메일 브랜드 색상 (hex #RRGGBB, 미설정 시 #4F46E5 기본값 사용)';
COMMENT ON COLUMN amb_hr_entities.ent_email_logo_url
  IS '초대 이메일 로고 이미지 URL (미설정 시 텍스트 헤더로 폴백)';

-- 롤백 스크립트 (필요 시 실행)
-- ALTER TABLE amb_hr_entities
--   DROP COLUMN IF EXISTS ent_email_display_name,
--   DROP COLUMN IF EXISTS ent_email_brand_color,
--   DROP COLUMN IF EXISTS ent_email_logo_url;
