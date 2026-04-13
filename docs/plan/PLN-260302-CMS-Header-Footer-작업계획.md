# 작업 계획서: CMS Header/Footer 글로벌 레이아웃 관리

---

| 항목 | 내용 |
|------|------|
| **문서 ID** | PLAN-CMS-Header-Footer-작업계획-20260302 |
| **작성일** | 2026-03-02 |
| **참조** | REQ-CMS-Header-Footer관리-20260302, CMS-LAYOUT-SPEC-1.0.0 |
| **상태** | Draft |

---

## 1. 시스템 개발 현황 분석

### 1.1 관련 모듈 현황

| 모듈 | 경로 | 상태 | 비고 |
|------|------|------|------|
| site-management (api) | `apps/api/src/domain/site-management/` | ✅ 운영 중 | CmsMenu, CmsPage, CmsSection, CmsPost, CmsSubscriber |
| PublicLayout (portal-web) | `apps/portal-web/src/pages/public/PublicLayout.tsx` | ✅ 운영 중 | 하드코딩 Header/Footer, 224줄 |
| LandingPage (portal-web) | `apps/portal-web/src/pages/public/LandingPage.tsx` | ✅ 운영 중 | 자체 Nav/Footer 포함, 711줄 |
| cms-api (portal-web) | `apps/portal-web/src/lib/cms-api.ts` | ✅ 운영 중 | getMenus, getPage, getPosts |
| SiteSettingsPage (web) | `apps/web/src/domain/settings/pages/SiteSettingsPage.tsx` | ✅ 운영 중 | 일반 설정 (SMTP 등), 별개 |
| portal-api | `apps/portal-api/src/` | ✅ 운영 중 | CMS 모듈 없음, 인증/구독/결제 전용 |

### 1.2 기존 엔티티 맵

```
apps/api/src/domain/site-management/entity/
├── cms-menu.entity.ts           (amb_cms_menus)
├── cms-page.entity.ts           (amb_cms_pages)
├── cms-page-content.entity.ts   (amb_cms_page_contents)
├── cms-page-version.entity.ts   (amb_cms_page_versions)
├── cms-section.entity.ts        (amb_cms_sections)
├── cms-post.entity.ts           (amb_cms_posts)
├── cms-post-category.entity.ts  (amb_cms_post_categories)
├── cms-post-attachment.entity.ts (amb_cms_post_attachments)
└── cms-subscriber.entity.ts     (amb_cms_subscribers)
```

신규 추가 필요: `cms-site-config.entity.ts` (`amb_cms_site_config`)

### 1.3 라우팅 구조

```
portal-web 라우트:
/               → PublicLayout > LandingPage     ← 2중 Header/Footer 문제
/page/:slug     → PublicLayout > CmsPage
/pricing        → redirect → /page/pricing
/login          → PublicLayout > LoginPage
/register       → PublicLayout > RegisterPage
/portal/*       → PortalLayout > ...
```

---

## 2. 단계별 구현 계획

### Phase 0: Header/Footer 중복 긴급 수정 (1일)

CMS 아키텍처 변경 전, **즉시** 2중 렌더링 문제를 해결하는 최소 변경.

| # | Task | 파일 | 설명 | 영향도 |
|---|------|------|------|--------|
| 0-1 | LandingPage 자체 `<nav>` 제거 | `apps/portal-web/src/pages/public/LandingPage.tsx` | 371~410줄의 fixed nav + 모바일 메뉴 제거 | ⚠️ 중간 |
| 0-2 | LandingPage 자체 `<footer>` 제거 | `apps/portal-web/src/pages/public/LandingPage.tsx` | 하단 footer 섹션 제거 | ⚠️ 중간 |
| 0-3 | Hero 섹션 padding-top 추가 | `apps/portal-web/src/pages/public/LandingPage.tsx` | Hero에 `pt-[72px]` 추가 (Nav 높이) | 🟢 낮음 |
| 0-4 | PublicLayout Footer 개선 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 간단한 copyright → LandingPage의 3컬럼 Footer 로직 이관 | ⚠️ 중간 |
| 0-5 | PublicLayout Header 투명 모드 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 랜딩 경로(`/`)일 때 투명→스크롤 전환 지원 | ⚠️ 중간 |
| 0-6 | LandingPage 자체 i18n → useTranslation 통합 | `apps/portal-web/src/pages/public/LandingPage.tsx` | 자체 `translations` 객체를 i18n 파일로 이관 (선택적) | 🟡 높음 |

