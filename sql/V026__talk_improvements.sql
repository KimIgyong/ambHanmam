-- V026: Amoeba Talk 성능/기능 개선
-- 1) 채널 뮤트 컬럼 추가
ALTER TABLE amb_talk_channel_members
  ADD COLUMN IF NOT EXISTS chm_muted BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) 메시지 parent_id 인덱스 (reply count 집계 성능)
CREATE INDEX IF NOT EXISTS idx_talk_messages_parent_id
  ON amb_talk_messages (msg_parent_id)
  WHERE msg_parent_id IS NOT NULL AND msg_deleted_at IS NULL;

-- 3) 미읽음 카운트 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_talk_messages_chn_created
  ON amb_talk_messages (chn_id, msg_created_at)
  WHERE msg_deleted_at IS NULL;
