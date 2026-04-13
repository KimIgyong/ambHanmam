# TC-UserGroupPermission-Test-20260222

## 테스트 범위
PLAN-UserGroupPermission-작업계획에 따른 사용자 그룹/권한 체계 구현 테스트

---

## 1. 단위 테스트

### 1-1. 공유 타입/유틸 (packages/)

| TC-ID | 대상 | 테스트 내용 | 예상 결과 |
|-------|------|-----------|----------|
| TC-001 | `user-group.types.ts` | USER_ROLE 상수 5개 확인 | SUPER_ADMIN, ADMIN, MANAGER, MEMBER, VIEWER 존재 |
| TC-002 | `user-group.types.ts` | VALID_GROUP_ROLES 검증 | ADMIN_GROUP: [SUPER_ADMIN, ADMIN], USER_GROUP: [MANAGER, MEMBER, VIEWER] |
| TC-003 | `permission.types.ts` | MENU_PERMISSIONS 16개 메뉴 검증 | 각 메뉴에 allowedRoles, readOnlyRoles 존재 |
| TC-004 | `permission.util.ts` | isValidGroupRole('ADMIN_GROUP', 'SUPER_ADMIN') | true |
| TC-005 | `permission.util.ts` | isValidGroupRole('USER_GROUP', 'SUPER_ADMIN') | false |
| TC-006 | `permission.util.ts` | getDataScope('SUPER_ADMIN') | 'ALL' |
| TC-007 | `permission.util.ts` | getDataScope('MEMBER') | 'OWN_ORG' |
| TC-008 | `permission.util.ts` | isHqUser('ADMIN_GROUP') | true |

### 1-2. DB 엔티티 (entity)

| TC-ID | 대상 | 테스트 내용 | 예상 결과 |
|-------|------|-----------|----------|
| TC-010 | `hr-entity.entity.ts` | entLevel, entParentId, entIsHq, entSortOrder 컬럼 존재 | TypeORM synchronize 시 컬럼 생성됨 |
| TC-011 | `user.entity.ts` | usrGroupCode, usrStatus 등 9개 신규 컬럼 | 기본값 정상: usrGroupCode='USER_GROUP', usrRole='MEMBER' |
| TC-012 | `invitation.entity.ts` | invGroupCode, invCompanyId, invAutoApprove | FK 정상, boolean default false |

### 1-3. Auth 서비스

| TC-ID | 대상 | 테스트 내용 | 예상 결과 |
|-------|------|-----------|----------|
| TC-020 | `auth.service.ts` login | WITHDRAWN 상태 사용자 로그인 | E1002 에러 |
| TC-021 | `auth.service.ts` login | SUSPENDED 상태 사용자 로그인 | E1003 에러 |
| TC-022 | `auth.service.ts` login | INACTIVE 상태 사용자 로그인 | E1004 에러 |
| TC-023 | `auth.service.ts` login | PENDING 상태 사용자 로그인 | 토큰 발급 성공 (status=PENDING 포함) |
| TC-024 | `auth.service.ts` login | ACTIVE HQ 사용자 로그인 | isHq=true, group=ADMIN_GROUP 포함 |
| TC-025 | `auth.service.ts` generateTokens | JWT payload 내용 | sub, email, group, role, status, companyId, isHq, mustChangePw 포함 |
| TC-026 | `auth.service.ts` changePassword | 비밀번호 변경 후 | usrMustChangePw=false 설정됨 |

### 1-4. JWT Strategy

| TC-ID | 대상 | 테스트 내용 | 예상 결과 |
|-------|------|-----------|----------|
| TC-030 | `jwt.strategy.ts` | 유효한 JWT 검증 | UserPayload에 group, status, companyId, isHq 포함 |
| TC-031 | `jwt.strategy.ts` | 삭제된 사용자의 JWT | UnauthorizedException |
| TC-032 | `jwt.strategy.ts` | Cookie + Bearer 이중 추출 | 두 방식 모두 정상 동작 |

### 1-5. Guards

| TC-ID | 대상 | 테스트 내용 | 예상 결과 |
|-------|------|-----------|----------|
| TC-040 | `group-role.guard.ts` | WITHDRAWN 사용자 요청 | ForbiddenException |
| TC-041 | `group-role.guard.ts` | ADMIN_GROUP 필요하나 USER_GROUP 사용자 | ForbiddenException |
| TC-042 | `roles.guard.ts` | VIEWER 사용자가 ADMIN 필요 API 접근 | ForbiddenException |
| TC-043 | `roles.guard.ts` | ADMIN 사용자가 MANAGER 필요 API 접근 | 성공 (계층적 비교) |

---

## 2. 통합 테스트

### 2-1. 초대 → 수락 → 승인 플로우

