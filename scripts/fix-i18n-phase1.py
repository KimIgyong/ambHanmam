#!/usr/bin/env python3
"""Phase 1 i18n 나머지 파일 변경 스크립트"""
import os

BASE = "/Users/gray/Sites/ambManagement/apps/web/src/locales"

def patch(filepath, replacements):
    full = os.path.join(BASE, filepath)
    with open(full, "r", encoding="utf-8") as f:
        content = f.read()
    changed = 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            changed += 1
            print(f"  ✓ {old[:60]}")
        else:
            print(f"  ✗ NOT FOUND: {old[:60]}")
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  → {filepath}: {changed}/{len(replacements)} changed\n")

# vi/entitySettings.json - permissions section
patch("vi/entitySettings.json", [
    ('"unit": "Theo phòng ban"', '"unit": "Theo Unit"'),
    ('"cell": "Theo nhóm"', '"cell": "Theo Cell"'),
    ('"unitList": "Danh sách phòng ban"', '"unitList": "Danh sách Unit"'),
    ('"cellList": "Danh sách nhóm"', '"cellList": "Danh sách Cell"'),
    ('"noUnits": "Không có phòng ban nào"', '"noUnits": "Không có Unit nào"'),
    ('"noCells": "Không có nhóm nào"', '"noCells": "Không có Cell nào"'),
    ('"selectUnit": "Chọn phòng ban để quản lý quyền"', '"selectUnit": "Chọn Unit để quản lý quyền"'),
    ('"selectCell": "Chọn nhóm để quản lý quyền"', '"selectCell": "Chọn Cell để quản lý quyền"'),
])

# ko/acl.json - unit section
patch("ko/acl.json", [
    ('"title": "부서 관리"', '"title": "Unit 관리"'),
    ('"addNew": "부서 추가"', '"addNew": "Unit 추가"'),
    ('"editTitle": "부서 수정"', '"editTitle": "Unit 수정"'),
    ('"createTitle": "새 부서"', '"createTitle": "새 Unit"'),
    ('"deleteConfirm": "이 부서를 삭제하시겠습니까?"', '"deleteConfirm": "이 Unit을 삭제하시겠습니까?"'),
    ('"deleteSuccess": "부서가 삭제되었습니다."', '"deleteSuccess": "Unit이 삭제되었습니다."'),
    ('"saveSuccess": "부서가 저장되었습니다."', '"saveSuccess": "Unit이 저장되었습니다."'),
    ('"searchPlaceholder": "부서 검색..."', '"searchPlaceholder": "Unit 검색..."'),
    ('"noResults": "부서가 없습니다."', '"noResults": "Unit이 없습니다."'),
    ('"name": "부서명"', '"name": "Unit명"'),
    ('"parent": "상위 부서"', '"parent": "상위 Unit"'),
    ('"assignTitle": "사용자 부서 배정"', '"assignTitle": "사용자 Unit 배정"'),
    ('"removeConfirm": "이 사용자를 부서에서 제거하시겠습니까?"', '"removeConfirm": "이 사용자를 Unit에서 제거하시겠습니까?"'),
    ('"UNIT_HEAD": "부서장"', '"UNIT_HEAD": "Unit장"'),
    ('"selectUnit": "부서 선택"', '"selectUnit": "Unit 선택"'),
    ('"UNIT": "부서"', '"UNIT": "Unit"'),
])

# ko/settings.json
patch("ko/settings.json", [
    ('"allUnits": "전체 부서"', '"allUnits": "전체 Unit"'),
    ('"unit": "부서"', '"unit": "Unit"'),
    ('"UNIT": "부서"', '"UNIT": "Unit"'),
    ('"units": "부서 관리"', '"units": "Unit 관리"'),
    ('"addUnit": "부서 추가"', '"addUnit": "Unit 추가"'),
    ('"unitName": "부서명"', '"unitName": "Unit명"'),
    ('"unitNameLocal": "현지 부서명 (선택)"', '"unitNameLocal": "현지 Unit명 (선택)"'),
    ('"topLevel": "최상위 부서"', '"topLevel": "최상위 Unit"'),
    ('"noUnits": "등록된 부서가 없습니다."', '"noUnits": "등록된 Unit이 없습니다."'),
    ('"deleteUnitConfirm": "이 부서를 삭제하시겠습니까?"', '"deleteUnitConfirm": "이 Unit을 삭제하시겠습니까?"'),
    ('"manageSubItems": "셀/부서 관리"', '"manageSubItems": "Cell/Unit 관리"'),
])

# ko/notices.json
patch("ko/notices.json", [
    ('"UNIT": "부서별"', '"UNIT": "Unit별"'),
    ('"unit": "대상 부서"', '"unit": "대상 Unit"'),
])

# ko/myPage.json
patch("ko/myPage.json", [
    ('"unit": "부서"', '"unit": "Unit"'),
    ('"title": "부서 배정 현황"', '"title": "Unit 배정 현황"'),
    ('"name": "부서명"', '"name": "Unit명"'),
    ('"role": "부서 내 역할"', '"role": "Unit 내 역할"'),
    ('"isPrimary": "주요부서"', '"isPrimary": "주요 Unit"'),
    ('"noUnits": "배정된 부서가 없습니다"', '"noUnits": "배정된 Unit이 없습니다"'),
    ('"UNIT_HEAD": "부서장"', '"UNIT_HEAD": "Unit장"'),
])

# ko/calendar.json
patch("ko/calendar.json", [
    ('"UNIT": "부서"', '"UNIT": "Unit"'),
    ('"unit": "부서 일정"', '"unit": "Unit 일정"'),
])

# ko/common.json
patch("ko/common.json", [
    ('"units": "부서"', '"units": "Unit"'),
    ('"title": "부서관리"', '"title": "Unit 관리"'),
    ('"description": "부서 조직도와 부서별 멤버를 관리합니다"', '"description": "Unit 조직도와 Unit별 멤버를 관리합니다"'),
    ('"warningDescription": "전용 AI 에이전트가 있으나 CHAT_* 권한 코드가 없는 부서가 존재합니다. 해당 에이전트는 채팅 접근 권한 제어를 받지 않습니다."',
     '"warningDescription": "전용 AI 에이전트가 있으나 CHAT_* 권한 코드가 없는 Unit이 존재합니다. 해당 에이전트는 채팅 접근 권한 제어를 받지 않습니다."'),
])

print("All done!")
