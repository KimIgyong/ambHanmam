-- Migration: Site Config + Menu Tips (2026-03-30)
-- Run on staging/production BEFORE deploying code

CREATE TABLE IF NOT EXISTS amb_entity_site_configs (
  esc_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL UNIQUE,
  esc_login_modal_enabled BOOLEAN NOT NULL DEFAULT false,
  esc_login_modal_title VARCHAR(200),
  esc_login_modal_content TEXT,
  esc_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  esc_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amb_entity_menu_tips (
  emt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  emt_menu_code VARCHAR(50) NOT NULL,
  emt_title VARCHAR(200),
  emt_content TEXT,
  emt_is_active BOOLEAN NOT NULL DEFAULT true,
  emt_sort_order INT NOT NULL DEFAULT 0,
  emt_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emt_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ent_id, emt_menu_code)
);

CREATE INDEX IF NOT EXISTS idx_entity_menu_tips_entity ON amb_entity_menu_tips(ent_id);
