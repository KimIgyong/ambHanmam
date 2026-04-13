# 작업 계획서: ADMIN 전용 레이아웃 및 랜딩페이지

**문서번호**: PLAN-Admin전용레이아웃-작업계획-20260318  
**작성일**: 2026-03-18  
**요구사항 분석서**: `docs/analysis/REQ-Admin전용레이아웃-20260318.md`  
**상태**: 작성 완료

---

## 1. 시스템 개발 현황 분석

### 1.1 현재 라우팅 아키텍처

```
createBrowserRouter
├── AuthGuard (인증 가드)
│   └── MainLayout (공용 레이아웃)
│       ├── / → TodayPage
│       ├── /today, /todos, /issues, /work-items ...
│       ├── /amoeba-talk, /crew, /calendar, /mail/* ...
│       ├── /hr/*, /billing/*, /project/*, /kms/*
│       ├── /entity-settings/* (EntitySettingsGuard)
│       ├── /admin → SettingsPage (AdminGuard)       ← 현재: MainLayout 하위
│       ├── /admin/members, /admin/permissions ...    ← 현재: MainLayout 하위
│       ├── /admin/service/* → ServiceLayout          ← 현재: MainLayout 하위
│       └── /admin/site/* → SiteLayout                ← 현재: MainLayout 하위
├── /login, /register ... (PublicRoute > AuthLayout)
└── /client/* (ClientAuthGuard > ClientLayout)
```

### 1.2 핵심 파일 현황

| 파일 | LOC | 역할 | 변경 여부 |
|------|-----|------|----------|
| `router/index.tsx` | ~560 | 전체 라우팅 정의, 156개 import | **대규모 수정** |
| `layouts/MainLayout.tsx` | ~500+ | 공용 레이아웃 (헤더+사이드바+Outlet) | 최소 수정 |
| `components/common/AdminGuard.tsx` | 20 | ADMIN_LEVEL 가드 | 변경 없음 |
| `router/AuthGuard.tsx` | 35 | 인증 상태 가드 | 변경 없음 |
| `auth/pages/EntitySelectPage.tsx` | 112 | 법인 선택 → 리다이렉트 | **수정** |
| `auth/store/auth.store.ts` | 80 | isAdmin(), user.level 관리 | 변경 없음 |
| `settings/pages/SettingsPage.tsx` | ~326 | 20+ Admin 카드 목록 | 재사용 (Admin Dashboard 내) |
| `service-management/hooks/useServiceCatalog.ts` | 70 | useServiceList, useServiceDetail 등 | 변경 없음 (재사용) |
| `service-management/pages/ServiceDetailPage.tsx` | 131 | 서비스 상세 (Plans 포함) | 변경 없음 (새 페이지 작성) |

### 1.3 확정된 요구사항 (Q1~Q5)

| # | 결정 사항 |
|---|----------|
| Q1 | ADMIN → USER 뷰 전환 기능 **불필요** |
| Q2 | Admin 대시보드 = **통계 대시보드 상단 + 기존 SettingsPage 카드 하단** |
| Q3 | 서비스 상세 = **확장된 새 페이지 작성** (기존 ServiceDetailPage 재사용 X) |
| Q4 | Admin Settings 사이드바 = **전체 항목 노출** + 가시성 설정 페이지 별도 |
| Q5 | Admin 헤더에 **알림벨/AI 어시스턴트 불필요** |

---

## 2. 단계별 구현 계획

### Phase 1: AdminLayout 기본 골격 (레이아웃 + 헤더 + 사이드바)

#### Task 1.1: AdminLayout 컴포넌트 생성

**신규 파일**: `apps/web/src/layouts/AdminLayout.tsx`

```
구조:
AdminLayout
├── AdminHeader (상단 헤더)
├── AdminSidebar (좌측 사이드바)
└── <Outlet /> (메인 콘텐츠)
```

**구현 사항**:
- `collapsed` state로 사이드바 접기/펼치기
- 모바일 반응형: 좌측 서랍(drawer) 방식
- MainLayout과 유사한 flex 레이아웃 구조
- `useIdleTimeout(handleLogout)` 자동 로그아웃 유지
- `usePageTracking()` 페이지 추적 유지

**헤더 구성 (AdminHeader)**:
```
┌────────────────────────────────────────────────────────┐
│ ☰  🏢 AMB ADMIN          [🔍 Search...]   🌐EN  John Kim  [Logout] │
└────────────────────────────────────────────────────────┘
```

