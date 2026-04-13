-- ============================================================
-- Slack Integration: 메뉴 권한 마이그레이션
-- 문서: PLAN-Slack연동-Lobby-Chat-작업계획-20260322
-- ============================================================

-- 1. amb_menu_config: Slack 연동 메뉴 추가
INSERT INTO amb_menu_config (mcf_menu_code, mcf_enabled, mcf_sort_order, mcf_label_key, mcf_icon, mcf_path, mcf_category)
VALUES ('ENTITY_SLACK_INTEGRATION', true, 960, 'settings.entitySlack', 'MessageSquare', '/entity-settings/slack-integration', 'ENTITY_SETTINGS')
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- 2. amb_menu_permissions: 역할별 접근 권한
INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  ('ENTITY_SLACK_INTEGRATION', 'MASTER', true),
  ('ENTITY_SLACK_INTEGRATION', 'SUPER_ADMIN', true),
  ('ENTITY_SLACK_INTEGRATION', 'ADMIN', true),
  ('ENTITY_SLACK_INTEGRATION', 'MANAGER', false),
  ('ENTITY_SLACK_INTEGRATION', 'USER', false)
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;
