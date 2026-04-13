# PLAN-클라이언트멤버CLIENT_ADMIN노출개선-작업계획-20260331

## 1. 시스템 개발 현황 분석
- 현재 클라이언트 계정 생성은 `CLIENT_LEVEL + usr_cli_id` 중심이며, `usr_company_id` 비설정 케이스가 존재함.
- `EntityMemberService.findMembers()`는 `entity_user_role` + `usr_company_id`만 집계하여 일부 클라이언트 계정 누락 가능.
- 프로젝트 개요의 멤버 선택(`AssigneeSelector`)은 `GET /members`를 사용하고, 이 API도 `entity_user_role` 중심 집계라 동일 누락 가능.
- 프론트 `EntityMemberPage`는 클라이언트 역할 상수가 `CLIENT_MANAGER`로 정의되어 실제 역할(`CLIENT_ADMIN`)과 불일치.

## 2. 단계별 구현 계획
### Phase 1. 멤버 집계 로직 보강 (Backend)
- 목표
  - 법인 스코프에서 클라이언트 사용자(`CLIENT_LEVEL`)를 누락 없이 집계
- 작업
  - `entity-member.service.ts#findMembers`
    - 기존 집계(`entity_user_role`, `usr_company_id`) 유지
    - 추가 집계: `svc_client(cli_ent_id=entityId)`에 속한 고객사의 `usr_cli_id` 사용자 포함
  - `members/service/member.service.ts#findAll`
    - `GET /members`에서도 동일 기준 반영
- 산출물
  - 법인 스코프 기준 통합 사용자 ID 집합 생성 로직

### Phase 2. 클라이언트 역할 상수 정합성 수정 (Frontend)
- 목표
  - `CLIENT_ADMIN` UI 제어 완전 지원
- 작업
  - `EntityMemberPage.tsx`
    - `CLIENT_ROLES`를 `['CLIENT_ADMIN', 'CLIENT_MEMBER']`로 변경
    - `ROLE_COLORS`에 `CLIENT_ADMIN` 스타일 추가
    - 역할 필터/편집 드롭다운 동작 확인
- 산출물
  - Client 탭 필터/편집 UI 정합성 복구

### Phase 3. 통합 검증
- 목표
  - 두 화면에서 동일 문제 해소 및 회귀 방지
- 작업
  - 수동 시나리오
    - `/entity-settings/members` Client 탭에서 `CLIENT_ADMIN` 표시 확인
    - `/project/projects/:id` 개요 탭 멤버 선택 후보 확인
    - `USER_LEVEL`/`PARTNER_LEVEL` 노출 회귀 확인
  - 빌드 검증
    - `npm run -w @amb/api build`
    - `npm run -w @amb/web build`
- 산출물
  - 검증 결과 기록(테스트 케이스 문서 단계에서 상세화)

## 3. 변경 파일 목록
- 수정 예정
  - `apps/api/src/domain/entity-settings/service/entity-member.service.ts`
  - `apps/api/src/domain/members/service/member.service.ts`
  - `apps/web/src/domain/entity-settings/pages/EntityMemberPage.tsx`
- 검증 참고(수정 없을 가능성)
  - `apps/web/src/domain/issues/components/AssigneeSelector.tsx`
  - `apps/web/src/domain/project/components/ProjectMemberList.tsx`
  - `apps/web/src/domain/project/components/ProjectOverviewTab.tsx`

## 4. 사이드 임팩트 분석
- 권한/노출 범위 증가 리스크
  - 클라이언트 사용자 노출이 확대되므로 법인 경계 조건(`entityId`) 검증 필수
- 프로젝트 운영 정책 리스크
  - `CLIENT_LEVEL` 사용자를 프로젝트 멤버로 허용하는 정책 확인 필요
  - 정책상 허용이면 그대로 진행, 제한 필요 시 후속으로 role 기반 제한 룰 추가 검토
- UI 번역 리스크
  - `settings:roles.CLIENT_ADMIN` 키 미존재 시 라벨 fallback 노출 가능
  - 필요 시 `ko/en/vi` 번역 키 보강
- 성능 리스크
  - 멤버 조회 쿼리 조합 확대로 응답시간 증가 가능
  - 인덱스(`usr_cli_id`, `cli_ent_id`) 활용 및 ID 집합 후 단건 조회 유지

## 5. DB 마이그레이션
- 예정: 없음 (No schema change)
- 사유
  - 테이블/컬럼 추가 없이 기존 관계(`usr_cli_id`, `svc_client.cli_ent_id`) 활용한 조회 로직 수정
- 비고
  - 스테이징/프로덕션은 `synchronize=false`이므로 스키마 변경이 필요한 경우 수동 SQL 필수이나, 본 작업 범위에서는 해당 없음

## 6. 완료 기준
- `/entity-settings/members`에서 `CLIENT_ADMIN` 목록/필터/편집 노출 정상
- 프로젝트 개요 멤버 추가 및 담당자 선택에서 `CLIENT_ADMIN` 노출 정상
- API/WEB 빌드 성공 및 주요 권한 시나리오 회귀 없음
