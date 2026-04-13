# 요구사항 분석서: Today Dashboard v2.1 — Daily Snapshot & History Calendar

| 항목 | 내용 |
|------|------|
| **문서 ID** | REQ-TodayDashboardV2.1-DailySnapshot-20260308 |
| **작성일** | 2026-03-08 |
| **원본 요구사항** | `reference/today-dashboard-v2.1-requirements.md` |
| **상태** | 분석 완료 |

---

## 1. 요구사항 요약

v2.1은 **Daily Snapshot** 기능을 추가한다:
- 미션 저장 완료 시 당일 Today 전체 데이터를 JSONB 스냅샷으로 자동 생성
- 달력 형태로 과거 Today 기록 탐색 (History Calendar)
- 과거 스냅샷에 메모 추가/수정/삭제 (본문은 불변)

---

## 2. AS-IS 현황 분석

### 2.1 구현 완료 (v1.0 범위)

| 기능 | 파일 | 상태 |
|------|------|------|
| `/today/me` 개인 오늘 현황 | `today.service.ts` → `getMyToday()` | ✅ |
| `/today/team` 셀 현황 | `today.service.ts` → `getTeamToday()` | ✅ |
| `/today/all` 전사 현황 | `today.service.ts` → `getAllToday()` | ✅ |
| AI 업무 분석 (SSE) | `today.controller.ts` → `POST /today/ai-analysis` | ✅ |
| AI 리포트 저장/조회/삭제 | `TodayReportEntity` + CRUD | ✅ |
| 3탭 UI (나의/셀/모두) | `TodayPage.tsx` + 3개 패널 | ✅ |
| 멤버 상세 모달 | `MemberDetailModal.tsx` | ✅ |
| 카드뷰/리스트뷰 전환 | `TeamTodayPanel`, `AllTodayPanel` | ✅ |
| DM 연동 (Amoeba Talk) | 각 패널 내 DM 버튼 | ✅ |

### 2.2 미구현 (v2.0 전제 조건)

| 기능 | 요구사항 ID | 상태 | 비고 |
|------|------------|------|------|
| **DailyMission 엔티티** | F-02 | ❌ 미구현 | `amb_daily_missions` 테이블 없음 |
| **Login Greeting Modal** | F-01 | ❌ 미구현 | `DailyMissionModal` 없음 |
| **Yesterday Check** | F-03 | ❌ 미구현 | 미션 달성도 평가 없음 |
| **GreetingService** | F-01 | ❌ 미구현 | `greeting.service.ts` 없음 |
| **사무실 IP 관리** | F-01 | ❌ 미구현 | `amb_office_ips` 없음 |
| **Stats Cards (하단 통계)** | F-05 | △ 부분 | `TodaySummaryBar` 존재하나 미션 연동 없음 |

### 2.3 미구현 (v2.1 신규)

| 기능 | 요구사항 ID | 상태 |
|------|------------|------|
| Daily Snapshot 자동 생성 | F-06 | ❌ |
| Today History Calendar | F-07 | ❌ |
| Snapshot Memo CRUD | F-08 | ❌ |
| `amb_today_snapshots` 테이블 | - | ❌ |
| `amb_today_snapshot_memos` 테이블 | - | ❌ |

---

## 3. 갭 분석 (GAP Analysis)

### 3.1 v2.1 직접 구현 가능 여부

v2.1의 스냅샷 기능은 **미션 저장 완료를 트리거**로 동작한다. 그러나 현재 시스템에는 미션 기능(v2.0)이 없다.

```
의존성 체인:
v2.1 스냅샷 ← v2.0 미션 저장 (트리거) ← v2.0 DailyMission 엔티티/API
v2.1 달력 색상 ← v2.0 어제 체크 (check_score) ← v2.0 Yesterday Check
```

### 3.2 전략: v2.0 + v2.1 통합 구현

v2.0의 핵심 기능(미션 CRUD, 어제 체크)과 v2.1(스냅샷, 히스토리)를 **단일 작업으로 통합 구현**한다.

단, v2.0 중 아래 항목은 **이번 스코프에서 제외**:
- **Login Greeting Modal** (F-01): 로그인 플로우 변경은 별도 작업
- **사무실 IP 판별** (F-01 부분): 인프라 의존성이 높아 후속 작업

### 3.3 구현 스코프 정의

| 구분 | 기능 | 포함 여부 |
|------|------|----------|
| **v2.0 필수** | DailyMission 엔티티 + API | ✅ 포함 |
| **v2.0 필수** | Yesterday Check (달성도 4단계) | ✅ 포함 |
| **v2.0 필수** | 미션 UI 섹션 (TodayPage 내) | ✅ 포함 |
| v2.0 선택 | Login Greeting Modal | ❌ 제외 (후속) |
| v2.0 선택 | 사무실 IP 판별 | ❌ 제외 (후속) |
| **v2.1 전체** | Daily Snapshot 자동 생성 | ✅ 포함 |
| **v2.1 전체** | Today History Calendar | ✅ 포함 |
| **v2.1 전체** | Snapshot Memo CRUD | ✅ 포함 |
| **v2.1 전체** | Snapshot Detail Page | ✅ 포함 |

---

## 4. 데이터 모델 분석

### 4.1 신규 테이블 (3개)

#### amb_daily_missions (v2.0 전제)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| msn_id | UUID PK | |
| ent_id | UUID FK | 법인 |
| usr_id | UUID FK | 사용자 |
| msn_date | DATE | 미션 날짜 |
| msn_content | TEXT nullable | 미션 텍스트 (null=넘기기) |
| msn_check_result | VARCHAR(20) nullable | HALF/PARTIAL/ALL_DONE/EXCEED |
| msn_check_score | SMALLINT nullable | 50/75/100/110 |
| msn_created_at | TIMESTAMP | |
| msn_updated_at | TIMESTAMP | |
| UNIQUE | (usr_id, msn_date) | 하루 1개 |

