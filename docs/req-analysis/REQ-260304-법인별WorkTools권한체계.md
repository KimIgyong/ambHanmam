# 요구사항 분석서: 법인별 Work Tools/Modules 권한 체계 개선

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-04 |
| 분석 범위 | 권한 체계 전반 (ADMIN_LEVEL 법인별 설정 + USER_LEVEL 접근권한 관리) |
| 관련 문서 | `REQ-ADMIN_USER레벨구분강화-MASTER역할추가-20260301.md` |
| 관련 문서 | `REQ-MenuPermissions-분석서-20260222.md` |

---

## 1. 요구사항 원문

> **ADMIN_LEVEL (SUPER_ADMIN, ADMIN)**
> - 설정에서 각 법인별 work tools 접근 권한 설정
> - 설정에서 각 법인별 work modules 접근 권한 설정
>
> **USER_LEVEL (MASTER, MANAGER, MEMBER, VIEWER)**
> - MASTER 등급: 소속 법인 Entity의 접근이 허가된 work tools과 work modules의 접근권한 관리
> - work tools: 기본적으로 모든 사용자에게 접근 및 사용이 허용
> - work modules: MASTER는 모든 권한, 이하 등급은 등급별/Unit별/Cell별로 접근 권한 설정 가능

---

## 2. AS-IS 현황 분석

### 2.1 현행 권한 구조 (3계층)

```
[1계층] 메뉴 설정 (시스템 전역)
└── amb_menu_config — mcf_enabled (시스템 단위 메뉴 ON/OFF)
    ※ 법인별 ON/OFF 없음

[2계층] 역할별 권한 (글로벌 역할 단위)
└── amb_menu_permissions — (mpm_role + mpm_menu_code) 조합으로 접근 허용 여부
    ※ 법인 컬럼 없음 → 모든 법인에 동일한 역할 권한 적용

[3계층] 법인별 개별 권한 (법인 스코프)
├── amb_menu_unit_permissions  — (법인 + 부서) 단위 메뉴 권한
├── amb_menu_cell_permissions  — (법인 + Cell/그룹) 단위 메뉴 권한
└── amb_user_menu_permissions  — 개별 사용자 단위 메뉴 오버라이드
    ※ MASTER가 EntityPermissionPage에서 Unit/Cell/Individual 탭으로 관리
```

### 2.2 현행 역할-레벨 구조

```
ADMIN_LEVEL (HQ, ROOT 소속)
├── SUPER_ADMIN — 시스템 최고 관리자, 모든 권한
└── ADMIN       — 운영 관리자

USER_LEVEL (하위 법인, SUBSIDIARY 소속)
├── MASTER  — 법인 관리자 (소속 법인 멤버 초대/권한 설정)
├── MANAGER — 부서/팀 관리자
├── MEMBER  — 일반 직원
└── VIEWER  — 읽기 전용
```

### 2.3 현행 메뉴 카테고리

| 카테고리 | 코드 예시 | 접근 주체 |
|---------|----------|----------|
| **WORK_TOOL** | TODO, MEETING_NOTES, DOCUMENTS, ATTENDANCE, NOTICES, ISSUES, PROJECT_MANAGEMENT, CALENDAR, MAIL, AMOEBA_TALK | 모든 역할 |
| **WORK_MODULE** | ACCOUNTING, HR, BILLING, KMS, ASSET_MANAGEMENT, DEPARTMENTS, WORK_ITEMS | 역할별 차등 |
| **CHAT** | CHAT_MANAGEMENT, CHAT_ACCOUNTING 등 (9개) | 모든 역할 |
| **ADMIN_MODULE** | AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT | ADMIN_LEVEL 전용 |
| **SETTINGS** | SETTINGS_MEMBERS, SETTINGS_PERMISSIONS 등 | ADMIN_LEVEL 전용 |
| **ENTITY_SETTINGS** | ENTITY_MEMBERS, ENTITY_PERMISSIONS 등 | MASTER 전용 |

### 2.4 현행 시스템의 문제점

