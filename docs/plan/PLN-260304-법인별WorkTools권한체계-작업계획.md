# 작업 계획서: 법인별 Work Tools/Modules 권한 체계 개선

| 항목 | 내용 |
|------|------|
| 작성일 | 2026-03-04 |
| 요구사항 분석서 | `docs/analysis/REQ-법인별WorkTools권한체계-20260304.md` |
| 브랜치 전략 | `main` → `feature/entity-menu-permission` |

---

## 1. 현행 시스템 구조 분석

### 1.1 권한 판정 흐름 (현행 `getMyMenus`)

```
① amb_menu_config.mcf_enabled = false  → 메뉴 숨김
② ADMIN_LEVEL 역할                     → 활성 메뉴 전체 허용
③ amb_user_menu_permissions            → 개별 오버라이드 (최우선)
④ amb_menu_unit_permissions            → 부서 단위 권한
⑤ amb_menu_permissions (역할별)        → 역할 기본 권한
⑥ amb_menu_cell_permissions            → Cell 필터 (그룹 설정 있는 경우)
```

### 1.2 관련 핵심 파일

| 역할 | 파일 경로 |
|------|----------|
| 권한 판정 서비스 | `apps/api/src/domain/settings/service/menu-permission.service.ts` |
| 법인 권한 서비스 | `apps/api/src/domain/entity-settings/service/entity-permission.service.ts` |
| 법인 권한 컨트롤러 | `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts` |
| 메뉴 설정 엔티티 | `apps/api/src/domain/settings/entity/menu-config.entity.ts` |
| 법인 서비스 | `apps/api/src/domain/hr/service/entity.service.ts` |
| 권한 설정 UI | `apps/web/src/domain/entity-settings/pages/EntityPermissionPage.tsx` |

### 1.3 TO-BE 권한 판정 흐름

```
① amb_entity_menu_config.emc_enabled = false  → 법인 단위 차단 [신규]
② amb_menu_config.mcf_enabled = false         → 시스템 단위 숨김 (기존)
③ ADMIN_LEVEL 역할                            → 전체 허용 (기존)
④ MASTER 역할 + WORK_TOOL/WORK_MODULE         → 법인 활성화 메뉴 전체 허용 [변경]
⑤ WORK_TOOL 카테고리 + USER_LEVEL             → 기본 허용 [신규]
⑥ amb_user_menu_permissions                   → 개별 오버라이드 (기존)
⑦ amb_menu_unit_permissions                   → 부서 단위 권한 (기존)
⑧ amb_menu_permissions (역할별)               → 역할 기본 권한 (기존)
⑨ amb_menu_cell_permissions                   → Cell 필터 (기존)
```

---

## 2. 작업 범위 및 단계별 계획

### Phase 1: DB 및 백엔드 기반 (신규 테이블 + 권한 판정 로직)

#### Step 1-1. `EntityMenuConfigEntity` 생성

**신규 파일**: `apps/api/src/domain/settings/entity/entity-menu-config.entity.ts`

```typescript
@Entity('amb_entity_menu_config')
@Unique(['entId', 'emcMenuCode'])
export class EntityMenuConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'emc_id' })
  emcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'emc_menu_code', length: 50 })
  emcMenuCode: string;

  @Column({ name: 'emc_enabled', type: 'boolean', default: true })
  emcEnabled: boolean;

  @Column({ name: 'emc_updated_by', type: 'uuid', nullable: true })
  emcUpdatedBy: string | null;

  @CreateDateColumn({ name: 'emc_created_at' })
  emcCreatedAt: Date;

  @UpdateDateColumn({ name: 'emc_updated_at' })
  emcUpdatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
```

**DB 테이블**: `amb_entity_menu_config`
- WORK_TOOL: 신규 법인 생성 시 전체 `emc_enabled = true`
- WORK_MODULE: 신규 법인 생성 시 전체 `emc_enabled = false`
- 기존 법인: 마이그레이션 시 현행 역할 권한 기준으로 초기화

---

#### Step 1-2. `EntityMenuConfigService` 생성

**신규 파일**: `apps/api/src/domain/settings/service/entity-menu-config.service.ts`

