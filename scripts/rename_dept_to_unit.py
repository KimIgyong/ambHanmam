#!/usr/bin/env python3
"""
Phase 2-1: department 폴더 내 파일들의 클래스명/변수명을 Department→Unit으로 변경하고
파일명도 rename 처리
"""
import os
import shutil

base = '/Users/gray/Sites/ambManagement/apps/api/src/domain/department'

# 파일 내용 변경 규칙 (순서 중요 - 긴 패턴 먼저)
replacements = [
    # DTO 클래스명
    ('CreateDepartmentRequest', 'CreateUnitRequest'),
    ('UpdateDepartmentRequest', 'UpdateUnitRequest'),
    ('AssignUserDeptRoleRequest', 'AssignUserUnitRoleRequest'),
    # Service/Controller/Module/Mapper 클래스명
    ('DepartmentController', 'UnitController'),
    ('DepartmentModule', 'UnitModule'),
    ('DepartmentService', 'UnitService'),
    ('DepartmentMapper', 'UnitMapper'),
    ('UserDeptRoleService', 'UserUnitRoleService'),
    ('UserDeptRoleMapper', 'UserUnitRoleMapper'),
    # Entity
    ('UserDeptRoleEntity', 'UserUnitRoleEntity'),
    # 변수명 패턴
    ('departmentRepository', 'unitRepository'),
    ('departmentService', 'unitService'),
    # import 경로 (파일명 변경과 동기화)
    ('./dto/request/create-department.request', './dto/request/create-unit.request'),
    ('./dto/request/update-department.request', './dto/request/update-unit.request'),
    ('./dto/request/assign-user-dept-role.request', './dto/request/assign-user-unit-role.request'),
    ('../dto/request/create-department.request', '../dto/request/create-unit.request'),
    ('../dto/request/update-department.request', '../dto/request/update-unit.request'),
    ('../dto/request/assign-user-dept-role.request', '../dto/request/assign-user-unit-role.request'),
    ('../mapper/department.mapper', '../mapper/unit.mapper'),
    ('../service/department.service', '../service/unit.service'),
    ('../service/user-dept-role.service', '../service/user-unit-role.service'),
    ('../entity/department.entity', '../entity/unit.entity'),
    ('./entity/department.entity', './entity/unit.entity'),
    ('./service/department.service', './service/unit.service'),
    ('./service/user-dept-role.service', './service/user-unit-role.service'),
    ('./controller/department.controller', './controller/unit.controller'),
    # 메소드명
    ('getByDepartment', 'getByUnit'),
    ('getPrimaryDepartment', 'getPrimaryUnit'),
]

# 파일명 rename 매핑 (구 이름 → 새 이름, 상대경로)
file_renames = [
    ('controller/department.controller.ts', 'controller/unit.controller.ts'),
    ('department.module.ts', 'unit.module.ts'),
    ('dto/request/create-department.request.ts', 'dto/request/create-unit.request.ts'),
    ('dto/request/update-department.request.ts', 'dto/request/update-unit.request.ts'),
    ('dto/request/assign-user-dept-role.request.ts', 'dto/request/assign-user-unit-role.request.ts'),
    ('entity/department.entity.ts', 'entity/unit.entity.ts'),
    ('entity/user-dept-role.entity.ts', 'entity/user-unit-role.entity.ts'),
    ('mapper/department.mapper.ts', 'mapper/unit.mapper.ts'),
    ('mapper/user-dept-role.mapper.ts', 'mapper/user-unit-role.mapper.ts'),
    ('service/department.service.ts', 'service/unit.service.ts'),
    ('service/user-dept-role.service.ts', 'service/user-unit-role.service.ts'),
]

print("=== Step 1: 파일 내용 변경 ===")
files_to_process = []
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.ts'):
            files_to_process.append(os.path.join(root, f))

for fp in sorted(files_to_process):
    with open(fp, 'r') as f:
        content = f.read()
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    if new_content != content:
        with open(fp, 'w') as f:
            f.write(new_content)
        print(f"  변경됨: {fp.replace(base + '/', '')}")

print("\n=== Step 2: 파일명 Rename ===")
for old_rel, new_rel in file_renames:
    old_path = os.path.join(base, old_rel)
    new_path = os.path.join(base, new_rel)
    if os.path.exists(old_path):
        shutil.move(old_path, new_path)
        print(f"  renamed: {old_rel} → {new_rel}")
    else:
        print(f"  [SKIP] 없음: {old_rel}")

print("\n완료!")
