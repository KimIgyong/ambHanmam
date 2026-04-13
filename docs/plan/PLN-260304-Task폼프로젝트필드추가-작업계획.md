# PLAN - Task 폼에 Project 필드 추가 - 작업 계획

- **작성일**: 2026-03-04
- **관련 분석서**: `docs/analysis/REQ-Task폼프로젝트필드추가-20260304.md`

---

## 1. 시스템 개발 현황 분석

### 1.1 참고 패턴
- Issue 엔티티에서 `pjt_id` FK + `@ManyToOne ProjectEntity` 관계가 이미 구현됨
- `useProjectList()` 훅이 존재하여 프론트엔드 프로젝트 목록 조회 가능
- `IssueFilters.tsx`에서 프로젝트 드롭다운 패턴 참고 가능

### 1.2 수정 대상 파일 목록

| # | 파일 | 수정 내용 |
|---|------|----------|
| 1 | `apps/api/src/domain/todo/entity/todo.entity.ts` | `pjt_id` 컬럼 + `@ManyToOne ProjectEntity` 관계 추가 |
| 2 | `apps/api/src/domain/todo/dto/request/create-todo.request.ts` | `project_id` optional 필드 추가 |
| 3 | `apps/api/src/domain/todo/dto/request/update-todo.request.ts` | `project_id` optional 필드 추가 |
| 4 | `apps/api/src/domain/todo/service/todo.service.ts` | 생성/수정 시 `pjtId` 저장, 조회 시 project relation 로드 |
| 5 | `apps/api/src/domain/todo/mapper/todo.mapper.ts` | `projectId`, `projectName` 응답 매핑 |
| 6 | `packages/types/src/domain.types.ts` | `TodoResponse`에 `projectId?`, `projectName?` 추가 |
| 7 | `apps/web/src/domain/todos/components/TodoFormModal.tsx` | Project 드롭다운 추가 |
| 8 | `apps/web/src/domain/todos/service/todo.service.ts` | 생성/수정 params에 `project_id` 추가 |
| 9 | `apps/web/src/locales/en/todos.json` | `form.project`, `form.noProject` 키 추가 |
| 10 | `apps/web/src/locales/ko/todos.json` | 한국어 번역 추가 |
| 11 | `apps/web/src/locales/vi/todos.json` | 베트남어 번역 추가 |

---

## 2. 단계별 구현 계획

### Step 1: DB 엔티티 수정 (Backend)

**파일**: `apps/api/src/domain/todo/entity/todo.entity.ts`

```typescript
// 추가할 코드
import { ProjectEntity } from '../../project/entity/project.entity';

@Column({ name: 'pjt_id', type: 'uuid', nullable: true })
pjtId: string | null;

@ManyToOne(() => ProjectEntity, { nullable: true })
@JoinColumn({ name: 'pjt_id' })
project: ProjectEntity;
```

### Step 2: DTO 수정 (Backend)

**파일**: `create-todo.request.ts`, `update-todo.request.ts`

```typescript
@IsUUID()
@IsOptional()
project_id?: string;
```

### Step 3: 서비스 수정 (Backend)

**파일**: `apps/api/src/domain/todo/service/todo.service.ts`

- `createTodo()`: `pjtId: dto.project_id || null` 추가
- `updateTodo()`: `if (dto.project_id !== undefined) entity.pjtId = dto.project_id || null` 추가
- 조회 시 `relations`에 `'project'` 추가

### Step 4: Mapper 수정 (Backend)

**파일**: `apps/api/src/domain/todo/mapper/todo.mapper.ts`

```typescript
projectId: entity.pjtId || null,
projectName: entity.project?.pjtName || null,
```

### Step 5: 공유 타입 수정

**파일**: `packages/types/src/domain.types.ts`

```typescript
// TodoResponse에 추가
projectId?: string | null;
projectName?: string | null;
```

### Step 6: 프론트엔드 폼 수정

**파일**: `apps/web/src/domain/todos/components/TodoFormModal.tsx`

- `useProjectList()` 훅 import
- `projectId` state 추가
- Status/DueDate 행 아래에 Project 드롭다운 추가
- `onSubmit` 데이터에 `project_id` 포함
- 수정 모드 시 `editingTodo.projectId` 초기값 설정

### Step 7: 프론트엔드 서비스 수정

**파일**: `apps/web/src/domain/todos/service/todo.service.ts`

- `createTodo`, `updateTodo` params에 `project_id?: string` 추가

### Step 8: i18n 번역

3개 언어 파일의 `form` 섹션에 추가:
- EN: `"project": "Project"`, `"noProject": "No project"`
- KO: `"project": "프로젝트"`, `"noProject": "프로젝트 없음"`
- VI: `"project": "Dự án"`, `"noProject": "Không có dự án"`

---

## 3. 사이드 임팩트 분석

| 영향 범위 | 상세 | 위험도 |
|----------|------|--------|
| DB 마이그레이션 | `pjt_id` nullable 컬럼 추가 → 기존 데이터 영향 없음 | 낮음 |
| 기존 Task 조회 | project relation LEFT JOIN → 기존 Task는 null 반환 | 낮음 |
| TodoResponse 타입 | optional 필드 추가 → 하위 호환성 유지 | 낮음 |
| Task 목록 뷰 | 목록/칸반 뷰에 프로젝트명 표시는 별도 요청 시 추가 | 없음 |
| 스테이징/프로덕션 DB | synchronize=false → 수동 ALTER TABLE 필요 | 중간 |

---

## 4. DB 마이그레이션 SQL (스테이징/프로덕션)

```sql
ALTER TABLE amb_todos ADD COLUMN IF NOT EXISTS pjt_id UUID NULL;
ALTER TABLE amb_todos ADD CONSTRAINT fk_todos_project
  FOREIGN KEY (pjt_id) REFERENCES kms_projects(pjt_id) ON DELETE SET NULL;
```

---

## 5. 검증 계획

1. `npm run build` 전체 빌드 성공 확인
2. Task 생성 시 Project 선택 → DB에 `pjt_id` 저장 확인
3. Task 수정 시 Project 변경/제거 동작 확인
4. Task 상세/목록에서 `projectName` 응답 확인
5. Project 미선택 시 기존 동작과 동일한지 확인
6. 기존 Task 데이터 조회 정상 여부 확인
