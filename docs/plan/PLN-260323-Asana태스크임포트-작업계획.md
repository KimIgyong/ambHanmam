# 작업 계획서: Asana 태스크 → AMA 이슈 임포트

> **문서번호**: PLAN-Asana태스크임포트-작업계획-20260323
> **작성일**: 2026-03-23
> **요구사항 분석서**: `docs/analysis/REQ-Asana태스크임포트-20260323.md`

---

## 1. 시스템 현황 기반 구현 전략

### 1.1 재사용 가능한 기존 시스템
| 기존 시스템 | 재사용 방법 |
|------------|-------------|
| `amb_api_keys` + `CryptoService` | Asana PAT 암호화 저장 (provider: `ASANA_PAT`) |
| `ApiKeyService.getDecryptedKey()` | PAT 조회 (법인별 → 시스템 fallback) |
| EntityExternalConnectPage `SERVICE_CARDS` | Asana 카드 추가 |
| Slack 모듈 구조 패턴 | controller/service/entity/dto 동일 구조 |
| `IssueService.create()` | 이슈 생성 로직 재사용 |
| `useProjectList()` 훅 | AMA 프로젝트 드롭다운 |

### 1.2 신규 구현 필요
| 항목 | 설명 |
|------|------|
| `asana-integration` 모듈 | 백엔드 NestJS 모듈 신규 |
| `AsanaApiService` | Asana REST API 클라이언트 |
| `AsanaImportService` | 태스크→이슈 변환 및 임포트 |
| DB 테이블 2개 | 프로젝트 매핑, 태스크 매핑 |
| `iss_asana_gid` 컬럼 | 이슈 엔티티 확장 |
| 프론트엔드 페이지 | Asana 연동 설정 UI |

---

## 2. 단계별 구현 계획

### Step 1: DB 스키마 및 엔티티 생성

#### 1-1. 마이그레이션 SQL
```sql
-- Asana 프로젝트 매핑
CREATE TABLE amb_asana_project_mappings (
  apm_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id                UUID NOT NULL,
  apm_asana_project_gid VARCHAR(50) NOT NULL,
  apm_asana_project_name VARCHAR(200),
  apm_asana_workspace_gid VARCHAR(50),
  pjt_id                UUID,
  apm_status            VARCHAR(20) DEFAULT 'ACTIVE',
  apm_last_synced_at    TIMESTAMP,
  apm_created_at        TIMESTAMP DEFAULT NOW(),
  apm_updated_at        TIMESTAMP DEFAULT NOW(),
  apm_deleted_at        TIMESTAMP,
  UNIQUE(ent_id, apm_asana_project_gid)
);

-- Asana 태스크 매핑
CREATE TABLE amb_asana_task_mappings (
  atm_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apm_id                UUID NOT NULL REFERENCES amb_asana_project_mappings(apm_id),
  atm_asana_task_gid    VARCHAR(50) NOT NULL,
  iss_id                UUID NOT NULL,
  atm_created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(apm_id, atm_asana_task_gid)
);

-- 이슈 테이블에 Asana GID 컬럼 추가
ALTER TABLE amb_issues ADD COLUMN iss_asana_gid VARCHAR(50);
```

#### 1-2. TypeORM 엔티티
- `apps/api/src/domain/asana-integration/entity/asana-project-mapping.entity.ts`
- `apps/api/src/domain/asana-integration/entity/asana-task-mapping.entity.ts`

#### 1-3. 이슈 엔티티 수정
- `apps/api/src/domain/issues/entity/issue.entity.ts` — `issAsanaGid` 컬럼 추가

**변경 파일**: 3개 신규 + 1개 수정
**사이드 임팩트**: 이슈 엔티티에 nullable 컬럼 추가만이므로 기존 기능 영향 없음

---

### Step 2: 백엔드 Asana API 서비스

#### 2-1. AsanaApiService (`asana-api.service.ts`)
```typescript
// 주요 메서드
authTest(pat: string): Promise<{ ok: boolean; name?: string; email?: string }>
getProject(pat: string, projectGid: string): Promise<AsanaProject>
getTasksForProject(pat: string, projectGid: string, opts?): Promise<{ tasks: AsanaTask[]; nextOffset?: string }>
```

