# 요구사항 분석서: USER_LEVEL 법인별 독립 로그인 체계

- **문서번호**: REQ-USER_LEVEL법인별독립로그인-20260309
- **작성일**: 2026-03-09
- **참조**: REQ-다법인로그인-20260307 (기존 분석서, 이번 요구사항으로 대체)

---

## 1. 요구사항 핵심 요약

| 항목 | 내용 |
|------|------|
| **대상** | USER_LEVEL 사용자 |
| **핵심 변경** | 동일 이메일이 여러 entity에 속할 때, 각 법인별로 **독립적인 사용자 계정**처럼 운영 |
| **유니크 키 변경** | `usr_email` (현재) → `entity_id + email` (변경 후) |
| **로그인 플로우** | 이메일/비밀번호 → 법인 선택 → 해당 법인 컨텍스트로 접속 |
| **법인간 이동** | 로그아웃 후 재로그인으로만 가능 (런타임 전환 불가) |
| **마이페이지** | 법인별 개별 운영 (프로필, 설정 등 독립) |

---

## 2. AS-IS 현황 분석

### 2.1 현재 데이터 모델

```
amb_users (사용자 테이블)
├── usr_id (UUID, PK)
├── usr_email (VARCHAR, UNIQUE) ← 이메일이 전역 유니크
├── usr_password
├── usr_name
├── usr_role (MASTER/MANAGER/MEMBER/VIEWER)
├── usr_level_code (ADMIN_LEVEL/USER_LEVEL)
├── usr_company_id (FK → amb_hr_entities.ent_id) ← 단일 법인 참조
├── usr_status (PENDING/ACTIVE/...)
├── usr_timezone, usr_locale
├── usr_token_version
└── ... (설정, 서명이미지 등)

amb_hr_entity_user_roles (법인-사용자 역할 매핑)
├── eur_id (UUID, PK)
├── ent_id + usr_id (UNIQUE) ← 법인당 1개 역할
├── eur_role
└── eur_status
```

### 2.2 현재 로그인 플로우

```
1. POST /auth/login (email, password)
   → amb_users에서 usr_email로 1건 조회
   → 비밀번호 비교
   → JWT 생성 (entityId = usr_company_id)
   → HttpOnly 쿠키 설정

2. 프론트엔드
   → LoginPage → navigate('/select-entity')
   → GET /hr/entities → 속한 법인 목록 (EntityUserRoleEntity 기반)
   → 법인 선택 → entityStore.setCurrentEntity()
   → X-Entity-Id 헤더로 API 호출

3. 법인 전환
   → 헤더 EntitySelector 드롭다운에서 선택 변경
   → entityStore.setCurrentEntity() → 즉시 전환 (재로그인 없음)
```

### 2.3 현재 구조의 문제점

| # | 문제 | 상세 |
|---|------|------|
| 1 | **이메일 전역 유니크** | 동일 이메일이 여러 법인에서 독립 계정을 가질 수 없음 |
| 2 | **usr_company_id 단일 참조** | 사용자가 1개 법인에만 "소속"될 수 있음 (EntityUserRoleEntity로 다법인 접근은 가능하지만, 실제 소속은 1곳) |
| 3 | **JWT에 entityId 고정** | 로그인 시점에 usr_company_id 기반으로 entityId가 결정되어, 다른 법인 컨텍스트로 전환해도 JWT는 동일 |
| 4 | **프로필 공유** | 이름, 타임존, 언어, 서명이미지 등이 법인과 무관하게 1벌만 존재 |
| 5 | **법인간 런타임 전환** | 프론트엔드에서 EntitySelector로 자유롭게 전환 가능 → 권한/데이터 격리 약함 |

---

## 3. TO-BE 요구사항

### 3.1 데이터 모델 변경

#### 안 A: amb_users 테이블 구조 유지 + UNIQUE 제약 변경 (권장)

```
amb_users
├── usr_id (UUID, PK) — 변경 없음
├── usr_email (VARCHAR) ← UNIQUE 제거
├── usr_company_id (UUID) ← NOT NULL (USER_LEVEL 필수)
├── UNIQUE(usr_email, usr_company_id) ← 신규: entity+email 유니크
└── ... 나머지 동일

※ ADMIN_LEVEL 사용자: usr_company_id = HQ entity ID, 기존 방식 유지
※ USER_LEVEL 사용자: 법인당 별도 usr_id 행 생성 (법인별 독립 계정)
```

**장점**: 기존 구조 변경 최소화. usr_id 기반 모든 FK가 그대로 동작.
**단점**: 같은 이메일의 여러 행이 생기므로, 로그인 시 email만으로는 특정할 수 없음.

