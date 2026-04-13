-- Migration: Add App GA Measurement ID to site settings
-- Date: 2026-04-12

ALTER TABLE amb_site_settings
ADD COLUMN IF NOT EXISTS sts_app_ga_measurement_id VARCHAR(30) DEFAULT NULL;

COMMENT ON COLUMN amb_site_settings.sts_app_ga_measurement_id IS 'App site (ama.amoeba.site) GA4 Measurement ID';