주요 메서드:
```typescript
// ADMIN용: 법인별 메뉴 활성화 현황 조회
getEntityMenuConfig(entId: string): Promise<EntityMenuConfigDto[]>

// ADMIN용: 법인별 메뉴 활성화 일괄 설정
setEntityMenuConfig(entId: string, dto: SetEntityMenuConfigRequest, user: UserPayload): Promise<void>

// 내부 사용: 법인의 활성화된 메뉴 코드 목록 조회 (getMyMenus에서 호출)
getEnabledMenuCodes(entId: string): Promise<Set<string>>

// 법인 생성 시 자동 초기화
initForEntity(entId: string, createdBy: string): Promise<void>
```

---

#### Step 1-3. `getMyMenus` 권한 판정 로직 변경

**변경 파일**: `apps/api/src/domain/settings/service/menu-permission.service.ts`

변경 요약:
- `getMyMenus(userId, role)` → `getMyMenus(userId, role, companyId?)` 시그니처 추가
- 판정 시작 시 `companyId`가 있으면 `getEnabledMenuCodes(companyId)` 호출
- USER_LEVEL + WORK_TOOL 카테고리: `mpm_accessible` 값과 무관하게 기본 `true` 처리
- MASTER 역할: `companyId`의 활성화 메뉴 전체 허용 처리

```typescript
// 변경 전
async getMyMenus(userId: string, role: string): Promise<MyMenuItemResponse[]>

// 변경 후
async getMyMenus(userId: string, role: string, companyId?: string): Promise<MyMenuItemResponse[]>
```

---

#### Step 1-4. `EntityMenuConfigController` 생성 (ADMIN용)

**신규 파일**: `apps/api/src/domain/settings/controller/entity-menu-config.controller.ts`

```
GET    /api/v1/settings/entities/:entId/menu-config      (ADMIN_LEVEL)
PUT    /api/v1/settings/entities/:entId/menu-config      (ADMIN_LEVEL)
POST   /api/v1/settings/entities/:entId/menu-config/init (SUPER_ADMIN, 수동 재초기화)
```

---

#### Step 1-5. 법인 생성 시 자동 초기화 연동

**변경 파일**: `apps/api/src/domain/hr/service/entity.service.ts`

법인 생성(`createEntity`) 후 `EntityMenuConfigService.initForEntity()` 호출 추가

---

#### Step 1-6. `settings.module.ts` 등록

**변경 파일**: `apps/api/src/domain/settings/settings.module.ts`

`EntityMenuConfigEntity`, `EntityMenuConfigService`, `EntityMenuConfigController` 등록

---

### Phase 2: MASTER Entity Settings — 역할별 권한 탭

#### Step 2-1. Entity Settings 역할별 권한 API

**변경 파일**: `apps/api/src/domain/entity-settings/service/entity-permission.service.ts`

신규 메서드:
```typescript
// 법인 내 역할별 권한 조회 (활성화된 메뉴 범위 내)
getRolePermissions(entityId: string, user: UserPayload): Promise<RolePermissionResponse>

// 법인 내 역할별 권한 저장
setRolePermissions(entityId: string, dto: SetRolePermissionsRequest, user: UserPayload): Promise<void>
```

**변경 파일**: `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts`

신규 엔드포인트:
```
GET  /api/v1/entity-settings/:entId/permissions/roles
PUT  /api/v1/entity-settings/:entId/permissions/roles
```

**변경 파일**: `apps/api/src/domain/entity-settings/service/entity-permission.service.ts`

기존 `getAvailableMenus()` 변경:
- 이전: WORK_TOOL + WORK_MODULE 전체 반환
- 이후: 해당 법인의 `amb_entity_menu_config`에서 활성화된 메뉴만 반환

---

#### Step 2-2. Request/Response DTO 추가

**신규 파일**: `apps/api/src/domain/entity-settings/dto/`

```typescript
// set-role-permissions.request.ts
export class SetRolePermissionsRequest {
  permissions: {
    role: 'MANAGER' | 'MEMBER' | 'VIEWER';
    menu_code: string;
    accessible: boolean;
  }[];
}

// entity-menu-config.request.ts
export class SetEntityMenuConfigRequest {
  menus: {
    menu_code: string;
    enabled: boolean;
  }[];
}
```

---

