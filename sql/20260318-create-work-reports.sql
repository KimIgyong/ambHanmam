-- Work Reports table for AI daily/weekly report generation
CREATE TABLE IF NOT EXISTS amb_work_reports (
  wkr_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ent_id UUID NOT NULL,
  usr_id UUID NOT NULL,
  wkr_type VARCHAR(20) NOT NULL,
  wkr_period_start DATE NOT NULL,
  wkr_period_end DATE NOT NULL,
  wkr_raw_data JSONB DEFAULT '{}',
  wkr_ai_summary TEXT,
  wkr_ai_score JSONB,
  wkr_created_at TIMESTAMP DEFAULT NOW(),
  wkr_updated_at TIMESTAMP DEFAULT NOW(),
  wkr_deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_reports_user ON amb_work_reports(usr_id, ent_id);
CREATE INDEX IF NOT EXISTS idx_work_reports_period ON amb_work_reports(wkr_type, wkr_period_start);
