# 요구사항 분석서: ADMIN 전용 레이아웃 및 랜딩페이지

**문서번호**: REQ-Admin전용레이아웃-20260318  
**작성일**: 2026-03-18  
**상태**: 분석 완료

---

## 1. 요구사항 요약

ADMIN_LEVEL (SUPER_ADMIN / ADMIN) 사용자가 로그인 후 일반 사용자와 **완전히 분리된 전용 레이아웃**으로 진입하도록 한다. 전용 헤더, 전용 사이드바, 서비스 기반 네비게이션을 갖춘 별도의 관리자 환경을 구성한다.

---

## 2. AS-IS 현황 분석

### 2.1 현재 라우팅 구조

| 영역 | 경로 | 레이아웃 | 대상 |
|------|------|---------|------|
| 인증 | `/login`, `/register` 등 | AuthLayout | 비인증 |
| 메인 앱 | `/`, `/today`, `/todo` 등 | **MainLayout** | USER_LEVEL + ADMIN_LEVEL 공유 |
| Admin 설정 | `/admin/*` | MainLayout > AdminGuard | ADMIN_LEVEL만 접근 |
| Entity 설정 | `/entity-settings/*` | MainLayout > EntitySettingsGuard | MASTER/ADMIN |
| 서비스 관리 | `/admin/service/*` | MainLayout > ServiceLayout | ADMIN_LEVEL |

### 2.2 현재 레이아웃 (MainLayout)

```
┌──────────────────────────────────────────────────┐
│  Header: 로고 | 검색 | 언어 | 알림 | AI | 유저  │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │                                       │
│          │                                       │
│ Work     │         메인 컨텐츠                    │
│ Tools    │         (Outlet)                      │
│          │                                       │
│ Work     │                                       │
│ Modules  │                                       │
│          │                                       │
│ Custom   │                                       │
│ Apps     │                                       │
│──────────│                                       │
│ My Page  │                                       │
│ Entity   │                                       │
│ Settings │                                       │
│ Admin ⚙  │                                       │
└──────────┴───────────────────────────────────────┘
```

### 2.3 현재 ADMIN 사용자 경험 흐름

1. 로그인 → `/select-entity` → `/` (TodayPage) — **일반 사용자와 동일한 랜딩**
2. 좌측 사이드바 하단 ⚙ Settings 클릭 → `/admin` (SettingsPage 카드 목록)
3. Service Management 카드 클릭 → `/admin/service/dashboard`
4. 사이드바에서 Services 클릭 → `/admin/service/services`

**문제점**:
- ADMIN은 서비스 운영이 주 업무인데, 매번 일반 사용자 레이아웃의 Today 페이지를 거쳐 Admin 설정으로 이동해야 함
- 사이드바가 일반 사용자용 Work Tools/Modules로 채워져 있어 ADMIN과 무관한 메뉴가 노출됨
- ADMIN과 USER의 업무 맥락이 전혀 다르므로 동일 레이아웃 공유가 비효율적

### 2.4 현재 서비스 데이터 구조

**테이블**: `amb_svc_services`

| 필드 | 타입 | 설명 |
|------|------|------|
| svc_id | UUID (PK) | 서비스 ID |
| svc_code | VARCHAR(30) UNIQUE | 서비스 코드 |
| svc_name | VARCHAR | 영문 이름 |
| svc_name_ko | VARCHAR | 한국어 이름 |
| svc_name_vi | VARCHAR | 베트남어 이름 |
| svc_description | TEXT | 설명 |
| svc_category | ENUM | COMMUNICATION / COMMERCE / MARKETING / PACKAGE / OTHER |
| svc_icon | VARCHAR | 아이콘 |
| svc_color | VARCHAR | HEX 색상 |
| svc_website_url | VARCHAR | 웹사이트 URL |
| svc_status | ENUM | ACTIVE / INACTIVE / DEPRECATED |
| svc_launch_date | DATE | 출시일 |
| svc_sort_order | INT | 정렬 순서 |

**기존 API**: `GET /api/v1/service/services` → `SvcServiceResponse[]`

