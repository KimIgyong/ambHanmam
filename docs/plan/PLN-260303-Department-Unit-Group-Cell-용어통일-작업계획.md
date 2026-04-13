# PLAN: Department → Unit / Group → Cell 용어 통일 작업계획

**작성일**: 2026-03-03  
**작성자**: Gray.Kim  
**배경**: 조직 도메인 용어를 제품 기준으로 통일 — `department` → `Unit`, 사용자 그룹 `group` → `Cell`

---

## 1. 현황 분석 (AS-IS)

### 진행 완료 항목 ✅
| 항목 | 상태 |
|------|------|
| API 라우트 경로 (`/departments` → `/units`, `/groups` → `/cells`) | ✅ 완료 |
| `DepartmentController` `@Controller('units')` | ✅ 완료 |
| `GroupController` `@Controller('cells')` | ✅ 완료 |
| 프론트엔드 API 호출 URL (`/units`, `/cells`) | ✅ 완료 |
| `apps/web/src/locales/*/hr.json` department → Unit (ko/en/vi) | ✅ 완료 (2026-03-03) |

### 미완료 항목 (본 계획 대상)
총 **3개 영역** — i18n 텍스트 / 파일명·폴더명 / 클래스·변수명

---

## 2. 변경 대상 전체 목록

### 영역 A: i18n 텍스트 (UI 표시 문구)

> 키 이름(JSON key)은 유지, **value(표시 텍스트)만 변경**

#### A-1. `apps/web/src/locales/ko/entitySettings.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `members.department` | `"부서"` | `"Unit"` |
| `permissions.tabs.unit` | `"부서별"` | `"Unit별"` |
| `permissions.tabs.cell` | `"그룹별"` | `"Cell별"` |
| `permissions.unitList` | `"부서 목록"` | `"Unit 목록"` |
| `permissions.cellList` | `"그룹 목록"` | `"Cell 목록"` |
| `permissions.noUnits` | `"등록된 부서가 없습니다"` | `"등록된 Unit이 없습니다"` |
| `permissions.noCells` | `"등록된 그룹이 없습니다"` | `"등록된 Cell이 없습니다"` |
| `permissions.selectUnit` | `"권한을 설정할 부서를 선택하세요"` | `"권한을 설정할 Unit을 선택하세요"` |
| `permissions.selectCell` | `"권한을 설정할 그룹을 선택하세요"` | `"권한을 설정할 Cell을 선택하세요"` |

#### A-2. `apps/web/src/locales/en/entitySettings.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `members.department` | `"Department"` | `"Unit"` |

#### A-3. `apps/web/src/locales/vi/entitySettings.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `members.department` | `"Phòng ban"` | `"Unit"` |

#### A-4. `apps/web/src/locales/ko/members.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `detail.unitSection` | `"소속 부서"` | `"소속 Unit"` |
| `detail.addUnit` | `"부서 추가"` | `"Unit 추가"` |
| `detail.unit` | `"부서"` | `"Unit"` |
| `detail.unitName` | `"부서명"` | `"Unit명"` |
| `detail.isPrimary` | `"주요 부서"` | `"주요 Unit"` |
| `detail.selectUnit` | `"부서를 선택하세요"` | `"Unit을 선택하세요"` |
| `detail.assignUnit` | `"부서 배정"` | `"Unit 배정"` |
| `detail.noUnits` | `"배정된 부서가 없습니다"` | `"배정된 Unit이 없습니다"` |
| `detail.confirmRemoveUnit` | `"이 부서 배정을 해제하시겠습니까?"` | `"이 Unit 배정을 해제하시겠습니까?"` |
| `detail.hrDepartment` | `"부서"` | `"Unit"` |
| `roles.UNIT_HEAD` | `"부서장"` | `"Unit장"` |

#### A-5. `apps/web/src/locales/en/members.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `detail.hrDepartment` | `"Department"` | `"Unit"` |

#### A-6. `apps/web/src/locales/ko/common.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `table.colDepartment` | `"부서"` | `"Unit"` |

#### A-7. `apps/web/src/locales/vi/common.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `table.colDepartment` | `"Bộ phận"` | `"Unit"` |

