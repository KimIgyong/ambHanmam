# 요구사항 분석서: Entity Settings Organization 페이지 개선

- **문서 ID**: REQ-EntitySettingsOrganization-20260308
- **작성일**: 2026-03-08
- **참조 문서**: `reference/entity-settings-organization-requirements.md` (v1.0.0)

---

## 1. 개요

`/entity-settings/organization` 페이지를 법인별 종합 설정 허브로 개선한다. 현재 Units/Cells 관리만 존재하는 페이지에 법인 기본 정보, 근무·급여 기본 설정, AI 에이전트 설정, 드라이브 연동 설정을 통합한다.

---

## 2. AS-IS 현황 분석

### 2.1 현재 시스템 구조

#### Entity Settings 메뉴 구성 (`/entity-settings`)
| 메뉴 | 경로 | 현재 상태 |
|------|------|-----------|
| Organization | `/entity-settings/organization` | Units/Cells 2탭 (기본 관리) |
| Member Management | `/entity-settings/members` | 멤버 목록 + 초대 관리 (2탭) |
| Permission Settings | `/entity-settings/permissions` | Unit/Cell/개인별 권한 매트릭스 (3탭) |
| API Keys | `/entity-settings/api-keys` | API 키 CRUD |
| Drive | `/entity-settings/drive` | Google Drive 연동 설정 |
| Usage | `/entity-settings/usage` | AI 토큰 사용량 차트 |
| Work Statistics | `/entity-settings/work-statistics` | 업무 통계 (4탭) |

#### 백엔드 엔티티 현황
- **HrEntityEntity** (`amb_hr_entities`): entCode, entName, entNameEn, entCountry, entCurrency, entRegNo, entAddress, entRepresentative, entPhone, entEmail, entPayDay, entStatus, entStampImage
- **DepartmentEntity** (`amb_hr_departments`): depName, depNameLocal, depParentId, depLevel, depIsActive, depSortOrder
  - `depLevel`: 1 = Department(부서), 2 = Team(팀) — **depType 컬럼 미존재**

#### 프론트엔드 현황
- **EntityOrganizationPage**: 2탭 구조 (units / cells)
  - Units 탭: 트리 구조로 부서/팀 관리 (depParentId 기반)
  - Cells 탭: 플랫 리스트로 셀 관리
- 법인 기본 정보 편집: `/settings/entities` (ADMIN_LEVEL 전용) 에서만 가능

### 2.2 현재 API 엔드포인트
| Method | Path | 역할 |
|--------|------|------|
| GET | `/hr/entities` | 법인 목록 조회 (ADMIN 전용) |
| POST | `/hr/entities` | 법인 생성 (ADMIN 전용) |
| PATCH | `/hr/entities/:id` | 법인 수정 (ADMIN 전용) |
| GET | `/departments` | 부서 목록 조회 |
| POST | `/departments` | 부서 생성 |
| PATCH | `/departments/:id` | 부서 수정 |
| DELETE | `/departments/:id` | 부서 삭제 |

---

## 3. TO-BE 요구사항

### 3.1 Organization 페이지 확장 (6개 섹션)

```
/entity-settings/organization (개선 후)
├── Section 1: Entity Basic Info (법인 기본 정보)     ← 신규
├── Section 2: Units & Sections (유닛 & 섹션 관리)    ← 기존 개선
├── Section 3: Cells (셀 관리)                        ← 기존 개선
├── Section 4: Work & Payroll Defaults (근무·급여)    ← 신규
├── Section 5: AI Agent Config (AI 설정)             ← 신규
└── Section 6: Drive Integration (드라이브 연동)      ← 신규
```

### 3.2 섹션별 요구사항 요약

#### Section 1: Entity Basic Info (P0)
- 현재 선택된 법인의 기본 정보 표시 + 인라인 편집
- **핵심**: MASTER 역할이 법인명(ent_name, ent_name_en) 수정 가능
- 법인 코드(ent_code)는 읽기전용 배지
- ent_status는 ADMIN_LEVEL만 편집 가능
- 저장 시 변경된 필드만 PATCH 전송
- 법인명 유효성: 최소 2자, 최대 100자

