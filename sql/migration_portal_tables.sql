-- Portal Tables Migration
-- 포탈 전용 테이블 생성 (portal-api에서 사용)
-- 실행 대상: 스테이징/프로덕션 DB (NODE_ENV=production에서 synchronize 비활성화로 자동 생성 안 됨)

-- 1. Portal Customers (포탈 고객 계정)
CREATE TABLE IF NOT EXISTS amb_svc_portal_customers (
    pct_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pct_email VARCHAR(200) NOT NULL UNIQUE,
    pct_password VARCHAR(200) NOT NULL,
    pct_name VARCHAR(100) NOT NULL,
    pct_phone VARCHAR(30),
    pct_company_name VARCHAR(300),
    pct_country VARCHAR(5),
    pct_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    pct_email_verify_token VARCHAR(200),
    pct_email_verify_expires TIMESTAMPTZ,
    pct_password_reset_token VARCHAR(200),
    pct_password_reset_expires TIMESTAMPTZ,
    pct_cli_id UUID,
    pct_stripe_customer_id VARCHAR(50),
    pct_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    pct_last_login_at TIMESTAMPTZ,
    pct_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pct_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pct_deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_portal_customers_email ON amb_svc_portal_customers(pct_email);

-- 2. Portal Payments (포탈 결제 기록)
CREATE TABLE IF NOT EXISTS amb_svc_portal_payments (
    ppm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ppm_customer_id UUID NOT NULL,
    ppm_cli_id UUID,
    ppm_sub_id UUID,
    ppm_gateway VARCHAR(30) NOT NULL,
    ppm_gateway_tx_id VARCHAR(100),
    ppm_gateway_order_id VARCHAR(100),
    ppm_amount DECIMAL(15,2) NOT NULL,
    ppm_currency VARCHAR(3) NOT NULL,
    ppm_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ppm_type VARCHAR(20) NOT NULL DEFAULT 'SUBSCRIPTION',
    ppm_method VARCHAR(30),
    ppm_description VARCHAR(500),
    ppm_gateway_response JSONB,
    ppm_error_code VARCHAR(30),
    ppm_error_message TEXT,
    ppm_paid_at TIMESTAMPTZ,
    ppm_refunded_at TIMESTAMPTZ,
    ppm_ip_address VARCHAR(45),
    ppm_country VARCHAR(5),
    ppm_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ppm_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_portal_payments_customer ON amb_svc_portal_payments(ppm_customer_id);
CREATE INDEX IF NOT EXISTS idx_portal_payments_gateway ON amb_svc_portal_payments(ppm_gateway);

-- 3. Usage Records (서비스 사용량 기록)
CREATE TABLE IF NOT EXISTS amb_svc_usage_records (
    usr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_id UUID NOT NULL,
    cli_id UUID NOT NULL,
    svc_id UUID NOT NULL,
    usr_metric VARCHAR(50) NOT NULL,
    usr_quantity DECIMAL(15,4) NOT NULL,
    usr_unit_price DECIMAL(10,4),
    usr_total_amount DECIMAL(15,2),
    usr_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    usr_period_start TIMESTAMPTZ NOT NULL,
    usr_period_end TIMESTAMPTZ NOT NULL,
    usr_stripe_usage_record_id VARCHAR(50),
    usr_reported_to_stripe BOOLEAN NOT NULL DEFAULT FALSE,
    usr_source VARCHAR(30) NOT NULL DEFAULT 'SYSTEM',
    usr_metadata JSONB,
    usr_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_records_sub ON amb_svc_usage_records(sub_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_metric ON amb_svc_usage_records(usr_metric);
CREATE INDEX IF NOT EXISTS idx_usage_records_period ON amb_svc_usage_records(usr_period_start);
