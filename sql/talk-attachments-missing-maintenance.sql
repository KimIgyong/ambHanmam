-- Talk Attachments Missing File Maintenance
-- Usage:
-- 1) Fill tmp_missing_files from extracted list
-- 2) Run PREVIEW query
-- 3) Choose one action: MARK or CLEANUP

BEGIN;

-- 1) Missing file list (replace with real extracted filenames)
CREATE TEMP TABLE tmp_missing_files (
  stored_name varchar(255) PRIMARY KEY
) ON COMMIT DROP;

-- Example (replace values):
INSERT INTO tmp_missing_files (stored_name)
VALUES
  ('1c6ede96-8daa-4072-8d8e-91356e2ab2b3.jpeg'),
  ('9867feb9-c908-47ff-a2a2-b6afa91f76a6.jpeg'),
  ('d6fdc1f9-6a75-4ea3-bcf1-3a8762354e50.pptx');

-- 2) PREVIEW: what will be affected
SELECT
  a.tat_id,
  a.msg_id,
  a.tat_original_name,
  a.tat_stored_name,
  a.tat_mime_type,
  a.tat_file_size,
  m.chn_id,
  m.usr_id,
  m.msg_type,
  m.msg_content,
  m.msg_created_at
FROM amb_talk_attachments a
JOIN amb_talk_messages m ON m.msg_id = a.msg_id
JOIN tmp_missing_files f ON f.stored_name = a.tat_stored_name
ORDER BY m.msg_created_at;

-- 3-A) MARK (non-destructive)
-- Appends a missing-file marker to the message content (idempotent).
-- Uncomment this block to apply MARK.
/*
WITH missing_by_message AS (
  SELECT
    a.msg_id,
    string_agg(a.tat_original_name || ' (' || a.tat_stored_name || ')', ', ' ORDER BY a.tat_created_at) AS missing_files
  FROM amb_talk_attachments a
  JOIN tmp_missing_files f ON f.stored_name = a.tat_stored_name
  GROUP BY a.msg_id
)
UPDATE amb_talk_messages m
SET msg_content = CASE
  WHEN COALESCE(m.msg_content, '') ILIKE '%[FILE_MISSING]%' THEN m.msg_content
  WHEN COALESCE(m.msg_content, '') = '' THEN '[FILE_MISSING] ' || mbm.missing_files
  ELSE m.msg_content || E'\n[FILE_MISSING] ' || mbm.missing_files
END,
msg_updated_at = now()
FROM missing_by_message mbm
WHERE m.msg_id = mbm.msg_id;
*/

-- 3-B) CLEANUP (destructive)
-- Deletes missing attachment rows and marks FILE messages with no remaining attachment.
-- Uncomment this block to apply CLEANUP.
/*
DELETE FROM amb_talk_attachments a
USING tmp_missing_files f
WHERE a.tat_stored_name = f.stored_name;

WITH file_messages_without_attachment AS (
  SELECT m.msg_id
  FROM amb_talk_messages m
  LEFT JOIN amb_talk_attachments a ON a.msg_id = m.msg_id
  WHERE m.msg_type = 'FILE'
  GROUP BY m.msg_id
  HAVING COUNT(a.tat_id) = 0
)
UPDATE amb_talk_messages m
SET msg_content = CASE
  WHEN COALESCE(m.msg_content, '') ILIKE '%[FILE_REMOVED]%' THEN m.msg_content
  WHEN COALESCE(m.msg_content, '') = '' THEN '[FILE_REMOVED] Attachment not available.'
  ELSE m.msg_content || E'\n[FILE_REMOVED] Attachment not available.'
END,
msg_updated_at = now()
WHERE m.msg_id IN (SELECT msg_id FROM file_messages_without_attachment);
*/

-- Verify impact summary
SELECT
  (SELECT COUNT(*) FROM tmp_missing_files) AS missing_input_count,
  (SELECT COUNT(*) FROM amb_talk_attachments a JOIN tmp_missing_files f ON f.stored_name = a.tat_stored_name) AS matched_attachment_rows;

-- Change to ROLLBACK for dry-run review.
ROLLBACK;
-- COMMIT;
