# GA4 Registration Funnel Tracking Guide

## Overview

www.amoeba.site 가입 퍼널의 각 단계를 GA4로 추적하기 위한 세팅 가이드.
GA4 Measurement ID: `G-H83THZBDHT`

---

## 1. 퍼널 단계 정의

```
Landing Page (www.amoeba.site)
  ↓ CTA 클릭
Register Page (/register)
  ↓
Step 1: Account Information
  ├─ 이메일 인증코드 발송
  ├─ 이메일 인증 완료
  ├─ Next Step 클릭 → Step 2
  └─ Continue with Google → Google OAuth Flow
  ↓
Step 2: Company & Terms (이메일 가입)
  ↓ Submit
Signup Complete
  ↓ Go to AMA 클릭
ama.amoeba.site/{entityId}/login (Cross-domain)

────── Google OAuth 분기 ──────
Google Callback (/auth/google/callback)
  ↓
Google Onboarding (/auth/google/onboarding)
  ↓ Submit
Google Signup Complete
  ↓ Go to AMA 클릭
ama.amoeba.site/{entityId}/login
```

---

## 2. 이벤트 설계

### 2.1 현재 구현된 이벤트 (AS-IS)

| Event Name | 위치 | Parameters | 파일 |
|---|---|---|---|
| `landing_page_view` | 랜딩페이지 진입 | — | LandingPage.tsx:642 |
| `cta_register_click` | 하단 CTA 클릭 | `location: 'bottom_cta'` | LandingPage.tsx:893 |
| `register_submit` | Step2 폼 제출 | `method, company, country` | Step2CompanyTermsForm.tsx:56 |
| `register_complete` | 가입 완료 화면 | `method: 'email'` | SignupCompleteScreen.tsx:28 |
| `signup_go_ama_click` | AMA 이동 클릭 | — | SignupCompleteScreen.tsx:33 |

### 2.2 추가 필요 이벤트 (TO-BE)

| Event Name | 위치 | Parameters | 목적 |
|---|---|---|---|
| `register_page_view` | RegisterPage 진입 | `step: number` | 퍼널 시작점 |
| `cta_register_click` | 랜딩 CTA (전체) | `location: string` | 어느 CTA에서 유입인지 |
| `email_code_sent` | 인증코드 발송 | `email_domain: string` | 이메일 입력 단계 이탈 측정 |
| `email_verified` | 이메일 인증 성공 | `email_domain: string` | 인증 완료율 |
| `step1_completed` | Next Step 클릭 | — | Step1→2 전환율 |
| `google_signup_start` | Google 버튼 클릭 | — | Google 가입 시도율 |
| `google_callback_success` | Google 콜백 성공 | — | OAuth 완료율 |
| `google_callback_error` | Google 콜백 에러 | `error: string` | OAuth 실패 분석 |
| `google_onboarding_view` | 온보딩 폼 진입 | — | 온보딩 도달율 |
| `google_onboarding_submit` | 온보딩 폼 제출 | `company, country` | Google 가입 제출 |
| `google_onboarding_complete` | Google 가입 완료 | `method: 'google'` | Google 가입 완료율 |
| `register_submit_error` | Step2 제출 실패 | `error_code: string` | 에러별 이탈 분석 |

---

## 3. 코드 구현

### 3.1 이벤트 헬퍼 유틸 생성

**파일**: `apps/portal-web/src/lib/ga-events.ts`

```typescript
/**
 * GA4 Custom Events for Registration Funnel
 */

// 이메일 도메인 추출 (PII 방지: 전체 이메일 전송 금지)
function extractDomain(email: string): string {
  return email.split('@')[1] || 'unknown';
}

// ── Landing ──────────────────────────────────
export function trackCtaRegisterClick(location: string) {
  window.gtag?.('event', 'cta_register_click', { location });
}

// ── Register Page ────────────────────────────
export function trackRegisterPageView(step: number | string) {
  window.gtag?.('event', 'register_page_view', { step: String(step) });
}

// ── Step 1 ───────────────────────────────────
export function trackEmailCodeSent(email: string) {
  window.gtag?.('event', 'email_code_sent', {
    email_domain: extractDomain(email),
  });
}

export function trackEmailVerified(email: string) {
  window.gtag?.('event', 'email_verified', {
    email_domain: extractDomain(email),
  });
}

export function trackStep1Completed() {
  window.gtag?.('event', 'step1_completed');
}

export function trackGoogleSignupStart() {
  window.gtag?.('event', 'google_signup_start');
}

// ── Step 2 ───────────────────────────────────
export function trackRegisterSubmit(params: {
  method: string;
  company: string;
  country: string;
}) {
  window.gtag?.('event', 'register_submit', params);
}

export function trackRegisterSubmitError(errorCode: string) {
  window.gtag?.('event', 'register_submit_error', {
    error_code: errorCode,
  });
}

// ── Complete ─────────────────────────────────
export function trackRegisterComplete(method: 'email' | 'google') {
  window.gtag?.('event', 'register_complete', { method });
}

export function trackSignupGoAmaClick() {
  window.gtag?.('event', 'signup_go_ama_click');
}

// ── Google OAuth Flow ────────────────────────
export function trackGoogleCallbackSuccess() {
  window.gtag?.('event', 'google_callback_success');
}

export function trackGoogleCallbackError(error: string) {
  window.gtag?.('event', 'google_callback_error', { error });
}

export function trackGoogleOnboardingView() {
  window.gtag?.('event', 'google_onboarding_view');
}

export function trackGoogleOnboardingSubmit(params: {
  company: string;
  country: string;
}) {
  window.gtag?.('event', 'google_onboarding_submit', params);
}

export function trackGoogleOnboardingComplete() {
  window.gtag?.('event', 'google_onboarding_complete', { method: 'google' });
}
```

