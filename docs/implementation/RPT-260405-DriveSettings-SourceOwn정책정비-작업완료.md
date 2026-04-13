# RPT-DriveSettings-SourceOwn정책정비-작업완료-20260405

## 1. 구현 내용 요약
- 정책 변경:
  - Google Drive는 법인별 own 설정으로만 사용
  - 상위(inherited)/글로벌(global) fallback을 엔티티 경로에서 사용하지 않음
  - 관리자 삭제 후 법인 상태를 configured=false로 전환
- 구현 범위(백엔드 4개 파일):
  1. `drive-settings.service.ts`
  2. `entity-drive.controller.ts`
  3. `invitation.service.ts`
  4. `drive.controller.ts` (`/drive/status` own-only 보정)

## 2. 상세 변경 사항
### 2.1 DriveSettingsService
- `getEntityOwnSettings(entityId)` 추가
  - own 설정만 반환
  - own 설정 미존재 시 `source=none`, `configured=false` 반환
- 엔티티 테스트 연결(`testConnectionForEntity`)을 own-only 기준으로 변경
- 엔티티 삭제(`deleteEntitySettings`) 후 반환을 own-only 기준으로 변경
- 전역 조회는 `ent_id IS NULL` 레코드만 사용하도록 고정
  - onModuleInit
  - getSettings(전역)
  - getBillingRootFolderId
  - updateSettings(전역 업데이트)

### 2.2 EntityDriveController
- `/entity-settings/drive` 조회가 `getSettings(entityId)` 대신 `getEntityOwnSettings(entityId)`를 사용하도록 변경
- 결과적으로 엔티티 응답에서 inherited/global 노출 차단

### 2.3 InvitationService
- 초대 수락(`accept`) 후 USER_LEVEL 사용자 생성 시 own 설정 보장 로직 추가
- `ensureEntityOwnDriveSettings(entityId, updatedBy)`
  - own 설정이 없으면 부모/전역 값을 참조해 own 레코드 보강
  - 실패 시 회원가입을 막지 않는 비차단 처리(경고 로그)

### 2.4 DriveController
- `/drive/status`가 엔티티 컨텍스트에서 fallback 조회 대신 own-only 조회를 사용하도록 보정
- own 설정 삭제 후 상태 표시가 `configured=false`로 일관되도록 정합성 확보

## 3. 변경 파일 목록
### 수정
1. `apps/api/src/domain/settings/service/drive-settings.service.ts`
2. `apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts`
3. `apps/api/src/domain/invitation/service/invitation.service.ts`
4. `apps/api/src/domain/drive/controller/drive.controller.ts`

### 문서
1. `docs/analysis/REQ-260405-DriveSettings-SourceOwn정책정비.md`
2. `docs/plan/PLN-260405-DriveSettings-SourceOwn정책정비-작업계획.md`
3. `docs/test/TCR-260405-DriveSettings-SourceOwn정책정비-Test.md`
4. `docs/implementation/RPT-260405-DriveSettings-SourceOwn정책정비-작업완료.md`

## 4. DB 변경사항
- 스키마 변경: 없음
- 데이터 정책 변경: 서비스/컨트롤러 로직으로 own-only 강제

## 5. 테스트 결과 요약
- 정적/컴파일 검증
  - `npm run -w @amb/api build` 성공
- 파일 단위 에러 검사
  - 수정한 4개 파일 에러 없음
- 런타임 검증
  - staging 반영 및 재기동 수행 완료
  - 신규 가입 API: HTTP 201 (`success=true`, `status=ACTIVE`)
  - 삭제 전 `/entity-settings/drive`: `configured=true`, `source=own`
  - 삭제 후 `/entity-settings/drive`: `configured=false`, `source=none`
  - 삭제 후 `/drive/shared-drives`: `[]`
  - 삭제 후 `/drive/folders`: `[]`
  - 삭제 후 `/drive/status`: `configured=false` (2차 재측정 PASS)
  - DB 검증:
    - `amb_drive_settings` (대상 ent_id) = 0건
    - `amb_drive_folders` active (대상 ent_id) = 0건
  - 상세 증적: `docs/test/TCR-260405-DriveSettings-SourceOwn정책정비-Test.md`
  - 관찰 이슈: `OBS-DRIVE-STATUS-001` 해소 완료

## 6. 배포 상태
- 로컬: 구현 완료
- 스테이징: 반영/재기동 수행
- 프로덕션: 미반영 (승인 후 반영)

## 7. 후속 작업
1. 프로덕션 동일 시나리오 검증
  - 신규 가입 1건
  - 삭제 후 `/entity-settings/drive`와 `/drive` 동작 확인
2. 관리자/엔티티 UI 문구를 own-only 정책에 맞게 최종 정리
