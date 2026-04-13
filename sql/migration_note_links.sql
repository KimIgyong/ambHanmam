-- ============================================================
-- Migration: AMA Knowledge Obsidian - Phase 1
-- Date: 2026-03-29
-- Description: 노트 링크 + 노트↔태스크 연결 + FTS
-- ============================================================

-- 1. 노트 링크 테이블
CREATE TABLE IF NOT EXISTS amb_note_links (
  nlk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  nlk_source_note_id UUID NOT NULL REFERENCES amb_meeting_notes(mtn_id) ON DELETE CASCADE,
  nlk_target_note_id UUID REFERENCES amb_meeting_notes(mtn_id) ON DELETE SET NULL,
  nlk_link_text VARCHAR(500) NOT NULL,
  nlk_target_type VARCHAR(20) NOT NULL DEFAULT 'NOTE',
  nlk_target_ref_id UUID,
  nlk_context TEXT,
  nlk_created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_note_links_source ON amb_note_links(nlk_source_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_target ON amb_note_links(nlk_target_note_id);
CREATE INDEX IF NOT EXISTS idx_note_links_ent ON amb_note_links(ent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_note_links_unique
  ON amb_note_links(nlk_source_note_id, nlk_link_text, nlk_target_type);

-- 2. 노트↔태스크 연결 테이블
CREATE TABLE IF NOT EXISTS amb_meeting_note_todos (
  mnt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mtn_id UUID NOT NULL REFERENCES amb_meeting_notes(mtn_id) ON DELETE CASCADE,
  tdo_id UUID NOT NULL REFERENCES amb_todos(tdo_id) ON DELETE CASCADE,
  mnt_created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mnt_unique ON amb_meeting_note_todos(mtn_id, tdo_id);

-- 3. FTS 컬럼 추가
ALTER TABLE amb_meeting_notes ADD COLUMN IF NOT EXISTS mtn_search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_meeting_notes_fts
  ON amb_meeting_notes USING GIN(mtn_search_vector);

-- 4. 기존 노트의 tsvector 일괄 업데이트
UPDATE amb_meeting_notes
SET mtn_search_vector = to_tsvector('simple',
  coalesce(mtn_title, '') || ' ' ||
  coalesce(regexp_replace(mtn_content, '<[^>]+>', ' ', 'g'), '')
)
WHERE mtn_search_vector IS NULL;