#### A-8. `apps/web/src/locales/ko/acl.json`
| 키 경로 | 현재값 | 변경값 |
|---------|--------|--------|
| `permissions.levelDepartment` | `"부서"` | `"Unit"` |

#### A-9. `apps/web/src/locales/ko/project.json` / `en/project.json`
| 파일 | 키 경로 | 현재값 | 변경값 |
|------|---------|--------|--------|
| ko | `filter.department` | `"부서"` | `"Unit"` |
| en | `filter.department` | `"Department"` | `"Unit"` |

#### A-10. `apps/web/src/locales/ko/service.json` / `en/service.json`
| 파일 | 키 경로 | 현재값 | 변경값 |
|------|---------|--------|--------|
| ko | `client.department` | `"부서"` | `"Unit"` |
| en | `client.department` | `"Department"` | `"Unit"` |

---

### 영역 B: 파일명 / 폴더명 변경

> ⚠️ 파일 rename 시 **모든 import 경로를 함께 수정**해야 함

#### B-1. API — department 도메인 폴더 전체 rename
| 현재 경로 | 변경 경로 |
|-----------|-----------|
| `apps/api/src/domain/`**`department/`** | `apps/api/src/domain/`**`unit/`** |
| └ `controller/department.controller.ts` | → `controller/unit.controller.ts` |
| └ `department.module.ts` | → `unit.module.ts` |
| └ `dto/request/create-department.request.ts` | → `dto/request/create-unit.request.ts` |
| └ `dto/request/update-department.request.ts` | → `dto/request/update-unit.request.ts` |
| └ `dto/request/assign-user-dept-role.request.ts` | → `dto/request/assign-user-unit-role.request.ts` |
| └ `mapper/department.mapper.ts` | → `mapper/unit.mapper.ts` |
| └ `service/department.service.ts` | → `service/unit.service.ts` |
| └ `service/hierarchy.service.ts` | 파일명 유지 가능 |
| └ `service/user-dept-role.service.ts` | → `service/user-unit-role.service.ts` |

#### B-2. API — members 도메인 내 group → cell 파일들
| 현재 경로 | 변경 경로 |
|-----------|-----------|
| `controller/group.controller.ts` | → `controller/cell.controller.ts` |
| `entity/group.entity.ts` | → `entity/cell.entity.ts` |
| `entity/user-group.entity.ts` | → `entity/user-cell.entity.ts` |
| `mapper/group.mapper.ts` | → `mapper/cell.mapper.ts` |
| `service/group.service.ts` | → `service/cell.service.ts` |
| `service/group-access.service.ts` | → `service/cell-access.service.ts` |
| `dto/request/create-group.request.ts` | → `dto/request/create-cell.request.ts` |
| `dto/request/update-group.request.ts` | → `dto/request/update-cell.request.ts` |
| `dto/request/assign-group-member.request.ts` | → `dto/request/assign-cell-member.request.ts` |

#### B-3. 프론트엔드 파일명
| 현재 경로 | 변경 경로 |
|-----------|-----------|
| `apps/web/src/domain/members/components/AssignDeptModal.tsx` | → `AssignUnitModal.tsx` |
| `apps/web/src/global/constant/department.constant.ts` | → `unit.constant.ts` |

---

### 영역 C: 클래스명 / 변수명 (코드 내부)

> 파일 rename과 **동시 처리** 필요 (import가 엮여 있음)

#### C-1. API — department → unit
| 현재 이름 | 변경 이름 |
|-----------|-----------|
| `DepartmentController` | `UnitController` |
| `DepartmentModule` | `UnitModule` |
| `DepartmentService` | `UnitService` |
| `DepartmentMapper` | `UnitMapper` |
| `CreateDepartmentRequest` | `CreateUnitRequest` |
| `UpdateDepartmentRequest` | `UpdateUnitRequest` |
| `AssignUserDeptRoleRequest` | `AssignUserUnitRoleRequest` |
| `UserDeptRoleService` | `UserUnitRoleService` |
| `UserDeptRoleEntity` | `UserUnitRoleEntity` |
| 변수명 내 `dept`, `Dept` 접두사/접미사 | `unit`, `Unit` |

