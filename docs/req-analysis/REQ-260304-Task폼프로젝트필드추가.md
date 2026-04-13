# REQ - Task 폼에 Project 필드 추가

- **작성일**: 2026-03-04
- **요청자**: Truc Hoang
- **담당자**: Truc Hoang
- **등록일**: 2026-02-24
- **영향 모듈**: Today's Task > My Task

---

## 1. AS-IS 현황 분석

### 1.1 현재 Task 생성 폼 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| Title | text input | ✅ | 최대 200자 |
| Description | textarea | ❌ | 설명 |
| Status | select | ❌ | SCHEDULED / IN_PROGRESS / COMPLETED |
| Due Date | date | ✅ | 마감일 |
| Linked Issue | select | ❌ | OPEN 상태 이슈 연결 |
| Tags | text input | ❌ | 쉼표 구분 |
| Participants | multi-select | ❌ | 멤버 검색 + 칩 |

### 1.2 현재 데이터 모델 (amb_todos)

- Task ↔ Project 간 **직접 연결 컬럼 없음**
- Task → Issue → Project 경로로 간접 연결만 존재
- `iss_id` (FK) 통해 Issue 연결, Issue의 `pjt_id`로 Project 접근

### 1.3 문제점

1. Task를 프로젝트별로 분류할 수 없음
2. Issue에 연결하지 않으면 프로젝트 추적 불가
3. 다수 프로젝트를 담당하는 사용자의 필터링/보고 비효율

---

## 2. TO-BE 요구사항

### 2.1 기능 요구사항

- Task 생성/수정 폼에 **Project 선택 드롭다운** 추가
- 선택 사항(Optional) - 프로젝트 없이도 Task 생성 가능
- 현재 법인(Entity)에 속한 프로젝트 목록만 표시
- Task 응답(Response)에 `projectId`, `projectName` 포함

### 2.2 사용자 플로우

1. Today's Tasks > My Task > "Add Task" 클릭
2. 폼에서 Project 드롭다운 선택 (기한/상태 행과 같은 라인 또는 별도 행)
3. 저장 시 `project_id`가 백엔드로 전달
4. Task 목록/상세에서 프로젝트명 확인 가능

---

## 3. 갭 분석

| 항목 | AS-IS | TO-BE | 변경 범위 |
|------|-------|-------|----------|
| DB 컬럼 | `pjt_id` 없음 | `pjt_id` UUID nullable 추가 | DB 마이그레이션 |
| Entity | Project 관계 없음 | `@ManyToOne ProjectEntity` 추가 | 엔티티 수정 |
| Create DTO | `project_id` 없음 | `project_id` optional 추가 | DTO 수정 |
| Update DTO | `project_id` 없음 | `project_id` optional 추가 | DTO 수정 |
| Service | Project 미처리 | `pjtId` 저장/수정 로직 추가 | 서비스 수정 |
| Mapper | Project 매핑 없음 | `projectId`, `projectName` 추가 | 매퍼 수정 |
| Types | 응답에 Project 없음 | `projectId?`, `projectName?` 추가 | 타입 수정 |
| 프론트 폼 | Project 필드 없음 | 드롭다운 추가 | 컴포넌트 수정 |
| i18n | 번역 키 없음 | `form.project`, `form.noProject` 추가 | 3개 언어 |

---

## 4. 기술 제약사항

- 기존 `useProjectList()` 훅이 이미 존재하여 프로젝트 목록 조회 재사용 가능
- IssueFilters에서 동일한 프로젝트 드롭다운 패턴 참고 가능
- DB 컬럼 추가 시 `synchronize: false` 환경에서는 수동 ALTER TABLE 필요 (스테이징/프로덕션)
- DB 네이밍 규칙: `pjt_id` (프로젝트 FK는 기존 Issue 엔티티와 동일 패턴)
