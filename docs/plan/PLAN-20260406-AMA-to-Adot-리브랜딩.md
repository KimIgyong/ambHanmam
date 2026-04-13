# 작업계획서: AMA → Ạ (A-dot) 리브랜딩

- 문서번호: PLAN-20260406-AMA-to-Adot-리브랜딩
- 작성일: 2026-04-06
- 대상: portal-web (www.amoeba.site) 전체 사용자 노출 텍스트

---

## 1. 변경 규칙 (Naming Convention)

| AS-IS | TO-BE | 비고 |
|-------|-------|------|
| `AMA` | `Ạ` | 브랜드명 단독 사용 시 |
| `AMA — AI Management Assistant` | `Ạ — AI Management Assistant` | 풀네임 표기 |
| `Why AMA?` | `Why Ạ (A-dot)?` | 섹션 헤더 (en) |
| `왜 AMA인가?` | `왜 Ạ (에이닷) 인가?` | 섹션 헤더 (ko) |
| `Tại sao AMA?` | `Tại sao Ạ (A-dot)?` | 섹션 헤더 (vi) |
| `How AMA Solves It` | `How Ạ (A-dot) Solves It` | 섹션 헤더 (en) |
| `AMA가 해결하는 방식` | `Ạ (에이닷) 이 해결하는 방식` | 섹션 헤더 (ko) |
| `[Ạ] reBorn to be AI` | 유지 (이미 Ạ 사용) | LandingPage feat.reborn |
| `AMA Smart ToDo` | `Ạ Smart ToDo` | 가이드페이지 제목 |
| `AMA 로그인` | `Ạ 로그인` | CTA 버튼 텍스트 |

**변경 제외 (코드 식별자)**:
- 파일 경로: `/service/ama/*`, `AMA_SmartToDo.html` 등 (변경 시 라우팅 깨짐)
- 변수명: `AMA_URL`, `handleGoAma`, `signup_ama_*` (i18n 키 이름)
- CSS 클래스: `ama-slider-track`, `ama-typing-dot`
- 코드 주석: `(ama-price-01)` 등
- 도메인: `ama.amoeba.site`

---

## 2. 변경 대상 파일 목록

### Phase 1: 메인 페이지 (즉시 영향)

| # | 파일 | 변경 내용 | 변경 수 |
|---|------|----------|---------|
| 1 | `apps/portal-web/index.html` | title, meta description, keywords, og:title, og:site_name, twitter:title, LD+JSON | ~8건 |
| 2 | `apps/portal-web/src/pages/public/LandingPage.tsx` | T 객체 ko/en/vi 전체 (pain, feat, cycle, stats, guide 섹션) | ~30건 |
| 3 | `apps/portal-web/src/pages/public/GuidePage.tsx` | iframe title | 1건 |

### Phase 2: i18n 번역 파일 (가입/인증/가격 페이지)

| # | 파일 | 변경 내용 | 변경 수 |
|---|------|----------|---------|
| 4 | `apps/portal-web/src/locales/ko/common.json` | FAQ, 가입, 인증, 가격, 네비 등 | ~15건 |
| 5 | `apps/portal-web/src/locales/en/common.json` | FAQ, signup, auth, pricing, nav 등 | ~15건 |
| 6 | `apps/portal-web/src/locales/vi/common.json` | FAQ, signup, auth, pricing, nav 등 | ~15건 |

### Phase 3: 가이드 HTML 페이지

| # | 파일 | 변경 내용 | 변경 수 |
|---|------|----------|---------|
| 7 | `public/service/ama/AMA_SmartToDo.html` | title, logo, hero badge, 비교표, footer, i18n 객체 | ~15건 |
| 8 | `public/service/ama/app-install-guide.html` | title, .app-name, 팁 텍스트, footer | ~8건 |
| 9 | `public/service/ama/AMA_WorkTools_animated.html` | title | ~3건 |
| 10 | `public/service/ama/ama-google-drive-guide.html` | title | ~3건 |
| 11 | `public/service/ama/AMA-User-Guide-v1.html` | (AMA 텍스트 없음 — 변경 불필요) | 0건 |
| 12 | `public/service/ama/AMA-User-Manual-v1.html` | (AMA 텍스트 없음 — 변경 불필요) | 0건 |
| 13 | `public/service/ama/car-manager-ui.html` | (AMA 텍스트 없음 — 변경 불필요) | 0건 |

### Phase 4: 이미지/SEO 리소스

| # | 파일 | 변경 내용 | 변경 수 |
|---|------|----------|---------|
| 14 | `apps/portal-web/public/og-image.svg` | SVG 내 "AMA" 텍스트 → "Ạ" | 1건 |
| 15 | `apps/portal-web/public/sitemap.xml` | (URL 경로만이므로 변경 불필요) | 0건 |

---

## 3. 단계별 구현 계획

### Phase 1 — 메인 페이지 (index.html + LandingPage.tsx + GuidePage.tsx)
- `index.html`: 8개 메타태그/SEO 텍스트 치환
- `LandingPage.tsx`: T 객체 내 ko/en/vi 약 30개 값 치환
- `GuidePage.tsx`: iframe title 1개 치환
- **사이드 임팩트**: 없음 (UI 텍스트만 변경)

### Phase 2 — i18n 번역 파일 (locales/ ko/en/vi common.json)
- 각 파일 약 15개 값 치환 (FAQ, 가입, 인증, 가격, 네비 섹션)
- **사이드 임팩트**: 가입완료 페이지(SignupCompleteScreen), 가격 페이지(PricingPage), Google Onboarding 페이지에 반영
- **주의**: JSON 키 이름(`signup_ama_*`, `svc_ama_*`)은 변경하지 않음 (코드 참조 깨짐 방지)

### Phase 3 — 가이드 HTML 페이지
- `AMA_SmartToDo.html`: 가장 많은 변경 (~15건, 인라인 i18n 포함)
- `app-install-guide.html`: ~8건
- `AMA_WorkTools_animated.html`: ~3건
- `ama-google-drive-guide.html`: ~3건
- **사이드 임팩트**: 없음 (독립 HTML. 파일명은 변경하지 않아 라우팅 영향 없음)

### Phase 4 — og-image.svg
- SVG 내 `<text>` 요소 "AMA" → "Ạ" 치환
- **사이드 임팩트**: 소셜 미디어 공유 시 새 이미지 반영 (캐시 시간 소요)

---

## 4. 사이드 임팩트 분석

| 항목 | 영향 | 대응 |
|------|------|------|
| 파일 경로 `/service/ama/*` | 변경 안 함 → 영향 없음 | GuidePage.tsx slug 매핑 유지 |
| sitemap.xml URL | 파일명 불변 → 영향 없음 | 수정 불필요 |
| canonical URL | 파일명 불변 → 영향 없음 | 수정 불필요 |
| GA4 이벤트 | 이벤트명은 코드 식별자 → 변경 없음 | 영향 없음 |
| 도메인 (ama.amoeba.site) | 도메인명은 인프라 → 변경 없음 | 영향 없음 |
| apps/web (ama.amoeba.site) | 이번 범위 아님 | 별도 작업 |
| portal-api / api 백엔드 | 백엔드는 AMA 텍스트 없음 | 영향 없음 |

---

## 5. 총 변경량 추산

- **변경 파일**: 11개
- **변경 건수**: 약 100~110건 (텍스트 치환)
- **변경 불필요**: 4개 파일 (AMA-User-Guide, AMA-User-Manual, car-manager-ui, sitemap.xml)
- **위험도**: 낮음 (UI 텍스트만 변경, 코드 로직/라우팅 불변)
