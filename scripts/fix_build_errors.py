#!/usr/bin/env python3
"""
빌드 오류 수정: unit 폴더 내 남은 이전 경로 참조들 수정
"""
import os

unit_base = '/Users/gray/Sites/ambManagement/apps/api/src/domain/unit'

# 각 파일에 맞는 수정 사항
fixes = {
    'entity/user-unit-role.entity.ts': [
        ("'./department.entity'", "'./unit.entity'"),
    ],
    'service/hierarchy.service.ts': [
        ("'../entity/user-dept-role.entity'", "'../entity/user-unit-role.entity'"),
    ],
    'service/user-unit-role.service.ts': [
        ("'../entity/user-dept-role.entity'", "'../entity/user-unit-role.entity'"),
        ("'../mapper/user-dept-role.mapper'", "'../mapper/user-unit-role.mapper'"),
    ],
    'unit.module.ts': [
        ("'./entity/user-dept-role.entity'", "'./entity/user-unit-role.entity'"),
    ],
}

print("=== 빌드 오류 수정 ===")
for rel_path, replacements in fixes.items():
    fp = os.path.join(unit_base, rel_path)
    if not os.path.exists(fp):
        print(f"  [SKIP] 없음: {rel_path}")
        continue
    with open(fp, 'r') as f:
        content = f.read()
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    if new_content != content:
        with open(fp, 'w') as f:
            f.write(new_content)
        print(f"  수정됨: {rel_path}")
    else:
        print(f"  [변경없음] {rel_path}")

# app.module.ts 에서도 user-dept-role 경로 확인
app_module = '/Users/gray/Sites/ambManagement/apps/api/src/app.module.ts'
with open(app_module, 'r') as f:
    content = f.read()
new_content = content
new_content = new_content.replace("'./domain/unit/entity/user-dept-role.entity'", "'./domain/unit/entity/user-unit-role.entity'")
new_content = new_content.replace("'./domain/unit/entity/department.entity'", "'./domain/unit/entity/unit.entity'")
if new_content != content:
    with open(app_module, 'w') as f:
        f.write(new_content)
    print(f"  수정됨: app.module.ts")
else:
    print(f"  [변경없음] app.module.ts")

print("\n완료!")
