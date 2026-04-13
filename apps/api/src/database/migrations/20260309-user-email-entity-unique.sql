-- ============================================================
-- USER_LEVEL 법인별 독립 로그인: DB 마이그레이션
-- 실행 순서: 1) UNIQUE 변경 → 2) 데이터 마이그레이션 → 3) 검증
-- ============================================================

-- ────────────────────────────────────────
-- Step 1: 기존 usr_email UNIQUE 제약 제거
-- ────────────────────────────────────────
ALTER TABLE amb_users DROP CONSTRAINT IF EXISTS "UQ_136c2230d33f3985e1b1cf5ef56";

-- usr_company_email UNIQUE도 제거 (법인별 독립이므로 다른 법인에서 동일 company email 가능)
-- 제약 이름은 실제 DB에서 확인 필요
-- ALTER TABLE amb_users DROP CONSTRAINT IF EXISTS "UQ_xxx_company_email";

-- ────────────────────────────────────────
-- Step 2: (usr_email, usr_company_id) 복합 UNIQUE 추가
-- soft delete 된 행은 제외 (partial index)
-- ────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email_company"
  ON amb_users(usr_email, usr_company_id)
  WHERE usr_deleted_at IS NULL;

-- ────────────────────────────────────────
-- Step 3: 기존 다법인 사용자 데이터 마이그레이션
-- EntityUserRole에 여러 법인이 있는 USER_LEVEL 사용자를 찾아
-- 각 법인별 별도 usr_id 행으로 분리
-- ────────────────────────────────────────

-- 확인 쿼리: 분리 대상 사용자 목록
-- SELECT u.usr_id, u.usr_email, u.usr_company_id, eur.ent_id, eur.eur_role
-- FROM amb_users u
-- JOIN amb_hr_entity_user_roles eur ON eur.usr_id = u.usr_id
-- WHERE u.usr_level_code = 'USER_LEVEL'
--   AND u.usr_deleted_at IS NULL
--   AND eur.ent_id != u.usr_company_id
-- ORDER BY u.usr_email, eur.ent_id;

-- 분리 실행 (DO 블록)
DO $$
DECLARE
  rec RECORD;
  new_user_id UUID;
BEGIN
  FOR rec IN
    SELECT u.usr_id, u.usr_email, u.usr_password, u.usr_name, u.usr_unit,
           u.usr_role, u.usr_level_code, u.usr_status, u.usr_timezone,
           u.usr_locale, u.usr_join_method, u.usr_token_version,
           u.usr_must_change_pw, u.usr_translation_prefs,
           u.usr_issue_filter_presets, u.usr_invited_by,
           eur.ent_id AS target_entity_id, eur.eur_role AS entity_role,
           eur.eur_status AS entity_status, eur.eur_id
    FROM amb_users u
    JOIN amb_hr_entity_user_roles eur ON eur.usr_id = u.usr_id
    WHERE u.usr_level_code = 'USER_LEVEL'
      AND u.usr_deleted_at IS NULL
      AND eur.ent_id != COALESCE(u.usr_company_id, '00000000-0000-0000-0000-000000000000')
  LOOP
    -- 새 UUID 생성
    new_user_id := gen_random_uuid();

    -- 1. 새 사용자 행 생성 (비밀번호, 프로필 복사)
    INSERT INTO amb_users (
      usr_id, usr_email, usr_password, usr_name, usr_unit, usr_role,
      usr_level_code, usr_status, usr_company_id, usr_timezone, usr_locale,
      usr_join_method, usr_token_version, usr_must_change_pw,
      usr_translation_prefs, usr_issue_filter_presets, usr_invited_by,
      usr_created_at, usr_updated_at
    ) VALUES (
      new_user_id, rec.usr_email, rec.usr_password, rec.usr_name, rec.usr_unit,
      rec.entity_role, rec.usr_level_code, rec.entity_status,
      rec.target_entity_id, rec.usr_timezone, rec.usr_locale,
      rec.usr_join_method, 0, rec.usr_must_change_pw,
      rec.usr_translation_prefs, rec.usr_issue_filter_presets, rec.usr_invited_by,
      NOW(), NOW()
    );

    -- 2. EntityUserRole의 usr_id를 새 UUID로 변경
    UPDATE amb_hr_entity_user_roles
    SET usr_id = new_user_id
    WHERE eur_id = rec.eur_id;

    -- 3. 해당 법인의 UserUnitRole에서 usr_id 변경
    UPDATE amb_user_unit_roles uur
    SET usr_id = new_user_id
    FROM amb_units u
    WHERE uur.usr_id = rec.usr_id
      AND uur.unt_id = u.unt_id
      AND u.ent_id = rec.target_entity_id;

    -- 4. 해당 법인의 UserCell에서 usr_id 변경 (cell이 법인 소속인 경우)
    -- cells는 법인 단위 구분이 없을 수 있으므로 주의
    -- UPDATE amb_user_cells uc SET usr_id = new_user_id
    -- FROM amb_cells c WHERE uc.cel_id = c.cel_id AND uc.usr_id = rec.usr_id
    -- AND c.ent_id = rec.target_entity_id;

    RAISE NOTICE 'Split user % (%) -> new user % for entity %',
      rec.usr_id, rec.usr_email, new_user_id, rec.target_entity_id;
  END LOOP;
END $$;

-- ────────────────────────────────────────
-- Step 4: 검증
-- ────────────────────────────────────────

-- 분리 결과 확인
-- SELECT usr_email, usr_company_id, usr_id, usr_role, usr_status
-- FROM amb_users
-- WHERE usr_email IN (
--   SELECT usr_email FROM amb_users
--   WHERE usr_deleted_at IS NULL
--   GROUP BY usr_email HAVING COUNT(*) > 1
-- )
-- AND usr_deleted_at IS NULL
-- ORDER BY usr_email, usr_company_id;

-- UNIQUE 인덱스 확인
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE tablename = 'amb_users' AND indexname LIKE '%email%';
