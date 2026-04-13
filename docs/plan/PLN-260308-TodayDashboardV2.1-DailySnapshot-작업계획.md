# 작업 계획서: Today Dashboard v2.1 — Daily Snapshot & History Calendar

| 항목 | 내용 |
|------|------|
| **문서 ID** | PLAN-TodayDashboardV2.1-DailySnapshot-20260308 |
| **작성일** | 2026-03-08 |
| **분석서** | `docs/analysis/REQ-TodayDashboardV2.1-DailySnapshot-20260308.md` |
| **원본** | `reference/today-dashboard-v2.1-requirements.md` |

---

## 작업 범위

v2.0 전제 조건(미션 CRUD, 어제 체크) + v2.1 신규(스냅샷, 히스토리 달력, 메모)를 통합 구현한다.

**제외**: Login Greeting Modal, 사무실 IP 판별 (후속 작업)

---

## Phase 1: DB + 미션 엔티티/API

### 1-1. DB 마이그레이션 (스테이징)

```sql
-- 1. amb_daily_missions
CREATE TABLE amb_daily_missions (
  msn_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id           UUID NOT NULL,
  usr_id           UUID NOT NULL,
  msn_date         DATE NOT NULL,
  msn_content      TEXT,
  msn_check_result VARCHAR(20),
  msn_check_score  SMALLINT,
  msn_created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  msn_updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (usr_id, msn_date)
);

-- 2. amb_today_snapshots
CREATE TABLE amb_today_snapshots (
  snp_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id           UUID NOT NULL,
  usr_id           UUID NOT NULL,
  msn_id           UUID NOT NULL,
  snp_date         DATE NOT NULL,
  snp_title        VARCHAR(100) NOT NULL,
  snp_data         JSONB NOT NULL DEFAULT '{}',
  snp_captured_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  snp_created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (usr_id, snp_date)
);
CREATE INDEX idx_today_snapshots_user_date ON amb_today_snapshots (usr_id, snp_date DESC);

-- 3. amb_today_snapshot_memos
CREATE TABLE amb_today_snapshot_memos (
  smo_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snp_id           UUID NOT NULL REFERENCES amb_today_snapshots(snp_id),
  usr_id           UUID NOT NULL,
  smo_content      TEXT NOT NULL,
  smo_order        SMALLINT NOT NULL DEFAULT 0,
  smo_created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  smo_updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  smo_deleted_at   TIMESTAMP
);
CREATE INDEX idx_snapshot_memos_snp ON amb_today_snapshot_memos (snp_id, smo_order ASC) WHERE smo_deleted_at IS NULL;
```

### 1-2. 백엔드 엔티티 생성

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/today/entity/daily-mission.entity.ts` | DailyMissionEntity |
| `apps/api/src/domain/today/entity/today-snapshot.entity.ts` | TodaySnapshotEntity |
| `apps/api/src/domain/today/entity/today-snapshot-memo.entity.ts` | TodaySnapshotMemoEntity |

### 1-3. 미션 서비스 + API

**파일**: `apps/api/src/domain/today/service/mission.service.ts` (신규)

```
메서드:
  saveMission(userId, entityId, { content })
    → UPSERT amb_daily_missions (usr_id, msn_date=today)
    → content가 있으면 스냅샷 생성 트리거 (try/catch)
    → 응답: { msnId, msnDate, msnContent, snapshotCreated, snapshotId }

  updateMission(userId, date, { content })
    → UPDATE 미션 텍스트
    → 스냅샷 재생성 (덮어쓰기)

  saveCheck(userId, date, { result, score })
    → UPDATE msn_check_result, msn_check_score

  getTodayMission(userId)
    → SELECT 오늘 미션 (없으면 null)
```

**컨트롤러 추가** (`today.controller.ts`):

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/today/mission` | 미션 저장 |
| PATCH | `/today/mission/:date` | 미션 수정 |
| PATCH | `/today/mission/:date/check` | 어제 체크 저장 |

### 1-4. today.module.ts 수정

```typescript
TypeOrmModule.forFeature([
  // 기존
  TodoEntity, IssueEntity, EntityUserRoleEntity,
  UserCellEntity, EmployeeEntity, UserEntity, TodayReportEntity,
  // 추가
  DailyMissionEntity, TodaySnapshotEntity, TodaySnapshotMemoEntity,
  CalendarEntity,  // 스케줄 수집용
])
```

---

## Phase 2: 스냅샷 서비스

### 2-1. snapshot.service.ts (신규)

**파일**: `apps/api/src/domain/today/service/snapshot.service.ts`