- HTTP 클라이언트: axios 사용 (추가 패키지 불필요, 이미 설치됨)
- Base URL: `https://app.asana.com/api/1.0`
- 인증: `Authorization: Bearer {PAT}`
- opt_fields: `name,notes,assignee.name,due_on,start_on,completed,completed_at,created_at,custom_fields,custom_fields.name,custom_fields.display_value,memberships.section.name,permalink_url,num_subtasks`

#### 2-2. Rate Limit 처리
- 150 req/min 제한
- 태스크 조회: 페이지당 100건, 순차 호출
- 호출 간 400ms delay (안전 마진)

**변경 파일**: 1개 신규

---

### Step 3: 백엔드 임포트 서비스

#### 3-1. AsanaImportService (`asana-import.service.ts`)
```typescript
// 주요 메서드
importTasks(entityId, mappingId, userId, opts?): Promise<ImportResult>
```

**임포트 로직**:
1. 프로젝트 매핑에서 Asana GID, AMA pjt_id 조회
2. PAT 복호화 (`ApiKeyService.getDecryptedKey('ASANA_PAT', entityId)`)
3. Asana API로 태스크 전체 페칭 (페이지네이션 반복)
4. 각 태스크에 대해:
   - 중복 확인 (`amb_asana_task_mappings`에 GID 존재 여부)
   - 필드 매핑 (아래 표 참조)
   - `IssueEntity` 직접 생성 (IssueService 의존 없이 Repository 직접 사용)
   - 태스크 매핑 레코드 저장
5. 결과 반환: `{ total, imported, skipped, failed }`

**필드 매핑 로직**:
| Asana | AMA Issue | 변환 |
|-------|-----------|------|
| name | iss_title | 그대로 (max 200자 truncate) |
| notes | iss_description | 앞에 섹션/담당자 정보 추가 |
| completed=true | iss_status='CLOSED' | boolean→string |
| completed=false | iss_status='OPEN' | boolean→string |
| due_on | iss_due_date | 'YYYY-MM-DD' 그대로 |
| start_on | iss_start_date | 'YYYY-MM-DD' 그대로 |
| custom_fields[Priority]=High | iss_priority=1 | enum→int |
| custom_fields[Priority]=Medium | iss_priority=3 | enum→int |
| custom_fields[Priority]=Low | iss_priority=5 | enum→int |
| permalink_url | iss_ref_number | 원본 링크 저장 |
| gid | iss_asana_gid | 참조용 |
| (고정) | iss_type='TASK' | 모든 태스크 |
| (고정) | iss_severity='MINOR' | 기본값 |
| (고정) | iss_reporter_id=userId | 임포트 실행자 |
| (고정) | iss_visibility='ENTITY' | 기본값 |

**변경 파일**: 1개 신규

---

### Step 4: 백엔드 컨트롤러 및 DTO

#### 4-1. AsanaAdminController (`asana-admin.controller.ts`)
```
POST   /entity-settings/asana/config         — PAT 저장
GET    /entity-settings/asana/config         — PAT 설정 조회
DELETE /entity-settings/asana/config         — PAT 삭제
POST   /entity-settings/asana/test-connection — 연결 테스트
GET    /entity-settings/asana/projects/:gid  — Asana 프로젝트 정보
GET    /entity-settings/asana/projects/:gid/tasks — 태스크 미리보기 (limit 10)
POST   /entity-settings/asana/mappings       — 프로젝트 매핑 생성
GET    /entity-settings/asana/mappings       — 매핑 목록 조회
DELETE /entity-settings/asana/mappings/:id   — 매핑 삭제
POST   /entity-settings/asana/mappings/:id/import — 태스크 임포트 실행
```

#### 4-2. DTO (Request — snake_case)
- `create-asana-mapping.dto.ts`: `asana_project_gid`, `asana_project_name?`, `project_id?`
- `import-asana-tasks.dto.ts`: `completed_filter?` (all/active/completed)

#### 4-3. Response (camelCase) — 컨벤션 준수
```typescript
// GET /mappings 응답
{
  id: string;              // apm_id
  asanaProjectGid: string; // apm_asana_project_gid
  asanaProjectName: string;
  projectId: string | null;
  projectName: string;     // JOIN으로 조회
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

// POST /mappings/:id/import 응답
{
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}

// GET /projects/:gid 응답
{
  gid: string;
  name: string;
  taskCount: number;
}

// POST /test-connection 응답
{
  ok: boolean;
  name: string;
  email: string;
}
```

**변경 파일**: 3개 신규

---

### Step 5: 백엔드 모듈 등록

