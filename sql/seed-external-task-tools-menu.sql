-- ============================================================================
-- External Task Tools 메뉴 시드 SQL
-- Date: 2026-03-22
-- ============================================================================

-- 메뉴 설정
INSERT INTO amb_menu_config (mcf_id, mcf_menu_code, mcf_label_key, mcf_icon, mcf_path, mcf_category, mcf_enabled, mcf_sort_order, mcf_updated_at)
VALUES (uuid_generate_v4(), 'ENTITY_EXTERNAL_TASK_TOOLS', 'entitySettings:externalTaskTools.title', 'Link2', '/entity-settings/external-task-tools', 'ENTITY', true, 965, now())
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- 메뉴 권한 (SUPER_ADMIN, ADMIN, MASTER, MANAGER)
INSERT INTO amb_menu_permissions (mpm_id, mpm_menu_code, mpm_role, mpm_accessible, mpm_created_at, mpm_updated_at) VALUES
  (uuid_generate_v4(), 'ENTITY_EXTERNAL_TASK_TOOLS', 'SUPER_ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'ENTITY_EXTERNAL_TASK_TOOLS', 'ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'ENTITY_EXTERNAL_TASK_TOOLS', 'MASTER', true, now(), now()),
  (uuid_generate_v4(), 'ENTITY_EXTERNAL_TASK_TOOLS', 'MANAGER', true, now(), now())
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;
