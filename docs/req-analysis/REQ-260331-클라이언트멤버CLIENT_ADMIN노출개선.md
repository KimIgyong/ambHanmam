# REQ-클라이언트멤버CLIENT_ADMIN노출개선-20260331

## 1. 요구사항 요약
- 대상 화면
  - `https://stg-ama.amoeba.site/entity-settings/members`
  - `https://stg-ama.amoeba.site/project/projects/{project_id}` (프로젝트 개요 > 멤버 추가)
- 현상
  - `CLIENT_ADMIN` 사용자가 법인 멤버/클라이언트 멤버 목록에서 누락됨
  - 프로젝트 멤버 추가/프로젝트 제안자/담당자 선택 시 `CLIENT_ADMIN`이 선택 후보에 노출되지 않음
- 요구사항
  - 법인 기준으로 연결된 클라이언트 사용자 중 `CLIENT_MEMBER`, `CLIENT_ADMIN` 모두 일관되게 조회/표시
  - 프로젝트 개요의 멤버 추가 및 담당자 선택 컴포넌트에서도 동일하게 노출

## 2. AS-IS 현황 분석
### 2.1 Entity Settings 멤버 목록 경로
- 프론트
  - `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx`
  - API: `useEntityMembers()` -> `GET /entity-settings/members`
- 백엔드
  - `apps/api/src/domain/entity-settings/controller/entity-member.controller.ts`
  - `apps/api/src/domain/entity-settings/service/entity-member.service.ts#findMembers`

### 2.2 findMembers의 현재 집계 기준
`EntityMemberService.findMembers(entityId, user)`는 현재 아래 두 집합만 합쳐 멤버를 구성함.
1. `amb_entity_user_roles`에서 `ent_id = entityId` AND `eur_status = 'ACTIVE'`
2. `amb_users`에서 `usr_company_id = entityId`

즉, `CLIENT_LEVEL` 사용자 중 `usr_company_id`가 없고 `entity_user_role`도 없는 계정은 목록에서 제외될 수 있음.

### 2.3 CLIENT 계정 생성 경로 확인
- `apps/api/src/domain/client-portal/service/client-auth.service.ts#register`
- 클라이언트 초대 가입 시 생성되는 사용자 필드:
  - `usr_level_code = 'CLIENT_LEVEL'`
  - `usr_role = civ_role` (`CLIENT_ADMIN` 또는 `CLIENT_MEMBER`)
  - `usr_cli_id = invitation.cliId`
  - `usr_company_id`는 설정하지 않음

따라서 클라이언트 계정은 고객사(`svc_client`)를 통해 법인과 연결되지만, 현재 멤버 집계 조건(2.2)에는 포함되지 않는 구조임.

### 2.4 프로젝트 개요 멤버 선택 경로
- `apps/web/src/domain/project/components/ProjectMemberList.tsx`
- `apps/web/src/domain/project/components/ProjectOverviewTab.tsx`
- 두 화면 모두 `AssigneeSelector` 사용
- `AssigneeSelector`는 `useMemberList()` -> `GET /members` 사용
- 백엔드 `apps/api/src/domain/members/service/member.service.ts#findAll(entityId)`는 사실상 `entity_user_role` 기반으로 사용자 ID를 제한함

결과적으로 `entity_user_role`에 없는 클라이언트 사용자(특히 `CLIENT_ADMIN`)는 프로젝트 선택 후보에서 누락될 수 있음.

### 2.5 프론트 역할 상수 불일치
- `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx`
  - `CLIENT_ROLES = ['CLIENT_MANAGER', 'CLIENT_MEMBER']`
- 실제 시스템 역할 체계는 `CLIENT_ADMIN`, `CLIENT_MEMBER`
- 영향
  - 클라이언트 탭 역할 필터/수정 드롭다운에서 `CLIENT_ADMIN`이 선택 항목으로 제공되지 않음
  - 데이터가 조회되더라도 일부 UI 제어가 불완전함

