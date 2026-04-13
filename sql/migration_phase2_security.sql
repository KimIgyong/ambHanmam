-- Phase 2 보안조치 마이그레이션
-- 날짜: 2026-03-24
-- 적용 대상: 스테이징 / 프로덕션

-- P14: 계정 잠금 컬럼 (5회 실패 → 15분 잠금)
ALTER TABLE amb_users ADD COLUMN IF NOT EXISTS usr_failed_login_count integer DEFAULT 0 NOT NULL;
ALTER TABLE amb_users ADD COLUMN IF NOT EXISTS usr_locked_until timestamp;

-- P17: 데이터 변경 감사 로그 테이블
CREATE TABLE IF NOT EXISTS amb_data_audit_log (
  dal_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dal_user_id uuid,
  dal_action varchar(20) NOT NULL,
  dal_entity_name varchar(100) NOT NULL,
  dal_table_name varchar(100) NOT NULL,
  dal_record_id varchar(255) NOT NULL,
  dal_changes jsonb,
  dal_ip varchar(50),
  dal_created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dal_user_id ON amb_data_audit_log (dal_user_id);
CREATE INDEX IF NOT EXISTS idx_dal_entity_name ON amb_data_audit_log (dal_entity_name);
CREATE INDEX IF NOT EXISTS idx_dal_record_id ON amb_data_audit_log (dal_record_id);
