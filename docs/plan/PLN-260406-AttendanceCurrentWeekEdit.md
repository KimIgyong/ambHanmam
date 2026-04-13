# PLAN-AttendanceCurrentWeekEdit-작업계획-20260406
# 근태 스케줄 당일/금주 등록 허용 — 작업 계획서

## 1. 시스템 개발 현황 분석

### 1.1 관련 파일

| 파일 | 역할 | 수정 여부 |
|------|------|-----------|
| `apps/web/src/domain/attendance/pages/AttendancePage.tsx` | 주간 스케줄 뷰 + 편집 판단 | **수정** |
| `apps/api/src/domain/attendance/service/attendance.service.ts` | 스케줄 생성/수정 유효성 검증 | **수정** |

### 1.2 핵심 로직

**프론트엔드 편집 판단 흐름:**
```
AttendancePage → isDateEditable(dateStr) → getNextMonday()
  → date >= nextMonday ? editable : readonly
  → DayCell 컴포넌트에 editable prop 전달
```

**백엔드 유효성 검증 흐름:**
```
createAttendances() → validateDateRange(date, allowCurrentWeek)
  → allowCurrentWeek = (type === 'REMOTE') 만 true
  → 이번 주 non-REMOTE → BadRequestException
```

## 2. 단계별 구현 계획

### Phase 1: 프론트엔드 편집 가능 범위 수정

**목표**: `isDateEditable()` 함수가 오늘(today) 이후 날짜를 편집 가능으로 판단하도록 변경

**변경 내용:**
```typescript
// AS-IS
function isDateEditable(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const nextMonday = getNextMonday();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMonth = new Date(today);
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  return date >= nextMonday && date <= oneMonth;
}

// TO-BE
function isDateEditable(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMonth = new Date(today);
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  return date >= today && date <= oneMonth;
}
```

**사이드 임팩트**: 없음 — `getNextMonday()` 함수는 다른 곳(`isCurrentWeekDate` 등)에서도 사용되므로 함수 자체는 유지.

### Phase 2: 백엔드 유효성 검증 수정

**목표**: 모든 스케줄 타입에 대해 당일/이번 주 등록 허용

**변경 내용:**
```typescript
// AS-IS (createAttendances 내부)
const allowCurrentWeek = item.type === 'REMOTE';
this.validateDateRange(item.date, allowCurrentWeek);

// TO-BE
this.validateDateRange(item.date, true);  // 모든 타입에 당일 이후 허용
```

**REMOTE PENDING 로직 유지** — `isCurrentWeekDate()` 분기는 그대로:
```typescript
const approvalStatus =
  item.type === 'REMOTE' && this.isCurrentWeekDate(item.date)
    ? 'PENDING'
    : 'APPROVED';
```

**사이드 임팩트**: 
- updateAttendance/amendAttendance 등 다른 메서드에서도 `validateDateRange` 호출 여부 확인 필요
- REMOTE 타입의 PENDING 상태 분기는 유지 (비예정 WFH 승인 프로세스 보존)

## 3. 변경 파일 목록

| 구분 | 파일 경로 | 변경 유형 |
|------|-----------|-----------|
| FE | `apps/web/src/domain/attendance/pages/AttendancePage.tsx` | 수정 |
| BE | `apps/api/src/domain/attendance/service/attendance.service.ts` | 수정 |

## 4. 사이드 임팩트 분석

| 영향 항목 | 위험도 | 설명 |
|-----------|--------|------|
| REMOTE PENDING 로직 | 없음 | `isCurrentWeekDate()` 분기 유지 → 영향 없음 |
| `getNextMonday()` 함수 | 없음 | 함수 자체 미수정, 호출부만 변경 |
| 다른 메서드 (update/amend) | 낮음 | `validateDateRange` 호출 여부 확인 후 동일 적용 |
| DayCell 컴포넌트 | 없음 | `editable` prop 변경만으로 자동 반영 |
| 기존 데이터 | 없음 | 이미 등록된 스케줄에 영향 없음 |

## 5. DB 마이그레이션

**불필요** — DB 스키마 변경 없음. 순수 로직 수정.

## 6. 검증 항목

| 시나리오 | 기대 결과 |
|----------|-----------|
| 월요일에 오늘(월) 스케줄 OFFICE 등록 | ✅ 성공 |
| 월요일에 이번 주 수요일 스케줄 등록 | ✅ 성공 |
| 어제 날짜에 스케줄 등록 시도 | ❌ 차단 (과거 날짜) |
| 1개월 이후 날짜에 등록 시도 | ❌ 차단 (범위 초과) |
| 당일 REMOTE 등록 | ✅ 성공, PENDING 상태 |
| 다음 주 REMOTE 등록 | ✅ 성공, APPROVED 상태 |