| TC-ID | 단계 | API | 요청 | 예상 결과 |
|-------|------|-----|------|----------|
| TC-100 | 초대 생성 | POST /invitations | {email, role, department, group_code, company_id, auto_approve:false} | 201, 초대 생성됨 |
| TC-101 | 토큰 검증 | GET /invitations/validate/{token} | - | 200, {valid:true, groupCode, companyId} |
| TC-102 | 초대 수락 | POST /invitations/token/{token}/accept | {name, password} | 200, {status:'PENDING'} |
| TC-103 | 펜딩 목록 | GET /members/pending/list | - | 200, 앞서 생성된 사용자 포함 |
| TC-104 | 사용자 승인 | PUT /members/{id}/approve | - | 200, {success:true} |
| TC-105 | 승인 후 로그인 | POST /auth/login | {email, password} | 200, status=ACTIVE |

### 2-2. 자동 승인 초대 플로우

| TC-ID | 단계 | API | 예상 결과 |
|-------|------|-----|----------|
| TC-110 | 초대 생성 (auto_approve:true) | POST /invitations | 201 |
| TC-111 | 초대 수락 | POST /invitations/token/{token}/accept | {status:'ACTIVE'} |
| TC-112 | 즉시 로그인 가능 | POST /auth/login | 200, ACTIVE |

### 2-3. 역할 계층 테스트

| TC-ID | 사용자 역할 | 대상 API | 예상 결과 |
|-------|------------|---------|----------|
| TC-120 | VIEWER | GET /members | 성공 (USER≡MEMBER 이상) |
| TC-121 | VIEWER | POST /invitations | 403 (MANAGER 이상 필요) |
| TC-122 | MEMBER | PATCH /members/{id}/role | 403 (ADMIN 이상 필요) |
| TC-123 | ADMIN | PUT /members/{id}/approve | 성공 |
| TC-124 | SUPER_ADMIN | 모든 API | 성공 |

### 2-4. DataScope 테스트

| TC-ID | 사용자 | 기대 scope | 설명 |
|-------|-------|-----------|------|
| TC-130 | HQ SUPER_ADMIN | ALL | 모든 조직 데이터 접근 |
| TC-131 | HQ ADMIN | ALL | 모든 조직 데이터 접근 |
| TC-132 | 자회사 MANAGER | OWN_ORG | 본인 법인 데이터만 |
| TC-133 | 자회사 MEMBER | OWN_ORG | 본인 법인 데이터만 |

---

## 3. 프론트엔드 라우팅 테스트

| TC-ID | 사용자 상태 | 접근 경로 | 예상 결과 |
|-------|------------|---------|----------|
| TC-200 | 비로그인 | / | /login 리다이렉트 |
| TC-201 | PENDING | / | /pending 리다이렉트 |
| TC-202 | INACTIVE | / | /inactive 리다이렉트 |
| TC-203 | SUSPENDED | / | /inactive 리다이렉트 |
| TC-204 | mustChangePw=true | / | /force-change-password 리다이렉트 |
| TC-205 | ACTIVE | / | DashboardPage 정상 표시 |
| TC-206 | 비로그인 | /invite/{token} | InviteAcceptPage 표시 (public) |
| TC-207 | ACTIVE | /unauthorized | UnauthorizedPage 정상 표시 |

---

## 4. 엣지 케이스

| TC-ID | 시나리오 | 예상 결과 |
|-------|---------|----------|
| TC-300 | 만료된 초대 토큰으로 수락 | 400 INVITATION_EXPIRED |
| TC-301 | 이미 수락된 초대 토큰으로 재수락 | 400 INVITATION_ALREADY_ACCEPTED |
| TC-302 | 이미 등록된 이메일로 초대 수락 | 409 USER_ALREADY_EXISTS |
| TC-303 | 취소된 초대 토큰으로 검증 | 400 INVITATION_CANCELLED |
| TC-304 | PENDING 사용자 이중 승인 | 404 (first approve already changed status) |
| TC-305 | WITHDRAWN 사용자 이중 거부 | 404 |
| TC-306 | JWT 만료 후 refresh | 새 토큰 발급 성공 |
| TC-307 | 비밀번호 변경 후 mustChangePw | false로 업데이트 확인 |

---

## 5. 빌드 테스트 결과

| 영역 | 명령 | 결과 |
|------|------|------|
| packages/types | `npx tsc --noEmit` | ✅ PASS |
| packages/common | `npx tsc --noEmit` | ✅ PASS |
| apps/api | `npx tsc --noEmit` (관련 파일) | ✅ PASS (기존 acl/billing 에러 무관) |
| apps/web | `npx tsc --noEmit` | ✅ PASS |
| apps/* (전체 빌드) | `npm run build` | ✅ PASS (4/4 tasks) |
