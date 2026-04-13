# REQ-260412: Google 온보딩 페이지 UI 개선 (Company & Terms 통합)

## 1. 요구사항 요약

1. Google OAuth 팝업에서 인증 완료 시 **팝업이 닫히고** `/auth/google/onboarding?token=...` 페이지로 이동
2. Google 온보딩 페이지의 UI를 `/register` Step 2 (Company & Terms)와 동일하게 반영
   - 주요 국가 국기 아이콘 그리드 (`CountryIconGrid`)
   - 약관 체크박스 그룹 (`TermsCheckboxGroup`)
   - `Building2`, `Phone` 아이콘 등 일관된 디자인

---

## 2. AS-IS 현황 분석

### 2.1 Google OAuth 플로우 (현재)

```
Step1 "Continue with Google" 클릭
  ↓
팝업 모드: window.open() → Google 인증
  ↓ (콜백)
GoogleCallbackPage (팝업 내)
  ↓
postMessage → Step1AccountForm이 수신
  ↓
GoogleOnboardingModal 열림 (Step1 페이지 위 모달)
  ↓
모달 내에서 폼 입력 → 가입 완료
```

**문제점**:
- 팝업 모드: 구글 인증 성공 → postMessage → **모달(GoogleOnboardingModal)이 Step1 위에 오버레이로 뜸**
- 모달 UI는 심플한 `<select>` 드롭다운 국가 선택으로, Step2의 `CountryIconGrid` 국기 UI와 다름
- 모달은 `max-w-md`로 좁은 영역에 렌더링되어 `CountryIconGrid`(6열 그리드)를 담기에 적합하지 않음
- 리다이렉트 모드(팝업 차단 시): GoogleCallbackPage → `/auth/google/onboarding` 페이지로 이동. 이 페이지도 동일한 심플 UI

### 2.2 현재 관련 파일들

| 파일 | 역할 | 현재 상태 |
|------|------|-----------|
| `Step1AccountForm.tsx` | Google 버튼 + postMessage 수신 + 모달 호출 | 팝업 성공 시 `GoogleOnboardingModal` 표시 |
| `GoogleOnboardingModal.tsx` | 팝업 모드 전용 온보딩 모달 | `<select>` 드롭다운 국가 선택, 자체 약관 체크박스 |
| `GoogleCallbackPage.tsx` | 팝업/리다이렉트 분기 처리 | 팝업: postMessage → close, 리다이렉트: navigate |
| `GoogleOnboardingPage.tsx` | 리다이렉트 모드 전용 풀페이지 | `<select>` 드롭다운 국가 선택, 자체 약관 체크박스 |
| `Step2CompanyTermsForm.tsx` | 이메일 가입 Step2 | **목표 UI**: CountryIconGrid + TermsCheckboxGroup |
| `CountryIconGrid.tsx` | 주요 11개국 국기 + 검색 그리드 | Step2에서만 사용 중 |
| `TermsCheckboxGroup.tsx` | 전체동의 + 개별 체크박스 | Step2에서만 사용 중 |

### 2.3 UI 비교: Step2 vs Google Onboarding

| UI 요소 | Step2CompanyTermsForm | GoogleOnboardingModal/Page |
|---------|----------------------|---------------------------|
| 회사명 입력 | Building2 아이콘 + input | 단순 `<input>` |
| 국가 선택 | **CountryIconGrid** (6열 국기) | `<select>` 드롭다운 |
| 연락처 | Phone 아이콘 + dial code | 단순 `<input type=tel>` |
| 비밀번호 | *(Step1에서 입력)* | `<input type=password>` |
| 약관 | **TermsCheckboxGroup** (전체동의 포함) | 개별 hidden checkbox |
| 비밀번호 강도 | *(Step1)* | 없음 |

---

## 3. TO-BE 요구사항

### 3.1 플로우 변경

