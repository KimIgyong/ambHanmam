# 작업 계획서: Entity Settings Organization 페이지 개선

- **문서 ID**: PLAN-EntitySettingsOrganization-작업계획-20260308
- **작성일**: 2026-03-08
- **참조**: `docs/analysis/REQ-EntitySettingsOrganization-20260308.md`

---

## 1. 작업 범위 및 전략

### 1.1 구현 전략
6개 섹션을 우선순위별 3개 Phase로 나누어 점진적으로 구현한다. 각 Phase는 독립적으로 배포 가능하도록 설계한다.

### 1.2 Phase 구분

| Phase | 섹션 | 우선순위 | 예상 범위 |
|-------|------|---------|----------|
| Phase 1 | Section 1 (Entity Basic Info) + Section 2 (Units & Sections) + Section 3 (Cells) | P0 | 백엔드 API 3개 + 프론트엔드 3개 컴포넌트 + DB 변경 |
| Phase 2 | Section 4 (Work & Payroll) + Section 5 (AI Config) | P0~P1 | 백엔드 API 6개 + 프론트엔드 2개 컴포넌트 + DB 2테이블 |
| Phase 3 | Section 6 (Drive Integration) + P2 기능 | P1~P2 | 백엔드 API 3개 + 프론트엔드 1개 컴포넌트 + DB 1테이블 |

---

## 2. Phase 1: 법인 기본 정보 + 조직 구조 (P0)

### Step 1: DB 변경

#### 1-1. `amb_hr_departments`에 `dep_type` 컬럼 추가
```sql
-- dep_type VARCHAR 컬럼 추가 (ENUM 대신 VARCHAR로 유연하게)
ALTER TABLE amb_hr_departments
  ADD COLUMN dep_type VARCHAR(20) DEFAULT 'UNIT';

-- 기존 데이터 마이그레이션
UPDATE amb_hr_departments SET dep_type = 'UNIT' WHERE dep_level = 1;
UPDATE amb_hr_departments SET dep_type = 'SECTION' WHERE dep_level = 2;
-- Cell은 별도 마이그레이션 (dep_parent_id IS NULL AND dep_level = 2인 항목 확인 필요)

-- Cell 제약조건
ALTER TABLE amb_hr_departments
  ADD CONSTRAINT chk_cell_no_parent
    CHECK (dep_type != 'CELL' OR dep_parent_id IS NULL);
```

#### 수정 파일
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/department/entity/department.entity.ts` | `depType` 컬럼 추가 |

### Step 2: 백엔드 API

#### 2-1. Entity Basic Info API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/entity-settings/:entId/overview` | 법인 기본 정보 조회 |
| PATCH | `/entity-settings/:entId/basic` | 법인 기본 정보 수정 (변경 필드만) |

#### 2-2. Department API 확장
- GET `/departments` 에 `dep_type` 쿼리 파라미터 추가
- POST `/departments` 에 `dep_type` 필드 추가
- DELETE `/departments/:id` 에 UNIT 삭제 시 하위 SECTION 존재 검사

