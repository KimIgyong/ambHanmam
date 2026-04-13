# TC-일정관리-Test-20250224

## 1. 단위 테스트 케이스

### 1.1 Backend - Entity 검증

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-001 | ScheduleEntity | 필수 필드 누락 시 유효성 검증 | 에러 반환 |
| TC-SCH-002 | ScheduleEntity | schCategory enum 검증 | MEETING/TASK/EVENT/REMINDER/OUT_OF_OFFICE/PERSONAL/OTHER만 허용 |
| TC-SCH-003 | ScheduleEntity | schVisibility enum 검증 | PRIVATE/SHARED/DEPARTMENT/ENTITY만 허용 |
| TC-SCH-004 | ScheduleEntity | schPriority enum 검증 | LOW/NORMAL/HIGH/URGENT만 허용 |
| TC-SCH-005 | ScheduleRecurrenceEntity | scrFrequency enum 검증 | DAILY/WEEKLY/BIWEEKLY/MONTHLY/YEARLY만 허용 |
| TC-SCH-006 | ScheduleExceptionEntity | sexType enum 검증 | CANCELLED/RESCHEDULED만 허용 |
| TC-SCH-007 | ScheduleParticipantEntity | Unique(schId, usrId) 제약 검증 | 중복 참석자 불가 |

### 1.2 Backend - DTO 검증

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-010 | CreateScheduleRequest | title 빈값 | Validation Error |
| TC-SCH-011 | CreateScheduleRequest | start_datetime > end_datetime | Validation Error |
| TC-SCH-012 | CreateScheduleRequest | 유효한 recurrence 중첩 DTO | 성공 |
| TC-SCH-013 | UpdateScheduleRequest | current_updated_at 누락 | Validation Error |
| TC-SCH-014 | RespondScheduleRequest | 유효하지 않은 status 값 | Validation Error |
| TC-SCH-015 | AddParticipantsRequest | 빈 user_ids 배열 | Validation Error |

### 1.3 Backend - Service CRUD

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-020 | ScheduleService.create | 정상 생성 | schedule + recurrence + participants + notifications 저장 |
| TC-SCH-021 | ScheduleService.findAll | 날짜 범위 필터 | start_date~end_date 범위 일정만 반환 |
| TC-SCH-022 | ScheduleService.findAll | PRIVATE 필터 | 본인 일정만 반환 |
| TC-SCH-023 | ScheduleService.findAll | DEPARTMENT 필터 | 동일 부서 일정 반환 (하위 부서 포함) |
| TC-SCH-024 | ScheduleService.findAll | 매니저 접근 | MANAGER 이상은 부서원 일정 조회 가능 |
| TC-SCH-025 | ScheduleService.update | 정상 수정 (낙관적 잠금) | schUpdatedAt 일치 시 성공 |
| TC-SCH-026 | ScheduleService.update | 낙관적 잠금 충돌 | 409 Conflict 반환 |
| TC-SCH-027 | ScheduleService.remove | Soft Delete | schDeletedAt 설정, 데이터 유지 |
| TC-SCH-028 | ScheduleService.remove | 타인 일정 삭제 시도 | ForbiddenException |

### 1.4 Backend - Recurrence & Exception

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-030 | ScheduleService.createException | CANCELLED 예외 생성 | exception 레코드 생성 |
| TC-SCH-031 | ScheduleService.createException | RESCHEDULED 예외 생성 | 새 시간 정보 포함 저장 |
| TC-SCH-032 | ScheduleService.getExceptions | 예외 목록 조회 | 해당 일정의 모든 예외 반환 |

### 1.5 Backend - Participants

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-040 | ScheduleService.addParticipants | 참석자 추가 | 새 participant 레코드 생성 |
| TC-SCH-041 | ScheduleService.respondToSchedule | ACCEPTED 응답 | scpResponseStatus = ACCEPTED, scpRespondedAt 설정 |
| TC-SCH-042 | ScheduleService.respondToSchedule | DECLINED 응답 | scpResponseStatus = DECLINED |
| TC-SCH-043 | ScheduleService.removeParticipant | 참석자 제거 | Soft Delete |

