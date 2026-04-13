-- Migration: Group-based menu permissions + member editing + invitation log
-- Date: 2026-02-23

-- 1. 메뉴-그룹 권한 테이블
CREATE TABLE IF NOT EXISTS amb_menu_group_permissions (
  mgp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mgp_menu_code VARCHAR(50) NOT NULL,
  grp_id UUID NOT NULL REFERENCES amb_groups(grp_id) ON DELETE CASCADE,
  mgp_accessible BOOLEAN NOT NULL DEFAULT true,
  mgp_created_at TIMESTAMP DEFAULT now(),
  mgp_updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(mgp_menu_code, grp_id)
);

CREATE INDEX IF NOT EXISTS idx_mgp_menu_code ON amb_menu_group_permissions(mgp_menu_code);
CREATE INDEX IF NOT EXISTS idx_mgp_grp_id ON amb_menu_group_permissions(grp_id);

-- 2. 직무 컬럼 추가
ALTER TABLE amb_users ADD COLUMN IF NOT EXISTS usr_job_title VARCHAR(100) DEFAULT NULL;

-- 3. 초대 메일 발송 로그 컬럼 추가
ALTER TABLE amb_invitations ADD COLUMN IF NOT EXISTS inv_last_sent_at TIMESTAMP DEFAULT NULL;
ALTER TABLE amb_invitations ADD COLUMN IF NOT EXISTS inv_send_count INTEGER DEFAULT 0;

-- 4. 기존 초대의 발송 로그 초기값 설정 (inv_created_at 기반)
UPDATE amb_invitations
SET inv_last_sent_at = inv_created_at, inv_send_count = 1
WHERE inv_last_sent_at IS NULL;
