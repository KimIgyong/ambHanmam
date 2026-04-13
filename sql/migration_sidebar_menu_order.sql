-- ═══════════════════════════════════════════════════════════════════
-- 사이드바 메뉴 순서 조정: 출퇴근(ATTENDANCE)을 캘린더 아래로 이동
-- 작성일: 2026-04-01
-- 설명: ATTENDANCE의 sortOrder를 500에서 770으로 변경하여 CALENDAR(760) 아래에 표시되도록 조정
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ATTENDANCE 메뉴의 sortOrder를 770으로 변경 (CALENDAR 760 아래)
UPDATE amb_menu_config
SET mcf_sort_order = 770,
    mcf_updated_at = NOW()
WHERE mcf_menu_code = 'ATTENDANCE';

-- NOTICES의 sortOrder를 600으로 유지 (변경 없음)
-- DRIVE의 sortOrder를 700으로 유지 (변경 없음)
-- ISSUES의 sortOrder를 740으로 유지 (변경 없음)
-- PROJECT_MANAGEMENT의 sortOrder를 750으로 유지 (변경 없음)
-- CALENDAR의 sortOrder를 760으로 유지 (변경 없음)
-- ACCOUNTING의 sortOrder를 800으로 유지 (변경 없음)

COMMIT;
