# REQ-260413-auth-login

## 1. 개요

| 항목 | 내용 |
|------|------|
| 문서번호 | REQ-260413-auth-login |
| 작성일 | 2026-04-13 |
| 기능명 | 인증 시스템 — 로그인 페이지 및 레벨별 분기 |
| 요청자 | 프로젝트 관리자 (김익용 CEO) |
| 참조 표준 | amoeba_basic_SPEC_v2.1.md §8 (Authentication & Authorization) |
| 상태 | 검토 중 |

---

## 2. 배경 및 목적

한마음시스템(HANMAM by AMA)은 **HQ + 산하 9개 법인**이 단일 플랫폼을 사용하는 멀티테넌트 경영관리 시스템이다.
사용자는 역할에 따라 **관리자(ADMIN)**, **사용자(USER)**, **고객사(CLIENT)** 세 레벨로 구분되며, 각 레벨은 접근 가능한 화면과 기능이 완전히 다르다.

단일 `/login` 진입점에서 레벨별 전용 로그인 페이지로 분기하고, 로그인 완료 후에는 레벨에 맞는 대시보드로 이동한다.

---

## 3. 사용자 레벨 정의

### 3.1 ADMIN_LEVEL — 관리자 모드

> 사이트 전체 설정, 법인 등록, API 등록, 외부연동, 관리자 등록

| 역할 코드 | 역할명 | 권한 범위 |
|----------|--------|---------|
| `SUPER_ADMIN` | 슈퍼관리자 | 전체 시스템 제어 (법인 생성/삭제, 시스템 설정, 관리자 등록) |
| `ADMIN` | 관리자 | 법인 관리, API 등록, 외부연동 설정, 사용자 모니터링 |

- 로그인 경로: `/admin/login`
- 로그인 후 이동: `/admin/dashboard`
- 접근 URL 패턴: `/admin/**`

### 3.2 USER_LEVEL — 사용자 모드

> 각 법인별 내부 직원 (업무 수행)

| 역할 코드 | 역할명 | 권한 범위 |
|----------|--------|---------|
| `OWNER` | 법인소유자 | 해당 법인 전체 제어 |
| `MASTER` | 법인관리자 | 법인 내 사용자 관리, 모든 업무 기능 |
| `DIRECTOR` | 임원 | 경영정보 열람, 승인 결재 |
| `MANAGER` | 매니저 | 팀 업무 관리, 결재 승인 |
| `MEMBER` | 멤버 | 본인 업무 수행, 기안 결재 |
| `VIEWER` | 뷰어 | 읽기 전용 열람 |

- 로그인 경로: `/user/login`
- 로그인 후 이동: `/dashboard` (법인별 메인 대시보드)
- 접근 URL 패턴: `/(main)/**`

### 3.3 CLIENT_LEVEL — 고객사 모드

> 각 법인별 거래처, 서비스 이용 고객, 협력사

| 역할 코드 | 역할명 | 권한 범위 |
|----------|--------|---------|
| `CLIENT` | 고객사 | 계약 조회, 서비스 요청, 청구서 확인 |

- 로그인 경로: `/client/login`
- 로그인 후 이동: `/client/dashboard`
- 접근 URL 패턴: `/client/**`

---

## 4. 기능 요구사항

### 4.1 /login — 레벨 선택 분기 페이지

| ID | 요구사항 | 우선순위 | 비고 |
|----|---------|---------|------|
| FR-001 | `/login` 접속 시 레벨 선택 화면 표시 | 필수 | 3개 버튼/카드: 관리자/직원/고객사 |
| FR-002 | 각 카드 클릭 시 해당 레벨 로그인 페이지로 이동 | 필수 | `/admin/login`, `/user/login`, `/client/login` |
| FR-003 | 이미 로그인된 사용자가 `/login` 접속 시 본인 레벨 홈으로 리다이렉트 | 권장 | JWT 토큰 유효성 확인 |

