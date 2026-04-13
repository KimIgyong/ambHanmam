# PLN-260412 — Landing Page Email Subscription 구현 계획

## 1. 시스템 개발 현황 분석

### 1.1 핵심 발견: 백엔드 + 라우팅 모두 준비 완료

| 구성 요소 | 현황 | 추가 작업 |
|-----------|------|-----------|
| **CMS Subscribe API** | `POST /api/v1/cms/public/pages/:slug/subscribe` 완전 구현 | 없음 |
| **CMS Subscriber Entity** | `amb_cms_subscribers` 테이블 + TypeORM 엔티티 완료 | 없음 |
| **중복 방지** | email + page UNIQUE 제약 + ConflictException 처리 | 없음 |
| **Nginx 라우팅** | `www.amoeba.site/api/v1/cms/*` → `apps/api (3009)` 라우팅 설정 완료 | 없음 |
| **CMS Page (home)** | slug=`home`, type=LANDING, status=PUBLISHED 존재 | 이 페이지를 구독 대상으로 사용 |
| **프론트엔드 구독 UI** | 없음 | **신규 구현 필요** |
| **i18n 번역 키** | 없음 | **신규 추가 필요** |
| **GA4 이벤트** | 없음 | **신규 추가 필요** |

### 1.2 API 호출 경로 (확정)

```
[portal-web]                     [nginx]                    [apps/api]
www.amoeba.site ──→ /api/v1/cms/* ──→ 127.0.0.1:3009 ──→ CmsPublicController
                    (nginx route)        (apps/api)
```

- portal-web의 `cms-api.ts`가 `/api/v1/cms/public/*`로 호출
- nginx가 `/api/v1/cms/*`를 apps/api(3009)로 프록시
- **CORS 이슈 없음** — 동일 도메인 내 nginx 프록시

### 1.3 구독 대상 페이지

기존 `home` 페이지 (slug=`home`, status=`PUBLISHED`)를 구독 대상으로 사용:
- `POST /api/v1/cms/public/pages/home/subscribe`
- 별도 CMS Page INSERT 불필요

---

## 2. 단계별 구현 계획

### Phase 1: i18n 번역 키 추가

**목표**: 구독 폼에 필요한 번역 키를 3개 언어로 추가

**추가 키**:

| Key | KO | EN | VI |
|-----|----|----|-----|
| `subscribe.title` | 제품 소식을 받아보세요 | Stay updated with our news | Nhận tin tức sản phẩm |
| `subscribe.placeholder` | 이메일 주소 입력 | Enter your email address | Nhập địa chỉ email |
| `subscribe.button` | 구독하기 | Subscribe | Đăng ký |
| `subscribe.success` | 구독해주셔서 감사합니다! | Thank you for subscribing! | Cảm ơn bạn đã đăng ký! |
| `subscribe.duplicate` | 이미 구독 중인 이메일입니다 | This email is already subscribed | Email này đã được đăng ký |
| `subscribe.error` | 잠시 후 다시 시도해주세요 | Please try again later | Vui lòng thử lại sau |
| `subscribe.privacy` | 구독 시 개인정보 처리방침에 동의합니다 | By subscribing, you agree to our Privacy Policy | Đăng ký đồng nghĩa bạn đồng ý Chính sách bảo mật |

**변경 파일**:
- `apps/portal-web/src/locales/ko/common.json`
- `apps/portal-web/src/locales/en/common.json`
- `apps/portal-web/src/locales/vi/common.json`

**사이드 임팩트**: 없음 (키 추가만)

---

### Phase 2: API 호출 함수 추가

**목표**: cms-api.ts에 subscribe 호출 함수 추가

**변경 파일**: `apps/portal-web/src/lib/cms-api.ts`

```typescript
// 추가할 함수
subscribe: (slug: string, email: string, name?: string) =>
  api
    .post(`/cms/public/pages/${slug}/subscribe`, { email, name })
    .then((r) => r.data),
```

**사이드 임팩트**: 없음 (함수 추가만, 기존 코드 변경 없음)

---

### Phase 3: LandingPage 구독 폼 UI 구현

**목표**: CTA 섹션 하단에 이메일 구독 인라인 폼 추가

**변경 파일**: `apps/portal-web/src/pages/public/LandingPage.tsx`

**배치 위치**: CTA 섹션의 기존 버튼 2개 아래, contact 이메일 위