#### Phase 0 상세 구현 방안

**0-1/0-2: LandingPage Nav/Footer 제거**
```tsx
// BEFORE: LandingPage 내부에 자체 <nav> + <footer> 존재
// AFTER: LandingPage는 순수 콘텐츠만 (Hero, WhyAmoeba, Products, Stats, CTA)
//        Nav/Footer는 PublicLayout이 담당
```

**0-3: Hero padding-top**
```tsx
// LandingPage Hero 섹션
<section id="hero" className="relative min-h-screen flex items-center overflow-hidden pt-[72px]" ...>
```

**0-5: PublicLayout 투명 Header**
```tsx
// PublicLayout.tsx
const location = useLocation();
const isLanding = location.pathname === '/';
const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  if (!isLanding) return;
  const onScroll = () => setScrolled(window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, [isLanding]);

const headerBg = isLanding && !scrolled 
  ? 'bg-transparent' 
  : 'bg-white/80 backdrop-blur-sm border-b border-gray-100';
```

---

### Phase 1: DB + Backend API (1주)

#### 1-1. DDL — `amb_cms_site_config` 테이블

| # | Task | 파일 | 설명 |
|---|------|------|------|
| 1-1-1 | DDL SQL 작성 | `sql/amb_cms_site_config.sql` | 테이블 생성, UNIQUE 제약, 인덱스 |
| 1-1-2 | TypeORM Entity 생성 | `apps/api/src/domain/site-management/entity/cms-site-config.entity.ts` | 엔티티 클래스 |

```sql
-- amb_cms_site_config
CREATE TABLE IF NOT EXISTS amb_cms_site_config (
  csc_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ent_id UUID NOT NULL REFERENCES amb_hr_entities(ent_id),
  csc_key VARCHAR(100) NOT NULL,
  csc_value JSONB NOT NULL DEFAULT '{}',
  csc_version INTEGER NOT NULL DEFAULT 1,
  csc_published_at TIMESTAMPTZ,
  csc_published_by UUID REFERENCES amb_hr_users(usr_id),
  csc_created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  csc_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  csc_updated_by UUID REFERENCES amb_hr_users(usr_id),
  UNIQUE (ent_id, csc_key)
);

CREATE INDEX idx_csc_entity ON amb_cms_site_config(ent_id);
```

#### 1-2. Entity 클래스

```typescript
// cms-site-config.entity.ts
@Entity('amb_cms_site_config')
export class CmsSiteConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'csc_id' })
  id: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'csc_key', type: 'varchar', length: 100 })
  key: string;

  @Column({ name: 'csc_value', type: 'jsonb', default: {} })
  value: Record<string, any>;

  @Column({ name: 'csc_version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'csc_published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'csc_published_by', type: 'uuid', nullable: true })
  publishedBy: string | null;

  @CreateDateColumn({ name: 'csc_created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'csc_updated_at' })
  updatedAt: Date;

  @Column({ name: 'csc_updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;
}
```

#### 1-3. Service 계층

| # | 파일 | 설명 |
|---|------|------|
| 1-3-1 | `service/cms-site-config.service.ts` | Admin CRUD + Publish 로직 |
| 1-3-2 | DTO: `dto/update-site-config.dto.ts` | PUT 요청 DTO |
| 1-3-3 | Mapper: `mapper/cms-site-config.mapper.ts` | Entity → Response 변환 |

