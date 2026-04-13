#!/usr/bin/env python3
"""
Phase 2-2 Step 2: 외부 파일들의 group 경로를 cell 로 변경
"""
import os

# 외부 참조 파일들
target_files = [
    '/Users/gray/Sites/ambManagement/apps/api/src/app.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/acl/entity/work-item.entity.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/acl/service/access-control.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/agent/agent.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/agent/service/agent-config.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/auth.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/auth/service/auth.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/entity-settings/entity-settings.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/entity-settings/service/entity-permission.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/invitation/invitation.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/invitation/service/invitation.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/meeting-notes/service/meeting-note.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/notices/service/notice.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/search/service/search.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/settings/service/menu-permission.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/settings/settings.module.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/todo/service/todo.service.ts',
    '/Users/gray/Sites/ambManagement/apps/api/src/domain/todo/todo.module.ts',
]

# 변경 규칙 (import 경로 + 클래스명 + 변수명)
replacements = [
    # import 경로: group → cell
    ("members/entity/group.entity'", "members/entity/cell.entity'"),
    ("members/entity/user-group.entity'", "members/entity/user-cell.entity'"),
    ("members/service/group.service'", "members/service/cell.service'"),
    ("members/service/group-access.service'", "members/service/cell-access.service'"),
    ("members/controller/group.controller'", "members/controller/cell.controller'"),
    ("members/mapper/group.mapper'", "members/mapper/cell.mapper'"),
    # 클래스명
    ('GroupAccessService', 'CellAccessService'),
    ('GroupService', 'CellService'),
    ('GroupController', 'CellController'),
    ('GroupMapper', 'CellMapper'),
    # 변수명
    ('groupAccessService:', 'cellAccessService:'),
    ('groupAccessService,', 'cellAccessService,'),
    ('groupAccessService.', 'cellAccessService.'),
    ('private readonly groupAccessService', 'private readonly cellAccessService'),
    ('groupService:', 'cellService:'),
    ('groupService,', 'cellService,'),
    ('groupService.', 'cellService.'),
    ('private readonly groupService', 'private readonly cellService'),
]

print("=== 외부 파일 group → cell 업데이트 ===")
for fp in target_files:
    if not os.path.exists(fp):
        print(f"  [SKIP] 없음: {fp.split('/apps/api/src/')[-1]}")
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
