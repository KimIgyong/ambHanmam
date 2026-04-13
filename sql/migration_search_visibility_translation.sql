-- ============================================================
-- 통합 검색 · 공개 설정 · 번역 에이전트 확대 마이그레이션
-- 작업계획서: PLAN-Search-Visibility-Translation-작업계획-20260223
-- 실행일: 2026-02-23
-- ============================================================

BEGIN;

-- ============================================================
-- 1. amb_work_items: 그룹 참조 추가 + 인덱스
-- ============================================================
ALTER TABLE amb_work_items
  ADD COLUMN IF NOT EXISTS wit_group_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_work_items_group ON amb_work_items(wit_group_id);
CREATE INDEX IF NOT EXISTS idx_work_items_visibility ON amb_work_items(wit_visibility);

-- ============================================================
-- 2. amb_todos: visibility + group_id 추가
-- ============================================================
ALTER TABLE amb_todos
  ADD COLUMN IF NOT EXISTS tdo_visibility VARCHAR(20) DEFAULT 'PRIVATE',
  ADD COLUMN IF NOT EXISTS tdo_group_id UUID NULL;

-- ============================================================
-- 3. amb_issues: visibility + group_id + original_lang 추가
-- ============================================================
ALTER TABLE amb_issues
  ADD COLUMN IF NOT EXISTS iss_visibility VARCHAR(20) DEFAULT 'ENTITY',
  ADD COLUMN IF NOT EXISTS iss_group_id UUID NULL,
  ADD COLUMN IF NOT EXISTS iss_original_lang VARCHAR(5) DEFAULT 'ko';

-- ============================================================
-- 4. amb_meeting_notes: group_id 추가 (mtn_department는 유지)
-- ============================================================
ALTER TABLE amb_meeting_notes
  ADD COLUMN IF NOT EXISTS mtn_group_id UUID NULL;

-- ============================================================
-- 5. amb_notices: group_id 추가 (ntc_department는 유지)
-- ============================================================
ALTER TABLE amb_notices
  ADD COLUMN IF NOT EXISTS ntc_group_id UUID NULL;

-- ============================================================
-- 6. 번역 대상 모듈 original_lang 추가
-- ============================================================
ALTER TABLE kms_projects
  ADD COLUMN IF NOT EXISTS pjt_original_lang VARCHAR(5) DEFAULT 'ko';

ALTER TABLE amb_bil_partners
  ADD COLUMN IF NOT EXISTS ptn_original_lang VARCHAR(5) DEFAULT 'ko';

ALTER TABLE amb_bil_contracts
  ADD COLUMN IF NOT EXISTS ctr_original_lang VARCHAR(5) DEFAULT 'ko';

ALTER TABLE amb_svc_clients
  ADD COLUMN IF NOT EXISTS cli_original_lang VARCHAR(5) DEFAULT 'ko';

COMMIT;
