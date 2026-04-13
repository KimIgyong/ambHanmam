# 작업 계획서: Issue Status 확장 및 Asana 그룹-상태 매핑

**문서번호**: PLAN-IssueStatus-Asana매핑-작업계획-20260323  
**작성일**: 2026-03-23  
**참조**: REQ-IssueStatus-Asana매핑-20260323  
**상태**: 계획 수립

---

## 1. 작업 개요

| 항목 | 내용 |
|------|------|
| 목표 | Issue Status 8단계 확장 (TEST, REOPEN 추가) + Asana 그룹명 기반 상태 매핑 |
| 영향 범위 | 공유 타입, 백엔드 API, 프론트엔드 UI (14개 파일) |
| DB 변경 | 없음 |
| 사이드 임팩트 | 낮음 (기존 플로우 유지, 신규 상태 추가만) |

---

## 2. 단계별 구현 계획

### Phase 1: 공유 타입 확장 (packages/types)

**파일**: `packages/types/src/domain.types.ts`

#### 1-1. IssueStatus 타입 확장
```typescript
// AS-IS
export type IssueStatus = 'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';

// TO-BE
export type IssueStatus = 'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'TEST' | 'REOPEN' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
```

#### 1-2. ISSUE_VALID_TRANSITIONS 확장
```typescript
// TO-BE
export const ISSUE_VALID_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  OPEN: ['APPROVED', 'REJECTED'],
  APPROVED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['TEST', 'RESOLVED'],       // TEST 추가
  TEST: ['REOPEN', 'RESOLVED'],             // 신규
  REOPEN: ['IN_PROGRESS'],                  // 신규
  RESOLVED: ['CLOSED', 'OPEN'],
  CLOSED: [],
  REJECTED: ['OPEN'],
};
```

---

### Phase 2: 백엔드 수정 (apps/api)

#### 2-1. DTO 검증 업데이트
**파일**: `apps/api/src/domain/issues/dto/request/update-issue-status.request.ts`

```typescript
// @IsIn에 TEST, REOPEN 추가
@IsIn(['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'])
```

#### 2-2. Issue Service 상태 전이 효과 업데이트
**파일**: `apps/api/src/domain/issues/service/issue.service.ts`

- `updateIssueStatus()` 메서드의 상태 변경 효과에 TEST/REOPEN 관련 처리 확인
- iss_resolved_at 처리: TEST, REOPEN 상태에서는 resolved 타임스탬프 없음 (기존 로직 유지)

#### 2-3. Asana Provider 그룹명 → 상태 매핑 추가
**파일**: `apps/api/src/domain/external-task-import/provider/asana.provider.ts`

```typescript
// 그룹명 → AMA Status 매핑 테이블
const ASANA_GROUP_STATUS_MAP: Record<string, string> = {
  'on hold': 'OPEN',
  '접수준비중': 'OPEN',
  '접수됨': 'APPROVED',
  '작업중': 'IN_PROGRESS',
  '검수중': 'TEST',
  '검수 후 리오픈': 'REOPEN',
  '처리 됨': 'RESOLVED',
  'backlog': 'CLOSED',
  '크리마팀 작업필요': 'OPEN',
};

// convertToIssueData 수정
convertToIssueData(task: ExternalTask, defaults: Record<string, any>): Partial<IssueEntity> {
  // 그룹명 기반 상태 결정
  const groupName = (defaults._groupName || '').trim().toLowerCase();
  const mappedStatus = Object.entries(ASANA_GROUP_STATUS_MAP)
    .find(([key]) => groupName === key.toLowerCase() || groupName.includes(key.toLowerCase()))?.[1];
  
  const status = task.isCompleted ? 'CLOSED' : (mappedStatus || 'OPEN');
  
  return {
    issStatus: status,
    // ... 기타 필드
  };
}
```

#### 2-4. Import Service - 그룹명 defaults에 전달
**파일**: `apps/api/src/domain/external-task-import/service/external-task-import.service.ts`

- `importTasks()` 호출 시 defaults에 `_groupName` 전달 확인
- 프론트엔드에서 `group_name`으로 보내는 값을 defaults에 포함시키는 로직 추가

#### 2-5. Import DTO 수정 (이미 완료)
**파일**: `apps/api/src/domain/external-task-import/dto/import-tasks.dto.ts`

- `@ValidateNested()` + `@IsOptional()` 추가 완료 (defaults 프로퍼티)

---

### Phase 3: 프론트엔드 수정 (apps/web)

#### 3-1. STATUS_COLORS 업데이트 (4개 파일)

| 파일 | TEST 색상 | REOPEN 색상 |
|------|----------|------------|
| `IssueDetailModal.tsx` | `bg-amber-100 text-amber-700` | `bg-orange-100 text-orange-700` |
| `IssueKanbanColumn.tsx` | header: `bg-amber-100 text-amber-700`, ring: `ring-amber-300` | header: `bg-orange-100 text-orange-700`, ring: `ring-orange-300` |
| `ClientIssueDetailPage.tsx` | `bg-amber-100 text-amber-700` | `bg-orange-100 text-orange-700` |
| `EntityRedmineImportedPage.tsx` | `bg-amber-100 text-amber-700` | `bg-orange-100 text-orange-700` |

