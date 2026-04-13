-- Migration: ADMIN_LEVEL 설정 메뉴 경로 /settings/* → /admin/* 변경
-- Date: 2026-03-08
-- Description: amb_menu_config 테이블의 mcf_path 값을 /settings/* → /admin/* 로 업데이트
--              /service/* → /admin/service/*, /site/* → /admin/site/*

-- 1. /settings/* → /admin/*
UPDATE amb_menu_config
SET mcf_path = REPLACE(mcf_path, '/settings/', '/admin/')
WHERE mcf_path LIKE '/settings/%';

UPDATE amb_menu_config
SET mcf_path = '/admin'
WHERE mcf_path = '/settings';

-- 2. /service/* → /admin/service/*
UPDATE amb_menu_config
SET mcf_path = REPLACE(mcf_path, '/service/', '/admin/service/')
WHERE mcf_path LIKE '/service/%';

-- 3. /site/* → /admin/site/*
UPDATE amb_menu_config
SET mcf_path = REPLACE(mcf_path, '/site/', '/admin/site/')
WHERE mcf_path LIKE '/site/%';

-- Verify
SELECT mcf_code, mcf_label_key, mcf_path, mcf_category
FROM amb_menu_config
WHERE mcf_path LIKE '/admin%'
   OR mcf_path LIKE '/settings%'
   OR mcf_path LIKE '/service%'
   OR mcf_path LIKE '/site%'
ORDER BY mcf_sort_order;
