-- Asset Management Phase 1 Schema
-- Date: 2026-02-24

CREATE TABLE IF NOT EXISTS amb_assets (
  ast_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id uuid NOT NULL REFERENCES amb_hr_entities(ent_id),
  ast_code varchar(50) NOT NULL UNIQUE,
  ast_name varchar(200) NOT NULL,
  ast_category varchar(30) NOT NULL,
  ast_ownership_type varchar(20) NOT NULL,
  ast_department varchar(50),
  ast_manager_id uuid REFERENCES amb_users(usr_id) ON DELETE SET NULL,
  ast_location varchar(200),
  ast_status varchar(30) NOT NULL DEFAULT 'STORED',
  ast_manufacturer varchar(100),
  ast_model_name varchar(100),
  ast_serial_no varchar(100),
  ast_purchase_date date,
  ast_vendor varchar(150),
  ast_purchase_amount numeric(15,2),
  ast_depreciation_years int,
  ast_residual_value numeric(15,2),
  ast_barcode varchar(100),
  ast_rfid_code varchar(100),
  ast_room_capacity int,
  ast_room_equipments jsonb,
  ast_room_available_from varchar(5),
  ast_room_available_to varchar(5),
  ast_created_at timestamptz NOT NULL DEFAULT now(),
  ast_updated_at timestamptz NOT NULL DEFAULT now(),
  ast_deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS amb_asset_requests (
  asr_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id uuid NOT NULL REFERENCES amb_hr_entities(ent_id),
  asr_request_no varchar(50) NOT NULL UNIQUE,
  asr_requester_id uuid NOT NULL REFERENCES amb_users(usr_id),
  asr_request_type varchar(30) NOT NULL,
  asr_asset_select_mode varchar(30) NOT NULL DEFAULT 'SPECIFIC',
  ast_id uuid REFERENCES amb_assets(ast_id) ON DELETE SET NULL,
  asr_asset_category varchar(30),
  asr_purpose text NOT NULL,
  asr_start_at timestamptz NOT NULL,
  asr_end_at timestamptz NOT NULL,
  asr_place varchar(300),
  asr_status varchar(30) NOT NULL DEFAULT 'DRAFT',
  asr_final_approver_id uuid REFERENCES amb_users(usr_id) ON DELETE SET NULL,
  asr_returned_at timestamptz,
  asr_created_at timestamptz NOT NULL DEFAULT now(),
  asr_updated_at timestamptz NOT NULL DEFAULT now(),
  asr_deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS amb_meeting_reservations (
  mtr_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asr_id uuid NOT NULL REFERENCES amb_asset_requests(asr_id) ON DELETE CASCADE,
  mtr_title varchar(200) NOT NULL,
  mtr_attendee_count int NOT NULL,
  mtr_meeting_type varchar(30) NOT NULL,
  mtr_start_at timestamptz NOT NULL,
  mtr_end_at timestamptz NOT NULL,
  mtr_required_equipments jsonb,
  mtr_created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS amb_asset_approval_histories (
  aah_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asr_id uuid NOT NULL REFERENCES amb_asset_requests(asr_id) ON DELETE CASCADE,
  aah_step varchar(30) NOT NULL,
  aah_status varchar(30) NOT NULL,
  aah_approver_id uuid NOT NULL REFERENCES amb_users(usr_id),
  aah_comment text,
  aah_created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS amb_asset_change_logs (
  acl_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ast_id uuid NOT NULL REFERENCES amb_assets(ast_id) ON DELETE CASCADE,
  acl_changed_by uuid NOT NULL REFERENCES amb_users(usr_id),
  acl_field varchar(100) NOT NULL,
  acl_before_value text,
  acl_after_value text,
  acl_reason varchar(300),
  acl_created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS amb_asset_request_logs (
  arl_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asr_id uuid NOT NULL REFERENCES amb_asset_requests(asr_id) ON DELETE CASCADE,
  arl_changed_by uuid NOT NULL REFERENCES amb_users(usr_id),
  arl_from_status varchar(30),
  arl_to_status varchar(30) NOT NULL,
  arl_reason varchar(300),
  arl_created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_ent_category ON amb_assets(ent_id, ast_category);
CREATE INDEX IF NOT EXISTS idx_assets_ent_status ON amb_assets(ent_id, ast_status);
CREATE INDEX IF NOT EXISTS idx_asset_requests_ent_status ON amb_asset_requests(ent_id, asr_status);
CREATE INDEX IF NOT EXISTS idx_asset_requests_ent_type ON amb_asset_requests(ent_id, asr_request_type);
CREATE INDEX IF NOT EXISTS idx_meeting_reservation_time ON amb_meeting_reservations(mtr_start_at, mtr_end_at);
CREATE INDEX IF NOT EXISTS idx_asset_approval_step ON amb_asset_approval_histories(asr_id, aah_step);
CREATE INDEX IF NOT EXISTS idx_asset_change_log_time ON amb_asset_change_logs(ast_id, acl_created_at);
CREATE INDEX IF NOT EXISTS idx_asset_request_log_time ON amb_asset_request_logs(asr_id, arl_created_at);
