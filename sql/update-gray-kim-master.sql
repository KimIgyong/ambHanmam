-- gray.kim@amoeba.group 사용자를 MASTER 등급으로 변경
-- 실행 환경: 스테이징 서버 (amb-staging)
-- 실행 방법: ssh amb-staging "docker exec ambmanagement-postgres-1 psql -U ambmanager -d ambmanagement -f -" < sql/update-gray-kim-master.sql

-- 1. 변경 전 확인
SELECT usr_id, usr_email, usr_role, usr_level_code, usr_status
FROM amb_users
WHERE usr_email = 'gray.kim@amoeba.group';

-- 2. MASTER 등급으로 변경
UPDATE amb_users
SET usr_role = 'MASTER',
    usr_updated_at = NOW()
WHERE usr_email = 'gray.kim@amoeba.group';

-- 3. 변경 후 확인
SELECT usr_id, usr_email, usr_role, usr_level_code, usr_status
FROM amb_users
WHERE usr_email = 'gray.kim@amoeba.group';
