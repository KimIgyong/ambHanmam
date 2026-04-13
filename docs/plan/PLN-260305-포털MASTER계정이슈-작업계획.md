# 작업계획서: 포털 MASTER 계정 생성 시 누락 데이터 이슈 수정

- **문서번호**: PLAN-포털MASTER계정이슈-작업계획-20260305
- **작성일**: 2026-03-05
- **관련 분석서**: REQ-포털MASTER계정이슈-20260305

---

## 작업 개요

포털 브릿지에서 내부 계정 생성 시 `EntityUserRoleEntity`와 `EmployeeEntity`를 자동 생성하여, MASTER 로그인 후 403 에러 및 기능 미작동 이슈를 해결한다.

---

## 단계별 구현 계획

### 1단계: portal-bridge.module.ts 의존성 추가

**파일**: `apps/api/src/domain/portal-bridge/portal-bridge.module.ts`

**변경 내용:**
- `TypeOrmModule.forFeature()`에 `EntityUserRoleEntity`, `EmployeeEntity` 추가

---

### 2단계: portal-bridge.service.ts 수정

**파일**: `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts`

**변경 내용:**

#### 2-1. Repository 주입 추가
- `EntityUserRoleEntity` Repository
- `EmployeeEntity` Repository

#### 2-2. createInternalAccount() 메서드 수정

User 생성/업데이트 이후 (line 192 이후), 매핑 생성 이전에:

**A) EntityUserRoleEntity 생성/업데이트:**
```typescript
// 기존 EntityUserRole 확인
let entityRole = await this.entityUserRoleRepo.findOne({
  where: { entId: dto.entity_id, usrId: user.usrId },
});
if (entityRole) {
  entityRole.eurRole = dto.role;
  entityRole.eurStatus = 'ACTIVE';
} else {
  entityRole = this.entityUserRoleRepo.create({
    entId: dto.entity_id,
    usrId: user.usrId,
    eurRole: dto.role,
    eurStatus: 'ACTIVE',
  });
}
await this.entityUserRoleRepo.save(entityRole);
```

**B) EmployeeEntity 자동 생성:**
```typescript
// 기존 Employee 확인 (같은 법인에 usrId로)
const existingEmployee = await this.employeeRepo.findOne({
  where: { usrId: user.usrId, entId: dto.entity_id },
});
if (!existingEmployee) {
  const empCode = await this.generateEmployeeCode(dto.entity_id);
  const employee = this.employeeRepo.create({
    entId: dto.entity_id,
    usrId: user.usrId,
    empCode,
    empFullName: customer.pctName,
    empNationality: 'KOREAN',
    empCccdNumber: `PORTAL-${uuidv4().replace(/-/g, '').slice(0, 8)}`,
    empStartDate: new Date().toISOString().split('T')[0],
    empStatus: 'ACTIVE',
    empContractType: 'EMPLOYEE',
    empDepartment: dto.department || 'GENERAL',
    empPosition: this.mapRoleToPosition(dto.role),
    empRegion: 'REGION_1',
    empSalaryType: 'GROSS',
    empWorkSchedule: 'MON_FRI',
  });
  await this.employeeRepo.save(employee);
}
```

#### 2-3. 헬퍼 메서드 추가

```typescript
private async generateEmployeeCode(entityId: string): Promise<string> {
  // EmployeeService.generateEmployeeCode()와 동일한 로직
}

private mapRoleToPosition(role: string): string {
  const map = { MASTER: '대표', MANAGER: '매니저', MEMBER: '사원', VIEWER: '사원' };
  return map[role] || '사원';
}
```

---

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `apps/api/src/domain/portal-bridge/portal-bridge.module.ts` | 엔티티 의존성 추가 |
| 2 | `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` | EntityUserRole + Employee 생성 로직 |

---

## 사이드 임팩트

- **낮음**: 기존 로직에 추가만 하므로 기존 동작에 영향 없음
- 이미 계정이 존재하는 기존 사용자: EntityUserRole/Employee 조회 후 없으면만 생성
- empCccdNumber unique 제약 → PORTAL-{UUID} 형태로 유니크 보장

---

## 검증

1. `npm run build` — 빌드 성공 확인
2. 포털 고객 → MASTER 역할 내부 계정 생성 → 로그인
3. notifications/unread-count → 200 OK 확인
4. MyPage → 법인 정보 정상 표시 확인
5. leave-requests/my/balance → 200 OK 확인 (Employee 존재)
6. issues/filter-presets → 200 OK 확인
7. HR Employee List → 자동 등록된 직원 확인
