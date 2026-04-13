# 권한 관리 시스템 개선 — 작업 계획서

> **작성일**: 2026-02-18
> **참조**: `docs/analysis/permission-system-analysis.md`, `reference/permission-system-requirements.md`

---

## 작업 순서

### Step 1: 백엔드 상수/타입 수정
- `menu-code.constant.ts`: PROJECT_MANAGEMENT 추가
- `domain.types.ts`: MenuConfigResponse, UserMenuPermissionResponse, MyMenuResponse 타입 추가

### Step 2: 백엔드 엔티티 신규 생성
- `menu-config.entity.ts` → `amb_menu_config` 테이블
- `user-menu-permission.entity.ts` → `amb_user_menu_permissions` 테이블

### Step 3: 백엔드 DTO 신규 생성
- `update-menu-config.request.ts` — 메뉴 설정 업데이트 DTO
- `set-user-permission.request.ts` — 사용자별 권한 설정 DTO

### Step 4: 백엔드 서비스 신규/수정
- `menu-config.service.ts` (신규) — 메뉴 설정 CRUD + 초기 시드
- `user-menu-permission.service.ts` (신규) — 사용자별 권한 CRUD
- `menu-permission.service.ts` (수정) — `getMyMenus()` 통합 판정 로직

### Step 5: 백엔드 컨트롤러 신규/수정
- `menu-config.controller.ts` (신규) — 메뉴 설정 API 3개
- `menu-permission.controller.ts` (수정) — 사용자별 권한 API + /me 응답 변경

### Step 6: 백엔드 모듈 등록
- `settings.module.ts` 수정 — 새 엔티티/서비스/컨트롤러 등록

### Step 7: 프론트엔드 서비스/훅
- `settings.service.ts` 수정 — 메뉴 설정, 사용자별 권한 API 메서드 추가
- `useMenuPermissions.ts` 수정 — 메뉴 설정 훅, 사용자별 권한 훅 추가, /me 응답 타입 변경

### Step 8: 프론트엔드 i18n
- `settings.json` (EN/KO/VI) 수정 — 3탭 UI 번역 키 추가

### Step 9: 프론트엔드 탭 컴포넌트
- `MenuConfigTab.tsx` (신규) — 메뉴 설정 탭 (순서/노출)
- `RolePermissionTab.tsx` (신규) — 등급별 권한 탭 (기존 UI 분리+전체메뉴)
- `UserPermissionTab.tsx` (신규) — 사용자별 권한 탭

### Step 10: 프론트엔드 메인 페이지 재작성
- `MenuPermissionsPage.tsx` 전면 재작성 — 3탭 구조

### Step 11: 프론트엔드 사이드바 동적화
- `MainLayout.tsx` 수정 — 하드코딩 → API 기반 동적 메뉴

### Step 12: 프론트엔드 라우트 가드
- `MenuGuard.tsx` (신규) — URL 직접 접근 차단 컴포넌트
- `router/index.tsx` 수정 — MenuGuard 적용

---

## 파일 목록 (24개)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `apps/api/src/global/constant/menu-code.constant.ts` | 수정 |
| 2 | `packages/types/src/domain.types.ts` | 수정 |
| 3 | `apps/api/src/domain/settings/entity/menu-config.entity.ts` | 신규 |
| 4 | `apps/api/src/domain/settings/entity/user-menu-permission.entity.ts` | 신규 |
| 5 | `apps/api/src/domain/settings/dto/request/update-menu-config.request.ts` | 신규 |
| 6 | `apps/api/src/domain/settings/dto/request/set-user-permission.request.ts` | 신규 |
| 7 | `apps/api/src/domain/settings/service/menu-config.service.ts` | 신규 |
| 8 | `apps/api/src/domain/settings/service/user-menu-permission.service.ts` | 신규 |
| 9 | `apps/api/src/domain/settings/service/menu-permission.service.ts` | 수정 |
| 10 | `apps/api/src/domain/settings/controller/menu-config.controller.ts` | 신규 |
| 11 | `apps/api/src/domain/settings/controller/menu-permission.controller.ts` | 수정 |
| 12 | `apps/api/src/domain/settings/settings.module.ts` | 수정 |
| 13 | `apps/web/src/domain/settings/service/settings.service.ts` | 수정 |
| 14 | `apps/web/src/domain/settings/hooks/useMenuPermissions.ts` | 수정 |
| 15 | `apps/web/src/locales/en/settings.json` | 수정 |
| 16 | `apps/web/src/locales/ko/settings.json` | 수정 |
| 17 | `apps/web/src/locales/vi/settings.json` | 수정 |
| 18 | `apps/web/src/domain/settings/components/MenuConfigTab.tsx` | 신규 |
| 19 | `apps/web/src/domain/settings/components/RolePermissionTab.tsx` | 신규 |
| 20 | `apps/web/src/domain/settings/components/UserPermissionTab.tsx` | 신규 |
| 21 | `apps/web/src/domain/settings/pages/MenuPermissionsPage.tsx` | 전면 재작성 |
| 22 | `apps/web/src/layouts/MainLayout.tsx` | 수정 |
| 23 | `apps/web/src/components/common/MenuGuard.tsx` | 신규 |
| 24 | `apps/web/src/router/index.tsx` | 수정 |
