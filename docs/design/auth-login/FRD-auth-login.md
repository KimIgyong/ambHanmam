# FRD-auth-login

## 기능명세서 — 인증 시스템 (로그인 / 레벨 분기)

| 항목 | 내용 |
|------|------|
| 문서번호 | FRD-auth-login |
| 작성일 | 2026-04-13 |
| 참조 | REQ-260413-auth-login |
| 버전 | v1.0 |

---

## 1. 화면 목록

| 화면 ID | 경로 | 컴포넌트 | 설명 |
|---------|------|---------|------|
| SCR-001 | `/login` | `LoginSelectPage` | 레벨 선택 분기 카드 UI |
| SCR-002 | `/admin/login` | `AdminLoginPage` | 관리자 로그인 폼 |
| SCR-003 | `/user/login` | `UserLoginPage` | 직원 로그인 폼 |
| SCR-004 | `/client/login` | `ClientLoginPage` | 고객사 로그인 폼 |

모든 화면은 `(auth)` 레이아웃 그룹에 속하며, 기존 `(main)` 레이아웃(헤더/사이드바)을 표시하지 않는다.

---

## 2. SCR-001: /login — 레벨 선택

### 2.1 화면 구성

```
┌────────────────────────────────────────────┐
│           HANMAM by AMA                    │
│        한마음 통합 업무 플랫폼               │
│                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  🔐      │ │  👤      │ │  🏢      │   │
│  │ 관리자   │ │ 직원     │ │ 고객사   │   │
│  │ 로그인   │ │ 로그인   │ │ 로그인   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└────────────────────────────────────────────┘
```

### 2.2 기능 명세

| ID | 기능 | 입력 | 출력 | 비고 |
|----|------|------|------|------|
| F-001 | 관리자 카드 클릭 | click | `/admin/login` 이동 | router.push |
| F-002 | 직원 카드 클릭 | click | `/user/login` 이동 | router.push |
| F-003 | 고객사 카드 클릭 | click | `/client/login` 이동 | router.push |
| F-004 | 로그인 상태 감지 | 페이지 진입 | 기존 토큰 유효 시 레벨별 홈 리다이렉트 | useAuth hook |

---

## 3. SCR-002: /admin/login — 관리자 로그인

### 3.1 화면 구성

```
┌────────────────────────────────────────────┐
│           ⚙️ 관리자 로그인                  │
│                                            │
│  이메일   [___________________________]    │
│  비밀번호 [___________________________]    │
│                                            │
│           [      관리자 로그인      ]      │
│                                            │
│  ← 로그인 방식 변경                        │
└────────────────────────────────────────────┘
```

### 3.2 기능 명세

| ID | 기능 | 입력 | 출력 | 검증 |
|----|------|------|------|------|
| F-010 | 이메일 입력 | string | — | required, email format |
| F-011 | 비밀번호 입력 | string | — | required, min 8자 |
| F-012 | 로그인 버튼 | click | POST `/api/v1/auth/admin/login` | 폼 유효성 통과 후 |
| F-013 | 성공 처리 | JWT(Access+Refresh) | `/admin/dashboard` 이동 | — |
| F-014 | 레벨 불일치 에러 | HTTP 403 | "관리자 계정이 아닙니다." 메시지 표시 | — |
| F-015 | 인증 실패 에러 | HTTP 401 | "이메일 또는 비밀번호가 올바르지 않습니다." | — |
| F-016 | 잠금 에러 | HTTP 429 | "30분 후 다시 시도해주세요." | — |
| F-017 | 로딩 상태 | 요청 중 | 버튼 비활성화 + Spinner | — |
| F-018 | "로그인 방식 변경" 링크 | click | `/login` 이동 | — |

### 3.3 스타일 구분
- 배경: `bg-zinc-900` (다크 계열) — 관리자 전용 시각 구분
- 테마 컬러: `zinc + red-600`

---

## 4. SCR-003: /user/login — 직원 로그인

### 4.1 화면 구성

```
┌────────────────────────────────────────────┐
│   🏠  HANMAM by AMA   직원 로그인          │
│                                            │
│  이메일   [___________________________]    │
│            ☐ 이메일 저장                   │
│  비밀번호 [___________________________]    │
│                                            │
│           [        로그인           ]      │
│                                            │
│  비밀번호 찾기          로그인 방식 변경 →  │
└────────────────────────────────────────────┘
```

### 4.2 기능 명세