### Phase 3: 프론트엔드 — ADMIN Settings UI

#### Step 3-1. `EntityServiceConfigTab` 컴포넌트 생성

**신규 파일**: `apps/web/src/domain/settings/components/EntityServiceConfigTab.tsx`

- ADMIN_LEVEL만 접근 가능
- Work Tools 섹션 / Work Modules 섹션 나눔
- 섹션별 "모두 ON / 모두 OFF" 버튼
- 메뉴별 체크박스 토글
- 저장 시 `PUT /api/v1/settings/entities/:entId/menu-config` 호출

---

#### Step 3-2. Settings Entities 페이지에 탭 추가

**변경 파일**: `apps/web/src/domain/settings/` (entity 관련 설정 페이지)

- 법인 상세 뷰에 "서비스 설정" 탭 추가
- `EntityServiceConfigTab` 마운트

---

### Phase 4: 프론트엔드 — MASTER Entity Settings 역할별 탭

#### Step 4-1. `RolePermissionPanel` 컴포넌트 생성

**신규 파일**: `apps/web/src/domain/entity-settings/components/RolePermissionPanel.tsx`

구조:
```
MANAGER | MEMBER | VIEWER  (컬럼)

Work Tools (기본 허용, OFF만 가능)
  ┌────────────────┬────────┬────────┬────────┐
  │ TODO           │  ON*   │  ON*   │  ON*   │  * 기본값 시각 표시
  │ Meeting Notes  │  ON*   │  [ON]  │  [OFF] │
  └────────────────┴────────┴────────┴────────┘

Work Modules (기본 차단, ON만 가능)
  ┌────────────────┬────────┬────────┬────────┐
  │ KMS            │  [ON]  │  [OFF] │  [OFF] │
  │ Asset Mgmt     │  [ON]  │  [ON]  │  [OFF] │
  └────────────────┴────────┴────────┴────────┘
```

데이터 소스: `GET /api/v1/entity-settings/:entId/permissions/roles`
저장: `PUT /api/v1/entity-settings/:entId/permissions/roles`

---

#### Step 4-2. `EntityPermissionPage` 탭 추가

**변경 파일**: `apps/web/src/domain/entity-settings/pages/EntityPermissionPage.tsx`

```typescript
// 변경 전
type PermissionTab = 'unit' | 'cell' | 'individual';

// 변경 후
type PermissionTab = 'role' | 'unit' | 'cell' | 'individual';
```

탭 순서: `[역할별] [부서별] [그룹별] [개인별]`

---

#### Step 4-3. 기존 Unit/Cell/Individual 탭 메뉴 범위 필터

**변경 파일**:
- `apps/web/src/domain/entity-settings/components/UnitPermissionPanel.tsx`
- `apps/web/src/domain/entity-settings/components/CellPermissionPanel.tsx`
- `apps/web/src/domain/entity-settings/components/IndividualPermissionPanel.tsx`

변경 내용: 법인에서 활성화된 메뉴만 표시 (비활성화 메뉴 행 제거)

---

#### Step 4-4. 번역 파일 업데이트

**변경 파일**:
- `apps/web/src/locales/ko/entitySettings.json`
- `apps/web/src/locales/en/entitySettings.json`
- `apps/web/src/locales/vi/entitySettings.json`

추가 키:
```json
{
  "permissions": {
    "tabs": {
      "role": "역할별"
    },
    "roleSection": {
      "workTools": "Work Tools",
      "workModules": "Work Modules",
      "defaultOn": "기본 허용",
      "defaultOff": "기본 차단"
    }
  }
}
```

---

## 3. 변경 파일 전체 목록

