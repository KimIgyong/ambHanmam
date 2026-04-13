-- Asana Integration Migration
-- Date: 2026-03-23

-- 1. Asana 프로젝트 매핑 테이블
CREATE TABLE IF NOT EXISTS amb_asana_project_mappings (
  apm_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                UUID NOT NULL,
  apm_asana_project_gid VARCHAR(50) NOT NULL,
  apm_asana_project_name VARCHAR(200),
  apm_asana_workspace_gid VARCHAR(50),
  pjt_id                UUID,
  apm_status            VARCHAR(20) DEFAULT 'ACTIVE',
  apm_last_synced_at    TIMESTAMP,
  apm_created_at        TIMESTAMP DEFAULT NOW(),
  apm_updated_at        TIMESTAMP DEFAULT NOW(),
  apm_deleted_at        TIMESTAMP,
  UNIQUE(ent_id, apm_asana_project_gid)
);

-- 2. Asana 태스크 매핑 테이블
CREATE TABLE IF NOT EXISTS amb_asana_task_mappings (
  atm_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apm_id                UUID NOT NULL REFERENCES amb_asana_project_mappings(apm_id),
  atm_asana_task_gid    VARCHAR(50) NOT NULL,
  iss_id                UUID NOT NULL,
  atm_created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(apm_id, atm_asana_task_gid)
);

-- 3. 이슈 테이블에 Asana GID 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amb_issues' AND column_name = 'iss_asana_gid'
  ) THEN
    ALTER TABLE amb_issues ADD COLUMN iss_asana_gid VARCHAR(50);
  END IF;
END $$;
