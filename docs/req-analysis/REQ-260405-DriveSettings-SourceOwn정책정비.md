# REQ-DriveSettings-SourceOwn정책정비-20260405

## 1. 요구사항 요약
- 요청 배경
  - 관리자 화면 `/admin/total-users`에서 법인 Drive 설정을 삭제한 뒤에도 `/drive` 동작이 상위/글로벌 fallback으로 이어지는 현상을 제거해야 함.
  - 정책을 "법인별 자체 Drive 설정(own)만 사용"으로 변경하고, 상위/글로벌 설정은 하위 법인에 사용하지 않도록 강제해야 함.
- 핵심 요구사항
  1. Google Drive는 각 법인 own 설정으로만 동작해야 한다.
  2. 상위 법인(inherited) 및 글로벌(global) 설정 fallback은 하위 법인 `/drive`와 `/entity-settings/drive`에서 사용하지 않는다.
  3. `/admin/total-users` Drive Settings에서 법인 설정 삭제 시 즉시 `configured=false` 상태로 전환된다.
  4. 삭제 후 `/drive` 관련 API는 fallback하지 않고 own 미설정 상태로 동작해야 한다.
  5. 신규 가입(초대 수락) 사용자 발생 시 해당 법인의 own 설정 보장 정책을 적용한다.

## 2. AS-IS 현황 분석
### 2.1 Source 계산 구조 (DB 컬럼 아님)
- `amb_drive_settings` 엔티티에는 source 컬럼이 없고, source는 서비스 로직에서 계산된다.
  - 파일: apps/api/src/domain/settings/entity/drive-settings.entity.ts
  - 컬럼: ent_id, drs_impersonate_email, drs_billing_root_folder_id, drs_billing_root_folder_name 등
- 현재 `DriveSettingsService.getSettings(entityId)`는 아래 순서로 fallback한다.
  1. own(ent_id=법인) + impersonate email 존재 시 source=own
  2. 상위 법인 설정 존재 시 source=inherited
  3. 전역 설정 존재 시 source=global
  4. 없으면 source=none
  - 파일: apps/api/src/domain/settings/service/drive-settings.service.ts

### 2.2 `/entity-settings/drive` 동작
- 엔티티 설정 API는 기존에는 `DriveSettingsService.getSettings(entityId)`를 호출하여 inherited/global fallback이 노출 가능했다.
  - 파일: apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts
- 정책 변경 후에는 own-only 조회를 사용해야 하며, own 설정이 없으면 source=none으로 반환되어야 한다.
- 프론트 `EntityDrivePage`는 source=none일 때 미설정 상태를 표시해야 하며 inherited/global 안내를 사용하지 않는다.
  - 파일: apps/web/src/domain/entity-settings/pages/EntityDrivePage.tsx
  - 파일: apps/web/src/domain/entity-settings/service/entity-settings.service.ts

### 2.3 `/admin/total-users` Drive Settings 동작
- 관리자 탭은 모든 법인의 drive settings를 조회하며 source(own/inherited/global/none)를 표시한다.
  - 파일: apps/api/src/domain/admin/service/admin.service.ts
  - 파일: apps/web/src/domain/admin/components/EntityDriveSettingsTab.tsx
- 편집 모달은 impersonateEmail/rootFolder를 수정한다.
- 삭제 동작 이후에는 해당 법인의 own 설정/등록 폴더가 제거되어 configured=false로 보여야 한다.
  - 파일: apps/web/src/domain/admin/components/DriveSettingsEditModal.tsx
  - 파일: apps/api/src/domain/admin/controller/admin.controller.ts

### 2.4 사용자 생성 시점 동작
- 사용자 생성(초대 수락) 로직은 사용자/권한/유닛은 생성하지만 drive own 설정을 생성하지 않는다.
  - 파일: apps/api/src/domain/invitation/service/invitation.service.ts
- 결과적으로 신규 법인 사용자의 법인 drive 설정이 없으면 inherited/global source가 노출될 수 있다.

