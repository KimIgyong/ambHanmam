-- Migration: Add amb_partners table and usr_partner_id column
-- Date: 2026-03-21
-- Reason: PARTNER_LEVEL feature requires partner organization table and FK in users

-- 1. Create amb_partners table
CREATE TABLE IF NOT EXISTS amb_partners (
  ptn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ptn_code VARCHAR(20) NOT NULL UNIQUE,
  ptn_company_name VARCHAR(200) NOT NULL,
  ptn_company_name_local VARCHAR(200),
  ptn_country VARCHAR(256),
  ptn_contact_name VARCHAR(100),
  ptn_contact_email VARCHAR(200),
  ptn_contact_phone VARCHAR(30),
  ptn_address TEXT,
  ptn_tax_id VARCHAR(50),
  ptn_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  ptn_note TEXT,
  ptn_created_at TIMESTAMP NOT NULL DEFAULT now(),
  ptn_updated_at TIMESTAMP NOT NULL DEFAULT now(),
  ptn_deleted_at TIMESTAMP
);

-- 2. Add usr_partner_id column to amb_users
ALTER TABLE amb_users
  ADD COLUMN IF NOT EXISTS usr_partner_id UUID;

-- 3. Add FK constraint
ALTER TABLE amb_users
  ADD CONSTRAINT fk_users_partner
  FOREIGN KEY (usr_partner_id)
  REFERENCES amb_partners(ptn_id)
  ON DELETE SET NULL;