#### 수정 파일
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/entity-settings/controller/entity-settings.controller.ts` | overview, basic 엔드포인트 추가 |
| `apps/api/src/domain/entity-settings/service/entity-settings.service.ts` | getOverview, updateBasic 메서드 |
| `apps/api/src/domain/department/service/department.service.ts` | dep_type 필터, UNIT 삭제 검증 |
| `apps/api/src/domain/department/dto/` | CreateDepartmentDto에 dep_type 추가 |

### Step 3: 프론트엔드 - Organization 페이지 리팩터링

#### 3-1. 페이지 구조 변경
- 기존 2탭 → 6섹션 단일 스크롤 페이지 (아코디언 또는 섹션 구분)
- 각 섹션은 독립 컴포넌트로 분리

#### 3-2. 신규 컴포넌트
| 컴포넌트 | 경로 | 역할 |
|---------|------|------|
| EntityBasicInfoSection | `components/organization/EntityBasicInfoSection.tsx` | 법인 기본 정보 표시/편집 |
| UnitsAndSectionsSection | `components/organization/UnitsAndSectionsSection.tsx` | Units & Sections 트리 (기존 개선) |
| CellsSection | `components/organization/CellsSection.tsx` | Cells 플랫 리스트 (기존 개선) |

#### 수정 파일
| 파일 | 작업 |
|------|------|
| `apps/web/src/domain/entity-settings/pages/EntityOrganizationPage.tsx` | 6섹션 레이아웃으로 변경 |
| `apps/web/src/domain/entity-settings/hooks/useEntityOrganization.ts` | overview/basic API 훅 추가 |
| `apps/web/src/domain/entity-settings/service/entity-settings.service.ts` | API 함수 추가 |

### Step 4: i18n

#### 수정 파일
| 파일 | 작업 |
|------|------|
| `apps/web/src/locales/ko/entitySettings.json` | organization 섹션 키 추가 |
| `apps/web/src/locales/en/entitySettings.json` | organization 섹션 키 추가 |
| `apps/web/src/locales/vi/entitySettings.json` | organization 섹션 키 추가 |

---

## 3. Phase 2: 근무·급여 + AI 설정 (P0~P1)

### Step 5: DB 변경

#### 5-1. `amb_hr_entities` 근무·급여 컬럼 추가
```sql
ALTER TABLE amb_hr_entities
  ADD COLUMN ent_pay_period_type     VARCHAR(30) DEFAULT 'MONTHLY_FULL',
  ADD COLUMN ent_pay_period_start    SMALLINT    DEFAULT 1,
  ADD COLUMN ent_pay_period_end      SMALLINT    DEFAULT 31,
  ADD COLUMN ent_work_hours_per_day  SMALLINT    DEFAULT 8,
  ADD COLUMN ent_work_days_per_week  SMALLINT    DEFAULT 5,
  ADD COLUMN ent_leave_base_days     SMALLINT    DEFAULT 15;
```
> 주: `ent_pay_day`는 이미 존재

#### 5-2. `amb_entity_ai_configs` 테이블 생성
- eac_id, ent_id, eac_provider, eac_use_shared_key, eac_api_key(암호화), eac_daily_token_limit, eac_monthly_token_limit
- UNIQUE(ent_id, eac_provider)

#### 수정 파일
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/entity-settings/entity/entity-ai-config.entity.ts` | 신규 엔티티 |
| `apps/api/src/domain/hr/entity/hr-entity.entity.ts` | 근무급여 컬럼 추가 |

### Step 6: 백엔드 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/entity-settings/:entId/work-payroll` | 근무·급여 설정 조회 |
| PATCH | `/entity-settings/:entId/work-payroll` | 근무·급여 설정 수정 |
| GET | `/entity-settings/:entId/ai-config` | AI 설정 조회 |
| PUT | `/entity-settings/:entId/ai-config` | AI 설정 저장 |
| GET | `/entity-settings/:entId/ai-config/usage` | 토큰 사용량 조회 |
| POST | `/entity-settings/:entId/ai-config/test` | API Key 테스트 |

### Step 7: 프론트엔드

| 컴포넌트 | 역할 |
|---------|------|
| WorkPayrollSection | 근무·급여 기본 설정 폼 |
| AiAgentConfigSection | API Key + 한도 + 사용량 |

---

## 4. Phase 3: 드라이브 연동 + P2 기능 (P1~P2)

### Step 8: DB 변경
- `amb_entity_drive_configs` 테이블 생성

### Step 9: 백엔드 API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/entity-settings/:entId/drive-config` | 드라이브 설정 조회 |
| PUT | `/entity-settings/:entId/drive-config` | 드라이브 설정 저장 |
| POST | `/entity-settings/:entId/drive-config/test` | 연결 테스트 |

### Step 10: 프론트엔드
| 컴포넌트 | 역할 |
|---------|------|
| DriveIntegrationSection | 드라이브 연동 설정 (기존 EntityDrivePage 통합) |

### Step 11: P2 기능
- 직인 이미지 업로드 개선
- 드래그 앤 드롭 정렬

---

## 5. 전체 수정 파일 목록

