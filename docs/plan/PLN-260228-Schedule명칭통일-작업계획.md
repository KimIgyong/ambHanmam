# 작업 계획서: Schedule 명칭 통일

**작성일**: 2026-02-28
**분석서 참조**: `docs/analysis/REQ-Schedule명칭통일-20260228.md`
**예상 변경 파일**: 약 60~70개

---

## 작업 순서 개요

```
Phase 1: DB 마이그레이션 SQL 작성
Phase 2: 백엔드 코드 변경 (work_schedule → attendance)
Phase 3: 백엔드 코드 변경 (schedule → calendar)
Phase 4: 공유 타입 변경 (packages/types)
Phase 5: 프론트엔드 변경 (work-schedule → attendance)
Phase 6: 프론트엔드 변경 (schedule → calendar)
Phase 7: 앱 모듈 & 라우터 & 레이아웃 통합 변경
Phase 8: 빌드 검증 & 테스트
```

---

## Phase 1: DB 마이그레이션 SQL 작성

> 코드 배포 전에 각 환경(개발/스테이징/프로덕션)에서 실행할 SQL

### 1.1 Work Schedule → Attendance

```sql
-- 1) 테이블 RENAME
ALTER TABLE amb_work_schedules RENAME TO amb_attendances;

-- 2) 컬럼 RENAME
ALTER TABLE amb_attendances RENAME COLUMN wks_id TO att_id;
ALTER TABLE amb_attendances RENAME COLUMN wks_date TO att_date;
ALTER TABLE amb_attendances RENAME COLUMN wks_type TO att_type;
ALTER TABLE amb_attendances RENAME COLUMN wks_start_time TO att_start_time;
ALTER TABLE amb_attendances RENAME COLUMN wks_end_time TO att_end_time;
ALTER TABLE amb_attendances RENAME COLUMN wks_created_at TO att_created_at;
ALTER TABLE amb_attendances RENAME COLUMN wks_updated_at TO att_updated_at;
ALTER TABLE amb_attendances RENAME COLUMN wks_deleted_at TO att_deleted_at;
```

### 1.2 Schedule → Calendar

```sql
-- 1) 메인 테이블
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

-- 2) Recurrence 테이블
ALTER TABLE amb_schedule_recurrences RENAME TO amb_calendar_recurrences;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_id TO clr_id;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_freq TO clr_freq;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_interval TO clr_interval;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_weekdays TO clr_weekdays;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_month_day TO clr_month_day;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_end_type TO clr_end_type;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_end_date TO clr_end_date;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_count TO clr_count;
ALTER TABLE amb_calendar_recurrences RENAME COLUMN scr_created_at TO clr_created_at;
-- FK 컬럼도 변경 (sch_id → cal_id)
ALTER TABLE amb_calendar_recurrences RENAME COLUMN sch_id TO cal_id;

-- 3) Exception 테이블
ALTER TABLE amb_schedule_exceptions RENAME TO amb_calendar_exceptions;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_id TO cle_id;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_original_date TO cle_original_date;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_exception_type TO cle_exception_type;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_new_start_at TO cle_new_start_at;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_new_end_at TO cle_new_end_at;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sce_created_at TO cle_created_at;
ALTER TABLE amb_calendar_exceptions RENAME COLUMN sch_id TO cal_id;

-- 4) Participant 테이블
ALTER TABLE amb_schedule_participants RENAME TO amb_calendar_participants;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_id TO clp_id;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_response_status TO clp_response_status;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_responded_at TO clp_responded_at;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_invited_by TO clp_invited_by;
ALTER TABLE amb_calendar_participants RENAME COLUMN scp_created_at TO clp_created_at;
ALTER TABLE amb_calendar_participants RENAME COLUMN sch_id TO cal_id;

-- 5) Notification 테이블
ALTER TABLE amb_schedule_notifications RENAME TO amb_calendar_notifications;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_id TO cln_id;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_reminder_type TO cln_reminder_type;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_custom_minutes TO cln_custom_minutes;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_channels TO cln_channels;
ALTER TABLE amb_calendar_notifications RENAME COLUMN scn_created_at TO cln_created_at;
ALTER TABLE amb_calendar_notifications RENAME COLUMN sch_id TO cal_id;
```

### 1.3 메뉴 설정 DB 데이터 업데이트