```
Step1 "Continue with Google" 클릭
  ↓
팝업 모드: window.open() → Google 인증
  ↓ (콜백)
GoogleCallbackPage (팝업 내)
  ↓
postMessage → Step1AccountForm이 수신
  ↓ [변경] 모달 대신 페이지 이동
navigate('/auth/google/onboarding?token=...')
  ↓
GoogleOnboardingPage (풀페이지, Step2 UI 동일)
  ↓
폼 입력 → 가입 완료
```

### 3.2 UI 변경

`GoogleOnboardingPage.tsx`를 Step2CompanyTermsForm.tsx와 동일한 스타일로 리디자인:

- **CountryIconGrid** 컴포넌트 사용 (6열 국기 그리드 + 기타 국가 검색)
- **TermsCheckboxGroup** 컴포넌트 사용 (전체동의 + 개별 약관)
- **Building2, Phone** 아이콘 적용
- **PasswordStrengthBar** 추가 (현재 Google 온보딩에 비밀번호 강도 표시 없음)
- 레이아웃을 RegisterPage.tsx의 2단 레이아웃(좌측 그래디언트 + 우측 폼) 형태 적용

### 3.3 동작 변경

| 항목 | AS-IS | TO-BE |
|------|-------|-------|
| 팝업 성공 후 | 모달(GoogleOnboardingModal) 표시 | 페이지 이동 `/auth/google/onboarding` |
| onboarding UI | 심플 드롭다운 | Step2 동일 국기 그리드 |
| 약관 UI | 개별 hidden checkbox | TermsCheckboxGroup (전체동의) |
| 모달 컴포넌트 | 사용 | **삭제** (더 이상 필요 없음) |

---

## 4. 갭 분석

| 구분 | AS-IS | TO-BE | 변경사항 |
|------|-------|-------|---------|
| Step1 팝업 성공 | 모달 오픈 | 페이지 이동(navigate) | `Step1AccountForm.tsx` 수정 |
| GoogleOnboardingModal | 사용 | 삭제 | 파일 삭제 |
| GoogleOnboardingPage | 심플 UI | Step2 UI 반영 | 전면 리디자인 |
| CountryIconGrid | Step2 전용 | Google Onboarding에서도 사용 | 공유 컴포넌트 그대로 |
| TermsCheckboxGroup | Step2 전용 | Google Onboarding에서도 사용 | 공유 컴포넌트 그대로 |
| 비밀번호 강도 표시 | 없음 | PasswordStrengthBar 추가 | GoogleOnboardingPage에 추가 |

---

## 5. 기술 제약사항

- **postMessage origin 검증**: 보안상 `event.origin === window.location.origin` 검증 유지
- **팝업 차단 대응**: 팝업 차단 시 리다이렉트 모드에서도 동일하게 `/auth/google/onboarding`으로 이동 → 기존 동작 유지
- **토큰 만료**: onboarding_token은 20분 TTL, 페이지 이동 시 URL query로 전달되므로 문제 없음
- **react-hook-form vs zustand**: GoogleOnboardingPage는 react-hook-form 사용, Step2는 zustand store 사용. onboarding page는 react-hook-form 유지하되 UI만 통합

---

## 6. 사용자 플로우 (TO-BE)

### 6.1 팝업 모드 (정상)
1. /register → Step1 → "Continue with Google" 클릭
2. 팝업 열림 → Google 인증 → 콜백
3. 팝업: postMessage(`google_oauth_success`, token) → 자동 닫힘
4. Step1: 메시지 수신 → **navigate(`/auth/google/onboarding?token=...`)**
5. GoogleOnboardingPage: Step2 동일 UI로 회사정보 입력
6. 완료 → AMA 로그인 URL 이동

### 6.2 리다이렉트 모드 (팝업 차단)
1. /register → Step1 → "Continue with Google" 클릭
2. 팝업 차단 → window.location.href = Google URL
3. Google 인증 → 백엔드 콜백 → 리다이렉트
4. /auth/google/callback?onboarding_token=... → navigate → /auth/google/onboarding?token=...
5. GoogleOnboardingPage: Step2 동일 UI로 회사정보 입력
6. 완료 → AMA 로그인 URL 이동
