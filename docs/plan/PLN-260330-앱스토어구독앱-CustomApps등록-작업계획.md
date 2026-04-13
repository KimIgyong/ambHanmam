# PLAN-앱스토어구독앱-CustomApps등록-작업계획-20260330

> 요구사항 분석서: `docs/analysis/REQ-앱스토어구독앱-CustomApps등록-20260330.md`

---

## 1. 시스템 개발 현황 분석

### 1.1 백엔드 현황

| 모듈 | 상태 | 비고 |
|------|------|------|
| **entity-settings** (Custom Apps) | ✅ 완성 | CRUD + JWT 발급 + 암호화 + 연결테스트 |
| **partner-app** (앱스토어) | ✅ 완성 | marketplace + install/uninstall + scope |
| **두 모듈 간 연동** | ❌ 없음 | 별도 모듈, import 관계 없음 |

- `EntityCustomAppService.create()` — DTO 기반 생성, 코드 중복 검증, 암호화 포함
- `EntityPartnerAppController.getInstalledApps()` — `amb_partner_app_installs` + `amb_partner_apps` JOIN 조회
- 두 모듈은 각각 독립 TypeORM Repository를 사용하며 **entity-settings.module에 partner-app Repository 미등록**

### 1.2 프론트엔드 현황

| 컴포넌트 | 상태 | 비고 |
|----------|------|------|
| `EntityCustomAppsPage` | ✅ 완성 | 카드그리드 + 생성/수정 모달 |
| `EntityCustomAppsTabPage` | ✅ 완성 | 3탭 (커스텀/공인/테스트) |
| Import UI | ❌ 없음 | 구현 대상 |

- 기존 모달에 Create/Edit 폼이 완성됨 → Import 시 동일 모달 재사용 가능 (pre-fill 방식)
- entity-settings API 클라이언트에 partner-app 관련 메서드 없음

### 1.3 DB 현황

| 테이블 | 핵심 컬럼 | 관계 |
|--------|-----------|------|
| `amb_entity_custom_apps` | eca_code(UNIQUE per ent_id) | 법인별 격리 |
| `amb_partner_apps` | pap_code(UNIQUE per ptn_id), pap_status | 파트너별 |
| `amb_partner_app_installs` | pap_id + ent_id(UNIQUE) | 법인별 설치 |

**누락된 연결 고리**: Custom App에서 원본 Partner App을 추적할 컬럼 없음

---

## 2. 단계별 구현 계획

### Phase 1: DB 스키마 변경 + 백엔드 API

**목표**: `amb_entity_custom_apps`에 출처 컬럼 추가, Import API 2개 신규

#### 2.1 DB 마이그레이션
- `amb_entity_custom_apps` 테이블에 `eca_source_pap_id` (UUID, nullable) 컬럼 추가
- 인덱스: `idx_entity_custom_apps_source_pap` (eca_source_pap_id)

#### 2.2 Entity 수정
- `EntityCustomAppEntity`에 `ecaSourcePapId` 컬럼 추가

#### 2.3 Module 수정
- `entity-settings.module.ts`에 `PartnerAppEntity`, `PartnerAppInstallEntity` TypeORM Repository 추가
- `partner-app.module.ts` `forwardRef` 불필요 — Repository 직접 등록으로 충분

#### 2.4 Service 신규 메서드
`EntityCustomAppService`에 2개 메서드 추가:

**`getImportableApps(entityId: string)`**
```
1. amb_partner_app_installs WHERE ent_id = entityId AND pai_is_active = true
2. JOIN amb_partner_apps (papStatus = 'PUBLISHED')
3. LEFT JOIN amb_entity_custom_apps (ent_id + eca_source_pap_id) 로 등록 여부 체크
4. 각 앱에 isRegistered: boolean 표시
5. 반환: { apps: [{ papId, papCode, papName, papUrl, papAuthMode, papOpenMode, papIcon, papDescription, isRegistered }] }
```

**`importFromStore(entityId: string, papId: string, overrides: Partial<CreateDto>, userId: string)`**
```
1. partner_app_installs에서 pap_id + ent_id 검증 (설치 여부)
2. partner_apps에서 앱 정보 조회 (PUBLISHED 검증)
3. eca_code 중복 체크 (pap_code → eca_code)
4. 매핑: pap_* → eca_* (overrides 우선)
   - auth_mode: 'oauth2' → 'jwt' 자동 변환
   - icon: null → 'AppWindow' 기본값
5. eca_source_pap_id = papId 설정
6. 기존 create() 로직 재사용 (EntityCustomAppEntity 생성)
7. 반환: 생성된 CustomApp
```

#### 2.5 Controller 신규 엔드포인트
`EntityCustomAppController`에 2개 추가:

| Method | Path | Guard | 설명 |
|--------|------|-------|------|
| `GET` | `/entity-settings/custom-apps/importable` | `@Auth()` + `OwnEntityGuard` | 가져오기 가능한 앱 목록 |
| `POST` | `/entity-settings/custom-apps/import/:papId` | `@Auth()` + `OwnEntityGuard` | 파트너앱 → Custom App 등록 |