| # | 문제 | 현황 | 요구사항과의 갭 |
|---|------|------|----------------|
| **P1** | **법인별 work tools/modules 활성화 설정 불가** | `amb_menu_config`는 시스템 전역 수준만 지원 | ADMIN_LEVEL이 법인별로 ON/OFF 불가 |
| **P2** | **역할 권한이 법인 구분 없이 전역 적용** | `amb_menu_permissions`에 `ent_id` 없음 | 법인A는 ACCOUNTING 허용, 법인B는 차단 불가 |
| **P3** | **work tools 기본 허용 정책 미정의** | 역할별 `mpm_accessible` 값으로만 결정 | work tools는 기본 허용이라는 정책적 보장 없음 |
| **P4** | **MASTER 권한 관리 범위 불명확** | EntityPermissionPage에 Unit/Cell/Individual 탭이 있으나 work tools/modules 구분 없음 | work modules만 등급별/Unit별/Cell별 권한 적용, work tools는 기본 허용 + 예외 차단 구조 미구현 |
| **P5** | **MASTER가 관리할 수 있는 메뉴 범위 제한 없음** | 모든 메뉴 코드에 대해 Unit/Cell/Individual 권한 설정 가능 | ADMIN_LEVEL이 법인에 허가한 메뉴만 MASTER가 하위 관리 가능해야 함 |
| **P6** | **권한 판정 로직이 복잡하고 법인 컨텍스트 미반영** | `findByUser()`가 역할→Unit→Cell→개별 순서로 판정하나, 법인별 활성화 여부 단계 없음 | 법인 단위 활성화 → 역할 → Unit/Cell → 개별 순서로 판정해야 함 |

---

## 3. TO-BE 요구사항

### 3.1 역할별 권한 체계 정리

#### ADMIN_LEVEL

| 역할 | 데이터 범위 | Work Tools | Work Modules | Admin Module | 법인별 설정 |
|------|-----------|-----------|-------------|-------------|------------|
| **SUPER_ADMIN** | ALL | 전체 접근 | 전체 접근 | 전체 접근 | 법인별 활성화 설정 O |
| **ADMIN** | ALL | 전체 접근 | 전체 접근 | 전체 접근 | 법인별 활성화 설정 O |

#### USER_LEVEL

| 역할 | 데이터 범위 | Work Tools | Work Modules | Admin Module |
|------|-----------|-----------|-------------|-------------|
| **MASTER** | OWN_ORG | **기본 전체 허용** | **전체 허용** (ADMIN이 법인에 활성화한 것 중) | 차단 |
| **MANAGER** | OWN_ORG | **기본 전체 허용** | 등급별/Unit별/Cell별 권한에 따름 | 차단 |
| **MEMBER** | OWN_ORG | **기본 전체 허용** | 등급별/Unit별/Cell별 권한에 따름 | 차단 |
| **VIEWER** | OWN_ORG | **기본 읽기 허용** | 등급별/Unit별/Cell별 권한에 따름 | 차단 |

### 3.2 TO-BE 권한 판정 4계층 구조

```
[계층 0] 법인별 메뉴 활성화 (ADMIN_LEVEL이 법인별로 설정)  ← 신규
└── amb_entity_menu_config (ent_id + menu_code + enabled)
    → 비활성화 시: 해당 법인의 모든 사용자 접근 차단 (하위 계층 무관)

[계층 1] 카테고리 기반 기본 정책  ← 신규
├── WORK_TOOL: 기본 허용 (MASTER 이하 모든 사용자)
└── WORK_MODULE: 기본 차단 → 하위 계층에서 허용 부여

[계층 2] 역할별 권한 (현행 유지, MASTER 추가)
└── amb_menu_permissions (mpm_role + mpm_menu_code)

[계층 3] Unit/Cell 그룹 권한 (현행 유지)
├── amb_menu_unit_permissions (법인 + 부서 단위)
└── amb_menu_cell_permissions (법인 + Cell 단위)

[계층 4] 개별 사용자 오버라이드 (현행 유지)
└── amb_user_menu_permissions (개별 사용자 예외)
```

### 3.3 ADMIN_LEVEL의 법인별 Work Tools/Modules 설정

