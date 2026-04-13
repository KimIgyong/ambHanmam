# 작업 계획서: 포탈 회원가입 GDPR 약관 동의

> 문서 ID: PLAN-포탈회원가입-GDPR약관동의-작업계획-20260328
> 작성일: 2026-03-28
> 기반 문서: REQ-포탈회원가입-GDPR약관동의-20260327
> 앱: portal-web + portal-api

---

## 1. 시스템 개발 현황 분석

### 1.1 대상 시스템 구조

```
apps/portal-web/                        # React + Vite (포트 5180)
├── src/
│   ├── pages/auth/RegisterPage.tsx      # 회원가입 페이지 (수정 대상)
│   ├── pages/public/PublicLayout.tsx     # 공통 레이아웃 (쿠키 배너 삽입 위치)
│   ├── pages/public/CmsPage.tsx         # CMS 페이지 렌더러 (STATIC 타입 = 약관)
│   ├── components/layout/CmsFooter.tsx  # 풋터 (쿠키 설정 링크 추가)
│   ├── components/layout/CmsHeader.tsx  # 헤더
│   ├── components/cms/SectionRenderer.tsx
│   ├── stores/auth.store.ts             # Zustand 인증 스토어
│   ├── lib/api.ts                       # Axios API 클라이언트
│   ├── lib/cms-api.ts                   # CMS API 클라이언트
│   ├── hooks/useSiteConfig.ts           # 사이트 설정 훅
│   ├── locales/{en,ko,vi}/common.json   # i18n 번역 파일
│   └── router/index.tsx                 # 라우트 설정

apps/portal-api/                        # NestJS (포트 3010)
├── src/domain/auth/
│   ├── controller/portal-auth.controller.ts
│   ├── service/portal-auth.service.ts
│   ├── dto/request/register.request.ts  # 수정 대상
│   ├── entity/portal-customer.entity.ts # 수정 대상
│   ├── auth.module.ts
│   ├── guard/portal-jwt-auth.guard.ts
│   └── strategy/portal-jwt.strategy.ts
```

### 1.2 기술 스택 (portal-web)

| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| react | UI 프레임워크 | ^18.2.0 |
| react-hook-form | 폼 관리 | ^7.51.0 |
| zod + @hookform/resolvers | 폼 유효성 검증 | ^3.22.0 |
| zustand | 상태 관리 | ^4.5.0 |
| react-i18next | 다국어 | ^16.5.4 |
| tailwindcss | CSS | ^3.4.0 |
| lucide-react | 아이콘 | ^0.356.0 |
| axios | HTTP 클라이언트 | ^1.6.0 |
| **쿠키 라이브러리** | **없음** | **신규 불필요 (localStorage 사용)** |

### 1.3 CMS 시스템 현황

- `/page/:slug` 라우트가 `CmsPage.tsx`에서 처리
- STATIC 타입 페이지: HTML 콘텐츠를 `dangerouslySetInnerHTML`로 렌더링
- 다국어 콘텐츠: `page.contents[]`에서 `lang` 필드로 필터링
- 약관/정책 문서를 CMS STATIC 페이지로 등록하면 별도 프론트엔드 코드 불필요
- CMS 페이지 등록은 portal-api의 `/cms/` 엔드포인트 또는 DB 직접 INSERT

### 1.4 기존 데이터 현황

- `amb_svc_portal_customers` 테이블: 기존 레코드에 `pct_company_name`, `pct_phone`, `pct_country`가 NULL인 행이 존재할 수 있음
- 스테이징/프로덕션: `synchronize: false` → 수동 SQL 마이그레이션 필수

---

## 2. 단계별 구현 계획

### Phase 1: 회원가입 폼 변경 (필수 필드 + 순서 + 약관)

#### Step 1-1. 백엔드 — DTO 필수 필드 전환 + 약관 필드 추가

**파일**: `apps/portal-api/src/domain/auth/dto/request/register.request.ts`

