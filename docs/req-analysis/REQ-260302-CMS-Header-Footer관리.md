# 요구사항 분석서: CMS Header/Footer 글로벌 레이아웃 관리

---

| 항목 | 내용 |
|------|------|
| **문서 ID** | REQ-CMS-HEADER-FOOTER-20260302 |
| **작성일** | 2026-03-02 |
| **참조 스펙** | `reference/ambKMS-cms-header-footer-spec.md` (CMS-LAYOUT-SPEC-1.0.0) |
| **상태** | Draft |
| **작성자** | AMB Dev Team |

---

## 1. AS-IS 현황 분석

### 1.1 portal-web 현재 구조

#### PublicLayout.tsx (현재)
- **경로**: `apps/portal-web/src/pages/public/PublicLayout.tsx` (224줄)
- Header가 `PublicLayout` 컴포넌트 내부에 **하드코딩**되어 있음
- 로고(`Amoeba` 텍스트), GNB 메뉴(CMS `amb_cms_menus`에서 조회), 언어 전환(`Globe` 아이콘), Login/Signup 버튼이 직접 JSX로 작성됨
- Footer도 동일하게 하드코딩 (copyright 텍스트만 표시, 컬럼 레이아웃 없음)
- CMS 메뉴는 `cmsApi.getMenus()`로 조회하지만, Header 스타일/로고/액션 버튼 등은 DB 관리가 아닌 코드에 고정

#### LandingPage.tsx (현재)
- **경로**: `apps/portal-web/src/pages/public/LandingPage.tsx` (711줄)
- 자체 **독립 네비게이션 바** 포함 (로고, 메뉴, 언어 전환, CTA 버튼 — 371~410줄)
- 자체 **독립 Footer** 포함 (3컬럼 레이아웃, 소셜 링크, copyright — 약 600줄 이후)
- 자체 i18n 번역 시스템 사용 (`translations` 객체 직접 정의, `useTranslation` 미사용)
- `PublicLayout`의 Header/Footer + LandingPage 자체 Header/Footer = **2중 렌더링 문제**

#### 2중 렌더링 문제 상세
| Layer | Header | Footer |
|-------|--------|--------|
| `PublicLayout` → `<header>` | ✅ 렌더링됨 (sticky, bg-white) | ✅ 렌더링됨 (간단한 copyright) |
| `LandingPage` → `<nav>` | ✅ 렌더링됨 (fixed, 투명→스크롤 시 solid) | ✅ 렌더링됨 (3컬럼 풀 Footer) |
| **결과** | Header **2번** 표시 | Footer **2번** 표시 |

### 1.2 백엔드 CMS 현재 구조

#### site-management 모듈 (api 앱)
- **경로**: `apps/api/src/domain/site-management/`
- 기존 엔티티: `CmsMenuEntity`, `CmsPageEntity`, `CmsPageContentEntity`, `CmsPageVersionEntity`, `CmsSectionEntity`, `CmsPostEntity`, `CmsPostCategoryEntity`, `CmsPostAttachmentEntity`, `CmsSubscriberEntity`
- **`amb_cms_site_config` 테이블**: 미존재 (신규 필요)
- Public API: `/api/v1/cms/public/menus`, `/api/v1/cms/public/pages/:slug`
- **Site Config API**: 미존재 (신규 필요)

#### 권한 체계 현황
- 현재 역할: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `MEMBER`, `VIEWER`
- `SUPER_ADMIN`은 이미 존재하나, 별도 SuperAdminGuard는 현재 admin.guard.ts에서 ADMIN과 동일 처리
- 사이트관리 메뉴 권한(`SITE_MANAGEMENT`): SUPER_ADMIN/ADMIN 전체 접근

#### portal-web CMS API 클라이언트
- **경로**: `apps/portal-web/src/lib/cms-api.ts`
- `getMenus()`, `getPage()`, `getPosts()` 제공
- `getSiteConfig()`: 미존재 (신규 필요)

### 1.3 기존 SiteSettings 모듈 (web 앱)
- `apps/web`(ambKMS)에 `SiteSettingsPage` 존재 (`/settings/site-settings`)
- `amb_site_settings` 테이블은 일반 사이트 설정용 (SMTP 등)
- Header/Footer 전문 편집과는 별개

---

## 2. TO-BE 요구사항

### 2.1 핵심 목표

| # | 목표 | 설명 |
|---|------|------|
| G1 | **Header 중복 해소** | PublicLayout Header + LandingPage 자체 Navigation 2중 렌더링 제거 |
| G2 | **CMS-driven Header** | Header의 로고, 스타일, 메뉴, 액션 버튼을 DB(JSONB)로 관리, 코드 배포 없이 변경 |
| G3 | **CMS-driven Footer** | Footer의 레이아웃, 컬럼, 소셜 링크, copyright를 DB로 관리 |
| G4 | **SUPER_ADMIN 편집 UI** | ambKMS(web 앱)에서 Header/Footer를 시각적으로 편집, 실시간 미리보기, 발행 |
| G5 | **랜딩 투명 Header** | 랜딩페이지에서 투명→스크롤 시 배경 전환, CMS 설정으로 제어 |
| G6 | **GNB 메뉴 단일 출처** | Header 네비게이션 = `amb_cms_menus` 직접 사용 (별도 메뉴 불일치 방지) |

