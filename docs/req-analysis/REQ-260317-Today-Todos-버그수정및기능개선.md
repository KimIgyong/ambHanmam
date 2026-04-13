# 요구사항 분석서: Today/Todos 버그수정 및 기능개선

## 문서 정보
- **작성일**: 2026-03-17
- **요청자**: 관리자
- **대상 페이지**: `/today`, `/todos`

---

## 1. AS-IS 현황 분석

### 1.1 My Only - Tasks 섹션 (`/today`)

**현재 구현 (MyTodayPanel.tsx)**:
- `overdue[]` + `inProgress[]` 배열을 병합하여 표시
- 상태 배지: `todo.status` 값을 그대로 텍스트로 출력 (예: `IN_PROGRESS`, `SCHEDULED`)
- Overdue 판별: `data.overdue.some()` 로 체크 → 빨간색 배경/텍스트 적용
- **문제**: Overdue인 항목도 `todo.status`가 `IN_PROGRESS`이면 배지에 "IN_PROGRESS"로 표기됨
- 배지에 i18n 미적용: `{todo.status}` 직접 출력 (영문 원시값 노출)

**비교 대상 (`/todos` TodoItem.tsx)**:
- `computedStatus` 기반 5색 배지: OVERDUE/DUE_TODAY/IN_PROGRESS/UPCOMING_SOON/UPCOMING
- i18n 적용: `t('todos:computedStatus.${todo.computedStatus}')` → 한국어 "지연", "오늘 마감", "진행 중" 등
- D-day 레이블: `D+5`, `D-Day`, `D-3` 표시

### 1.2 카드뷰 - Today's Mission 체크박스 줄바꿈 이슈

**현재 구현 (TeamTodayPanel/AllTodayPanel)**:
- `dangerouslySetInnerHTML={{ __html: member.missionContent }}` 사용
- 클래스: `line-clamp-6 pl-2 text-xs text-gray-600 [&_*]:!text-xs [&_*]:!leading-tight`
- TaskList(체크박스) HTML은 `<ul data-type="taskList"><li data-type="taskItem">` 구조
- globals.css에서 TaskList 스타일 적용 → 체크박스가 flex로 렌더링되며 줄바꿈 발생
- **문제**: 카드뷰에서는 미션이 요약 표시이므로 체크박스 포함 내용도 한 줄로 나와야 함

### 1.3 카드뷰 - Tasks 클릭 시 모달
 
**현재 구현**:
- 카드뷰 Tasks 항목: `<li>· {todo.title}</li>` — onClick 핸들러 없음
- 클릭 불가능한 읽기전용 텍스트
- **요구사항**: 클릭 시 TodoDetailModal 출력

### 1.4 `/todos` 페이지 - 타인 작성 Task 처리

**현재 구현 (TodoPage.tsx - Mine 탭)**:
- 모든 TodoItem에서 제목 클릭 → `onEdit(todo)` → TodoFormModal 열림 (수정 모드)
- 소유권 검사 없이 모든 할일이 수정 가능

**현재 구현 (ScopedTodoList.tsx - Unit/Cell/Company 탭)**:
- `isMaster`인 경우에만 TodoItem(수정 가능) / 아니면 ScopedTodoItem(상세 모달)
- **결론**: `mine` 탭에서는 자기 할일만 보이므로 문제 없으나, `unit/cell/company` 탭에서 타인의 할일을 클릭 시 동작이 역할에 따라 다름

**요구사항 재해석**:
- TodoItem에서 제목 클릭 시: 자기 것 → 수정(TodoFormModal), 타인 것 → 상세(TodoDetailModal)

---

## 2. TO-BE 요구사항

### BUG-1: My Only Tasks 상태 표시 오류
| 항목 | 내용 |
|------|------|
| **현상** | Overdue 상태 Task가 "IN_PROGRESS"로 표시 |
| **원인** | `todo.status`(DB 원본 값) 사용, `computedStatus` 미사용 |
| **수정** | `/todos`와 동일하게 `computedStatus` 기반 배지 표시 |
| **영향 범위** | MyTodayPanel.tsx Tasks 섹션 |

