-- ============================================================
-- hanmam tbl_org → AMB amb_units 마이그레이션
-- 실행: docker exec amb-postgres psql -U amb_user -d db_amb_hanmam -f /tmp/001-migrate-org.sql
-- ============================================================

BEGIN;

-- 1) 임시 매핑 테이블
CREATE TEMP TABLE tmp_org_map (
  org_no       INT PRIMARY KEY,
  up_org_no    INT,
  comp_no      INT,
  org_name     VARCHAR(100),
  org_level    INT,
  ord          VARCHAR(50),
  leader_no    INT,
  show_in_tree CHAR(1),
  contents     TEXT,
  del_yn       CHAR(1),
  new_uuid     UUID DEFAULT gen_random_uuid(),
  ent_id       UUID
);

-- 2) hanmam 부서 데이터 (ORG_LEVEL 2=본부, 3=팀만)
INSERT INTO tmp_org_map (org_no, up_org_no, comp_no, org_name, org_level, ord, leader_no, show_in_tree, contents, del_yn) VALUES
  -- ── 새하컴즈 (COMP_NO=1) 본부 ──
  (104, 1, 1, '경영기획실', 2, '101', 13, 'Y', '', 'N'),
  (122, 1, 1, '솔루션개발연구소', 2, '104', 7, 'Y', '', 'N'),
  (211, 1, 1, '서비스사업본부', 2, '102', 44, 'Y', '', 'N'),
  (311, 1, 1, '솔루션사업본부', 2, '103', 635, 'Y', '', 'N'),
  (471, 1, 1, '개발본부', 2, '104', 7, 'Y', '', 'Y'),
  (487, 1, 1, 'AI사업본부', 2, '105', 634, 'Y', '', 'Y'),
  -- ── 새하컴즈 팀 ──
  (33,  211, 1, '서비스사업팀', 3, '10201', 335, 'Y', '', 'N'),
  (411, 211, 1, '서비스사업팀', 3, '10201', 44, 'Y', '', 'Y'),
  (461, 311, 1, '솔루션사업팀', 3, '10301', 447, 'Y', '', 'N'),
  (462, 311, 1, '구축사업2팀', 3, '10302', 447, 'Y', '', 'Y'),
  (472, 122, 1, '기반기술팀', 3, '10403', 16, 'Y', '', 'N'),
  (473, 122, 1, 'AI개발팀', 3, '10402', 571, 'Y', '', 'Y'),
  (475, 122, 1, '웹기술팀', 3, '10405', 25, 'N', '', 'Y'),
  (476, 211, 1, '서비스운영팀', 3, '10202', 556, 'Y', '', 'N'),
  (477, 311, 1, '솔루션기술팀', 3, '10302', 433, 'Y', '', 'N'),
  (478, 471, 1, 'Ux기획팀', 3, '10408', 0, 'Y', '', 'Y'),
  (479, 211, 1, '고객지원팀', 3, '10203', 68, 'Y', '', 'Y'),
  (480, 471, 1, '보다스터디카페TF', 3, '10407', 7, 'Y', '', 'Y'),
  (482, 471, 1, '웹개발2팀', 3, '10404', 573, 'Y', '', 'Y'),
  (483, 122, 1, '앱기술팀', 3, '10404', 566, 'Y', '', 'N'),
  (484, 211, 1, '서비스기획팀', 3, '10202', 68, 'N', '', 'Y'),
  (485, 122, 1, 'AI개발팀', 3, '10501', 616, 'Y', '', 'Y'),
  (486, 311, 1, '솔루션기획팀', 3, '10303', 433, 'Y', '', 'Y'),
  (488, 211, 1, '보다수학사업팀', 3, '10202', 0, 'N', '', 'Y'),
  (489, 122, 1, '기획검증팀', 3, '10401', 422, 'Y', '', 'N'),
  (490, 122, 1, '웹기술팀', 3, '10405', 654, 'Y', '', 'N'),
  (492, 122, 1, '서버기술팀', 3, '10406', 479, 'Y', '', 'N'),
  -- ── 도전하는사람들 (COMP_NO=3) 본부 ──
  (391, 3, 3, '사업본부', 2, '201', 120, 'Y', '', 'N'),
  (392, 3, 3, '기술전략본부', 2, '202', 3, 'Y', '', 'N'),
  (404, 3, 3, '미래전략연구소', 2, '203', 186, 'Y', '', 'N'),
  (491, 3, 3, '디지털트윈본부', 2, '204', 651, 'Y', '', 'N'),
  -- ── 도전하는사람들 팀 ──
  (401, 392, 3, 'BD팀', 3, '20201', 9, 'Y', '', 'N'),
  (402, 392, 3, '개발1팀', 3, '20202', 549, 'Y', '', 'N'),
  (403, 491, 3, 'M&S개발팀', 3, '20401', 453, 'Y', '', 'N'),
  (421, 391, 3, '사업팀', 3, '20101', 27, 'Y', '', 'N'),
  (481, 392, 3, '개발2팀', 3, '20203', 28, 'Y', '', 'N');

-- 3) COMP_NO → ent_id 매핑
UPDATE tmp_org_map SET ent_id = (SELECT ent_id FROM amb_hr_entities WHERE ent_code = 'KR01') WHERE comp_no = 1;
UPDATE tmp_org_map SET ent_id = (SELECT ent_id FROM amb_hr_entities WHERE ent_code = 'GL01') WHERE comp_no = 3;

-- 4) Level 2 (본부) INSERT → AMB unt_level=1 (Unit)
INSERT INTO amb_units (unt_id, ent_id, unt_name, unt_parent_id, unt_level, unt_is_active, unt_sort_order, unt_description)
SELECT
  t.new_uuid,
  t.ent_id,
  t.org_name,
  NULL,
  1,
  (t.del_yn = 'N' AND t.show_in_tree = 'Y'),
  CAST(t.ord AS INTEGER),
  NULLIF(t.contents, '')
FROM tmp_org_map t
WHERE t.org_level = 2;

-- 5) Level 3 (팀) INSERT → AMB unt_level=2 (Team), parent = 본부 UUID
INSERT INTO amb_units (unt_id, ent_id, unt_name, unt_parent_id, unt_level, unt_is_active, unt_sort_order, unt_description)
SELECT
  t.new_uuid,
  t.ent_id,
  t.org_name,
  p.new_uuid,
  2,
  (t.del_yn = 'N' AND t.show_in_tree = 'Y'),
  CAST(t.ord AS INTEGER),
  NULLIF(t.contents, '')
FROM tmp_org_map t
JOIN tmp_org_map p ON p.org_no = t.up_org_no
WHERE t.org_level = 3;

-- 6) PK 매핑 기록 (향후 사용자/프로젝트 마이그레이션 시 참조)
CREATE TABLE IF NOT EXISTS amb_migration_pk_map (
  map_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_source_table VARCHAR(100) NOT NULL,
  map_source_pk    INTEGER NOT NULL,
  map_target_table VARCHAR(100) NOT NULL,
  map_target_pk    UUID NOT NULL,
  map_created_at   TIMESTAMP DEFAULT NOW()
);

INSERT INTO amb_migration_pk_map (map_source_table, map_source_pk, map_target_table, map_target_pk)
SELECT 'tbl_org', org_no, 'amb_units', new_uuid
FROM tmp_org_map;

-- 7) 정리
DROP TABLE tmp_org_map;

COMMIT;
