-- =====================================================
-- Migration: User Group & Permission System
-- Date: 2026-02-22
-- Description: 조직 계층, 사용자 그룹/역할/상태 확장
-- =====================================================

-- =====================================================
-- 1. amb_hr_entities: 계층 구조 컬럼 추가
-- =====================================================
ALTER TABLE amb_hr_entities
ADD COLUMN IF NOT EXISTS ent_level VARCHAR(20) DEFAULT 'SUBSIDIARY',
ADD COLUMN IF NOT EXISTS ent_parent_id UUID REFERENCES amb_hr_entities(ent_id),
ADD COLUMN IF NOT EXISTS ent_is_hq BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ent_sort_order INT DEFAULT 0;

-- HQ 조직 생성 (없으면)
INSERT INTO amb_hr_entities (ent_code, ent_name, ent_name_en, ent_country, ent_currency, ent_level, ent_is_hq, ent_sort_order)
SELECT 'HQ', 'Amoeba HQ', 'Amoeba HQ', 'GL', 'USD', 'ROOT', true, 0
WHERE NOT EXISTS (SELECT 1 FROM amb_hr_entities WHERE ent_code = 'HQ');

-- 기존 데이터 매핑: HQ를 ROOT로 설정
UPDATE amb_hr_entities SET
  ent_level = 'ROOT',
  ent_is_hq = true,
  ent_parent_id = NULL
WHERE ent_code = 'HQ';

-- 하위 법인은 HQ를 부모로 설정
UPDATE amb_hr_entities SET
  ent_level = 'SUBSIDIARY',
  ent_is_hq = false,
  ent_parent_id = (SELECT ent_id FROM amb_hr_entities WHERE ent_code = 'HQ' LIMIT 1)
WHERE ent_code != 'HQ' AND ent_parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_hr_entities_parent ON amb_hr_entities(ent_parent_id);
CREATE INDEX IF NOT EXISTS idx_hr_entities_level ON amb_hr_entities(ent_level);
CREATE INDEX IF NOT EXISTS idx_hr_entities_is_hq ON amb_hr_entities(ent_is_hq);

-- =====================================================
-- 2. amb_users: 그룹/역할/상태 컬럼 추가
-- =====================================================
ALTER TABLE amb_users
ADD COLUMN IF NOT EXISTS usr_group_code VARCHAR(30) DEFAULT 'USER_GROUP',
ADD COLUMN IF NOT EXISTS usr_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS usr_must_change_pw BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS usr_join_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS usr_company_id UUID REFERENCES amb_hr_entities(ent_id),
ADD COLUMN IF NOT EXISTS usr_approved_by UUID,
ADD COLUMN IF NOT EXISTS usr_approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS usr_invited_by UUID,
ADD COLUMN IF NOT EXISTS usr_last_login_at TIMESTAMP;

-- 기존 ADMIN → ADMIN_GROUP / SUPER_ADMIN / HQ 소속
UPDATE amb_users SET
  usr_group_code = 'ADMIN_GROUP',
  usr_role = 'SUPER_ADMIN',
  usr_status = 'ACTIVE',
  usr_company_id = (SELECT ent_id FROM amb_hr_entities WHERE ent_is_hq = true LIMIT 1)
WHERE usr_role = 'ADMIN' AND usr_deleted_at IS NULL;

-- 기존 USER → USER_GROUP / MEMBER
UPDATE amb_users SET
  usr_group_code = 'USER_GROUP',
  usr_role = 'MEMBER',
  usr_status = 'ACTIVE'
WHERE usr_role = 'USER' AND usr_deleted_at IS NULL;

-- 기존 MANAGER → USER_GROUP / MANAGER
UPDATE amb_users SET
  usr_group_code = 'USER_GROUP',
  usr_status = 'ACTIVE'
WHERE usr_role = 'MANAGER' AND usr_deleted_at IS NULL;

-- 기존 ACTIVE 사용자는 비밀번호 변경 불필요
UPDATE amb_users SET usr_must_change_pw = false
WHERE usr_status = 'ACTIVE' AND usr_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_group ON amb_users(usr_group_code);
CREATE INDEX IF NOT EXISTS idx_users_status ON amb_users(usr_status);
CREATE INDEX IF NOT EXISTS idx_users_role ON amb_users(usr_role);
CREATE INDEX IF NOT EXISTS idx_users_company ON amb_users(usr_company_id);

-- =====================================================
-- 3. amb_invitations: 그룹/조직 컬럼 추가
-- =====================================================
ALTER TABLE amb_invitations
ADD COLUMN IF NOT EXISTS inv_group_code VARCHAR(30),
ADD COLUMN IF NOT EXISTS inv_company_id UUID REFERENCES amb_hr_entities(ent_id),
ADD COLUMN IF NOT EXISTS inv_auto_approve BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_inv_group_code ON amb_invitations(inv_group_code);
CREATE INDEX IF NOT EXISTS idx_inv_company ON amb_invitations(inv_company_id);