```
메서드:
  createSnapshot(userId, entityId, msnId)
    1. 병렬 수집: mission, todos, issues, schedules
    2. SnapshotData JSONB 조립
    3. 사용자 displayName 조회
    4. 제목 생성: "{y}년 {m}월 {d}일 · {displayName}'s Today"
    5. UPSERT amb_today_snapshots (usr_id, snp_date)
    → 반환: TodaySnapshotEntity

  collectTodos(userId, entityId)
    → 분류: overdue, todayDue, inProgress, scheduled, completedToday
    → SnapshotData.todos 반환

  collectIssues(userId, entityId)
    → 등록자(wit_created_by) + 담당자(wit_assignee_id) UNION
    → 중복 제거, role 필드 부여
    → SnapshotData.issues 반환

  collectSchedules(userId, date)
    → CalendarEntity 조회 (당일 일정)
    → SnapshotData.schedules 반환

  collectMission(userId, msnId)
    → DailyMissionEntity 조회
    → SnapshotData.mission 반환
```

### 2-2. 데이터 수집 쿼리 상세

**할일 수집 (TodoEntity)**:
```sql
-- 나의 전체 할일 (미완료 + 오늘 완료)
SELECT * FROM amb_todos
WHERE usr_id = :userId AND ent_id = :entityId
  AND (td_status != 'COMPLETED' OR DATE(td_completed_at) = CURRENT_DATE)
  AND td_deleted_at IS NULL;
```

**이슈 수집 (IssueEntity = amb_work_items)**:
```sql
-- 내가 등록한 + 내가 담당인 미완료 이슈
SELECT *, 'REGISTERED' as role FROM amb_work_items
WHERE wit_created_by = :userId AND wit_status NOT IN ('CLOSED','RESOLVED') AND wit_deleted_at IS NULL
UNION
SELECT *, 'ASSIGNED' as role FROM amb_work_items
WHERE wit_assignee_id = :userId AND wit_status NOT IN ('CLOSED','RESOLVED') AND wit_deleted_at IS NULL;
```

**스케줄 수집 (CalendarEntity = amb_calendars)**:
```sql
SELECT * FROM amb_calendars
WHERE usr_id = :userId AND DATE(cal_start_at) = CURRENT_DATE AND cal_deleted_at IS NULL
ORDER BY cal_start_at ASC;
```

---

## Phase 3: 스냅샷 조회 API

### 3-1. 달력 조회

**엔드포인트**: `GET /today/snapshots/calendar?year=2026&month=3`

```
로직:
  1. amb_today_snapshots WHERE usr_id AND year/month 조회
  2. JOIN amb_daily_missions → check_score, check_result
  3. LEFT JOIN 메모 카운트
  4. 응답: SnapshotCalendarResponse
```

### 3-2. 스냅샷 상세

**엔드포인트**: `GET /today/snapshots/:date`

```
로직:
  1. amb_today_snapshots WHERE usr_id AND snp_date 조회
  2. 메모 목록 (smo_deleted_at IS NULL, ORDER BY smo_order)
  3. 응답: SnapshotDetailResponse (snp_data JSONB + memos[])
```

### 3-3. 메모 CRUD

**파일**: `apps/api/src/domain/today/service/snapshot-memo.service.ts` (신규)

| 엔드포인트 | 로직 |
|-----------|------|
| `POST /today/snapshots/:snpId/memos` | smo_order = MAX+1, content 검증 (1~2000자) |
| `PATCH /today/snapshots/:snpId/memos/:memoId` | 본인 확인, content 업데이트 |
| `DELETE /today/snapshots/:snpId/memos/:memoId` | 본인 확인, soft delete |

---

## Phase 4: 프론트엔드 — 미션 섹션

### 4-1. 미션 UI (MyTodayPanel 상단)

**파일**: `apps/web/src/domain/today/components/mission/MissionSection.tsx` (신규)

```
UI:
  [미션 미작성 시]
    "오늘의 미션을 작성해보세요" + 텍스트에어리어 + 저장 버튼
    "오늘은 넘기기" 링크

  [미션 작성 완료 시]
    🎯 오늘의 미션 + [수정] 버튼
    미션 텍스트 표시
    📊 어제: ✅ 100% 🔥 연속 N일 (어제 체크 결과 표시)

  [어제 체크 미완료 시]
    어제 미션 표시 + 4단계 체크 버튼
    (50% HALF / 75% PARTIAL / 100% ALL_DONE / 110% EXCEED)
```

### 4-2. 서비스/훅 추가

**파일**: `apps/web/src/domain/today/service/today.service.ts` (수정)