```sql
-- amb_menu_config 테이블
UPDATE amb_menu_config SET mcf_menu_code = 'ATTENDANCE', mcf_path = '/attendance' WHERE mcf_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_config SET mcf_menu_code = 'CALENDAR', mcf_path = '/calendar' WHERE mcf_menu_code = 'SCHEDULE';

-- amb_menu_permissions 테이블
UPDATE amb_menu_permissions SET mpm_menu_code = 'ATTENDANCE' WHERE mpm_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_permissions SET mpm_menu_code = 'CALENDAR' WHERE mpm_menu_code = 'SCHEDULE';

-- amb_menu_group_permissions 테이블
UPDATE amb_menu_group_permissions SET mgp_menu_code = 'ATTENDANCE' WHERE mgp_menu_code = 'WORK_SCHEDULE';
UPDATE amb_menu_group_permissions SET mgp_menu_code = 'CALENDAR' WHERE mgp_menu_code = 'SCHEDULE';

-- amb_user_menu_permissions 테이블 (개인별 권한 설정이 있는 경우)
UPDATE amb_user_menu_permissions SET ump_menu_code = 'ATTENDANCE' WHERE ump_menu_code = 'WORK_SCHEDULE';
UPDATE amb_user_menu_permissions SET ump_menu_code = 'CALENDAR' WHERE ump_menu_code = 'SCHEDULE';
```

**산출물**: `scripts/migrations/20260228-rename-schedule-to-calendar.sql`

---

## Phase 2: 백엔드 — work_schedule → attendance

### 2.1 디렉토리 이동
```
apps/api/src/domain/work-schedule/ → apps/api/src/domain/attendance/
```

### 2.2 변경 파일 목록

| # | 파일 (TO-BE 경로) | 주요 변경 |
|---|---|---|
| 1 | `entity/attendance.entity.ts` | 클래스명 `AttendanceEntity`, 테이블 `amb_attendances`, 컬럼 `att_*` |
| 2 | `controller/attendance.controller.ts` | 컨트롤러명, 경로 `/attendances`, 파라미터명 |
| 3 | `service/attendance.service.ts` | 서비스명, 엔티티 참조 변경 |
| 4 | `mapper/attendance.mapper.ts` | 매퍼명, 필드 매핑 att_ → response |
| 5 | `dto/request/create-attendance.request.ts` | DTO 클래스명 |
| 6 | `dto/request/update-attendance.request.ts` | DTO 클래스명 |
| 7 | `attendance.module.ts` | 모듈명, import 경로 |

### 2.3 에러 코드 변경
**파일**: `apps/api/src/global/constant/error-code.constant.ts`

| AS-IS | TO-BE |
|-------|-------|
| `SCHEDULE_NOT_FOUND` | `ATTENDANCE_NOT_FOUND` |
| `SCHEDULE_ACCESS_DENIED` | `ATTENDANCE_ACCESS_DENIED` |
| `SCHEDULE_DUPLICATE_DATE` | `ATTENDANCE_DUPLICATE_DATE` |
| `SCHEDULE_INVALID_DATE_RANGE` | `ATTENDANCE_INVALID_DATE_RANGE` |
| `SCHEDULE_REMOTE_LIMIT_EXCEEDED` | `ATTENDANCE_REMOTE_LIMIT_EXCEEDED` |
| `SCHEDULE_WEEKEND_NOT_ALLOWED` | `ATTENDANCE_WEEKEND_NOT_ALLOWED` |

### 2.4 메뉴 코드 변경
**파일**: `apps/api/src/global/constant/menu-code.constant.ts`
- `WORK_SCHEDULE` → `ATTENDANCE`
- `SCHEDULE` → `CALENDAR`
- `DEFAULT_PERMISSIONS` 내 키 변경

**파일**: `apps/api/src/domain/settings/service/menu-config.service.ts`
- DEFAULT_MENU_CONFIGS에서 menuCode, path 변경

---

## Phase 3: 백엔드 — schedule → calendar

### 3.1 디렉토리 이동
```
apps/api/src/domain/schedule/ → apps/api/src/domain/calendar/
```

### 3.2 변경 파일 목록

| # | 파일 (TO-BE 경로) | 주요 변경 |
|---|---|---|
| 1 | `entity/calendar.entity.ts` | 클래스명 `CalendarEntity`, 테이블 `amb_calendars`, 컬럼 `cal_*` |
| 2 | `entity/calendar-recurrence.entity.ts` | 클래스명, 테이블, 컬럼 prefix `clr_` |
| 3 | `entity/calendar-exception.entity.ts` | 클래스명, 테이블, 컬럼 prefix `cle_` |
| 4 | `entity/calendar-participant.entity.ts` | 클래스명, 테이블, 컬럼 prefix `clp_` |
| 5 | `entity/calendar-notification.entity.ts` | 클래스명, 테이블, 컬럼 prefix `cln_` |
| 6 | `controller/calendar.controller.ts` | 컨트롤러명, 경로 `/calendars` |
| 7 | `service/calendar.service.ts` | 서비스명, 엔티티 참조 |
| 8 | `service/calendar-ai.service.ts` | 서비스명, 엔티티 참조 |
| 9 | `service/calendar-reminder.service.ts` | 서비스명, 엔티티 참조 |
| 10 | `service/google-calendar-sync.service.ts` | 엔티티 참조 변경 (서비스명은 유지 가능) |
| 11 | `dto/request/create-calendar.request.ts` | DTO명, 필드명 `sch_*` → `cal_*` |
| 12 | `dto/request/update-calendar.request.ts` | DTO명, 필드명 |
| 13 | `dto/request/create-calendar-exception.request.ts` | DTO명, 필드명 `sce_*` → `cle_*` |
| 14 | `dto/request/add-participants.request.ts` | 변경 미미 (필드가 participant_ids) |
| 15 | `dto/request/respond-calendar.request.ts` | DTO명, 필드명 `scp_*` → `clp_*` |
| 16 | `calendar.module.ts` | 모듈명, import 경로, 엔티티 등록 |

