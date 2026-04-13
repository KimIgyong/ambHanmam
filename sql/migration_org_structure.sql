-- ============================================================================
-- 조직 구조 마이그레이션: Department/Group → Unit/Cell/Team
-- ============================================================================
-- 실행 환경: PostgreSQL 15+
-- 작성일: 2026-02-28
-- 기반 문서: docs/analysis/REQ-조직구조마이그레이션분석-20260228.md
--           docs/plan/PLAN-조직구조마이그레이션-작업계획-20260228.md
-- 정책 결정: D-1~D-13 확정 반영
-- 방어적 설계: 컬럼/테이블 존재 여부를 확인하여 조건부 실행
-- ============================================================================

BEGIN;

-- 헬퍼 함수: 컬럼 존재 여부 확인 후 RENAME 또는 ADD
CREATE OR REPLACE FUNCTION _mig_rename_or_add_column(
  p_table TEXT, p_old_col TEXT, p_new_col TEXT, p_type TEXT DEFAULT NULL
) RETURNS void AS $fn$
BEGIN
  -- 테이블이 존재하지 않으면 스킵
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = p_table AND table_schema = 'public'
  ) THEN
    RETURN;
  END IF;
  -- 이미 new 컬럼이 존재하면 스킵
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table AND column_name = p_new_col
  ) THEN
    RETURN;
  END IF;
  -- old 컬럼이 존재하면 RENAME
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table AND column_name = p_old_col
  ) THEN
    EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', p_table, p_old_col, p_new_col);
    RETURN;
  END IF;
  -- 둘 다 없으면 ADD (p_type 필수)
  IF p_type IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_new_col, p_type);
  END IF;
END;
$fn$ LANGUAGE plpgsql;

-- 헬퍼 함수: 테이블 RENAME (존재 시)
CREATE OR REPLACE FUNCTION _mig_rename_table(p_old TEXT, p_new TEXT) RETURNS void AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = p_old) THEN
    EXECUTE format('ALTER TABLE %I RENAME TO %I', p_old, p_new);
  END IF;
END;
$fn$ LANGUAGE plpgsql;


-- ============================================================================
-- Phase 1: 핵심 테이블 리네이밍 (Department → Unit, Group → Cell)
-- ============================================================================

-- 1.1 amb_departments → amb_units
SELECT _mig_rename_or_add_column('amb_departments', 'dep_id', 'unt_id');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_name', 'unt_name');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_name_local', 'unt_name_local');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_parent_id', 'unt_parent_id');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_level', 'unt_level');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_is_active', 'unt_is_active');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_sort_order', 'unt_sort_order');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_created_at', 'unt_created_at');
SELECT _mig_rename_or_add_column('amb_departments', 'dep_updated_at', 'unt_updated_at');
SELECT _mig_rename_table('amb_departments', 'amb_units');

-- 1.2 amb_groups → amb_cells
SELECT _mig_rename_or_add_column('amb_groups', 'grp_id', 'cel_id');
SELECT _mig_rename_or_add_column('amb_groups', 'grp_name', 'cel_name');
SELECT _mig_rename_or_add_column('amb_groups', 'grp_description', 'cel_description');
SELECT _mig_rename_or_add_column('amb_groups', 'grp_created_at', 'cel_created_at');
SELECT _mig_rename_or_add_column('amb_groups', 'grp_updated_at', 'cel_updated_at');
SELECT _mig_rename_or_add_column('amb_groups', 'grp_deleted_at', 'cel_deleted_at');
SELECT _mig_rename_table('amb_groups', 'amb_cells');

-- 1.3 amb_user_dept_roles → amb_user_unit_roles
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_id', 'uur_id');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'dep_id', 'unt_id');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_role', 'uur_role');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_is_primary', 'uur_is_primary');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_started_at', 'uur_started_at');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_ended_at', 'uur_ended_at');
SELECT _mig_rename_or_add_column('amb_user_dept_roles', 'udr_created_at', 'uur_created_at');
SELECT _mig_rename_table('amb_user_dept_roles', 'amb_user_unit_roles');

-- 1.4 amb_user_groups → amb_user_cells (M-7)
SELECT _mig_rename_or_add_column('amb_user_groups', 'grp_id', 'cel_id');
SELECT _mig_rename_table('amb_user_groups', 'amb_user_cells');

