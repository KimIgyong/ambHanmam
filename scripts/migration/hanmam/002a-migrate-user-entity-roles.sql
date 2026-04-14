-- ============================================================
-- hanmam 마이그레이션 보완: 사용자 → 법인 역할 매핑
-- 002-migrate-user.sql에서 누락된 amb_hr_entity_user_roles INSERT
-- 실행: docker exec amb-postgres bash -c "psql -U amb_user -d db_amb_hanmam -f /var/tmp/002a-migrate-user-entity-roles.sql"
-- ============================================================

BEGIN;

INSERT INTO amb_hr_entity_user_roles (
  eur_id, ent_id, usr_id, eur_role, eur_status,
  eur_hidden_from_today, eur_hidden_from_attendance, eur_is_owner, eur_created_at
)
SELECT
  gen_random_uuid(),
  u.usr_company_id,
  u.usr_id,
  'MEMBER',
  'ACTIVE',
  false,
  false,
  false,
  NOW()
FROM amb_users u
WHERE u.usr_id IN (
  SELECT map_target_pk FROM amb_migration_pk_map
  WHERE map_source_table = 'tbl_user'
)
AND NOT EXISTS (
  SELECT 1 FROM amb_hr_entity_user_roles eur
  WHERE eur.usr_id = u.usr_id AND eur.ent_id = u.usr_company_id
);

COMMIT;