### 2.2 기능 요구사항

#### FR-01: 데이터 모델 — `amb_cms_site_config`
- 법인별(Entity) 사이트 글로벌 설정 저장 테이블
- Key-Value 방식: `csc_key` (HEADER / FOOTER / SITE_META), `csc_value` (JSONB)
- 버전 관리(`csc_version`), 발행 관리(`csc_published_at`, `csc_published_by`)
- UNIQUE 제약: `(ent_id, csc_key)`

#### FR-02: Header 설정 구조 (JSONB)
- **로고**: imageUrl, altText, linkUrl, height
- **스타일**: position(fixed/sticky/static), backgroundColor, textColor, height, borderBottom, transparent 모드
- **네비게이션**: source(CMS_MENUS/CUSTOM), maxDepth, showIcons
- **액션 버튼**: LANGUAGE_SWITCHER, CTA_BUTTON, LOGIN_BUTTON 등 (다국어 라벨, URL, variant)
- **모바일**: hamburgerPosition, drawerWidth
- **랜딩 오버라이드**: enabled, transparentOnTop, solidOnScroll, scrollThreshold, transparentTextColor

#### FR-03: Footer 설정 구조 (JSONB)
- **레이아웃**: COLUMNS / SIMPLE / MINIMAL
- **로고/설명**: imageUrl, 다국어 description
- **컬럼**: 최대 4개, 각 컬럼에 다국어 title + links 배열
- **소셜 링크**: platform + url 배열
- **하단 바**: 다국어 copyright, 언어 전환 표시 여부

#### FR-04: SITE_META 설정 구조 (JSONB)
- siteName, defaultLang, favicon, ogImage, analytics ID, custom scripts