**변경 내용**:
```typescript
// AS-IS
@IsOptional()
@IsString()
@MaxLength(300)
company_name?: string;

@IsOptional()
@IsString()
@MaxLength(30)
phone?: string;

@IsOptional()
@IsString()
@MaxLength(5)
country?: string;

// TO-BE
@IsString()
@MinLength(1, { message: 'Company name is required' })
@MaxLength(300)
company_name: string;             // optional → required

@IsString()
@MinLength(1, { message: 'Phone number is required' })
@MaxLength(30)
phone: string;                    // optional → required

@IsString()
@MinLength(1, { message: 'Country is required' })
@MaxLength(5)
country: string;                  // optional → required

// 신규 필드
@IsBoolean()
terms_agreed: boolean;            // 서비스 이용약관 동의 (true 강제)

@IsBoolean()
privacy_agreed: boolean;          // 개인정보보호 동의 (true 강제)

@IsOptional()
@IsBoolean()
marketing_agreed?: boolean;       // 마케팅 수신 동의 (선택)
```

**사이드 임팩트**: 기존 API를 호출하는 프론트엔드가 즉시 영향받음 → 프론트엔드 동시 배포 필요

---

#### Step 1-2. 백엔드 — 엔티티 약관 관련 컬럼 추가

**파일**: `apps/portal-api/src/domain/auth/entity/portal-customer.entity.ts`

**추가 컬럼**:
```typescript
@Column({ name: 'pct_terms_agreed_at', type: 'timestamptz', nullable: true })
pctTermsAgreedAt?: Date;

@Column({ name: 'pct_privacy_agreed_at', type: 'timestamptz', nullable: true })
pctPrivacyAgreedAt?: Date;

@Column({ name: 'pct_marketing_agreed_at', type: 'timestamptz', nullable: true })
pctMarketingAgreedAt?: Date;

@Column({ name: 'pct_terms_version', type: 'varchar', length: 20, nullable: true })
pctTermsVersion?: string;

@Column({ name: 'pct_privacy_version', type: 'varchar', length: 20, nullable: true })
pctPrivacyVersion?: string;
```

**사이드 임팩트**: DB 스키마 변경 → 스테이징/프로덕션 수동 SQL 필요

---

#### Step 1-3. 백엔드 — 서비스 로직 수정

**파일**: `apps/portal-api/src/domain/auth/service/portal-auth.service.ts`

**변경 내용** (`register()` 메서드):
```typescript
// 약관 동의 검증 (추가 안전장치)
if (!dto.terms_agreed || !dto.privacy_agreed) {
  throw new BadRequestException('Terms and privacy agreement is required');
}

// customer 생성 시 약관 정보 저장
const now = new Date();
customer.pctTermsAgreedAt = now;
customer.pctPrivacyAgreedAt = now;
customer.pctTermsVersion = 'v1.0';
customer.pctPrivacyVersion = 'v1.0';
if (dto.marketing_agreed) {
  customer.pctMarketingAgreedAt = now;
}

// company_name, phone, country → 필수이므로 undefined fallback 제거
customer.pctPhone = dto.phone;
customer.pctCompanyName = dto.company_name;
customer.pctCountry = dto.country;

// client 생성 시도 동일 업데이트
client.cliCompanyName = dto.company_name;
client.cliCountry = dto.country;
```

**사이드 임팩트**: 없음 (register() 내부 로직만 변경)

---

#### Step 1-4. 프론트엔드 — RegisterPage.tsx 전면 수정

**파일**: `apps/portal-web/src/pages/auth/RegisterPage.tsx`

**Zod 스키마 변경**:
```typescript
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(PASSWORD_REGEX),
  name: z.string().min(1),
  company_name: z.string().min(1),        // optional → required
  country: z.string().min(1),              // optional → required
  phone: z.string().min(1),               // optional → required
  terms_agreed: z.literal(true, {
    errorMap: () => ({ message: 'terms_required' }),
  }),
  privacy_agreed: z.literal(true, {
    errorMap: () => ({ message: 'privacy_required' }),
  }),
  marketing_agreed: z.boolean().optional(),
});
```