### 백엔드 신규 파일 (4개)
| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/settings/entity/entity-menu-config.entity.ts` | 법인별 메뉴 활성화 엔티티 |
| `apps/api/src/domain/settings/service/entity-menu-config.service.ts` | 법인별 메뉴 활성화 서비스 |
| `apps/api/src/domain/settings/controller/entity-menu-config.controller.ts` | ADMIN용 법인 메뉴 설정 API |
| `apps/api/src/domain/entity-settings/dto/set-role-permissions.request.ts` | 역할별 권한 설정 DTO |

### 백엔드 변경 파일 (4개)
| 파일 | 변경 내용 |
|------|---------|
| `apps/api/src/domain/settings/service/menu-permission.service.ts` | `getMyMenus` 판정 로직: 법인 활성화 + WORK_TOOL 기본 허용 + MASTER 전체 허용 |
| `apps/api/src/domain/entity-settings/service/entity-permission.service.ts` | `getAvailableMenus` 필터 + `getRolePermissions` / `setRolePermissions` 추가 |
| `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts` | 역할별 권한 GET/PUT 엔드포인트 추가 |
| `apps/api/src/domain/hr/service/entity.service.ts` | 법인 생성 시 `initForEntity()` 호출 |
| `apps/api/src/domain/settings/settings.module.ts` | 신규 엔티티/서비스/컨트롤러 등록 |

### 프론트엔드 신규 파일 (2개)
| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/settings/components/EntityServiceConfigTab.tsx` | ADMIN용 법인 서비스 설정 탭 |
| `apps/web/src/domain/entity-settings/components/RolePermissionPanel.tsx` | MASTER용 역할별 권한 패널 |

### 프론트엔드 변경 파일 (6개)
| 파일 | 변경 내용 |
|------|---------|
| `apps/web/src/domain/entity-settings/pages/EntityPermissionPage.tsx` | 역할별 탭 추가 |
| `apps/web/src/domain/entity-settings/components/UnitPermissionPanel.tsx` | 활성화 메뉴만 표시 |
| `apps/web/src/domain/entity-settings/components/CellPermissionPanel.tsx` | 활성화 메뉴만 표시 |
| `apps/web/src/domain/entity-settings/components/IndividualPermissionPanel.tsx` | 활성화 메뉴만 표시 |
| `apps/web/src/domain/settings/` (entities 설정 페이지) | 서비스 설정 탭 추가 |
| `apps/web/src/locales/*/entitySettings.json` (3개) | 번역 키 추가 |

---

## 4. 사이드 임팩트 분석

### 4.1 기존 사용자 메뉴 변경 위험

| 시나리오 | 영향 | 대응 |
|---------|------|------|
| 기존 법인에 `amb_entity_menu_config` 레코드 없음 | `getMyMenus`에서 레코드 없으면 `emc_enabled = true`로 간주 → 기존과 동일 동작 | 결측 시 허용 폴백 처리 |
| WORK_TOOL 기본 허용 정책 적용 시, 기존에 MEMBER가 일부 work tool 차단된 경우 | 기존 차단 설정 오버라이드됨 | `amb_user_menu_permissions` 개별 차단 데이터 보존, 계층 6에서 여전히 차단 적용 |
| MASTER 역할의 전체 허용 정책 | 기존 MASTER가 특정 메뉴 차단 설정해 놓은 경우 | MASTER는 자신의 권한을 ENTITY_SETTINGS 설정으로 변경 불가 (MASTER 본인 예외는 허용) |

### 4.2 `getMyMenus` 성능 영향

- 현행: DB 쿼리 3~4개 (메뉴 설정 + 역할 권한 + Unit + 개별)
- 변경 후: DB 쿼리 4~5개 (+ `amb_entity_menu_config` 조회 1개 추가)
- 대응: `getEnabledMenuCodes(companyId)` 결과를 Redis 또는 인메모리 Map으로 5분 캐싱

### 4.3 `entity.service.ts` 법인 생성 변경

- `EntityMenuConfigService` 의존성 추가
- 법인 생성 트랜잭션 내에 `initForEntity()` 포함 → 실패 시 롤백 필요
- 기존 `entity-seed.service.ts` (시드 데이터 생성) 도 `initForEntity()` 호출 추가 필요

### 4.4 API 하위 호환성

| API | 변경 여부 | 이유 |
|-----|---------|------|
| `GET /api/v1/menus/my` | 시그니처 변경 없음 | `companyId`는 JWT 페이로드에서 자동 취득 |
| `GET /api/v1/entity-settings/:entId/permissions/available-menus` | 반환 목록 변경 | 법인 활성화 메뉴만 반환 → 기존 FULL 목록 반환 → 프론트엔드 대응 필요 |
| 기존 Unit/Cell/Individual 권한 API | 변경 없음 | 메뉴 필터는 프론트엔드에서 처리 |

