# 요구사항 분석서: Schedule 명칭 통일 (work_schedule → attendance, schedule → calendar)

**작성일**: 2026-02-28
**상태**: 분석 완료

---

## 1. 배경 및 문제점

현재 시스템에 두 가지 일정 관련 기능이 존재한다:
- **Work Schedule (출퇴근)**: 직원 근무 일정 등록 (출근/재택/휴가 등)
- **Schedule (캘린더)**: 일반 일정 관리 (회의/개인/프로젝트 일정 등)

사이드메뉴 표시명은 이미 **Attendance(출퇴근)** / **Calendar(캘린더)**로 변경되었으나, 내부 시스템 전반에 걸쳐 기존 명칭(`work_schedule`, `schedule`)이 그대로 사용되고 있어 혼선이 발생한다.

### 혼선 포인트
| 항목 | 사이드메뉴 (변경됨) | URL 경로 (미변경) | 화면 제목 (미변경) | DB/코드 (미변경) |
|------|:---:|:---:|:---:|:---:|
| 출퇴근 | Attendance | /work-schedule | Work Schedule / 출근 스케줄 | work_schedule / wks_ |
| 캘린더 | Calendar | /schedule | Schedule / 일정 관리 | schedule / sch_ |

**핵심 문제**: "schedule"이라는 단어가 양쪽 모두에 사용되어, URL·제목·코드에서 어느 기능을 가리키는지 즉시 구분이 어려움.

---

## 2. AS-IS 현황

### 2.1 Work Schedule (출퇴근) — 현재 상태

| 항목 | AS-IS 값 |
|------|----------|
| **사이드메뉴 라벨** | ✅ `common:sidebar.attendance` (변경 완료) |
| **메뉴 코드** | `WORK_SCHEDULE` |
| **URL 경로** | `/work-schedule` |
| **API 경로** | `/api/v1/work-schedules` |
| **화면 제목 (ko)** | "출근 스케줄" |
| **화면 제목 (en)** | "Work Schedule" |
| **화면 제목 (vi)** | "Lịch làm việc" |
| **i18n 네임스페이스** | `workSchedule` |
| **DB 테이블** | `amb_work_schedules` |
| **DB 컬럼 prefix** | `wks_` |
| **프론트 도메인 디렉토리** | `apps/web/src/domain/work-schedule/` |
| **백엔드 도메인 디렉토리** | `apps/api/src/domain/work-schedule/` |
| **타입 정의** | `WorkScheduleType`, `WorkScheduleResponse` |
| **에러 코드** | E12001~E12006 (`SCHEDULE_*`) |

### 2.2 Schedule (캘린더) — 현재 상태

| 항목 | AS-IS 값 |
|------|----------|
| **사이드메뉴 라벨** | ✅ `common:sidebar.calendar` (변경 완료) |
| **메뉴 코드** | `SCHEDULE` |
| **URL 경로** | `/schedule` |
| **API 경로** | `/api/v1/schedules` |
| **화면 제목 (ko)** | "일정 관리" |
| **화면 제목 (en)** | "Schedule" |
| **화면 제목 (vi)** | "Lịch trình" |
| **i18n 네임스페이스** | `schedule` |
| **DB 테이블 (메인)** | `amb_schedules` |
| **DB 관련 테이블** | `amb_schedule_recurrences`, `amb_schedule_exceptions`, `amb_schedule_participants`, `amb_schedule_notifications` |
| **DB 컬럼 prefix** | `sch_`, `scr_`, `sce_`, `scp_`, `scn_` |
| **프론트 도메인 디렉토리** | `apps/web/src/domain/schedule/` |
| **백엔드 도메인 디렉토리** | `apps/api/src/domain/schedule/` |
| **타입 정의** | `ScheduleEntity`, `ScheduleResponse` 등 |

---

## 3. TO-BE 목표

### 3.1 Work Schedule → **Attendance** (출퇴근)

| 항목 | TO-BE 값 |
|------|----------|
| **사이드메뉴 라벨** | 유지 (`common:sidebar.attendance`) |
| **메뉴 코드** | `ATTENDANCE` |
| **URL 경로** | `/attendance` |
| **API 경로** | `/api/v1/attendances` |
| **화면 제목 (ko)** | "출퇴근" |
| **화면 제목 (en)** | "Attendance" |
| **화면 제목 (vi)** | "Chấm công" |
| **i18n 네임스페이스** | `attendance` |
| **DB 테이블** | `amb_attendances` |
| **DB 컬럼 prefix** | `att_` |
| **프론트 도메인 디렉토리** | `apps/web/src/domain/attendance/` |
| **백엔드 도메인 디렉토리** | `apps/api/src/domain/attendance/` |
| **타입 정의** | `AttendanceType`, `AttendanceResponse` |
| **에러 코드** | E12001~E12006 (메시지 키 `ATTENDANCE_*`로 변경) |

