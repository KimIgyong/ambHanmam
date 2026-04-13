-- Slack Integration DDL Migration
-- 스테이징/프로덕션에서 synchronize=false이므로 수동 DDL 필요
-- 실행: cat sql/migration_slack_tables.sql | ssh amb-staging "docker exec -i amb-postgres-staging psql -U amb_user -d db_amb_hanmam"

-- 1. SlackWorkspaceConfig
CREATE TABLE IF NOT EXISTS amb_slack_workspace_configs (
  swc_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ent_id UUID NOT NULL,
  swc_team_id VARCHAR(50) NOT NULL,
  swc_team_name VARCHAR(200) NOT NULL,
  swc_bot_token_enc TEXT NOT NULL,
  swc_bot_token_iv VARCHAR(100) NOT NULL,
  swc_bot_token_tag VARCHAR(100) NOT NULL,
  swc_bot_user_id VARCHAR(50) NOT NULL,
  swc_app_id VARCHAR(50),
  swc_signing_secret_enc TEXT NOT NULL,
  swc_signing_secret_iv VARCHAR(100) NOT NULL,
  swc_signing_secret_tag VARCHAR(100) NOT NULL,
  swc_is_active BOOLEAN DEFAULT true,
  swc_connected_at TIMESTAMP NOT NULL,
  swc_connected_by UUID NOT NULL,
  swc_created_at TIMESTAMP DEFAULT NOW(),
  swc_updated_at TIMESTAMP DEFAULT NOW(),
  swc_deleted_at TIMESTAMP
);

-- 2. SlackChannelMapping
CREATE TABLE IF NOT EXISTS amb_slack_channel_mappings (
  scm_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swc_id UUID NOT NULL REFERENCES amb_slack_workspace_configs(swc_id),
  ent_id UUID NOT NULL,
  scm_slack_channel_id VARCHAR(50) NOT NULL,
  scm_slack_channel_name VARCHAR(200) NOT NULL,
  chn_id UUID NOT NULL,
  scm_status VARCHAR(20) DEFAULT 'ACTIVE',
  scm_direction VARCHAR(20) DEFAULT 'BIDIRECTIONAL',
  scm_created_at TIMESTAMP DEFAULT NOW(),
  scm_updated_at TIMESTAMP DEFAULT NOW(),
  scm_deleted_at TIMESTAMP
);

-- 3. SlackMessageMapping
CREATE TABLE IF NOT EXISTS amb_slack_message_mappings (
  smm_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scm_id UUID NOT NULL,
  smm_slack_ts VARCHAR(50) NOT NULL,
  smm_slack_thread_ts VARCHAR(50),
  msg_id UUID NOT NULL,
  smm_direction VARCHAR(10) NOT NULL,
  smm_created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT uq_slack_message_mapping UNIQUE (scm_id, smm_slack_ts)
);

CREATE INDEX IF NOT EXISTS idx_smm_slack_thread_ts ON amb_slack_message_mappings(smm_slack_thread_ts);