### 2.5 운영 데이터 상태
- 스테이징/프로덕션은 TypeORM synchronize=false 정책이며, 데이터 정비는 수동 SQL/스크립트로 수행해야 한다.
- 기존 법인 중 own 레코드가 없거나 값이 불완전한 경우 fallback 영향이 있었고, 정책 전환 후에는 source=none 상태가 될 수 있다.

## 3. TO-BE 요구사항
1. `/entity-settings/drive`는 own 설정만 반환한다.
2. `/drive` 관련 동작은 own 설정만 사용하며 inherited/global fallback을 금지한다.
3. `/admin/total-users`에서 법인 Drive 설정 삭제 시 즉시 configured=false로 전환된다.
4. 삭제 후 `/drive`는 fallback 없이 미설정 동작(빈 목록/설정없음)을 반환한다.
5. 신규 가입(초대 수락) 시 해당 법인 own 설정 보장 정책을 적용한다.
6. 운영 환경(staging/production)도 동일 정책으로 동작한다.

## 4. 갭 분석
### 4.1 정책 갭
- AS-IS: 엔티티 화면에서 inherited/global fallback 허용
- TO-BE: 엔티티/drive 화면 모두 own only

### 4.2 모델 갭
- AS-IS: source는 계산값이며 직접 관리 필드가 아님
- TO-BE: 계산 구조는 유지하되, 조회 정책을 own-only로 강제

### 4.3 생성 플로우 갭
- AS-IS: 사용자 생성 시 drive own 자동 보장 없음
- TO-BE: 사용자 생성 완료 시 법인 own 설정 존재/유효성 보장

### 4.4 운영 데이터 갭
- AS-IS: 삭제 이후 fallback으로 인해 법인별 정책과 실제 동작 불일치 가능
- TO-BE: 삭제 이후 즉시 configured=false, fallback 없음

## 5. 사용자 플로우
1. 관리자(ADMIN_LEVEL)가 `/admin/total-users`에서 법인 Drive Settings를 선택한다.
2. 관리자가 설정을 삭제하면 해당 법인의 Drive own 설정과 등록 폴더가 제거된다.
3. 삭제 직후 `/entity-settings/drive` 응답은 configured=false, source=none이다.
4. 같은 시점 `/drive` 화면/API는 상위/글로벌 fallback 없이 미설정 상태로 동작한다.
5. 신규 사용자가 생성/초대 수락되면 해당 법인 own 설정 보장 로직이 실행된다.

## 6. 기술 제약사항
- DB 제약
  - source 컬럼이 없어 계산 로직 기반이며, 정책은 서비스/컨트롤러 레벨에서 강제해야 한다.
- 멀티테넌시/보안
  - USER_LEVEL 엔드포인트는 ent_id 격리를 유지해야 하며 타 법인 설정 fallback 노출을 금지해야 한다.
- 운영 반영
  - 스테이징/프로덕션은 동일 정책 반영 후 런타임 검증이 필요하다.
- 호환성
  - 기존 source 배지 표시 체계와 실제 own-only 정책 간 불일치가 없도록 UI 문구 정합성이 필요하다.

## 7. 수용 기준(AC)
- AC-1: `/entity-settings/drive` 응답에서 source=inherited/global이 발생하지 않는다.
- AC-2: `/admin/total-users`에서 법인 Drive 설정 삭제 직후 configured=false로 전환된다.
- AC-3: 삭제 직후 `/drive` 관련 응답은 fallback 없이 미설정 상태(빈 목록/설정없음)로 동작한다.
- AC-4: 신규 사용자 생성 후 own 설정 보장 로직이 실행된다.
- AC-5: 스테이징/프로덕션 모두 동일 동작을 재현한다.

## 8. 결정 필요사항
1. 관리자 UI의 source 라벨 정책을 own-only 정책에 맞게 단순화할지 결정
2. `/drive` 미설정 시 UX(안내 문구/행동 유도) 확정
3. 운영 반영 후 회귀 점검 범위(Drive 화면, 공유드라이브 목록, 폴더등록 흐름) 확정
