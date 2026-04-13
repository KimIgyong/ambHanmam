-- 260413: Issue comment client visibility
-- 이슈 코멘트에 고객사(CLIENT_LEVEL) 공개 여부 컬럼 추가
-- 스테이징/프로덕션 수동 실행 필요

ALTER TABLE amb_issue_comments 
  ADD COLUMN isc_client_visible BOOLEAN NOT NULL DEFAULT false;

-- 기존 CLIENT_LEVEL 사용자가 작성한 코멘트만 공개 전환
UPDATE amb_issue_comments 
SET isc_client_visible = true 
WHERE isc_author_id IN (
  SELECT usr_id FROM amb_users WHERE usr_level_code = 'CLIENT_LEVEL'
);