### 1.6 Backend - Reminder & Google Sync

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-050 | ScheduleReminderService | Cron 실행 시 미래 리마인더 조회 | 5분 내 리마인더 감지 |
| TC-SCH-051 | GoogleCalendarSyncService | 연결 성공 | connected: true 반환 |
| TC-SCH-052 | GoogleCalendarSyncService | 3회 재시도 후 실패 | RETRY_EXCEEDED 에러 |

### 1.7 Frontend - 컴포넌트

| TC-ID | 대상 | 테스트 내용 | 기대 결과 |
|-------|------|------------|-----------|
| TC-SCH-060 | CalendarMonthView | 월간 그리드 렌더링 | 42셀 (6주 × 7일) 표시 |
| TC-SCH-061 | CalendarMonthView | 일정 표시 | 해당 날짜에 최대 3개 + "+N" 표시 |
| TC-SCH-062 | CalendarWeekView | 주간 타임그리드 렌더링 | 24시간 × 7일 그리드 |
| TC-SCH-063 | CalendarDayView | 일간 뷰 렌더링 | 24시간 타임라인 |
| TC-SCH-064 | CalendarToolbar | 뷰 전환 | 월/주/일 전환 동작 |
| TC-SCH-065 | CalendarToolbar | 필터 모드 전환 | ALL/MY/DEPARTMENT/SHARED 필터 |
| TC-SCH-066 | ScheduleFormModal | 신규 생성 폼 | 필수 필드 입력 후 저장 |
| TC-SCH-067 | ScheduleFormModal | 수정 폼 | 기존 데이터 로드 후 수정 |
| TC-SCH-068 | ScheduleDetailPanel | 상세 패널 렌더링 | 일정 정보 + 참석자 + 응답 버튼 |

## 2. 통합 테스트 시나리오

### 2.1 일정 CRUD 플로우

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 캘린더 페이지 접근 | 월간 뷰 표시 |
| 2 | "일정 추가" 클릭 | 폼 모달 출현 |
| 3 | 제목/카테고리/시간 입력 후 저장 | 캘린더에 새 일정 표시 |
| 4 | 일정 클릭 | 상세 패널 표시 |
| 5 | 수정 버튼 → 수정 후 저장 | 변경 내용 반영 |
| 6 | 삭제 버튼 → 확인 | 일정 제거 |

### 2.2 반복 일정 예외 처리

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 매주 반복 일정 생성 | recurrence 레코드 생성 |
| 2 | 특정 날짜 취소 (CANCELLED) | exception 생성, 해당 날짜 미표시 |
| 3 | 특정 날짜 변경 (RESCHEDULED) | 새 시간으로 표시 |

### 2.3 참석자 관리 플로우

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 일정 생성 시 참석자 지정 | 참석자 목록에 추가 |
| 2 | 참석자가 ACCEPTED 응답 | 응답 상태 업데이트 |
| 3 | 참석자 제거 | 목록에서 제거 |

### 2.4 권한(ACL) 검증

| 단계 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | PRIVATE 일정 조회 → 타인 접근 | 403 Forbidden |
| 2 | DEPARTMENT 일정 → 동일 부서원 접근 | 정상 조회 |
| 3 | ENTITY 일정 → 타 부서원 접근 | 정상 조회 |
| 4 | MANAGER가 부서원 일정 조회 | 정상 조회 |

## 3. 엣지 케이스

| TC-ID | 시나리오 | 기대 결과 |
|-------|---------|-----------|
| EC-SCH-001 | 종료 시간 < 시작 시간 | 유효성 에러 |
| EC-SCH-002 | 동시 수정 (낙관적 잠금) | 먼저 저장한 사용자 성공, 두 번째 409 |
| EC-SCH-003 | 삭제된 일정 수정 시도 | 404 Not Found |
| EC-SCH-004 | 존재하지 않는 참석자 ID | 400 Bad Request |
| EC-SCH-005 | 1000개 이상 일정 월간 조회 | 페이지네이션 동작 |
| EC-SCH-006 | UTC/KST 시간대 변환 | ISO 8601 기준 올바른 렌더링 |
| EC-SCH-007 | 빈 제목으로 생성 시도 | 프론트엔드 + 백엔드 양측 차단 |