```
Settings → 법인 관리 → 법인 선택 → "서비스 설정" 탭
┌──────────────────────────────────────────────────────────┐
│ 법인: VIETSOFT Co., Ltd                                  │
├──────────────────────────────────────────────────────────┤
│ Work Tools                           [모두 ON] [모두 OFF] │
│  [✓] TODO           [✓] Meeting Notes                    │
│  [✓] Documents      [✓] Calendar                         │
│  [✓] Attendance     [✓] Notices                          │
│  [✓] Issues         [✓] Amoeba Talk                      │
│  [✓] Mail           [✓] Project Management               │
│                                                          │
│ Work Modules                         [모두 ON] [모두 OFF] │
│  [✓] KMS            [ ] Accounting                       │
│  [ ] HR             [ ] Billing                          │
│  [✓] Asset Mgmt     [ ] Departments                      │
│  [ ] Work Items                                          │
│                                                          │
│                                     [저장]               │
└──────────────────────────────────────────────────────────┘
```

- **work tools**: 기본값 모두 ON (법인 등록 시 자동 활성화)
- **work modules**: 기본값 모두 OFF (ADMIN이 명시적으로 활성화해야 사용 가능)

### 3.4 MASTER의 법인 접근권한 관리

MASTER가 관리할 수 있는 범위: **ADMIN이 법인에 활성화한 메뉴만**

```
Entity Settings → 접근 권한
┌──────────────────────────────────────────────────────────┐
│ VIETSOFT Co., Ltd — 접근 권한 설정                        │
├───────────┬──────────────────────────────────────────────┤
│ [역할별]  │ [부서별]  │ [그룹별]  │ [개인별]               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Work Tools  (기본: 모든 사용자 허용, 예외 차단만 가능)        │
│  ┌───────────────┬────────┬────────┬────────┐            │
│  │ 메뉴          │MANAGER │MEMBER  │VIEWER  │            │
│  ├───────────────┼────────┼────────┼────────┤            │
│  │ TODO          │  ✓ 기본 │  ✓ 기본 │  ✓ 기본 │           │
│  │ Meeting Notes │  ✓ 기본 │  ✓ 기본 │  ✓ 기본 │           │
│  │ Mail          │  [ON]  │  [OFF] │  [OFF] │            │
│  └───────────────┴────────┴────────┴────────┘            │
│                                                          │
│ Work Modules (기본: 차단, 명시적 허용 필요)                  │
│  ┌───────────────┬────────┬────────┬────────┐            │
│  │ 메뉴          │MANAGER │MEMBER  │VIEWER  │            │
│  ├───────────────┼────────┼────────┼────────┤            │
│  │ KMS           │  [ON]  │  [ON]  │  [OFF] │            │
│  │ Asset Mgmt    │  [ON]  │  [OFF] │  [OFF] │            │
│  └───────────────┴────────┴────────┴────────┘            │
│                                                          │
│ MASTER 본인: 활성화된 모든 Work Tools + Work Modules 전체 허용 │
│                                                          │
│                                     [저장]               │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 갭 분석 (Gap Analysis)

### 4.1 신규 DB 테이블

#### 4.1.1 법인별 메뉴 활성화 설정 (신규)

```sql
CREATE TABLE amb_entity_menu_config (
  emc_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id          UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  emc_menu_code   VARCHAR(50) NOT NULL,
  emc_enabled     BOOLEAN NOT NULL DEFAULT true,
  emc_updated_by  UUID REFERENCES amb_users(usr_id),
  emc_created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emc_updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_emc_ent_menu UNIQUE (ent_id, emc_menu_code)
);