```typescript
// 추가 메서드
saveMission(content: string): Promise<SaveMissionResponse>
updateMission(date: string, content: string): Promise<void>
saveMissionCheck(date: string, result: string, score: number): Promise<void>
getSnapshotCalendar(year: number, month: number): Promise<SnapshotCalendarResponse>
getSnapshotDetail(date: string): Promise<SnapshotDetailResponse>
addSnapshotMemo(snpId: string, content: string): Promise<AddMemoResponse>
updateSnapshotMemo(snpId: string, memoId: string, content: string): Promise<void>
deleteSnapshotMemo(snpId: string, memoId: string): Promise<void>
```

**파일**: `apps/web/src/domain/today/hooks/useMyToday.ts` (수정)

```typescript
// 추가 훅
useSaveMission()           // mutation
useUpdateMission()         // mutation
useSaveMissionCheck()      // mutation
useSnapshotCalendar(year, month)  // query
useSnapshotDetail(date)           // query
useAddSnapshotMemo()       // mutation
useUpdateSnapshotMemo()    // mutation
useDeleteSnapshotMemo()    // mutation
```

---

## Phase 5: 프론트엔드 — History Calendar

### 5-1. TodayPage 레이아웃 변경

**파일**: `apps/web/src/domain/today/pages/TodayPage.tsx` (수정)

```
변경:
  기존: 단일 컬럼 (탭 + 콘텐츠)
  변경: 2컬럼 레이아웃
    좌측(flex-1): 기존 탭 콘텐츠 (나의 오늘 탭에서만)
    우측(w-64): History Calendar 패널 (토글 가능)
    모바일: 우측 패널 숨김, 토글 버튼으로 접근
```

### 5-2. TodayHistoryCalendar.tsx (신규)

**파일**: `apps/web/src/domain/today/components/history/TodayHistoryCalendar.tsx`

```
기능:
  - 월 단위 달력 렌더링
  - 월 이동 (< 이전달 / 다음달 >)
  - 스냅샷 있는 날: 색상 점 표시
    회색=체크없음, 주황=50%, 노랑=75%, 초록=100%, 보라=110%
  - 오늘: 파란 테두리
  - 날짜 클릭 → /today/history/{date} 이동
  - 하단 통계: "이번 달 N일 기록 · 평균 달성도 N%"
```

---

## Phase 6: 프론트엔드 — Snapshot Detail Page

### 6-1. 라우터 추가

**파일**: `apps/web/src/router/index.tsx`

```typescript
{ path: 'today/history/:date', element: <MenuGuard menuCode="TODAY"><TodayHistoryPage /></MenuGuard> }
```

### 6-2. TodayHistoryPage.tsx (신규)

**파일**: `apps/web/src/domain/today/pages/TodayHistoryPage.tsx`

```
구조:
  1. Breadcrumb: ← Today / History / {날짜}
  2. SnapshotHeader: 날짜, 접속정보, 어제 달성도
  3. SnapshotMissionSection: 미션 텍스트 (🔒 읽기 전용)
  4. SnapshotTodosSection: 할일 (지연/당일/진행/완료 그룹별)
  5. SnapshotIssuesSection: 이슈 (등록/담당 구분)
  6. SnapshotSchedulesSection: 스케줄
  7. ─── 구분선 ───
  8. SnapshotMemoSection: 메모 목록 + 추가/수정/삭제
  9. SnapshotNavigation: ← 이전 스냅샷 / 달력으로 / 다음 스냅샷 →
```

### 6-3. 스냅샷 섹션 컴포넌트 (6개)

| 파일 | 설명 |
|------|------|
| `SnapshotHeader.tsx` | 날짜 제목, 접속정보, 체크 결과 배지 |
| `SnapshotMissionSection.tsx` | 미션 텍스트 읽기 전용 |
| `SnapshotTodosSection.tsx` | 5개 그룹 (지연/당일/진행/예정/완료) |
| `SnapshotIssuesSection.tsx` | 등록 이슈 + 담당 이슈 2그룹 |
| `SnapshotSchedulesSection.tsx` | 시간순 스케줄 목록 |
| `SnapshotMemoSection.tsx` | 메모 CRUD + 인라인 에디터 |

---

## Phase 7: i18n + 빌드 + 배포

### 7-1. i18n 키 추가

**파일**: `apps/web/src/locales/{ko,en,vi}/today.json`

```
추가 키:
  mission.*    — 미션 관련 (write, save, skip, edit, check 등)
  snapshot.*   — 스냅샷 (created_toast, readonly_badge 등)
  history.*    — 히스토리 달력 (title, calendar_label 등)
  memo.*       — 메모 (add, placeholder, save, delete_confirm 등)
  todo_section.* — 스냅샷 할일 그룹 라벨
  issue_section.* — 스냅샷 이슈 그룹 라벨
```

### 7-2. 공유 타입 추가

**파일**: `packages/types/src/today.types.ts` (신규)