| ID | 기능 | 입력 | 출력 | 검증 |
|----|------|------|------|------|
| F-020 | 이메일 입력 | string | — | required, email |
| F-021 | 이메일 저장 체크박스 | boolean | localStorage 저장/삭제 | — |
| F-022 | 비밀번호 입력 | string | — | required |
| F-023 | 로그인 버튼 | click | POST `/api/v1/auth/user/login` | — |
| F-024 | 성공 처리 | JWT | `/dashboard` 이동 | — |
| F-025 | 비밀번호 찾기 | click | 모달 또는 `/user/forgot-password` | MVP: UI만 |
| F-026 | "로그인 방식 변경" | click | `/login` 이동 | — |
| F-027 | 레벨 불일치 에러 | HTTP 403 | "직원 계정이 아닙니다." | — |

### 4.3 스타일 구분
- 배경: `bg-white` (기본 밝은 계열)
- 테마 컬러: `blue-600`

---

## 5. SCR-004: /client/login — 고객사 로그인

### 5.1 화면 구성

```
┌────────────────────────────────────────────┐
│   🏢  고객사 포털   로그인                  │
│                                            │
│  이메일   [___________________________]    │
│  비밀번호 [___________________________]    │
│                                            │
│           [     고객사 포털 로그인  ]      │
│                                            │
│  ← 로그인 방식 변경                        │
└────────────────────────────────────────────┘
```

### 5.2 기능 명세

| ID | 기능 | 입력 | 출력 | 검증 |
|----|------|------|------|------|
| F-030 | 이메일 입력 | string | — | required, email |
| F-031 | 비밀번호 입력 | string | — | required |
| F-032 | 로그인 버튼 | click | POST `/api/v1/auth/client/login` | — |
| F-033 | 성공 처리 | JWT | `/client/dashboard` 이동 | — |
| F-034 | 레벨 불일치 에러 | HTTP 403 | "고객사 계정이 아닙니다." | — |
| F-035 | "로그인 방식 변경" | click | `/login` 이동 | — |

### 5.3 스타일 구분
- 배경: `bg-teal-50` (청록 계열) — 고객사 포털 구분
- 테마 컬러: `teal-600`

---

## 6. 공통 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|---------|------|------|
| `AuthCard` | `components/auth/AuthCard.tsx` | 로그인 폼 컨테이너 카드 |
| `LoginInput` | `components/auth/LoginInput.tsx` | 이메일/비밀번호 입력 필드 |
| `LoginButton` | `components/auth/LoginButton.tsx` | 로딩 상태 포함 버튼 |
| `AuthErrorMessage` | `components/auth/AuthErrorMessage.tsx` | 에러 메시지 표시 |

---

## 7. 상태 관리 (Auth Store)

```typescript
// src/lib/stores/auth.store.ts (Zustand)
interface AuthState {
  user: AuthUser | null;          // 로그인 사용자 정보
  accessToken: string | null;     // JWT Access Token (메모리)
  level: 'ADMIN' | 'USER' | 'CLIENT' | null;  // 현재 레벨
  isAuthenticated: boolean;
  login(credentials, level): Promise<void>;
  logout(): Promise<void>;
}
```

---

## 8. Mock 인증 로직 (MVP)

백엔드 미연동 상태에서 아래 Mock 계정으로 인증을 시뮬레이션한다.

```typescript
// src/lib/mock/auth.ts
const MOCK_USERS = [
  { email: 'admin@amoeba.group',   password: 'amb2026!@#$', level: 'ADMIN',  role: 'ADMIN' },
  { email: 'gray.kim@amoeba.group',password: 'amb2026!@#$', level: 'USER',   role: 'MEMBER' },
  { email: 'fremd@naver.com',      password: 'amb2026!@#$', level: 'CLIENT', role: 'CLIENT' },
];
```

레벨 불일치 시 → `{ code: 'E4030', message: '...' }` 반환  
계정 없음 시 → `{ code: 'E4010', message: '이메일 또는 비밀번호가 올바르지 않습니다.' }` 반환

---

## 9. 라우트 보호 (Middleware)

```
Next.js middleware.ts (루트)
  ├── /admin/** → ADMIN_LEVEL 토큰 없으면 /admin/login
  ├── /(main)/** → USER_LEVEL 토큰 없으면 /user/login  
  ├── /client/** → CLIENT_LEVEL 토큰 없으면 /client/login
  └── /login, /*/login → 이미 로그인 시 레벨별 홈으로
```

---

## 10. 에러 코드

| 코드 | HTTP | 메시지 | 상황 |
|------|------|--------|------|
| E4010 | 401 | 이메일 또는 비밀번호가 올바르지 않습니다. | 인증 실패 |
| E4030 | 403 | 관리자/직원/고객사 계정이 아닙니다. | 레벨 불일치 |
| E4291 | 429 | 30분 후 다시 시도해주세요. | 잠금 |
| E5000 | 500 | 서버 오류가 발생했습니다. | 서버 에러 |
