# 요구사항 분석서: ADMIN_LEVEL 사용자 화면 UI 조정

- **문서번호**: REQ-ADMIN화면UI조정-20260305
- **작성일**: 2026-03-05
- **상태**: 분석 완료

---

## 1. 요구사항 개요

ADMIN_LEVEL (SUPER_ADMIN, ADMIN) 사용자의 설정 페이지 UI를 개선하여, 법인 관리에 최적화된 화면 구성을 제공한다.

---

## 2. AS-IS 현황

### 2-1. Settings 페이지 카드 구성 (`/settings`)

현재 19개 카드가 다음 순서로 노출:

| # | menuCode | 제목 | 경로 |
|---|----------|------|------|
| 1 | SETTINGS_USER_MANAGEMENT | 사용자 관리 | /settings/user-management |
| 2 | SETTINGS_MEMBERS | 멤버 관리 | /settings/members |
| 3 | SETTINGS_API_KEYS | API 키 관리 | /settings/api-keys |
| 4 | SETTINGS_SMTP | SMTP 설정 | /settings/smtp |
| 5 | SETTINGS_PERMISSIONS | 접근권한 관리 | /settings/permissions |
| 6 | SETTINGS_DRIVE | Google Drive | /settings/drive |
| 7 | SETTINGS_ENTITIES | 조직관리 | /settings/entities |
| 8 | UNITS | Unit 관리 | /settings/units |
| 9 | SETTINGS_CONVERSATIONS | 에이전트 대화 관리 | /settings/conversations |
| 10 | SETTINGS_MAIL_ACCOUNTS | 웹메일 계정 관리 | /settings/mail-accounts |
| 11 | SETTINGS_AGENTS | 채팅 에이전트 관리 | /settings/agents |
| 12 | CALENDAR | 캘린더 | /calendar |
| 13 | ASSET_MANAGEMENT | 자산관리 | /assets |
| 14 | SETTINGS_AI_USAGE | AI 사용량 관리 | /settings/ai-usage |
| 15 | SETTINGS_SITE | 사이트 설정 | /settings/site-settings |
| 16 | SERVICE_MANAGEMENT | 서비스 관리 | /service |
| 17 | SITE_MANAGEMENT | 사이트 관리 | /site |
| 18 | SETTINGS_PORTAL_BRIDGE | 포탈 고객 관리 | /settings/portal-bridge |
| 19 | SETTINGS_TOTAL_USERS | 통합 사용자 관리 | /settings/total-users |

### 2-2. 좌측 사이드바 하단 메뉴

- **My Page** — 전체 사용자 노출
- **법인 설정** (`/entity-settings`) — `isMasterOrAdmin()` 조건 (MASTER/ADMIN/SUPER_ADMIN 모두 노출)
- **설정** (`/settings`) — `isAdmin()` 조건 (ADMIN_LEVEL만 노출)

### 2-3. 헤더 영역

- **EntitySelector** — 법인 선택 드롭다운 (entities.length > 1일 때 전체 사용자 노출)
- 선택된 법인 값은 `useEntityStore`에 저장, axios 인터셉터가 `X-Entity-Id` 헤더로 모든 API 요청에 자동 주입
- 70개 이상의 훅/컴포넌트가 선택된 법인에 반응

---

## 3. TO-BE 요구사항

### 3-1. Settings 카드 순서 변경 및 삭제

| 순서 | menuCode | 제목 | 경로 | 변경사항 |
|------|----------|------|------|---------|
| 1 | SETTINGS_USER_MANAGEMENT | 사용자 관리 | /settings/user-management | 유지 (1번째) |
| 2 | SERVICE_MANAGEMENT | 서비스 관리 | /service/dashboard | 경로 변경 (/service → /service/dashboard) |
| 3 | SETTINGS_TOTAL_USERS | 통합 사용자 관리 | /settings/total-users | 순서 변경 (19→3) |
| 4 | SETTINGS_PORTAL_BRIDGE | 포탈 고객 관리 | /settings/portal-bridge | 순서 변경 (18→4) |
| 5 | SETTINGS_AI_USAGE | AI 사용량 관리 | /settings/ai-usage | 순서 변경 (14→5) |
| 6 | SITE_MANAGEMENT | 사이트 관리 | /site/menus | 경로 변경 (/site → /site/menus) |
| 7+ | 나머지 카드 | (기존 순서 유지) | - | SETTINGS_MEMBERS 제거 |

**삭제 대상:**
- `SETTINGS_MEMBERS` (멤버 관리) — User Management로 대체됨

### 3-2. 좌측 사이드바 변경

- **법인 설정** 메뉴: ADMIN_LEVEL 사용자에게는 **비노출**
  - MASTER 사용자에게만 노출 유지
  - 조건 변경: `isMasterOrAdmin()` → `isMaster()`

### 3-3. 헤더 EntitySelector 변경

- ADMIN_LEVEL 사용자에게는 **EntitySelector 비노출**
  - ADMIN은 전체 법인을 관리하므로 글로벌 법인 선택이 불필요
  - 법인별 데이터 필터링이 필요한 개별 페이지에서 자체적으로 법인 선택 UI 제공
  - USER_LEVEL (MASTER/MANAGER/MEMBER/VIEWER)에게는 기존대로 노출

---

## 4. 영향 분석

### 4-1. EntitySelector 제거 시 영향

EntitySelector를 헤더에서 숨기더라도 `useEntityStore`의 기본값은 유지됨:
- 로그인 시 `useEntities()` 훅이 법인 목록 로드 → 첫 번째 법인 자동 선택
- `X-Entity-Id` 헤더는 계속 주입됨 (store에 값이 있으므로)
- 개별 페이지에서 법인을 선택하면 store 값이 업데이트되어 다른 페이지에도 반영

**리스크**: 낮음 — EntitySelector를 숨기기만 하면 되고, store 로직 변경 불필요

### 4-2. 법인설정 사이드바 제거 시 영향

- ADMIN_LEVEL 사용자는 `/entity-settings/*` 경로 직접 접근 불가 (사이드바 메뉴 없음)
- 단, `EntitySettingsGuard`는 `isMasterOrAdmin()` 조건이므로 URL 직접 입력 시 접근 가능
- Settings 페이지의 카드에서 법인 설정 관련 기능 접근 가능

### 4-3. SETTINGS_MEMBERS 삭제 영향

- `/settings/members` 라우트는 유지 (URL 직접 접근 가능)
- Settings 카드에서만 제거 (노출되지 않음)
- User Management (`/settings/user-management`)가 상위 대체 기능 제공

---

## 5. 수정 대상 파일

| # | 파일 | 변경 내용 |
|---|------|---------|
| 1 | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | 카드 순서 변경, SETTINGS_MEMBERS 제거 |
| 2 | `apps/web/src/layouts/MainLayout.tsx` | 법인설정 사이드바 ADMIN_LEVEL 비노출, EntitySelector ADMIN_LEVEL 비노출 |
