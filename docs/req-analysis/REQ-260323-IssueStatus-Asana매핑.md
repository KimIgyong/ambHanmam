# 요구사항 분석서: Issue Status 확장 및 Asana 그룹-상태 매핑

**문서번호**: REQ-IssueStatus-Asana매핑-20260323  
**작성일**: 2026-03-23  
**작성자**: AI Assistant  
**상태**: 분석 완료

---

## 1. 요구사항 요약

Asana에서 태스크를 임포트할 때, Asana의 **섹션(Group)** 이름을 기반으로 AMA Issue의 **상태(Status)**에 자동 매핑한다. 이를 위해 기존 6단계 Issue Status 체계에 **TEST**와 **REOPEN** 2개 상태를 추가한다.

---

## 2. AS-IS 현황 분석

### 2.1 현재 Issue Status 체계

| 순서 | Status | 한글 | 설명 |
|------|--------|------|------|
| 1 | OPEN | 열림 | 이슈 등록 초기 상태 |
| 2 | APPROVED | 승인 | 관리자 승인 |
| 3 | IN_PROGRESS | 진행 중 | 작업 착수 |
| 4 | RESOLVED | 해결 | 작업 완료 |
| 5 | CLOSED | 종료 | 최종 종료 |
| 6 | REJECTED | 반려 | 반려/거부 |

### 2.2 현재 상태 전이 규칙 (`ISSUE_VALID_TRANSITIONS`)

```
OPEN → [APPROVED, REJECTED]
APPROVED → [IN_PROGRESS, REJECTED]
IN_PROGRESS → [RESOLVED]
RESOLVED → [CLOSED, OPEN]
CLOSED → []
REJECTED → [OPEN]
```

### 2.3 현재 Asana Import 상태 매핑

```typescript
// asana.provider.ts - convertToIssueData()
issStatus: task.isCompleted ? 'CLOSED' : 'OPEN'
```

- **문제점**: Asana 태스크의 완료 여부만으로 이진(OPEN/CLOSED) 매핑
- **Asana 그룹(섹션) 정보가 상태 매핑에 전혀 활용되지 않음**

### 2.4 영향받는 파일 현황

| 카테고리 | 파일 | 위치 |
|----------|------|------|
| 타입 정의 | `packages/types/src/domain.types.ts` | IssueStatus 타입, ISSUE_VALID_TRANSITIONS |
| DTO 검증 | `apps/api/src/domain/issues/dto/request/update-issue-status.request.ts` | @IsIn 검증 |
| 엔티티 | `apps/api/src/domain/issues/entity/issue.entity.ts` | 기본값 |
| Asana Provider | `apps/api/src/domain/external-task-import/provider/asana.provider.ts` | 상태 변환 |
| 프론트 색상 | `IssueDetailModal.tsx`, `IssueKanbanColumn.tsx`, `ClientIssueDetailPage.tsx`, `EntityRedmineImportedPage.tsx` | STATUS_COLORS |
| 칸반 뷰 | `IssueKanbanView.tsx` | COLUMN_ORDER, MANAGER_ONLY_STATUSES |
| i18n | `ko/issues.json`, `en/issues.json`, `vi/issues.json` | status 번역 |

---

## 3. TO-BE 요구사항

### 3.1 확장된 Issue Status 체계 (8단계)

| 순서 | Status | 한글 | 영문 | 베트남어 | 설명 |
|------|--------|------|------|----------|------|
| 1 | OPEN | 열림 | Open | Mở | 이슈 등록 초기 상태 |
| 2 | APPROVED | 승인 | Approved | Đã duyệt | 관리자 승인 |
| 3 | IN_PROGRESS | 진행 중 | In Progress | Đang xử lý | 작업 착수 |
| 4 | **TEST** | **검수** | **Test** | **Kiểm tra** | **QA/검수 단계** (신규) |
| 5 | **REOPEN** | **리오픈** | **Reopen** | **Mở lại** | **검수 후 재작업** (신규) |
| 6 | RESOLVED | 해결 | Resolved | Đã giải quyết | 작업 완료 |
| 7 | CLOSED | 종료 | Closed | Đóng | 최종 종료 |
| 8 | REJECTED | 반려 | Rejected | Từ chối | 반려/거부 |

### 3.2 새로운 상태 전이 규칙

```
OPEN → [APPROVED, REJECTED]
APPROVED → [IN_PROGRESS, REJECTED]
IN_PROGRESS → [TEST, RESOLVED]        ← TEST 추가
TEST → [REOPEN, RESOLVED]             ← 신규: 검수에서 리오픈 또는 해결
REOPEN → [IN_PROGRESS]                ← 신규: 리오픈에서 다시 진행
RESOLVED → [CLOSED, OPEN]
CLOSED → []
REJECTED → [OPEN]
```