**핵심 메서드:**
```typescript
class CmsSiteConfigService {
  // Admin
  findAllByEntity(entityId: string): Promise<CmsSiteConfigEntity[]>
  findByKey(entityId: string, key: string): Promise<CmsSiteConfigEntity>
  upsert(entityId: string, key: string, value: object, userId: string): Promise<CmsSiteConfigEntity>
  publish(entityId: string, key: string, userId: string): Promise<CmsSiteConfigEntity>
  getHistory(entityId: string, key: string): Promise<CmsSiteConfigEntity[]> // 버전 이력

  // Public
  getPublicConfig(entityId: string): Promise<{ header, footer, siteMeta, menus }>
  getPublicConfigByKey(entityId: string, key: string): Promise<object>
}
```

#### 1-4. Controller 계층

| # | 파일 | 설명 |
|---|------|------|
| 1-4-1 | `controller/cms-site-config.controller.ts` | Admin API (SUPER_ADMIN) |
| 1-4-2 | `controller/cms-public.controller.ts` 확장 | Public API에 site-config 엔드포인트 추가 |

**Admin API 라우트:**
```typescript
@Controller('cms/site-config')
@UseGuards(JwtAuthGuard, AdminGuard) // 기존 AdminGuard (SUPER_ADMIN/ADMIN 포함)
class CmsSiteConfigController {
  @Get()           // GET /api/v1/cms/site-config
  @Get(':key')     // GET /api/v1/cms/site-config/:key
  @Put(':key')     // PUT /api/v1/cms/site-config/:key
  @Post(':key/publish')  // POST /api/v1/cms/site-config/:key/publish
  @Get(':key/history')   // GET /api/v1/cms/site-config/:key/history
}
```

**Public API 확장:**
```typescript
// cms-public.controller.ts — 기존에 추가
@Get('public/site-config')    // GET /api/v1/cms/public/site-config
@Get('public/site-config/:key')  // GET /api/v1/cms/public/site-config/:key
```

#### 1-5. 시드 데이터

| # | Task | 설명 |
|---|------|------|
| 1-5-1 | `cms-seed.service.ts` 확장 | onModuleInit에서 기본 HEADER, FOOTER, SITE_META 시드 |

기본 시드:
- **HEADER**: 현재 PublicLayout/LandingPage의 하드코딩 값을 JSONB로 변환
- **FOOTER**: LandingPage의 3컬럼 Footer 데이터를 JSONB로 변환
- **SITE_META**: 기본 사이트 이름, favicon, defaultLang 등

#### 1-6. Module 등록

| # | 파일 | 변경 |
|---|------|------|
| 1-6-1 | `site-management.module.ts` | `CmsSiteConfigEntity` 추가, `CmsSiteConfigService` 추가, `CmsSiteConfigController` 추가 |
| 1-6-2 | `app.module.ts` | `CmsSiteConfigEntity` TypeORM entities에 추가 |

---

### Phase 2: portal-web CmsHeader/CmsFooter 컴포넌트 (1주)

#### 2-1. API 클라이언트 확장

| # | 파일 | 설명 |
|---|------|------|
| 2-1-1 | `apps/portal-web/src/lib/cms-api.ts` | `getSiteConfig()` 메서드 추가 |

```typescript
// cms-api.ts 확장
export interface SiteConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  siteMeta: SiteMetaConfig;
  menus: CmsMenu[];
}

getSiteConfig: (): Promise<SiteConfig> =>
  api.get('/cms/public/site-config').then((r) => r.data.data),
```

#### 2-2. React Query Hook

| # | 파일 | 설명 |
|---|------|------|
| 2-2-1 | `apps/portal-web/src/hooks/useSiteConfig.ts` | 신규 — React Query 훅 |

```typescript
export function useSiteConfig() {
  return useQuery({
    queryKey: ['cms', 'site-config'],
    queryFn: () => cmsApi.getSiteConfig(),
    staleTime: 5 * 60 * 1000,     // 5분
    gcTime: 30 * 60 * 1000,       // 30분
    refetchOnWindowFocus: false,
  });
}
```

#### 2-3. CmsHeader 컴포넌트

