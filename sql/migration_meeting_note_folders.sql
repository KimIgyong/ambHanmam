-- ============================================================
-- Migration: Meeting Note Folders
-- Date: 2026-03-29
-- Description: 미팅노트 폴더 기능 추가
-- ============================================================

-- 1. 폴더 테이블 생성
CREATE TABLE IF NOT EXISTS amb_meeting_note_folders (
  mnf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID,
  usr_id UUID NOT NULL,
  mnf_name VARCHAR(100) NOT NULL,
  mnf_color VARCHAR(20),
  mnf_sort_order INT DEFAULT 0,
  mnf_created_at TIMESTAMP DEFAULT NOW(),
  mnf_updated_at TIMESTAMP DEFAULT NOW(),
  mnf_deleted_at TIMESTAMP
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_note_folders_user ON amb_meeting_note_folders(usr_id) WHERE mnf_deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_note_folders_entity ON amb_meeting_note_folders(ent_id) WHERE mnf_deleted_at IS NULL;

-- 3. 기존 노트 테이블에 folder_id 컬럼 추가
ALTER TABLE amb_meeting_notes ADD COLUMN IF NOT EXISTS mtn_folder_id UUID;

-- 4. FK 제약조건
ALTER TABLE amb_meeting_notes
  ADD CONSTRAINT fk_meeting_notes_folder
  FOREIGN KEY (mtn_folder_id) REFERENCES amb_meeting_note_folders(mnf_id)
  ON DELETE SET NULL;

-- 5. 인덱스
CREATE INDEX IF NOT EXISTS idx_meeting_notes_folder ON amb_meeting_notes(mtn_folder_id) WHERE mtn_deleted_at IS NULL;