#### 데이터 변환 예시

```
AS-IS:
  usr_id=A, email=fremd@naver.com, company_id=AAA, role=MASTER
  + entity_user_roles: (AAA, A, MASTER), (BBB, A, MEMBER)

TO-BE:
  usr_id=A, email=fremd@naver.com, company_id=AAA, role=MASTER
  usr_id=B, email=fremd@naver.com, company_id=BBB, role=MEMBER
  + entity_user_roles: (AAA, A, MASTER), (BBB, B, MEMBER)
```

### 3.2 로그인 플로우 변경

```
1. POST /auth/login (email, password)
   → amb_users에서 usr_email로 N건 조회 (withDeleted: false)
   → 각 행의 비밀번호 비교 (모든 법인 계정이 동일 비밀번호일 수도, 다를 수도 있음)
   → 비밀번호 매칭되는 계정 목록 반환
   → JWT는 아직 발급하지 않음 (또는 임시 토큰 발급)

2. 법인 선택 화면 (EntitySelectPage)
   → 로그인 응답에서 받은 법인 목록 표시
   → 법인 선택

3. POST /auth/select-entity (user_id 또는 entity_id)
   → 선택된 법인의 usr_id로 JWT 생성
   → entityId = 선택된 entity_id
   → HttpOnly 쿠키 설정
   → 홈으로 이동

4. 법인 전환 = 로그아웃 후 재로그인
   → EntitySelector 제거 또는 "로그아웃 후 법인 변경" 안내
```

### 3.3 초대/회원가입 플로우 변경

```
AS-IS:
  초대 → 사용자 생성 (usr_email UNIQUE 기준으로 중복 체크)
  → 이미 있으면 409 CONFLICT

TO-BE:
  초대 → (email + company_id) 기준 중복 체크
  → 같은 이메일이 다른 법인에 있어도 허용
  → 법인별 별도 usr_id 행 생성
  → 비밀번호: 새로 설정 (법인별 독립)
```

### 3.4 마이페이지 / 프로필

- 법인별 독립 프로필 (이름, 서명이미지, 타임존, 언어 등)
- 법인 A에서 이름을 "홍길동"으로, 법인 B에서 "Hong"으로 설정 가능

### 3.5 법인간 전환 정책

| 항목 | 정책 |
|------|------|
| 런타임 법인 전환 | **불가** — 로그아웃 후 재로그인 필요 |
| EntitySelector 드롭다운 | 제거 또는 "법인 전환" 클릭 시 로그아웃 처리 |
| JWT entityId | 로그인 시 확정, 세션 내 변경 불가 |

---

## 4. 수정 범위 분석 (Impact Analysis)

### 4.1 백엔드 수정 대상

| 파일 | 수정 내용 | 영향도 |
|------|----------|--------|
| `auth/entity/user.entity.ts` | `usr_email` UNIQUE 제거, `UNIQUE(usr_email, usr_company_id)` 추가 | **Critical** |
| `auth/service/auth.service.ts` | `login()`: email로 다건 조회 → 비밀번호 매칭 → 법인 목록 반환, `register()`: (email+company_id) 중복 체크, 새 `selectEntity()` 메서드 | **Critical** |
| `auth/controller/auth.controller.ts` | `POST /auth/select-entity` 엔드포인트 추가, login 응답 형태 변경 | **High** |
| `auth/strategy/jwt.strategy.ts` | entityId 필수화 (USER_LEVEL), validate에서 entityId 기반 검증 강화 | **High** |
| `auth/guard/own-entity.guard.ts` | JWT entityId가 요청 entityId와 일치하는지 검증 강화 | **Medium** |
| `invitation/service/invitation.service.ts` | `accept()`: (email+company_id) 중복 체크, 기존 사용자 있어도 다른 법인이면 새 계정 생성 | **High** |
| `entity-settings/service/entity-member.service.ts` | `inviteMember()`: 중복 체크 로직 변경 (email+entityId) | **High** |
| `hr/service/entity.service.ts` | `getEntitiesForUser()`: 더 이상 필요 없을 수 있음 (로그인 시 결정) | **Medium** |
| `auth/interface/jwt-payload.interface.ts` | entityId 필수 필드로 변경 (USER_LEVEL) | **Low** |

### 4.2 프론트엔드 수정 대상

