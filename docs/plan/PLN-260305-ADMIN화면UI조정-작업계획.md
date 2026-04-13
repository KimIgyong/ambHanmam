# 작업계획서: ADMIN_LEVEL 사용자 화면 UI 조정

- **문서번호**: PLAN-ADMIN화면UI조정-작업계획-20260305
- **작성일**: 2026-03-05
- **관련 분석서**: REQ-ADMIN화면UI조정-20260305

---

## 작업 개요

ADMIN_LEVEL 사용자의 Settings 페이지 카드 순서 재배치, 헤더 EntitySelector 숨김, 좌측 사이드바 법인설정 메뉴 숨김 처리.

---

## 단계별 구현 계획

### 1단계: SettingsPage 카드 순서 변경 및 SETTINGS_MEMBERS 제거

**파일**: `apps/web/src/domain/settings/pages/SettingsPage.tsx`

**변경 내용:**
- `SETTINGS_CARDS` 배열에서 `SETTINGS_MEMBERS` 카드 제거
- 카드 순서를 다음과 같이 재배치:

```
1. SETTINGS_USER_MANAGEMENT  → /settings/user-management
2. SERVICE_MANAGEMENT         → /service/dashboard  (경로 변경)
3. SETTINGS_TOTAL_USERS       → /settings/total-users
4. SETTINGS_PORTAL_BRIDGE     → /settings/portal-bridge
5. SETTINGS_AI_USAGE          → /settings/ai-usage
6. SITE_MANAGEMENT            → /site/menus  (경로 변경)
7. SETTINGS_API_KEYS          → /settings/api-keys
8. SETTINGS_SMTP              → /settings/smtp
9. SETTINGS_PERMISSIONS       → /settings/permissions
10. SETTINGS_DRIVE            → /settings/drive
11. SETTINGS_ENTITIES         → /settings/entities
12. UNITS                     → /settings/units
13. SETTINGS_CONVERSATIONS    → /settings/conversations
14. SETTINGS_MAIL_ACCOUNTS    → /settings/mail-accounts
15. SETTINGS_AGENTS           → /settings/agents
16. CALENDAR                  → /calendar
17. ASSET_MANAGEMENT          → /assets
18. SETTINGS_SITE             → /settings/site-settings
```

**경로 변경 사항:**
- `SERVICE_MANAGEMENT`: `/service` → `/service/dashboard`
- `SITE_MANAGEMENT`: `/site` → `/site/menus`

---

### 2단계: MainLayout 헤더 EntitySelector 숨김

**파일**: `apps/web/src/layouts/MainLayout.tsx`

**변경 내용:**
- 라인 342 부근 `<EntitySelector />` 렌더링에 `isAdmin()` 조건 추가
- ADMIN_LEVEL 사용자일 때 EntitySelector 숨김
- USER_LEVEL 사용자에게는 기존대로 노출

```tsx
// AS-IS
<EntitySelector />

// TO-BE
{!isAdmin() && <EntitySelector />}
```

---

### 3단계: MainLayout 사이드바 법인설정 메뉴 숨김

**파일**: `apps/web/src/layouts/MainLayout.tsx`

**변경 내용:**
- 라인 128-130 부근 `hasAnyEntitySettingsAccess` 조건 변경
- ADMIN_LEVEL 사용자 제외, MASTER만 법인설정 접근 허용

```tsx
// AS-IS
const hasAnyEntitySettingsAccess =
  isMasterOrAdmin() && (!myMenus || myMenus.some((m) => m.menuCode.startsWith('ENTITY_')));

// TO-BE
const hasAnyEntitySettingsAccess =
  isMaster() && (!myMenus || myMenus.some((m) => m.menuCode.startsWith('ENTITY_')));
```

- `isMaster` 함수를 `useAuthStore`에서 추가 임포트

---

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | 카드 순서 재배치, MEMBERS 제거, 경로 2건 변경 |
| 2 | `apps/web/src/layouts/MainLayout.tsx` | EntitySelector 조건부 렌더링, 법인설정 사이드바 조건 변경 |

---

## 사이드 임팩트

- **낮음**: UI 노출 조건만 변경, 데이터 로직/라우트/권한 체계 변경 없음
- EntityStore는 그대로 유지되어 기존 페이지 기능에 영향 없음
- SETTINGS_MEMBERS 라우트는 유지 (카드 노출만 제거)

---

## 검증

1. `npm run build` — 빌드 성공 확인
2. ADMIN_LEVEL 로그인 → `/settings` → 카드 순서 및 MEMBERS 카드 미노출 확인
3. ADMIN_LEVEL 로그인 → 헤더에 EntitySelector 미노출 확인
4. ADMIN_LEVEL 로그인 → 좌측 사이드바에 법인설정 메뉴 미노출 확인
5. MASTER 로그인 → 법인설정 사이드바 정상 노출, EntitySelector 정상 노출 확인
