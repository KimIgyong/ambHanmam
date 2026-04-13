-- Migration: 계약 결제 스케줄 기능 추가
-- Date: 2026-04-13
-- Req: REQ-260413-계약등록페이지개선

-- 1. 기존 테이블에 결제 유형 + 정기 청구 금액 추가
ALTER TABLE amb_bil_contracts
  ADD COLUMN ctr_payment_type VARCHAR(20) DEFAULT NULL,
  ADD COLUMN ctr_billing_amount DECIMAL(15,2) DEFAULT NULL;

-- 2. 비정기 결제 스케줄 테이블 신규 생성
CREATE TABLE amb_bil_payment_schedules (
  pms_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ctr_id UUID NOT NULL REFERENCES amb_bil_contracts(ctr_id) ON DELETE CASCADE,
  pms_seq INT NOT NULL,
  pms_billing_date DATE NOT NULL,
  pms_billing_period VARCHAR(20),
  pms_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  pms_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  pms_created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  pms_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pms_ctr_id ON amb_bil_payment_schedules(ctr_id);