### Phase 1 (P0)
| 파일 | 작업 유형 |
|------|----------|
| `apps/api/src/domain/department/entity/department.entity.ts` | 수정 - depType 컬럼 |
| `apps/api/src/domain/department/service/department.service.ts` | 수정 - dep_type 필터/검증 |
| `apps/api/src/domain/department/dto/create-department.dto.ts` | 수정 - dep_type 필드 |
| `apps/api/src/domain/entity-settings/controller/entity-settings.controller.ts` | 수정 - overview/basic 추가 |
| `apps/api/src/domain/entity-settings/service/entity-settings.service.ts` | 수정 - 비즈니스 로직 |
| `apps/web/src/domain/entity-settings/pages/EntityOrganizationPage.tsx` | 수정 - 6섹션 레이아웃 |
| `apps/web/src/domain/entity-settings/components/organization/EntityBasicInfoSection.tsx` | 신규 |
| `apps/web/src/domain/entity-settings/components/organization/UnitsAndSectionsSection.tsx` | 신규 |
| `apps/web/src/domain/entity-settings/components/organization/CellsSection.tsx` | 신규 |
| `apps/web/src/domain/entity-settings/hooks/useEntityOrganization.ts` | 수정 |
| `apps/web/src/domain/entity-settings/service/entity-settings.service.ts` | 수정 |
| `apps/web/src/locales/{ko,en,vi}/entitySettings.json` | 수정 |

### Phase 2 (P0~P1)
| 파일 | 작업 유형 |
|------|----------|
| `apps/api/src/domain/hr/entity/hr-entity.entity.ts` | 수정 - 근무급여 컬럼 |
| `apps/api/src/domain/entity-settings/entity/entity-ai-config.entity.ts` | 신규 |
| `apps/api/src/domain/entity-settings/service/work-payroll.service.ts` | 신규 |
| `apps/api/src/domain/entity-settings/service/ai-config.service.ts` | 신규 |
| `apps/web/src/domain/entity-settings/components/organization/WorkPayrollSection.tsx` | 신규 |
| `apps/web/src/domain/entity-settings/components/organization/AiAgentConfigSection.tsx` | 신규 |

### Phase 3 (P1~P2)
| 파일 | 작업 유형 |
|------|----------|
| `apps/api/src/domain/entity-settings/entity/entity-drive-config.entity.ts` | 신규 |
| `apps/api/src/domain/entity-settings/service/drive-config.service.ts` | 신규 |
| `apps/web/src/domain/entity-settings/components/organization/DriveIntegrationSection.tsx` | 신규 |

---

## 6. 사이드 임팩트 분석

### 6.1 dep_type 마이그레이션 영향

`depLevel` 기반 로직을 사용하는 코드 전수 조사 필요:
- 프론트엔드: EntityOrganizationPage, EntityMemberPage (조직단위 선택)
- 백엔드: department.service.ts, entity-member 관련 로직

**전략**: `dep_type`과 `dep_level`을 병행 유지하고, 점진적으로 dep_type 기반으로 전환. dep_level은 deprecated 처리하되 즉시 제거하지 않음.

### 6.2 기존 Drive/Usage 페이지 처리

- Phase 3 완료 시 `/entity-settings/drive`를 Organization으로 리다이렉트
- `/entity-settings/usage`는 독립 유지 (상세 사용량 분석 용도)

### 6.3 Entity 수정 권한 이중화

- `/settings/entities` (ADMIN 전용): 법인 생성/삭제/전체 수정
- `/entity-settings/organization` (MASTER+): 기본정보 편집만 (생성/삭제 불가)
- 두 경로 모두 같은 `amb_hr_entities` 테이블을 수정하므로, 낙관적 잠금(optimistic locking) 또는 updatedAt 비교로 충돌 방지

---

## 7. 테스트 전략

### Phase 1 테스트 포인트
- [ ] 법인 기본 정보 조회/수정 (MASTER 역할)
- [ ] 법인명 유효성 검사 (2~100자)
- [ ] dep_type 기반 Unit/Section/Cell CRUD
- [ ] Unit 삭제 시 하위 Section 존재 검사
- [ ] Cell dep_parent_id = NULL 강제
- [ ] MANAGER 역할 읽기전용 확인
- [ ] MEMBER/VIEWER 숨김 확인

### Phase 2 테스트 포인트
- [ ] 근무·급여 기본값 저장/조회
- [ ] AI API Key 암호화 저장
- [ ] API Key 연결 테스트
- [ ] 토큰 사용량 조회
- [ ] 한도 초과 시 AI 차단 확인

---

## 8. 배포 계획

| Phase | 배포 환경 | 선행 조건 |
|-------|----------|----------|
| Phase 1 | 스테이징 → 프로덕션 | DB 마이그레이션 (dep_type) 실행 |
| Phase 2 | 스테이징 → 프로덕션 | Phase 1 안정화 후 + DB 테이블 생성 |
| Phase 3 | 스테이징 → 프로덕션 | Phase 2 안정화 후 |