**⚠️ 라우트 순서 주의**: `/importable`과 `/import/:papId`는 `/:id` 와일드카드보다 **앞에** 선언

#### 2.6 DTO 추가
`ImportCustomAppRequest`:
- `name?` (string)
- `url?` (string)
- `description?` (string)
- `icon?` (string)
- `auth_mode?` (jwt | none | api_key)
- `open_mode?` (iframe | new_tab)
- `allowed_roles?` (string[])
- `sort_order?` (number)

모든 필드 optional — 제공하면 Partner App 기본값 대신 오버라이드

#### 2.7 사이드 임팩트
- 기존 Custom Apps CRUD에 **영향 없음** (신규 메서드만 추가)
- `entity-settings.module`에 Repository 추가 — `partner-app.module`과 무관 (독립 Repository 주입)
- `toResponse()`에 `sourcePapId` 필드 추가 — 프론트엔드 기존 코드에 영향 없음 (무시)

---

### Phase 2: 프론트엔드 UI

**목표**: Import 버튼 + ImportFromStoreModal + API 연동

#### 2.1 API 서비스 메서드 추가
`entity-settings.service.ts`에 2개 추가:

```typescript
getImportableApps(entityId?: string)
  → GET /entity-settings/custom-apps/importable?entity_id=...

importFromStore(papId: string, dto: ImportCustomAppDto, entityId?: string)
  → POST /entity-settings/custom-apps/import/{papId}?entity_id=...
```

응답 타입:
```typescript
interface ImportableApp {
  papId: string;
  papCode: string;
  papName: string;
  papUrl: string;
  papAuthMode: string;
  papOpenMode: string;
  papIcon: string | null;
  papDescription: string | null;
  isRegistered: boolean;
}
```

#### 2.2 React Query 훅 추가
`useEntitySettings.ts`에:

```typescript
useImportableApps(entityId?: string)      // useQuery
useImportFromStore(entityId?: string)      // useMutation → customApps + myCustomApps 무효화
```

#### 2.3 ImportFromStoreModal 컴포넌트 신규
`apps/web/src/domain/entity-settings/components/ImportFromStoreModal.tsx`

**UI 구성**:
```
┌─ Modal ────────────────────────────────┐
│ 📥 앱스토어에서 가져오기                  │
│                                        │
│ ┌─ 앱 카드 ──────────────────────────┐ │
│ │ 🔷 앱이름    [등록됨 / 등록 버튼]   │ │
│ │ URL: https://...                   │ │
│ │ 인증: jwt | 오픈: iframe           │ │
│ └────────────────────────────────────┘ │
│ ┌─ 앱 카드 ──────────────────────────┐ │
│ │ 🔷 앱이름    [등록 버튼]            │ │
│ │ URL: https://...                   │ │
│ │ 인증: jwt | 오픈: new_tab          │ │
│ └────────────────────────────────────┘ │
│                                        │
│ (구독 앱이 없으면 안내 메시지)           │
│                          [닫기]         │
└────────────────────────────────────────┘
```

**등록 버튼 클릭 시**: 기존 `EntityCustomAppsPage`의 Create 모달 오픈 + Partner App 정보로 폼 pre-fill

#### 2.4 EntityCustomAppsPage 수정
- 헤더에 "앱스토어에서 가져오기" 버튼 추가 (기존 "앱 추가" 버튼 옆)
- `ImportFromStoreModal` 열기/닫기 상태 관리
- Import 모달에서 "등록" → Create 모달로 전환 시 pre-fill 데이터 전달

#### 2.5 사이드 임팩트
- 기존 Create/Edit 모달 로직 **변경 없음** — pre-fill은 초기 상태 설정만 사용
- Tab 페이지에 **변경 없음** — Import는 커스텀앱 탭 내부 기능

---

### Phase 3: i18n + 빌드 검증

**목표**: 3개 언어 번역 키 추가 + 빌드 통과 확인

#### 3.1 번역 키 추가
`entitySettings:customApps.*` 네임스페이스에:

| 키 | ko | en | vi |
|----|----|----|-----|
| `importFromStore` | 앱스토어에서 가져오기 | Import from Store | Nhập từ cửa hàng |
| `importTitle` | 구독 앱 가져오기 | Import Subscribed Apps | Nhập ứng dụng đã đăng ký |
| `registered` | 등록됨 | Registered | Đã đăng ký |
| `register` | 등록 | Register | Đăng ký |
| `noSubscribedApps` | 구독 중인 앱이 없습니다. 앱스토어에서 앱을 설치해 주세요. | No subscribed apps. Please install apps from the App Store. | Không có ứng dụng đã đăng ký. Vui lòng cài đặt ứng dụng từ cửa hàng. |
| `importSuccess` | 앱이 등록되었습니다 | App imported successfully | Đã nhập ứng dụng thành công |
| `alreadyRegistered` | 이미 등록된 앱입니다 | App already registered | Ứng dụng đã được đăng ký |