#### Section 2: Units & Sections (P0)
- 기존 Units 탭 → Unit/Section 2계층 트리로 개선
- dep_type 도입: `UNIT` (dep_parent_id = NULL), `SECTION` (parent = UNIT)
- Unit 삭제 시 하위 Section 존재하면 삭제 불가
- Unit 비활성화 시 하위 Section 자동 비활성화 (P1)
- Unit Head 지정 가능 (P1)
- 다국어 이름 지원: KO 필수, EN/VI 선택

#### Section 3: Cells (P0)
- 기존 Cells 탭 → 독립 플랫 리스트
- dep_type = `CELL`, dep_parent_id = 항상 NULL
- Cell Lead 지정 가능
- 소속 멤버 수 배지 표시 (P1)

#### Section 4: Work & Payroll Defaults (P1)
- 급여 지급일, 산정 기간 유형, 근무시간, 주 근무일, 연간 기본 연차
- `amb_hr_entities`에 7개 컬럼 추가 필요

#### Section 5: AI Agent Config (P0~P1)
- API Key 사용 방식: 시스템 공유 vs 법인 자체
- 일일/월간 토큰 한도 설정
- 사용량 현황 Progress Bar
- 신규 테이블: `amb_entity_ai_configs`

#### Section 6: Drive Integration (P1)
- 드라이브 사용 방식: 시스템 기본 vs 법인 전용
- OAuth 2.0 / Service Account 인증
- 연결 테스트 기능
- 신규 테이블: `amb_entity_drive_configs`

---

## 4. GAP 분석

### 4.1 DB 변경 필요사항

| 항목 | 현재 (AS-IS) | 필요 (TO-BE) | 작업 |
|------|-------------|-------------|------|
| `amb_hr_departments.dep_type` | 미존재 (depLevel로 구분) | UNIT/SECTION/CELL ENUM | 컬럼 추가 + 데이터 마이그레이션 |
| `amb_hr_entities` 근무급여 컬럼 | ent_pay_day만 존재 | 7개 컬럼 | 6개 컬럼 추가 |
| `amb_entity_ai_configs` | 미존재 | 신규 테이블 | CREATE TABLE |
| `amb_entity_drive_configs` | 미존재 | 신규 테이블 | CREATE TABLE |
| Cell 제약조건 | 없음 | dep_parent_id = NULL 강제 | CHECK 제약 추가 |

### 4.2 백엔드 변경 필요사항

| 항목 | 현재 | 필요 | 작업 |
|------|------|------|------|
| 법인 정보 편집 API | `/hr/entities/:id` (ADMIN 전용) | `/entity-settings/:entId/basic` (MASTER+) | 신규 엔드포인트 |
| 부서 API dep_type 필터 | 미지원 | dep_type 쿼리 파라미터 | 기존 API 확장 |
| 근무급여 설정 API | 미존재 | CRUD | 신규 |
| AI 설정 API | 미존재 | CRUD + 사용량 조회 + 키 테스트 | 신규 |
| Drive 설정 API | `/entity-settings/drive` (프론트) | 백엔드 API 확인 필요 | 확장 또는 신규 |

### 4.3 프론트엔드 변경 필요사항

| 항목 | 현재 | 필요 | 작업 |
|------|------|------|------|
| Organization 페이지 | 2탭 (Units/Cells) | 6섹션 단일 스크롤 페이지 | 대규모 리팩터링 |
| Entity Basic Info 컴포넌트 | 미존재 | 인라인 편집 폼 | 신규 |
| Work & Payroll 컴포넌트 | 미존재 | 설정 폼 | 신규 |
| AI Config 컴포넌트 | 미존재 | API Key + 한도 + 사용량 | 신규 |
| Drive Config 컴포넌트 | 별도 페이지 존재 | Organization에 통합 | 이동/통합 |
| i18n 키 | entitySettings 네임스페이스 | organization 섹션 키 추가 | 3개 언어 |