```typescript
interface SnapshotData { ... }
interface SnapshotTaskItem { ... }
interface SnapshotIssueItem { ... }
interface SnapshotScheduleItem { ... }
interface SnapshotCalendarResponse { ... }
interface SnapshotDetailResponse { ... }
interface SaveMissionResponse { ... }
```

### 7-3. 빌드/테스트/배포

```
1. npm run build
2. 커밋/푸시
3. 스테이징 DB 마이그레이션 (3개 테이블)
4. 스테이징 배포
5. 기능 검증
```

---

## 수정 파일 목록

### 백엔드 (신규 6 / 수정 2)

| # | 파일 | 변경 |
|---|------|------|
| 1 | `entity/daily-mission.entity.ts` | **신규** |
| 2 | `entity/today-snapshot.entity.ts` | **신규** |
| 3 | `entity/today-snapshot-memo.entity.ts` | **신규** |
| 4 | `service/mission.service.ts` | **신규** — 미션 CRUD + 스냅샷 트리거 |
| 5 | `service/snapshot.service.ts` | **신규** — 스냅샷 생성/조회 |
| 6 | `service/snapshot-memo.service.ts` | **신규** — 메모 CRUD |
| 7 | `controller/today.controller.ts` | **수정** — 8개 엔드포인트 추가 |
| 8 | `today.module.ts` | **수정** — 엔티티/서비스 등록 |

### 프론트엔드 (신규 12 / 수정 5)

| # | 파일 | 변경 |
|---|------|------|
| 9 | `pages/TodayHistoryPage.tsx` | **신규** |
| 10 | `components/mission/MissionSection.tsx` | **신규** |
| 11 | `components/history/TodayHistoryCalendar.tsx` | **신규** |
| 12 | `components/history/HistoryCalendarCell.tsx` | **신규** |
| 13 | `components/snapshot/SnapshotHeader.tsx` | **신규** |
| 14 | `components/snapshot/SnapshotMissionSection.tsx` | **신규** |
| 15 | `components/snapshot/SnapshotTodosSection.tsx` | **신규** |
| 16 | `components/snapshot/SnapshotIssuesSection.tsx` | **신규** |
| 17 | `components/snapshot/SnapshotSchedulesSection.tsx` | **신규** |
| 18 | `components/snapshot/SnapshotMemoSection.tsx` | **신규** |
| 19 | `components/snapshot/SnapshotNavigation.tsx` | **신규** |
| 20 | `components/snapshot/SnapshotMemoEditor.tsx` | **신규** |
| 21 | `pages/TodayPage.tsx` | **수정** — 레이아웃 + History 패널 |
| 22 | `components/MyTodayPanel.tsx` | **수정** — 미션 섹션 추가 |
| 23 | `service/today.service.ts` | **수정** — API 메서드 추가 |
| 24 | `hooks/useMyToday.ts` | **수정** — 8개 훅 추가 |
| 25 | `router/index.tsx` | **수정** — 라우트 추가 |

### 기타

| # | 파일 | 변경 |
|---|------|------|
| 26 | `packages/types/src/today.types.ts` | **신규** — 공유 타입 |
| 27 | `locales/ko/today.json` | **수정** — 키 추가 |
| 28 | `locales/en/today.json` | **수정** — 키 추가 |
| 29 | `locales/vi/today.json` | **수정** — 키 추가 |

---

## 구현 순서 및 의존성

```
Phase 1 (DB + 미션)
  └→ Phase 2 (스냅샷 서비스) — 미션 엔티티 의존
      └→ Phase 3 (스냅샷 조회 API) — 스냅샷 엔티티 의존
          └→ Phase 5 (History Calendar) — 달력 API 의존
          └→ Phase 6 (Snapshot Detail) — 상세 API 의존
  └→ Phase 4 (미션 UI) — 미션 API 의존
Phase 7 (i18n + 빌드 + 배포) — 전체 완료 후
```

---

## 검증 항목

1. **미션 저장** → `amb_daily_missions` INSERT 확인
2. **스냅샷 자동 생성** → 미션 저장 시 `amb_today_snapshots` UPSERT 확인
3. **스냅샷 데이터** → JSONB에 todos, issues, schedules 포함 확인
4. **"넘기기"** → 미션 content=null 시 스냅샷 미생성 확인
5. **달력 조회** → 월별 스냅샷 존재 날짜 + 색상 점 표시
6. **스냅샷 상세** → 읽기 전용 표시, 수정 불가
7. **메모 CRUD** → 추가/수정/삭제, 본인만 수정 가능
8. **이전/다음 네비게이션** → 스냅샷 있는 날짜끼리만 이동
9. **미션 재저장** → 스냅샷 덮어쓰기 확인
10. **스냅샷 실패 → 미션 유지** → try/catch 분리 확인
