-- ============================================================================
-- 조직 구조 마이그레이션 롤백: Unit/Cell/Team → Department/Group
-- ============================================================================
-- 실행 환경: PostgreSQL 15+
-- 작성일: 2026-02-28
-- 주의: migration_org_structure.sql의 정확한 역순
-- 방어적 설계: 컬럼/테이블 존재 여부를 확인하여 조건부 실행
-- ============================================================================

BEGIN;

-- 헬퍼 함수: 컬럼 존재 여부 확인 후 RENAME
CREATE OR REPLACE FUNCTION _mig_rename_or_add_column(
  p_table TEXT, p_old_col TEXT, p_new_col TEXT, p_type TEXT DEFAULT NULL
) RETURNS void AS $fn$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = p_table AND table_schema = 'public'
  ) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table AND column_name = p_new_col
  ) THEN
    RETURN;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table AND column_name = p_old_col
  ) THEN
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', p_table, p_old_col, p_new_col);
    RETURN;
  END IF;
  IF p_type IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_new_col, p_type);
  END IF;
END;
$fn$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION _mig_rename_table(p_old TEXT, p_new TEXT) RETURNS void AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = p_old) THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', p_old, p_new);
  END IF;
END;
$fn$ LANGUAGE plpgsql;


-- ============================================================================
-- Phase 7R: 마이그레이션 로그 삭제
-- ============================================================================

DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_migration_logs') THEN
    EXECUTE 'DELETE FROM amb_migration_logs WHERE mgl_name = ''org_structure_dept_group_to_unit_cell''';
  END IF;
END $b$;


-- ============================================================================
-- Phase 6R: UNIQUE 제약 복원
-- ============================================================================

DO $b$
BEGIN
  -- uq_cells_ent_name 제약이 있으면 드랍
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_cells_ent_name'
  ) THEN
    EXECUTE 'ALTER TABLE amb_cells DROP CONSTRAINT uq_cells_ent_name';
  END IF;
END $b$;


-- ============================================================================
-- Phase 5R: 추가된 메뉴 권한 삭제
-- ============================================================================

DELETE FROM amb_menu_permissions WHERE mpm_menu_code = 'TEAMS';
DELETE FROM amb_menu_permissions WHERE mpm_menu_code = 'CELLS';


-- ============================================================================
-- Phase 4R: 데이터 값 복원
-- ============================================================================

-- 4.11R
UPDATE amb_access_audit_log SET aal_target_type = 'DEPARTMENT' WHERE aal_target_type = 'UNIT';

-- 4.10R
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_user_menu_permissions') THEN
    EXECUTE 'UPDATE amb_user_menu_permissions SET ump_menu_code = ''DEPARTMENTS'' WHERE ump_menu_code = ''UNITS''';
  END IF;
END $b$;

-- 4.9R
UPDATE amb_menu_permissions SET mpm_menu_code = 'DEPARTMENTS' WHERE mpm_menu_code = 'UNITS';

-- 4.8R
UPDATE amb_user_unit_roles SET uur_role = 'DEPARTMENT_HEAD' WHERE uur_role = 'UNIT_HEAD';

-- 4.7R
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_calendars') THEN
    EXECUTE 'UPDATE amb_calendars SET cal_visibility = ''DEPARTMENT'' WHERE cal_visibility = ''UNIT''';
  END IF;
END $b$;

-- 4.6R
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_issues') THEN
    EXECUTE 'UPDATE amb_issues SET iss_visibility = ''GROUP'' WHERE iss_visibility = ''CELL''';
  END IF;
END $b$;

-- 4.5R
UPDATE amb_notices SET ntc_visibility = 'DEPARTMENT' WHERE ntc_visibility = 'UNIT';

-- 4.4R
UPDATE amb_meeting_notes SET mtn_visibility = 'DEPARTMENT' WHERE mtn_visibility = 'UNIT';
UPDATE amb_meeting_notes SET mtn_visibility = 'GROUP' WHERE mtn_visibility = 'CELL';

-- 4.3R
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='amb_todos' AND column_name='tdo_visibility') THEN
    EXECUTE 'UPDATE amb_todos SET tdo_visibility = ''GROUP'' WHERE tdo_visibility = ''CELL''';
  END IF;
END $b$;

-- 4.2R
UPDATE amb_work_item_shares SET wis_target_type = 'DEPARTMENT' WHERE wis_target_type = 'UNIT';

-- 4.1R
UPDATE amb_work_items SET wit_visibility = 'GROUP' WHERE wit_visibility = 'CELL';
UPDATE amb_work_items SET wit_visibility = 'DEPARTMENT' WHERE wit_visibility = 'UNIT';


-- ============================================================================
-- Phase 3R: department 컬럼 복원
-- ============================================================================

