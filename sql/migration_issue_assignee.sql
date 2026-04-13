-- Issue Management Enhancement: Assignee UUID FK Migration
-- Date: 2026-02-23

-- 1) Add assignee_id UUID column
ALTER TABLE amb_issues ADD COLUMN IF NOT EXISTS iss_assignee_id UUID;

-- 2) FK constraint to amb_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_assignee'
  ) THEN
    ALTER TABLE amb_issues ADD CONSTRAINT fk_issues_assignee
      FOREIGN KEY (iss_assignee_id) REFERENCES amb_users(usr_id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Migrate existing name-based assignee data to UUID
UPDATE amb_issues i
SET iss_assignee_id = u.usr_id
FROM amb_users u
WHERE i.iss_assignee = u.usr_name
  AND i.iss_assignee IS NOT NULL
  AND i.iss_assignee_id IS NULL;

-- 4) Index for performance
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON amb_issues(iss_assignee_id);
