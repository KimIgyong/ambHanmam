#!/usr/bin/env python3
"""
Phase 2-3: Frontend 파일명 rename + import 경로 수정
"""
import os
import shutil

web_src = '/Users/gray/Sites/ambManagement/apps/web/src'

# 1. AssignDeptModal.tsx → AssignUnitModal.tsx rename
assign_dept = f"{web_src}/domain/members/components/AssignDeptModal.tsx"
assign_unit = f"{web_src}/domain/members/components/AssignUnitModal.tsx"

print("=== Step 1: AssignDeptModal → AssignUnitModal ===")
if os.path.exists(assign_dept):
    # 내용 변경 (컴포넌트명)
    with open(assign_dept, 'r') as f:
        content = f.read()
    new_content = content.replace('AssignDeptModal', 'AssignUnitModal')
    with open(assign_unit, 'w') as f:
        f.write(new_content)
    os.remove(assign_dept)
    print(f"  renamed + 컴포넌트명 변경: AssignDeptModal.tsx → AssignUnitModal.tsx")
else:
    print(f"  [SKIP] AssignDeptModal.tsx 없음")

# 2. department.constant.ts → unit.constant.ts rename
dept_const = f"{web_src}/global/constant/department.constant.ts"
unit_const = f"{web_src}/global/constant/unit.constant.ts"

print("\n=== Step 2: department.constant → unit.constant ===")
if os.path.exists(dept_const):
    shutil.copy(dept_const, unit_const)
    os.remove(dept_const)
    print(f"  renamed: department.constant.ts → unit.constant.ts")
else:
    print(f"  [SKIP] department.constant.ts 없음")

# 3. import 경로 업데이트 - MemberDetailPage.tsx
detail_page = f"{web_src}/domain/members/pages/MemberDetailPage.tsx"
print("\n=== Step 3: MemberDetailPage.tsx 업데이트 ===")
if os.path.exists(detail_page):
    with open(detail_page, 'r') as f:
        content = f.read()
    new_content = content
    new_content = new_content.replace(
        "import AssignDeptModal from '../components/AssignDeptModal'",
        "import AssignUnitModal from '../components/AssignUnitModal'"
    )
    new_content = new_content.replace('AssignDeptModal', 'AssignUnitModal')
    if new_content != content:
        with open(detail_page, 'w') as f:
            f.write(new_content)
        print(f"  변경됨: MemberDetailPage.tsx")
    else:
        print(f"  [변경없음] MemberDetailPage.tsx")

# 4. department.constant import 경로 업데이트 (8개 파일)
dept_const_files = [
    f"{web_src}/domain/assistant/components/ChatSection.tsx",
    f"{web_src}/domain/assistant/components/WelcomeSection.tsx",
    f"{web_src}/domain/settings/pages/ConversationManagementPage.tsx",
    f"{web_src}/domain/settings/pages/AgentSettingsPage.tsx",
    f"{web_src}/domain/chat/pages/ChatPage.tsx",
    f"{web_src}/domain/auth/pages/RegisterPage.tsx",
    f"{web_src}/domain/agents/pages/AgentsPage.tsx",
    f"{web_src}/domain/members/components/InvitationFormModal.tsx",
]

print("\n=== Step 4: department.constant → unit.constant import 경로 수정 ===")
for fp in dept_const_files:
    if not os.path.exists(fp):
        print(f"  [SKIP] 없음: {fp.split('/apps/web/src/')[-1]}")
        continue
    with open(fp, 'r') as f:
        content = f.read()
    new_content = content.replace(
        "@/global/constant/department.constant",
        "@/global/constant/unit.constant"
    )
    if new_content != content:
        with open(fp, 'w') as f:
            f.write(new_content)
        print(f"  변경됨: {fp.split('/apps/web/src/')[-1]}")
    else:
        print(f"  [변경없음] {fp.split('/apps/web/src/')[-1]}")

print("\n완료!")
