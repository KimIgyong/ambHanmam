# Todo 상태 변경 로그 및 완료일 기록 요구사항 분석 (1차 초안)

> **작성일**: 2026-02-19
> **상태**: Draft v1
> **이슈**: 기한이 지난 할일을 완료 처리할 경우 완료일 기록이 없으며, 상태 변경 이력이 추적되지 않음

---

## 1. 이슈 상세

### 1.1 문제 상황

현재 Todo 시스템에서 상태를 변경하면 `tdo_updated_at`(TypeORM `@UpdateDateColumn`)만 갱신될 뿐, **어떤 상태에서 어떤 상태로 변경되었는지, 언제 완료되었는지** 기록이 없다.

**시나리오 예시**:
1. 사용자가 2/15 기한의 할일을 작성
2. 2/19에 완료 처리
3. 현재 시스템: `tdo_updated_at = 2/19` 만 기록 → 단순 수정인지 완료인지 구분 불가
4. 필요한 것: `tdo_completed_at = 2/19` 명시적 기록 + 상태 변경 로그

### 1.2 현행 구조 분석

**TodoEntity** (`apps/api/src/domain/todo/entity/todo.entity.ts`):

```
tdo_id           UUID (PK)
usr_id           UUID (FK → User)
tdo_title        VARCHAR(200)
tdo_description  TEXT (nullable)
tdo_status       VARCHAR(20) - SCHEDULED | IN_PROGRESS | COMPLETED
tdo_due_date     DATE
tdo_tags         TEXT (nullable, 콤마 분리)
tdo_created_at   TIMESTAMP (자동)
tdo_updated_at   TIMESTAMP (자동)
tdo_deleted_at   TIMESTAMP (Soft Delete)
```

- **tdo_completed_at 없음**: 완료 시점 추적 불가
- **상태 변경 로그 없음**: 상태 전이 이력 추적 불가
- **tdo_started_at 없음**: 작업 시작 시점 추적 불가

**TodoService** (`apps/api/src/domain/todo/service/todo.service.ts`):

```typescript
// updateTodo 메서드 - 상태 변경 시 아무런 추가 로직 없음
if (dto.status !== undefined) entity.tdoStatus = dto.status;
```

**TodoResponse** (`packages/types/src/domain.types.ts`):

```typescript
interface TodoResponse {
  todoId: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  dueDate: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  // completedAt 없음
  // statusLogs 없음
}
```

**프론트엔드 TodoItem** (`apps/web/src/domain/todos/components/TodoItem.tsx`):

```typescript
// 상태 순환: SCHEDULED → IN_PROGRESS → COMPLETED → SCHEDULED
const nextStatus = {
  SCHEDULED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
  COMPLETED: 'SCHEDULED',
};
```

---

## 2. 요구사항 정의

### 2.1 핵심 요구사항

| ID | 요구사항 | 우선순위 |
|----|---------|:--------:|
| R1 | 완료 처리 시 `tdo_completed_at` 날짜 기록 | 높음 |
| R2 | 모든 상태 변경 시 변경 로그 기록 (누가, 언제, 무엇에서→무엇으로) | 높음 |
| R3 | 완료→다른 상태로 되돌릴 때 `tdo_completed_at` 초기화 | 중간 |
| R4 | 기한 초과 여부를 완료 시점 기준으로 판단 가능 | 중간 |
| R5 | 상태 변경 이력을 프론트엔드에서 조회 가능 | 낮음 |

### 2.2 상태 전이 규칙

```
SCHEDULED ──→ IN_PROGRESS ──→ COMPLETED
    ↑              │               │
    └──────────────┘               │
    ↑                              │
    └──────────────────────────────┘
```

- **SCHEDULED → IN_PROGRESS**: `tdo_started_at` 기록 (최초 1회)
- **IN_PROGRESS → COMPLETED**: `tdo_completed_at` 기록
- **SCHEDULED → COMPLETED**: `tdo_completed_at` 기록 (직접 완료도 허용)
- **COMPLETED → SCHEDULED**: `tdo_completed_at = NULL` 초기화 (재개)
- **COMPLETED → IN_PROGRESS**: `tdo_completed_at = NULL` 초기화 (재개)

---

## 3. 구현 설계

### 3.1 DB 스키마 변경

