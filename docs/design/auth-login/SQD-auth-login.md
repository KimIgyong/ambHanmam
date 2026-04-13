# SQD-auth-login

## 시퀀스 다이어그램 — 인증 시스템

| 항목 | 내용 |
|------|------|
| 문서번호 | SQD-auth-login |
| 작성일 | 2026-04-13 |
| 참조 | FRD-auth-login, REQ-260413-auth-login |

---

## 1. 로그인 분기 흐름

```mermaid
sequenceDiagram
    actor User
    participant LoginSelect as /login (SCR-001)
    participant AdminLogin as /admin/login (SCR-002)
    participant UserLogin as /user/login (SCR-003)
    participant ClientLogin as /client/login (SCR-004)

    User->>LoginSelect: 접속
    LoginSelect->>LoginSelect: useAuth() → 기존 토큰 확인
    alt 이미 로그인됨
        LoginSelect-->>User: 레벨별 홈으로 redirect
    else 미로그인
        LoginSelect-->>User: 레벨 선택 카드 표시
    end

    alt 관리자 카드 클릭
        User->>AdminLogin: router.push('/admin/login')
    else 직원 카드 클릭
        User->>UserLogin: router.push('/user/login')
    else 고객사 카드 클릭
        User->>ClientLogin: router.push('/client/login')
    end
```

---

## 2. 관리자 로그인 흐름 (SCR-002)

```mermaid
sequenceDiagram
    actor Admin
    participant Page as AdminLoginPage
    participant Store as AuthStore (Zustand)
    participant MockAuth as mockLogin()
    participant Router as Next.js Router

    Admin->>Page: 이메일 + 비밀번호 입력
    Admin->>Page: 로그인 버튼 클릭
    Page->>Page: 폼 유효성 검사
    alt 유효성 실패
        Page-->>Admin: 인라인 에러 표시
    else 유효성 통과
        Page->>Store: login(credentials, 'ADMIN')
        Store->>MockAuth: mockLogin(email, password, 'ADMIN')
        MockAuth->>MockAuth: MOCK_USERS에서 이메일 검색
        alt 계정 없음
            MockAuth-->>Store: { code: 'E4010' }
            Store-->>Page: throw AuthError
            Page-->>Admin: "이메일 또는 비밀번호가 올바르지 않습니다."
        else 비밀번호 불일치
            MockAuth-->>Store: { code: 'E4010' }
            Store-->>Page: throw AuthError
            Page-->>Admin: "이메일 또는 비밀번호가 올바르지 않습니다."
        else 레벨 불일치 (USER or CLIENT 계정)
            MockAuth-->>Store: { code: 'E4030' }
            Store-->>Page: throw AuthError
            Page-->>Admin: "관리자 계정이 아닙니다."
        else 로그인 성공
            MockAuth-->>Store: { accessToken, user, level: 'ADMIN' }
            Store->>Store: setUser() + setAccessToken()
            Store-->>Page: 성공
            Page->>Router: router.push('/admin/dashboard')
            Router-->>Admin: 관리자 대시보드
        end
    end
```

---

## 3. 직원 로그인 흐름 (SCR-003)

```mermaid
sequenceDiagram
    actor Employee
    participant Page as UserLoginPage
    participant LocalStorage as localStorage
    participant Store as AuthStore
    participant MockAuth as mockLogin()
    participant Router as Next.js Router

    Employee->>Page: 페이지 진입
    Page->>LocalStorage: getItem('saved_email')
    LocalStorage-->>Page: 저장된 이메일 (있으면 자동 채움)

    Employee->>Page: 이메일 + 비밀번호 입력
    alt 이메일 저장 체크
        Page->>LocalStorage: setItem('saved_email', email)
    else 체크 해제
        Page->>LocalStorage: removeItem('saved_email')
    end

    Employee->>Page: 로그인 버튼 클릭
    Page->>Store: login(credentials, 'USER')
    Store->>MockAuth: mockLogin(email, password, 'USER')
    alt 성공
        MockAuth-->>Store: { accessToken, user, level: 'USER' }
        Store-->>Page: 성공
        Page->>Router: router.push('/dashboard')
    else 레벨 불일치
        MockAuth-->>Store: { code: 'E4030' }
        Page-->>Employee: "직원 계정이 아닙니다."
    else 실패
        MockAuth-->>Store: { code: 'E4010' }
        Page-->>Employee: "이메일 또는 비밀번호가 올바르지 않습니다."
    end
```

---

## 4. Middleware 라우트 보호 흐름

```mermaid
sequenceDiagram
    actor User
    participant MW as Next.js middleware.ts
    participant Cookie as Cookie Store
    participant Router as Next.js Router

    User->>MW: 페이지 요청 (예: /dashboard)
    MW->>Cookie: getToken('hanmam_level')
    alt 토큰 없음 또는 만료
        MW->>Router: redirect('/user/login')
        Router-->>User: 로그인 페이지
    else ADMIN 토큰으로 /dashboard 접근
        MW->>Router: redirect('/admin/dashboard')
        Router-->>User: 관리자 대시보드
    else 올바른 레벨 토큰
        MW-->>User: 요청 페이지 표시
    end
```

---

## 5. 로그아웃 흐름

```mermaid
sequenceDiagram
    actor User
    participant Header as AppHeader
    participant Store as AuthStore
    participant Cookie as Cookie Store
    participant Router as Next.js Router

    User->>Header: 로그아웃 클릭
    Header->>Store: logout()
    Store->>Store: user = null, accessToken = null, level = null
    Store->>Cookie: deleteCookie('hanmam_level')
    Store-->>Header: 완료
    Header->>Router: router.push('/login')
    Router-->>User: 로그인 선택 페이지
```