### 4.2 /admin/login — 관리자 로그인

| ID | 요구사항 | 우선순위 | 비고 |
|----|---------|---------|------|
| FR-010 | 이메일 + 비밀번호 입력 폼 | 필수 | |
| FR-011 | 로그인 성공 시 `/admin/dashboard` 이동 | 필수 | |
| FR-012 | ADMIN_LEVEL 계정만 로그인 허용 (USER_LEVEL 시도 시 에러) | 필수 | `"관리자 계정이 아닙니다"` 메시지 |
| FR-013 | 5회 실패 시 30분 계정 잠금 | 필수 | amoeba SPEC §8.4 |
| FR-014 | 관리자 로그인 페이지임을 시각적으로 구분 (배경색/레이블) | 권장 | |

### 4.3 /user/login — 직원 로그인

| ID | 요구사항 | 우선순위 | 비고 |
|----|---------|---------|------|
| FR-020 | 이메일 + 비밀번호 입력 폼 | 필수 | |
| FR-021 | 법인 선택 (법인이 2개 이상 소속된 경우) | 권장 | MVP는 단일 법인 기준 |
| FR-022 | 로그인 성공 시 `/dashboard` 이동 | 필수 | |
| FR-023 | USER_LEVEL 계정만 허용 | 필수 | |
| FR-024 | 비밀번호 찾기 링크 | 권장 | MVP는 UI만 |
| FR-025 | 이메일 저장 (Remember me) | 선택 | localStorage |

### 4.4 /client/login — 고객사 로그인

| ID | 요구사항 | 우선순위 | 비고 |
|----|---------|---------|------|
| FR-030 | 이메일 + 비밀번호 입력 폼 | 필수 | |
| FR-031 | 로그인 성공 시 `/client/dashboard` 이동 | 필수 | |
| FR-032 | CLIENT_LEVEL 계정만 허용 | 필수 | |
| FR-033 | 고객사 포털임을 시각적으로 구분 | 권장 | |

### 4.5 공통 인증 처리

| ID | 요구사항 | 우선순위 | 비고 |
|----|---------|---------|------|
| FR-040 | JWT Access Token (8h) + Refresh Token (7d) 발급 | 필수 | amoeba SPEC §8.2 |
| FR-041 | Access Token은 메모리(Zustand) 저장 | 필수 | |
| FR-042 | Refresh Token은 HttpOnly Cookie 저장 | 필수 | CSRF 방지 |
| FR-043 | 로그아웃 시 토큰 무효화 + Cookie 삭제 | 필수 | |
| FR-044 | 비밀번호 bcrypt 해싱 (salt rounds: 12) | 필수 | |
| FR-045 | 입력값 서버사이드 DTO 검증 (class-validator) | 필수 | |

---

## 5. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 보안 | 비밀번호 평문 전송 금지 (HTTPS 필수), bcrypt salt 12 |
| Rate Limiting | 인증 엔드포인트 분당 10회 제한 (throttler) |
| 응답시간 | 로그인 API 응답 500ms 이내 |
| 입력검증 | SQL Injection 방지 (TypeORM parameterized), XSS 방지 (HTML escape) |
| 접근제어 | 레벨 불일치 로그인 시도 명확한 에러 메시지 + 로깅 |
| UX | 로딩 상태 표시, 에러 메시지 한국어 |
| 반응형 | 모바일/태블릿/데스크톱 지원 |

---

## 6. 이벤트 시나리오

### 시나리오 A — 정상 관리자 로그인

```
1. 사용자 → /login 접속
2. "관리자" 카드 클릭 → /admin/login 이동
3. admin@amoeba.group / amb2026!@# 입력
4. POST /api/v1/auth/admin/login 호출
5. 서버: ADMIN_LEVEL 검증 → JWT 발급 (Access 8h + Refresh 7d)
6. 클라이언트: Access Token 메모리 저장, Refresh Token Cookie 설정
7. /admin/dashboard 리다이렉트
```

