-- ============================================================
-- Daily Note 타입 마이그레이션
-- 목적: MEMO 타입 중 '📅 Daily Note%' 제목 패턴인 노트를 DAILY_NOTE 타입으로 변경
-- 적용 환경: 스테이징, 프로덕션 (수동 실행 필요)
-- 작성일: 2026-04-01
-- ============================================================

BEGIN;

-- 1. 변경 대상 확인
SELECT COUNT(*) AS target_count
FROM amb_meeting_notes
WHERE mtn_type = 'MEMO'
  AND mtn_title LIKE '📅 Daily Note%'
  AND mtn_deleted_at IS NULL;

-- 2. 타입 변경
UPDATE amb_meeting_notes
SET mtn_type = 'DAILY_NOTE',
    mtn_updated_at = NOW()
WHERE mtn_type = 'MEMO'
  AND mtn_title LIKE '📅 Daily Note%'
  AND mtn_deleted_at IS NULL;

-- 3. 변경 결과 확인
SELECT mtn_type, COUNT(*) AS count
FROM amb_meeting_notes
WHERE mtn_deleted_at IS NULL
GROUP BY mtn_type
ORDER BY mtn_type;

COMMIT;

-- ============================================================
-- 롤백 SQL (필요 시 실행)
-- ============================================================
-- BEGIN;
-- UPDATE amb_meeting_notes
-- SET mtn_type = 'MEMO',
--     mtn_updated_at = NOW()
-- WHERE mtn_type = 'DAILY_NOTE'
--   AND mtn_deleted_at IS NULL;
-- COMMIT;