---

## 3. TO-BE 요구사항

### 3.1 ADMIN 전용 레이아웃 (`AdminLayout`)

```
┌──────────────────────────────────────────────────┐
│  Header: "AMB ADMIN" | 검색 | 언어선택 | 유저 | 로그아웃  │
├──────────┬───────────────────────────────────────┤
│ Admin    │                                       │
│ Sidebar  │                                       │
│          │         메인 컨텐츠                    │
│ ─────── │         (Outlet)                      │
│ 서비스A  │                                       │
│ 서비스B  │                                       │
│ 서비스C  │                                       │
│ ...      │                                       │
│ ─────── │                                       │
│          │                                       │
│ ─────── │                                       │
│ Admin    │                                       │
│ Settings │                                       │
└──────────┴───────────────────────────────────────┘
```

### 3.2 상세 요구사항

#### R1. 로그인 후 랜딩 분기

| 조건 | 랜딩 페이지 | 레이아웃 |
|------|-----------|---------|
| `level === 'ADMIN_LEVEL'` | `/admin` (Admin 대시보드) | **AdminLayout** (신규) |
| `level === 'USER_LEVEL'` | `/` (TodayPage) | MainLayout (기존) |
| `level === 'CLIENT_LEVEL'` | `/client` | ClientLayout (기존) |

#### R2. AdminLayout 헤더 구성

| 요소 | 위치 | 기능 |
|------|------|------|
| **AMB ADMIN** 타이틀 | 좌측 | 브랜드 표시 (로고 + 텍스트) |
| 검색 | 중앙 | 글로벌 검색 (기존 SearchBar 재사용) |
| 언어 선택 | 우측 | 한/영/베 전환 (기존 LanguageSelector 재사용) |
| 유저네임 | 우측 | 로그인된 사용자 이름 표시 |
| 로그아웃 | 우측 끝 | 로그아웃 버튼 |

#### R3. AdminLayout 사이드바 구성

사이드바의 메뉴 항목은 `/admin/service/services`에서 생성된 **서비스 목록**으로 동적 구성된다.

| 섹션 | 내용 |
|------|------|
| **Services** (상단) | `GET /api/v1/service/services?status=ACTIVE` 로 조회된 서비스 목록 |
| 각 서비스 항목 | 서비스 아이콘(svc_icon) + 색상(svc_color) + 서비스명(i18n) |
| **구분선** | --- |
| **Admin Settings** (하단) | 기존 Admin 설정 카드 목록과 동일한 항목들 (Members, Permissions, Entities 등) |

**서비스 항목 클릭 시**: `/admin/services/:serviceId` → 서비스 상세 페이지로 이동

#### R4. 서비스 상세 페이지 (신규)

기존 `/admin/service/services/:id` (ServiceDetailPage)에 있는 서비스 상세 정보를 Admin 전용 레이아웃에서 표시.

| 탭/섹션 | 내용 |
|---------|------|
| 서비스 개요 | 이름, 코드, 카테고리, 상태, 설명, 출시일 |
| 플랜 관리 | 서비스에 연결된 플랜 목록 (가격, 빌링 주기, 최대 사용자) |
| 구독 현황 | 해당 서비스를 구독 중인 법인/고객 목록 |
| 클라이언트 | 해당 서비스의 클라이언트 정보 |

#### R5. 라우팅 레이아웃 분리