| 파일 | 수정 내용 | 영향도 |
|------|----------|--------|
| `auth/pages/LoginPage.tsx` | login 응답에서 법인 목록 받아 EntitySelectPage로 전달 | **High** |
| `auth/pages/EntitySelectPage.tsx` | 법인 선택 → `POST /auth/select-entity` 호출 → JWT 발급 → 홈 이동 | **High** |
| `auth/store/auth.store.ts` | 로그인 2단계 상태 관리 (authenticated but entity not selected) | **Medium** |
| `hr/store/entity.store.ts` | `setCurrentEntity()` 로직 단순화 (로그인 시 1회만 설정) | **Medium** |
| `hr/components/EntitySelector.tsx` | 제거 또는 "법인 전환 = 로그아웃" 동작으로 변경 | **Medium** |
| `layouts/MainLayout.tsx` | EntitySelector 변경 반영 | **Low** |
| `lib/api-client.ts` | X-Entity-Id 헤더 설정 검토 (JWT에 entityId가 확정되므로 불필요할 수 있음) | **Low** |

### 4.3 DB 마이그레이션

```sql
-- 1. usr_email UNIQUE 제약 제거
ALTER TABLE amb_users DROP CONSTRAINT "UQ_136c2230d33f3985e1b1cf5ef56";

-- 2. usr_company_id NOT NULL로 변경 (USER_LEVEL만)
-- 주의: 기존 usr_company_id=NULL인 USER_LEVEL 행이 있으면 먼저 정리 필요

-- 3. (usr_email, usr_company_id) 복합 UNIQUE 추가
-- ADMIN_LEVEL은 usr_company_id=HQ이므로 충돌 없음
CREATE UNIQUE INDEX "UQ_users_email_company"
  ON amb_users(usr_email, usr_company_id)
  WHERE usr_deleted_at IS NULL;

-- 4. 기존 다법인 사용자 데이터 분리
-- EntityUserRoleEntity에 여러 법인이 있는 USER_LEVEL 사용자를 찾아
-- 각 법인별 별도 usr_id 행으로 분리 (마이그레이션 스크립트 필요)
```

### 4.4 기존 다법인 사용자 마이그레이션

현재 1명의 사용자(usr_id=A)가 EntityUserRoleEntity를 통해 법인 AAA와 BBB에 속한 경우:

```
마이그레이션 절차:
1. usr_company_id와 일치하는 법인은 기존 행 유지 (usr_id=A, company_id=AAA)
2. 나머지 법인(BBB)에 대해:
   a. 새 usr_id=B 행 생성 (email, password 복사, company_id=BBB)
   b. EntityUserRoleEntity(BBB, A) → (BBB, B)로 usr_id 변경
   c. UserUnitRoleEntity, UserCellEntity 등 BBB 관련 FK도 usr_id=B로 변경
   d. 해당 법인의 todos, issues, meeting_notes 등 작성자 FK는 유지 (주의 필요)
```

---

## 5. 영향 받는 하위 시스템

### 5.1 직접 영향

| 시스템 | 영향 | 상세 |
|--------|------|------|
| **로그인/인증** | 로그인 2단계화, JWT 구조 변경 | login → select-entity → JWT |
| **회원가입/초대** | 중복 체크 기준 변경 | email → email+entityId |
| **마이페이지** | 법인별 독립 프로필 | 자연스럽게 해결 (별도 usr_id) |
| **비밀번호** | 법인별 독립 비밀번호 | 별도 행이므로 자동 해결 |

### 5.2 간접 영향 (주의 필요)

| 시스템 | 영향 | 상세 |
|--------|------|------|
| **Talk (채팅)** | DM 상대 검색 시 같은 이메일이 여러 행 | entityId 필터 필요 |
| **메일 계정** | 법인별 회사 이메일 자동 생성 | 이미 별도 행이므로 자연 해결 |
| **Forgot Password** | 이메일로 여러 행이 조회됨 | 어떤 계정의 비밀번호를 리셋? |
| **ADMIN_LEVEL** | 전체 사용자 목록에서 같은 이메일 중복 표시 | 법인명 표시 추가 필요 |
| **통합 사용자 관리** | `/admin/total-users` | 동일인 여부 판단 어려움 |
| **포탈 브릿지** | 포탈 계정 → 매니지먼트 계정 전환 | 어떤 법인으로? |
| **Refresh Token** | 법인별 독립 tokenVersion | 별도 행이므로 자동 해결 |

### 5.3 변경 불필요 (영향 없음)

| 시스템 | 이유 |
|--------|------|
| Todo, Issue, MeetingNotes | usr_id FK 기반 → 법인별 별도 usr_id이므로 자연 격리 |
| Calendar | usr_id FK 기반 |
| Documents | usr_id FK 기반 |
| AI 에이전트 | entityId 기반 필터링 → JWT entityId로 결정 |
| 권한 시스템 | UserMenuPermission, UnitPermission 등 → usr_id 기반 |

---

## 6. 미해결 설계 결정 사항 (Open Questions)