### 4.5 Entity Settings 모듈 순환 의존성

`entity-settings.module.ts`에서 `EntityMenuConfigService` 사용 시 `SettingsModule` 순환 참조 가능성:
- 대응: `EntityMenuConfigService`를 별도 공유 모듈 또는 `EntityMenuConfigEntity`만 직접 주입

---

## 5. 데이터 마이그레이션 계획

### 5.1 기존 법인 초기화 (마이그레이션 스크립트)

```sql
-- 기존 법인에 대해 WORK_TOOL 전체 활성화 INSERT
INSERT INTO amb_entity_menu_config (ent_id, emc_menu_code, emc_enabled)
SELECT e.ent_id, mc.mcf_menu_code, true
FROM amb_hr_entities e
CROSS JOIN amb_menu_config mc
WHERE mc.mcf_category = 'WORK_TOOL'
  AND e.ent_level = 'SUBSIDIARY'
ON CONFLICT (ent_id, emc_menu_code) DO NOTHING;

-- 기존 법인에 대해 WORK_MODULE 전체 비활성화 INSERT
-- (단, 현재 역할 권한에서 접근 가능한 모듈은 활성화 유지)
INSERT INTO amb_entity_menu_config (ent_id, emc_menu_code, emc_enabled)
SELECT e.ent_id, mc.mcf_menu_code,
  CASE WHEN mp.mpm_accessible = true THEN true ELSE false END
FROM amb_hr_entities e
CROSS JOIN amb_menu_config mc
LEFT JOIN amb_menu_permissions mp
  ON mp.mpm_menu_code = mc.mcf_menu_code AND mp.mpm_role = 'MANAGER'
WHERE mc.mcf_category = 'WORK_MODULE'
  AND e.ent_level = 'SUBSIDIARY'
ON CONFLICT (ent_id, emc_menu_code) DO NOTHING;
```

---

## 6. 구현 순서 및 의존성

```
Step 1-1 (EntityMenuConfigEntity)
    │
    ▼
Step 1-2 (EntityMenuConfigService)
    │
    ├──▶ Step 1-3 (getMyMenus 변경)
    ├──▶ Step 1-4 (EntityMenuConfigController)
    └──▶ Step 1-5 (entity.service.ts 연동)
              │
              ▼
         Step 1-6 (settings.module.ts 등록)
              │
              ▼
         Step 2-1 (entity-settings 역할별 권한 API)
              │
              ▼
         Step 2-2 (DTO 추가)
              │
              ▼
         Step 3-1 (EntityServiceConfigTab)
              │
              ▼
         Step 3-2 (Settings 페이지 탭 추가)
              │
              ▼
         Step 4-1 (RolePermissionPanel)
              │
              ▼
         Step 4-2 (EntityPermissionPage 탭 추가)
              │
              ▼
         Step 4-3 (기존 탭 메뉴 필터)
              │
              ▼
         Step 4-4 (번역 파일)
```

---

## 7. 테스트 포인트

| # | 테스트 케이스 | 확인 항목 |
|---|-------------|----------|
| T1 | 법인 생성 시 `amb_entity_menu_config` 자동 생성 | WORK_TOOL 전체 ON, WORK_MODULE 전체 OFF |
| T2 | ADMIN이 법인A의 KMS 비활성화 | 법인A의 모든 사용자 사이드바에서 KMS 미표시 |
| T3 | WORK_TOOL 기본 허용 | MEMBER가 역할 권한 없이도 TODO 접근 가능 |
| T4 | MASTER 전체 허용 | MASTER는 활성화된 모든 메뉴 접근 |
| T5 | MASTER 역할별 권한 설정 | MEMBER에게 KMS OFF 설정 후 MEMBER 접근 차단 확인 |
| T6 | 법인 활성화 기반 Unit 권한 | 비활성화 메뉴는 Unit 권한 설정에서도 미표시 |
| T7 | 법인 없는 사용자(ADMIN_LEVEL) | `companyId = null` 시 법인별 필터 건너뜀 |
| T8 | 기존 개별 오버라이드 유지 | work tool 기본 허용이어도 개별 차단 설정 동작 |

---

*작성: Claude Code*
*참조 분석서: `REQ-법인별WorkTools권한체계-20260304.md`*