| 요소 | 구현 | 컴포넌트 |
|------|------|---------|
| 햄버거 (모바일) | 사이드바 토글 | `<Menu />` / `<X />` 아이콘 |
| 사이드바 접기 (데스크톱) | collapsed 토글 | `<PanelLeftClose />` / `<PanelLeftOpen />` |
| "AMB ADMIN" | 고정 텍스트 | `<span>` |
| 검색 | 기존 재사용 | `<GlobalSearchBar />` |
| 언어 선택 | 기존 재사용 | `<LanguageSelector />` |
| 유저네임 | auth store | `user?.name` |
| 로그아웃 | auth store | `<LogOut />` 아이콘 버튼 |

**사이드바 구성 (AdminSidebar)**:
```
┌──────────────┐
│  📊 Dashboard│  ← /admin (대시보드)
│  ─────────── │
│  SERVICES    │  ← 섹션 제목
│  📧 Postal   │  ← useServiceList({ status: 'ACTIVE' }) 동적 항목
│  💬 Talk     │
│  📊 Analytics│
│  ...         │
│  ─────────── │
│  MANAGEMENT  │  ← 섹션 제목
│  📋 Service  │  ← /admin/service/dashboard
│  🌐 Site     │  ← /admin/site/menus
│  ─────────── │
│  SETTINGS    │  ← 섹션 제목
│  👥 Members  │  ← 기존 SETTINGS_CARDS 항목
│  🔑 API Keys │
│  📧 SMTP     │
│  ...         │
└──────────────┘
```

**사이드바 섹션 상세**:

| 섹션 | 항목 | 데이터 소스 | 경로 |
|------|------|------------|------|
| 대시보드 | Dashboard | 고정 | `/admin` |
| SERVICES | 활성 서비스 목록 | `useServiceList({ status: 'ACTIVE' })` | `/admin/services/:svcId` |
| MANAGEMENT | Service Management | 고정 | `/admin/service/dashboard` |
| MANAGEMENT | Site Management | 고정 | `/admin/site/menus` |
| SETTINGS | User Management | 고정 (menuCode: SETTINGS_USER_MANAGEMENT) | `/admin/user-management` |
| SETTINGS | Total Users | 고정 (menuCode: SETTINGS_TOTAL_USERS) | `/admin/total-users` |
| SETTINGS | Members | 고정 (menuCode: SETTINGS_MEMBERS) | `/admin/members` |
| SETTINGS | Permissions | 고정 (menuCode: SETTINGS_PERMISSIONS) | `/admin/permissions` |
| SETTINGS | Entities | 고정 (menuCode: SETTINGS_ENTITIES) | `/admin/entities` |
| SETTINGS | Units | 고정 (menuCode: UNITS) | `/admin/units` |
| SETTINGS | API Keys | 고정 (menuCode: SETTINGS_API_KEYS) | `/admin/api-keys` |
| SETTINGS | SMTP | 고정 (menuCode: SETTINGS_SMTP) | `/admin/smtp` |
| SETTINGS | Email Templates | 고정 (menuCode: SETTINGS_EMAIL_TEMPLATES) | `/admin/email-templates` |
| SETTINGS | Drive | 고정 (menuCode: SETTINGS_DRIVE) | `/admin/drive` |
| SETTINGS | Conversations | 고정 (menuCode: SETTINGS_CONVERSATIONS) | `/admin/conversations` |
| SETTINGS | Mail Accounts | 고정 (menuCode: SETTINGS_MAIL_ACCOUNTS) | `/admin/mail-accounts` |
| SETTINGS | Agents | 고정 (menuCode: SETTINGS_AGENTS) | `/admin/agents` |
| SETTINGS | AI Usage | 고정 (menuCode: SETTINGS_AI_USAGE) | `/admin/ai-usage` |
| SETTINGS | Site Settings | 고정 (menuCode: SETTINGS_SITE) | `/admin/site-settings` |
| SETTINGS | Custom Apps | 고정 (menuCode: ENTITY_CUSTOM_APPS) | `/admin/custom-apps` |
| SETTINGS | Glossary | 고정 | `/admin/glossary` |
| SETTINGS | Portal Bridge | 고정 (menuCode: SETTINGS_PORTAL_BRIDGE) | `/admin/portal-bridge` |

**서비스명 다국어 표시 로직**:
```typescript
const getServiceName = (svc: SvcServiceResponse) => {
  const lang = i18n.language;
  if (lang === 'ko' && svc.nameKo) return svc.nameKo;
  if (lang === 'vi' && svc.nameVi) return svc.nameVi;
  return svc.name; // 기본: 영문
};
```

