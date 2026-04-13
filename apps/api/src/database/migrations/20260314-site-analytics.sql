-- 사이트 이용통계: GA 설정 컬럼 + 이벤트 로그 테이블
-- 2026-03-14

-- 1. amb_site_settings에 GA Measurement ID 컬럼 추가
ALTER TABLE amb_site_settings
  ADD COLUMN IF NOT EXISTS sts_ga_measurement_id VARCHAR(30) DEFAULT NULL;

-- 2. 사이트 이벤트 로그 테이블
CREATE TABLE IF NOT EXISTS amb_site_event_logs (
  sel_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sel_site          VARCHAR(20)  NOT NULL,  -- 'portal' | 'app'
  sel_event_type    VARCHAR(50)  NOT NULL,  -- 'page_view' | 'login' | 'register_visit' | 'subscription'
  sel_entity_id     UUID,
  sel_user_id       UUID,
  sel_page_path     VARCHAR(500),
  sel_referrer      VARCHAR(500),
  sel_ip_address    VARCHAR(45),
  sel_user_agent    VARCHAR(500),
  sel_metadata      JSONB        DEFAULT '{}',
  sel_created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sel_site_type_created
  ON amb_site_event_logs (sel_site, sel_event_type, sel_created_at);

CREATE INDEX IF NOT EXISTS idx_sel_entity_created
  ON amb_site_event_logs (sel_entity_id, sel_created_at)
  WHERE sel_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sel_created_at
  ON amb_site_event_logs (sel_created_at);
