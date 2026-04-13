-- =====================================================
-- 출퇴근 수정 이력 (Attendance Amendments) 테이블
-- 2026-03-27
-- =====================================================

CREATE TABLE IF NOT EXISTS amb_attendance_amendments (
  aam_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  att_id          UUID NOT NULL REFERENCES amb_attendances(att_id) ON DELETE CASCADE,
  aam_type        VARCHAR(20) NOT NULL,
  aam_start_time  VARCHAR(5),
  aam_end_time    VARCHAR(5),
  aam_note        TEXT NOT NULL,
  aam_amended_by  UUID NOT NULL,
  aam_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 원본 출퇴근 기준 수정이력 조회
CREATE INDEX IF NOT EXISTS idx_attendance_amendments_att_id
  ON amb_attendance_amendments(att_id);

-- 인덱스: 수정자 기준 조회
CREATE INDEX IF NOT EXISTS idx_attendance_amendments_amended_by
  ON amb_attendance_amendments(aam_amended_by);