**서비스 아이콘 표시**:
- `svc_icon` 값이 있으면 Lucide 아이콘 매핑 또는 emoji
- `svc_color` 값이 있으면 아이콘 배경색/텍스트색에 적용
- fallback: 색상 원(●)으로 표시

#### Task 1.2: AdminLayout용 AdminGuard 래핑

기존 `AdminGuard.tsx`는 변경하지 않고, **라우터에서** AdminLayout을 AdminGuard로 감싸서 ADMIN_LEVEL만 접근 가능하도록 한다.

```tsx
// router/index.tsx에서
{
  element: <AdminGuard><AdminLayout /></AdminGuard>,
  children: [
    // /admin/* 라우트들
  ],
}
```

---

### Phase 2: 라우터 재구성

#### Task 2.1: `/admin/*` 라우트를 MainLayout → AdminLayout으로 이동

**수정 파일**: `apps/web/src/router/index.tsx`

**변경 전** (현재):
```
AuthGuard
└── MainLayout
    ├── 일반 라우트들 (/today, /todos, ...)
    ├── /admin → SettingsPage (AdminGuard)
    ├── /admin/members (AdminGuard)
    ├── /admin/service/* (AdminGuard > ServiceLayout)
    └── /admin/site/* (AdminGuard > SiteLayout)
```

**변경 후**:
```
AuthGuard
├── MainLayout
│   ├── 일반 라우트들 (/today, /todos, ...)
│   └── /entity-settings/*
│   (AdminGuard 이하 제거, /admin 리다이렉트만 유지)
│
└── AdminGuard > AdminLayout   ← 신규 Top-level 브랜치
    ├── /admin → AdminDashboardPage (신규)
    ├── /admin/services/:serviceId → AdminServiceDetailPage (신규)
    ├── /admin/members → MemberManagementPage
    ├── /admin/permissions → MenuPermissionsPage
    ├── /admin/service/* → ServiceLayout (하위 구조 유지)
    ├── /admin/site/* → SiteLayout (하위 구조 유지)
    └── ... (기존 /admin/* 페이지들 전부)
```

**라우터 구조 변경 상세**:

```tsx
// AuthGuard children 배열에 두 개의 형제 라우트 그룹:
{
  element: <AuthGuard />,
  children: [
    // ── (1) MainLayout: USER 전용 + 공용 ──
    {
      element: <MainLayout />,
      children: [
        { path: '/', element: <TodayPage /> },
        // ... 모든 일반 라우트 유지
        // /admin 관련 라우트 제거 (아래로 이동)
        // /settings 리다이렉트 유지
        { path: 'settings', element: <Navigate to="/admin" replace /> },
        { path: 'settings/*', element: <Navigate to="/admin" replace /> },
        // entity-settings 유지
        { path: 'entity-settings', element: <EntitySettingsGuard>...</EntitySettingsGuard> },
        // ...
      ],
    },
    // ── (2) AdminLayout: ADMIN 전용 (신규) ──
    {
      path: 'admin',
      element: <AdminGuard><AdminLayout /></AdminGuard>,
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: 'services/:serviceId', element: <AdminServiceDetailPage /> },
        { path: 'members', element: <MenuGuard menuCode="SETTINGS_MEMBERS"><MemberManagementPage /></MenuGuard> },
        { path: 'members/:id', element: <MenuGuard menuCode="SETTINGS_MEMBERS"><MemberDetailPage /></MenuGuard> },
        { path: 'api-keys', element: <MenuGuard menuCode="SETTINGS_API_KEYS"><ApiKeyManagementPage /></MenuGuard> },
        { path: 'smtp', element: <MenuGuard menuCode="SETTINGS_SMTP"><SmtpSettingsPage /></MenuGuard> },
        { path: 'email-templates', element: <MenuGuard menuCode="SETTINGS_EMAIL_TEMPLATES"><EmailTemplatesPage /></MenuGuard> },
        { path: 'permissions', element: <MenuGuard menuCode="SETTINGS_PERMISSIONS"><MenuPermissionsPage /></MenuGuard> },
        { path: 'drive', element: <MenuGuard menuCode="SETTINGS_DRIVE"><DriveSettingsPage /></MenuGuard> },
        { path: 'entities', element: <MenuGuard menuCode="SETTINGS_ENTITIES"><EntityManagementPage /></MenuGuard> },
        { path: 'conversations', element: <MenuGuard menuCode="SETTINGS_CONVERSATIONS"><ConversationManagementPage /></MenuGuard> },
        { path: 'mail-accounts', element: <MenuGuard menuCode="SETTINGS_MAIL_ACCOUNTS"><MailAccountManagementPage /></MenuGuard> },
        { path: 'agents', element: <MenuGuard menuCode="SETTINGS_AGENTS"><AgentSettingsPage /></MenuGuard> },
        { path: 'units', element: <MenuGuard menuCode="UNITS"><UnitManagementPage /></MenuGuard> },
        { path: 'ai-usage', element: <MenuGuard menuCode="SETTINGS_AI_USAGE"><AiUsageManagementPage /></MenuGuard> },
        { path: 'site-settings', element: <MenuGuard menuCode="SETTINGS_SITE"><SiteSettingsPage /></MenuGuard> },
        { path: 'custom-apps', element: <AdminCustomAppsPage /> },
        { path: 'glossary', element: <GlossaryPage /> },
        { path: 'portal-bridge', element: <PortalCustomerPage /> },
        { path: 'total-users', element: <TotalUserManagementPage /> },
        { path: 'user-management', element: <UserManagementPage /> },
        { path: 'user-management/:entityId', element: <UserManagementDetailPage /> },
        {
          path: 'service',
          element: <MenuGuard menuCode="SERVICE_MANAGEMENT"><ServiceLayout /></MenuGuard>,
          children: [
            { index: true, element: <Navigate to="/admin/service/dashboard" replace /> },
            { path: 'dashboard', element: <ServiceDashboardPage /> },
            { path: 'services', element: <ServiceListPage /> },
            { path: 'services/:id', element: <ServiceDetailPage /> },
            { path: 'clients', element: <ClientListPage /> },
            { path: 'clients/:id', element: <ClientDetailPage /> },
            { path: 'subscriptions', element: <SubscriptionListPage /> },
            { path: 'subscriptions/:id', element: <SubscriptionDetailPage /> },
          ],
        },
        {
          path: 'site',
          element: <MenuGuard menuCode="SITE_MANAGEMENT"><SiteLayout /></MenuGuard>,
          children: [
            { index: true, element: <Navigate to="/admin/site/menus" replace /> },
            { path: 'menus', element: <SiteMenuPage /> },
            { path: 'pages', element: <SitePageListPage /> },
            { path: 'pages/:pageId', element: <SitePageEditorPage /> },
            { path: 'posts', element: <div>Posts (Coming Soon)</div> },
            { path: 'subscribers', element: <div>Subscribers (Coming Soon)</div> },
            { path: 'analytics', element: <SiteAnalyticsPage /> },
            { path: 'ga-settings', element: <SiteGaSettingsPage /> },
          ],
        },
      ],
    },
  ],
}
```

**주의사항**:
- MainLayout 하위의 `/admin/*` 라우트를 모두 제거하되, `/settings → /admin` 리다이렉트는 유지
- `/service`, `/service/*` → `/admin/service/dashboard` 리다이렉트 MainLayout에 유지
- AdminLayout 하위의 `/admin/*` 라우트에서 `<AdminGuard>` 래핑 제거 (상위에서 이미 가드됨)
- `path: 'admin'` (상대 경로)로 지정하면 AuthGuard의 children이므로 `/admin`이 됨
- fallback route `{ path: '*', element: <Navigate to="/" replace /> }` 위치 확인 (MainLayout 하위에 유지)

#### Task 2.2: MainLayout 사이드바 정리

**수정 파일**: `apps/web/src/layouts/MainLayout.tsx`

ADMIN_LEVEL 사용자가 MainLayout을 사용하지 않게 되므로, MainLayout 사이드바 하단의 "Admin Settings" 버튼 처리:

- **방안**: ADMIN이 MainLayout에 접근할 일이 없으므로 (Q1: 뷰 전환 불필요), 기존 코드 유지해도 무방
- `hasAnySettingsAccess` && `isAdmin()` 조건은 그대로 유지 → ADMIN이 혹시 MainLayout 페이지에 접근 시에도 동작

**결론**: MainLayout은 사이드바 하단 Admin Settings 버튼을 그대로 유지 (최소 변경 원칙)

---

### Phase 3: EntitySelectPage 리다이렉트 분기

#### Task 3.1: 로그인 후 레벨별 랜딩 분기

**수정 파일**: `apps/web/src/domain/auth/pages/EntitySelectPage.tsx`

**변경 내용**:

```typescript
// 현재:
const fromPath = (location.state as { from?: ... })?.from?.pathname || '/';

// 변경:
const getDefaultPath = () => {
  const user = useAuthStore.getState().user;
  if (user?.level === 'ADMIN_LEVEL') return '/admin';
  return '/';
};

const fromPath = (location.state as { from?: ... })?.from?.pathname || getDefaultPath();
```

**로직 설명**:
1. `location.state.from.pathname`이 있으면 (다른 페이지에서 로그인으로 리다이렉트된 경우) 해당 경로로 이동
2. 기본 경로: ADMIN_LEVEL → `/admin`, 그 외 → `/`
3. `handleSelect(entity)` 함수 내에서도 동일 경로 사용
4. 법인 1개 자동선택 시에도 동일 분기 적용

**Entity 자동 선택 (1개) useEffect 수정**:
```typescript
useEffect(() => {
  if (!apiEntities) return;
  if (apiEntities.length === 1) {
    setEntities(apiEntities);
    setCurrentEntity(apiEntities[0]);
    navigate(fromPath, { replace: true });
  }
}, [apiEntities, ...]);
```
→ `fromPath`가 이미 level 기반이므로 useEffect 내 코드 변경 불필요. `fromPath` 계산만 수정하면 됨.

---

### Phase 4: Admin 대시보드 페이지

#### Task 4.1: AdminDashboardPage 생성

**신규 파일**: `apps/web/src/domain/admin/pages/AdminDashboardPage.tsx`

**레이아웃 구성**:
```
┌───────────────────────────────────────────┐
│  Admin Dashboard                          │
│  ─────────────────────────────────────── │
│  [통계 카드 4개: 사용자, 서비스, 법인, AI]  │
│  ─────────────────────────────────────── │
│  Quick Actions (기존 SettingsPage 카드)    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │UserMg│ │Svc   │ │Total │ │Portal│    │
│  │ment  │ │Mgmt  │ │Users │ │Bridge│    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │AIUsag│ │Site  │ │SMTP  │ │Perms │    │
│  └──────┘ └──────┘ └──────┘ └──────┘    │
│  ...                                      │
└───────────────────────────────────────────┘
```

**통계 카드 (상단)**:

| 카드 | API | 아이콘 | 색상 |
|------|-----|--------|------|
| Total Users | `GET /api/v1/users/stats` (신규 or 기존) | `UsersRound` | blue |
| Active Services | `GET /api/v1/service/services?status=ACTIVE` (count) | `Package` | emerald |
| Entities | `GET /api/v1/hr/entities` (count) | `Building2` | violet |
| AI Usage (Today) | `GET /api/v1/ai/usage/stats` (기존) | `BarChart3` | purple |

**Quick Actions (하단)**: 
- 기존 `SettingsPage`의 `SETTINGS_CARDS` 배열을 그대로 import하여 가드 기반 필터링 후 카드 그리드 표시
- `SettingsPage.tsx`에서 `SETTINGS_CARDS`를 export하도록 수정

**구현 접근**:
```tsx
// AdminDashboardPage.tsx
import { SETTINGS_CARDS } from '@/domain/settings/pages/SettingsPage';
import { useMyPermissions } from '@/domain/settings/hooks/useMenuPermissions';

export default function AdminDashboardPage() {
  const { data: accessibleMenus } = useMyPermissions();
  const visibleCards = SETTINGS_CARDS.filter(
    (card) => !accessibleMenus || accessibleMenus.includes(card.menuCode),
  );
  
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* 통계 카드 */}
        <StatsSection />
        {/* Quick Actions */}
        <QuickActionsGrid cards={visibleCards} />
        {/* Signature */}
        <SignatureSection />
      </div>
    </div>
  );
}
```

#### Task 4.2: SettingsPage에서 SETTINGS_CARDS export

**수정 파일**: `apps/web/src/domain/settings/pages/SettingsPage.tsx`

```diff
- const SETTINGS_CARDS: SettingsCard[] = [
+ export const SETTINGS_CARDS: SettingsCard[] = [
```

- `SettingsCard` interface도 export
- 기존 `SettingsPage`는 그대로 유지 (AdminDashboardPage에서 카드 데이터만 재사용)

---

### Phase 5: Admin 서비스 상세 페이지

#### Task 5.1: AdminServiceDetailPage 생성

**신규 파일**: `apps/web/src/domain/admin/pages/AdminServiceDetailPage.tsx`

