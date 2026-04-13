-- ============================================================
-- 지출결의서 테이블 마이그레이션
-- 생성일: 2026-03-12
-- ============================================================

-- 1. 지출결의서 메인 테이블
CREATE TABLE IF NOT EXISTS amb_expense_requests (
  exr_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id            UUID NOT NULL,
  exr_requester_id  UUID NOT NULL,
  exr_title         VARCHAR(200) NOT NULL,
  exr_type          VARCHAR(20) NOT NULL,
  exr_frequency     VARCHAR(20) NOT NULL DEFAULT 'ONE_TIME',
  exr_category      VARCHAR(50) NOT NULL,
  exr_expense_date  DATE NOT NULL,
  exr_description   TEXT,
  exr_reason        TEXT,
  exr_number        VARCHAR(30) UNIQUE,
  exr_total_amount  DECIMAL(18,2) NOT NULL DEFAULT 0,
  exr_currency      VARCHAR(10) NOT NULL DEFAULT 'VND',
  exr_period        VARCHAR(20),
  exr_start_date    DATE,
  exr_end_date      DATE,
  exr_payment_day   INT,
  exr_next_due_date DATE,
  exr_status        VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  exr_parent_id     UUID,
  exr_is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  exr_approver1_id  UUID,
  exr_approver2_id  UUID,
  exr_created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exr_updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exr_deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expense_requests_ent_status ON amb_expense_requests (ent_id, exr_status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_requester ON amb_expense_requests (exr_requester_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_next_due ON amb_expense_requests (exr_next_due_date);

-- 2. 지출결의서 항목 테이블
CREATE TABLE IF NOT EXISTS amb_expense_request_items (
  eri_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exr_id          UUID NOT NULL,
  eri_name        VARCHAR(200) NOT NULL,
  eri_quantity    DECIMAL(10,2) NOT NULL DEFAULT 1,
  eri_unit_price  DECIMAL(18,2) NOT NULL,
  eri_tax_amount  DECIMAL(18,2) NOT NULL DEFAULT 0,
  eri_currency    VARCHAR(10) NOT NULL DEFAULT 'VND',
  eri_note        TEXT,
  eri_sort_order  INT NOT NULL DEFAULT 0,
  eri_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eri_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_expense_items_request FOREIGN KEY (exr_id)
    REFERENCES amb_expense_requests(exr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_items_exr ON amb_expense_request_items (exr_id);

-- 3. 결재 이력 테이블
CREATE TABLE IF NOT EXISTS amb_expense_approvals (
  eap_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exr_id              UUID NOT NULL,
  eap_approver_id     UUID NOT NULL,
  eap_level           INT NOT NULL,
  eap_action          VARCHAR(20) NOT NULL,
  eap_comment         TEXT,
  eap_is_self_approval BOOLEAN NOT NULL DEFAULT false,
  eap_actioned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_expense_approvals_request FOREIGN KEY (exr_id)
    REFERENCES amb_expense_requests(exr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_exr ON amb_expense_approvals (exr_id);

-- 4. 첨부파일 테이블
CREATE TABLE IF NOT EXISTS amb_expense_attachments (
  eat_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exr_id              UUID NOT NULL,
  eat_type            VARCHAR(20) NOT NULL,
  eat_file_name       VARCHAR(500),
  eat_file_size       BIGINT,
  eat_mime_type       VARCHAR(100),
  eat_storage_key     VARCHAR(1000),
  eat_link_url        TEXT,
  eat_link_title      VARCHAR(500),
  eat_uploader_id     UUID NOT NULL,
  eat_created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eat_deleted_at      TIMESTAMPTZ,
  CONSTRAINT fk_expense_attachments_request FOREIGN KEY (exr_id)
    REFERENCES amb_expense_requests(exr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_exr ON amb_expense_attachments (exr_id);

-- 5. 집행 내역 테이블
CREATE TABLE IF NOT EXISTS amb_expense_executions (
  exd_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exr_id                UUID NOT NULL,
  exd_executed_at       DATE NOT NULL,
  exd_method            VARCHAR(20) NOT NULL,
  exd_method_note       VARCHAR(200),
  exd_amount            DECIMAL(18,2) NOT NULL,
  exd_currency          VARCHAR(10) NOT NULL,
  exd_receipt_type      VARCHAR(20) NOT NULL DEFAULT 'NONE',
  exd_receipt_number    VARCHAR(200),
  exd_receipt_file_name VARCHAR(500),
  exd_receipt_file_size BIGINT,
  exd_receipt_mime_type VARCHAR(100),
  exd_receipt_storage_key VARCHAR(1000),
  exd_receipt_link_url  TEXT,
  exd_note              TEXT,
  exd_executor_id       UUID NOT NULL,
  exd_created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exd_updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_expense_executions_request FOREIGN KEY (exr_id)
    REFERENCES amb_expense_requests(exr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_executions_exr ON amb_expense_executions (exr_id);
CREATE INDEX IF NOT EXISTS idx_expense_executions_date ON amb_expense_executions (exd_executed_at);

-- 6. 중간 계획 리포트 테이블
CREATE TABLE IF NOT EXISTS amb_expense_forecast_reports (
  efr_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id          UUID NOT NULL,
  efr_year        INT NOT NULL,
  efr_month       INT NOT NULL,
  efr_title       VARCHAR(200),
  efr_note        TEXT,
  efr_creator_id  UUID NOT NULL,
  efr_total_vnd   DECIMAL(18,2) NOT NULL DEFAULT 0,
  efr_total_usd   DECIMAL(18,2) NOT NULL DEFAULT 0,
  efr_total_krw   DECIMAL(18,2) NOT NULL DEFAULT 0,
  efr_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  efr_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_expense_forecast_ent_year_month UNIQUE (ent_id, efr_year, efr_month)
);

CREATE INDEX IF NOT EXISTS idx_expense_forecast_reports_ent ON amb_expense_forecast_reports (ent_id, efr_year, efr_month);

-- 7. 중간 계획 항목 테이블
CREATE TABLE IF NOT EXISTS amb_expense_forecast_items (
  efi_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  efr_id          UUID NOT NULL,
  efi_type        VARCHAR(20) NOT NULL,
  exr_id          UUID,
  efi_title       VARCHAR(200) NOT NULL,
  efi_category    VARCHAR(50),
  efi_prev_amount DECIMAL(18,2),
  efi_amount      DECIMAL(18,2) NOT NULL,
  efi_currency    VARCHAR(10) NOT NULL DEFAULT 'VND',
  efi_note        TEXT,
  efi_sort_order  INT NOT NULL DEFAULT 0,
  efi_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  efi_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_expense_forecast_items_report FOREIGN KEY (efr_id)
    REFERENCES amb_expense_forecast_reports(efr_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_expense_forecast_items_efr ON amb_expense_forecast_items (efr_id);

-- 8. 메뉴/권한 설정 (지출결의서)
INSERT INTO amb_menu_config (
  mcf_menu_code,
  mcf_enabled,
  mcf_sort_order,
  mcf_label_key,
  mcf_icon,
  mcf_path,
  mcf_category
)
VALUES (
  'EXPENSE_REQUEST',
  true,
  725,
  'common:sidebar.expenseRequest',
  'Receipt',
  '/expense-requests',
  'MODULE'
)
ON CONFLICT (mcf_menu_code) DO UPDATE
SET
  mcf_enabled = EXCLUDED.mcf_enabled,
  mcf_label_key = EXCLUDED.mcf_label_key,
  mcf_icon = EXCLUDED.mcf_icon,
  mcf_path = EXCLUDED.mcf_path,
  mcf_category = EXCLUDED.mcf_category;

INSERT INTO amb_menu_permissions (mpm_menu_code, mpm_role, mpm_accessible)
VALUES
  ('EXPENSE_REQUEST', 'SUPER_ADMIN', true),
  ('EXPENSE_REQUEST', 'ADMIN', true),
  ('EXPENSE_REQUEST', 'MASTER', true),
  ('EXPENSE_REQUEST', 'MANAGER', true),
  ('EXPENSE_REQUEST', 'MEMBER', true),
  ('EXPENSE_REQUEST', 'VIEWER', true)
ON CONFLICT (mpm_menu_code, mpm_role) DO UPDATE
SET mpm_accessible = EXCLUDED.mpm_accessible;