### 3.2 Schedule → **Calendar** (캘린더)

| 항목 | TO-BE 값 |
|------|----------|
| **사이드메뉴 라벨** | 유지 (`common:sidebar.calendar`) |
| **메뉴 코드** | `CALENDAR` |
| **URL 경로** | `/calendar` |
| **API 경로** | `/api/v1/calendars` |
| **화면 제목 (ko)** | "캘린더" |
| **화면 제목 (en)** | "Calendar" |
| **화면 제목 (vi)** | "Lịch biểu" |
| **i18n 네임스페이스** | `calendar` |
| **DB 테이블 (메인)** | `amb_calendars` |
| **DB 관련 테이블** | `amb_calendar_recurrences`, `amb_calendar_exceptions`, `amb_calendar_participants`, `amb_calendar_notifications` |
| **DB 컬럼 prefix** | `cal_`, `clr_`, `cle_`, `clp_`, `cln_` |
| **프론트 도메인 디렉토리** | `apps/web/src/domain/calendar/` |
| **백엔드 도메인 디렉토리** | `apps/api/src/domain/calendar/` |
| **타입 정의** | `CalendarEntity`, `CalendarResponse` 등 |

---

## 4. 갭 분석

### 4.1 변경 범위 요약

| 레이어 | Work Schedule → Attendance | Schedule → Calendar |
|--------|:-:|:-:|
| DB 테이블명 | 1개 | 5개 |
| DB 컬럼명 | wks_ → att_ (9개 컬럼) | sch_ → cal_ 외 4개 prefix (약 40개 컬럼) |
| API 컨트롤러 | 1개 | 1개 |
| API 서비스 | 1개 | 4개 (메인+AI+알림+Google) |
| API 엔티티 | 1개 | 5개 |
| API DTO | 2개 | 5개 |
| API 매퍼 | 1개 | 매퍼 내장 |
| 프론트 페이지 | 1개 | 1개 |
| 프론트 컴포넌트 | 4개 | 6개 |
| 프론트 훅 | 1개 | 1개+ |
| 프론트 서비스 | 1개 | 1개 |
| 프론트 스토어 | 없음 | 1개 |
| i18n 파일 | 3개 (ko/en/vi) | 3개 (ko/en/vi) |
| 공유 타입 | domain.types.ts | domain.types.ts |
| 권한 설정 | permission.types.ts | permission.types.ts |
| 메뉴 설정 | menu-config, menu-code | menu-config, menu-code |
| 라우터 | router/index.tsx | router/index.tsx |
| 앱 모듈 | app.module.ts | app.module.ts |
| 메인 레이아웃 | MainLayout.tsx | MainLayout.tsx |

### 4.2 DB 변경 상세

#### Work Schedule → Attendance

**테이블 변경**: `amb_work_schedules` → `amb_attendances`

| AS-IS 컬럼 | TO-BE 컬럼 |
|------------|------------|
| `wks_id` | `att_id` |
| `wks_date` | `att_date` |
| `wks_type` | `att_type` |
| `wks_start_time` | `att_start_time` |
| `wks_end_time` | `att_end_time` |
| `wks_created_at` | `att_created_at` |
| `wks_updated_at` | `att_updated_at` |
| `wks_deleted_at` | `att_deleted_at` |

> FK 컬럼 `ent_id`, `usr_id`는 prefix 변경 불필요

#### Schedule → Calendar

**메인 테이블**: `amb_schedules` → `amb_calendars`

| AS-IS 컬럼 | TO-BE 컬럼 |
|------------|------------|
| `sch_id` | `cal_id` |
| `sch_title` | `cal_title` |
| `sch_description` | `cal_description` |
| `sch_start_at` | `cal_start_at` |
| `sch_end_at` | `cal_end_at` |
| `sch_is_all_day` | `cal_is_all_day` |
| `sch_location` | `cal_location` |
| `sch_category` | `cal_category` |
| `sch_visibility` | `cal_visibility` |
| `sch_color` | `cal_color` |
| `sch_recurrence_type` | `cal_recurrence_type` |
| `sch_google_event_id` | `cal_google_event_id` |
| `sch_sync_status` | `cal_sync_status` |
| `sch_sync_at` | `cal_sync_at` |
| `sch_created_at` | `cal_created_at` |
| `sch_updated_at` | `cal_updated_at` |
| `sch_deleted_at` | `cal_deleted_at` |

**Recurrence 테이블**: `amb_schedule_recurrences` → `amb_calendar_recurrences`

