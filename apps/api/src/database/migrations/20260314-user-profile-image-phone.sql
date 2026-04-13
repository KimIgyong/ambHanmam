-- 마이페이지 프로필 이미지 및 비상연락처 필드 추가
-- 2026-03-14

ALTER TABLE amb_users
  ADD COLUMN IF NOT EXISTS usr_phone         VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS usr_profile_image BYTEA        DEFAULT NULL;
