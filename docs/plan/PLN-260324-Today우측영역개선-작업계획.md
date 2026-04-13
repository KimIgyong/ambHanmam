# 작업 계획서: Today 페이지 우측 영역 UI 개선

**문서번호**: PLAN-Today우측영역개선-작업계획-20260324  
**작성일**: 2026-03-24  
**참조**: REQ-Today우측영역개선-20260324  
**상태**: 계획 수립

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 목표 | Today 우측 패널을 조직 소식 통합 사이드바로 개선 |
| 영향 범위 | 프론트엔드만 (백엔드 변경 없음) |
| 변경 파일 | 약 6~8개 |
| 사이드 임팩트 | 낮음 (기존 기능 보존, 우측 패널만 변경) |

---

## 2. 단계별 구현 계획

### Phase 1: TodayHistoryCalendar 주간/월간 모드 지원

**파일**: `apps/web/src/domain/today/components/history/TodayHistoryCalendar.tsx`

#### 1-1. 주간 뷰 모드 추가

```typescript
// props로 viewMode 받거나 내부 state
const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

// 주간 뷰: 현재 주의 7일 (월~일) 표시
// currentWeekStart 계산 → 7일 배열 생성
// 이전/다음 주 네비게이션
// 날짜별 스냅샷 점 표시 (월간과 동일)
// 주간 통계: 기록 일수, 평균 달성도
```

#### 1-2. 월간/주간 토글 버튼

```
[주간 ▼]  ← 클릭 시 월간으로 변경
[월간 ▲]  ← 클릭 시 주간으로 돌아감
```

**변경 포인트**:
- 기존 월간 달력 코드 유지
- 주간 보기 렌더링 로직 추가
- `viewMode` 상태 + 토글 UI

---

### Phase 2: 새 사이드바 섹션 컴포넌트 생성

#### 2-1. 공지사항 섹션 컴포넌트

**신규 파일**: `apps/web/src/domain/today/components/sidebar/TodaySidebarNotices.tsx`

```typescript
// 기존 useNoticeList() 훅 사용 — size=2
// 표시: 제목 + 상대시간 + 고정 아이콘
// 클릭 → /notices/:id 이동
// 헤더: "공지사항" + "더보기" 링크
// 빈 상태: 공지사항 없음
```

**의존성**: `useNoticeList()` ← 기존 훅 활용, size 파라미터 추가 필요 확인

#### 2-2. 공유 노트 섹션 컴포넌트

**신규 파일**: `apps/web/src/domain/today/components/sidebar/TodaySidebarNotes.tsx`

```typescript
// 기존 useMeetingNoteList({ scope: 'all', size: 5 }) 훅 사용
// 필터: visibility가 ENTITY 또는 PUBLIC (scope=all로 접근)
// 표시: 제목 + 작성자 + 상대시간 + 타입 아이콘(🗒️/📋)
// 클릭 → /meeting-notes/:id 이동
// 헤더: "공유 노트" + "더보기" 링크
// 빈 상태: 공유 노트 없음
```

**의존성**: `useMeetingNoteList(filters)` ← 기존 훅에 scope 파라미터 지원 확인

#### 2-3. 진행중 이슈 섹션 컴포넌트

**신규 파일**: `apps/web/src/domain/today/components/sidebar/TodaySidebarIssues.tsx`

```typescript
// 기존 useIssueList({ status: 'IN_PROGRESS,TEST,APPROVED', size: 5 }) 훅 사용
// scope 미지정 = entity 전체
// 표시: 심각도 컬러 점 + Ref 번호 + 제목 (truncate) + 담당자 아바타
// 클릭 → IssueDetailModal 또는 해당 URL
// 헤더: "진행중 이슈" + "더보기" 링크
// 빈 상태: 진행중 이슈 없음
```

**의존성**: `useIssueList(filters)` ← 기존 훅 활용

---

### Phase 3: 통합 사이드바 컴포넌트

**신규 파일**: `apps/web/src/domain/today/components/sidebar/TodaySidebar.tsx`

```typescript
// 4개 섹션을 수직으로 배치
export default function TodaySidebar() {
  return (
    <div className="space-y-4">
      <TodaySidebarNotices />        {/* ❶ 공지사항 */}
      <TodayHistoryCalendar />       {/* ❷ History (주간/월간) */}
      <TodaySidebarNotes />          {/* ❸ 공유 노트 */}
      <TodaySidebarIssues />         {/* ❹ 진행중 이슈 */}
    </div>
  );
}
```

---

### Phase 4: TodayPage 레이아웃 수정

**파일**: `apps/web/src/domain/today/pages/TodayPage.tsx`

#### 변경 사항:

1. **History 토글 버튼 제거**: 항상 표시
2. **우측 패널**: `TodayHistoryCalendar` → `TodaySidebar`로 교체
3. **패널 너비**: `w-64` → `w-72 xl:w-80`
4. **import 변경**: `TodaySidebar` import