#### C-2. API — group → cell (members 도메인)
| 현재 이름 | 변경 이름 |
|-----------|-----------|
| `GroupController` | `CellController` |
| `GroupService` | `CellService` |
| `GroupMapper` | `CellMapper` |
| `GroupEntity` | `CellEntity` |
| `UserGroupEntity` | `UserCellEntity` |
| `GroupAccessService` | `CellAccessService` |
| `CreateGroupRequest` | `CreateCellRequest` |
| `UpdateGroupRequest` | `UpdateCellRequest` |
| `AssignGroupMemberRequest` | `AssignCellMemberRequest` |
| `userGroup`, `UserGroup` 변수/타입명 | `userCell`, `UserCell` |

#### C-3. API — app.module.ts, hr.module.ts 등 import 수정
- `DepartmentModule` → `UnitModule` import 경로 변경
- `MembersModule` 내 `GroupService`, `GroupController` 참조 변경

#### C-4. 프론트엔드 컴포넌트
| 파일 | 변경 내용 |
|------|----------|
| `AssignDeptModal.tsx` (→ `AssignUnitModal.tsx`) | 컴포넌트명 `AssignDeptModal` → `AssignUnitModal` |
| `department.constant.ts` (→ `unit.constant.ts`) | 파일만 rename (내용은 이미 `UNITS` 상수명으로 변경 완료) |
| import 참조 파일 (8개) | `department.constant` → `unit.constant` import 경로 수정 |

---

### 영역 D: API 엔드포인트 확인

| 위치 | 현재 | 제안 | 비고 |
|------|------|------|------|
| `apps/api/src/domain/todo/controller/todo.controller.ts:22` | `@Get('group')` | `@Get('cell')` | "내 Cell의 Todo" 의미 |
| `apps/web/src/domain/todos/service/todo.service.ts:32` | `/todos/group` | `/todos/cell` | 위와 동기화 |

---

## 3. 작업 순서 및 우선순위

```
Phase 1 (즉시 처리, 리스크 낮음)
  └─ A: i18n 텍스트 변경 (value만 수정, 키 유지)
       → ko/en/vi entitySettings, members, common, acl, project, service

Phase 2 (중간 리스크, 빌드 필수 검증)
  └─ B+C: 파일명 rename + 클래스명 동시 변경
       Step 2-1: department 도메인 (API)
       Step 2-2: group → cell 파일들 (API)
       Step 2-3: app.module.ts, 참조 파일 import 수정
       Step 2-4: 프론트엔드 파일명 + import 수정

Phase 3 (검증 후 처리)
  └─ D: Todo 엔드포인트 /todos/group → /todos/cell
       → API controller + 프론트 service 동시 변경
```

---

## 4. 사이드 임팩트 분석

| 영향 범위 | 상세 | 대응 |
|-----------|------|------|
| **DB 스키마** | 테이블명/컬럼명은 `amb_` prefix 유지 — 변경 없음 | 영향 없음 ✅ |
| **API 경로** | `/units`, `/cells` 이미 변경 완료 | 영향 없음 ✅ |
| **TypeORM Entity** | `@Entity('amb_departments')` 테이블명은 유지 (클래스명만 변경) | 마이그레이션 불필요 |
| **타입 패키지** | `packages/types/src/domain.types.ts` 내 `department` 필드명 — **API 호환성 위해 키 이름 유지** | 표시 텍스트만 변경 |
| **스테이징/프로덕션** | i18n 변경은 빌드 후 반영 / 파일명 변경은 재빌드 필수 | 배포 필요 |

---

## 5. 완료 기준

- [ ] Phase 1: i18n 변경 후 한/영/베 UI 텍스트 확인
- [ ] Phase 2: `npx turbo run build` 오류 없음
- [ ] Phase 3: Todo "내 Cell" 탭 정상 동작 확인
- [ ] 빌드 성공 후 스테이징 배포 및 QA 확인

---

## 6. 예상 공수

| Phase | 대상 파일 수 | 예상 시간 |
|-------|-------------|-----------|
| Phase 1 (i18n) | ~12개 파일, ~30개 키 | 0.5h |
| Phase 2 (파일/클래스 rename) | ~25개 파일, 다수 참조 | 2.0h |
| Phase 3 (Todo endpoint) | 2개 파일 | 0.1h |
| 빌드 검증 + 배포 | — | 0.5h |
| **합계** | | **약 3h** |