```
기존 (변경 없음):
MainLayout
├── / (TodayPage)
├── /todo, /meetings, /documents ...
├── /entity-settings/*
└── (USER_LEVEL 전용 사이드바)

신규 (AdminLayout):
AdminLayout
├── /admin (Admin 대시보드 - 랜딩)
├── /admin/services/:serviceId (서비스 상세)
├── /admin/service/* (ServiceLayout 하위)
├── /admin/members, /admin/permissions ...
└── (ADMIN_LEVEL 전용 사이드바 - 서비스 목록 기반)
```

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 변경점 |
|------|-------|-------|--------|
| **레이아웃** | ADMIN/USER 공용 MainLayout | ADMIN 전용 AdminLayout 분리 | **신규 레이아웃 컴포넌트** |
| **헤더** | 로고+검색+알림+AI+프로필 공통 | ADMIN: "AMB ADMIN"+검색+언어+유저+로그아웃 | **신규 AdminHeader** |
| **사이드바** | Work Tools/Modules 메뉴 공통 | ADMIN: 서비스 목록 동적 메뉴 | **신규 AdminSidebar** |
| **랜딩** | 모든 레벨 → TodayPage | ADMIN → /admin, USER → / | **로그인 후 분기 로직** |
| **라우팅** | /admin/* 는 MainLayout 하위 | /admin/* 를 AdminLayout 하위로 이동 | **라우팅 구조 변경** |
| **서비스 상세** | /admin/service/services/:id | /admin/services/:serviceId (AdminLayout 내) | **경로 재구성** |

---

## 5. 사용자 플로우

### 5.1 ADMIN 사용자 플로우

```
1. 로그인 → Entity 선택 (다수인 경우)
   ↓
2. level === 'ADMIN_LEVEL' 감지
   ↓
3. /admin 으로 리다이렉트 (AdminLayout)
   ↓
4. Admin 대시보드 표시 (서비스 요약/통계)
   ↓
5. 사이드바에서 서비스 클릭
   ↓
6. /admin/services/:serviceId 서비스 상세
   ↓
7. 사이드바에서 Admin Settings 클릭
   ↓
8. 기존 Admin 설정 페이지들 (/admin/members, /admin/permissions 등)
```

### 5.2 USER 사용자 플로우 (변경 없음)

```
1. 로그인 → Entity 선택
   ↓
2. level === 'USER_LEVEL' 감지
   ↓
3. / (TodayPage) 으로 리다이렉트 (MainLayout - 기존 방식 유지)
```

---

## 6. 화면 와이어프레임

### 6.1 AdminLayout 헤더

```
┌─────────────────────────────────────────────────────────┐
│  🏢 AMB ADMIN     [ 🔍 Search...        ]   🌐 EN ▾  John Kim  [Logout]  │
└─────────────────────────────────────────────────────────┘
```

### 6.2 AdminLayout 사이드바

```
┌──────────────┐
│  SERVICES    │
│  ─────────── │
│  📧 Postal   │  ← svc_icon + svc_name (각 서비스)
│  💬 Talk     │
│  📊 Analytics│
│  🛒 Commerce │
│  ...         │
│              │
│  ─────────── │
│  ADMIN       │
│  ─────────── │
│  👥 Members  │
│  🔑 Perms    │
│  🏢 Entities │
│  📧 SMTP     │
│  🤖 AI Usage │
│  ...         │
└──────────────┘
```

### 6.3 서비스 상세 페이지

```
┌──────────────────────────────────────────────────┐
│ AdminHeader                                      │
├──────────┬───────────────────────────────────────┤
│ Services │  📧 Postal Service                    │
│ ──────── │  ─────────────────────────────────    │
│ ▶Postal  │  Code: POSTAL   Category: COMM       │
│  Talk    │  Status: ● ACTIVE   Since: 2025-01   │
│  Analyt  │  Description: 이메일 서비스...         │
│          │                                       │
│ ADMIN    │  ── Plans ──────────────────────       │
│ ──────── │  │ Basic  │ $10/mo │ 5 users  │       │
│ Members  │  │ Pro    │ $30/mo │ 20 users │       │
│ Perms    │  │ Enter  │ $100/mo│ Unlimited│       │
│          │                                       │
│          │  ── Subscriptions ─────────────       │
│          │  │ Amoeba VN  │ Pro    │ Active │     │
│          │  │ Amoeba KR  │ Basic  │ Active │     │
└──────────┴───────────────────────────────────────┘
```

---

## 7. 기술 제약사항

### 7.1 배포 관련
- `VITE_*` 환경변수는 빌드 시점 인라인이므로 AdminLayout 관련 새 환경변수가 필요한 경우 이미지 재빌드 필수
- 프론트엔드만 변경이므로 API 서버 재시작 불필요 (서비스 목록 API는 기존 것 활용)

### 7.2 기존 사용자 영향
- USER_LEVEL 사용자: **영향 없음** — MainLayout과 사이드바 변경 없음
- ADMIN_LEVEL 사용자: 랜딩이 TodayPage에서 Admin 대시보드로 변경됨
- ADMIN이 USER용 페이지 접근: AdminLayout에서 MainLayout 페이지로의 이동 방법 고려 필요 (예: "Switch to User View" 옵션)

### 7.3 기존 라우팅 호환성
- `/admin/*` 경로는 기존에 MainLayout 하위에 AdminGuard로 보호됨
- AdminLayout으로 이동 시 MainLayout 하위에서 분리해야 함
- 기존 `/admin` 직접 접근 북마크/링크 호환성 유지 필요

### 7.4 i18n
- AdminHeader 타이틀 "AMB ADMIN"은 고정 텍스트 (번역 불필요)
- 서비스명은 다국어 지원됨 (`svc_name`, `svc_name_ko`, `svc_name_vi`) — 현재 선택된 locale에 따라 표시
- 사이드바 Admin Settings 항목 레이블은 기존 i18n 키 재사용

---

## 8. 구현 범위 요약

### 8.1 프론트엔드 변경

| 구분 | 파일 | 작업 |
|------|------|------|
| **신규** | `apps/web/src/layouts/AdminLayout.tsx` | Admin 전용 레이아웃 (헤더+사이드바+콘텐츠) |
| **신규** | `apps/web/src/layouts/AdminHeader.tsx` | AMB ADMIN 헤더 컴포넌트 |
| **신규** | `apps/web/src/layouts/AdminSidebar.tsx` | 서비스 목록 기반 동적 사이드바 |
| **수정** | `apps/web/src/router/index.tsx` | `/admin/*` 라우트를 AdminLayout 하위로 재구성 |
| **수정** | `apps/web/src/domain/auth/pages/EntitySelectPage.tsx` | 로그인 후 level별 리다이렉트 분기 |
| **수정** | `apps/web/src/domain/settings/pages/SettingsPage.tsx` | AdminLayout 내에서 대시보드 형태로 조정 |
| **신규** | `apps/web/src/domain/admin/pages/AdminServiceDetailPage.tsx` | Admin 전용 서비스 상세 페이지 |
| **수정** | i18n 파일들 (ko/en/vi) | admin 네임스페이스에 새 키 추가 |

### 8.2 백엔드 변경

| 구분 | 영향 |
|------|------|
| API 변경 | **없음** — 기존 `GET /service/services` API 재사용 |
| 권한 체크 | **없음** — 기존 AdminGuard 그대로 사용 |
| DB 변경 | **없음** |

### 8.3 영향도

| 대상 | 영향 |
|------|------|
| USER_LEVEL 사용자 | ❌ 영향 없음 |
| ADMIN_LEVEL 사용자 | ✅ 랜딩 페이지 변경, 새 레이아웃 적용 |
| 기존 /admin 북마크 | ✅ AdminLayout으로 자동 전환 (호환) |
| 모바일 | ✅ AdminLayout의 반응형 디자인 필요 |

---

## 9. 미결 사항 확정

| # | 항목 | 결정 |
|---|------|------|
| Q1 | ADMIN → USER 뷰 전환 | **불필요** — ADMIN은 관리자 뷰만 사용 |
| Q2 | Admin 대시보드 콘텐츠 | **통계 대시보드 + 하단에 기존 SettingsPage 카드 목록** 배치 |
| Q3 | 서비스 상세 페이지 범위 | **확장된 새 페이지 작성** (기존 ServiceDetailPage 재사용 X) |
| Q4 | 사이드바 Admin Settings 항목 | **전체 노출** + 사이드바 노출 항목 설정 페이지 별도 작성 |
| Q5 | 알림 표시 | **알림벨/AI 어시스턴트 버튼 불필요** — 헤더에서 제외 |
