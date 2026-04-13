-- =====================================================
-- Department AI Agent System — Database Schema
-- (부서별 AI 에이전트 시스템 데이터베이스 스키마)
-- Project: AMB Management
-- Database: db_amb_hanmam
-- Table Prefix: amb_
-- Created: 2026-02-14
-- =====================================================

-- Enable UUID extension (UUID 확장 활성화)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: amb_users (사용자)
-- Column Prefix: usr_
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_users (
    usr_id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_email       VARCHAR(200)    NOT NULL,
    usr_password    VARCHAR(200)    NOT NULL,
    usr_name        VARCHAR(50)     NOT NULL,
    usr_department  VARCHAR(30)     NULL,
    usr_role        VARCHAR(20)     NOT NULL DEFAULT 'USER',
    usr_created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usr_updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usr_deleted_at  TIMESTAMP       NULL
);

-- Unique email constraint (excluding soft-deleted records)
CREATE UNIQUE INDEX idx_amb_users_email
    ON amb_users (usr_email)
    WHERE usr_deleted_at IS NULL;

-- =====================================================
-- Table: amb_conversations (대화)
-- Column Prefix: cvs_
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_conversations (
    cvs_id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_id              UUID            NOT NULL,
    cvs_department      VARCHAR(30)     NOT NULL,
    cvs_title           VARCHAR(200)    NULL,
    cvs_message_count   INTEGER         NOT NULL DEFAULT 0,
    cvs_created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cvs_updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cvs_deleted_at      TIMESTAMP       NULL,

    CONSTRAINT fk_conversations_user
        FOREIGN KEY (usr_id)
        REFERENCES amb_users (usr_id)
        ON DELETE CASCADE
);

-- Index for filtered conversation listing
CREATE INDEX idx_amb_conversations_user_dept
    ON amb_conversations (usr_id, cvs_department, cvs_deleted_at);

-- Index for ordering by update time
CREATE INDEX idx_amb_conversations_updated
    ON amb_conversations (cvs_updated_at DESC)
    WHERE cvs_deleted_at IS NULL;

-- =====================================================
-- Table: amb_messages (메시지)
-- Column Prefix: msg_
-- =====================================================
CREATE TABLE IF NOT EXISTS amb_messages (
    msg_id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    cvs_id          UUID            NOT NULL,
    msg_role        VARCHAR(20)     NOT NULL,
    msg_content     TEXT            NOT NULL,
    msg_token_count INTEGER         NULL,
    msg_order       INTEGER         NOT NULL,
    msg_created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_messages_conversation
        FOREIGN KEY (cvs_id)
        REFERENCES amb_conversations (cvs_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_msg_role
        CHECK (msg_role IN ('user', 'assistant'))
);

-- Index for ordered message retrieval within conversation
CREATE INDEX idx_amb_messages_conversation_order
    ON amb_messages (cvs_id, msg_order);

-- =====================================================
-- Comments (테이블/컬럼 코멘트)
-- =====================================================
COMMENT ON TABLE amb_users IS 'User accounts for AMB Management system (AMB 사용자 계정)';
COMMENT ON TABLE amb_conversations IS 'AI agent conversations per department (부서별 AI 에이전트 대화)';
COMMENT ON TABLE amb_messages IS 'Individual messages within conversations (대화 내 개별 메시지)';

COMMENT ON COLUMN amb_users.usr_role IS 'User role: USER or ADMIN (사용자 역할)';
COMMENT ON COLUMN amb_users.usr_deleted_at IS 'Soft delete timestamp (소프트 삭제 시각)';
COMMENT ON COLUMN amb_conversations.cvs_department IS 'Department code: MANAGEMENT, ACCOUNTING, HR, LEGAL, SALES, IT, MARKETING, GENERAL_AFFAIRS, PLANNING';
COMMENT ON COLUMN amb_messages.msg_role IS 'Message sender role: user or assistant';
COMMENT ON COLUMN amb_messages.msg_order IS 'Sequential order within conversation (대화 내 순서)';
