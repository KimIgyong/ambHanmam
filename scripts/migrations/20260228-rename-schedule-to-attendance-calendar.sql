-- ============================================================
-- Migration: Schedule 명칭 통일
-- Date: 2026-02-28
-- work_schedule → attendance, schedule → calendar
-- ============================================================

BEGIN;

-- ──────────────────────────────────────
-- 1. Work Schedule → Attendance
-- ──────────────────────────────────────

ALTER TABLE amb_work_schedules RENAME TO amb_attendances;

ALTER TABLE amb_attendances RENAME COLUMN wks_id TO att_id;
ALTER TABLE amb_attendances RENAME COLUMN wks_date TO att_date;
ALTER TABLE amb_attendances RENAME COLUMN wks_type TO att_type;
ALTER TABLE amb_attendances RENAME COLUMN wks_start_time TO att_start_time;
ALTER TABLE amb_attendances RENAME COLUMN wks_end_time TO att_end_time;
ALTER TABLE amb_attendances RENAME COLUMN wks_created_at TO att_created_at;
ALTER TABLE amb_attendances RENAME COLUMN wks_updated_at TO att_updated_at;
ALTER TABLE amb_attendances RENAME COLUMN wks_deleted_at TO att_deleted_at;

-- ──────────────────────────────────────
-- 2. Schedule → Calendar (메인)
-- ──────────────────────────────────────

ALTER TABLE amb_schedules RENAME TO amb_calendars;

ALTER TABLE amb_calendars RENAME COLUMN sch_id TO cal_id;
ALTER TABLE amb_calendars RENAME COLUMN sch_title TO cal_title;
ALTER TABLE amb_calendars RENAME COLUMN sch_description TO cal_description;
ALTER TABLE amb_calendars RENAME COLUMN sch_start_at TO cal_start_at;
ALTER TABLE amb_calendars RENAME COLUMN sch_end_at TO cal_end_at;
ALTER TABLE amb_calendars RENAME COLUMN sch_is_all_day TO cal_is_all_day;
ALTER TABLE amb_calendars RENAME COLUMN sch_location TO cal_location;
ALTER TABLE amb_calendars RENAME COLUMN sch_category TO cal_category;
ALTER TABLE amb_calendars RENAME COLUMN sch_visibility TO cal_visibility;
ALTER TABLE amb_calendars RENAME COLUMN sch_color TO cal_color;
ALTER TABLE amb_calendars RENAME COLUMN sch_recurrence_type TO cal_recurrence_type;
ALTER TABLE amb_calendars RENAME COLUMN sch_google_event_id TO cal_google_event_id;
ALTER TABLE amb_calendars RENAME COLUMN sch_sync_status TO cal_sync_status;
ALTER TABLE amb_calendars RENAME COLUMN sch_sync_at TO cal_sync_at;
ALTER TABLE amb_calendars RENAME COLUMN sch_created_at TO cal_created_at;
ALTER TABLE amb_calendars RENAME COLUMN sch_updated_at TO cal_updated_at;
ALTER TABLE amb_calendars RENAME COLUMN sch_deleted_at TO cal_deleted_at;

-- ──────────────────────────────────────
-- 3. Schedule Recurrence → Calendar Recurrence
-- ──────────────────────────────────────

ALTER TABLE amb_schedule_recurrences RENAME TO amb_calendar_recurrences;

ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_id TO clr_id;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN sch_id TO cal_id;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_freq TO clr_freq;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_interval TO clr_interval;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_weekdays TO clr_weekdays;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_month_day TO clr_month_day;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_end_type TO clr_end_type;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_end_date TO clr_end_date;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_count TO clr_count;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_created_at TO clr_created_at;

-- ──────────────────────────────────────
-- 4. Schedule Exception → Calendar Exception
-- ──────────────────────────────────────

ALTER TABLE amb_schedule_exceptions RENAME TO amb_calendar_exceptions;

ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_id TO cle_id;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sch_id TO cal_id;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_original_date TO cle_original_date;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_exception_type TO cle_exception_type;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_new_start_at TO cle_new_start_at;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_new_end_at TO cle_new_end_at;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_created_at TO cle_created_at;

-- ──────────────────────────────────────
-- 5. Schedule Participant → Calendar Participant
-- ──────────────────────────────────────

ALTER TABLE amb_schedule_participants RENAME TO amb_calendar_participants;

ALTER TABLE amb_calendar_participants RENAME COLUMN scp_id TO clp_id;
ALTER TABLE amb_calendar_participants RENAME COLUMN sch_id TO cal_id;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_response_status TO clp_response_status;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_responded_at TO clp_responded_at;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_invited_by TO clp_invited_by;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_created_at TO clp_created_at;

-- ──────────────────────────────────────
-- 6. Schedule Notification → Calendar Notification
-- ──────────────────────────────────────

ALTER TABLE amb_schedule_notifications RENAME TO amb_calendar_notifications;

ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_id TO cln_id;
ALTER TABLE amb_calendar_notifications RENAME COLUMN sch_id TO cal_id;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_reminder_type TO cln_reminder_type;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_custom_minutes TO cln_custom_minutes;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_channels TO cln_channels;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_created_at TO cln_created_at;

-- ──────────────────────────────────────
-- 7. 메뉴 설정 데이터 UPDATE
-- ──────────────────────────────────────

UPDATE amb_menu_config SET mcf_menu_code = 'ATTENDANCE', mcf_path = '/attendance' WHERE mcf_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_config SET mcf_menu_code = 'CALENDAR', mcf_path = '/calendar' WHERE mcf_menu_code = 'SCHEDULE';

UPDATE amb_menu_permissions SET mpm_menu_code = 'ATTENDANCE' WHERE mpm_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_permissions SET mpm_menu_code = 'CALENDAR' WHERE mpm_menu_code = 'SCHEDULE';

UPDATE amb_menu_group_permissions SET mgp_menu_code = 'ATTENDANCE' WHERE mgp_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_group_permissions SET mgp_menu_code = 'CALENDAR' WHERE mgp_menu_code = 'SCHEDULE';

UPDATE amb_user_menu_permissions SET ump_menu_code = 'ATTENDANCE' WHERE ump_menu_code = 'WORK_SCHEDULE';
UPDATE amb_user_menu_permissions SET ump_menu_code = 'CALENDAR' WHERE ump_menu_code = 'SCHEDULE';

COMMIT;
