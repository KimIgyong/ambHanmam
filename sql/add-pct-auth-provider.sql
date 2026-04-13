-- Add pct_auth_provider column to amb_svc_portal_customers
-- Values: 'EMAIL' (default), 'GOOGLE'
ALTER TABLE amb_svc_portal_customers 
ADD COLUMN IF NOT EXISTS pct_auth_provider VARCHAR(20) DEFAULT 'EMAIL' NOT NULL;

-- Update existing records based on heuristic:
-- Records without pct_cli_id (incomplete onboarding) that have email verified
-- are likely Google OAuth registrations if they don't have terms agreed
COMMENT ON COLUMN amb_svc_portal_customers.pct_auth_provider IS 'Registration method: EMAIL or GOOGLE';
