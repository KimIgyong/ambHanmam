# 요구사항 분석서: Google 가입 미완료 처리

- **문서번호**: REQ-260412-Google가입미완료처리
- **작성일**: 2026-04-12
- **상태**: 분석 완료

---

## 1. AS-IS 현황 분석

### 1.1 Google OAuth 가입 플로우 (현재)

```
[Register Page - Step1]
  └─ "Continue with Google" 클릭
      └─ 팝업 열림 → Google OAuth 인증
          └─ 백엔드 콜백 (handleGoogleCallback)
              ├─ 신규: portal_customer 레코드 생성 (pct_cli_id=NULL, 회사정보 없음)
              ├─ 기존 미완료: 레코드 재사용 (pctDeletedAt 초기화, GOOGLE 전환)
              └─ 기존 완료: email_exists 에러 반환
          └─ onboarding_token 발급 → 콜백 페이지로 리다이렉트
              └─ 팝업: postMessage → 부모창에서 /auth/google/onboarding 이동
              └─ 리다이렉트: /auth/google/onboarding?token=xxx

[Google Onboarding Page - Step2]
  └─ 회사명, 국가, 비밀번호, 약관 입력 → Submit
      └─ completeGoogleOnboarding()
          ├─ customer 업데이트 (company, country, password, terms)
          ├─ amb_svc_clients 생성 (pct_cli_id 연결)
          └─ Auto Provision (AMA entity/user 생성)
```

### 1.2 문제점

#### 문제 1: Google 인증 후 온보딩 미완료 시 고스트 레코드
- Google OAuth 콜백 시점에 `portal_customer` 레코드가 **즉시 생성**됨
- `pct_status='ACTIVE'`, `pct_auth_provider='GOOGLE'`, **`pct_cli_id=NULL`** (회사정보 없음)
- 사용자가 온보딩 페이지(Step2)를 완료하지 않고 이탈하면 이 고스트 레코드가 남음
- **현재 동작**: 같은 이메일로 재시도 시 → `pctCliId` 없으므로 `isActiveMasterGoogle=false` → 레코드 재사용 OK
- **문제**: 고스트 레코드가 DB에 누적됨 (치명적이진 않으나 데이터 정합성 이슈)

#### 문제 2: `email_exists` 에러 시 UX
- **팝업 모드**: 콜백 페이지가 `postMessage({ type: 'google_oauth_error', error: 'email_exists' })`를 부모에게 보내고 `window.close()` → 부모창에서 에러 메시지 표시 → **정상 동작**
- **리다이렉트 모드** (팝업 차단 시): `/auth/google/callback?error=email_exists` 페이지에 도달
  - "Email already registered" 메시지와 "Sign in" 링크 표시
  - `<Link to="/login">` — **같은 탭에서 /login으로 이동** (페이지 전환)
  - **요구사항**: 팝업인 경우 페이지 창을 닫고 원래 창으로 이동해야 함

#### 문제 3: 가입 미완료(email_exists) 시 재가입 불가 케이스
- 현재 `isActiveMasterGoogle` 조건: `!pctDeletedAt && pctCliId && pctAuthProvider === 'GOOGLE'`
- `pctCliId`가 있으면 (온보딩 완료) email_exists → 차단 (정상)
- `pctCliId`가 없으면 (온보딩 미완료) → 레코드 재사용 (정상)
- **이메일 가입 후 Google 재시도**: `pctAuthProvider !== 'GOOGLE'`이면 `isActiveMasterGoogle=false` → 재사용 → **덮어씀** (잠재 위험)

### 1.3 관련 파일

| 파일 | 역할 |
|------|------|
| `apps/portal-api/src/domain/auth/service/portal-auth.service.ts` | `handleGoogleCallback()`, `completeGoogleOnboarding()` |
| `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx` | Google 콜백 UI (에러/성공 처리) |
| `apps/portal-web/src/pages/auth/GoogleOnboardingPage.tsx` | Google 온보딩 폼 (Step2) |
| `apps/portal-web/src/components/signup/Step1AccountForm.tsx` | "Continue with Google" 버튼 + postMessage 수신 |

### 1.4 관련 DB 테이블

| 테이블 | 주요 컬럼 |
|--------|----------|
| `amb_svc_portal_customers` | `pct_id`, `pct_email`, `pct_cli_id`, `pct_status`, `pct_auth_provider`, `pct_deleted_at` |
| `amb_svc_clients` | `cli_id`, `cli_code`, `cli_company_name`, `cli_status` |

