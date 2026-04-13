# REQ-앱스토어구독앱-CustomApps등록-20260330

## 1. 요구사항 요약 (Requirement Summary)

**제목**: 앱스토어 구독 완료(ACTIVE) 앱 → AMA Custom Apps 등록 기능

**배경**: 
- 앱스토어(`stg-apps.amoeba.site`)에서 법인(Entity)이 앱 구독을 완료(ACTIVE 상태)하면, 해당 앱을 AMA(`stg-ama.amoeba.site`)의 **Entity Settings > Custom Apps**에 등록하여 사이드바 메뉴에서 직접 접근할 수 있어야 한다.
- 현재 두 시스템(`amb_partner_app_installs` ↔ `amb_entity_custom_apps`)이 독립적으로 작동하며 연동 브릿지가 없다.

**목표**: 앱스토어 구독 앱을 Custom Apps에 원클릭으로 가져오는(import) 기능 구현

---

## 2. AS-IS 현황 분석

### 2.1 시스템 A: 앱스토어 구독 시스템 (Partner App Install)

| 항목 | 내용 |
|------|------|
| **UI** | EntityCustomAppsTabPage → "테스트앱스토어" 탭 → iframe (`stg-apps.amoeba.site`) |
| **테이블** | `amb_partner_app_installs` (pai_id, pap_id, ent_id, pai_is_active, pai_approved_scopes) |
| **마스터** | `amb_partner_apps` (pap_id, pap_code, pap_name, pap_url, pap_auth_mode, pap_open_mode, pap_status) |
| **API** | `GET /entity/apps/installed` — 법인에 설치된 앱 목록 |
| | `POST /entity/apps/:appId/install` — 앱 설치 |
| **데이터 격리** | `ent_id` 기반, `OwnEntityGuard` 적용 |
| **상태** | PUBLISHED 앱만 설치 가능, UNIQUE(pap_id, ent_id) |

### 2.2 시스템 B: Custom Apps (Entity Custom App)

| 항목 | 내용 |
|------|------|
| **UI** | EntityCustomAppsTabPage → "커스텀앱" 탭 → `EntityCustomAppsPage` |
| **테이블** | `amb_entity_custom_apps` (eca_id, ent_id, eca_code, eca_name, eca_url, eca_auth_mode, eca_open_mode, ...) |
| **API** | `GET /entity-settings/custom-apps` — 관리자 전체 목록 |
| | `GET /entity-settings/custom-apps/my` — 사용자 앱 목록 (사이드바) |
| | `POST /entity-settings/custom-apps` — 앱 등록 |
| **데이터 격리** | `ent_id` 기반, `OwnEntityGuard` 적용 |
| **기능** | JWT 토큰 생성, API Key 암호화, 역할 기반 접근 제어, 연결 테스트 |
| **사이드바 표시** | `findMyApps()` → 활성 앱만 역할 필터 적용 후 표시 |

### 2.3 연동 현황

```
[앱스토어 iframe] ──(쿼리파라미터)──→ [stg-apps.amoeba.site]
                                         │
                                     구독 완료 (ACTIVE)
                                         │
                                    amb_partner_app_installs ← ent_id 격리
                                         │
                           ❌ 연동 없음 ─── amb_entity_custom_apps
                                              │
                                         사이드바 표시
```

**핵심 갭**: `amb_partner_app_installs`에 설치된 앱이 `amb_entity_custom_apps`에 자동/수동 등록되는 경로가 없음.

### 2.4 데이터 매핑 관계

| Partner App (amb_partner_apps) | Custom App (amb_entity_custom_apps) | 매핑 |
|------|------|------|
| `pap_code` | `eca_code` | 앱 코드 (등록 시 동일하게 사용) |
| `pap_name` | `eca_name` | 앱 이름 |
| `pap_description` | `eca_description` | 설명 |
| `pap_icon` | `eca_icon` | 아이콘 |
| `pap_url` | `eca_url` | 앱 URL |
| `pap_auth_mode` | `eca_auth_mode` | 인증 모드 (`jwt`/`api_key`/`none`) |
| `pap_open_mode` | `eca_open_mode` | 오픈 모드 (`iframe`/`new_tab`) |
| — | `eca_allowed_roles` | Custom App 고유 (역할 접근 제어) |
| — | `eca_sort_order` | Custom App 고유 (정렬) |
| — | `eca_api_key_enc` | Custom App 고유 (API Key 암호화) |

---

## 3. TO-BE 요구사항

### 3.1 핵심 기능: "앱스토어 구독 앱 가져오기 (Import from Store)"

**Target UI 위치**: Entity Settings > Custom Apps 탭 > "커스텀앱" 탭 내

#### FR-01: 구독 앱 조회
- `amb_partner_app_installs`에서 해당 법인(ent_id)에 설치되고 활성(pai_is_active=true)인 앱 목록 조회
- 이미 `amb_entity_custom_apps`에 등록된 앱은 **"등록됨"** 표시로 중복 방지
- Partner App의 이름, URL, 인증모드, 아이콘 등 기본정보 표시

#### FR-02: 선택 앱 Custom Apps 등록
- 사용자가 구독 앱 목록에서 선택 → "등록" 클릭
- Partner App 정보를 `amb_entity_custom_apps`로 복사 (매핑 규칙 적용)
  - `eca_code` = `pap_code` (이미 같은 법인에 동일 code 존재 시 에러)
  - `eca_name` = `pap_name`
  - `eca_url` = `pap_url`
  - `eca_auth_mode` = `pap_auth_mode` (단, `oauth2` → `jwt`로 전환)
  - `eca_open_mode` = `pap_open_mode`
  - `eca_icon` = `pap_icon` (Lucide 아이콘명, null이면 기본값 `AppWindow`)
  - `eca_description` = `pap_description`
