-- Attendance 멤버 가시성 + 순서 지정 기능
-- 2026-03-24

ALTER TABLE amb_hr_entity_user_roles
  ADD COLUMN IF NOT EXISTS eur_hidden_from_attendance BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE amb_hr_entity_user_roles
  ADD COLUMN IF NOT EXISTS eur_attendance_order INT DEFAULT NULL;
