# ambKMS 권한 체계 정리

> 작성일: 2026-03-01
> 대상: ADMIN_LEVEL / USER_LEVEL 전체 권한 구조

---

## 1. 레벨-역할 구조 (System-wide)

| 레벨 | 역할 | 계층 순위 | 데이터 범위 | 소속 조건 | 설명 |
|------|------|:---------:|------------|----------|------|
| **ADMIN_LEVEL** | `SUPER_ADMIN` | 5 (최상위) | `ALL` (전체) | HQ(ROOT)만 가능 | 시스템 최고 관리자. 모든 권한 |
| **ADMIN_LEVEL** | `ADMIN` | 4 | `ALL` (전체) | HQ(ROOT)만 가능 | 운영 관리자. 설정 일부 제외 |
| **USER_LEVEL** | `MANAGER` | 3 | `OWN_ORG` (소속 법인) | 하위 법인(SUBSIDIARY) | 부서/팀 관리자 |
| **USER_LEVEL** | `MEMBER` | 2 | `OWN_ORG` (소속 법인) | 하위 법인(SUBSIDIARY) | 일반 직원 |
| **USER_LEVEL** | `VIEWER` | 1 (최하위) | `OWN_ORG` (소속 법인) | 하위 법인(SUBSIDIARY) | 읽기 전용 |

### 레벨-역할 유효 조합

```
ADMIN_LEVEL → SUPER_ADMIN, ADMIN
USER_LEVEL  → MANAGER, MEMBER, VIEWER
```

> ADMIN_LEVEL 사용자에게 MANAGER/MEMBER/VIEWER 역할을 부여할 수 없으며, 그 반대도 불가.

---

## 2. 메뉴별 접근 권한

| 메뉴 | SUPER_ADMIN | ADMIN | MANAGER | MEMBER | VIEWER |
|------|:-----------:|:-----:|:-------:|:------:|:------:|
| **Dashboard** | RW | RW | RW | RW | R |
| **Chat (AI)** | RW | RW | RW | RW | R |
| **Projects** | RW | RW | RW | RW | R |
| **Issues** | RW | RW | RW | RW | R |
| **Notices** | RW | RW | R | R | R |
| **HR** | RW | RW | R | - | - |
| **Members** | RW | RW | - | - | - |
| **Settings** | RW | - | - | - | - |

> `RW` = 읽기+쓰기 · `R` = 읽기 전용 · `-` = 접근 불가

---

## 3. 데이터 접근 범위 비교

| 구분 | ADMIN_LEVEL | USER_LEVEL |
|------|-------------|------------|
| **데이터 범위** | 전체 조직 (ALL) | 소속 법인만 (OWN_ORG) |
| **타 법인 데이터** | 열람/수정 가능 | 불가 |
| **조직 관리** | 전체 조직 CRUD | 불가 |
| **사용자 관리** | 전체 사용자 관리 | 불가 (MANAGER도 불가) |
| **시스템 설정** | SUPER_ADMIN만 가능 | 불가 |
| **API Key / SMTP** | SUPER_ADMIN만 가능 | 불가 |

---

## 4. ACL 기반 접근 제어 (Work Item 단위)

5단계 순차 검증 — 위에서부터 매칭되면 해당 권한 부여:

| 순서 | 조건 | 부여 권한 |
|:----:|------|----------|
| 1 | 소유자 (Owner) | `ADMIN` (전체 제어) |
| 2 | 시스템 역할 (ADMIN / CHAIRMAN) | `COMMENT` (읽기+코멘트) |
| 3 | 상위 관리자 (부서장 등) | `COMMENT` (읽기+코멘트) |
| 4 | 명시적 공유 (Sharing) | 공유 시 지정한 레벨 |
| 5 | 공개 범위 (PUBLIC / ENTITY / UNIT) | `VIEW` (읽기만) |
| 6 | 해당 없음 | **거부** |

### ACL 권한 수준

```
VIEW (1) < COMMENT (2) < EDIT (3) < ADMIN (4)
```

---

## 5. 도메인별 역할 (별도 체계)

시스템 역할(SUPER_ADMIN ~ VIEWER)과는 독립적으로, 각 도메인 내에서 별도 역할이 부여됨.

### 5.1 HR 역할

| 역할 | 설명 |
|------|------|
| `SYSTEM_ADMIN` | 시스템 관리자 |
| `HR_ADMIN` | HR 관리자 |
| `FINANCE_MANAGER` | 재무 관리자 |
| `CHAIRMAN` | 회장/대표 |
| `EMPLOYEE` | 직원 |

### 5.2 Unit(부서) 역할

| 역할 | 설명 |
|------|------|
| `UNIT_HEAD` | 부서장 |
| `TEAM_LEAD` | 팀장 |
| `MEMBER` | 팀원 |

### 5.3 Project 역할

| 역할 | 설명 |
|------|------|
| `PM` | 프로젝트 매니저 |
| `LEAD` | 리드 |
| `MEMBER` | 팀원 |
| `REVIEWER` | 검토자 |
| `OBSERVER` | 옵저버 |

### 5.4 Talk(채팅) 역할

| 역할 | 설명 |
|------|------|
| `OWNER` | 채팅방 소유자 |
| `ADMIN` | 채팅방 관리자 |
| `MEMBER` | 채팅방 멤버 |

---

## 6. 사용자 상태별 접근 제한

| 상태 | 로그인 | API 접근 | 에러 코드 | 비고 |
|------|:------:|:--------:|:---------:|------|
| `ACTIVE` | O | O | - | 정상 |
| `PENDING` | O | X | E1010 | 가입 승인 대기 |
| `INACTIVE` | X | X | E1004 | 비활성 |
| `SUSPENDED` | X | X | E1003 | 정지 |
| `WITHDRAWN` | X | X | E1002 | 탈퇴 |

> `mustChangePw = true` 상태에서는 비밀번호 변경 API만 허용 (E1011)

---

## 7. 관련 소스 파일

| 파일 | 내용 |
|------|------|
| `packages/types/src/user-level.types.ts` | 레벨, 역할, 상태, 유효 조합 정의 |
| `packages/types/src/permission.types.ts` | 데이터 범위, 역할별 범위, 메뉴 권한 |
| `packages/types/src/hr.types.ts` | HR 전용 역할 |
| `packages/types/src/domain.types.ts` | 도메인별 역할 (Unit, Project, Talk) |
| `packages/common/src/permission.util.ts` | 권한 검증 유틸리티 함수 |
| `apps/api/src/domain/auth/guard/level-role.guard.ts` | 레벨/역할 기반 가드 |
| `apps/api/src/domain/auth/decorator/auth.decorator.ts` | 인증/권한 데코레이터 |
| `apps/api/src/global/guard/roles.guard.ts` | 역할 기반 가드 (계층 순위) |
| `apps/api/src/domain/acl/service/access-control.service.ts` | 다층 접근 제어 로직 |
| `apps/api/src/global/constant/menu-code.constant.ts` | 메뉴 코드 및 역할별 기본 권한 |