#### amb_today_snapshots (v2.1)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| snp_id | UUID PK | |
| ent_id | UUID FK | 법인 |
| usr_id | UUID FK | 사용자 |
| msn_id | UUID FK | 연결 미션 |
| snp_date | DATE | 스냅샷 날짜 |
| snp_title | VARCHAR(100) | "{y}년 {m}월 {d}일 · {name}'s Today" |
| snp_data | JSONB | 불변 스냅샷 데이터 |
| snp_captured_at | TIMESTAMP | |
| snp_created_at | TIMESTAMP | |
| UNIQUE | (usr_id, snp_date) | 하루 1개 |

#### amb_today_snapshot_memos (v2.1)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| smo_id | UUID PK | |
| snp_id | UUID FK | 스냅샷 |
| usr_id | UUID FK | 작성자 |
| smo_content | TEXT | 최대 2000자 |
| smo_order | SMALLINT | 정렬 순서 |
| smo_created_at | TIMESTAMP | |
| smo_updated_at | TIMESTAMP | |
| smo_deleted_at | TIMESTAMP nullable | soft delete |

### 4.2 기존 엔티티 활용

| 엔티티 | 테이블 | 스냅샷 수집 대상 |
|--------|--------|----------------|
| TodoEntity | amb_todos | 할일 전체 (지연/당일/진행/예정/완료) |
| IssueEntity | amb_work_items | 이슈 (등록자/담당자 기준) |
| CalendarEntity | amb_calendars | 당일 스케줄 |
| UserEntity | amb_users | 사용자 표시명 |

---

## 5. API 분석

### 5.1 신규 API (7개)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/today/mission` | 미션 저장 (+ 스냅샷 자동 생성) |
| PATCH | `/today/mission/:date` | 미션 수정 |
| PATCH | `/today/mission/:date/check` | 어제 체크 결과 저장 |
| GET | `/today/snapshots/calendar?year=&month=` | 달력 조회 |
| GET | `/today/snapshots/:date` | 스냅샷 상세 |
| POST | `/today/snapshots/:snpId/memos` | 메모 추가 |
| PATCH | `/today/snapshots/:snpId/memos/:memoId` | 메모 수정 |
| DELETE | `/today/snapshots/:snpId/memos/:memoId` | 메모 삭제 |

### 5.2 기존 API 변경

| API | 변경 내용 |
|-----|----------|
| `GET /today/me` | 응답에 `mission` 필드 추가 (오늘 미션 텍스트) |

---

## 6. 프론트엔드 분석

### 6.1 신규 페이지

| 파일 | 경로 | 설명 |
|------|------|------|
| `TodayHistoryPage.tsx` | `/today/history/:date` | 스냅샷 상세 열람 |

### 6.2 수정 페이지

| 파일 | 변경 |
|------|------|
| `TodayPage.tsx` | 우측 History Calendar 패널 추가 |
| `MyTodayPanel.tsx` | 상단 미션 섹션 추가 (작성/수정/표시) |

### 6.3 신규 컴포넌트 (12개)

```
history/
  TodayHistoryCalendar.tsx    # 달력 (우측 패널)
  HistoryCalendarCell.tsx     # 날짜 셀 (점 + 색상)

snapshot/
  SnapshotHeader.tsx          # 날짜·인사·체크 결과
  SnapshotMissionSection.tsx  # 미션 읽기 전용
  SnapshotTodosSection.tsx    # 할일 그룹별 표시
  SnapshotIssuesSection.tsx   # 이슈 (등록/담당 구분)
  SnapshotSchedulesSection.tsx # 스케줄 표시
  SnapshotMemoSection.tsx     # 메모 목록 + 추가
  SnapshotMemoItem.tsx        # 개별 메모 (수정/삭제)
  SnapshotMemoEditor.tsx      # 메모 작성/수정 에디터
  SnapshotNavigation.tsx      # 이전/다음 스냅샷 이동

mission/
  MissionSection.tsx          # MyTodayPanel 내 미션 입력/표시
```

---

## 7. 사이드 임팩트 분석

| 영향 범위 | 설명 | 위험도 |
|-----------|------|--------|
| `today.module.ts` | 3개 엔티티, 2개 서비스 추가 | 낮음 |
| `today.controller.ts` | 8개 엔드포인트 추가 | 낮음 |
| `MyTodayPanel.tsx` | 미션 섹션 추가 | 낮음 (기존 섹션 유지) |
| `TodayPage.tsx` | 우측 패널 레이아웃 변경 | 중간 (레이아웃 구조 변경) |
| `router/index.tsx` | `/today/history/:date` 라우트 추가 | 낮음 |
| Calendar 모듈 | CalendarEntity 읽기 전용 참조 | 낮음 |
| 스테이징 DB | 3개 테이블 + 인덱스 생성 | 낮음 (신규 테이블) |

---

## 8. 기술 제약사항

1. **TypeORM UPSERT**: PostgreSQL `ON CONFLICT` 지원 확인 필요 → TypeORM `upsert()` 사용
2. **JSONB 크기**: 스냅샷 데이터는 할일/이슈/스케줄 전체 포함 → 일반적으로 10KB 이하
3. **트랜잭션 분리**: 미션 저장 성공 → 스냅샷 생성은 `try/catch`로 분리 (실패 시 미션은 유지)
4. **CalendarEntity FK**: `amb_calendars` 테이블이 존재하나 Today 모듈에서 직접 import 필요