기존 `ServiceDetailPage`를 참고하되 더 확장된 레이아웃으로 구성:

```
┌──────────────────────────────────────────────────┐
│  ← Back   📧 Postal Service   ● ACTIVE          │
│  Code: POSTAL  |  Category: COMMUNICATION        │
│  ─────────────────────────────────────────────── │
│                                                  │
│  📊 Overview                                     │
│  ┌──────────────────────────────────────────┐    │
│  │ Status: ACTIVE    Category: COMMUNICATION│    │
│  │ Launch: 2025-01-15  Website: https://... │    │
│  │ Description: 이메일 서비스...              │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  📦 Plans                                        │
│  ┌──────────┬──────────┬──────────┐              │
│  │ Basic    │ Pro      │ Enter    │              │
│  │ $10/mo   │ $30/mo   │ $100/mo  │              │
│  │ 5 users  │ 20 users │ Unlimit  │              │
│  └──────────┴──────────┴──────────┘              │
│                                                  │
│  👥 Subscriptions                                │
│  (해당 서비스 구독 법인/고객 목록 - 추후 확장)      │
│                                                  │
│  🏢 Clients                                      │
│  (해당 서비스 클라이언트 목록 - 추후 확장)          │
└──────────────────────────────────────────────────┘
```

**데이터 소스**:
- 서비스 정보: `useServiceDetail(serviceId)` 재사용
- 플랜 목록: `useServicePlans(serviceId)` 재사용
- 구독/클라이언트: Phase 1에서는 "Coming Soon" 표시, 추후 API 연동

**주요 차이점 (기존 ServiceDetailPage vs AdminServiceDetailPage)**:

| 항목 | 기존 ServiceDetailPage | 신규 AdminServiceDetailPage |
|------|----------------------|--------------------------|
| 경로 | `/admin/service/services/:id` | `/admin/services/:serviceId` |
| 레이아웃 | ServiceLayout 내부 (좌측에 서비스 서브내비) | AdminLayout 직속 (사이드바는 전체 서비스 목록) |
| 편집 기능 | 인라인 편집 모드 | **읽기 전용** (편집은 Service Management에서) |
| 플랜 관리 | CRUD 가능 | **조회만** |
| 구독 현황 | 없음 | **표시** (추후) |
| 뒤로가기 | `/service/services` | 이전 페이지 (sidebaar 유지) |

---

### Phase 6: i18n 키 추가

#### Task 6.1: 번역 키 추가

**수정 파일들**:
- `apps/web/public/locales/en/admin.json` (신규)
- `apps/web/public/locales/ko/admin.json` (신규)
- `apps/web/public/locales/vi/admin.json` (신규)

**필요한 키**:

```json
{
  "sidebar": {
    "dashboard": "Dashboard",
    "services": "Services",
    "management": "Management",
    "settings": "Settings",
    "serviceManagement": "Service Management",
    "siteManagement": "Site Management"
  },
  "dashboard": {
    "title": "Admin Dashboard",
    "subtitle": "System overview and management",
    "stats": {
      "totalUsers": "Total Users",
      "activeServices": "Active Services",
      "entities": "Entities",
      "aiUsageToday": "AI Usage Today"
    },
    "quickActions": "Quick Actions"
  },
  "serviceDetail": {
    "overview": "Overview",
    "plans": "Plans",
    "subscriptions": "Subscriptions",
    "clients": "Clients",
    "comingSoon": "Coming Soon",
    "launchDate": "Launch Date",
    "website": "Website",
    "editInServiceManagement": "Edit in Service Management"
  }
}
```

#### Task 6.2: i18n.ts에 네임스페이스 등록

**수정 파일**: `apps/web/src/i18n.ts`

- `admin` 네임스페이스를 `ns` 배열에 추가

---

### Phase 7: 사이드바 가시성 설정 (선택적)

> Q4 답변: "전체 노출 + 사이드바 노출 항목 설정 페이지 별도 작성"

#### Task 7.1: Admin Sidebar Settings 페이지

**신규 파일**: `apps/web/src/domain/admin/pages/AdminSidebarSettingsPage.tsx`

**기능**: 
- Admin 사이드바에 표시할 항목을 선택/해제할 수 있는 토글 목록
- LocalStorage에 저장 (`amb_admin_sidebar_config`)
- SUPER_ADMIN만 접근 가능

**라우트**: `/admin/sidebar-settings`

**구현 우선순위**: Phase 7은 **후순위** — 기본 전체 노출로 먼저 배포 후, 필요시 추가 구현

