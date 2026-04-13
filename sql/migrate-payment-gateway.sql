-- ============================================================================
-- MegaPay 전자결제 시스템 마이그레이션 SQL
-- Date: 2026-03-22
-- Tables: amb_pg_configs, amb_pg_transactions, amb_ai_quota_products, amb_ai_quota_topups
-- Menu: SETTINGS_PAYMENT_GATEWAY, SETTINGS_PAYMENT_TRANSACTION
-- ============================================================================

BEGIN;

-- ─── 1. amb_pg_configs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_pg_configs (
  pgc_id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ent_id                   UUID REFERENCES amb_hr_entities(ent_id),
  pgc_provider             VARCHAR(20)  NOT NULL,
  pgc_merchant_id          VARCHAR(20)  NOT NULL,
  -- Encode Key (SHA256 서명용)
  pgc_encode_key_encrypted TEXT         NOT NULL,
  pgc_encode_key_iv        VARCHAR(64)  NOT NULL,
  pgc_encode_key_tag       VARCHAR(64)  NOT NULL,
  pgc_encode_key_last4     VARCHAR(4)   NOT NULL,
  -- Hash Key Refund (환불 전용)
  pgc_refund_key_encrypted TEXT         NOT NULL,
  pgc_refund_key_iv        VARCHAR(64)  NOT NULL,
  pgc_refund_key_tag       VARCHAR(64)  NOT NULL,
  pgc_refund_key_last4     VARCHAR(4)   NOT NULL,
  -- Cancel Password (환불 비밀번호)
  pgc_cancel_pw_encrypted  TEXT         NOT NULL,
  pgc_cancel_pw_iv         VARCHAR(64)  NOT NULL,
  pgc_cancel_pw_tag        VARCHAR(64)  NOT NULL,
  pgc_cancel_pw_last4      VARCHAR(4)   NOT NULL,
  -- 환경 설정
  pgc_environment          VARCHAR(10)  NOT NULL DEFAULT 'sandbox',
  pgc_callback_url         VARCHAR(500),
  pgc_noti_url             VARCHAR(500),
  pgc_window_color         VARCHAR(7)   NOT NULL DEFAULT '#ef5459',
  pgc_currency             VARCHAR(3)   NOT NULL DEFAULT 'VND',
  pgc_is_active            BOOLEAN      NOT NULL DEFAULT true,
  pgc_created_by           UUID         NOT NULL,
  pgc_created_at           TIMESTAMP    NOT NULL DEFAULT now(),
  pgc_updated_at           TIMESTAMP    NOT NULL DEFAULT now(),
  pgc_deleted_at           TIMESTAMP
);