- `eca_is_active = true`, `eca_sort_order = 0` 기본값

#### FR-03: 등록 전 편집 가능
- Import 시 모달에서 이름, URL, 인증모드, 역할 제한 등 커스터마이즈 가능
- 기본값은 Partner App 정보로 pre-fill

#### FR-04: 출처 추적 (선택)
- `amb_entity_custom_apps`에 선택적으로 `eca_source_pap_id` (원본 파트너앱 ID) 저장
- 향후 동기화/업데이트 추적에 활용

### 3.2 UI 플로우

```
EntityCustomAppsPage (커스텀앱 탭)
  │
  ├── [+ 앱 추가] 기존 수동 등록
  │
  └── [📥 앱스토어에서 가져오기] 신규
        │
        └── ImportFromStoreModal 오픈
              │
              ├── 구독 앱 목록 표시
              │     ├── 앱 이름 / URL / 인증모드
              │     ├── "등록됨" 배지 (이미 Custom Apps에 있는 경우)
              │     └── [등록] 버튼 (미등록 앱만)
              │
              └── 등록 클릭 → 편집 모달 (pre-fill)
                    │
                    └── 저장 → Custom App 생성 → 목록 갱신
```

### 3.3 API 신규 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/entity-settings/custom-apps/importable` | 가져오기 가능한 구독 앱 목록 (설치된 파트너앱 중 Custom Apps에 미등록인 것) |
| `POST` | `/entity-settings/custom-apps/import/:papId` | 파트너앱 → Custom App 등록 (매핑 + 커스텀 필드 오버라이드) |

---

## 4. 갭 분석 (Gap Analysis)

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| **구독 앱 → Custom Apps** | 연동 없음 | 1-click 가져오기 | 신규 API + UI |
| **중복 방지** | 없음 | eca_code 기준 중복 체크 | API 로직 |
| **출처 추적** | 없음 | `eca_source_pap_id` 컬럼 | DB ALTER |
| **가져오기 UI** | 없음 | ImportFromStoreModal | 신규 컴포넌트 |
| **인증모드 매핑** | — | oauth2→jwt 자동 변환 | 매핑 로직 |

---

## 5. 사용자 플로우

### 일반 사용자 (USER_LEVEL MASTER)

```
1. Entity Settings > Custom Apps 진입
2. "커스텀앱" 탭 확인
3. "앱스토어에서 가져오기" 버튼 클릭
4. ImportFromStoreModal 오픈
   ├── 법인에 설치된 파트너앱 목록 표시
   ├── 이미 Custom Apps에 등록된 앱은 "등록됨" 배지
   └── 미등록 앱에 "등록" 버튼 표시
5. 원하는 앱의 "등록" 클릭
6. 앱 정보 편집 모달 (이름, URL, 인증방식 등 pre-fill)
7. "저장" 클릭 → Custom App 생성
8. 커스텀앱 목록에 신규 앱 표시
9. 사이드바에 앱 표시 (is_active=true)
```

### 관리자 (ADMIN_LEVEL)

동일 플로우이나 `entity_id` 선택 가능 (특정 법인 대상 작업)

---

## 6. 기술 제약사항

### 6.1 보안
- 모든 엔드포인트 `@Auth()` + `@UseGuards(OwnEntityGuard)` + `resolveEntityId()` 필수
- `ent_id` 기반 데이터 격리 준수
- Partner App URL 검증: HTTP/HTTPS 필수

### 6.2 데이터 무결성
- `amb_entity_custom_apps`의 `UNIQUE(ent_id, eca_code)` 제약에 의해 같은 법인에 동일 code 중복 불가
- Import 시 `pap_code`가 이미 존재하면 409 Conflict

### 6.3 호환성
- `amb_partner_apps.pap_auth_mode`에 `oauth2`가 존재하나 `amb_entity_custom_apps`는 `jwt`/`none`/`api_key`만 지원
- Import 시 `oauth2` → `jwt`로 자동 변환 (OAuth 인프라 미구현 상태)

### 6.4 DB 스키마 변경
- `amb_entity_custom_apps`에 `eca_source_pap_id` (UUID, nullable) 컬럼 추가
- 스테이징/프로덕션 수동 SQL 마이그레이션 필요

### 6.5 i18n
- 신규 UI 요소 3개 언어(ko/en/vi) 번역 필수
- 기존 `entitySettings` 네임스페이스에 키 추가

---

## 7. 참고 자료

- 현행 Custom Apps 엔티티: `apps/api/src/domain/entity-settings/entity/entity-custom-app.entity.ts`
- 현행 Partner App 엔티티: `apps/api/src/domain/partner-app/entity/partner-app.entity.ts`
- 현행 Partner App Install: `apps/api/src/domain/partner-app/entity/partner-app-install.entity.ts`
- 현행 Custom Apps 컨트롤러: `apps/api/src/domain/entity-settings/controller/entity-custom-app.controller.ts`
- 현행 Custom Apps 페이지: `apps/web/src/domain/entity-settings/pages/EntityCustomAppsPage.tsx`
- 앱스토어 탭 페이지: `apps/web/src/domain/entity-settings/pages/EntityCustomAppsTabPage.tsx`
- 통합 아키텍처 문서: `docs/analysis/REQ-AMA-Apps-통합아키텍처-20260328.md`