| # | 파일 | 설명 |
|---|------|------|
| 2-3-1 | `apps/portal-web/src/components/layout/CmsHeader.tsx` | 신규 — DB 기반 Header |
| 2-3-2 | `apps/portal-web/src/components/layout/CmsNavItem.tsx` | 신규 — GNB 메뉴 아이템 (드롭다운) |
| 2-3-3 | `apps/portal-web/src/components/layout/CmsHeaderAction.tsx` | 신규 — 액션 버튼 (언어/CTA/로그인) |
| 2-3-4 | `apps/portal-web/src/components/layout/MobileDrawer.tsx` | 신규 — 모바일 드로어 |

**CmsHeader 핵심 기능:**
- `config.style.position` 기반 positioning (fixed/sticky/static)
- `config.landingOverride` 기반 투명 모드 (랜딩 전용)
- 스크롤 감지 → transparent→solid 전환 (scrollThreshold 설정값 기반)
- `config.actions` 기반 우측 액션 영역 동적 렌더링
- GNB 메뉴: `menus` prop 기반, 2단 드롭다운 지원
- 모바일: 반응형 햄버거 + MobileDrawer

#### 2-4. CmsFooter 컴포넌트

| # | 파일 | 설명 |
|---|------|------|
| 2-4-1 | `apps/portal-web/src/components/layout/CmsFooter.tsx` | 신규 — DB 기반 Footer |

**CmsFooter 핵심 기능:**
- `config.layout` 기반 레이아웃 선택 (COLUMNS/SIMPLE/MINIMAL)
- COLUMNS: 로고+설명 + 동적 컬럼 + 소셜 링크
- `config.columns` 배열 순회하여 컬럼별 링크 렌더링
- `config.social` 배열 순회하여 소셜 아이콘 렌더링
- `config.bottomBar` 하단 copyright

#### 2-5. PublicLayout 리팩터링

| # | 파일 | 설명 |
|---|------|------|
| 2-5-1 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 하드코딩 Header/Footer → CmsHeader/CmsFooter 교체 |

```tsx
// AFTER
export function PublicLayout() {
  const { data: siteConfig, isLoading } = useSiteConfig();
  
  if (isLoading) return <LayoutSkeleton />;
  
  return (
    <div className="min-h-screen flex flex-col">
      <CmsHeader config={siteConfig?.header} menus={siteConfig?.menus} />
      <main className="flex-1">
        <Outlet />
      </main>
      <CmsFooter config={siteConfig?.footer} />
    </div>
  );
}
```

#### 2-6. LandingPage 정리

| # | 파일 | 설명 |
|---|------|------|
| 2-6-1 | `apps/portal-web/src/pages/public/LandingPage.tsx` | 자체 Nav/Footer 완전 제거, Hero padding-top |

Phase 0에서 이미 제거한 상태면 추가 작업 없음. CmsHeader가 fixed+transparent로 Hero 위에 오버레이됨.

#### 2-7. Fallback 로직

| # | 설명 |
|---|------|
| 2-7-1 | `useSiteConfig` 실패 시 기본 하드코딩 값 사용 |

```typescript
const DEFAULT_HEADER: HeaderConfig = { /* ... PublicLayout 현재 하드코딩 값 ... */ };
const DEFAULT_FOOTER: FooterConfig = { /* ... LandingPage 현재 Footer 값 ... */ };

export function useSiteConfig() {
  return useQuery({
    queryKey: ['cms', 'site-config'],
    queryFn: () => cmsApi.getSiteConfig(),
    staleTime: 5 * 60 * 1000,
    placeholderData: { header: DEFAULT_HEADER, footer: DEFAULT_FOOTER, siteMeta: DEFAULT_SITE_META, menus: [] },
  });
}
```

#### 2-8. TypeScript 인터페이스

| # | 파일 | 설명 |
|---|------|------|
| 2-8-1 | `apps/portal-web/src/types/site-config.ts` | HeaderConfig, FooterConfig, SiteMetaConfig 타입 정의 |

---

### Phase 3: ambKMS Editor UI (1주)

#### 3-1. 라우팅 + 메뉴 확장