### BUG-2: My Only Tasks i18n 누락
| 항목 | 내용 |
|------|------|
| **현상** | 상태 배지에 영문 원시값 "IN_PROGRESS", "SCHEDULED" 노출 |
| **원인** | `{todo.status}` 직접 출력 |
| **수정** | `t('todos:computedStatus.${computedStatus}')` 사용 |
| **영향 범위** | MyTodayPanel.tsx Tasks 섹션 |

### BUG-3: 카드뷰 Mission 체크박스 줄바꿈
| 항목 | 내용 |
|------|------|
| **현상** | 체크박스 포함 미션 내용이 줄바꿈되어 카드 공간 과다 사용 |
| **원인** | TaskList CSS가 flex 레이아웃 적용 |
| **수정** | 카드뷰 미션 영역에서 TaskList 스타일 초기화: inline 표시, 체크박스 숨김 또는 한줄 표시 |
| **영향 범위** | TeamTodayPanel.tsx, AllTodayPanel.tsx 미션 렌더링 |

### FEAT-1: 카드뷰 Tasks 클릭 → TodoDetailModal
| 항목 | 내용 |
|------|------|
| **현상** | 카드뷰 Tasks 항목 클릭 불가 |
| **수정** | 클릭 시 TodoDetailModal 출력 |
| **영향 범위** | TeamTodayPanel.tsx, AllTodayPanel.tsx MemberCard Tasks 섹션 |
| **필요 데이터** | todoId → BE에서 todo 상세 조회 or FE에서 전체 할일 목록에서 찾기 |

### FEAT-2: `/todos` 타인 Task → Detail 열기, 본인 Task만 편집
| 항목 | 내용 |
|------|------|
| **현상** | TodoItem 제목 클릭 시 무조건 수정 모달 |
| **수정** | 자기 userId === todo.userId → onEdit (수정), 그 외 → onShowDetail (상세) |
| **영향 범위** | TodoItem.tsx, TodoPage.tsx, ScopedTodoList.tsx |

---

## 3. 데이터 요구사항

### My Only Tasks - computedStatus 필요
현재 BE today.service.ts의 `toTodoSummary()`는 `status`(DB 원본)만 반환.  
`computedStatus` 값이 필요하며, 이를 위해:

**방안 A**: BE에서 `computedStatus` 계산하여 응답에 추가  
**방안 B**: FE에서 `overdue` 배열 소속 여부 + `status` + `dueDate`로 계산  

→ **방안 B** 채택 (BE 수정 최소화, FE에서 충분히 판별 가능)
- `overdue` 배열 → computedStatus = 'OVERDUE'
- `todayDue` 배열 → computedStatus = 'DUE_TODAY'
- `inProgress` 배열 → computedStatus = 'IN_PROGRESS'

### 카드뷰 Tasks - TodoDetailModal 데이터
현재 카드뷰 Tasks 항목: `{ todoId, title, dueDate, isOverdue }` (요약 정보)  
TodoDetailModal은 `TodoResponse` 타입 필요 → `todoId`로 별도 조회 또는 `/todos?id=todoId` 네비게이션

→ **방안**: 클릭 시 `/todos?id={todoId}` 로 네비게이션 (TodoPage에서 `?id=` 쿼리 자동 상세 모달 오픈 로직 이미 존재)

---

## 4. 기술 제약사항

- TodayTaskItem.tsx는 현재 MyTodayPanel에서 사용되지 않음 (인라인 렌더링)
- TodoDetailModal은 `TodoResponse` 전체 객체를 prop으로 받음
- 카드뷰에서는 요약 데이터만 있어 TodoResponse 전체 조회 불가 → 네비게이션 방식 채택
- TaskList CSS 스타일 오버라이드 필요 (카드뷰 컨텍스트에서만)