#### FR-05: Admin API (SUPER_ADMIN 전용)
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/cms/site-config` | 전체 설정 조회 |
| GET | `/api/v1/cms/site-config/:key` | 특정 키 조회 |
| PUT | `/api/v1/cms/site-config/:key` | DRAFT 저장 |
| POST | `/api/v1/cms/site-config/:key/publish` | 발행 (portal-web 반영) |
| GET | `/api/v1/cms/site-config/:key/history` | 변경 이력 |

#### FR-06: Public API (인증 없음)
| Method | Endpoint | 설명 | 캐시 |
|--------|----------|------|------|
| GET | `/api/v1/cms/public/site-config` | 발행된 HEADER + FOOTER + SITE_META + 메뉴 통합 조회 | 5분 |
| GET | `/api/v1/cms/public/site-config/:key` | 특정 설정만 조회 | 5분 |

#### FR-07: portal-web CmsHeader 컴포넌트
- DB에서 가져온 Header config + CMS 메뉴로 렌더링
- 투명 모드 지원 (랜딩 오버라이드)
- 스크롤 감지 → transparent→solid 전환
- GNB 메뉴 (Desktop: 드롭다운 2단, Mobile: 드로어)
- 우측 액션 영역 (언어 전환, CTA, 로그인 버튼)
- 반응형 디자인 (모바일 햄버거 메뉴)

#### FR-08: portal-web CmsFooter 컴포넌트
- DB에서 가져온 Footer config로 렌더링
- COLUMNS 레이아웃: 로고 + 설명 + 컬럼들 + 소셜 + copyright
- SIMPLE/MINIMAL 레이아웃 지원
- 반응형 디자인

#### FR-09: LandingPage Hero 섹션 정리
- LandingPage 내부의 자체 네비게이션 바(`<nav>`) 제거
- LandingPage 내부의 자체 Footer 제거
- Hero 섹션 상단에 Header 높이만큼 padding-top 추가
- CmsHeader가 fixed/transparent로 Hero 위에 오버레이

#### FR-10: ambKMS Header 편집 UI
- 사이트 설정 서브메뉴 추가 (SUPER_ADMIN 전용)
- 탭별 편집: 로고, 스타일, 네비게이션, 액션 버튼, 모바일, 랜딩 특수모드
- 실시간 미리보기 컴포넌트
- 발행 기능 + 버전 이력

#### FR-11: ambKMS Footer 편집 UI
- 탭별 편집: 레이아웃, 로고/설명, 컬럼 편집, 소셜 링크, 하단 바
- 컬럼 드래그 정렬, 링크 추가/삭제
- 실시간 미리보기
- 발행 기능

### 2.3 비기능 요구사항

| # | 요구사항 | 설명 |
|---|---------|------|
| NF-01 | **성능** | Public API 5분 캐시 (staleTime), Header/Footer 설정은 빈번하게 변경되지 않음 |
| NF-02 | **보안** | Header/Footer 편집은 SUPER_ADMIN 전용, SuperAdminGuard 적용 |
| NF-03 | **호환성** | 기존 `PublicLayout` → `CmsHeader`/`CmsFooter`로 점진적 전환 |
| NF-04 | **다국어** | Header/Footer 설정값에 다국어 필드 포함 (`label_en`, `label_ko`, `label_vi`) |
| NF-05 | **캐시 무효화** | 발행 시 버전 bump + portal-web React Query 캐시 무효화 |
| NF-06 | **Fallback** | API 실패 시 하드코딩된 기본 Header/Footer로 fallback |

---

## 3. 갭 분석

| 영역 | AS-IS | TO-BE | Gap |
|------|-------|-------|-----|
| **Header 관리** | PublicLayout에 하드코딩 | DB(JSONB)에서 관리, CMS 편집 | 신규 개발 |
| **Footer 관리** | PublicLayout에 하드코딩 (copyright만) | DB(JSONB)에서 관리, 3컬럼+소셜 지원 | 신규 개발 |
| **Header 중복** | PublicLayout + LandingPage 2중 렌더링 | CmsHeader 1회 렌더링 | 리팩터링 |
| **투명 Header** | LandingPage 자체 구현 (코드 고정) | CMS 설정 기반 투명/스크롤 전환 | 마이그레이션 |
| **GNB 메뉴** | PublicLayout: CMS 메뉴, LandingPage: 하드코딩 앵커 | 통일된 CMS 메뉴 소스 | 통합 |
| **DB 테이블** | 없음 | `amb_cms_site_config` | 신규 DDL |
| **Admin API** | 없음 | site-config CRUD + publish | 신규 API |
| **Public API** | menus/pages만 존재 | site-config 통합 조회 추가 | 확장 |
| **Editor UI** | 없음 | Header/Footer 편집 페이지 | 신규 UI |
| **SuperAdmin 가드** | admin.guard에서 ADMIN과 동일 처리 | 별도 SuperAdminGuard 필요 시 분리 | 확인 필요 |

---

## 4. 사용자 플로우

### 4.1 SUPER_ADMIN: Header 편집 플로우
```
1. ambKMS 로그인 (SUPER_ADMIN)
2. 사이드바 → 사이트관리 → 사이트 설정
3. Header 편집 탭 진입
4. [로고] 탭: 로고 이미지 업로드, Alt 텍스트, 링크, 높이 설정
5. [스타일] 탭: 위치(Fixed), 배경색, 텍스트색, 높이, 하단 보더
6. [액션 버튼] 탭: CTA 버튼 라벨(EN/KO), URL, 스타일 설정
7. [랜딩 특수모드] 탭: 투명 모드 ON, 스크롤 전환 설정
8. 실시간 미리보기에서 변경사항 확인
9. [발행] 버튼 클릭 → portal-web에 즉시 반영
```

### 4.2 방문자: portal-web Header 렌더링 플로우
```
1. portal-web 방문 (www.amoeba.site)
2. PublicLayout 마운트 → useSiteConfig() 호출
3. GET /api/v1/cms/public/site-config → { header, footer, menus, siteMeta }
4. CmsHeader 렌더링: 로고 + GNB 메뉴 + 언어 전환 + CTA
5. 랜딩 페이지: 투명 Header 오버레이, 스크롤 시 Solid 전환
6. CmsFooter 렌더링: 3컬럼 + 소셜 + copyright
```

---

## 5. 기술 제약사항

| # | 제약 | 영향 |
|---|------|------|
| C1 | portal-api에는 CMS 모듈이 없음 (api 앱에만 존재) | portal-web은 api 앱의 CMS API를 호출해야 함 |
| C2 | LandingPage.tsx 711줄 — 자체 i18n, 네비, Footer 포함 | 대규모 리팩터링 필요 |
| C3 | `amb_site_settings`와 `amb_cms_site_config`는 별개 | 기존 site-settings는 SMTP 등 일반 설정, 신규는 CMS 전용 |
| C4 | Hero 섹션 빌더 (CmsSectionEntity)에도 Header 포함 가능 | Hero 템플릿에서 네비 요소 완전 제거 필요 |
| C5 | 현재 PublicLayout이 CMS 메뉴를 직접 조회 중 | getSiteConfig()로 통합 시 기존 메뉴 로직과 병합 필요 |

---

## 6. 우선순위

| Phase | 내용 | 긴급도 | 소요 |
|-------|------|--------|------|
| **Phase 0** | Header 중복 긴급 수정 (LandingPage 자체 Nav/Footer 제거) | 🔴 즉시 | 1일 |
| **Phase 1** | DB 테이블 + Entity + API (CRUD + Public) | 🟡 높음 | 1주 |
| **Phase 2** | portal-web CmsHeader/CmsFooter 컴포넌트 | 🟡 높음 | 1주 |
| **Phase 3** | ambKMS Editor UI (Header/Footer 편집 페이지) | 🟢 중간 | 1주 |

---

*End of Document*