**UI 구조**:
```
┌─────────────────────────────────────────────┐
│  [➜ 무료 시작]  [도입 상담 문의]             │
│                                              │
│  ──────── or ────────                        │
│                                              │
│  📬 제품 소식을 받아보세요                   │
│  ┌─────────────────────┬────────────┐        │
│  │ your@email.com      │ 구독하기   │        │
│  └─────────────────────┴────────────┘        │
│  구독 시 개인정보 처리방침에 동의합니다       │
│                                              │
│  📧 contact@amoeba.group · 🌐 ...           │
└─────────────────────────────────────────────┘
```

**상태 관리** (로컬 useState):
- `email: string` — 입력값
- `status: 'idle' | 'loading' | 'success' | 'duplicate' | 'error'` — 제출 상태

**동작**:
1. 이메일 포맷 검증 (정규식)
2. API 호출: `cmsApi.subscribe('home', email)`
3. 성공 → status='success', 3~5초 후 리셋
4. 409 → status='duplicate'
5. 기타 에러 → status='error'

**디자인 톤**: 기존 CTA 섹션의 navy 배경 + 흰색/반투명 UI 유지

**사이드 임팩트**: LandingPage.tsx만 수정, CTA 섹션 레이아웃 변경

---

### Phase 4: GA4 이벤트 추적

**목표**: 구독 시도/성공/실패 이벤트 추적

**변경 파일**: `apps/portal-web/src/lib/ga-events.ts`

**추가 이벤트**:

| Event | Parameters | 시점 |
|-------|-----------|------|
| `newsletter_subscribe_attempt` | — | Subscribe 버튼 클릭 |
| `newsletter_subscribe_success` | `email_domain: string` | API 성공 응답 |
| `newsletter_subscribe_duplicate` | — | 409 중복 응답 |

**사이드 임팩트**: 없음 (함수 추가만)

---

## 3. 변경 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|-----------|------|
| `apps/portal-web/src/locales/ko/common.json` | 수정 | subscribe 키 추가 |
| `apps/portal-web/src/locales/en/common.json` | 수정 | subscribe 키 추가 |
| `apps/portal-web/src/locales/vi/common.json` | 수정 | subscribe 키 추가 |
| `apps/portal-web/src/lib/cms-api.ts` | 수정 | subscribe 함수 추가 |
| `apps/portal-web/src/lib/ga-events.ts` | 수정 | 구독 GA4 이벤트 추가 |
| `apps/portal-web/src/pages/public/LandingPage.tsx` | 수정 | 구독 폼 UI 추가 |

**신규 생성 파일**: 없음
**백엔드 변경**: 없음
**DB 변경**: 없음 (기존 home 페이지 사용)

---

## 4. 사이드 임팩트 분석

| 영향 범위 | 분석 | 위험도 |
|-----------|------|--------|
| **LandingPage CTA 섹션** | 기존 버튼 2개 아래에 구독 폼 추가 — 레이아웃 확장 | 낮음 |
| **CMS Subscribe API** | 기존 API 그대로 사용, 코드 변경 없음 | 없음 |
| **amb_cms_subscribers 테이블** | 기존 home 페이지에 구독자 추가됨 | 없음 |
| **기존 CMS 메뉴/페이지** | 영향 없음 | 없음 |
| **portal-api** | 변경 없음 | 없음 |
| **apps/api** | 변경 없음 | 없음 |
| **GA4 기존 이벤트** | 기존 이벤트와 독립적 | 없음 |
| **i18n 번역 파일** | 키 추가만, 기존 키 변경 없음 | 없음 |

**총 위험도**: **매우 낮음** — 프론트엔드만 수정, 백엔드/DB 변경 없음

---

## 5. DB 마이그레이션

**필요 없음**

- `amb_cms_subscribers` 테이블: TypeORM synchronize로 이미 생성됨 (apps/api 엔티티 등록)
- `amb_cms_pages` home 레코드: 이미 존재 (E06D5E65-...)
- 추가 SQL 없음

---

## 6. 배포 계획

| 단계 | 작업 |
|------|------|
| 1 | 로컬 개발 + 빌드 검증 (`npm run -w @amb/portal-web build`) |
| 2 | main 브랜치 커밋/푸시 |
| 3 | 스테이징 배포 + 테스트 (선택) |
| 4 | production 머지 + 프로덕션 배포 |

**배포 대상**: portal-web 컨테이너만 (amb-portal-web-production)
**다운타임**: 없음 (프론트엔드 정적 빌드 교체)