**폼 필드 순서 변경** (JSX):
1. 이름 (name) *
2. 이메일 (email) *
3. 비밀번호 (password) *
4. 회사명 (company_name) * — 독립 행, full-width
5. 국가 (country) * — 독립 행, full-width, 확장된 국가 목록
6. 전화번호 (phone) * — 독립 행, full-width
7. ─── 구분선 ───
8. 약관 동의 영역 (TermsAgreementSection 컴포넌트 분리)

**국가 목록 확장**: 하드코딩 5개 → 별도 데이터 파일 (`data/countries.ts`) 20+ 국가

**약관 동의 UI**:
- 전체 동의 체크박스 (컨트롤러 역할, 폼 필드 아님)
- 서비스 이용약관 동의 (필수) + [보기] 링크 → 새 탭 `/page/terms-of-service`
- 개인정보보호 동의 (필수) + [보기] 링크 → 새 탭 `/page/privacy-policy`
- 마케팅 수신 동의 (선택)

**사이드 임팩트**: auth.store.ts의 `RegisterData` 인터페이스도 수정 필요

---

#### Step 1-5. 프론트엔드 — auth.store.ts 인터페이스 수정

**파일**: `apps/portal-web/src/stores/auth.store.ts`

**변경**:
```typescript
interface RegisterData {
  email: string;
  password: string;
  name: string;
  company_name: string;      // optional → required
  phone: string;             // optional → required
  country: string;           // optional → required
  terms_agreed: boolean;     // 신규
  privacy_agreed: boolean;   // 신규
  marketing_agreed?: boolean; // 신규 (선택)
}
```

---

#### Step 1-6. 프론트엔드 — 국가 데이터 파일 생성

**신규 파일**: `apps/portal-web/src/data/countries.ts`

```typescript
export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  nameEn: string;
  nameKo: string;
  nameVi: string;
  dialCode: string;   // 국제 전화 코드
}

export const COUNTRIES: Country[] = [
  { code: 'KR', nameEn: 'South Korea', nameKo: '대한민국', nameVi: 'Hàn Quốc', dialCode: '+82' },
  { code: 'VN', nameEn: 'Vietnam', nameKo: '베트남', nameVi: 'Việt Nam', dialCode: '+84' },
  { code: 'US', nameEn: 'United States', nameKo: '미국', nameVi: 'Hoa Kỳ', dialCode: '+1' },
  { code: 'JP', nameEn: 'Japan', nameKo: '일본', nameVi: 'Nhật Bản', dialCode: '+81' },
  { code: 'SG', nameEn: 'Singapore', nameKo: '싱가포르', nameVi: 'Singapore', dialCode: '+65' },
  // ... 15+ 추가 국가
];
```

---

#### Step 1-7. 프론트엔드 — i18n 번역 키 추가

**파일 3개**: `apps/portal-web/src/locales/{en,ko,vi}/common.json`

**추가 키 (auth 네임스페이스 하위)**:
```json
{
  "auth": {
    "company_name_required": "Company name is required",
    "country_required": "Please select a country",
    "phone_required": "Phone number is required",
    "terms_agreement_title": "Terms & Conditions",
    "agree_all": "I agree to all terms and conditions",
    "terms_agree": "I agree to the Terms of Service",
    "terms_agree_required": "(Required)",
    "privacy_agree": "I agree to the Privacy Policy",
    "privacy_agree_required": "(Required)",
    "marketing_agree": "I agree to receive marketing communications",
    "marketing_agree_optional": "(Optional)",
    "view_terms": "View Terms",
    "view_privacy": "View Policy",
    "terms_required": "You must agree to the Terms of Service",
    "privacy_required": "You must agree to the Privacy Policy"
  }
}
```

동일 키를 한국어/베트남어로 번역하여 각 파일에 추가.

---

#### Step 1-8. DB 마이그레이션 SQL

**스테이징/프로덕션 배포 전 실행**:

```sql
-- 1) 약관 관련 컬럼 추가
ALTER TABLE amb_svc_portal_customers 
  ADD COLUMN IF NOT EXISTS pct_terms_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pct_privacy_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pct_marketing_agreed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pct_terms_version VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pct_privacy_version VARCHAR(20);

-- 2) 기존 NULL 데이터 기본값 설정 (필수화 전 처리)
-- 주의: 기존 레코드가 있을 경우에만 실행
UPDATE amb_svc_portal_customers 
SET pct_company_name = COALESCE(pct_company_name, ''),
    pct_phone = COALESCE(pct_phone, ''),
    pct_country = COALESCE(pct_country, '')
WHERE pct_company_name IS NULL OR pct_phone IS NULL OR pct_country IS NULL;

-- 3) NOT NULL 제약 추가 (선택사항 - 앱 레벨에서만 필수화하는 것도 가능)
-- 기존 데이터 호환을 위해 앱 레벨 필수화 권장, DB NOT NULL은 Phase 2 이후 검토
```

---

### Phase 2: 쿠키 동의 시스템

#### Step 2-1. 쿠키 동의 상태 관리 훅

**신규 파일**: `apps/portal-web/src/hooks/useCookieConsent.ts`

**설계**:
```typescript
interface CookieConsent {
  necessary: true;        // 항상 true (비활성화 불가)
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  consentedAt: string;    // ISO 날짜
}

// localStorage 키: 'cookie_consent'
// 상태: null = 미동의 (배너 표시), 값 존재 = 동의 완료 (배너 숨김)

export function useCookieConsent() {
  // consent 상태 가져오기
  // acceptAll() - 전체 허용
  // acceptNecessaryOnly() - 필수만
  // updateConsent(partial) - 개별 설정
  // resetConsent() - 동의 초기화 (배너 재표시)
  // hasConsented - 동의 여부
}
```

---

#### Step 2-2. 쿠키 동의 배너 컴포넌트

**신규 파일**: `apps/portal-web/src/components/consent/CookieConsentBanner.tsx`

**설계**:
- 위치: 화면 하단 `fixed bottom-0 left-0 right-0 z-50`
- 조건: `!hasConsented` 일 때만 표시
- 버튼: "모두 허용" / "필수만 허용" / "쿠키 설정"
- 반응형: 모바일(세로 스택) / 데스크톱(가로 배치)
- i18n: 3개 언어 지원

---

#### Step 2-3. 쿠키 설정 모달 컴포넌트

**신규 파일**: `apps/portal-web/src/components/consent/CookieSettingsModal.tsx`

**설계**:
- 트리거: 배너의 "쿠키 설정" 버튼 또는 풋터 링크
- UI: 모달 오버레이 + 카테고리별 토글 스위치
- 카테고리:
  - 필수 쿠키: 설명 + 토글(항상 ON, disabled)
  - 분석 쿠키: 설명 + 토글
  - 마케팅 쿠키: 설명 + 토글
  - 기능 쿠키: 설명 + 토글
- 버튼: "설정 저장" / "모두 허용"

---

#### Step 2-4. PublicLayout에 쿠키 배너 삽입

**파일**: `apps/portal-web/src/pages/public/PublicLayout.tsx`

**변경 내용**:
```tsx
// AS-IS
return (
  <div className="min-h-screen flex flex-col">
    <CmsHeader ... />
    <main className="flex-1"><Outlet /></main>
    <CmsFooter ... />
  </div>
);

// TO-BE
return (
  <div className="min-h-screen flex flex-col">
    <CmsHeader ... />
    <main className="flex-1"><Outlet /></main>
    <CmsFooter ... />
    <CookieConsentBanner />       {/* 추가 */}
  </div>
);
```

---

#### Step 2-5. 풋터에 쿠키 설정 링크 추가

**방식 선택 (2가지)**:
- **A안**: CmsFooter의 `bottomLinks`에 CMS에서 "Cookie Settings" 링크 추가 (DB 설정)
- **B안**: CmsFooter.tsx에 하드코딩으로 "cookie settings" 버튼 추가 (onClick → 모달)
- **권장**: **B안** — 이 버튼은 모달을 여는 JS 이벤트이므로 Link보다 button이 적합

---

#### Step 2-6. i18n 쿠키 관련 번역 키 추가

