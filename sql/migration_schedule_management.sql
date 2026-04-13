-- ============================================================
-- Migration: Schedule Management (일정관리)
-- Version: SCH-REQ-1.1.0
-- Date: 2026-02-24
-- ============================================================

-- 1. amb_schedules (일정 기본)
CREATE TABLE IF NOT EXISTS amb_schedules (
    sch_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ent_id              UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
    usr_id              UUID NOT NULL REFERENCES amb_users(usr_id),
    project_id          UUID NULL,
    sch_title           VARCHAR(300) NOT NULL,
    sch_description     TEXT,
    sch_start_at        TIMESTAMPTZ NOT NULL,
    sch_end_at          TIMESTAMPTZ NOT NULL,
    sch_is_all_day      BOOLEAN NOT NULL DEFAULT false,
    sch_location        VARCHAR(500),
    sch_category        VARCHAR(20) NOT NULL DEFAULT 'WORK',
    sch_visibility      VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    sch_color           VARCHAR(7),
    sch_recurrence_type VARCHAR(10) NOT NULL DEFAULT 'NONE',
    sch_google_event_id VARCHAR(255),
    sch_sync_status     VARCHAR(20) NOT NULL DEFAULT 'NOT_SYNCED',
    sch_sync_at         TIMESTAMPTZ,
    sch_created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sch_updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sch_deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_schedules_owner ON amb_schedules(usr_id, sch_deleted_at);
CREATE INDEX idx_schedules_entity ON amb_schedules(ent_id, sch_visibility, sch_deleted_at);
CREATE INDEX idx_schedules_time ON amb_schedules(sch_start_at, sch_end_at);
CREATE INDEX idx_schedules_project ON amb_schedules(project_id) WHERE project_id IS NOT NULL;

-- 2. amb_schedule_recurrences (반복 규칙 — 1:1)
CREATE TABLE IF NOT EXISTS amb_schedule_recurrences (
    scr_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sch_id          UUID NOT NULL UNIQUE REFERENCES amb_schedules(sch_id) ON DELETE CASCADE,
    scr_freq        VARCHAR(20) NOT NULL,
    scr_interval    INT NOT NULL DEFAULT 1,
    scr_weekdays    SMALLINT,
    scr_month_day   INT,
    scr_end_type    VARCHAR(10) NOT NULL,
    scr_end_date    DATE,
    scr_count       INT,
    scr_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. amb_schedule_exceptions (반복 예외)
CREATE TABLE IF NOT EXISTS amb_schedule_exceptions (
    sce_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sch_id              UUID NOT NULL REFERENCES amb_schedules(sch_id) ON DELETE CASCADE,
    sce_original_date   DATE NOT NULL,
    sce_exception_type  VARCHAR(20) NOT NULL,
    sce_new_start_at    TIMESTAMPTZ,
    sce_new_end_at      TIMESTAMPTZ,
    sce_created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_exceptions_parent ON amb_schedule_exceptions(sch_id, sce_original_date);

-- 4. amb_schedule_participants (참여자)
CREATE TABLE IF NOT EXISTS amb_schedule_participants (
    scp_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sch_id              UUID NOT NULL REFERENCES amb_schedules(sch_id) ON DELETE CASCADE,
    usr_id              UUID NOT NULL REFERENCES amb_users(usr_id),
    scp_response_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
    scp_responded_at    TIMESTAMPTZ,
    scp_invited_by      UUID NOT NULL REFERENCES amb_users(usr_id),
    scp_created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_schedule_participant UNIQUE (sch_id, usr_id)
);

CREATE INDEX idx_participants_user ON amb_schedule_participants(usr_id, scp_response_status);

-- 5. amb_schedule_notifications (알림 설정)
CREATE TABLE IF NOT EXISTS amb_schedule_notifications (
    scn_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sch_id              UUID NOT NULL REFERENCES amb_schedules(sch_id) ON DELETE CASCADE,
    scn_reminder_type   VARCHAR(20) NOT NULL,
    scn_custom_minutes  INT,
    scn_channels        JSONB NOT NULL DEFAULT '["TALK"]',
    scn_created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- sch_category CHECK
ALTER TABLE amb_schedules ADD CONSTRAINT chk_sch_category
    CHECK (sch_category IN ('WORK','MEETING','PERSONAL','PROJECT','HOLIDAY','ETC'));

-- sch_visibility CHECK
ALTER TABLE amb_schedules ADD CONSTRAINT chk_sch_visibility
    CHECK (sch_visibility IN ('PRIVATE','SHARED','DEPARTMENT','ENTITY'));

-- sch_recurrence_type CHECK
ALTER TABLE amb_schedules ADD CONSTRAINT chk_sch_recurrence_type
    CHECK (sch_recurrence_type IN ('NONE','RECURRING'));

-- sch_sync_status CHECK
ALTER TABLE amb_schedules ADD CONSTRAINT chk_sch_sync_status
    CHECK (sch_sync_status IN ('NOT_SYNCED','SYNCED','SYNC_FAILED','DISCONNECTED'));

-- scr_freq CHECK
ALTER TABLE amb_schedule_recurrences ADD CONSTRAINT chk_scr_freq
    CHECK (scr_freq IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY','SEMIANNUAL','YEARLY'));

-- scr_end_type CHECK
ALTER TABLE amb_schedule_recurrences ADD CONSTRAINT chk_scr_end_type
    CHECK (scr_end_type IN ('DATE','COUNT','INFINITE'));

-- sce_exception_type CHECK
ALTER TABLE amb_schedule_exceptions ADD CONSTRAINT chk_sce_exception_type
    CHECK (sce_exception_type IN ('CANCELLED','RESCHEDULED'));

-- scp_response_status CHECK
ALTER TABLE amb_schedule_participants ADD CONSTRAINT chk_scp_response_status
    CHECK (scp_response_status IN ('NONE','ACCEPTED','DECLINED','TENTATIVE'));

-- scn_reminder_type CHECK
ALTER TABLE amb_schedule_notifications ADD CONSTRAINT chk_scn_reminder_type
    CHECK (scn_reminder_type IN ('NONE','5MIN','10MIN','30MIN','1HOUR','1DAY','CUSTOM'));
