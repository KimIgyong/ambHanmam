-- ============================================================
-- 사이트 에러 로깅 테이블 마이그레이션
-- 작성일: 2026-03-25
-- 대상: amb_site_error_logs
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS amb_site_error_logs (
    sel_id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sel_source        VARCHAR(20) NOT NULL,          -- FRONTEND | BACKEND
    sel_app           VARCHAR(30) NOT NULL,          -- WEB | PORTAL_WEB | API | PORTAL_API
    sel_usr_id        UUID,                           -- FK → amb_users (nullable for unauthenticated)
    sel_usr_email     VARCHAR(200),
    sel_usr_level     VARCHAR(30),                    -- ADMIN_LEVEL | USER_LEVEL | PARTNER_LEVEL | CLIENT_LEVEL
    sel_ent_id        UUID,
    sel_page_url      VARCHAR(500),
    sel_api_endpoint  VARCHAR(300),
    sel_http_method   VARCHAR(10),
    sel_http_status   INTEGER,
    sel_error_code    VARCHAR(20),
    sel_error_message TEXT NOT NULL,
    sel_stack_trace   TEXT,
    sel_user_agent    VARCHAR(500),
    sel_ip_address    VARCHAR(45),
    sel_status        VARCHAR(20) DEFAULT 'OPEN' NOT NULL,  -- OPEN | RESOLVED | IGNORED
    sel_resolved_by   UUID,
    sel_resolved_at   TIMESTAMP,
    sel_created_at    TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sel_created_at ON amb_site_error_logs (sel_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sel_source_app ON amb_site_error_logs (sel_source, sel_app);
CREATE INDEX IF NOT EXISTS idx_sel_usr_level ON amb_site_error_logs (sel_usr_level);
CREATE INDEX IF NOT EXISTS idx_sel_error_code ON amb_site_error_logs (sel_error_code);
CREATE INDEX IF NOT EXISTS idx_sel_status ON amb_site_error_logs (sel_status);

-- 3. 테이블 코멘트
COMMENT ON TABLE amb_site_error_logs IS '사이트 에러 로그 - 프론트엔드/백엔드 에러 통합 기록';
COMMENT ON COLUMN amb_site_error_logs.sel_source IS '에러 원천: FRONTEND, BACKEND';
COMMENT ON COLUMN amb_site_error_logs.sel_app IS '앱 구분: WEB, PORTAL_WEB, API, PORTAL_API';
COMMENT ON COLUMN amb_site_error_logs.sel_status IS '처리 상태: OPEN, RESOLVED, IGNORED';
