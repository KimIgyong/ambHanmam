# REQ-AttendanceCurrentWeekEdit-20260406
# 근태 스케줄 당일/금주 등록 허용

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **요청일** | 2026-04-06 |
| **요청자** | 운영팀 |
| **심각도** | HIGH — 핵심 기능 차단 |
| **요약** | 근태 스케줄 등록 시 당일 및 이번 주에도 등록이 가능해야 한다. 현재는 월요일이 되면 해당 주간 전체가 입력 불가(읽기 전용) 상태가 된다. |

## 2. AS-IS 현황 분석

### 2.1 프론트엔드 (`AttendancePage.tsx`)

**`getNextMonday()` 함수 (라인 22-29)**
```typescript
function getNextMonday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const daysUntil = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntil);
  return nextMonday;
}
```

**`isDateEditable()` 함수 (라인 57-64)**
```typescript
function isDateEditable(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const nextMonday = getNextMonday();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const oneMonth = new Date(today);
  oneMonth.setMonth(oneMonth.getMonth() + 1);
  return date >= nextMonday && date <= oneMonth;
}
```

**문제점**: `isDateEditable()`이 `date >= nextMonday`을 검사하므로, 이번 주 날짜는 항상 `nextMonday`보다 이전이 되어 편집 불가.

| 요일 | dayOfWeek | 8 - dayOfWeek | nextMonday | 이번 주 편집 |
|------|-----------|---------------|------------|-------------|
| 월 | 1 | 7일 후 | 다음주 월 | ❌ 불가 |
| 화 | 2 | 6일 후 | 다음주 월 | ❌ 불가 |
| 수 | 3 | 5일 후 | 다음주 월 | ❌ 불가 |
| 목 | 4 | 4일 후 | 다음주 월 | ❌ 불가 |
| 금 | 5 | 3일 후 | 다음주 월 | ❌ 불가 |
| 토 | 6 | 2일 후 | 다음주 월 | ❌ 불가 |
| 일 | 0 | 1일 후 | 다음주 월 | ❌ 불가 |

### 2.2 백엔드 (`attendance.service.ts`)

**`getNextMonday()` (라인 64-71)** — 프론트엔드와 동일한 로직.

**`validateDateRange()` (라인 73-92)**
```typescript
private validateDateRange(dateStr: string, allowCurrentWeek = false): void {
  if (allowCurrentWeek) {
    if (date < today || date > oneMonthLater) { throw ... }
  } else {
    if (date < nextMonday || date > oneMonthLater) { throw ... }
  }
}
```

- `allowCurrentWeek = false` (기본값) → `date < nextMonday` 조건으로 이번 주 전체 차단
- `allowCurrentWeek = true` → REMOTE 타입만 해당 (라인 210: `const allowCurrentWeek = item.type === 'REMOTE'`)
- **REMOTE를 제외한 모든 타입**(OFFICE, DAY_OFF, AM_HALF, PM_HALF 등)은 이번 주 등록 불가

### 2.3 영향 범위

| DayCell 컴포넌트 | `editable` prop이 `false` → 셀 비활성화, 회색 배경, 클릭 불가 |
|---|---|
| 스케줄 폼 | 편집 불가능한 날짜는 아예 열리지 않음 |
| API 유효성 검증 | `BadRequestException` 반환 ("유효하지 않은 날짜 범위") |

## 3. TO-BE 요구사항

### 3.1 핵심 변경

> **당일 이후(오늘 포함) 날짜에 대해 모든 스케줄 타입 등록/수정을 허용한다.**

| 규칙 | 설명 |
|------|------|
| 편집 가능 시작일 | **오늘 (today)** |
| 편집 가능 종료일 | 오늘 기준 1개월 후 (기존 유지) |
| 과거 날짜 | 편집 불가 (기존 유지) |
| REMOTE 타입 | 기존과 동일 (당일 등록 시 PENDING 상태) |
| 비-REMOTE 타입 | 당일/이번 주 등록 허용 (기존: 차주 월요일부터만 가능 → **변경**) |

### 3.2 Approval Status 정책

| 조건 | 상태 |
|------|------|
| 당일/이번 주 REMOTE | `PENDING` (기존 유지 — 비예정 WFH) |
| 다음 주 이후 REMOTE | `APPROVED` (기존 유지 — 예정 WFH) |
| 비-REMOTE 모든 날짜 | `APPROVED` (변경 없음) |

## 4. 갭 분석

| 구분 | AS-IS | TO-BE | 변경 |
|------|-------|-------|------|
| FE `isDateEditable()` | `date >= nextMonday` | `date >= today` | 수정 |
| BE `validateDateRange()` | `allowCurrentWeek` = REMOTE만 | 모든 타입에 `allowCurrentWeek = true` | 수정 |
| BE `createAttendances()` | REMOTE만 `allowCurrentWeek=true` | 모든 타입에 `allowCurrentWeek=true` | 수정 |
| FE `getNextMonday()` | 편집 가능 여부 판단에 사용 | 더 이상 편집 판단에 사용하지 않음 | 참조 제거 가능 |

## 5. 사용자 플로우

```
1. 사용자가 /attendance 페이지 접속
2. 이번 주 포함한 주간 뷰 표시
3. 오늘 이후 날짜 셀 → 편집 가능 (파란 테두리)
4. 어제 이전 날짜 셀 → 읽기 전용 (회색)
5. 편집 가능 셀 클릭 → 스케줄 등록 폼 열림
6. 타입 선택 + 저장 → API 호출 → 성공
```

## 6. 기술 제약사항

- `getNextMonday()` 함수는 `isCurrentWeekDate()` 등 다른 곳에서도 사용 → 함수 자체 수정보다는 호출부의 조건 변경이 안전
- REMOTE의 PENDING/APPROVED 분기 로직은 유지해야 함
- 프론트엔드/백엔드 **양쪽 모두** 수정 필수 (한쪽만 수정하면 불일치)
