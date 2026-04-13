#!/usr/bin/env python3
"""
Phase 2-1 Step 2: 외부 파일들의 department/ import 경로를 unit/ 로 변경
"""
import os

# 외부 참조 파일들
target_files = [
    '/Users/gray/Sites/ambManagement/apps/api/src/app.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/acl/acl.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/acl/service/access-control.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/auth.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/controller/user.controller.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/service/auth.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/strategy/jwt.strategy.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/calendar/calendar.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/calendar/service/calendar.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/members/members.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/members/service/member.service.ts',
]

# 변경 규칙
replacements = [
    # import 경로: department/ → unit/
    ("'./domain/department/department.module'", "'./domain/unit/unit.module'"),
    ("'./domain/department/entity/department.entity'", "'./domain/unit/entity/unit.entity'"),
    ("'./domain/department/entity/user-dept-role.entity'", "'./domain/unit/entity/user-unit-role.entity'"),
    ("'../department/entity/department.entity'", "'../unit/entity/unit.entity'"),
    ("'../department/entity/user-dept-role.entity'", "'../unit/entity/user-unit-role.entity'"),
    ("'../../department/entity/department.entity'", "'../../unit/entity/unit.entity'"),
    ("'../../department/entity/user-dept-role.entity'", "'../../unit/entity/user-unit-role.entity'"),
    ("'../department/department.module'", "'../unit/unit.module'"),
    ("'../../department/service/hierarchy.service'", "'../../unit/service/hierarchy.service'"),
    ("'../../department/service/user-dept-role.service'", "'../../unit/service/user-unit-role.service'"),
    ("'../../department/service/user-unit-role.service'", "'../../unit/service/user-unit-role.service'"),
    # 클래스명
    ('DepartmentModule', 'UnitModule'),
    ('UserDeptRoleService', 'UserUnitRoleService'),
    # acl service에서 변수명
    ('userDeptRoleService: UserUnitRoleService', 'userUnitRoleService: UserUnitRoleService'),
    ('this.userDeptRoleService.', 'this.userUnitRoleService.'),
    ('private readonly userDeptRoleService,', 'private readonly userUnitRoleService,'),
    ('private readonly userDeptRoleService:', 'private readonly userUnitRoleService:'),
]

print("=== 외부 파일 import 경로 업데이트 ===")
for fp in target_files:
    if not os.path.exists(fp):
        print(f"  [SKIP] 없음: {fp}")
        continue
    with open(fp, 'r') as f:
        content = f.read()
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    if new_content != content:
        with open(fp, 'w') as f:
            f.write(new_content)
        print(f"  변경됨: {fp.split('/apps/api/src/')[-1]}")
    else:
        print(f"  [변경없음] {fp.split('/apps/api/src/')[-1]}")

print("\n완료!")
