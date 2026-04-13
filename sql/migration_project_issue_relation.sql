-- ============================================
-- Migration: 프로젝트-이슈 관계 설정 및 이슈 타입 확장
-- Date: 2026-02-25
-- Req: R3, R4, R5, R7, R8
-- ============================================

BEGIN;

-- [R5] 이슈 테이블에 프로젝트 FK 추가
ALTER TABLE amb_issues
  ADD COLUMN IF NOT EXISTS pjt_id UUID NULL;

ALTER TABLE amb_issues
  ADD CONSTRAINT fk_issues_project
  FOREIGN KEY (pjt_id) REFERENCES kms_projects(pjt_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_amb_issues_pjt_id ON amb_issues(pjt_id);

-- [R8] 레드마인 마이그레이션 호환 컬럼 (이슈)
ALTER TABLE amb_issues
  ADD COLUMN IF NOT EXISTS iss_redmine_id INT NULL,
  ADD COLUMN IF NOT EXISTS iss_start_date DATE NULL,
  ADD COLUMN IF NOT EXISTS iss_due_date DATE NULL,
  ADD COLUMN IF NOT EXISTS iss_done_ratio INT DEFAULT 0;

ALTER TABLE amb_issues
  ADD CONSTRAINT chk_done_ratio CHECK (iss_done_ratio BETWEEN 0 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS idx_issues_redmine_id
  ON amb_issues(iss_redmine_id) WHERE iss_redmine_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_issues_dates
  ON amb_issues(iss_start_date, iss_due_date);

-- [R7] 이슈 타입 마이그레이션: FEATURE/ENHANCEMENT → FEATURE_REQUEST
UPDATE amb_issues SET iss_type = 'FEATURE_REQUEST' WHERE iss_type IN ('FEATURE', 'ENHANCEMENT');

-- [R8] 프로젝트 테이블 확장 (레드마인 호환 + 계층)
ALTER TABLE kms_projects
  ADD COLUMN IF NOT EXISTS pjt_redmine_id INT NULL,
  ADD COLUMN IF NOT EXISTS pjt_parent_id UUID NULL;

ALTER TABLE kms_projects
  ADD CONSTRAINT fk_projects_parent
  FOREIGN KEY (pjt_parent_id) REFERENCES kms_projects(pjt_id)
  ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_redmine_id
  ON kms_projects(pjt_redmine_id) WHERE pjt_redmine_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_parent
  ON kms_projects(pjt_parent_id);

COMMIT;