```json
{
  "cookie": {
    "banner_title": "We use cookies",
    "banner_desc": "We use cookies to improve your experience. See our Cookie Policy for details.",
    "accept_all": "Accept All",
    "accept_necessary": "Necessary Only",
    "cookie_settings": "Cookie Settings",
    "settings_title": "Cookie Preferences",
    "settings_desc": "Manage your cookie preferences. Necessary cookies are always active.",
    "category_necessary": "Strictly Necessary",
    "category_necessary_desc": "Essential for site functionality (authentication, security).",
    "category_analytics": "Analytics",
    "category_analytics_desc": "Help us understand how visitors interact with our site.",
    "category_marketing": "Marketing",
    "category_marketing_desc": "Used to deliver personalized advertisements.",
    "category_functional": "Functional",
    "category_functional_desc": "Enable enhanced functionality (language preference, theme).",
    "save_settings": "Save Preferences",
    "always_active": "Always Active"
  }
}
```

---

### Phase 3: 약관 문서 페이지

#### Step 3-1. CMS STATIC 페이지 등록 — 서비스 이용약관

**방식**: portal-api CMS 엔드포인트 또는 DB 직접 INSERT

**대상 테이블**: `amb_cms_pages` + `amb_cms_page_contents`

- slug: `terms-of-service`
- type: `STATIC`
- status: `PUBLISHED`
- contents: 3개 언어 (en, ko, vi) HTML 본문

**약관 내용 구조** (HTML):
1. 서비스 개요 — AMA(Amoeba Management Assistant) 트라이얼 서비스
2. 이용 자격 — 만 16세 이상, 법인/개인사업자
3. 서비스 범위 — AI 에이전트, KMS, HR, 회계, 프로젝트 관리 등
4. 계정 책임 — 비밀번호 관리, 부정 사용 금지
5. 지적재산권 — 아메바컴퍼니 귀속
6. 서비스 중단/변경 — 사전 고지, 불가항력 면책
7. 무료 트라이얼 제한 — 기간, 데이터 보관
8. 책임 제한
9. 약관 변경 — 30일 전 고지
10. 분쟁 해결 — 중재/관할법원
11. 준거법 — 대한민국 법

---

#### Step 3-2. CMS STATIC 페이지 등록 — 개인정보보호 정책

- slug: `privacy-policy`
- type: `STATIC`
- status: `PUBLISHED`

**내용 구조** (GDPR Article 13/14 기준):
1. 데이터 컨트롤러 — Amoeba Company (아메바컴퍼니), 연락처
2. DPO 연락처
3. 수집 항목 — 이름, 이메일, 전화번호, 회사명, 국가, IP, 브라우저 정보
4. 수집 목적 — 서비스 제공, 계정 관리, 커뮤니케이션
5. 법적 근거 — 동의(Art.6(1)(a)), 계약이행(Art.6(1)(b))
6. 데이터 보유 기간 — 회원 탈퇴 시까지, 로그 1년
7. 제3자 제공 — Stripe(결제), AWS(인프라)
8. 국제 이전 — 한국/베트남 서버, 적절한 보호조치
9. 정보주체 권리 — 접근/정정/삭제/이동/처리제한/반대/자동의사결정 거부
10. 감독기관 민원 — 한국 개인정보보호위원회
11. 쿠키 — Cookie Policy 참조
12. 정책 변경 — 이메일 또는 사이트 고지

---

#### Step 3-3. CMS STATIC 페이지 등록 — 쿠키 정책

- slug: `cookie-policy`
- type: `STATIC`
- status: `PUBLISHED`

**내용 구조**:
1. 쿠키란 무엇인가
2. 사용하는 쿠키 유형 (필수/분석/마케팅/기능)
3. 각 쿠키 목록 — 이름, 목적, 보유기간, 제3자
4. 쿠키 관리 방법 — 브라우저 설정 + 사이트 쿠키 설정
5. 연락처

---

#### Step 3-4. SQL — CMS 페이지 INSERT

