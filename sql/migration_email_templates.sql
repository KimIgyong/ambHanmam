-- Migration: Email Templates
-- Date: 2026-03-11
-- Description: 이메일 템플릿 관리 테이블 생성
--   - ent_id IS NULL → ADMIN 전역 템플릿 (ACCOUNT_CREATED)
--   - ent_id IS NOT NULL → 법인별 템플릿 (INVITATION)

CREATE TABLE IF NOT EXISTS amb_email_templates (
  emt_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id         UUID REFERENCES amb_hr_entities(ent_id) ON DELETE CASCADE,
  emt_code       VARCHAR(50)  NOT NULL,
  emt_subject    VARCHAR(500) NOT NULL,
  emt_body       TEXT         NOT NULL,
  emt_updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  emt_updated_by UUID
);

-- NULLS NOT DISTINCT: NULL ent_id도 unique 비교 대상에 포함 (PostgreSQL 15+)
ALTER TABLE amb_email_templates
  ADD CONSTRAINT uq_email_template UNIQUE NULLS NOT DISTINCT (ent_id, emt_code);

COMMENT ON TABLE amb_email_templates IS '이메일 템플릿 (ent_id NULL=전역/ADMIN, NOT NULL=법인/MASTER)';
COMMENT ON COLUMN amb_email_templates.emt_code IS 'ACCOUNT_CREATED | INVITATION';
COMMENT ON COLUMN amb_email_templates.emt_body IS 'HTML 템플릿. 변수: {{userName}} {{userEmail}} {{tempPassword}} {{loginUrl}} {{entityName}} {{role}} {{inviterName}} {{department}} {{inviteLink}} {{companyName}}';
