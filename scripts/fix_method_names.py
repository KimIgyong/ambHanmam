#!/usr/bin/env python3
"""
unit service/controller 메소드명 getDepartment→getUnit 변경
"""
import os

files = [
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/unit/service/unit.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/unit/controller/unit.controller.ts',
]

replacements = [
    ('getDepartmentTree', 'getUnitTree'),
    ('getAllDepartments', 'getAllUnits'),
    ('getDepartmentById', 'getUnitById'),
    ('createDepartment', 'createUnit'),
    ('updateDepartment', 'updateUnit'),
    ('deleteDepartment', 'deleteUnit'),
    ('getDepartmentMembers', 'getUnitMembers'),
    ('getDepartment(', 'getUnit('),
    ('const departments', 'const units'),
    ('departments.map', 'units.map'),
]

print("=== service/controller 메소드명 변경 ===")
for fp in files:
    with open(fp, 'r') as f:
        content = f.read()
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    if new_content != content:
        with open(fp, 'w') as f:
            f.write(new_content)
        print(f"  변경됨: {fp.split('/domain/unit/')[-1]}")
    else:
        print(f"  [변경없음] {fp.split('/domain/unit/')[-1]}")

print("\n완료!")