CREATE INDEX idx_emc_ent ON amb_entity_menu_config(ent_id);
```

- **초기화**: 법인 생성 시 WORK_TOOL 전체 활성화, WORK_MODULE 전체 비활성화로 자동 INSERT
- **ADMIN_LEVEL이** Settings에서 법인별 ON/OFF 관리
- **MASTER는** 이 테이블을 수정할 수 없음 (읽기만 가능)

#### 4.1.2 기존 테이블 변경 불필요

| 테이블 | 변경 여부 | 이유 |
|--------|---------|------|
| `amb_menu_permissions` | 변경 없음 | 역할별 글로벌 권한으로 유지 |
| `amb_menu_unit_permissions` | 변경 없음 | 부서별 권한으로 유지 |
| `amb_menu_cell_permissions` | 변경 없음 | 셀별 권한으로 유지 |
| `amb_user_menu_permissions` | 변경 없음 | 개별 사용자 오버라이드 유지 |

### 4.2 백엔드 변경

#### 4.2.1 권한 판정 로직 변경 (핵심)

**파일**: `apps/api/src/domain/settings/service/menu-permission.service.ts`

현행 `findByUser()` 판정 흐름:
```
[역할 기본 권한] → [Unit 권한] → [Cell 권한] → [개별 권한]
```

TO-BE `findByUser()` 판정 흐름:
```
[법인별 활성화] → [카테고리 기본 정책] → [역할 기본 권한] → [Unit/Cell 권한] → [개별 권한]
```

변경 규칙:
1. `amb_entity_menu_config.emc_enabled = false` → 즉시 `accessible: false` 반환
2. WORK_TOOL 카테고리 + USER_LEVEL: 역할 권한과 무관하게 **기본 true** (오버라이드로만 차단)
3. WORK_MODULE 카테고리 + USER_LEVEL (MASTER 제외): 역할 권한 → Unit/Cell → 개별 순서로 판정
4. MASTER: 법인에서 활성화된 WORK_TOOL + WORK_MODULE 전체 허용

#### 4.2.2 신규 API — ADMIN_LEVEL 법인별 메뉴 설정

```
GET    /api/v1/admin/entities/:entId/menu-config        # 법인 메뉴 활성화 현황 조회
PUT    /api/v1/admin/entities/:entId/menu-config        # 법인 메뉴 활성화 일괄 설정
PATCH  /api/v1/admin/entities/:entId/menu-config/:code  # 단일 메뉴 활성화 토글
```

- **접근 제한**: `@AdminOnly()` (ADMIN_LEVEL만)
- **초기화 API**: `POST /api/v1/admin/entities/:entId/menu-config/init` (법인 생성 시 자동 호출)

#### 4.2.3 MASTER용 법인 메뉴 설정 조회 API

```
GET /api/v1/entity-settings/:entId/available-menus
# ADMIN이 법인에 활성화한 메뉴 목록 조회
# MASTER가 권한 관리 시 표시할 메뉴 목록 기준으로 사용
```

#### 4.2.4 MASTER의 역할별 권한 설정 API (신규)

현행 EntityPermission API는 Unit/Cell/Individual 단위만 지원. MASTER가 **역할 단위** 권한도 설정할 수 있어야 함:

```
GET  /api/v1/entity-settings/:entId/permissions/roles          # 법인 내 역할별 권한 조회
PUT  /api/v1/entity-settings/:entId/permissions/roles          # 역할별 권한 일괄 저장
```

- 설정 범위: 법인에서 활성화된 WORK_TOOL + WORK_MODULE만
- 대상 역할: MANAGER, MEMBER, VIEWER (MASTER 본인 설정 불가)
- 저장소: `amb_menu_permissions` (기존) 또는 법인 스코프 별도 테이블 검토 필요

> **⚠️ 설계 결정 필요**: 역할별 권한을 글로벌(`amb_menu_permissions`)에서 법인별로 분리할지 여부
> - **옵션 A**: 글로벌 역할 권한 유지, 법인별 예외만 `amb_entity_role_permissions` 별도 관리
> - **옵션 B**: 법인별 역할 권한 테이블 신규 생성 (`amb_entity_menu_permissions`)
> - **권장**: 옵션 A (기존 구조 최대 활용, 법인별 예외만 추가)

### 4.3 프론트엔드 변경

#### 4.3.1 ADMIN_LEVEL Settings — 법인 서비스 설정 탭 (신규)

**경로**: `/settings/entities/:entId` 또는 Settings > Entities > 법인 선택 > "서비스 설정" 탭

| 컴포넌트 | 파일 | 내용 |
|---------|------|------|
| `EntityServiceConfigTab` | `settings/components/EntityServiceConfigTab.tsx` | Work Tools / Work Modules 체크박스 매트릭스 |
| `EntityServiceConfigPage` | `settings/pages/EntityServiceConfigPage.tsx` | 탭 컨테이너 |

#### 4.3.2 MASTER — Entity Settings 권한 탭 개선

**파일**: `entity-settings/pages/EntityPermissionPage.tsx`

현행 탭 구조:
```
[부서별] [그룹별] [개인별]
```

TO-BE 탭 구조:
```
[역할별] [부서별] [그룹별] [개인별]
```

- **역할별 탭 (신규)**: MANAGER/MEMBER/VIEWER 역할별 WORK_TOOL + WORK_MODULE 접근 여부 설정
  - Work Tools: 기본 ON (회색 체크), 개별 OFF 가능
  - Work Modules: 기본 OFF, 개별 ON 가능
- 표시 메뉴: ADMIN이 법인에 활성화한 메뉴만 표시

#### 4.3.3 사이드바 메뉴 필터링 로직 변경

**파일**: `web/src/lib/menu.store.ts` 또는 관련 훅

현행: 역할 기반 `accessible` 값만으로 사이드바 메뉴 표시
TO-BE: 법인별 활성화 여부 → 역할/Unit/Cell/개별 권한 순서로 필터링

---

## 5. 권한 판정 시나리오

### 시나리오 1: ADMIN이 법인A에 KMS 비활성화

```
법인A의 MANAGER가 KMS 접근 시도
→ [계층 0] amb_entity_menu_config: 법인A, KMS, enabled=false
→ 즉시 차단 (하위 계층 확인 없음)
→ 사이드바에 KMS 메뉴 미표시
```

### 시나리오 2: work tools 기본 허용 정책

```
법인B의 MEMBER가 TODO 접근 시도
→ [계층 0] amb_entity_menu_config: 법인B, TODO, enabled=true
→ [계층 1] 카테고리: WORK_TOOL + USER_LEVEL → 기본 허용
→ [계층 4] amb_user_menu_permissions: 개별 차단 설정 없음
→ 접근 허용
```

### 시나리오 3: MASTER의 work module 권한 관리

```
법인C의 MASTER가 ACCOUNTING을 MANAGER에게만 허용 설정
→ amb_menu_permissions: MANAGER + ACCOUNTING + accessible=true (MASTER가 설정)
→ amb_menu_permissions: MEMBER + ACCOUNTING + accessible=false

