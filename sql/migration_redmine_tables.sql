-- ============================================================
-- Redmine 마이그레이션 전용 테이블
-- 작성일: 2025-02-25
-- ============================================================

BEGIN;

-- 사용자 매핑 테이블
CREATE TABLE IF NOT EXISTS amb_migration_user_map (
  redmine_user_id INT PRIMARY KEY,
  amb_user_id UUID NOT NULL REFERENCES amb_users(usr_id),
  redmine_login VARCHAR(100),
  redmine_email VARCHAR(200),
  mapped_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마이그레이션 로그
CREATE TABLE IF NOT EXISTS amb_migration_logs (
  mgl_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mgl_batch_id UUID NOT NULL,
  mgl_source VARCHAR(20) NOT NULL DEFAULT 'REDMINE',
  mgl_entity_type VARCHAR(20) NOT NULL,
  mgl_source_id INT NOT NULL,
  mgl_target_id UUID NULL,
  mgl_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  mgl_error_message TEXT NULL,
  mgl_created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_logs_source
  ON amb_migration_logs(mgl_source, mgl_entity_type, mgl_source_id);

CREATE INDEX IF NOT EXISTS idx_migration_logs_batch
  ON amb_migration_logs(mgl_batch_id);

COMMIT;