#### 3.1.1 TodoEntity 컬럼 추가

```sql
ALTER TABLE amb_todos
  ADD COLUMN tdo_completed_at TIMESTAMP NULL,
  ADD COLUMN tdo_started_at   TIMESTAMP NULL;
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `tdo_completed_at` | TIMESTAMP (nullable) | COMPLETED 상태로 변경된 시점 |
| `tdo_started_at` | TIMESTAMP (nullable) | IN_PROGRESS 상태로 최초 변경된 시점 |

#### 3.1.2 Todo 상태 변경 로그 테이블 (신규)

```sql
CREATE TABLE amb_todo_status_logs (
  tsl_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tdo_id          UUID NOT NULL REFERENCES amb_todos(tdo_id),
  tsl_from_status VARCHAR(20) NOT NULL,
  tsl_to_status   VARCHAR(20) NOT NULL,
  tsl_changed_by  UUID NOT NULL REFERENCES amb_users(usr_id),
  tsl_changed_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  tsl_note        TEXT NULL
);

CREATE INDEX idx_todo_status_logs_tdo_id ON amb_todo_status_logs(tdo_id);
CREATE INDEX idx_todo_status_logs_changed_at ON amb_todo_status_logs(tsl_changed_at);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `tsl_id` | UUID (PK) | 로그 고유 ID |
| `tdo_id` | UUID (FK) | Todo 참조 |
| `tsl_from_status` | VARCHAR(20) | 변경 전 상태 |
| `tsl_to_status` | VARCHAR(20) | 변경 후 상태 |
| `tsl_changed_by` | UUID (FK) | 변경한 사용자 |
| `tsl_changed_at` | TIMESTAMP | 변경 시점 |
| `tsl_note` | TEXT (nullable) | 변경 사유 (선택) |

---

### 3.2 백엔드 변경사항

#### 3.2.1 Entity 수정: `todo.entity.ts`

```typescript
// 추가할 컬럼
@Column({ name: 'tdo_completed_at', type: 'timestamp', nullable: true })
tdoCompletedAt: Date | null;

@Column({ name: 'tdo_started_at', type: 'timestamp', nullable: true })
tdoStartedAt: Date | null;
```

#### 3.2.2 신규 Entity: `todo-status-log.entity.ts`

```typescript
@Entity('amb_todo_status_logs')
export class TodoStatusLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tsl_id' })
  tslId: string;

  @Column({ name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'tsl_from_status', length: 20 })
  tslFromStatus: string;

  @Column({ name: 'tsl_to_status', length: 20 })
  tslToStatus: string;

  @Column({ name: 'tsl_changed_by' })
  tslChangedBy: string;

  @Column({ name: 'tsl_changed_at', type: 'timestamp', default: () => 'NOW()' })
  tslChangedAt: Date;

  @Column({ name: 'tsl_note', type: 'text', nullable: true })
  tslNote: string;
}
```

#### 3.2.3 Service 수정: `todo.service.ts`

`updateTodo` 메서드에 상태 변경 감지 로직 추가:

```typescript
async updateTodo(id: string, dto: UpdateTodoRequest, userId: string) {
  // ... 기존 엔티티 조회 + 권한 검사 ...

  if (dto.status !== undefined && dto.status !== entity.tdoStatus) {
    const oldStatus = entity.tdoStatus;
    const newStatus = dto.status;

    // 상태 변경 로그 저장
    await this.statusLogRepo.save({
      tdoId: id,
      tslFromStatus: oldStatus,
      tslToStatus: newStatus,
      tslChangedBy: userId,
      tslChangedAt: new Date(),
    });

    // 완료 시점 기록
    if (newStatus === 'COMPLETED') {
      entity.tdoCompletedAt = new Date();
    } else if (oldStatus === 'COMPLETED') {
      // 완료에서 되돌릴 때 초기화
      entity.tdoCompletedAt = null;
    }

    // 시작 시점 기록 (최초 1회)
    if (newStatus === 'IN_PROGRESS' && !entity.tdoStartedAt) {
      entity.tdoStartedAt = new Date();
    }

    entity.tdoStatus = newStatus;
  }

  // ... 나머지 필드 업데이트 ...
}
```

#### 3.2.4 신규 API: 상태 로그 조회

```
GET /api/v1/todos/:id/status-logs
```