#### 3.2 빌드 검증
```bash
npm run -w @amb/api build
npm run -w @amb/web build
```

---

## 3. 변경 파일 목록

### 신규 파일

| 파일 경로 | 설명 |
|-----------|------|
| `apps/web/src/domain/entity-settings/components/ImportFromStoreModal.tsx` | Import 모달 컴포넌트 |
| `sql/migration_custom_app_source.sql` | DB 마이그레이션 SQL |

### 수정 파일

| 파일 경로 | 변경 내용 |
|-----------|-----------|
| `apps/api/src/domain/entity-settings/entity/entity-custom-app.entity.ts` | `ecaSourcePapId` 컬럼 추가 |
| `apps/api/src/domain/entity-settings/entity-settings.module.ts` | `PartnerAppEntity`, `PartnerAppInstallEntity` Repository 등록 |
| `apps/api/src/domain/entity-settings/service/entity-custom-app.service.ts` | `getImportableApps()`, `importFromStore()` 메서드 추가 |
| `apps/api/src/domain/entity-settings/controller/entity-custom-app.controller.ts` | `GET /importable`, `POST /import/:papId` 엔드포인트 추가 |
| `apps/api/src/domain/entity-settings/dto/custom-app.dto.ts` | `ImportCustomAppRequest` DTO 추가 |
| `apps/web/src/domain/entity-settings/service/entity-settings.service.ts` | `getImportableApps()`, `importFromStore()` 메서드 추가, `ImportableApp` 타입 |
| `apps/web/src/domain/entity-settings/hooks/useEntitySettings.ts` | `useImportableApps()`, `useImportFromStore()` 훅 추가 |
| `apps/web/src/domain/entity-settings/pages/EntityCustomAppsPage.tsx` | Import 버튼 + ImportFromStoreModal 연동 |
| `apps/web/public/locales/ko/entitySettings.json` | Import 관련 번역 키 추가 |
| `apps/web/public/locales/en/entitySettings.json` | Import 관련 번역 키 추가 |
| `apps/web/public/locales/vi/entitySettings.json` | Import 관련 번역 키 추가 |

---

## 4. 사이드 임팩트 분석

### 4.1 영향 없는 기능

| 기능 | 영향도 | 이유 |
|------|--------|------|
| 기존 Custom Apps CRUD | ⚪ 없음 | 신규 메서드/엔드포인트만 추가 |
| 사이드바 앱 표시 | ⚪ 없음 | `findMyApps()` 로직 변경 없음 |
| Partner App Install/Uninstall | ⚪ 없음 | partner-app 모듈 코드 변경 없음 |
| 앱스토어 iframe | ⚪ 없음 | TabPage 코드 변경 없음 |
| JWT 토큰 발급 | ⚪ 없음 | `generateAppToken()` 변경 없음 |

### 4.2 주의 사항

| 항목 | 리스크 | 대응 |
|------|--------|------|
| `entity-settings.module`에 외부 엔티티 Repository 추가 | TypeORM autoLoadEntities로 이미 로드됨, 충돌 없음 | Repository 직접 InjectRepository 사용 |
| 라우트 순서 (`/importable` vs `/:id`) | `:id` 패턴이 `importable` 문자열 캐치할 수 있음 | `/importable`을 `/:id` 엔드포인트 **위에** 선언 |
| `eca_source_pap_id` 컬럼 추가 | nullable이므로 기존 데이터 영향 없음 | ALTER TABLE ADD COLUMN ... NULL |
| `toResponse()`에 `sourcePapId` 추가 | 프론트에서 미사용 필드 — 무해 | 기존 코드 호환성 유지 |

---

## 5. DB 마이그레이션

### 스테이징/프로덕션 수동 SQL 필수

```sql
-- Migration: Custom App Source Partner App ID (2026-03-30)
-- Run BEFORE deploying code

ALTER TABLE amb_entity_custom_apps 
  ADD COLUMN IF NOT EXISTS eca_source_pap_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_entity_custom_apps_source_pap 
  ON amb_entity_custom_apps(eca_source_pap_id);

COMMENT ON COLUMN amb_entity_custom_apps.eca_source_pap_id 
  IS 'Source partner app ID from amb_partner_apps (for import tracking)';
```

**실행 명령**:
```bash
# 스테이징
cat sql/migration_custom_app_source.sql | ssh amb-staging "docker exec -i amb-postgres-staging psql -U amb_user -d db_amb"
```

---

## 6. 구현 순서 요약

```
Phase 1 (백엔드): DB ALTER → Entity 수정 → Module 수정 → Service 메서드 → Controller 엔드포인트 → DTO
   ↓ npm run -w @amb/api build ✓
Phase 2 (프론트): API 서비스 → Hooks → ImportFromStoreModal → EntityCustomAppsPage 수정
   ↓ npm run -w @amb/web build ✓
Phase 3 (마무리): i18n 3개 언어 → 최종 빌드 검증
```
