# PLN-260411-RegisterPage 구글 로그인 버튼 추가

## 1. 시스템 개발 현황 분석 (System Baseline)

### 1.1 현재 구현 상태

| 구분 | 상태 | 근거 |
|------|------|------|
| LoginPage 구글 버튼 | ✅ 구현 완료 | `apps/portal-web/src/pages/auth/LoginPage.tsx#L128` |
| GoogleCallbackPage | ✅ 구현 완료 | `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx` |
| GoogleOnboardingPage | ✅ 구현 완료 | `apps/portal-web/src/pages/auth/GoogleOnboardingPage.tsx` |
| portal-api 구글 엔드포인트 3개 | ✅ 구현 완료 | `/portal/auth/google/start`, `/callback`, `/onboarding` |
| i18n 키 (ko/en/vi) | ✅ 등록 완료 | `apps/portal-web/src/locales/*/common.json` |
| **RegisterPage 구글 버튼** | **❌ 미적용** | `apps/portal-web/src/pages/auth/RegisterPage.tsx` |

### 1.2 RegisterPage 구조

- 2단계 폼 (Step1 Account → Step2 Company & Terms → Complete)
- Step1: `Step1AccountForm.tsx` — 이름, 이메일 인증, 비밀번호
- Step2: `Step2CompanyTermsForm.tsx` — 회사, 국가, 약관 동의
- Complete: `SignupCompleteScreen.tsx`

### 1.3 재사용 가능 인프라

구글 OAuth 전체 플로우(start → callback → onboarding)가 이미 구현되어 있으므로, RegisterPage에 진입 버튼만 추가하면 기존 플로우를 그대로 타게 됨:

```
RegisterPage [Continue with Google] 클릭
  → GET /portal/auth/google/start (기존 API)
  → Google 동의 화면
  → /auth/google/callback (기존 라우트)
  → /auth/google/onboarding (기존 온보딩 폼)
```

---

## 2. 단계별 구현 계획

### Phase 1. RegisterPage에 구글 로그인 버튼 추가

**목표**: `/register` 페이지 Step1 영역에 "Continue with Google" 버튼을 추가하여 구글 가입 경로 제공

**주요 작업**:

1. `Step1AccountForm.tsx`에 구글 로그인 버튼 추가
   - LoginPage와 동일한 API 호출 패턴 (`GET /portal/auth/google/start`)
   - "or" 구분선(divider) + 구글 버튼 배치
   - 기존 `continue_with_google` i18n 키 재사용

2. i18n 키 추가
   - `or_divider` 키 추가 (ko: "또는", en: "or", vi: "hoặc")

**사이드 임팩트**: 없음. 기존 API/플로우 재사용, 백엔드 변경 없음.

---

## 3. 변경 파일 목록

### 3.1 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `apps/portal-web/src/components/signup/Step1AccountForm.tsx` | 구글 로그인 버튼 + or 구분선 추가 |
| `apps/portal-web/src/locales/ko/common.json` | `or_divider` 키 추가 |
| `apps/portal-web/src/locales/en/common.json` | `or_divider` 키 추가 |
| `apps/portal-web/src/locales/vi/common.json` | `or_divider` 키 추가 |

### 3.2 신규 파일

없음

---

## 4. 사이드 임팩트 분석

| 항목 | 영향도 | 설명 |
|------|--------|------|
| 백엔드 API | 없음 | 기존 `/portal/auth/google/start` 재사용 |
| 기존 로그인 플로우 | 없음 | LoginPage 구글 버튼 동작 변경 없음 |
| 기존 가입 플로우 | 없음 | 이메일 가입 폼 동작 변경 없음 |
| DB 변경 | 없음 | 스키마 변경 없음 |

---

## 5. DB 마이그레이션

해당 없음