```sql
-- terms-of-service 페이지 등록
INSERT INTO amb_cms_pages (cmp_id, ent_id, cmp_type, cmp_title, cmp_slug, cmp_status, cmp_published_at, cmp_created_at, cmp_updated_at)
VALUES (gen_random_uuid(), NULL, 'STATIC', 'Terms of Service', 'terms-of-service', 'PUBLISHED', NOW(), NOW(), NOW());

-- 영어 콘텐츠
INSERT INTO amb_cms_page_contents (cpc_id, cmp_id, cpc_lang, cpc_content, cpc_created_at, cpc_updated_at)
VALUES (gen_random_uuid(), (SELECT cmp_id FROM amb_cms_pages WHERE cmp_slug = 'terms-of-service'), 'en', '<h1>Terms of Service</h1>...', NOW(), NOW());

-- 한국어/베트남어 동일 패턴으로 INSERT

-- privacy-policy, cookie-policy 동일 패턴
```

---

## 3. 변경 파일 목록 요약

### 3.1 수정 파일

| # | 파일 경로 | 변경 유형 | Phase |
|---|---------|----------|-------|
| 1 | `apps/portal-api/src/domain/auth/dto/request/register.request.ts` | 필수 필드 전환 + 약관 필드 추가 | 1 |
| 2 | `apps/portal-api/src/domain/auth/entity/portal-customer.entity.ts` | 약관 컬럼 5개 추가 | 1 |
| 3 | `apps/portal-api/src/domain/auth/service/portal-auth.service.ts` | register() 약관 저장 로직 | 1 |
| 4 | `apps/portal-web/src/pages/auth/RegisterPage.tsx` | 폼 전면 재구성 | 1 |
| 5 | `apps/portal-web/src/stores/auth.store.ts` | RegisterData 인터페이스 | 1 |
| 6 | `apps/portal-web/src/locales/en/common.json` | 약관+쿠키 번역 키 추가 | 1, 2 |
| 7 | `apps/portal-web/src/locales/ko/common.json` | 약관+쿠키 번역 키 추가 | 1, 2 |
| 8 | `apps/portal-web/src/locales/vi/common.json` | 약관+쿠키 번역 키 추가 | 1, 2 |
| 9 | `apps/portal-web/src/pages/public/PublicLayout.tsx` | CookieConsentBanner 삽입 | 2 |
| 10 | `apps/portal-web/src/components/layout/CmsFooter.tsx` | 쿠키 설정 버튼 추가 | 2 |

### 3.2 신규 파일

| # | 파일 경로 | 설명 | Phase |
|---|---------|------|-------|
| 1 | `apps/portal-web/src/data/countries.ts` | 국가 코드+이름+전화코드 목록 | 1 |
| 2 | `apps/portal-web/src/hooks/useCookieConsent.ts` | 쿠키 동의 localStorage 훅 | 2 |
| 3 | `apps/portal-web/src/components/consent/CookieConsentBanner.tsx` | 쿠키 동의 배너 | 2 |
| 4 | `apps/portal-web/src/components/consent/CookieSettingsModal.tsx` | 쿠키 설정 모달 | 2 |

### 3.3 DB 변경 (수동 SQL)

| # | 내용 | 대상 | Phase |
|---|------|------|-------|
| 1 | `amb_svc_portal_customers` 약관 컬럼 5개 추가 | 스테이징 + 프로덕션 | 1 |
| 2 | 기존 NULL 데이터 기본값 설정 | 스테이징 + 프로덕션 | 1 |
| 3 | CMS 페이지 3건 INSERT (terms/privacy/cookie) | 스테이징 + 프로덕션 | 3 |

---

## 4. 사이드 임팩트 분석

| # | 영향 | 심각도 | 대처 |
|---|------|--------|------|
| 1 | DTO 필수 필드 변경 → 기존 프론트엔드 미호환 | 🔴 높음 | 프론트엔드+백엔드 동시 배포 |
| 2 | DB 컬럼 추가 → synchronize:false 환경 누락 가능 | 🔴 높음 | 배포 전 수동 SQL 실행 |
| 3 | 기존 가입 사용자 약관 동의 기록 없음 | 🟡 중간 | nullable 컬럼으로 처리, 기존 사용자 재동의는 Phase 4 |
| 4 | CMS 페이지 미등록 시 약관 링크 404 | 🟡 중간 | Phase 3 먼저 완료 후 Phase 1 배포 |
| 5 | 쿠키 배너가 모든 페이지에 표시 | 🟢 낮음 | 의도된 동작 (GDPR 요건) |
| 6 | 국가 목록 확장 → 기존 5개국 데이터 호환 | 🟢 낮음 | 상위 호환 (기존 코드도 호환) |

