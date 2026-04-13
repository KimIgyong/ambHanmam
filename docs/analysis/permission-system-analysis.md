# 권한 관리 시스템 요구사항 분석서

> **작성일**: 2026-02-18
> **참조 문서**: `reference/permission-system-requirements.md`

---

## 1. 현재 구현 분석 (AS-IS)

### 1.1 데이터 모델

**테이블**: `amb_menu_permissions` (1개)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| mpm_id | UUID PK | |
| mpm_menu_code | VARCHAR(50) | 메뉴 코드 |
| mpm_role | VARCHAR(20) | USER / MANAGER / ADMIN |
| mpm_accessible | BOOLEAN | 접근 허용 |
| UNIQUE(mpm_menu_code, mpm_role) | | |

### 1.2 백엔드

| 파일 | 역할 | 주요 로직 |
|------|------|-----------|
| `menu-permission.entity.ts` | 엔티티 | 5 컬럼 |
| `menu-permission.service.ts` | 서비스 | `findAll()`, `bulkUpdate()`, `getAccessibleMenus(role)`, `initDefaults()` |
| `menu-permission.controller.ts` | 컨트롤러 | 3 엔드포인트 |
| `menu-code.constant.ts` | 상수 | 29개 메뉴코드, 기본 권한 매트릭스 |
| `update-menu-permissions.request.ts` | DTO | `{menu_code, role, accessible}[]` |

**API 엔드포인트**:
- `GET /settings/permissions` — 전체 권한 조회 (AdminGuard)
- `PUT /settings/permissions` — 역할별 권한 업데이트 (AdminGuard)
- `GET /settings/permissions/me` — 내 접근 가능 메뉴 (JWT만)

### 1.3 프론트엔드

| 파일 | 역할 | 문제점 |
|------|------|--------|
| `MenuPermissionsPage.tsx` | 권한 관리 UI | **CHAT + SETTINGS 메뉴만 표시** (TODO, HR, BILLING 등 누락) |
| `useMenuPermissions.ts` | 훅 | 3개 훅 (list, update, my) |
| `settings.service.ts` | API 클라이언트 | 3개 메서드 |
| `MainLayout.tsx` | 사이드바 | **메뉴 순서 하드코딩**, 11개 메뉴 고정 배열 |

### 1.4 식별된 문제점

| # | 문제 | 영향도 | 상세 |
|---|------|--------|------|
| P1 | **관리 UI 불완전** | 높음 | MenuPermissionsPage에서 CHAT/SETTINGS 메뉴만 표시. TODO, AGENTS, HR, BILLING 등 11개 메뉴가 관리 불가 |
| P2 | **사용자별 개별 권한 없음** | 높음 | 역할 기반만 지원. USER 등급이지만 특정 메뉴를 봐야 하는 사용자 대응 불가 |
| P3 | **메뉴 순서 하드코딩** | 중간 | MainLayout.tsx의 MENU_ITEMS 배열 순서가 코드에 고정. 동적 변경 불가 |
| P4 | **메뉴 노출 ON/OFF 없음** | 중간 | 사용하지 않는 메뉴를 전체 숨김하는 기능 없음 |
| P5 | **URL 직접 접근 미차단** | 중간 | 권한 없는 메뉴의 URL 직접 입력 시 페이지 로드됨 |
| P6 | **PROJECT_MANAGEMENT 누락** | 낮음 | menu-code.constant.ts에 PROJECT_MANAGEMENT 미등록 |
| P7 | **`/me` 응답이 단순 배열** | 낮음 | 메뉴 설정 정보(순서, 아이콘, 경로) 없이 코드 배열만 반환 |

---

## 2. 개선 요구사항 (TO-BE)

### 2.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 유형 |
|----|----------|----------|------|
| REQ-01 | 모든 메뉴(29개+)를 `/settings/permissions`에서 관리 | 필수 | 기존 수정 |
| REQ-02 | 등급별(USER/MANAGER/ADMIN) 접근 권한 토글 | 필수 | 기존 유지 |
| REQ-03 | 특정 사용자에게 개별 메뉴 권한 허용/차단 | 필수 | 신규 |
| REQ-04 | 메뉴 노출 ON/OFF (전체 비활성화) | 필수 | 신규 |
| REQ-05 | 사이드바 메뉴 진열 순서 변경 | 필수 | 신규 |
| REQ-06 | 권한 없는 메뉴는 사이드바에서 완전 숨김 | 필수 | 기존 동작 유지 |
| REQ-07 | 권한 없는 URL 직접 접근 차단 (리다이렉트) | 권장 | 신규 |
| REQ-08 | PROJECT_MANAGEMENT 메뉴코드 등록 | 필수 | 기존 수정 |

### 2.2 권한 판정 우선순위

```
개별 사용자 설정 > 등급 설정 > 기본 거부
메뉴 비활성화 시 → 모든 권한 무시, 전체 숨김
ADMIN → 항상 모든 메뉴 접근 (비활성화 제외)
```

### 2.3 영향 범위

| 계층 | 변경 대상 | 변경 유형 |
|------|-----------|-----------|
| DB | `amb_menu_config` 테이블 | **신규** |
| DB | `amb_user_menu_permissions` 테이블 | **신규** |
| BE | `menu-code.constant.ts` | 수정 (PROJECT_MANAGEMENT 추가) |
| BE | `menu-permission.entity.ts` | 유지 |
| BE | `menu-config.entity.ts` | **신규** |
| BE | `user-menu-permission.entity.ts` | **신규** |
| BE | `menu-permission.service.ts` | 수정 (`getMyMenus` 통합 판정) |
| BE | `menu-config.service.ts` | **신규** |
| BE | `user-menu-permission.service.ts` | **신규** |
| BE | `menu-permission.controller.ts` | 수정 (엔드포인트 추가) |
| BE | `settings.module.ts` | 수정 (새 엔티티/서비스 등록) |
| BE | DTO 2개 | **신규** |
| FE | `MenuPermissionsPage.tsx` | **전면 재작성** (3탭) |
| FE | 탭 컴포넌트 3개 | **신규** |
| FE | `MenuGuard.tsx` | **신규** |
| FE | `useMenuPermissions.ts` | 수정 |
| FE | `MainLayout.tsx` | 수정 (동적 메뉴) |
| FE | `router/index.tsx` | 수정 (MenuGuard 적용) |
| FE | `settings.service.ts` | 수정 (API 추가) |
| FE | i18n 3파일 | 수정 (번역 키 추가) |
| Types | `domain.types.ts` | 수정 (Response 타입 추가) |
