# Schedule 명칭 통일 - 작업 완료 보고

## 작업 개요
- **작업일**: 2026-02-28
- **목적**: work_schedule → attendance, schedule → calendar 전체 코드베이스 리네이밍
- **배경**: 사이드메뉴 명칭(Attendance, Calendar)과 실제 코드/DB/라우팅 경로 불일치로 인한 혼선 해소

## 변경 요약

### AS-IS → TO-BE

| 구분 | AS-IS | TO-BE |
|------|-------|-------|
| 출근일정 라우팅 | `/work-schedule` | `/attendance` |
| 일정관리 라우팅 | `/schedule` | `/calendar` |
| 출근일정 DB 테이블 | `amb_work_schedules` | `amb_attendances` |
| 일정관리 DB 테이블 | `amb_schedules` | `amb_calendars` |
| 출근일정 API | `/api/v1/work-schedules` | `/api/v1/attendances` |
| 일정관리 API | `/api/v1/schedules` | `/api/v1/calendars` |
| 메뉴 코드 | `WORK_SCHEDULE`, `SCHEDULE` | `ATTENDANCE`, `CALENDAR` |

## 단계별 실행 내역

### Phase 1: DB 마이그레이션 SQL
- `scripts/migrations/20260228-rename-schedule-to-attendance-calendar.sql`
- 7개 섹션: 6개 테이블 RENAME + 컬럼 RENAME + 메뉴 설정 UPDATE

### Phase 2: 백엔드 work_schedule → attendance
- 신규: `apps/api/src/domain/attendance/` (entity, controller, service, mapper, dto, module)
- 삭제: `apps/api/src/domain/work-schedule/` (전체)
- 에러 코드 변경: `SCHEDULE_*` → `ATTENDANCE_*` (E12xxx)
- 메뉴 코드 변경: `WORK_SCHEDULE` → `ATTENDANCE`

### Phase 3: 백엔드 schedule → calendar
- 신규: `apps/api/src/domain/calendar/` (5개 entity, controller, 4개 service, 5개 DTO, module)
- 삭제: `apps/api/src/domain/schedule/` (전체)
- 에러 코드 변경: `SCHEDULE_EVENT_*` → `CALENDAR_*` (E26xxx)
- 메뉴 코드 변경: `SCHEDULE` → `CALENDAR`

### Phase 4: 공유 타입 (packages/types)
- `domain.types.ts`: `WORK_SCHEDULE_TYPE` → `ATTENDANCE_TYPE`, `WorkScheduleResponse` → `AttendanceResponse`
- `domain.types.ts`: `MENU_CODE` — `WORK_SCHEDULE` → `ATTENDANCE` + `CALENDAR` 추가
- `permission.types.ts`: key `workSchedule` → `attendance`, path `/work-schedule` → `/attendance`
- **HR `emp_work_schedule` 필드는 변경하지 않음** (직원 근무패턴, 다른 개념)

### Phase 5: 프론트엔드 work-schedule → attendance
- 신규: `apps/web/src/domain/attendance/` (pages, components, hooks, service)
- 삭제: `apps/web/src/domain/work-schedule/` (전체)
- i18n: `workSchedule.json` → `attendance.json` (en/ko/vi)

### Phase 6: 프론트엔드 schedule → calendar
- 신규: `apps/web/src/domain/calendar/` (pages, components, hooks, service, store)
- 삭제: `apps/web/src/domain/schedule/` (전체)
- i18n: `schedule.json` → `calendar.json` (en/ko/vi)

### Phase 7: 앱 모듈 & 라우터 & 레이아웃 통합
- `apps/api/src/app.module.ts`: import 경로 및 entity/module 참조 업데이트
- `apps/web/src/router/index.tsx`: menuCode `SCHEDULE` → `CALENDAR`
- `apps/web/src/layouts/MainLayout.tsx`: WORK_TOOL_CODES 배열 업데이트
- `apps/web/src/domain/settings/pages/SettingsPage.tsx`: menuCode, i18n 키 업데이트
- `apps/web/src/locales/*/common.json`: E12xxx 에러 메시지, settingsPage 키 업데이트
- `apps/api/src/domain/hr/service/entity-seed.service.ts`: 테이블명 참조 업데이트