**변경 포인트**:
- `IN_PROGRESS`: 기존 `[RESOLVED]` → `[TEST, RESOLVED]` (TEST로 전이 가능)
- `TEST` (신규): `[REOPEN, RESOLVED]` (리오픈 또는 해결로 전이)
- `REOPEN` (신규): `[IN_PROGRESS]` (다시 작업 시작)

### 3.3 Asana 그룹(섹션) → AMA Status 매핑 규칙

| Asana 섹션명 | AMA Status | 매핑 조건 |
|-------------|------------|----------|
| on hold | OPEN | 부분 일치 (contains) |
| 접수준비중 | OPEN | 완전 일치 (exact) |
| 접수됨 | APPROVED | 완전 일치 |
| 작업중 | IN_PROGRESS | 완전 일치 |
| 검수중 | TEST | 완전 일치 |
| 검수 후 리오픈 | REOPEN | 완전 일치 |
| 처리 됨 | RESOLVED | 완전 일치 |
| Backlog | CLOSED | 완전 일치 (대소문자 무시) |
| 크리마팀 작업필요 | OPEN | 완전 일치 |
| *(매칭 없음)* | OPEN | 기본값 |

**매핑 로직 특징**:
- 그룹명 기준 매핑 (섹션명 → 상태)  
- 대소문자 무시 (case-insensitive)
- 앞뒤 공백 trim 
- 매칭 실패 시 기본값 `OPEN`

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| Status 개수 | 6개 | 8개 (TEST, REOPEN 추가) | **+2** |
| 상태 전이 규칙 | 6개 항목 | 8개 항목 + IN_PROGRESS 변경 | **수정 필요** |
| Asana 매핑 | 완료 여부 이진 매핑 | 그룹명 기반 매핑 | **로직 추가** |
| 프론트 색상 | 6개 | 8개 | **+2** |
| i18n | 6개 번역 | 8개 번역 (3개 언어) | **+6 키** |
| 칸반 보드 | 6컬럼 | 8컬럼 | **+2컬럼** |
| DB 변경 | - | 없음 (varchar 컬럼) | **변경 불필요** |

---

## 5. 사용자 플로우

### 5.1 Asana Import 플로우 (개선 후)

```
1. 프로젝트 상세 → Issues 탭 → Import Issues 클릭
2. Asana 탭 선택
3. Asana 프로젝트 선택
4. 그룹(섹션) 체크박스 다중 선택
5. "태스크 불러오기" 버튼 클릭
6. 태스크 목록 표시 (그룹명 컬럼 포함)
7. 임포트할 태스크 선택
8. "Import" 클릭
   → 백엔드: 각 태스크의 소속 그룹명으로 AMA Status를 결정
   → "작업중" 그룹의 태스크 → IN_PROGRESS
   → "검수중" 그룹의 태스크 → TEST
   → 등등...
9. 임포트 완료 → 이슈 목록에 올바른 상태로 표시
```

### 5.2 Issue Workflow 플로우 (개선 후)

```
OPEN → APPROVED → IN_PROGRESS → TEST → RESOLVED → CLOSED
                       ↓                  ↑
                       └── RESOLVED ──────┘
                                     
TEST → REOPEN → IN_PROGRESS → TEST → ...
       (검수 실패 시 재작업 루프)
```

---

## 6. 기술 제약사항

1. **DB 변경 불필요**: `iss_status` 컬럼이 `varchar(20)`이므로 새 상태값 저장 가능
2. **스테이징 DB**: 별도 마이그레이션 SQL 불필요 (문자열 값 추가일 뿐)
3. **하위 호환성**: 기존 OPEN→...→CLOSED 플로우에 영향 없음 (IN_PROGRESS→RESOLVED 직접 전이 유지)
4. **Asana 그룹명 의존성**: 사용자마다 Asana 프로젝트의 섹션명이 다를 수 있으므로, 매핑은 기본 제공 + 향후 커스터마이징 고려
5. **Asana Import 요청 DTO**: `defaults` 외에 `group_name`이 이미 그룹별로 전달되므로, 백엔드에서 그룹명 기반 매핑 구현 가능

---

## 7. 비기능 요구사항

- 기존 이슈의 상태값은 변경하지 않음
- 기존 상태 전이 경로 유지 (IN_PROGRESS → RESOLVED 직접 전이 가능)
- Asana 그룹명 매핑 실패 시 기본값(OPEN) 적용, 에러 없음