---

## 3. 사이드 임팩트 분석

### 3.1 영향받는 기존 기능

| 기능 | 영향 | 대응 |
|------|------|------|
| `/admin` 직접접근 (북마크) | ✅ 호환 | AdminLayout이 받으므로 정상 동작 |
| MainLayout의 Admin Settings 버튼 | ⚠️ 경로 유지 | 클릭 시 AdminLayout으로 전환 (정상) |
| `/settings` → `/admin` 리다이렉트 | ✅ 호환 | MainLayout 내에서 리다이렉트 후 AdminLayout으로 이동 |
| `/service/*` → `/admin/service/*` 리다이렉트 | ✅ 호환 | 기존 리다이렉트 유지 |
| 모바일 하단바 (MobileBottomBar) | ⚠️ 확인 필요 | AdminLayout에서는 MobileBottomBar 미포함 |
| SSE/Presence 연결 | ⚠️ 확인 필요 | AdminLayout에 SSE 훅은 불필요 (Q5: 알림 없음) |
| 자동 로그아웃 (idle timeout) | ✅ 유지 | AdminLayout에 `useIdleTimeout` 적용 |

### 3.2 영향받지 않는 기능

| 기능 | 이유 |
|------|------|
| USER_LEVEL 사용자 전체 | AdminLayout에 진입 불가, MainLayout 변경 없음 |
| CLIENT_LEVEL (포탈) | 완전히 독립된 라우트 |
| 백엔드 API | 변경 없음 |
| DB 스키마 | 변경 없음 |
| 기존 `/admin/service/*` 페이지 내부 로직 | 경로 동일, 래핑 레이아웃만 변경 |

### 3.3 라우터 전환 시 주의사항

**React Router 중첩 구조 주의**: 

현재 AuthGuard → MainLayout → children 구조에서, AuthGuard의 children에 MainLayout과 AdminLayout 두 개의 형제 라우트를 배치할 때:

```tsx
// AuthGuard는 <Outlet />을 렌더링
// children 배열에서 path 기반으로 매칭:
// 1) path 없음 (MainLayout) → '/'부터 매칭
// 2) path: 'admin' (AdminLayout) → '/admin*' 매칭
```

- `MainLayout`은 path를 지정하지 않으므로 pathless route (index layout)
- `AdminLayout`은 `path: 'admin'`으로 `/admin*` 매칭
- React Router v6에서 pathless layout route와 path를 가진 route가 형제일 때, 더 구체적인 path가 우선 매칭됨
- **결론**: `/admin/*` 접근 시 AdminLayout이 매칭, 나머지는 MainLayout이 매칭 → 정상 동작

---

## 4. 파일 변경 목록

### 4.1 신규 파일

| # | 파일 | 설명 | Phase |
|---|------|------|-------|
| 1 | `apps/web/src/layouts/AdminLayout.tsx` | Admin 전용 레이아웃 (Header + Sidebar + Outlet) | 1 |
| 2 | `apps/web/src/domain/admin/pages/AdminDashboardPage.tsx` | Admin 대시보드 (통계 + 카드) | 4 |
| 3 | `apps/web/src/domain/admin/pages/AdminServiceDetailPage.tsx` | Admin 서비스 상세 (읽기 전용) | 5 |
| 4 | `apps/web/public/locales/en/admin.json` | 영어 번역 | 6 |
| 5 | `apps/web/public/locales/ko/admin.json` | 한국어 번역 | 6 |
| 6 | `apps/web/public/locales/vi/admin.json` | 베트남어 번역 | 6 |

### 4.2 수정 파일

| # | 파일 | 변경 내용 | Phase |
|---|------|----------|-------|
| 1 | `apps/web/src/router/index.tsx` | `/admin/*` 라우트를 AdminLayout 하위로 이동 | 2 |
| 2 | `apps/web/src/domain/auth/pages/EntitySelectPage.tsx` | 레벨별 기본 경로 분기 | 3 |
| 3 | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | `SETTINGS_CARDS`, `SettingsCard` export 추가 | 4 |
| 4 | `apps/web/src/i18n.ts` | `admin` 네임스페이스 추가 | 6 |

### 4.3 변경 없는 파일 (재사용)