---

## 2. TO-BE 요구사항

### 요구사항 R1: Google 인증 후 온보딩 미완료 시 등록 취소
- Google OAuth 인증 성공 후 온보딩(Step2) 페이지를 완료하지 않고 이탈할 경우
- 생성된 `portal_customer` 레코드를 **soft-delete** 처리 (또는 생성 시점을 온보딩 완료 후로 변경)
- 접근 방식 선택:
  - **방안 A**: 콜백 시점에 레코드 생성하되, 온보딩 토큰 만료(20분) 후 미완료 레코드 정리
  - **방안 B**: 콜백 시점에 레코드 생성하지 않고, 온보딩 완료 시점에 생성 (큰 리팩토링 필요)
  - **방안 C** (권장): 현재 구조 유지 + 프론트엔드에서 취소 시 API 호출로 정리 + 백엔드 재시도 시 재사용 로직 강화

### 요구사항 R2: email_exists 에러 처리 개선
- `email_exists`이지만 온보딩 미완료(`pct_cli_id=NULL`) 상태:
  - 기존 정보를 삭제하고 새로 시작 **또는** 온보딩 페이지(Step2)로 바로 이동
  - **권장**: 새 onboarding_token 발급 후 온보딩 페이지로 이동 (기존 레코드 재사용)
- `email_exists`이고 온보딩 완료(`pct_cli_id` 존재) 상태:
  - 현재처럼 "이미 등록됨" 메시지 유지

### 요구사항 R3: "Sign in" 클릭 시 팝업 닫기
- GoogleCallbackPage의 "Sign in" 링크 클릭 시:
  - **팝업인 경우** (`window.opener` 존재): 팝업 창을 닫고 부모 창으로 포커스
  - **리다이렉트인 경우**: 현재처럼 `/login`으로 이동

---

## 3. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| 온보딩 미완료 레코드 | 고스트 레코드 영구 잔류 | 재시도 시 재사용 (현재 OK) + 프론트 취소 UX 개선 | 프론트엔드 |
| email_exists + 미완료 | email_exists 에러 차단 안 함 (재사용) | 그대로 유지 (이미 정상 동작) | 없음 |
| email_exists + 완료 | 에러 메시지 + Sign in 링크 | 에러 메시지 유지 + 팝업이면 창 닫기 | 프론트엔드 |
| Sign in 링크 (팝업) | 같은 탭에서 /login으로 이동 | 팝업 닫고 부모창 포커스 | 프론트엔드 |
| Sign in 링크 (리다이렉트) | /login 이동 | 유지 | 없음 |

---

## 4. 사용자 플로우

### 4.1 정상 플로우 (변경 없음)
```
Google 인증 → 콜백(팝업) → postMessage → 부모창 onboarding 이동 → Step2 작성 → 완료
```

### 4.2 온보딩 미완료 후 재시도 플로우 (현재 이미 동작)
```
Google 인증 → 콜백 → customer 생성(cli_id=NULL) → 온보딩 페이지→ 이탈
→ 다시 "Continue with Google" → 콜백 → 기존 레코드 재사용 → 온보딩 → 완료
```

### 4.3 email_exists (완료된 가입) 팝업 모드 (TO-BE)
```
Google 인증 → 콜백(팝업) → postMessage(error: email_exists) → window.close()
→ 부모창: "이미 등록된 이메일" 에러 표시 + "Sign in" 링크
→ Sign in 클릭 → /login 이동 (부모창에서)
```

### 4.4 email_exists (완료된 가입) 리다이렉트 모드 (TO-BE)
```
Google 인증 → 콜백(리다이렉트) → /auth/google/callback?error=email_exists 표시
→ "Sign in" 클릭 → 팝업이면 window.close() / 아니면 /login 이동
```

---

## 5. 기술 제약사항

1. **onboarding_token 만료**: 20분 (JWT) — 만료 후 재시도 가능 (백엔드가 레코드 재사용)
2. **백엔드 변경 최소화**: 현재 재사용 로직이 이미 잘 동작하므로 백엔드 수정 불필요
3. **팝업 감지**: `window.opener` 존재 여부로 팝업/리다이렉트 구분
4. **i18n**: 에러 메시지 변경 시 ko/en/vi 3개 언어 파일 업데이트 필요