-- 1.5 amb_menu_group_permissions → amb_menu_cell_permissions (C-3)
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'mgp_id', 'mcp_id');
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'mgp_menu_code', 'mcp_menu_code');
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'grp_id', 'cel_id');
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'mgp_accessible', 'mcp_accessible');
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'mgp_created_at', 'mcp_created_at');
SELECT _mig_rename_or_add_column('amb_menu_group_permissions', 'mgp_updated_at', 'mcp_updated_at');
SELECT _mig_rename_table('amb_menu_group_permissions', 'amb_menu_cell_permissions');


-- ============================================================================
-- Phase 2: FK 참조 컬럼 리네이밍 (group_id → cell_id)
-- ============================================================================

-- 2.1 amb_work_items: wit_group_id → wit_cell_id (C-4)
SELECT _mig_rename_or_add_column('amb_work_items', 'wit_group_id', 'wit_cell_id', 'uuid');

-- 2.2 amb_todos: tdo_group_id → tdo_cell_id (C-5)
SELECT _mig_rename_or_add_column('amb_todos', 'tdo_group_id', 'tdo_cell_id', 'uuid');

-- 2.3 amb_meeting_notes: mtn_group_id → mtn_cell_id (C-6)
SELECT _mig_rename_or_add_column('amb_meeting_notes', 'mtn_group_id', 'mtn_cell_id', 'uuid');

-- 2.4 amb_notices: ntc_group_id → ntc_cell_id (C-7)
SELECT _mig_rename_or_add_column('amb_notices', 'ntc_group_id', 'ntc_cell_id', 'uuid');

-- 2.5 amb_invitations: inv_group_id → inv_cell_id (H-8)
SELECT _mig_rename_or_add_column('amb_invitations', 'inv_group_id', 'inv_cell_id');

-- 2.6 amb_issues: iss_group_id → iss_cell_id (N-1)
SELECT _mig_rename_or_add_column('amb_issues', 'iss_group_id', 'iss_cell_id', 'uuid');


-- ============================================================================
-- Phase 3: department 컬럼 리네이밍 (정책 D-5, D-7, D-10)
-- ============================================================================

-- 3.1 amb_users: usr_department → usr_unit (D-7)
SELECT _mig_rename_or_add_column('amb_users', 'usr_department', 'usr_unit');

-- 3.2 amb_conversations: cvs_department → cvs_unit (D-7 연동)
SELECT _mig_rename_or_add_column('amb_conversations', 'cvs_department', 'cvs_unit');

-- 3.3 amb_meeting_notes: mtn_department → mtn_unit (D-5)
SELECT _mig_rename_or_add_column('amb_meeting_notes', 'mtn_department', 'mtn_unit');

-- 3.4 amb_notices: ntc_department → ntc_unit (D-5 확장)
SELECT _mig_rename_or_add_column('amb_notices', 'ntc_department', 'ntc_unit');

-- 3.5 amb_assets: ast_department → ast_unit (D-10)
SELECT _mig_rename_or_add_column('amb_assets', 'ast_department', 'ast_unit', 'varchar(30)');

-- 3.6 amb_invitations: inv_department → inv_unit (D-7 연동)
SELECT _mig_rename_or_add_column('amb_invitations', 'inv_department', 'inv_unit');

-- 3.7 amb_agent_configs: agc_department_code → agc_unit_code (D-6)
SELECT _mig_rename_or_add_column('amb_agent_configs', 'agc_department_code', 'agc_unit_code', 'varchar(30)');

-- 3.8 amb_agent_configs: agc_visible_group_ids → agc_visible_cell_ids (D-12)
SELECT _mig_rename_or_add_column('amb_agent_configs', 'agc_visible_group_ids', 'agc_visible_cell_ids', 'uuid[]');


-- ============================================================================
-- Phase 4: 데이터 값 마이그레이션
-- ============================================================================

-- 4.1 amb_work_items: visibility DEPARTMENT→UNIT, GROUP→CELL
UPDATE amb_work_items SET wit_visibility = 'UNIT' WHERE wit_visibility = 'DEPARTMENT';
UPDATE amb_work_items SET wit_visibility = 'CELL' WHERE wit_visibility = 'GROUP';

-- 4.2 amb_work_item_shares: target_type DEPARTMENT→UNIT
UPDATE amb_work_item_shares SET wis_target_type = 'UNIT' WHERE wis_target_type = 'DEPARTMENT';

-- 4.3 amb_todos: visibility GROUP→CELL
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='amb_todos' AND column_name='tdo_visibility') THEN
    EXECUTE 'UPDATE amb_todos SET tdo_visibility = ''CELL'' WHERE tdo_visibility = ''GROUP''';
  END IF;
