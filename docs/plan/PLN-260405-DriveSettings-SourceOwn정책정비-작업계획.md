# PLAN-DriveSettings-SourceOwn정책정비-작업계획-20260405

## 1. 시스템 개발 현황 분석
- 현재 source는 DB 저장값이 아니라 `DriveSettingsService.getSettings(entityId)`의 fallback 계산 결과다.
- 엔티티/drive 경로에서 own 미설정 시 inherited/global fallback이 발생 가능한 구조였다.
- 관리자 `/admin/total-users`에서 법인 설정 삭제 후에도 `/drive` fallback으로 동작 불일치가 발생할 수 있었다.
- 사용자 생성(초대 수락) 시 drive own 설정 보장 로직이 없어 정책 일관성이 깨질 수 있었다.

## 2. 단계별 구현 계획
### Phase 1. 정책 확정 (Own-only)
- 목표
  - Google Drive를 법인 own 설정으로만 사용하도록 정책 확정
- 작업
  - 상위(inherited)/글로벌(global) fallback 금지 범위를 `/entity-settings/drive`, `/drive`로 확정
  - 삭제 후 상태를 `configured=false`, `source=none`으로 통일
- 산출물
  - 정책 기준서(운영/개발 공통)

### Phase 2. 백엔드 정책 강제
- 목표
  - own-only 정책 강제 및 삭제 후 fallback 차단
- 작업
  - `DriveSettingsService`에 own-only 조회 메서드 적용
    - `/entity-settings/drive`는 own-only 응답 사용
    - `testConnectionForEntity`도 own-only 기준으로 검증
  - 전역 설정 조회는 `ent_id IS NULL`만 사용하도록 고정
  - 삭제 후 응답을 own-only 기준 `configured=false`로 반환
  - 사용자 생성 플로우(초대 수락)에 own 설정 보장 로직 추가
    - 부모/전역 값을 복제해 own 레코드 생성(비차단)
- 산출물
  - API 응답 정책 일원화 (entity/drive own-only)

### Phase 3. 관리자 화면 정합성 반영
- 목표
  - `/admin/total-users` 동작과 own-only 정책 정합성 확보
- 작업
  - 삭제 후 configured=false 상태가 목록/상세에 즉시 반영되는지 검증
  - source 라벨/안내 문구를 own-only 정책에 맞게 정리
- 산출물
  - 관리자 화면 표시 정합성 확보

### Phase 4. 스테이징/프로덕션 데이터 정비
- 목표
  - 운영 환경에서 fallback 없는 own-only 정책 동작 보장
- 작업
  - 법인별 own 레코드/삭제 케이스 점검
  - 삭제 후 `/entity-settings/drive`와 `/drive`의 미설정 동작 확인
  - 신규 가입 1건으로 own 보장 로직 검증
- 산출물
  - 환경별 런타임 검증 리포트

### Phase 5. 검증 및 배포
- 목표
  - 회귀 없이 정책 전환 배포 완료
- 작업
  - 빌드/타입검증
    - npm run -w @amb/api build
    - npm run -w @amb/web build
  - 스테이징 검증 후 프로덕션 반영
  - 주요 시나리오 테스트
    - 관리자 삭제 후 configured=false 전환
    - 삭제 후 `/drive` fallback 미발생
    - 신규 사용자 생성 후 own 보장
    - 엔티티 화면 inherited/global 미노출
- 산출물
  - 배포 체크리스트 완료

## 3. 변경 파일 목록
### Backend (예정)
- apps/api/src/domain/settings/service/drive-settings.service.ts
- apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts
- apps/api/src/domain/invitation/service/invitation.service.ts

### Frontend (정합성 점검 대상)
- apps/web/src/domain/admin/components/EntityDriveSettingsTab.tsx
- apps/web/src/domain/admin/components/DriveSettingsEditModal.tsx
- apps/web/src/domain/admin/service/admin.service.ts
- apps/web/src/domain/admin/hooks/useAdmin.ts
- apps/web/src/domain/entity-settings/pages/EntityDrivePage.tsx
- apps/web/src/locales/ko/totalUsers.json
- apps/web/src/locales/en/totalUsers.json
- apps/web/src/locales/vi/totalUsers.json

### 문서/운영
- docs/test/TCR-260405-DriveSettings-SourceOwn정책정비-Test.md
- docs/implementation/RPT-260405-DriveSettings-SourceOwn정책정비-작업완료.md

## 4. 사이드 임팩트 분석
- 권한/데이터 범위
  - fallback 제거 시 own 미설정 법인은 즉시 미설정 상태가 된다.
  - 대응: 운영 검증 시 own 보장 대상 법인 선점검
- 운영 안정성
  - 삭제 후 configured=false 전환이 의도치 않게 대량 발생하지 않도록 대상 검증 필요
  - 대응: 엔티티 단위 검증 및 롤백 계획 확보
- UI 호환성
  - source 배지가 inherited/global을 계속 표시하면 정책 오해 가능
  - 대응: own-only 정책 반영 문구 정리
- 연동 영향
  - `/drive` 화면은 configured/source 기준 동작이므로 삭제 케이스 회귀 테스트 필수

## 5. DB 마이그레이션
- 스키마 변경
  - 없음 (서비스/컨트롤러 정책 강제)
- 데이터 마이그레이션(필수)
  - 목적: 운영 데이터가 own-only 정책에서 정상 동작하는지 검증
  - 적용 환경: staging -> production 순차
  - 검증: 삭제 후 configured=false, /drive fallback 미발생

## 6. 테스트 계획
- 단위
  - drive settings own-only 조회/삭제 후 응답 테스트
- 통합
  - `/entity-settings/drive` 조회/수정/삭제
  - `/drive/shared-drives`, `/drive/folders` fallback 미발생 확인
- 시나리오
  1. 법인 own 설정 삭제
  2. `/entity-settings/drive`에서 configured=false/source=none 확인
  3. `/drive`에서 fallback 없이 미설정 동작 확인
  4. 신규 가입 1건 생성 후 own 보장 동작 확인

## 7. 배포 및 실행 순서
1. 코드 반영 및 빌드 검증
2. 스테이징 런타임 검증(삭제/drive/가입)
3. 스테이징 배포
4. 프로덕션 동일 시나리오 검증
5. 프로덕션 배포

## 8. 완료 기준
- `/entity-settings/drive`에서 inherited/global 미노출
- 관리자 삭제 후 configured=false 즉시 반영
- 삭제 후 `/drive` fallback 미발생
- 신규 사용자 생성 후 own 보장
- 스테이징/프로덕션에서 동일 동작 확인
