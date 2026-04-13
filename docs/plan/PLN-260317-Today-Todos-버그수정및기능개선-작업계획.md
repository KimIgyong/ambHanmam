# 작업 계획서: Today/Todos 버그수정 및 기능개선

## 문서 정보
- **작성일**: 2026-03-17
- **관련 요구사항**: REQ-Today-Todos-버그수정및기능개선-20260317.md
- **영향 범위**: FE 전용 (BE 변경 없음)

---

## 단계별 구현 계획

### STEP 1: My Only Tasks 상태 배지 수정 (BUG-1 + BUG-2)

**파일**: `apps/web/src/domain/today/components/MyTodayPanel.tsx`

**현재 코드 (Tasks 항목 배지)**:
```tsx
<span className={`... ${isOverdue ? 'bg-red-100 text-red-600' : STATUS_COLORS[todo.status] || ...}`}>
  {todo.status}
</span>
```

**수정 내용**:
1. 각 todo의 `computedStatus` FE 계산:
   - `data.overdue` 배열에 있으면 → `'OVERDUE'`
   - 나머지 (= `data.inProgress`) → `'IN_PROGRESS'`
2. `/todos` TodoItem과 동일한 `computedStatusBadge` 색상 맵 사용
3. 배지 텍스트: `t('todos:computedStatus.${computedStatus}')` (i18n)
4. D-day 표시 추가: Overdue면 `D+N일`, dueDate가 오늘이면 `D-Day`

**사이드 임팩트**: 없음 (MyTodayPanel 내부 렌더링만 변경)

---

### STEP 2: 카드뷰 Mission 체크박스 한줄 표시 (BUG-3)

**파일**: `apps/web/src/domain/today/components/TeamTodayPanel.tsx`, `AllTodayPanel.tsx`

**현재 코드**:
```tsx
<div
  className="line-clamp-6 pl-2 text-xs text-gray-600 [&_*]:!text-xs [&_*]:!leading-tight"
  dangerouslySetInnerHTML={{ __html: member.missionContent }}
/>
```

**수정 내용**:
Mission 렌더링 div에 TaskList 스타일 오버라이드 클래스 추가:
- `[&_ul[data-type='taskList']]:!p-0` — 패딩 제거
- `[&_ul[data-type='taskList']]:!m-0` — 마진 제거
- `[&_ul[data-type='taskList']_li]:!flex-row` — 가로 유지
- `[&_ul[data-type='taskList']_li]:!inline` — 인라인 표시
- `[&_ul[data-type='taskList']_li>label]:!hidden` — 체크박스 라벨 숨기기
- `[&_ul[data-type='taskList']_li>div]:!inline` — 컨텐츠 인라인

또는 더 간단한 방법: CSS 클래스 `mission-card-content`를 만들어 globals.css에서 TaskList 스타일 초기화

**사이드 임팩트**: 없음 (카드뷰 미션 영역에만 적용)

---

### STEP 3: 카드뷰 Tasks 클릭 → `/todos?id=` 네비게이션 (FEAT-1)

**파일**: `apps/web/src/domain/today/components/TeamTodayPanel.tsx`, `AllTodayPanel.tsx`

**현재 코드**:
```tsx
<li key={todo.todoId} className={`truncate pl-2 ...`}>
  · {todo.title}
</li>
```

**수정 내용**:
```tsx
<li 
  key={todo.todoId} 
  className={`truncate pl-2 cursor-pointer hover:text-indigo-600 ...`}
  onClick={() => navigate(`/todos?id=${todo.todoId}`)}
>
  · {todo.title}
</li>
```

TodoPage.tsx에 이미 `?id=` 쿼리 파라미터로 TodoDetailModal 자동 오픈 로직 있음 (L56-66).

**사이드 임팩트**: 없음

---

### STEP 4: `/todos` TodoItem 소유권 체크 (FEAT-2)

**파일**: `apps/web/src/domain/todos/components/TodoItem.tsx`

**현재 코드 (제목 클릭)**:
```tsx
<button type="button" onClick={() => onEdit(todo)} ...>
  {todo.title}
</button>
```

**수정 내용**:
1. TodoItem props에 `currentUserId?: string` 추가
2. 제목 클릭 핸들러:
   - `todo.userId === currentUserId` → `onEdit(todo)` (수정 모달)
   - 그 외 → `onShowDetail?.(todo.todoId)` (상세 모달)
3. 체크박스, 삭제, 이력 버튼도 같은 조건으로 표시/비표시
4. 실질적으로 `readOnly` prop이 이미 있으므로: **자동 계산**

**호출부 수정**:
- `TodoPage.tsx`: TodoItem에 `currentUserId={userId}` 전달
- `ScopedTodoList.tsx`: TodoItem (isMaster일 때)에 `currentUserId={userId}` 전달

**사이드 임팩트**: 
- Mine 탭: 본인 할일만 표시되므로 영향 없음
- Unit/Cell/Company 탭: 타인 할일 제목 클릭 시 수정 대신 상세 모달 열림 (정상)

---

### STEP 5: 빌드 검증 + 커밋 + 배포

1. `cd apps/web && npx vite build` — 빌드 확인
2. `git add -A && git commit -m "fix: Today/Todos 상태표시·i18n·카드뷰 버그수정 및 기능개선"`
3. `git push origin main`
4. 스테이징 배포

---

## 변경 파일 목록

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `apps/web/src/domain/today/components/MyTodayPanel.tsx` | 수정 | Tasks 배지 computedStatus + i18n 적용 |
| `apps/web/src/domain/today/components/TeamTodayPanel.tsx` | 수정 | Mission TaskList 스타일 오버라이드 + Tasks onClick |
| `apps/web/src/domain/today/components/AllTodayPanel.tsx` | 수정 | Mission TaskList 스타일 오버라이드 + Tasks onClick |
| `apps/web/src/styles/globals.css` | 수정 | 카드뷰 Mission TaskList 스타일 초기화 |
| `apps/web/src/domain/todos/components/TodoItem.tsx` | 수정 | 소유권 체크: 본인→수정, 타인→상세 |
| `apps/web/src/domain/todos/pages/TodoPage.tsx` | 수정 | TodoItem에 currentUserId 전달 |
| `apps/web/src/domain/todos/components/ScopedTodoList.tsx` | 수정 | TodoItem에 currentUserId 전달 |