#### 5-1. AsanaIntegrationModule (`asana-integration.module.ts`)
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsanaProjectMappingEntity,
      AsanaTaskMappingEntity,
      IssueEntity,
    ]),
    SettingsModule,  // CryptoService, ApiKeyService
  ],
  controllers: [AsanaAdminController],
  providers: [AsanaApiService, AsanaImportService],
})
```

#### 5-2. AppModule에 등록
- `apps/api/src/app.module.ts` — imports에 `AsanaIntegrationModule` 추가

**변경 파일**: 1개 신규 + 1개 수정

---

### Step 6: 프론트엔드 서비스 및 훅

#### 6-1. AsanaIntegrationService (`asana-integration.service.ts`)

**인터페이스 (백엔드 Response camelCase와 일치)**:
```typescript
// 프론트엔드 인터페이스 — 반드시 백엔드 응답 필드명과 동일
export interface AsanaProjectMapping {
  id: string;
  asanaProjectGid: string;
  asanaProjectName: string;
  projectId: string | null;
  projectName: string;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface AsanaImportResult {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
}
```

**서비스 메서드**:
```typescript
class AsanaIntegrationService {
  prefix = '/entity-settings/asana';

  saveConfig(pat: string): Promise<SlackAppConfig>
  getConfig(): Promise<SlackAppConfig[]>
  deleteConfig(): Promise<void>
  testConnection(): Promise<{ ok: boolean; name: string; email: string }>
  getAsanaProject(gid: string): Promise<{ gid: string; name: string; taskCount: number }>
  getMappings(): Promise<AsanaProjectMapping[]>
  createMapping(data: { asana_project_gid: string; asana_project_name?: string; project_id?: string }): Promise<AsanaProjectMapping>
  deleteMapping(id: string): Promise<void>
  importTasks(mappingId: string, opts?: { completed_filter?: string }): Promise<AsanaImportResult>
}
```

#### 6-2. useAsanaIntegration 훅 (`useAsanaIntegration.ts`)
- `useAsanaConfig()` — 설정 조회
- `useSaveAsanaConfig()` — PAT 저장 mutation
- `useDeleteAsanaConfig()` — PAT 삭제 mutation
- `useTestAsanaConnection()` — 연결 테스트 mutation
- `useAsanaMappings()` — 매핑 목록 조회
- `useCreateAsanaMapping()` — 매핑 생성 mutation
- `useDeleteAsanaMapping()` — 매핑 삭제 mutation
- `useImportAsanaTasks()` — 임포트 실행 mutation

**변경 파일**: 2개 신규

---

### Step 7: 프론트엔드 UI 페이지

#### 7-1. EntityAsanaIntegrationPage.tsx
**구성 섹션**:
1. **PAT 설정 카드** — 토큰 입력, 마스킹 표시, 연결 테스트 버튼
2. **프로젝트 매핑 카드** — Asana URL/GID 입력 → 프로젝트 정보 확인 → AMA 프로젝트 선택 → 매핑 생성
3. **매핑 목록** — 생성된 매핑 목록, Import/삭제 버튼
4. **임포트 모달** — 필터 선택 (전체/활성/완료) → 실행 → 결과 표시

#### 7-2. i18n 키 추가
- `apps/web/src/locales/ko/entitySettings.json` — `asana` 섹션
- `apps/web/src/locales/en/entitySettings.json` — `asana` 섹션

#### 7-3. External Connect 페이지에 Asana 카드 추가
- `EntityExternalConnectPage.tsx` — SERVICE_CARDS 배열에 Asana 항목 추가

#### 7-4. 라우터 등록
- Asana 설정 페이지 라우트 추가

**변경 파일**: 4개 수정 + 1개 신규

---

### Step 8: 메뉴 시드 및 DB 마이그레이션

#### 8-1. 메뉴 시드 SQL
- `ENTITY_ASANA_INTEGRATION` 메뉴 코드 추가 (선택사항 — 기존 `ENTITY_EXTERNAL_TASK_TOOLS` 하위로 배치 가능)

#### 8-2. 스테이징 DB 마이그레이션 실행
- 테이블 생성 SQL 실행
- iss_asana_gid 컬럼 추가

**변경 파일**: 1개 신규 SQL

---

## 3. 파일 변경 목록 총정리

### 신규 파일 (12개)
```
apps/api/src/domain/asana-integration/
├── asana-integration.module.ts
├── controller/asana-admin.controller.ts
├── service/asana-api.service.ts
├── service/asana-import.service.ts
├── entity/asana-project-mapping.entity.ts
├── entity/asana-task-mapping.entity.ts
└── dto/
    ├── create-asana-mapping.dto.ts
    └── import-asana-tasks.dto.ts

apps/web/src/domain/asana-integration/
├── service/asana-integration.service.ts
└── hooks/useAsanaIntegration.ts

apps/web/src/domain/entity-settings/pages/
└── EntityAsanaIntegrationPage.tsx

sql/
└── migration-asana-integration.sql
```

### 수정 파일 (6개)
```
apps/api/src/app.module.ts                          — AsanaIntegrationModule import
apps/api/src/domain/issues/entity/issue.entity.ts   — iss_asana_gid 컬럼 추가
apps/web/src/domain/entity-settings/pages/EntityExternalConnectPage.tsx — Asana 카드
apps/web/src/locales/ko/entitySettings.json         — asana i18n
apps/web/src/locales/en/entitySettings.json         — asana i18n
apps/web/src/router 관련 파일                        — 라우트 추가
```

---

## 4. 사이드 임팩트 분석

| 변경 | 영향 범위 | 위험도 |
|------|-----------|--------|
| `amb_issues` 컬럼 추가 | nullable이므로 기존 코드 영향 없음 | 낮음 |
| `app.module.ts` 수정 | 모듈 import 추가만, 기존 모듈 변경 없음 | 낮음 |
| External Connect 페이지 | SERVICE_CARDS 배열에 항목 추가만 | 낮음 |
| i18n JSON | 새 섹션 추가만, 기존 키 변경 없음 | 없음 |
| IssueEntity 수정 | 신규 nullable 컬럼, TypeORM sync시 자동 반영 | 낮음 |

---

## 5. 구현 순서 및 예상 작업량

| 순서 | Step | 내용 | 파일 수 |
|------|------|------|---------|
| 1 | Step 1 | DB 스키마 + 엔티티 | 3+1 |
| 2 | Step 2 | AsanaApiService | 1 |
| 3 | Step 3 | AsanaImportService | 1 |
| 4 | Step 4 | Controller + DTO | 3 |
| 5 | Step 5 | Module 등록 | 1+1 |
| 6 | Step 6 | FE 서비스 + 훅 | 2 |
| 7 | Step 7 | FE 페이지 + i18n + 라우트 | 1+4 |
| 8 | Step 8 | DB 마이그레이션 실행 | 1 |
| 9 | - | 빌드/커밋/배포/테스트 | - |

---

## 6. 아메바 코드 컨벤션 체크리스트

구현 시 아래 항목을 반드시 준수한다.

### DB 네이밍
- [x] 테이블: `amb_` prefix + snake_case 복수형 (`amb_asana_project_mappings`)
- [x] 컬럼: 3자 prefix + snake_case (`apm_asana_project_gid`)
- [x] PK: `{prefix}_id` UUID (`apm_id`, `atm_id`)
- [x] Soft Delete: `{prefix}_deleted_at` (`apm_deleted_at`)

### API 네이밍
- [x] Request DTO: snake_case (`asana_project_gid`, `project_id`, `completed_filter`)
- [x] Response DTO: camelCase (`asanaProjectGid`, `projectName`, `lastSyncedAt`)
- [x] 표준 응답: `{ success, data, error?, timestamp }`
- [x] FE 인터페이스 필드명 = 백엔드 Response camelCase 필드명

### 파일 네이밍
- [x] 컴포넌트: PascalCase (`EntityAsanaIntegrationPage.tsx`)
- [x] 서비스: kebab-case (`.service.ts`) (`asana-api.service.ts`)
- [x] 훅: `use` + PascalCase (`useAsanaIntegration.ts`)
- [x] 컨트롤러: kebab-case (`.controller.ts`) (`asana-admin.controller.ts`)
- [x] 엔티티: kebab-case (`.entity.ts`) (`asana-project-mapping.entity.ts`)
- [x] DTO: kebab-case (`.dto.ts`) (`create-asana-mapping.dto.ts`)

### i18n
- [x] 프론트엔드 UI 텍스트는 `locales/` 번역 파일 사용
- [x] 컴포넌트에 텍스트 직접 하드코딩 금지
- [x] `useTranslation()` 훅의 `t()` 함수 사용