---

## 5. 배포 순서

```
[1단계] CMS 약관 페이지 등록 (Phase 3)
    │   ← DB INSERT만, 코드 배포 없음
    │   ← /page/terms-of-service, /page/privacy-policy, /page/cookie-policy 확인
    │
[2단계] DB 마이그레이션 (Phase 1 사전작업)
    │   ← ALTER TABLE amb_svc_portal_customers ADD COLUMN ...
    │   ← UPDATE 기존 NULL 데이터
    │
[3단계] 코드 배포 (Phase 1 + Phase 2 동시)
    │   ← portal-api: DTO + Entity + Service
    │   ← portal-web: RegisterPage + CookieBanner + i18n
    │
[4단계] 검증
    ├── /register 회원가입 테스트
    ├── 약관 링크 클릭 검증
    ├── 쿠키 배너 동작 검증
    └── 기존 로그인 영향 없음 확인
```

---

## 6. 검증 항목

### 6.1 회원가입 폼 검증

| # | 테스트 케이스 | 예상 결과 |
|---|-------------|----------|
| 1 | 모든 필드 입력 + 필수 약관 동의 → 가입 | 성공, /verify-email-sent 이동 |
| 2 | 회사명 비어있음 → 가입 | 실패, 에러 메시지 |
| 3 | 국가 미선택 → 가입 | 실패, 에러 메시지 |
| 4 | 전화번호 비어있음 → 가입 | 실패, 에러 메시지 |
| 5 | 서비스 이용약관 미체크 → 가입 | 실패, 에러 메시지 |
| 6 | 개인정보 미체크 → 가입 | 실패, 에러 메시지 |
| 7 | 마케팅 미체크 → 가입 | 성공 (선택 사항) |
| 8 | 전체 동의 체크 → 개별 항목 | 모두 체크됨 |
| 9 | 전체 동의 후 개별 해제 → 전체 동의 | 전체 동의 해제됨 |
| 10 | [약관 보기] 클릭 | 새 탭에서 약관 페이지 열림 |

### 6.2 쿠키 배너 검증

| # | 테스트 케이스 | 예상 결과 |
|---|-------------|----------|
| 1 | 최초 방문 | 쿠키 배너 표시 |
| 2 | "모두 허용" 클릭 | 배너 사라짐, 전체 동의 저장 |
| 3 | "필수만 허용" 클릭 | 배너 사라짐, 필수만 저장 |
| 4 | "쿠키 설정" → 토글 변경 → "설정 저장" | 배너 사라짐, 개별 설정 저장 |
| 5 | 새로고침 | 배너 미표시 (동의 상태 유지) |
| 6 | 풋터 "쿠키 설정" 클릭 | 설정 모달 열림 |
| 7 | localStorage 삭제 → 새로고침 | 배너 다시 표시 |

### 6.3 기존 기능 영향 검증

| # | 테스트 케이스 | 예상 결과 |
|---|-------------|----------|
| 1 | 기존 계정 로그인 | 정상 동작 |
| 2 | 기존 계정 프로필 조회 | 정상 동작 |
| 3 | 비밀번호 재설정 | 정상 동작 |
| 4 | 이메일 인증 | 정상 동작 |
| 5 | 랜딩 페이지 표시 | 정상 + 쿠키 배너 추가 |

---

## 7. 구현 예상 작업량

| Phase | 작업 | 파일 수 |
|-------|------|--------|
| Phase 1 | 회원가입 폼 + 백엔드 + SQL | 수정 8 + 신규 1 |
| Phase 2 | 쿠키 동의 시스템 | 수정 3 + 신규 3 |
| Phase 3 | 약관 문서 CMS 등록 | SQL 3건 |
| **합계** | | **수정 10 + 신규 4 + SQL** |

---

> **다음 단계**: 승인 시 Phase 3 (CMS 약관 등록) → Phase 1 (폼 + 백엔드) → Phase 2 (쿠키) 순으로 구현 진행
