# PLN-260412: Google 온보딩 페이지 UI 개선 (Company & Terms 통합)

> 요구사항 분석서: `docs/analysis/REQ-260412-GoogleOnboarding-UI개선.md`

---

## 1. 변경 개요

Google OAuth 가입 시 모달 방식을 폐지하고, `/auth/google/onboarding` 풀페이지로 전환.
해당 페이지 UI를 `/register` Step2 (Company & Terms)와 동일한 CountryIconGrid + TermsCheckboxGroup 기반으로 통합.

---

## 2. 단계별 구현 계획

### Phase 1: Step1AccountForm — 팝업 성공 시 페이지 이동으로 변경

**변경 파일**: `apps/portal-web/src/components/signup/Step1AccountForm.tsx`

**변경 내용**:
1. `handleOAuthMessage` 콜백에서 성공 시 `setOnboardingToken(token)` → `navigate(`/auth/google/onboarding?token=${token}`)` 변경
2. `onboardingToken` 상태 변수 제거
3. `GoogleOnboardingModal` import 및 렌더링 코드 제거
4. `useNavigate` import 추가

**핵심 코드 변경**:
```typescript
// AS-IS
if (type === 'google_oauth_success' && onboarding_token) {
  setGoogleLoading(false);
  setOnboardingToken(onboarding_token); // 모달 열기
}

// TO-BE
if (type === 'google_oauth_success' && onboarding_token) {
  setGoogleLoading(false);
  navigate(`/auth/google/onboarding?token=${encodeURIComponent(onboarding_token)}`);
}
```

---

### Phase 2: GoogleOnboardingPage — Step2 UI 반영

**변경 파일**: `apps/portal-web/src/pages/auth/GoogleOnboardingPage.tsx`

**변경 내용**:
1. `<select>` 국가 드롭다운 → `CountryIconGrid` 컴포넌트로 교체
2. 자체 약관 hidden checkbox → `TermsCheckboxGroup` 컴포넌트로 교체
3. `Building2`, `Phone` 아이콘 추가
4. `PasswordStrengthBar` 추가
5. RegisterPage와 동일한 2단 레이아웃 적용 (좌측 그래디언트 패널 + 우측 폼)
6. react-hook-form → 로컬 state 기반으로 전환 (CountryIconGrid, TermsCheckboxGroup의 인터페이스에 맞춤)
7. 가입 완료 화면도 SignupCompleteScreen 스타일 적용

**UI 구조 (TO-BE)**:
```
┌─────────────────────────────────────────────────────┐
│ [좌 그래디언트]  │  [우 폼 영역]                       │
│  ┌─────────┐    │  Company & Terms                   │
│  │ AMA 로고 │    │  ┌───────────────────────────────┐ │
│  │ 소개 텍스트│    │  │ Company Name    [Building2]   │ │
│  └─────────┘    │  │ Country [CountryIconGrid 6열]  │ │
│                  │  │ Password [+StrengthBar]        │ │
│                  │  │ Phone (optional) [Phone]       │ │
│                  │  │ ─── Terms ───                  │ │
│                  │  │ [TermsCheckboxGroup]           │ │
│                  │  │ [Complete Registration 버튼]    │ │
│                  │  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**삭제 예정**: `GoogleOnboardingModal.tsx` (더 이상 사용 안 함)

---

### Phase 3: GoogleOnboardingModal 삭제 + 정리

**삭제 파일**: `apps/portal-web/src/components/signup/GoogleOnboardingModal.tsx`

**변경 파일**:
- `Step1AccountForm.tsx` — `GoogleOnboardingModal` import 제거 확인 (Phase 1에서 이미 처리)

---

## 3. 변경 대상 파일 목록

| 구분 | 파일 경로 | 변경 내용 |
|------|-----------|----------|
| **수정** | `apps/portal-web/src/components/signup/Step1AccountForm.tsx` | 모달 → navigate 전환, 모달 코드 제거 |
| **수정** | `apps/portal-web/src/pages/auth/GoogleOnboardingPage.tsx` | Step2 UI 반영 (전면 리디자인) |
| **삭제** | `apps/portal-web/src/components/signup/GoogleOnboardingModal.tsx` | 더 이상 사용 안 함 |

---

## 4. 사이드 임팩트 분석

| 항목 | 영향 | 대응 |
|------|------|------|
| 팝업 모드 동작 | 모달 → 페이지 이동. 동일 경로 재사용 | 리다이렉트 모드와 완전 통합 |
| GoogleCallbackPage | 변경 없음. postMessage + 리다이렉트 모두 기존 동작 유지 | - |
| CountryIconGrid | 공유 컴포넌트. 인터페이스 변경 없음 | 그대로 재사용 |
| TermsCheckboxGroup | 공유 컴포넌트. 인터페이스 변경 없음 | 그대로 재사용 |
| GA4 이벤트 | trackGoogleOnboardingView/Submit/Complete 기존 호출 유지 | 변경 없음 |
| 백엔드 API | POST /portal/auth/google/onboarding 변경 없음 | - |
| 라우터 | /auth/google/onboarding 라우트 기존 유지 | 변경 없음 |
| i18n | 기존 키 재사용 + Step2 키 일부 공유 | 추가 키 불필요 |

---

## 5. DB 마이그레이션

없음.

---

## 6. 검증 항목

1. **팝업 모드**: Google 인증 성공 → 팝업 닫힘 → `/auth/google/onboarding` 페이지 이동 확인
2. **리다이렉트 모드**: 팝업 차단 → 리다이렉트 → `/auth/google/onboarding` 페이지 이동 확인
3. **국가 선택**: CountryIconGrid 11개국 국기 표시 + 기타 검색 동작
4. **약관 체크**: TermsCheckboxGroup 전체동의 + 개별 체크 동작
5. **비밀번호 강도**: PasswordStrengthBar 정상 표시
6. **폼 제출**: 모든 필수 필드 입력 후 Complete Registration 성공
7. **에러 처리**: 토큰 만료, 서버 에러 시 적절한 메시지 표시
8. **반응형**: 모바일(< 768px) 1단 레이아웃, 데스크톱 2단 레이아웃