## 3. TO-BE 요구사항
1. 법인 멤버 조회 API에서 "법인에 연결된 클라이언트 사용자"를 정식 조회 대상으로 포함한다.
2. 프로젝트 담당자/멤버 선택 API(`GET /members`)도 동일 기준을 적용해 `CLIENT_ADMIN`/`CLIENT_MEMBER`를 모두 노출한다.
3. `EntityMemberPage`의 클라이언트 역할 상수를 실제 역할 체계(`CLIENT_ADMIN`, `CLIENT_MEMBER`)와 일치시킨다.
4. 역할 뱃지/필터/수정 드롭다운에서 `CLIENT_ADMIN`이 정상 동작한다.
5. 기존 `USER_LEVEL`/`PARTNER_LEVEL` 표시 동작에는 회귀가 없어야 한다.

## 4. 갭 분석
- 데이터 집계 갭
  - AS-IS: `entity_user_role` + `usr_company_id` 중심
  - TO-BE: `CLIENT_LEVEL`에 대해 `usr_cli_id -> svc_client(cli_ent_id)` 경유 집계 추가
- UI 역할 체계 갭
  - AS-IS: `CLIENT_MANAGER` 사용
  - TO-BE: `CLIENT_ADMIN` 사용
- 화면 일관성 갭
  - AS-IS: 엔터티 설정/프로젝트 선택 화면별 후보군 불일치
  - TO-BE: 동일 법인 스코프 기준으로 동일 후보군 제공

## 5. 사용자 플로우
1. 법인 사용자(MASTER/MANAGER)가 Entity Settings > Members > Client 탭 진입
2. 시스템은 법인 연결 클라이언트 사용자(`CLIENT_MEMBER`, `CLIENT_ADMIN`)를 모두 목록에 표시
3. 프로젝트 상세 > 개요에서 멤버 추가 또는 제안자/담당자 선택
4. 동일한 클라이언트 사용자 후보군이 선택 목록에 노출
5. 선택 후 프로젝트 멤버 추가/담당자 저장이 정상 처리

## 6. 기술 제약사항
- 데이터 격리
  - USER_LEVEL 컨텍스트에서 반드시 법인(`ent_id`) 범위 내 사용자만 조회
  - 클라이언트 사용자 확장 시에도 `svc_client.cli_ent_id = entityId`(또는 파트너 경유 소유관계) 조건을 강제
- 성능
  - 멤버 목록 API는 사용 빈도가 높으므로 N+1 쿼리 방지 필요
  - 사용자 ID 집계 시 중복 제거(Set) 유지
- 호환성
  - 기존 `EntityMemberPage`/`AssigneeSelector`의 응답 스키마(`MemberResponse`/`EntityMember`)를 유지
- 번역(i18n)
  - 신규 역할 라벨 키 추가가 필요하면 `ko/en/vi` 동시 반영

## 7. 영향 범위
- Backend
  - `apps/api/src/domain/entity-settings/service/entity-member.service.ts`
  - `apps/api/src/domain/members/service/member.service.ts`
- Frontend
  - `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx`
- 검증 대상 화면
  - `/entity-settings/members`
  - `/project/projects/:id` (개요 탭)

## 8. 수용 기준(AC)
- AC-1: `/entity-settings/members`의 Client 탭에서 `CLIENT_ADMIN` 계정이 표시된다.
- AC-2: Client 탭 역할 필터에 `CLIENT_ADMIN`이 표시되고 필터링이 동작한다.
- AC-3: 멤버 상세 편집의 역할 드롭다운에 `CLIENT_ADMIN`이 표시된다.
- AC-4: 프로젝트 개요의 멤버 추가/제안자/담당자 선택 목록에 `CLIENT_ADMIN`이 노출된다.
- AC-5: USER_LEVEL 일반 멤버 목록 및 기존 프로젝트 멤버 기능에 회귀가 없다.
