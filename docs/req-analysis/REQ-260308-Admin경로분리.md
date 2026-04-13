# 요구사항 분석서: ADMIN_LEVEL 설정 메뉴 /admin 경로 분리

> 작성일: 2026-03-08

---

## 1. 요구사항 요약

ADMIN_LEVEL 사용자 전용 설정 페이지들을 `/settings/*` 에서 `/admin/*` 경로로 이동하고, `/admin` 하위 메뉴는 ADMIN_LEVEL 사용자만 접근 가능하게 조정한다.

## 2. AS-IS 현황

### 2.1 현재 경로 구조

| 현재 경로 | 가드 | 페이지 |
|----------|------|--------|
| `/settings` | AdminGuard | SettingsPage (대시보드) |
| `/settings/user-management` | AdminGuard | EntityManagementPage (법인별 사용자 관리) |
| `/settings/user-management/:entityId` | AdminGuard | EntityManagementDetailPage |
| `/settings/total-users` | AdminGuard | TotalUserManagementPage |
| `/settings/portal-bridge` | AdminGuard | PortalCustomerPage |
| `/settings/entities` | AdminGuard + MenuGuard | EntityManagementPage (HR 법인) |
| `/service/dashboard` | MenuGuard(SERVICE_MANAGEMENT) | ServiceDashboardPage |
| `/settings/api-keys` | AdminGuard + MenuGuard | ApiKeyManagementPage |
| `/settings/smtp` | AdminGuard + MenuGuard | SmtpSettingsPage |
| `/settings/permissions` | AdminGuard + MenuGuard | MenuPermissionsPage |
| `/settings/drive` | AdminGuard + MenuGuard | DriveSettingsPage |
| `/settings/mail-accounts` | AdminGuard + MenuGuard | MailAccountManagementPage |
| `/settings/agents` | AdminGuard + MenuGuard | AgentSettingsPage |
| `/settings/site-settings` | AdminGuard + MenuGuard | SiteSettingsPage |

### 2.2 현재 접근 제어

- **AdminGuard (프론트)**: `user.level === 'ADMIN_LEVEL'` 확인 → SUPER_ADMIN, ADMIN만 통과
- **AdminLevelGuard (백엔드)**: 동일한 레벨 확인
- **MenuGuard**: 서버에서 받은 권한 목록에 menuCode가 있는지 확인
- **EntitySettingsGuard**: MASTER, ADMIN, SUPER_ADMIN 통과 → `/entity-settings/*` 보호

### 2.3 사이드바 네비게이션 (MainLayout.tsx)

- 하단에 `⚙️ Settings` 버튼 → `/settings` 이동
- `hasAnySettingsAccess` = `isAdmin()` && settings 관련 메뉴 존재 시 표시

### 2.4 SettingsPage 카드 메뉴

- `SETTINGS_CARDS` 배열에 각 설정 메뉴 카드 정의
- `useMyPermissions()` 훅으로 접근 가능한 메뉴만 필터링하여 표시

### 2.5 DB 메뉴 설정 (amb_menu_config)

- `mcf_path` 컬럼에 각 메뉴의 경로 저장 (예: `/settings/api-keys`)
- `mcf_category` = `SETTINGS` 카테고리로 분류

## 3. TO-BE 요구사항

### 3.1 경로 변경

| 현재 경로 | 변경 경로 |
|----------|----------|
| `/settings` | `/admin` |
| `/settings/user-management` | `/admin/user-management` |
| `/settings/user-management/:entityId` | `/admin/user-management/:entityId` |
| `/settings/total-users` | `/admin/total-users` |
| `/settings/portal-bridge` | `/admin/portal-bridge` |
| `/settings/entities` | `/admin/entities` |
| `/service/dashboard` (및 /service/*) | `/admin/service/dashboard` (및 /admin/service/*) |
| `/settings/api-keys` | `/admin/api-keys` |
| `/settings/smtp` | `/admin/smtp` |
| `/settings/permissions` | `/admin/permissions` |
| `/settings/drive` | `/admin/drive` |
| `/settings/mail-accounts` | `/admin/mail-accounts` |
| `/settings/agents` | `/admin/agents` |
| `/settings/site-settings` | `/admin/site-settings` |

### 3.2 접근 제어
- `/admin/*` 하위 전체: ADMIN_LEVEL(SUPER_ADMIN, ADMIN)만 접근 가능
- 기존 AdminGuard 로직 유지하되, 경로만 변경

### 3.3 기존 경로 하위호환
- `/settings/*` → `/admin/*` 리다이렉트 추가 (기존 북마크/링크 보호)

## 4. 사이드 임팩트 분석

### 4.1 프론트엔드 영향

| 영향 범위 | 파일 | 내용 |
|----------|------|------|
| **라우터** | `router/index.tsx` | 모든 `/settings/*` 경로를 `/admin/*`으로 변경 |
| **사이드바** | `layouts/MainLayout.tsx` | Settings 버튼 경로 `/settings` → `/admin` |
| **설정 대시보드** | `settings/pages/SettingsPage.tsx` | 카드 내 경로 변경 |
| **법인 상세 뒤로가기** | `admin/pages/EntityManagementDetailPage.tsx` | navigate 경로 변경 |
| **서비스 레이아웃** | `domain/service/` | ServiceLayout 및 하위 경로 변경 |
| **내부 링크** | 각종 컴포넌트 | `/settings/members/:id` 등 내부 링크 |

### 4.2 백엔드 영향

- **API 경로 변경 없음**: API는 `/api/v1/settings/*`, `/api/v1/admin/*` 등 별도 경로 사용 → 영향 없음
- **메뉴 설정 DB**: `amb_menu_config.mcf_path` 값 업데이트 필요 (SQL 마이그레이션)

### 4.3 Entity Settings 영향

- `/entity-settings/*` 경로는 **변경 대상 아님** (MASTER 전용, 별도 유지)
- EntitySettingsGuard 변경 없음

### 4.4 기타 고려사항

| 항목 | 영향 |
|------|------|
| 사이트 설정(SiteSettings) | `/site/*` 경로도 `/admin/site/*`로 이동 검토 필요 |
| AI 사용량 | `/settings/ai-usage` → `/admin/ai-usage` |
| 용어집(Glossary) | `/settings/glossary` → `/admin/glossary` |
| 대화 관리 | `/settings/conversations` → `/admin/conversations` |
| Unit 관리 | `/settings/units` → `/admin/units` |
| Member 관리 | `/settings/members` → `/admin/members` |
