# 요구사항 분석서: 포털 MASTER 계정 생성 시 누락 데이터 이슈

- **문서번호**: REQ-포털MASTER계정이슈-20260305
- **작성일**: 2026-03-05

---

## 1. AS-IS 현황

### 1.1 포털 브릿지 계정 생성 흐름 (현재)

```
포털 고객 → ADMIN이 내부 계정 생성 (createInternalAccount)
  ├─ UserEntity 생성/업데이트 (usrCompanyId, usrRole 설정)
  ├─ PortalUserMappingEntity 생성
  └─ 임시 비밀번호 이메일 발송
```

### 1.2 누락된 데이터

| 데이터 | 현재 상태 | 영향 |
|--------|-----------|------|
| EntityUserRoleEntity | 미생성 | 법인 기반 API 전체 403 에러 |
| EmployeeEntity | 미생성 | HR 기능 (연차, 직원 목록) 사용 불가 |

### 1.3 발생 증상 (MASTER 로그인 시)

| # | 증상 | 원인 |
|---|------|------|
| 1 | notifications/unread-count 403 | EntityGuard에서 EntityUserRoleEntity 없음 |
| 2 | MyPage "No organization assigned" | 프로필에서 EntityUserRoleEntity 조회 실패 |
| 3 | leave-requests/my/balance 404 | EmployeeEntity 없어 직원 조회 실패 |
| 4 | issues/filter-presets 403 | EntityGuard에서 EntityUserRoleEntity 없음 |
| 5 | Project "No organization assigned" | EntityUserRoleEntity 없음 |
| 6 | HR Employee List 미등록 | EmployeeEntity 미생성 |

---

## 2. TO-BE 요구사항

### 2.1 계정 생성 시 추가 데이터 생성

```
포털 고객 → ADMIN이 내부 계정 생성 (createInternalAccount)
  ├─ UserEntity 생성/업데이트
  ├─ PortalUserMappingEntity 생성
  ├─ ★ EntityUserRoleEntity 생성 (법인-사용자 역할 매핑)
  ├─ ★ EmployeeEntity 자동 생성 (HR 직원 등록)
  └─ 임시 비밀번호 이메일 발송
```

### 2.2 EntityUserRoleEntity 생성 규칙

- `entId`: dto.entity_id
- `usrId`: 생성된 user.usrId
- `eurRole`: dto.role과 동일한 값 (MASTER, MANAGER, MEMBER, VIEWER)
- `eurStatus`: 'ACTIVE'
- 기존 사용자 업데이트 시: 기존 EntityUserRoleEntity가 있으면 역할 업데이트, 없으면 새로 생성

### 2.3 EmployeeEntity 자동 생성 규칙

- 모든 역할의 내부 계정 생성 시 HR 직원 자동 등록
- `empCode`: generateEmployeeCode() 로직 활용 (법인코드 + 순번)
- `empFullName`: 포털 고객의 pctName
- `empNationality`: 'KOREAN' (기본값)
- `empStartDate`: 계정 생성일 (today)
- `empStatus`: 'ACTIVE'
- `empDepartment`: dto.department || 'GENERAL'
- `empPosition`: dto.role과 매핑 (MASTER→'대표', MANAGER→'매니저', MEMBER→'사원', VIEWER→'사원')
- `empCccdNumber`: 'PORTAL-{UUID 앞 8자리}' (임시값, 나중에 수정 가능)
- `usrId`: 생성된 user.usrId (계정 연결)

---

## 3. 기술 제약사항

- `EmployeeEntity.empCccdNumber`은 unique 제약. 포털에서는 실제 주민번호를 모르므로 임시 유니크 값 필요
- `generateEmployeeCode()` 로직은 `EmployeeService`에 private 메서드로 존재 → PortalBridgeService에서 직접 구현 필요
- 기존 사용자에 계정 업데이트 시 EntityUserRoleEntity 중복 방지 (Unique 제약 `entId + usrId`)
- 기존 Employee가 이미 있을 수 있음 (usrId 기준 체크 필요)

---

## 4. 영향 범위

- **수정 파일**: `portal-bridge.service.ts`, `portal-bridge.module.ts`
- **영향 모듈**: portal-bridge 모듈에 HR 엔티티 의존성 추가
- **기존 기능 영향**: 없음 (신규 로직 추가만)