---

## Phase 4: 공유 타입 변경 (packages/types)

### 4.1 domain.types.ts
| AS-IS | TO-BE |
|-------|-------|
| `WORK_SCHEDULE_TYPE` | `ATTENDANCE_TYPE` |
| `WorkScheduleType` | `AttendanceType` |
| `WorkScheduleResponse` | `AttendanceResponse` |
| 응답 필드 `scheduleId` | `attendanceId` |

### 4.2 permission.types.ts
| AS-IS | TO-BE |
|-------|-------|
| `key: 'workSchedule'` | `key: 'attendance'` |
| `path: '/work-schedule'` | `path: '/attendance'` |

> 참고: schedule에 대한 permission이 없으므로 calendar 추가 여부 검토 (현재 MenuGuard로 처리)

---

## Phase 5: 프론트엔드 — work-schedule → attendance

### 5.1 디렉토리 이동
```
apps/web/src/domain/work-schedule/ → apps/web/src/domain/attendance/
```

### 5.2 변경 파일 목록

| # | 파일 (TO-BE 경로) | 주요 변경 |
|---|---|---|
| 1 | `pages/AttendancePage.tsx` | 컴포넌트명, 제목, 훅 호출 |
| 2 | `components/ScheduleTypeBadge.tsx` → `AttendanceTypeBadge.tsx` | 컴포넌트명, 타입 참조 |
| 3 | `components/DayCell.tsx` | import 경로 |
| 4 | `components/ScheduleFormModal.tsx` → `AttendanceFormModal.tsx` | 컴포넌트명, 타입 |
| 5 | `components/WeekBulkFormModal.tsx` | import 경로, 타입 참조 |
| 6 | `hooks/useAttendance.ts` | 훅명, API 경로 |
| 7 | `service/attendance.service.ts` | 클래스명, base path `/attendances` |

### 5.3 i18n 파일 변경

**파일명 변경**:
- `locales/en/workSchedule.json` → `locales/en/attendance.json`
- `locales/ko/workSchedule.json` → `locales/ko/attendance.json`
- `locales/vi/workSchedule.json` → `locales/vi/attendance.json`

**내용 변경**:
- ko: `"title": "출퇴근"`, `"subtitle": "다음 주 이후의 출퇴근 일정을 등록하세요."`
- en: `"title": "Attendance"`, `"subtitle": "Register your attendance schedule for next week onwards."`
- vi: `"title": "Chấm công"`, `"subtitle": "Đăng ký lịch chấm công từ tuần sau trở đi."`

**i18n.ts 변경**: import 경로 및 네임스페이스 `workSchedule` → `attendance`

---

## Phase 6: 프론트엔드 — schedule → calendar

### 6.1 디렉토리 이동
```
apps/web/src/domain/schedule/ → apps/web/src/domain/calendar/
```

### 6.2 변경 파일 목록

| # | 파일 (TO-BE 경로) | 주요 변경 |
|---|---|---|
| 1 | `pages/CalendarPage.tsx` | 컴포넌트명, i18n namespace |
| 2 | `components/CalendarToolbar.tsx` | import 경로 |
| 3 | `components/CalendarMonthView.tsx` | import 경로 |
| 4 | `components/CalendarWeekView.tsx` | import 경로 |
| 5 | `components/CalendarDayView.tsx` | import 경로 |
| 6 | `components/ScheduleFormModal.tsx` → `CalendarFormModal.tsx` | 컴포넌트명, 타입 |
| 7 | `components/ScheduleDetailPanel.tsx` → `CalendarDetailPanel.tsx` | 컴포넌트명 |
| 8 | `hooks/useCalendar.ts` | 훅명, API 경로 |
| 9 | `service/calendar.service.ts` | 클래스명, base path `/calendars` |
| 10 | `store/calendar.store.ts` | 스토어명 |

### 6.3 i18n 파일 변경

