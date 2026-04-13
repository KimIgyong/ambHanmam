-- ============================================================
-- Migration: 노트 기능 개선 (mtn_type 컬럼 추가, visibility 마이그레이션)
-- Date: 2026-02-24
-- ============================================================

-- 1) mtn_type 컬럼 추가 (기존 데이터는 MEMO로 유지 - DEFAULT)
ALTER TABLE amb_meeting_notes
  ADD COLUMN IF NOT EXISTS mtn_type VARCHAR(20) NOT NULL DEFAULT 'MEMO';

-- 2) DEPARTMENT → ENTITY visibility 마이그레이션
UPDATE amb_meeting_notes
  SET mtn_visibility = 'ENTITY'
  WHERE mtn_visibility = 'DEPARTMENT';

-- 3) mtn_type 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_notes_type ON amb_meeting_notes(mtn_type);

-- 확인
SELECT mtn_type, mtn_visibility, COUNT(*) FROM amb_meeting_notes GROUP BY mtn_type, mtn_visibility;