### 3.2 각 컴포넌트별 삽입 위치

#### Step1AccountForm.tsx

```typescript
import {
  trackEmailCodeSent,
  trackEmailVerified,
  trackStep1Completed,
  trackGoogleSignupStart,
} from '@/lib/ga-events';

// handleSendCode 성공 후
trackEmailCodeSent(store.email);

// handleVerify 성공 후
trackEmailVerified(store.email);

// handleNext 실행 시
const handleNext = () => {
  trackStep1Completed();
  store.setStep(2);
};

// handleGoogleSignup 실행 시
const handleGoogleSignup = async () => {
  trackGoogleSignupStart();
  // ... 기존 로직
};
```

#### Step2CompanyTermsForm.tsx

```typescript
import {
  trackRegisterSubmit,
  trackRegisterSubmitError,
} from '@/lib/ga-events';

// handleSubmit 내 (기존 gtag 인라인 코드 대체)
trackRegisterSubmit({
  method: 'email',
  company: store.companyName,
  country: store.countryCode,
});

// catch 블록 에러 시
trackRegisterSubmitError(error.response?.data?.error?.code || 'unknown');
```

#### SignupCompleteScreen.tsx

```typescript
import {
  trackRegisterComplete,
  trackSignupGoAmaClick,
} from '@/lib/ga-events';

// useEffect (기존 인라인 대체)
useEffect(() => {
  trackRegisterComplete('email');
}, []);

// handleGoAma (기존 인라인 대체)
const handleGoAma = () => {
  reset();
  trackSignupGoAmaClick();
  window.location.href = amaLoginUrl;
};
```

#### GoogleCallbackPage.tsx

```typescript
import {
  trackGoogleCallbackSuccess,
  trackGoogleCallbackError,
} from '@/lib/ga-events';

// token 존재 시
trackGoogleCallbackSuccess();

// error 존재 시
trackGoogleCallbackError(error);
```

#### GoogleOnboardingPage.tsx

```typescript
import {
  trackGoogleOnboardingView,
  trackGoogleOnboardingSubmit,
  trackGoogleOnboardingComplete,
} from '@/lib/ga-events';

// 컴포넌트 마운트 시
useEffect(() => {
  trackGoogleOnboardingView();
}, []);

// handleSubmit 내
trackGoogleOnboardingSubmit({
  company: companyName,
  country: countryCode,
});

// 성공 응답 후
trackGoogleOnboardingComplete();
```

#### RegisterPage.tsx

```typescript
import { trackRegisterPageView } from '@/lib/ga-events';

// step 변경 시 추적
useEffect(() => {
  trackRegisterPageView(step);
}, [step]);
```

---

## 4. Cross-Domain Tracking (www ↔ ama)

이미 `index.html`에 linker 설정 완료:

```javascript
gtag('config', 'G-H83THZBDHT', {
  linker: { domains: ['www.amoeba.site', 'ama.amoeba.site'] }
});
```

**주의**: `signup_go_ama_click` 후 `window.location.href`로 이동 시 gtag linker가 자동으로 `_gl` 파라미터를 URL에 추가하여 세션을 유지합니다. `window.location.href` 대신 `<a>` 태그로 변경하면 linker 자동 적용이 더 확실합니다.

### ama.amoeba.site 측 설정

ama.amoeba.site (apps/web)에도 동일한 GA4 스니펫 + linker `accept_incoming` 설정 필요:

```html
<!-- apps/web/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H83THZBDHT"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-H83THZBDHT', {
    linker: {
      domains: ['www.amoeba.site', 'ama.amoeba.site'],
      accept_incoming: true
    }
  });
</script>
```

---

## 5. GA4 Console 설정

### 5.1 Custom Definitions (맞춤 측정기준)

