-- Migration: Add cli_ent_id column to amb_svc_clients
-- Date: 2026-03-21
-- Purpose: Link clients to their owning entity for Entity Settings Client Management

BEGIN;

ALTER TABLE amb_svc_clients
  ADD COLUMN IF NOT EXISTS cli_ent_id UUID NULL REFERENCES amb_hr_entities(ent_id);

CREATE INDEX IF NOT EXISTS idx_svc_clients_ent_id ON amb_svc_clients(cli_ent_id);

COMMIT;