### 시나리오 B — 정상 직원 로그인

```
1. 사용자 → /login → "직원" 클릭 → /user/login
2. gray.kim@amoeba.group / amb2026!@# 입력
3. POST /api/v1/auth/user/login
4. USER_LEVEL 검증 → JWT 발급
5. /dashboard 리다이렉트
```

### 시나리오 C — 정상 고객사 로그인

```
1. 사용자 → /login → "고객사" 클릭 → /client/login
2. fremd@naver.com / amb2026!@# 입력
3. POST /api/v1/auth/client/login
4. CLIENT_LEVEL 검증 → JWT 발급
5. /client/dashboard 리다이렉트
```

### 시나리오 D — 레벨 불일치 오류

```
1. /admin/login 에서 USER_LEVEL 계정으로 로그인 시도
2. 서버: ADMIN_LEVEL 아님 감지
3. HTTP 403 + { code: "E4030", message: "관리자 계정이 아닙니다." }
4. 클라이언트: 에러 메시지 표시, 입력 초기화 안 함
```

### 시나리오 E — 5회 실패 잠금

```
1. 잘못된 비밀번호 5회 연속 입력
2. HTTP 429 + { code: "E4291", message: "30분 후 다시 시도해주세요." }
3. 30분 동안 해당 이메일 로그인 차단
```

---

## 7. 초기 시드 계정

| 이메일 | 레벨 | 역할 | 비밀번호 |
|--------|------|------|---------|
| `admin@amoeba.group` | ADMIN_LEVEL | ADMIN | `amb2026!@#$` |
| `gray.kim@amoeba.group` | USER_LEVEL | MEMBER | `amb2026!@#$` |
| `fremd@naver.com` | CLIENT_LEVEL | CLIENT | `amb2026!@#$` |

> DB 시드 파일: `docker/postgres/init/02_seed.sql` (신규 생성 필요)

---

## 8. API 엔드포인트 (초안)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/auth/admin/login` | 관리자 로그인 |
| POST | `/api/v1/auth/user/login` | 직원 로그인 |
| POST | `/api/v1/auth/client/login` | 고객사 로그인 |
| POST | `/api/v1/auth/logout` | 로그아웃 (공통) |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |

---

## 9. 프론트엔드 라우트 구조

```
app/
├── (auth)/                    ← 인증 레이아웃 그룹 (헤더/사이드바 없음)
│   ├── login/
│   │   └── page.tsx           ← 레벨 선택 분기 페이지
│   ├── admin/
│   │   └── login/
│   │       └── page.tsx       ← 관리자 로그인
│   ├── user/
│   │   └── login/
│   │       └── page.tsx       ← 직원 로그인
│   └── client/
│       └── login/
│           └── page.tsx       ← 고객사 로그인
├── (main)/                    ← 직원 레이아웃 그룹 (현행 유지)
│   └── dashboard/ ...
├── (admin)/                   ← 관리자 레이아웃 그룹 (신규)
│   └── dashboard/ ...
└── (client)/                  ← 고객사 레이아웃 그룹 (신규)
    └── dashboard/ ...
```

---

## 10. 제약사항 및 가정

| 항목 | 내용 |
|------|------|
| MVP 범위 | 목업(Mock) 인증 구현 → 실제 JWT 발급은 백엔드 연동 시 교체 |
| 소셜 로그인 | MVP 제외 (Google OAuth는 향후 단계) |
| 비밀번호 찾기 | MVP는 UI 버튼만 구현 (SMTP 연동 제외) |
| 법인 선택 | MVP는 단일 법인 기준 (멀티 법인 선택은 v2) |
| 시드 계정 | Docker init SQL로 주입 (개발 환경 전용) |
| 보안 | 개발 환경에서는 HTTP 허용, 운영은 TLS 1.3 필수 |