**응답**:
```typescript
interface TodoStatusLogResponse {
  logId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  note: string | null;
}
```

#### 3.2.5 TodoResponse 타입 확장

```typescript
export interface TodoResponse {
  todoId: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  dueDate: string;
  tags: string | null;
  completedAt: string | null;    // 신규
  startedAt: string | null;      // 신규
  isOverdue: boolean;            // 신규 (계산 필드)
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 프론트엔드 변경사항

#### 3.3.1 TodoItem 컴포넌트 UI 개선

- 완료된 할일: 완료 날짜 표시 (`completedAt`)
- 기한 초과 완료: 기한과 실제 완료일 차이 표시 (예: "2일 지연 완료")
- 상태 로그 아이콘 → 클릭 시 이력 팝오버/모달

#### 3.3.2 신규 컴포넌트

- `TodoStatusHistory.tsx`: 상태 변경 타임라인 UI

---

## 4. 사이드 임팩트 분석

### 4.1 DB 영향

| 영향 영역 | 위험도 | 설명 | 완화 방안 |
|-----------|:------:|------|----------|
| **테이블 스키마 변경** | 중간 | `amb_todos`에 2개 nullable 컬럼 추가 → 기존 데이터에 영향 없음 (NULL 허용) | ALTER TABLE은 nullable 컬럼이므로 downtime 없이 적용 가능 |
| **신규 테이블** | 낮음 | `amb_todo_status_logs` 추가 → 기존 시스템에 영향 없음 | 인덱스 적절히 설정 |
| **로그 데이터 증가** | 낮음 | 상태 변경마다 1행 추가 → Todo 수가 제한적이므로 무시 가능 | 필요 시 일정 기간 후 아카이빙 |

### 4.2 API 호환성

| 영향 영역 | 위험도 | 설명 | 완화 방안 |
|-----------|:------:|------|----------|
| **TodoResponse 변경** | 중간 | `completedAt`, `startedAt`, `isOverdue` 필드 추가 → 기존 프론트엔드에서 새 필드 무시하므로 하위 호환 | 새 필드는 모두 nullable 또는 optional |
| **updateTodo 동작 변경** | 낮음 | 상태 변경 시 추가 로직 실행 → 기존 API 인터페이스는 동일 | 로그 저장 실패 시 본래 업데이트는 진행되도록 try-catch |
| **Swagger 문서** | 낮음 | 새 엔드포인트 추가 필요 | `/todos/:id/status-logs` 엔드포인트 문서화 |

### 4.3 프론트엔드 호환성

| 영향 영역 | 위험도 | 설명 | 완화 방안 |
|-----------|:------:|------|----------|
| **TodoItem UI 변경** | 낮음 | 완료 날짜 표시 추가 → 기존 레이아웃 약간 확장 | 조건부 렌더링으로 completedAt이 있을 때만 표시 |
| **TodoPage 상태 관리** | 낮음 | useTodos 훅에서 새 필드 활용 | 기존 로직 변경 없이 추가만 |
| **TodoFormModal** | 없음 | 상태 로그는 자동 기록 → 폼 변경 불필요 | - |
| **i18n 키 추가** | 낮음 | 완료일, 지연, 상태이력 관련 번역 키 추가 필요 | `todos.json`에 키 추가 |

### 4.4 연관 모듈 영향

| 모듈 | 영향 | 설명 |
|------|:----:|------|
| **KMS 자동 태깅** | 없음 | 상태 로그는 KMS 태깅과 독립적 |
| **대시보드** | 가능 | 완료율, 평균 완료 소요시간 등 통계에 활용 가능 (추후) |
| **알림 시스템** | 가능 | 기한 초과 + 완료 시 알림 로직에 활용 가능 (추후) |
| **AI 에이전트** | 없음 | 에이전트 대화와 독립적 |

### 4.5 데이터 마이그레이션

| 항목 | 설명 |
|------|------|
| **기존 COMPLETED 상태 Todo** | `tdo_completed_at`이 NULL인 상태 → `tdo_updated_at`을 `tdo_completed_at`으로 복사하는 마이그레이션 스크립트 필요 |
| **기존 IN_PROGRESS 상태 Todo** | `tdo_started_at`이 NULL → `tdo_updated_at`을 `tdo_started_at`으로 복사 |
| **기존 상태 변경 이력** | 복구 불가 → 마이그레이션 이후부터 로깅 시작 |

---

## 5. 수정 대상 파일 목록

### 백엔드

| 파일 | 작업 | 변경 범위 |
|------|------|----------|
| `apps/api/src/domain/todo/entity/todo.entity.ts` | 수정 | `tdoCompletedAt`, `tdoStartedAt` 컬럼 추가 |
| `apps/api/src/domain/todo/entity/todo-status-log.entity.ts` | **신규** | 상태 로그 엔티티 |
| `apps/api/src/domain/todo/service/todo.service.ts` | 수정 | 상태 변경 감지 + 로그 저장 + 날짜 기록 |
| `apps/api/src/domain/todo/controller/todo.controller.ts` | 수정 | 상태 로그 조회 엔드포인트 추가 |
| `apps/api/src/domain/todo/mapper/todo.mapper.ts` | 수정 | `completedAt`, `startedAt`, `isOverdue` 매핑 |
| `apps/api/src/domain/todo/todo.module.ts` | 수정 | `TodoStatusLogEntity` 등록 |
| `packages/types/src/domain.types.ts` | 수정 | `TodoResponse` 타입 확장 |

### 프론트엔드

| 파일 | 작업 | 변경 범위 |
|------|------|----------|
| `apps/web/src/domain/todos/components/TodoItem.tsx` | 수정 | 완료일 표시, 지연 표시 |
| `apps/web/src/domain/todos/components/TodoStatusHistory.tsx` | **신규** | 상태 이력 타임라인 |
| `apps/web/src/domain/todos/hooks/useTodos.ts` | 수정 | 상태 로그 조회 쿼리 추가 |
| `apps/web/src/domain/todos/service/todo.service.ts` | 수정 | 상태 로그 API 호출 추가 |
| `apps/web/src/locales/ko/todos.json` | 수정 | 번역 키 추가 |
| `apps/web/src/locales/en/todos.json` | 수정 | 번역 키 추가 |
| `apps/web/src/locales/vi/todos.json` | 수정 | 번역 키 추가 |

### 마이그레이션

| 파일 | 작업 |
|------|------|
| 마이그레이션 SQL/스크립트 | 기존 COMPLETED Todo의 `tdo_completed_at` 백필 |

---

## 6. 구현 우선순위

| 순서 | 작업 | 의존성 |
|:----:|------|--------|
| 1 | DB 스키마 변경 (컬럼 추가 + 신규 테이블) | 없음 |
| 2 | TodoEntity + TodoStatusLogEntity 수정/생성 | 1 |
| 3 | TodoService 상태 변경 로직 추가 | 2 |
| 4 | TodoMapper + TodoResponse 타입 확장 | 3 |
| 5 | 기존 데이터 마이그레이션 스크립트 | 1 |
| 6 | 상태 로그 조회 API | 3 |
| 7 | 프론트엔드 TodoItem UI 업데이트 | 4 |
| 8 | 프론트엔드 TodoStatusHistory 컴포넌트 | 6 |

---

## 7. 비즈니스 가치

| 지표 | 현재 | 개선 후 |
|------|------|---------|
| 완료 시점 추적 | 불가 | `tdo_completed_at`으로 정확한 완료일 확인 |
| 기한 준수율 분석 | 불가 | `dueDate` vs `completedAt` 비교로 분석 가능 |
| 평균 완료 소요시간 | 불가 | `startedAt` → `completedAt` 차이로 계산 |
| 업무 패턴 분석 | 불가 | 상태 로그로 작업 흐름 패턴 분석 가능 |
| 감사 추적 | 불가 | 누가 언제 상태를 변경했는지 추적 가능 |

---

## 8. 참고: 유사 패턴 (ContractHistory)

이미 Billing 모듈에 유사한 변경 이력 패턴이 구현되어 있음:

```
ContractEntity → ContractHistoryEntity (amb_bil_contract_history)
  - hst_field: 변경된 필드명
  - hst_old_value: 이전 값
  - hst_new_value: 새 값
  - hst_changed_by: 변경자
  - hst_changed_at: 변경 시점
```

이 패턴을 참고하되, Todo는 **상태 변경에 특화**된 경량 로그 테이블로 설계하여 범용 필드 변경 추적보다 단순하게 유지한다.