법인C의 MEMBER가 ACCOUNTING 접근 시도
→ [계층 0] 법인C, ACCOUNTING, enabled=true (ADMIN이 활성화)
→ [계층 2] amb_menu_permissions: MEMBER + ACCOUNTING = false
→ 차단
```

### 시나리오 4: MASTER 본인 접근

```
법인C의 MASTER가 활성화된 모든 메뉴 접근
→ [계층 0] 법인C 활성화 메뉴 목록 조회
→ MASTER 역할: 활성화된 모든 WORK_TOOL + WORK_MODULE 전체 허용 (역할 권한 설정과 무관)
```

### 시나리오 5: Unit 단위 권한 (work modules)

```
법인D의 개발부서(Unit)의 MEMBER가 ASSET_MANAGEMENT 접근 시도
→ [계층 0] 활성화 여부 확인
→ [계층 2] 역할 권한: MEMBER + ASSET_MANAGEMENT = false (기본 차단)
→ [계층 3] Unit 권한: 개발부서 + ASSET_MANAGEMENT = true (MASTER가 부서별 허용 설정)
→ 접근 허용
```

---

## 6. 사용자 플로우

### 6.1 ADMIN이 법인별 Work Tools/Modules 설정

```
ADMIN 로그인
  └─ Settings → Entities → 법인 목록
       └─ 법인 선택 → "서비스 설정" 탭
            ├─ Work Tools 섹션
            │    ├─ 전체 ON/OFF 토글
            │    └─ 메뉴별 체크박스 (기본값: 모두 ON)
            ├─ Work Modules 섹션
            │    ├─ 전체 ON/OFF 토글
            │    └─ 메뉴별 체크박스 (기본값: 모두 OFF)
            └─ [저장] → 즉시 반영 (해당 법인 사용자 메뉴 변경)