| AS-IS | TO-BE |
|-------|-------|
| `scr_id` | `clr_id` |
| `scr_freq` | `clr_freq` |
| `scr_interval` | `clr_interval` |
| `scr_weekdays` | `clr_weekdays` |
| `scr_month_day` | `clr_month_day` |
| `scr_end_type` | `clr_end_type` |
| `scr_end_date` | `clr_end_date` |
| `scr_count` | `clr_count` |
| `scr_created_at` | `clr_created_at` |

**Exception 테이블**: `amb_schedule_exceptions` → `amb_calendar_exceptions`

| AS-IS | TO-BE |
|-------|-------|
| `sce_id` | `cle_id` |
| `sce_original_date` | `cle_original_date` |
| `sce_exception_type` | `cle_exception_type` |
| `sce_new_start_at` | `cle_new_start_at` |
| `sce_new_end_at` | `cle_new_end_at` |
| `sce_created_at` | `cle_created_at` |

**Participant 테이블**: `amb_schedule_participants` → `amb_calendar_participants`

| AS-IS | TO-BE |
|-------|-------|
| `scp_id` | `clp_id` |
| `scp_response_status` | `clp_response_status` |
| `scp_responded_at` | `clp_responded_at` |
| `scp_invited_by` | `clp_invited_by` |
| `scp_created_at` | `clp_created_at` |

**Notification 테이블**: `amb_schedule_notifications` → `amb_calendar_notifications`

| AS-IS | TO-BE |
|-------|-------|
| `scn_id` | `cln_id` |
| `scn_reminder_type` | `cln_reminder_type` |
| `scn_custom_minutes` | `cln_custom_minutes` |
| `scn_channels` | `cln_channels` |
| `scn_created_at` | `cln_created_at` |

---

## 5. 사이드 임팩트 분석

### 5.1 DB 수준
- **기존 데이터 보존**: 테이블/컬럼 RENAME으로 데이터 손실 없이 변경 가능
- **인덱스 자동 재생성**: PostgreSQL ALTER TABLE RENAME 시 인덱스는 유지됨
- **FK 제약조건**: `sch_id` → `cal_id` 참조하는 하위 테이블 모두 동시 변경 필요
- **DB 메뉴 설정**: `amb_menu_config`, `amb_menu_permissions`, `amb_menu_group_permissions`에 저장된 `WORK_SCHEDULE`/`SCHEDULE` 메뉴 코드 UPDATE 필요

### 5.2 백엔드 수준
- **@nestjs/schedule 충돌**: `app.module.ts`에서 이미 `ScheduleModule as NestScheduleModule`로 alias 처리 중. calendar로 변경하면 이 충돌 해소됨
- **에러 코드**: E12xxx 코드 번호는 유지하되 메시지 키만 `SCHEDULE_*` → `ATTENDANCE_*`로 변경
- **API 호환성**: 기존 `/work-schedules`, `/schedules` 경로로의 요청은 404가 됨 (하위 호환 불필요 — 내부 시스템)

### 5.3 프론트엔드 수준
- **라우팅**: 기존 URL 북마크/히스토리 무효화 (내부 시스템으로 영향 미미)
- **i18n**: 네임스페이스 변경 시 `i18n.ts` import/등록 모두 변경
- **zustand 스토어**: schedule.store.ts → calendar.store.ts

### 5.4 외부 연동
- **Google Calendar 동기화**: schedule 도메인 내 `google-calendar-sync.service.ts`가 존재. 코드 내부 리네이밍만 필요하며 Google API 호출 자체는 영향 없음

### 5.5 환경별 영향
| 환경 | 영향 | 조치 |
|------|------|------|
| 개발 | `synchronize: true`로 자동 반영 가능하나, RENAME은 지원 안 됨 → DROP+CREATE 될 위험 | SQL 마이그레이션 필수 |
| 스테이징 | 기존 데이터 있음 | SQL 마이그레이션 실행 |
| 프로덕션 | 기존 데이터 있음 | SQL 마이그레이션 실행 |

> **주의**: TypeORM `synchronize`는 테이블/컬럼 RENAME을 감지하지 못하고 DROP+CREATE로 처리할 수 있음. 반드시 수동 SQL 마이그레이션을 먼저 실행한 후 코드 배포해야 함.

---

## 6. 기술 제약사항

1. **마이그레이션 우선**: DB 스키마 변경(RENAME)은 코드 배포 전에 실행되어야 함
2. **TypeORM synchronize 비활성화**: 마이그레이션 실행 시 synchronize가 테이블을 재생성하지 않도록 주의
3. **전체 서비스 중단 필요**: DB 변경 + 코드 배포가 동시에 이루어져야 하므로 짧은 다운타임 발생
4. **모노레포 빌드 순서**: `packages/types` → `apps/api` → `apps/web` 순으로 빌드 필요