END $b$;

-- 4.4 amb_meeting_notes: visibility GROUP→CELL, DEPARTMENT→UNIT
UPDATE amb_meeting_notes SET mtn_visibility = 'CELL' WHERE mtn_visibility = 'GROUP';
UPDATE amb_meeting_notes SET mtn_visibility = 'UNIT' WHERE mtn_visibility = 'DEPARTMENT';

-- 4.5 amb_notices: visibility DEPARTMENT→UNIT
UPDATE amb_notices SET ntc_visibility = 'UNIT' WHERE ntc_visibility = 'DEPARTMENT';

-- 4.6 amb_issues: visibility GROUP→CELL
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_issues') THEN
    EXECUTE 'UPDATE amb_issues SET iss_visibility = ''CELL'' WHERE iss_visibility = ''GROUP''';
  END IF;
END $b$;

-- 4.7 amb_calendars: visibility DEPARTMENT→UNIT
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_calendars') THEN
    EXECUTE 'UPDATE amb_calendars SET cal_visibility = ''UNIT'' WHERE cal_visibility = ''DEPARTMENT''';
  END IF;
END $b$;

-- 4.8 amb_user_unit_roles: role DEPARTMENT_HEAD→UNIT_HEAD
UPDATE amb_user_unit_roles SET uur_role = 'UNIT_HEAD' WHERE uur_role = 'DEPARTMENT_HEAD';

-- 4.9 amb_menu_permissions: menu code DEPARTMENTS→UNITS
UPDATE amb_menu_permissions SET mpm_menu_code = 'UNITS' WHERE mpm_menu_code = 'DEPARTMENTS';

-- 4.10 amb_user_menu_permissions: menu code DEPARTMENTS→UNITS
DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_user_menu_permissions') THEN
    EXECUTE 'UPDATE amb_user_menu_permissions SET ump_menu_code = ''UNITS'' WHERE ump_menu_code = ''DEPARTMENTS''';
  END IF;
END $b$;

-- 4.11 amb_access_audit_log: target_type DEPARTMENT→UNIT
UPDATE amb_access_audit_log SET aal_target_type = 'UNIT' WHERE aal_target_type = 'DEPARTMENT';


-- ============================================================================
-- Phase 5: 새 메뉴 권한 추가
-- ============================================================================

INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES ('TEAMS', 'ADMIN', TRUE), ('TEAMS', 'MANAGER', TRUE), ('TEAMS', 'USER', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES ('CELLS', 'ADMIN', TRUE), ('CELLS', 'MANAGER', TRUE), ('CELLS', 'USER', FALSE)
ON CONFLICT DO NOTHING;


-- ============================================================================
-- Phase 6: UNIQUE 제약 조정 (D-4: Entity 범위 UNIQUE)
-- ============================================================================

DO $b$
DECLARE
  v_conname TEXT;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'amb_cells'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
  LIMIT 1;

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE amb_cells DROP CONSTRAINT %I', v_conname);
  END IF;
END $b$;

-- ent_id 컬럼이 존재하는 경우에만 복합 UNIQUE 생성
DO $b$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amb_cells' AND column_name = 'ent_id'
  ) THEN
    EXECUTE 'ALTER TABLE amb_cells ADD CONSTRAINT uq_cells_ent_name UNIQUE (ent_id, cel_name)';
  ELSE
    -- ent_id가 없으면 cel_name 단독 UNIQUE 유지 (기존 상태)
    RAISE NOTICE 'amb_cells.ent_id does not exist, skipping composite UNIQUE';
  END IF;
END $b$;


-- ============================================================================
-- Phase 7: 마이그레이션 로그 기록
-- ============================================================================

DO $b$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='amb_migration_logs') THEN
    EXECUTE 'INSERT INTO amb_migration_logs (mgl_name, mgl_description, mgl_executed_at)
    VALUES (
      ''org_structure_dept_group_to_unit_cell'',
      ''Department→Unit, Group→Cell 조직 구조 리네이밍. 정책 D-1~D-13 반영.'',
      NOW()
    )';
  END IF;
END $b$;


-- ============================================================================
-- Cleanup: 헬퍼 함수 제거
-- ============================================================================
DROP FUNCTION IF EXISTS _mig_rename_or_add_column(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS _mig_rename_table(TEXT, TEXT);

COMMIT;