-- ─── 2. amb_pg_transactions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_pg_transactions (
  pgt_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ent_id              UUID         NOT NULL REFERENCES amb_hr_entities(ent_id),
  usr_id              UUID         NOT NULL,
  pgc_id              UUID         NOT NULL REFERENCES amb_pg_configs(pgc_id),
  pgt_invoice_no      VARCHAR(40)  NOT NULL,
  pgt_mer_trx_id      VARCHAR(50)  NOT NULL,
  pgt_trx_id          VARCHAR(30),
  pgt_amount          BIGINT       NOT NULL,
  pgt_currency        VARCHAR(3)   NOT NULL DEFAULT 'VND',
  pgt_pay_type        VARCHAR(2),
  pgt_goods_name      VARCHAR(200) NOT NULL,
  pgt_status          VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
  pgt_result_cd       VARCHAR(10),
  pgt_result_msg      VARCHAR(512),
  pgt_merchant_token  VARCHAR(255),
  pgt_payment_link    TEXT,
  pgt_qr_code         TEXT,
  pgt_link_exptime    TIMESTAMP,
  pgt_buyer_email     VARCHAR(40),
  pgt_buyer_name      VARCHAR(60),
  pgt_bank_id         VARCHAR(10),
  pgt_card_no         VARCHAR(20),
  pgt_card_type       VARCHAR(4),
  pgt_pay_token       VARCHAR(100),
  pgt_user_fee        BIGINT,
  pgt_trans_dt        VARCHAR(8),
  pgt_trans_tm        VARCHAR(6),
  pgt_callback_data   JSONB,
  pgt_ipn_data        JSONB,
  pgt_created_at      TIMESTAMP    NOT NULL DEFAULT now(),
  pgt_updated_at      TIMESTAMP    NOT NULL DEFAULT now(),
  pgt_deleted_at      TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pgt_invoice_no ON amb_pg_transactions(pgt_invoice_no);
CREATE INDEX IF NOT EXISTS idx_pgt_ent_status ON amb_pg_transactions(ent_id, pgt_status);

-- ─── 3. amb_ai_quota_products ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_ai_quota_products (
  aqp_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aqp_name         VARCHAR(100) NOT NULL,
  aqp_description  VARCHAR(500),
  aqp_token_amount BIGINT       NOT NULL,
  aqp_price        BIGINT       NOT NULL,
  aqp_currency     VARCHAR(3)   NOT NULL DEFAULT 'VND',
  aqp_sort_order   INT          NOT NULL DEFAULT 0,
  aqp_is_active    BOOLEAN      NOT NULL DEFAULT true,
  aqp_created_by   UUID,
  aqp_created_at   TIMESTAMP    NOT NULL DEFAULT now(),
  aqp_updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
  aqp_deleted_at   TIMESTAMP
);

-- ─── 4. amb_ai_quota_topups ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS amb_ai_quota_topups (
  aqt_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ent_id           UUID         NOT NULL REFERENCES amb_hr_entities(ent_id),
  usr_id           UUID         NOT NULL,
  pgt_id           UUID         NOT NULL REFERENCES amb_pg_transactions(pgt_id),
  aqp_id           UUID         REFERENCES amb_ai_quota_products(aqp_id),
  aqt_token_amount BIGINT       NOT NULL,
  aqt_price        BIGINT       NOT NULL,
  aqt_currency     VARCHAR(3)   NOT NULL DEFAULT 'VND',
  aqt_status       VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
  aqt_note         VARCHAR(500),
  aqt_created_at   TIMESTAMP    NOT NULL DEFAULT now(),
  aqt_updated_at   TIMESTAMP    NOT NULL DEFAULT now()
);

-- ─── 5. 메뉴 설정 시드 ─────────────────────────────────────────────────────
INSERT INTO amb_menu_config (mcf_id, mcf_menu_code, mcf_label_key, mcf_icon, mcf_path, mcf_category, mcf_enabled, mcf_sort_order, mcf_updated_at)
VALUES
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_GATEWAY', 'settings:nav.paymentGateway', 'CreditCard', '/admin/payment-gateway', 'SETTINGS', true, 3100, now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_TRANSACTION', 'settings:nav.paymentTransaction', 'Receipt', '/admin/payment-transactions', 'SETTINGS', true, 3110, now())
ON CONFLICT (mcf_menu_code) DO NOTHING;

-- ─── 6. 메뉴 권한 시드 (ADMIN, MASTER, SUPER_ADMIN) ────────────────────────
INSERT INTO amb_menu_permissions (mpm_id, mpm_menu_code, mpm_role, mpm_accessible, mpm_created_at, mpm_updated_at)
VALUES
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_GATEWAY', 'SUPER_ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_GATEWAY', 'ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_GATEWAY', 'MASTER', true, now(), now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_TRANSACTION', 'SUPER_ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_TRANSACTION', 'ADMIN', true, now(), now()),
  (uuid_generate_v4(), 'SETTINGS_PAYMENT_TRANSACTION', 'MASTER', true, now(), now())
ON CONFLICT (mpm_menu_code, mpm_role) DO NOTHING;

COMMIT;