| # | 파일 | 설명 |
|---|------|------|
| 3-1-1 | `apps/web/src/router/index.tsx` | `/site/config`, `/site/config/header`, `/site/config/footer` 라우트 추가 |
| 3-1-2 | 메뉴 코드 | `SITE_CONFIG` 메뉴 코드 추가 (SUPER_ADMIN 전용) |
| 3-1-3 | i18n | 사이트 설정 관련 번역 키 추가 (ko/en/vi) |

#### 3-2. Header Editor 페이지

| # | 파일 | 설명 |
|---|------|------|
| 3-2-1 | `apps/web/src/domain/site-management/pages/SiteConfigPage.tsx` | 메인 탭 라우팅 페이지 |
| 3-2-2 | `apps/web/src/domain/site-management/pages/HeaderEditorPage.tsx` | Header 편집 페이지 |
| 3-2-3 | `apps/web/src/domain/site-management/components/header/LogoTab.tsx` | 로고 편집 탭 |
| 3-2-4 | `apps/web/src/domain/site-management/components/header/StyleTab.tsx` | 스타일 편집 탭 |
| 3-2-5 | `apps/web/src/domain/site-management/components/header/NavigationTab.tsx` | 네비게이션 탭 |
| 3-2-6 | `apps/web/src/domain/site-management/components/header/ActionsTab.tsx` | 액션 버튼 탭 |
| 3-2-7 | `apps/web/src/domain/site-management/components/header/MobileTab.tsx` | 모바일 설정 탭 |
| 3-2-8 | `apps/web/src/domain/site-management/components/header/LandingTab.tsx` | 랜딩 특수모드 탭 |

#### 3-3. Footer Editor 페이지

| # | 파일 | 설명 |
|---|------|------|
| 3-3-1 | `apps/web/src/domain/site-management/pages/FooterEditorPage.tsx` | Footer 편집 페이지 |
| 3-3-2 | `apps/web/src/domain/site-management/components/footer/LayoutTab.tsx` | 레이아웃 선택 탭 |
| 3-3-3 | `apps/web/src/domain/site-management/components/footer/LogoDescTab.tsx` | 로고/설명 탭 |
| 3-3-4 | `apps/web/src/domain/site-management/components/footer/ColumnsTab.tsx` | 컬럼 편집 탭 |
| 3-3-5 | `apps/web/src/domain/site-management/components/footer/SocialTab.tsx` | 소셜 링크 탭 |
| 3-3-6 | `apps/web/src/domain/site-management/components/footer/BottomBarTab.tsx` | 하단 바 탭 |

#### 3-4. 사이트 메타 편집 페이지

| # | 파일 | 설명 |
|---|------|------|
| 3-4-1 | `apps/web/src/domain/site-management/pages/SiteMetaEditorPage.tsx` | SITE_META 편집 |

#### 3-5. 실시간 미리보기

| # | 파일 | 설명 |
|---|------|------|
| 3-5-1 | `apps/web/src/domain/site-management/components/preview/HeaderPreview.tsx` | Header 미리보기 |
| 3-5-2 | `apps/web/src/domain/site-management/components/preview/FooterPreview.tsx` | Footer 미리보기 |

#### 3-6. React Query Hooks + Service

| # | 파일 | 설명 |
|---|------|------|
| 3-6-1 | `apps/web/src/domain/site-management/hooks/useSiteConfig.ts` | Admin용 React Query 훅 |
| 3-6-2 | `apps/web/src/domain/site-management/service/site-config.service.ts` | API 호출 서비스 |

#### 3-7. 발행 + 버전 이력 UI

| # | 파일 | 설명 |
|---|------|------|
| 3-7-1 | `apps/web/src/domain/site-management/components/PublishButton.tsx` | 발행 버튼 + 확인 모달 |
| 3-7-2 | `apps/web/src/domain/site-management/components/VersionHistory.tsx` | 변경 이력 패널 |

---

## 3. 사이드 임팩트 분석

### 3.1 변경 영향 범위