| 파일 | 재사용 방법 |
|------|-----------|
| `components/common/AdminGuard.tsx` | 라우터에서 감싸기 |
| `router/AuthGuard.tsx` | 상위 가드 유지 |
| `auth/store/auth.store.ts` | `isAdmin()` 활용 |
| `service-management/hooks/useServiceCatalog.ts` | `useServiceList`, `useServiceDetail` 등 호출 |
| `components/common/LanguageSelector.tsx` | AdminHeader에서 사용 |
| `domain/search/components/GlobalSearchBar.tsx` | AdminHeader에서 사용 |
| `settings/hooks/useMenuPermissions.ts` | 카드 필터링, 사이드바 필터링 |

---

## 5. 구현 순서 및 의존성

```
Phase 1 ─── AdminLayout 골격 (Header + Sidebar + Outlet)
   │
   ▼
Phase 2 ─── 라우터 재구성 (/admin/* → AdminLayout)
   │         ※ Phase 1 완료 후 가능
   │
   ▼
Phase 3 ─── EntitySelectPage 리다이렉트 분기
   │         ※ Phase 2 완료 후 테스트 가능
   │
   ├──▶ Phase 4 ─── Admin 대시보드 (통계 + 카드)
   │                 ※ Phase 2 완료 후 가능 (독립적)
   │
   ├──▶ Phase 5 ─── Admin 서비스 상세 페이지
   │                 ※ Phase 2 완료 후 가능 (독립적)
   │
   └──▶ Phase 6 ─── i18n 키 추가
                     ※ Phase 1과 동시 가능 (선행 가능)

Phase 7 ─── 사이드바 가시성 설정 (후순위)
```

---

## 6. 테스트 계획

### 6.1 기능 테스트

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| T1 | ADMIN 계정으로 로그인 → 법인 선택 | `/admin`으로 리다이렉트, AdminLayout 표시 |
| T2 | USER 계정으로 로그인 → 법인 선택 | `/`로 리다이렉트, MainLayout 표시 (기존과 동일) |
| T3 | AdminLayout 사이드바에 서비스 목록 표시 | ACTIVE 서비스만 아이콘+이름 표시 |
| T4 | 사이드바에서 서비스 클릭 | `/admin/services/:svcId`로 이동, 상세 정보 표시 |
| T5 | 사이드바 Admin Settings 항목 클릭 | 해당 Admin 페이지로 이동 |
| T6 | Admin 대시보드 통계 카드 표시 | 사용자/서비스/법인/AI 통계 표시 |
| T7 | `/admin/members` 직접 URL 접근 | AdminLayout에서 MemberManagementPage 표시 |
| T8 | `/admin/service/dashboard` 접근 | AdminLayout > ServiceLayout 내부 페이지 표시 |
| T9 | USER 계정으로 `/admin` 접근 시도 | `/`로 리다이렉트 (AdminGuard) |
| T10 | 사이드바 접기/펼치기 | 아이콘만/Full 표시 토글 |
| T11 | 모바일 화면에서 사이드바 | 드로어 방식으로 열림/닫힘 |
| T12 | 언어 변경 시 사이드바 서비스명 | 선택 언어에 맞는 서비스명 표시 |

### 6.2 회귀 테스트

| # | 시나리오 | 확인 사항 |
|---|---------|----------|
| R1 | USER 계정의 모든 기존 기능 | MainLayout, 사이드바, 페이지 전환 정상 |
| R2 | `/settings` URL 접근 | `/admin`으로 리다이렉트 |
| R3 | `/service/*` URL 접근 | `/admin/service/dashboard`로 리다이렉트 |
| R4 | Entity 설정 접근 | MASTER 계정으로 `/entity-settings/*` 정상 |
| R5 | 자동 로그아웃 | AdminLayout에서 60분 미활동 시 로그아웃 |
| R6 | Client Portal 로그인 | `/client/*` 영향 없음 |

---

## 7. 배포 계획

### 7.1 배포 환경

- **개발**: `npm run dev:web`에서 확인
- **스테이징**: `ssh amb-staging "cd ~/ambManagement && bash docker/staging/deploy-staging.sh"`
- **프론트엔드만 변경**: 백엔드 재시작 불필요, 웹 이미지만 재빌드

### 7.2 롤백 계획

- Git 브랜치에서 작업하므로 `main` 머지 전 스테이징 검증
- 문제 발생 시 이전 커밋으로 웹 이미지 재빌드

---

## 8. 예상 변경 규모

| 항목 | 추정 |
|------|------|
| 신규 파일 | 6개 |
| 수정 파일 | 4개 |
| 신규 코드 | ~800줄 |
| 수정 코드 | ~100줄 |
| 삭제 코드 | ~60줄 (MainLayout에서 /admin 라우트 이동) |