```

### 6.2 MASTER가 역할별/부서별 권한 설정

```
MASTER 로그인
  └─ Entity Settings → 접근 권한
       ├─ [역할별] 탭
       │    ├─ ADMIN이 활성화한 메뉴만 표시
       │    ├─ Work Tools 섹션 (기본 ON, OFF만 설정 가능)
       │    ├─ Work Modules 섹션 (기본 OFF, ON 설정 가능)
       │    └─ 역할 컬럼: MANAGER / MEMBER / VIEWER
       ├─ [부서별] 탭 (현행 유지)
       ├─ [그룹별] 탭 (현행 유지)
       └─ [개인별] 탭 (현행 유지)
```

---

## 7. 기술 제약사항

| 제약 | 내용 |
|------|------|
| **하위 호환성** | 기존 `amb_menu_permissions` 글로벌 역할 권한 데이터 유지 필요 |
| **성능** | `findByUser()` 호출 시 법인별 활성화 테이블 추가 조회 → 캐시 전략 필요 (5분 TTL) |
| **법인 초기화** | 법인 생성 시 `amb_entity_menu_config` 자동 생성 (HrEntityService 연동) |
| **MASTER 제한** | MASTER는 `amb_entity_menu_config` 수정 불가 (ADMIN_LEVEL 전용) |
| **역할별 권한 스코프** | 글로벌 역할 권한 vs 법인별 역할 권한 분리 여부 결정 필요 (설계 결정 사항) |

---

## 8. 구현 우선순위

### Phase 1: DB + 권한 판정 로직 (기반)
1. `amb_entity_menu_config` 테이블 생성
2. 법인 생성 시 자동 초기화 로직 (WORK_TOOL 전체 ON, WORK_MODULE 전체 OFF)
3. `findByUser()` 권한 판정에 계층 0 (법인별 활성화) 추가
4. WORK_TOOL 카테고리 기본 허용 정책 로직 추가

### Phase 2: ADMIN_LEVEL Settings UI
5. ADMIN용 법인별 메뉴 활성화 API (GET/PUT)
6. `EntityServiceConfigTab` 컴포넌트 개발
7. Settings > Entities 페이지에 탭 추가

### Phase 3: MASTER Entity Settings 개선
8. MASTER용 법인 활성화 메뉴 조회 API
9. MASTER 역할별 권한 설정 API (활성화된 메뉴 범위 내)
10. EntityPermissionPage에 역할별 탭 추가
11. 기존 부서별/그룹별/개인별 탭에서 활성화된 메뉴만 표시

### Phase 4: 사이드바 및 UX
12. 사이드바 메뉴 필터링에 법인별 활성화 조건 추가
13. 비활성화 메뉴 접근 시 안내 메시지 처리

---

## 9. 리스크

| # | 리스크 | 심각도 | 확률 | 대응 |
|---|--------|:------:|:----:|------|
| 1 | `findByUser()` 성능 저하 (계층 추가) | 🔴 | 중간 | Redis 캐시 도입 또는 캐시 TTL 조정 |
| 2 | 글로벌 역할 권한과 법인별 역할 권한 충돌 | 🔴 | 중간 | 설계 결정 먼저 (옵션 A vs B) |
| 3 | 법인 생성 시 자동 초기화 실패로 메뉴 미표시 | 🟡 | 낮음 | 트랜잭션 처리 + 수동 초기화 API 제공 |
| 4 | 기존 사용자 work modules 접근 갑작스러운 차단 | 🟡 | 높음 | 기존 법인은 현재 역할 권한 기준으로 초기화 |
| 5 | MASTER가 work tools를 전부 차단하는 남용 | 🟠 | 낮음 | UX 단에서 경고, 최소 1개 이상 허용 강제 |

---

*작성: Claude Code (요구사항 분석)*
*참조: 현행 코드베이스 전체 분석 (2026-03-04)*
