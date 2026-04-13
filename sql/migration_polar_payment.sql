-- Polar Payment Integration Migration (Draft)
-- Date: 2026-04-02
-- Note: staging/production requires manual SQL apply.

BEGIN;

-- 1) Polar Customer Mapping
CREATE TABLE IF NOT EXISTS amb_pol_customers (
  pcl_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  usr_id UUID NULL,
  pcl_polar_customer_id VARCHAR(128) NOT NULL,
  pcl_email VARCHAR(255) NULL,
  pcl_name VARCHAR(255) NULL,
  pcl_metadata JSONB NULL,
  pcl_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pcl_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pcl_deleted_at TIMESTAMP NULL,
  CONSTRAINT uq_amb_pol_customers_ent_customer UNIQUE (ent_id, pcl_polar_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_amb_pol_customers_ent_id
  ON amb_pol_customers(ent_id);

-- 2) Polar Subscriptions
CREATE TABLE IF NOT EXISTS amb_pol_subscriptions (
  pls_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  usr_id UUID NULL,
  pcl_id UUID NULL,
  pls_polar_subscription_id VARCHAR(128) NOT NULL,
  pls_polar_customer_id VARCHAR(128) NOT NULL,
  pls_service_code VARCHAR(30) NOT NULL,
  pls_plan_tier VARCHAR(30) NOT NULL,
  pls_billing_cycle VARCHAR(20) NOT NULL,
  pls_status VARCHAR(30) NOT NULL,
  pls_current_period_start TIMESTAMP NULL,
  pls_current_period_end TIMESTAMP NULL,
  pls_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  pls_canceled_at TIMESTAMP NULL,
  pls_revoked_at TIMESTAMP NULL,
  pls_metadata JSONB NULL,
  pls_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pls_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pls_deleted_at TIMESTAMP NULL,
  CONSTRAINT uq_amb_pol_subscriptions_polar_sub UNIQUE (pls_polar_subscription_id),
  CONSTRAINT fk_amb_pol_subscriptions_customer FOREIGN KEY (pcl_id) REFERENCES amb_pol_customers(pcl_id)
);

CREATE INDEX IF NOT EXISTS idx_amb_pol_subscriptions_ent_id
  ON amb_pol_subscriptions(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_pol_subscriptions_status
  ON amb_pol_subscriptions(pls_status);
CREATE INDEX IF NOT EXISTS idx_amb_pol_subscriptions_service_code
  ON amb_pol_subscriptions(pls_service_code);

-- 3) Polar Orders / Paid Events
CREATE TABLE IF NOT EXISTS amb_pol_orders (
  por_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  usr_id UUID NULL,
  pls_id UUID NULL,
  pcl_id UUID NULL,
  por_polar_order_id VARCHAR(128) NOT NULL,
  por_polar_customer_id VARCHAR(128) NOT NULL,
  por_order_type VARCHAR(30) NOT NULL,
  por_addon_type VARCHAR(50) NULL,
  por_amount NUMERIC(18,2) NOT NULL,
  por_currency VARCHAR(10) NOT NULL,
  por_status VARCHAR(30) NOT NULL,
  por_paid_at TIMESTAMP NULL,
  por_metadata JSONB NULL,
  por_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  por_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  por_deleted_at TIMESTAMP NULL,
  CONSTRAINT uq_amb_pol_orders_polar_order UNIQUE (por_polar_order_id),
  CONSTRAINT fk_amb_pol_orders_subscription FOREIGN KEY (pls_id) REFERENCES amb_pol_subscriptions(pls_id),
  CONSTRAINT fk_amb_pol_orders_customer FOREIGN KEY (pcl_id) REFERENCES amb_pol_customers(pcl_id)
);

CREATE INDEX IF NOT EXISTS idx_amb_pol_orders_ent_id
  ON amb_pol_orders(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_pol_orders_status
  ON amb_pol_orders(por_status);
CREATE INDEX IF NOT EXISTS idx_amb_pol_orders_order_type
  ON amb_pol_orders(por_order_type);

-- 4) Webhook Event Idempotency
CREATE TABLE IF NOT EXISTS amb_pol_webhook_events (
  pwe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pwe_event_id VARCHAR(128) NOT NULL,
  pwe_event_type VARCHAR(100) NOT NULL,
  pwe_signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  pwe_is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  pwe_process_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  pwe_error_message TEXT NULL,
  pwe_payload JSONB NOT NULL,
  pwe_received_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pwe_processed_at TIMESTAMP NULL,
  pwe_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pwe_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pwe_deleted_at TIMESTAMP NULL,
  CONSTRAINT uq_amb_pol_webhook_events_event_id UNIQUE (pwe_event_id)
);

CREATE INDEX IF NOT EXISTS idx_amb_pol_webhook_events_event_type
  ON amb_pol_webhook_events(pwe_event_type);
CREATE INDEX IF NOT EXISTS idx_amb_pol_webhook_events_is_processed
  ON amb_pol_webhook_events(pwe_is_processed);
CREATE INDEX IF NOT EXISTS idx_amb_pol_webhook_events_received_at
  ON amb_pol_webhook_events(pwe_received_at DESC);

COMMIT;