| 영역 | 변경 | 영향도 | 대응 |
|------|------|--------|------|
| **portal-web PublicLayout** | Header/Footer 교체 | 🔴 높음 | 모든 Public 라우트에 영향, Fallback 필수 |
| **portal-web LandingPage** | Nav/Footer 제거, Hero 패딩 | 🔴 높음 | 레이아웃 변경, 시각적 QA 필수 |
| **api site-management** | 엔티티/서비스/컨트롤러 추가 | 🟡 중간 | 기존 기능에 영향 없음 (추가만) |
| **api app.module** | 엔티티 등록 | 🟢 낮음 | TypeORM entities 배열에 추가 |
| **web 라우팅** | 사이트 설정 서브메뉴 추가 | 🟢 낮음 | 기존 라우트에 영향 없음 |
| **DB** | 신규 테이블 추가 | 🟢 낮음 | 기존 데이터에 영향 없음 |
| **portal-web CmsPage** | 없음 | 없음 | CmsPage는 PublicLayout의 Outlet으로 영향 없음 |

### 3.2 하위 호환 전략

1. **Phase 0**에서 우선 LandingPage 자체 Nav/Footer 제거 (PublicLayout 통일)
2. **Phase 1-2**에서 PublicLayout을 CMS-driven으로 교체
3. `useSiteConfig`에 `placeholderData`로 기존 하드코딩 값 유지 → API 실패 시 기본 렌더링 보장
4. 기존 `cmsApi.getMenus()` 호출은 `useSiteConfig().data.menus`로 통합

---

## 4. 파일 변경 목록 (전체)

### Phase 0 (긴급)
| 작업 | 파일 | 유형 |
|------|------|------|
| Nav/Footer 제거 | `apps/portal-web/src/pages/public/LandingPage.tsx` | 수정 |
| Header 투명 모드 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 수정 |
| Footer 개선 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 수정 |

### Phase 1 (DB + API)
| 작업 | 파일 | 유형 |
|------|------|------|
| DDL | `sql/amb_cms_site_config.sql` | 신규 |
| Entity | `apps/api/src/domain/site-management/entity/cms-site-config.entity.ts` | 신규 |
| DTO | `apps/api/src/domain/site-management/dto/update-site-config.dto.ts` | 신규 |
| Mapper | `apps/api/src/domain/site-management/mapper/cms-site-config.mapper.ts` | 신규 |
| Service | `apps/api/src/domain/site-management/service/cms-site-config.service.ts` | 신규 |
| Admin Controller | `apps/api/src/domain/site-management/controller/cms-site-config.controller.ts` | 신규 |
| Public Controller | `apps/api/src/domain/site-management/controller/cms-public.controller.ts` | 수정 |
| Module | `apps/api/src/domain/site-management/site-management.module.ts` | 수정 |
| App Module | `apps/api/src/app.module.ts` | 수정 |
| Seed Service | `apps/api/src/domain/site-management/service/cms-seed.service.ts` | 수정 |

### Phase 2 (portal-web)
| 작업 | 파일 | 유형 |
|------|------|------|
| 타입 정의 | `apps/portal-web/src/types/site-config.ts` | 신규 |
| API 확장 | `apps/portal-web/src/lib/cms-api.ts` | 수정 |
| React Query 훅 | `apps/portal-web/src/hooks/useSiteConfig.ts` | 신규 |
| CmsHeader | `apps/portal-web/src/components/layout/CmsHeader.tsx` | 신규 |
| CmsNavItem | `apps/portal-web/src/components/layout/CmsNavItem.tsx` | 신규 |
| CmsHeaderAction | `apps/portal-web/src/components/layout/CmsHeaderAction.tsx` | 신규 |
| MobileDrawer | `apps/portal-web/src/components/layout/MobileDrawer.tsx` | 신규 |
| CmsFooter | `apps/portal-web/src/components/layout/CmsFooter.tsx` | 신규 |
| PublicLayout | `apps/portal-web/src/pages/public/PublicLayout.tsx` | 수정 |
| LandingPage | `apps/portal-web/src/pages/public/LandingPage.tsx` | 수정 |

