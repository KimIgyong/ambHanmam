-- ================================================================
-- App Store OAuth Client Registration
-- 스테이징 + 프로덕션 App Store를 OAuth 클라이언트로 등록
-- ================================================================

-- 1) "Amoeba" 내부 파트너 조직이 없으면 생성
INSERT INTO amb_partners (ptn_id, ptn_code, ptn_company_name, ptn_status)
SELECT gen_random_uuid(), 'AMOEBA_INTERNAL', 'Amoeba (Internal)', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM amb_partners WHERE ptn_code = 'AMOEBA_INTERNAL');

-- 2) App Store (Production) OAuth Client 등록
INSERT INTO amb_partner_apps (
    pap_id, ptn_id, pap_code, pap_name, pap_description,
    pap_url, pap_auth_mode, pap_open_mode, pap_category,
    pap_status, pap_version,
    pap_redirect_uris, pap_scopes,
    pap_registered_by
)
SELECT
    gen_random_uuid(),
    p.ptn_id,
    'app_store_prod',
    'App Store',
    'Amoeba App Store - Production',
    'https://apps.amoeba.site',
    'oauth2',
    'iframe',
    'PLATFORM',
    'PUBLISHED',
    '1.0.0',
    ARRAY['https://apps.amoeba.site/callback', 'https://apps.amoeba.site/auth/callback'],
    ARRAY['profile', 'entity:read', 'offline_access'],
    '00000000-0000-0000-0000-000000000000'
FROM amb_partners p
WHERE p.ptn_code = 'AMOEBA_INTERNAL'
AND NOT EXISTS (SELECT 1 FROM amb_partner_apps WHERE pap_code = 'app_store_prod');

-- 3) App Store (Staging) OAuth Client 등록
INSERT INTO amb_partner_apps (
    pap_id, ptn_id, pap_code, pap_name, pap_description,
    pap_url, pap_auth_mode, pap_open_mode, pap_category,
    pap_status, pap_version,
    pap_redirect_uris, pap_scopes,
    pap_registered_by
)
SELECT
    gen_random_uuid(),
    p.ptn_id,
    'app_store_stg',
    'App Store (Staging)',
    'Amoeba App Store - Staging',
    'https://stg-apps.amoeba.site',
    'oauth2',
    'iframe',
    'PLATFORM',
    'PUBLISHED',
    '1.0.0',
    ARRAY['https://stg-apps.amoeba.site/callback', 'https://stg-apps.amoeba.site/auth/callback'],
    ARRAY['profile', 'entity:read', 'offline_access'],
    '00000000-0000-0000-0000-000000000000'
FROM amb_partners p
WHERE p.ptn_code = 'AMOEBA_INTERNAL'
AND NOT EXISTS (SELECT 1 FROM amb_partner_apps WHERE pap_code = 'app_store_stg');

-- 확인
SELECT pap_id, pap_code, pap_name, pap_auth_mode, pap_status, pap_redirect_uris, pap_scopes
FROM amb_partner_apps
WHERE pap_code IN ('app_store_prod', 'app_store_stg');