### 4.4 권한 변경 필요사항

| 역할 | 현재 접근 | 필요 접근 |
|------|----------|----------|
| ADMIN_LEVEL | 전체 | 전체 편집 |
| MASTER | Organization 페이지만 | Section 1~5 편집, Section 6 편집 |
| MANAGER | Organization 페이지만 | Section 1~5 읽기전용, Section 6 숨김 |
| MEMBER/VIEWER | 접근 불가 | 전체 숨김 |

---

## 5. 기존 기능과의 영향 분석

### 5.1 사이드 임팩트

| 영향 범위 | 설명 | 위험도 |
|-----------|------|--------|
| `/settings/entities` | ADMIN 전용 법인 CRUD 유지. Organization에서는 기본정보 편집만 | 낮음 |
| `/entity-settings/drive` | Organization으로 통합 시 기존 독립 페이지 제거 또는 리다이렉트 | 중간 |
| `/entity-settings/usage` | AI Config 섹션에 사용량 표시 추가. 기존 Usage 페이지와 중복 가능 | 낮음 |
| dep_type 마이그레이션 | 기존 depLevel 기반 로직을 dep_type으로 전환 필요 | 높음 |
| 멤버 관리 모달 | 조직단위 선택 UI가 dep_type 기반으로 변경됨 | 중간 |

### 5.2 하위 호환성

- `depLevel` 기존 참조 코드 전수 조사 필요 (프론트엔드 + 백엔드)
- dep_type 마이그레이션 시 DEPARTMENT→UNIT, TEAM→SECTION 매핑
- 기존 Department CRUD API는 dep_type 파라미터 추가하되 하위 호환 유지

---

## 6. 미결 사항 (Open Issues)

| # | 이슈 | 결정 필요 |
|---|------|----------|
| 1 | Unit Head / Cell Lead 참조 테이블 | amb_hr_employees vs amb_users |
| 2 | dep_type 마이그레이션 타이밍 | 즉시 vs 점진적 |
| 3 | 직인 이미지 저장 위치 | DB BLOB vs Drive vs Object Storage |
| 4 | AI 토큰 사용량 집계 방식 | 실시간 vs 배치 |
| 5 | MASTER 역할 도입 전 임시 권한 정책 | MANAGER에게 편집 허용 여부 |
| 6 | 기존 `/entity-settings/drive` 페이지 처리 | 유지 vs Organization으로 이관 |
| 7 | 기존 `/entity-settings/usage` 페이지 처리 | 유지 vs AI Config 섹션으로 통합 |

---

## 7. 우선순위 매트릭스

| 우선순위 | 섹션 | 기능 | 이유 |
|:--------:|------|------|------|
| **P0** | Section 1 | 법인 기본 정보 표시 + Entity Name 수정 | 핵심 요구사항, MASTER 즉시 필요 |
| **P0** | Section 2 | Units & Sections CRUD (dep_type 도입) | 조직 구조 안정화 |
| **P0** | Section 3 | Cells CRUD (독립 플랫 구조) | 조직 구조 안정화 |
| **P0** | Section 5 | AI 토큰 사용량 조회 표시 | 멀티테넌트 모니터링 |
| **P1** | Section 4 | 급여일 / 근무시간 기본 설정 | HR 모듈 기본값 연동 |
| **P1** | Section 5 | AI API Key + 한도 설정 | 멀티테넌트 과금 격리 |
| **P1** | Section 6 | Drive 연동 설정 | 법인별 파일 격리 |
| **P2** | Section 1 | 직인 이미지 업로드 | 전자 문서 날인 |
| **P2** | Section 2/3 | 드래그 앤 드롭 정렬 | 운영 편의성 |