SELECT _mig_rename_or_add_column('amb_agent_configs', 'agc_visible_cell_ids', 'agc_visible_group_ids');
SELECT _mig_rename_or_add_column('amb_agent_configs', 'agc_unit_code', 'agc_department_code');
SELECT _mig_rename_or_add_column('amb_invitations', 'inv_unit', 'inv_department');
SELECT _mig_rename_or_add_column('amb_assets', 'ast_unit', 'ast_department');
SELECT _mig_rename_or_add_column('amb_notices', 'ntc_unit', 'ntc_department');
SELECT _mig_rename_or_add_column('amb_meeting_notes', 'mtn_unit', 'mtn_department');
SELECT _mig_rename_or_add_column('amb_conversations', 'cvs_unit', 'cvs_department');
SELECT _mig_rename_or_add_column('amb_users', 'usr_unit', 'usr_department');


-- ============================================================================
-- Phase 2R: FK 참조 컬럼 복원 (cell_id → group_id)
-- ============================================================================

SELECT _mig_rename_or_add_column('amb_issues', 'iss_cell_id', 'iss_group_id');
SELECT _mig_rename_or_add_column('amb_invitations', 'inv_cell_id', 'inv_group_id');
SELECT _mig_rename_or_add_column('amb_notices', 'ntc_cell_id', 'ntc_group_id');
SELECT _mig_rename_or_add_column('amb_meeting_notes', 'mtn_cell_id', 'mtn_group_id');
SELECT _mig_rename_or_add_column('amb_todos', 'tdo_cell_id', 'tdo_group_id');
SELECT _mig_rename_or_add_column('amb_work_items', 'wit_cell_id', 'wit_group_id');


-- ============================================================================
-- Phase 1R: 핵심 테이블 복원
-- ============================================================================

-- 1.5R amb_menu_cell_permissions → amb_menu_group_permissions
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'mcp_id', 'mgp_id');
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'mcp_menu_code', 'mgp_menu_code');
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'cel_id', 'grp_id');
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'mcp_accessible', 'mgp_accessible');
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'mcp_created_at', 'mgp_created_at');
SELECT _mig_rename_or_add_column('amb_menu_cell_permissions', 'mcp_updated_at', 'mgp_updated_at');
SELECT _mig_rename_table('amb_menu_cell_permissions', 'amb_menu_group_permissions');

-- 1.4R amb_user_cells → amb_user_groups
SELECT _mig_rename_or_add_column('amb_user_cells', 'cel_id', 'grp_id');
SELECT _mig_rename_table('amb_user_cells', 'amb_user_groups');

-- 1.3R amb_user_unit_roles → amb_user_dept_roles
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_id', 'udr_id');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'unt_id', 'dep_id');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_role', 'udr_role');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_is_primary', 'udr_is_primary');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_started_at', 'udr_started_at');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_ended_at', 'udr_ended_at');
SELECT _mig_rename_or_add_column('amb_user_unit_roles', 'uur_created_at', 'udr_created_at');
SELECT _mig_rename_table('amb_user_unit_roles', 'amb_user_dept_roles');

-- 1.2R amb_cells → amb_groups
SELECT _mig_rename_or_add_column('amb_cells', 'cel_id', 'grp_id');
SELECT _mig_rename_or_add_column('amb_cells', 'cel_name', 'grp_name');
SELECT _mig_rename_or_add_column('amb_cells', 'cel_description', 'grp_description');
SELECT _mig_rename_or_add_column('amb_cells', 'cel_created_at', 'grp_created_at');
SELECT _mig_rename_or_add_column('amb_cells', 'cel_updated_at', 'grp_updated_at');
SELECT _mig_rename_or_add_column('amb_cells', 'cel_deleted_at', 'grp_deleted_at');
SELECT _mig_rename_table('amb_cells', 'amb_groups');

-- 원래 grp_name UNIQUE 복원
DO $b$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_groups_name'
  ) THEN
    EXECUTE 'ALTER TABLE amb_groups ADD CONSTRAINT uq_groups_name UNIQUE (grp_name)';
  END IF;
END $b$;

-- 1.1R amb_units → amb_departments
SELECT _mig_rename_or_add_column('amb_units', 'unt_id', 'dep_id');
SELECT _mig_rename_or_add_column('amb_units', 'unt_name', 'dep_name');
SELECT _mig_rename_or_add_column('amb_units', 'unt_name_local', 'dep_name_local');
SELECT _mig_rename_or_add_column('amb_units', 'unt_parent_id', 'dep_parent_id');
SELECT _mig_rename_or_add_column('amb_units', 'unt_level', 'dep_level');
SELECT _mig_rename_or_add_column('amb_units', 'unt_is_active', 'dep_is_active');
SELECT _mig_rename_or_add_column('amb_units', 'unt_sort_order', 'dep_sort_order');
SELECT _mig_rename_or_add_column('amb_units', 'unt_created_at', 'dep_created_at');
SELECT _mig_rename_or_add_column('amb_units', 'unt_updated_at', 'dep_updated_at');
SELECT _mig_rename_table('amb_units', 'amb_departments');


-- ============================================================================
-- Cleanup: 헬퍼 함수 제거
-- ============================================================================
DROP FUNCTION IF EXISTS _mig_rename_or_add_column(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS _mig_rename_table(TEXT, TEXT);

COMMIT;