### Phase 8: 빌드 검증
- `npm run build`: 4개 패키지 모두 성공
- `npm run lint`: 기존 `no-explicit-any` 에러만 존재 (이번 작업 무관)

## 변경 파일 목록

### 신규 생성
| 파일 | 설명 |
|------|------|
| `scripts/migrations/20260228-rename-schedule-to-attendance-calendar.sql` | DB 마이그레이션 |
| `apps/api/src/domain/attendance/**` | 백엔드 출퇴근 도메인 (7개 파일) |
| `apps/api/src/domain/calendar/**` | 백엔드 캘린더 도메인 (12개 파일) |
| `apps/web/src/domain/attendance/**` | 프론트엔드 출퇴근 도메인 (7개 파일) |
| `apps/web/src/domain/calendar/**` | 프론트엔드 캘린더 도메인 (11개 파일) |
| `apps/web/src/locales/*/attendance.json` | 출퇴근 i18n (3개 파일) |
| `apps/web/src/locales/*/calendar.json` | 캘린더 i18n (3개 파일) |

### 삭제
| 경로 | 설명 |
|------|------|
| `apps/api/src/domain/work-schedule/` | 이전 출근스케줄 백엔드 |
| `apps/api/src/domain/schedule/` | 이전 일정관리 백엔드 |
| `apps/web/src/domain/work-schedule/` | 이전 출근스케줄 프론트엔드 |
| `apps/web/src/domain/schedule/` | 이전 일정관리 프론트엔드 |
| `apps/web/src/locales/*/workSchedule.json` | 이전 출근스케줄 i18n |
| `apps/web/src/locales/*/schedule.json` | 이전 일정관리 i18n |

### 수정
| 파일 | 변경 내용 |
|------|-----------|
| `apps/api/src/app.module.ts` | import 경로 및 entity/module 참조 변경 |
| `apps/api/src/global/constant/error-code.constant.ts` | 에러 코드 리네이밍 |
| `apps/api/src/global/constant/menu-code.constant.ts` | 메뉴 코드 리네이밍 |
| `apps/api/src/domain/settings/service/menu-config.service.ts` | 기본 메뉴 설정 변경 |
| `apps/api/src/domain/hr/service/entity-seed.service.ts` | 테이블명 참조 변경 |
| `packages/types/src/domain.types.ts` | 타입/MENU_CODE 변경 |
| `packages/types/src/permission.types.ts` | 메뉴 권한 키/경로 변경 |
| `apps/web/src/router/index.tsx` | 라우팅 경로 및 menuCode 변경 |
| `apps/web/src/layouts/MainLayout.tsx` | WORK_TOOL_CODES 배열 변경 |
| `apps/web/src/i18n.ts` | 네임스페이스 변경 |
| `apps/web/src/domain/settings/pages/SettingsPage.tsx` | 메뉴코드/i18n 키 변경 |
| `apps/web/src/locales/*/common.json` | 에러 메시지, settingsPage 키 변경 (3개 파일) |

## 배포 주의사항

### 배포 순서 (필수)
1. **DB 마이그레이션 먼저 실행** → `scripts/migrations/20260228-rename-schedule-to-attendance-calendar.sql`
2. **코드 배포** → API + Web
3. **⚠️ 중요**: TypeORM `synchronize: true` 상태에서 코드 배포만 하면 기존 테이블이 DROP 후 CREATE됨 → **반드시 마이그레이션 SQL을 먼저 실행할 것**

### 미변경 항목 (의도적)
- HR 도메인의 `emp_work_schedule` (직원 근무패턴 MON_FRI/MON_SAT) → 다른 개념
- `@nestjs/schedule`의 `ScheduleModule` → NestJS 빌트인 스케줄러
- Google Calendar Sync 서비스명 → 외부 서비스 연동이므로 유지