GA4 Admin → Property → Custom definitions → Create custom dimensions:

| Dimension name | Scope | Event parameter |
|---|---|---|
| Registration Step | Event | `step` |
| Signup Method | Event | `method` |
| Company Name | Event | `company` |
| Country Code | Event | `country` |
| Email Domain | Event | `email_domain` |
| CTA Location | Event | `location` |
| Error Code | Event | `error_code` |
| Error Type | Event | `error` |

### 5.2 Key Events (핵심 이벤트)

GA4 Admin → Data display → Events → Mark as key event:

- `register_submit` — 가입 제출 (핵심 전환)
- `register_complete` — 가입 완료 (최종 전환)
- `google_onboarding_complete` — Google 가입 완료

### 5.3 Funnel Exploration 설정

GA4 → Explore → Funnel exploration:

#### 이메일 가입 퍼널

| Step | Event | 조건 |
|------|-------|------|
| 1 | `landing_page_view` | — |
| 2 | `cta_register_click` | — |
| 3 | `register_page_view` | step = 1 |
| 4 | `email_code_sent` | — |
| 5 | `email_verified` | — |
| 6 | `step1_completed` | — |
| 7 | `register_submit` | method = email |
| 8 | `register_complete` | method = email |
| 9 | `signup_go_ama_click` | — |

#### Google 가입 퍼널

| Step | Event | 조건 |
|------|-------|------|
| 1 | `landing_page_view` | — |
| 2 | `cta_register_click` | — |
| 3 | `register_page_view` | step = 1 |
| 4 | `google_signup_start` | — |
| 5 | `google_callback_success` | — |
| 6 | `google_onboarding_view` | — |
| 7 | `google_onboarding_submit` | — |
| 8 | `google_onboarding_complete` | — |
| 9 | `signup_go_ama_click` | — |

### 5.4 Audience (잠재고객) 설정

| Audience | 조건 | 목적 |
|---|---|---|
| Started Registration | `register_page_view` 발생 | 리마케팅 |
| Email Verified | `email_verified` 발생 | 인증 완료 후 이탈자 |
| Abandoned Step 2 | `step1_completed` O + `register_submit` X (7일) | 미완료 가입자 |
| Google Auth Failed | `google_callback_error` 발생 | OAuth 오류 분석 |
| Completed Signup | `register_complete` 발생 | 가입 완료 사용자 |

---

## 6. 디버깅 및 검증

### 6.1 GA4 DebugView

1. Chrome 확장 프로그램 **GA Debugger** 설치
2. 또는 URL에 `?debug_mode=true` 추가
3. 또는 코드에서 debug 활성화:

```javascript
gtag('config', 'G-H83THZBDHT', {
  debug_mode: true,
  linker: { domains: ['www.amoeba.site', 'ama.amoeba.site'] }
});
```

4. GA4 Admin → DebugView에서 실시간 이벤트 확인

### 6.2 Console 로그 확인

개발 환경에서 이벤트 발생 확인:

```javascript
// 브라우저 콘솔에서
window.dataLayer  // 전송된 이벤트 목록 확인
```

### 6.3 Real-time Report

GA4 → Reports → Realtime → 이벤트 카드에서 실시간 이벤트 수신 확인 (반영까지 ~30초)

---

## 7. 주의사항

### PII (개인정보) 전송 금지
- **이메일 전체 주소를 event parameter로 전송하지 않음** → `email_domain`만 사용
- 이름, 전화번호 등 개인 식별 정보 전송 금지
- GA4 정책 위반 시 데이터 삭제 및 계정 정지 가능

### 이벤트 이름 규칙
- GA4 이벤트 이름: snake_case, 40자 이내
- 파라미터 이름: snake_case, 40자 이내
- 파라미터 값: 100자 이내
- 이벤트당 파라미터 최대 25개

### Enhanced Measurement
GA4 Admin → Data Streams → Enhanced measurement에서 자동 수집 이벤트 확인:
- `page_view` — 자동 수집 (SPA에서는 History API 감지)
- `scroll` — 90% 스크롤 시 자동
- `click` — 아웃바운드 링크 자동 수집

---

## 8. 구현 우선순위

| 순위 | 이벤트 | 이유 |
|------|--------|------|
| P0 | `register_page_view` | 퍼널 시작점 측정 |
| P0 | `step1_completed` | 핵심 전환 단계 |
| P0 | `google_signup_start` | Google 가입 분기 추적 |
| P1 | `email_code_sent` / `email_verified` | 이메일 인증 이탈 분석 |
| P1 | `google_callback_*` / `google_onboarding_*` | Google 퍼널 완성 |
| P2 | `register_submit_error` | 에러 분석 |
| P2 | 랜딩 CTA location 다양화 | 유입 경로별 분석 |