### Phase 3 (ambKMS Editor)
| 작업 | 파일 | 유형 |
|------|------|------|
| 라우터 | `apps/web/src/router/index.tsx` | 수정 |
| Service | `apps/web/src/domain/site-management/service/site-config.service.ts` | 신규 |
| Hook | `apps/web/src/domain/site-management/hooks/useSiteConfig.ts` | 신규 |
| SiteConfigPage | `apps/web/src/domain/site-management/pages/SiteConfigPage.tsx` | 신규 |
| HeaderEditorPage | `apps/web/src/domain/site-management/pages/HeaderEditorPage.tsx` | 신규 |
| FooterEditorPage | `apps/web/src/domain/site-management/pages/FooterEditorPage.tsx` | 신규 |
| SiteMetaEditorPage | `apps/web/src/domain/site-management/pages/SiteMetaEditorPage.tsx` | 신규 |
| Header 탭 컴포넌트 (6개) | `apps/web/src/domain/site-management/components/header/*.tsx` | 신규 |
| Footer 탭 컴포넌트 (5개) | `apps/web/src/domain/site-management/components/footer/*.tsx` | 신규 |
| Preview 컴포넌트 (2개) | `apps/web/src/domain/site-management/components/preview/*.tsx` | 신규 |
| PublishButton | `apps/web/src/domain/site-management/components/PublishButton.tsx` | 신규 |
| VersionHistory | `apps/web/src/domain/site-management/components/VersionHistory.tsx` | 신규 |
| i18n 번역 | `apps/web/src/locales/{ko,en,vi}/siteConfig.json` | 신규 |

---

## 5. 검증 기준

### Phase 0 검증
- [ ] portal-web 랜딩 페이지에서 Header가 1번만 렌더링됨
- [ ] portal-web 랜딩 페이지에서 Footer가 1번만 렌더링됨
- [ ] 다른 CMS 페이지 (`/page/:slug`)에서 Header/Footer 정상 표시
- [ ] 모바일 반응형 정상 작동

### Phase 1 검증
- [ ] `amb_cms_site_config` 테이블 정상 생성
- [ ] Admin API: 설정 조회/수정/발행 정상 동작
- [ ] Public API: `/cms/public/site-config` 발행된 데이터 반환
- [ ] 시드 데이터 정상 삽입 (HEADER, FOOTER, SITE_META)
- [ ] SUPER_ADMIN이 아닌 사용자 접근 시 403

### Phase 2 검증
- [ ] CmsHeader: 로고, GNB 메뉴, 언어 전환, CTA/로그인 버튼 렌더링
- [ ] CmsHeader: 랜딩 페이지 투명→스크롤 solid 전환
- [ ] CmsFooter: 3컬럼 레이아웃, 소셜 링크, copyright 렌더링
- [ ] API 실패 시 Fallback Header/Footer 표시
- [ ] 모바일 햄버거 메뉴 + 드로어 정상 작동

### Phase 3 검증
- [ ] ambKMS 사이트 설정 메뉴 진입 (SUPER_ADMIN)
- [ ] Header 편집 → 미리보기 → 발행 → portal-web 반영
- [ ] Footer 편집 → 미리보기 → 발행 → portal-web 반영
- [ ] 버전 이력 조회 정상
- [ ] ADMIN 이하 권한으로 접근 시 메뉴 미표시

---

## 6. 일정 요약

| Phase | 기간 | 작업 내용 |
|-------|------|----------|
| Phase 0 | 1일 | LandingPage 중복 Nav/Footer 제거, PublicLayout 통합 |
| Phase 1 | 3~5일 | DB 테이블, Entity, Service, Controller, 시드 |
| Phase 2 | 3~5일 | CmsHeader/CmsFooter 컴포넌트, PublicLayout 리팩터링 |
| Phase 3 | 5~7일 | ambKMS 편집 UI (Header, Footer, SiteMeta 에디터) |
| **총 소요** | **약 3주** | |

---

*End of Document*
