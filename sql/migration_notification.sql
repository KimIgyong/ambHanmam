-- ============================================================
-- 담당자 지정 알림 테이블 생성
-- 할일/이슈/회의록 등에서 담당자로 지정된 유저에게 알림
-- ============================================================

-- 1. amb_notifications 테이블 생성
CREATE TABLE IF NOT EXISTS amb_notifications (
    ntf_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ntf_type VARCHAR(30) NOT NULL,              -- 'TODO_ASSIGNED', 'ISSUE_ASSIGNED', 'NOTE_ASSIGNED', 'CALENDAR_INVITED'
    ntf_title VARCHAR(500) NOT NULL,            -- 알림 제목
    ntf_message TEXT,                           -- 알림 본문
    ntf_recipient_id UUID NOT NULL,             -- 수신자 user ID
    ntf_sender_id UUID NOT NULL,                -- 발신자 user ID
    ntf_resource_type VARCHAR(30) NOT NULL,     -- 'TODO', 'ISSUE', 'MEETING_NOTE', 'CALENDAR'
    ntf_resource_id UUID NOT NULL,              -- 대상 리소스 ID
    ntf_is_read BOOLEAN DEFAULT FALSE,          -- 읽음 여부
    ntf_read_at TIMESTAMP WITH TIME ZONE,       -- 읽은 시간
    ent_id UUID NOT NULL,                       -- 법인 ID
    ntf_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ntf_deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_ntf_recipient FOREIGN KEY (ntf_recipient_id) REFERENCES amb_users(usr_id),
    CONSTRAINT fk_ntf_sender FOREIGN KEY (ntf_sender_id) REFERENCES amb_users(usr_id),
    CONSTRAINT fk_ntf_entity FOREIGN KEY (ent_id) REFERENCES amb_hr_entities(ent_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ntf_recipient_read ON amb_notifications(ntf_recipient_id, ntf_is_read)
WHERE ntf_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ntf_recipient_created ON amb_notifications(ntf_recipient_id, ntf_created_at DESC)
WHERE ntf_deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ntf_resource ON amb_notifications(ntf_resource_type, ntf_resource_id);

-- 3. 테이블 코멘트
COMMENT ON TABLE amb_notifications IS '담당자 지정 알림';
COMMENT ON COLUMN amb_notifications.ntf_type IS '알림 유형: TODO_ASSIGNED, ISSUE_ASSIGNED, NOTE_ASSIGNED, CALENDAR_INVITED';
COMMENT ON COLUMN amb_notifications.ntf_resource_type IS '리소스 유형: TODO, ISSUE, MEETING_NOTE, CALENDAR';
COMMENT ON COLUMN amb_notifications.ntf_is_read IS '읽음 여부';
