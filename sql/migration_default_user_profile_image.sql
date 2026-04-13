-- 기본 프로필 이미지 백필
-- 대상: usr_profile_image IS NULL 인 사용자
-- 비고: SVG를 bytea로 저장

BEGIN;

UPDATE amb_users
SET usr_profile_image = convert_to(
$$<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="profile">
  <rect width="128" height="128" rx="64" fill="#2563eb"/>
  <text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" fill="#ffffff">U</text>
</svg>$$,
'UTF8'
)
WHERE usr_profile_image IS NULL;

COMMIT;