| # | 질문 | 고려사항 |
|---|------|---------|
| 1 | **비밀번호 통합 vs 분리?** | 같은 사람이 법인마다 다른 비밀번호를 기억해야 하는가? → 분리(각 행이 독립)가 요구사항에 맞지만 UX 불편 |
| 2 | **Forgot Password 범위** | 이메일 입력 시 모든 법인 계정의 비밀번호를 리셋? 또는 법인 선택 필요? |
| 3 | **ADMIN_LEVEL도 동일 적용?** | ADMIN_LEVEL은 기존대로 단일 계정 유지 (HQ 법인 1개만 소속) |
| 4 | **기존 데이터 마이그레이션 시점** | 배포 전 DB 마이그레이션 스크립트 실행 필요, 다운타임 발생 가능 |
| 5 | **법인 전환을 완전 차단?** | 로그아웃 없이 "법인 전환" 버튼 → 자동 로그아웃 + 법인 선택 화면으로 이동? |
| 6 | **포탈 브릿지 계정 생성** | 포탈에서 고객이 매니지먼트 계정을 만들 때 어떤 법인에 속하는지 결정 필요 |

---

## 7. 구현 우선순위

### Phase 1: 핵심 (DB + 인증)
1. DB: `usr_email` UNIQUE 제거 → `(usr_email, usr_company_id)` partial unique index 추가
2. 백엔드: login → 법인 목록 반환 → select-entity → JWT 발급 2단계
3. 프론트엔드: LoginPage → EntitySelectPage → 홈 플로우
4. EntitySelector: "법인 전환" 클릭 시 로그아웃 처리

### Phase 2: 초대/가입
5. 초대: (email+entityId) 중복 체크
6. register: (email+company_id) 기준 사용자 생성
7. 기존 다법인 사용자 마이그레이션 스크립트

### Phase 3: 부수 시스템 정리
8. Forgot Password: 법인 선택 추가 또는 모든 계정 리셋
9. ADMIN 사용자 관리 UI: 동일 이메일 다법인 표시
10. Talk: 법인 컨텍스트 기반 사용자 검색

---

## 8. 수정 파일 목록 (전체)

### 백엔드
| 파일 | 작업 |
|------|------|
| `apps/api/src/domain/auth/entity/user.entity.ts` | UNIQUE 제약 변경 |
| `apps/api/src/domain/auth/service/auth.service.ts` | login/register/generateTokens 대폭 수정 |
| `apps/api/src/domain/auth/controller/auth.controller.ts` | select-entity 엔드포인트 추가 |
| `apps/api/src/domain/auth/strategy/jwt.strategy.ts` | entityId 검증 강화 |
| `apps/api/src/domain/auth/guard/own-entity.guard.ts` | JWT entityId 검증 |
| `apps/api/src/domain/auth/interface/jwt-payload.interface.ts` | entityId 필수화 |
| `apps/api/src/domain/invitation/service/invitation.service.ts` | accept, validateToken, create 수정 |
| `apps/api/src/domain/entity-settings/service/entity-member.service.ts` | inviteMember 중복 체크 |
| `apps/api/src/domain/hr/service/entity.service.ts` | getEntitiesForUser 검토 |
| `apps/api/src/domain/hr/controller/entity.controller.ts` | 엔드포인트 검토 |

### 프론트엔드
| 파일 | 작업 |
|------|------|
| `apps/web/src/domain/auth/pages/LoginPage.tsx` | 로그인 응답 처리 변경 |
| `apps/web/src/domain/auth/pages/EntitySelectPage.tsx` | select-entity API 호출 |
| `apps/web/src/domain/auth/store/auth.store.ts` | 2단계 인증 상태 |
| `apps/web/src/domain/auth/service/auth.service.ts` | selectEntity API 추가 |
| `apps/web/src/domain/hr/store/entity.store.ts` | 단순화 |
| `apps/web/src/domain/hr/components/EntitySelector.tsx` | 로그아웃+법인변경 |
| `apps/web/src/layouts/MainLayout.tsx` | EntitySelector 변경 |
| `apps/web/src/lib/api-client.ts` | X-Entity-Id 헤더 검토 |

### DB
| 작업 | SQL |
|------|-----|
| UNIQUE 제거 | `ALTER TABLE amb_users DROP CONSTRAINT "UQ_136c2230d33f3985e1b1cf5ef56"` |
| 복합 UNIQUE 추가 | `CREATE UNIQUE INDEX ON amb_users(usr_email, usr_company_id) WHERE usr_deleted_at IS NULL` |
| 데이터 마이그레이션 | 다법인 사용자 행 분리 스크립트 |
