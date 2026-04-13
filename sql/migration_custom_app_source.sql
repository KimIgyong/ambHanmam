-- Migration: Custom App Source Partner App ID (2026-03-30)
-- Run BEFORE deploying code

ALTER TABLE amb_entity_custom_apps
  ADD COLUMN IF NOT EXISTS eca_source_pap_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_entity_custom_apps_source_pap
  ON amb_entity_custom_apps(eca_source_pap_id);

COMMENT ON COLUMN amb_entity_custom_apps.eca_source_pap_id
  IS 'Source partner app ID from amb_partner_apps (for import tracking)';