```typescript
// AS-IS
{activeScope === 'mine' && showHistory && (
  <div className="w-full lg:w-64 shrink-0">
    <div className="lg:sticky lg:top-8">
      <TodayHistoryCalendar />
    </div>
  </div>
)}

// TO-BE
{activeScope === 'mine' && (
  <div className="w-full lg:w-72 xl:w-80 shrink-0">
    <div className="lg:sticky lg:top-8">
      <TodaySidebar />
    </div>
  </div>
)}
```

#### 제거 대상:
- `showHistory` 상태 변수
- History 토글 버튼 JSX
- `History` 아이콘 import (사용처 없어지면)

---

### Phase 5: i18n 번역 추가

**파일**: `apps/web/src/locales/{ko,en,vi}/today.json`

```json
{
  "sidebar": {
    "notices": "공지사항",
    "recentNotes": "공유 노트",
    "inProgressIssues": "진행중 이슈",
    "viewMore": "더보기",
    "noNotices": "공지사항이 없습니다",
    "noNotes": "공유된 노트가 없습니다",
    "noIssues": "진행중인 이슈가 없습니다"
  },
  "history": {
    "weekView": "주간",
    "monthView": "월간",
    "thisWeek": "이번 주",
    "weekStats": "이번 주 {{days}}일 기록"
  }
}
```

---

## 3. 사이드 임팩트 분석

| 영향 영역 | 영향도 | 설명 |
|-----------|--------|------|
| TodayPage 레이아웃 | ⚠️ 변경 | 우측 패널 교체, History 토글 제거 |
| TodayHistoryCalendar | ⚠️ 변경 | 주간/월간 모드 추가 (기존 월간 유지) |
| TodayHistoryPage | ✅ 없음 | 기존 `/today/history/:date` 라우트 유지 |
| MyTodayPanel | ✅ 없음 | 좌측 메인 콘텐츠 변경 없음 |
| AllTodayPanel 등 | ✅ 없음 | 다른 탭 패널 변경 없음 |
| 백엔드 API | ✅ 없음 | 기존 API 그대로 활용 |
| 모바일 레이아웃 | ⚠️ 확인 | 우측 패널 접힘 동작 테스트 필요 |
| 공지/노트/이슈 → 기존 모듈 | ✅ 없음 | 조회만 (읽기 전용) |

---

## 4. 파일 변경 목록

### 신규 생성 (4개)
| 파일 | 내용 |
|------|------|
| `apps/web/src/domain/today/components/sidebar/TodaySidebar.tsx` | 통합 사이드바 |
| `apps/web/src/domain/today/components/sidebar/TodaySidebarNotices.tsx` | 공지사항 섹션 |
| `apps/web/src/domain/today/components/sidebar/TodaySidebarNotes.tsx` | 공유 노트 섹션 |
| `apps/web/src/domain/today/components/sidebar/TodaySidebarIssues.tsx` | 진행중 이슈 섹션 |

### 수정 (4~5개)
| 파일 | 변경 |
|------|------|
| `apps/web/src/domain/today/pages/TodayPage.tsx` | 사이드바 교체, 토글 제거, 너비 조정 |
| `apps/web/src/domain/today/components/history/TodayHistoryCalendar.tsx` | 주간/월간 모드 추가 |
| `apps/web/src/locales/ko/today.json` | sidebar 번역 추가 |
| `apps/web/src/locales/en/today.json` | sidebar 번역 추가 |
| `apps/web/src/locales/vi/today.json` | sidebar 번역 추가 |

---

## 5. 작업 체크리스트

- [ ] **Phase 1**: TodayHistoryCalendar 주간/월간 토글
- [ ] **Phase 2-1**: TodaySidebarNotices 공지사항 컴포넌트
- [ ] **Phase 2-2**: TodaySidebarNotes 공유 노트 컴포넌트
- [ ] **Phase 2-3**: TodaySidebarIssues 진행중 이슈 컴포넌트
- [ ] **Phase 3**: TodaySidebar 통합 컴포넌트
- [ ] **Phase 4**: TodayPage 레이아웃 수정
- [ ] **Phase 5**: i18n 3개 언어 번역 추가
- [ ] 빌드 검증
- [ ] 커밋 및 스테이징 배포
- [ ] 스테이징 테스트

---

## 6. 커밋 전략

```
feat: Today 페이지 우측 사이드바 개선 - 조직 소식 통합 표시

- History 주간보기 기본 + 월간보기 토글 옵션
- 공지사항 최근 2개 표시
- 공유 노트 최근 5개 표시 (회사 전체)
- 진행중 이슈 최근 5개 표시 (회사 전체)
- History 토글 버튼 제거 (항상 표시)
- i18n: ko/en/vi 사이드바 번역 추가
```

---

## 7. 구현 참고 — API 호출 요약

| 섹션 | API 호출 | 훅 |
|------|---------|-----|
| 공지사항 | `GET /notices?size=2` | `useNoticeList()` 또는 신규 경량 훅 |
| History | `GET /today/snapshots/calendar?year=&month=` | `useSnapshotCalendar()` 기존 |
| 공유 노트 | `GET /meeting-notes?scope=all&size=5` | `useMeetingNoteList({ scope: 'all', size: 5 })` |
| 진행중 이슈 | `GET /issues?status=IN_PROGRESS,TEST,APPROVED&size=5` | `useIssueList({ status: '...', size: 5 })` |