**파일명 변경**:
- `locales/en/schedule.json` → `locales/en/calendar.json`
- `locales/ko/schedule.json` → `locales/ko/calendar.json`
- `locales/vi/schedule.json` → `locales/vi/calendar.json`

**내용 변경**:
- ko: `"title": "캘린더"`, `"subtitle": "캘린더에서 일정을 관리하세요"`
- en: `"title": "Calendar"`, `"subtitle": "Manage your events on the calendar"`
- vi: `"title": "Lịch biểu"`, `"subtitle": "Quản lý sự kiện trên lịch"`

**i18n.ts 변경**: import 경로 및 네임스페이스 `schedule` → `calendar`

---

## Phase 7: 앱 모듈 & 라우터 & 레이아웃 통합 변경

### 7.1 백엔드 app.module.ts
- import 경로: `./domain/work-schedule/` → `./domain/attendance/`
- import 경로: `./domain/schedule/` → `./domain/calendar/`
- 엔티티 등록: `WorkScheduleEntity` → `AttendanceEntity`
- 엔티티 등록: `CalScheduleEntity` → `CalendarEntity` (+ 관련 4개 엔티티)
- 모듈 등록: `WorkScheduleModule` → `AttendanceModule`
- 모듈 등록: `CalendarScheduleModule` → `CalendarModule`
- `@nestjs/schedule`과 이름 충돌 해소 (더 이상 alias 불필요할 수 있음, 단 `CalendarModule`도 충돌 가능성은 없으므로 정리)

### 7.2 프론트엔드 router/index.tsx
- `path: 'work-schedule'` → `path: 'attendance'`
- `element: <WorkSchedulePage />` → `element: <AttendancePage />`
- `path: 'schedule'` → `path: 'calendar'`
- `element: <SchedulePage />` → `element: <CalendarPage />`
- MenuGuard menuCode: `"SCHEDULE"` → `"CALENDAR"`

### 7.3 프론트엔드 MainLayout.tsx
- `WORK_TOOL_CODES` 배열: `'WORK_SCHEDULE'` → `'ATTENDANCE'`, `'SCHEDULE'` → `'CALENDAR'`
- WORK_SCHEDULE 자동 추가 로직: menuCode, path 변경

---

## Phase 8: 빌드 검증 & 테스트

### 8.1 빌드 검증
```bash
npm run build          # 전체 빌드 (types → api → web)
npm run lint           # 린트 검사
```

### 8.2 검증 항목
- [ ] 프론트 빌드 성공
- [ ] 백엔드 빌드 성공
- [ ] 타입 패키지 빌드 성공
- [ ] `/attendance` 라우팅 정상
- [ ] `/calendar` 라우팅 정상
- [ ] API `/api/v1/attendances` 응답 확인
- [ ] API `/api/v1/calendars` 응답 확인
- [ ] 화면 제목 표시 확인 (ko/en/vi)
- [ ] 기존 "schedule" 문자열 잔여 검색 (false positive 제외)

---

## 사이드 임팩트 주의사항

### 배포 순서 (필수 준수)
```
1. DB 마이그레이션 SQL 실행 (서비스 중단 상태에서)
2. 코드 배포 (api + web)
3. 서비스 재시작
```

### TypeORM synchronize 주의
- **개발 환경**: `synchronize: true`이므로 SQL 마이그레이션 실행 후 서버 시작하면 정상 매핑
- **스테이징/프로덕션**: `synchronize: false`이므로 SQL 마이그레이션만으로 충분

### 롤백 계획
마이그레이션 SQL의 역방향 스크립트도 함께 준비:
- `amb_attendances` → `amb_work_schedules` (RENAME 역방향)
- `amb_calendars` → `amb_schedules` (RENAME 역방향)
- 메뉴 코드 UPDATE 역방향

---

## 변경 파일 전체 요약

| 구분 | 파일 수 | 주요 파일 |
|------|:---:|---|
| SQL 마이그레이션 | 1 | `scripts/migrations/20260228-rename-schedule.sql` |
| 백엔드 (attendance) | 7 | entity, controller, service, mapper, dto×2, module |
| 백엔드 (calendar) | 16 | entity×5, controller, service×4, dto×5, module |
| 백엔드 (공통) | 3 | app.module.ts, error-code.constant.ts, menu-code.constant.ts |
| 백엔드 (메뉴) | 1 | menu-config.service.ts |
| 공유 타입 | 2 | domain.types.ts, permission.types.ts |
| 프론트 (attendance) | 7 | page, components×4, hook, service |
| 프론트 (calendar) | 10 | page, components×7, hook, service, store |
| 프론트 (i18n) | 7 | attendance×3, calendar×3, i18n.ts |
| 프론트 (공통) | 2 | router/index.tsx, MainLayout.tsx |
| **합계** | **~56개** | |