#### 3-2. Kanban View 업데이트
**파일**: `apps/web/src/domain/issues/components/IssueKanbanView.tsx`

```typescript
// COLUMN_ORDER 8단계로 확장
const COLUMN_ORDER: IssueStatus[] = [
  'OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'REOPEN', 'RESOLVED', 'CLOSED', 'REJECTED'
];
```

#### 3-3. Client Portal 상태 스텝 업데이트
**파일**: `apps/web/src/domain/client-portal/pages/ClientIssueDetailPage.tsx`

```typescript
// ISSUE_STATUS_STEPS에 TEST 단계 추가 (클라이언트 뷰에서도 검수 단계 표시)
const ISSUE_STATUS_STEPS = ['OPEN', 'APPROVED', 'IN_PROGRESS', 'TEST', 'RESOLVED'] as const;
```

#### 3-4. i18n 번역 추가 (3개 언어)

| 키 | ko | en | vi |
|----|----|----|-----|
| `status.TEST` | 검수 | Test | Kiểm tra |
| `status.REOPEN` | 리오픈 | Reopen | Mở lại |

**파일**:
- `apps/web/src/locales/ko/issues.json`
- `apps/web/src/locales/en/issues.json`
- `apps/web/src/locales/vi/issues.json`

---

## 3. 사이드 임팩트 분석

| 영향 영역 | 영향도 | 설명 |
|-----------|--------|------|
| 기존 이슈 상태 | ✅ 없음 | 기존 6개 상태값 그대로 유지 |
| IN_PROGRESS→RESOLVED 직접 전이 | ✅ 유지 | TEST를 거치지 않고 바로 해결 가능 |
| 칸반 드래그앤드롭 | ⚠️ 확인 필요 | ISSUE_VALID_TRANSITIONS 기반이므로 자동 적용 |
| Redmine Import | ✅ 무관 | Redmine은 자체 STATUS_MAP 사용 |
| Portal API/Web | ✅ 무관 | Issue 상태 참조 없음 |
| 모바일 앱 | ⚠️ 확인 필요 | 모바일에서 이슈 상태 표시하는 경우 |
| DB 마이그레이션 | ✅ 불필요 | varchar(20) 컬럼이므로 새 값 바로 저장 가능 |

---

## 4. 작업 체크리스트

- [ ] **Phase 1**: `domain.types.ts` - IssueStatus 타입 + ISSUE_VALID_TRANSITIONS 확장
- [ ] **Phase 2-1**: `update-issue-status.request.ts` - @IsIn 검증 업데이트
- [ ] **Phase 2-2**: `issue.service.ts` - updateIssueStatus 상태 효과 확인
- [ ] **Phase 2-3**: `asana.provider.ts` - ASANA_GROUP_STATUS_MAP + convertToIssueData 수정
- [ ] **Phase 2-4**: `external-task-import.service.ts` - group_name → defaults._groupName 전달
- [ ] **Phase 3-1**: STATUS_COLORS 4개 파일 업데이트
- [ ] **Phase 3-2**: `IssueKanbanView.tsx` - COLUMN_ORDER 확장
- [ ] **Phase 3-3**: `ClientIssueDetailPage.tsx` - ISSUE_STATUS_STEPS + STATUS_STEP_COLORS 확장
- [ ] **Phase 3-4**: i18n 3개 언어 번역 추가
- [ ] 빌드 검증 (API + Web)
- [ ] 커밋 및 스테이징 배포
- [ ] 스테이징 테스트

---

## 5. 커밋 전략

```
feat: Issue Status에 TEST/REOPEN 단계 추가 및 Asana 그룹-상태 매핑
```

**변경 파일 (약 14개)**:
- packages/types/src/domain.types.ts
- apps/api/src/domain/issues/dto/request/update-issue-status.request.ts
- apps/api/src/domain/issues/service/issue.service.ts
- apps/api/src/domain/external-task-import/provider/asana.provider.ts
- apps/api/src/domain/external-task-import/service/external-task-import.service.ts
- apps/api/src/domain/external-task-import/dto/import-tasks.dto.ts (이미 수정됨)
- apps/web/src/domain/issues/components/IssueDetailModal.tsx
- apps/web/src/domain/issues/components/IssueKanbanColumn.tsx
- apps/web/src/domain/issues/components/IssueKanbanView.tsx
- apps/web/src/domain/client-portal/pages/ClientIssueDetailPage.tsx
- apps/web/src/domain/external-task-import/pages/EntityRedmineImportedPage.tsx
- apps/web/src/locales/ko/issues.json
- apps/web/src/locales/en/issues.json
- apps/web/src/locales/vi/issues.json
