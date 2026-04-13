-- ========================================
-- amb_cms_site_config
-- CMS 사이트 글로벌 설정 (Header, Footer, Site Meta)
-- ========================================

CREATE TABLE IF NOT EXISTS amb_cms_site_config (
  csc_id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ent_id            UUID        NOT NULL REFERENCES amb_hr_entities(ent_id),
  csc_key           VARCHAR(100) NOT NULL,                -- HEADER | FOOTER | SITE_META
  csc_value         JSONB       NOT NULL DEFAULT '{}',
  csc_version       INTEGER     NOT NULL DEFAULT 1,
  csc_published_at  TIMESTAMPTZ,
  csc_published_by  UUID        REFERENCES amb_users(usr_id),
  csc_created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  csc_updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  csc_updated_by    UUID        REFERENCES amb_users(usr_id),
  UNIQUE (ent_id, csc_key)
);

CREATE INDEX IF NOT EXISTS idx_csc_entity ON amb_cms_site_config(ent_id);
CREATE INDEX IF NOT EXISTS idx_csc_key ON amb_cms_site_config(csc_key);

COMMENT ON TABLE  amb_cms_site_config IS 'CMS 사이트 글로벌 설정 (Header, Footer, Site Meta)';
COMMENT ON COLUMN amb_cms_site_config.csc_key IS 'HEADER | FOOTER | SITE_META';
COMMENT ON COLUMN amb_cms_site_config.csc_value IS 'JSON 구조: 각 키별 상세 설정';
COMMENT ON COLUMN amb_cms_site_config.csc_version IS '변경 시 자동 증가';
COMMENT ON COLUMN amb_cms_site_config.csc_published_at IS '발행 시점 (NULL이면 미발행)';
