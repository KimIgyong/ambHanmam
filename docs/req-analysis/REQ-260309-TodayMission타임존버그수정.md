# REQ: Today's Mission 타임존 버그 수정 및 프로세스 개선

**작성일**: 2026-03-09
**상태**: 분석 완료

---

## 1. 현상

- gray.kim@amoeba.group 유저가 3월 8일에 작성한 미션이 3월 9일에도 "오늘의 미션"으로 계속 노출됨
- 새로운 미션 작성 안내가 표시되지 않음

## 2. 원인 분석

### 근본 원인: 서버 타임존(UTC)과 사용자 타임존(UTC+7) 불일치

| 항목 | 값 |
|------|-----|
| Docker 컨테이너 TZ | **UTC** |
| gray.kim 사용자 타임존 | **Asia/Ho_Chi_Minh** (UTC+7) |
| 현재 UTC 시각 | 2026-03-08 23:20 UTC |
| 현재 베트남 시각 | 2026-03-09 06:20 |

### 코드 문제점

`MissionService`의 모든 날짜 계산이 UTC 기준:

```typescript
const today = new Date().toISOString().split('T')[0]; // → UTC 날짜
```

**영향 범위** (5곳):

| 파일 | 메서드 | 문제 |
|------|--------|------|
| `mission.service.ts:21` | `saveMission()` | 미션이 UTC 날짜로 저장됨 |
| `mission.service.ts:67` | `updateMission()` | "당일만 수정" 검증이 UTC 기준 |
| `mission.service.ts:116` | `getTodayMission()` | "오늘" 미션 조회가 UTC 기준 |
| `mission.service.ts:125` | `getYesterdayUncheckedMission()` | "어제" 계산이 UTC 기준 |
| `snapshot.service.ts:37` | `createSnapshot()` | 스냅샷 날짜가 UTC 기준 |
| `today.service.ts:44` | `getMyToday()` | 할일 마감 판단이 UTC 기준 |

### 결과

- **매일 0:00~7:00 (베트남)** / **0:00~9:00 (한국)**: 전날의 미션이 "오늘 미션"으로 보임
- 새 미션 작성 안내가 뜨지 않음
- 어제 미션 체크 요청도 하루 어긋남

## 3. 이미 확보된 인프라

| 항목 | 상태 | 위치 |
|------|------|------|
| 사용자 타임존 DB 필드 | `usrTimezone` (`Asia/Ho_Chi_Minh`) | `amb_users` 테이블 |
| JWT payload에 timezone 포함 | `timezone: 'Asia/Ho_Chi_Minh'` | `auth.service.ts:599` |
| JWT 전략에서 timezone 추출 | **미구현** | `jwt.strategy.ts` |
| UserPayload 인터페이스 timezone | **미정의** | `current-user.decorator.ts` |

## 4. 수정 범위

### 4-1. UserPayload에 timezone 추가

**파일**: `apps/api/src/global/decorator/current-user.decorator.ts`
- `timezone?: string` 필드 추가

### 4-2. JWT Strategy에서 timezone 추출

**파일**: `apps/api/src/domain/auth/strategy/jwt.strategy.ts`
- `validate()` 반환값에 `timezone: payload.timezone || 'Asia/Ho_Chi_Minh'` 추가

### 4-3. 타임존 유틸리티 함수

**신규**: `apps/api/src/global/util/date.util.ts`

```typescript
/** 사용자 타임존 기준 오늘 날짜 (YYYY-MM-DD) */
export function getLocalToday(timezone: string): string { ... }
/** 사용자 타임존 기준 어제 날짜 (YYYY-MM-DD) */
export function getLocalYesterday(timezone: string): string { ... }
```

### 4-4. MissionService 수정

모든 메서드에 `timezone` 파라미터 추가:
- `saveMission(userId, entityId, content, timezone)`
- `updateMission(userId, entityId, date, content, timezone)`
- `getTodayMission(userId, timezone)`
- `getYesterdayUncheckedMission(userId, timezone)`

### 4-5. SnapshotService 수정

- `createSnapshot(userId, entityId, missionId, timezone)`

### 4-6. TodayService 수정

- `getMyToday(userId, entityId, timezone)` — 할일 마감일 비교 시 타임존 반영

### 4-7. TodayController 수정

- `user.timezone`을 서비스 호출에 전달

## 5. 사이드 임팩트

- Team/All 탭: 각 사용자의 타임존이 다를 수 있음 → 조회자 기준으로 통일 (현재와 동일)
- 기존 DB 데이터: 3월 8일 미션은 UTC 기준으로 저장됨 → 변경 불필요 (어차피 3/8이 맞음)
- 스냅샷 히스토리: 기존 것은 UTC 날짜로 저장, 이후부터 로컬 날짜 적용
- 프론트엔드: 변경 불필요 (날짜 표시는 이미 서버 반환값 사용)

## 6. 검증 시나리오

| 시나리오 | 기대 결과 |
|----------|-----------|
| 베트남 06:00 (UTC 23:00) 접속 | 3/9 미션 입력 안내 표시 |
| 베트남 06:00에 미션 저장 | `msn_date = 2026-03-09` |
| 베트남 06:00에 어제 미션 체크 | 3/8 미션 체크 UI 표시 |
| 한국 07:00 (UTC 22:00) 접속 | 3/9 미션 입력 안내 표시 |
