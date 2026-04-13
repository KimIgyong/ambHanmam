#!/usr/bin/env python3
"""
Phase 2-2: members 폴더 내 group 파일들을 cell로 rename + 클래스명 변경
"""
import os
import shutil

base = '/Users/gray/Sites/ambManagement/apps/api/src/domain/members'

# 파일 내용 변경 규칙 (긴 패턴 먼저)
replacements = [
    # DTO 클래스명
    ('CreateGroupRequest', 'CreateCellRequest'),
    ('UpdateGroupRequest', 'UpdateCellRequest'),
    ('AssignGroupMemberRequest', 'AssignCellMemberRequest'),
    # Service/Controller/Mapper 클래스명
    ('GroupController', 'CellController'),
    ('GroupService', 'CellService'),
    ('GroupMapper', 'CellMapper'),
    ('GroupAccessService', 'CellAccessService'),
    # Entity 클래스명
    ('UserGroupEntity', 'UserCellEntity'),
    ('GroupEntity', 'CellEntity'),
    # 변수명
    ('groupService', 'cellService'),
    ('groupRepository', 'cellRepository'),
    ('userGroupRepository', 'userCellRepository'),
    ('groupAccessService', 'cellAccessService'),
    ('groupId', 'cellId'),
    ('userGroup', 'userCell'),
    # import 경로 (파일명 변경과 동기화)
    ('./controller/group.controller', './controller/cell.controller'),
    ('../controller/group.controller', '../controller/cell.controller'),
    ('./entity/group.entity', './entity/cell.entity'),
    ('../entity/group.entity', '../entity/cell.entity'),
    ('./entity/user-group.entity', './entity/user-cell.entity'),
    ('../entity/user-group.entity', '../entity/user-cell.entity'),
    ('./mapper/group.mapper', './mapper/cell.mapper'),
    ('../mapper/group.mapper', '../mapper/cell.mapper'),
    ('./service/group.service', './service/cell.service'),
    ('../service/group.service', '../service/cell.service'),
    ('./service/group-access.service', './service/cell-access.service'),
    ('../service/group-access.service', '../service/cell-access.service'),
    ('./dto/request/create-group.request', './dto/request/create-cell.request'),
    ('../dto/request/create-group.request', '../dto/request/create-cell.request'),
    ('./dto/request/update-group.request', './dto/request/update-cell.request'),
    ('../dto/request/update-group.request', '../dto/request/update-cell.request'),
    ('./dto/request/assign-group-member.request', './dto/request/assign-cell-member.request'),
    ('../dto/request/assign-group-member.request', '../dto/request/assign-cell-member.request'),
]

# 파일명 rename 매핑
file_renames = [
    ('controller/group.controller.ts', 'controller/cell.controller.ts'),
    ('dto/request/assign-group-member.request.ts', 'dto/request/assign-cell-member.request.ts'),
    ('dto/request/create-group.request.ts', 'dto/request/create-cell.request.ts'),
    ('dto/request/update-group.request.ts', 'dto/request/update-cell.request.ts'),
    ('entity/group.entity.ts', 'entity/cell.entity.ts'),
    ('entity/user-group.entity.ts', 'entity/user-cell.entity.ts'),
    ('mapper/group.mapper.ts', 'mapper/cell.mapper.ts'),
    ('service/group-access.service.ts', 'service/cell-access.service.ts'),
    ('service/group.service.ts', 'service/cell.service.ts'),
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
    else:
        print(f"  [변경없음] {fp.replace(base + '/', '')}")

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
