# TCR-DriveSettings-SourceOwn정책정비-Test-20260405

## 1. 테스트 개요
- 대상: Drive Settings own-only 정책 전환
- 목적:
  1. 법인 Drive 설정 삭제 후 configured=false 전환 검증
  2. `/drive` 및 `/entity-settings/drive`에서 inherited/global fallback 미사용 검증
  3. 신규 가입(초대 수락) 시 법인 own 설정 보장 검증
- 범위:
  - Backend: DriveSettingsService, EntityDriveController, InvitationService
  - Runtime: staging API 동작 확인

## 2. 사전 조건
1. 테스트 법인 1개 존재
2. 테스트 법인에 Drive own 설정이 1회 이상 저장 가능한 상태
3. 관리자 계정(ADMIN_LEVEL)과 테스트 사용자 계정 준비
4. 스테이징 서버 API 정상 기동

## 3. 단위 테스트 케이스
| ID | 구분 | 입력 | 기대 결과 | 검증 포인트 |
|---|---|---|---|---|
| UT-01 | own-only 조회 | `getEntityOwnSettings(entityId)` (own 존재) | source=own, configured=true/false는 own 값 기준 | inherited/global 미참조 |
| UT-02 | own-only 조회 | `getEntityOwnSettings(entityId)` (own 없음) | source=none, configured=false | fallback 미사용 |
| UT-03 | 엔티티 테스트연결 | `testConnectionForEntity(entityId)` + own 없음 | success=false, 설정 없음 메시지 | getSettings fallback 미사용 |
| UT-04 | 엔티티 삭제 응답 | `deleteEntitySettings(entityId)` | source=none, configured=false | 삭제 직후 상태 일관성 |
| UT-05 | 전역 조회 고정 | `getSettings()`(admin 전역) | ent_id IS NULL 레코드만 사용 | 전역/법인 레코드 혼선 방지 |
| UT-06 | 가입 시 own 보장 | `accept()` with USER_LEVEL | own 레코드 생성/보강 시도 | 비차단 + 로그 출력 |

## 4. 통합 테스트 시나리오
### IT-01: 관리자 삭제 후 configured=false 전환
1. 관리자 로그인
2. `/admin/total-users`에서 대상 법인 Drive 설정 삭제
3. 대상 법인 사용자로 `/entity-settings/drive` 조회
4. 기대 결과:
   - `configured=false`
   - `source=none`
   - `impersonateEmail=null`
   - `billingRootFolderId=null`

### IT-02: 삭제 후 `/drive` fallback 금지
1. IT-01 상태 유지
2. 대상 법인 사용자로 `/drive/shared-drives` 조회
3. 대상 법인 사용자로 `/drive/folders` 조회
4. 기대 결과:
   - 상위/글로벌 설정으로 대체되지 않음
   - 미설정 상태 기준 응답(빈 목록 또는 설정 안내 에러)

### IT-03: 신규 가입 시 own 보장
1. 대상 법인에 초대 생성 (USER_LEVEL)
2. 초대 토큰으로 회원가입(`/invitation/accept`)
3. 가입 직후 대상 법인 `amb_drive_settings` 조회
4. 기대 결과:
   - ent_id=대상 법인 own 레코드 존재
   - source 판정 시 own 경로 사용 가능

## 5. 엣지 케이스
| ID | 케이스 | 기대 결과 |
|---|---|---|
| EC-01 | own 없음 + parent/global도 없음 | source=none, configured=false |
| EC-02 | own은 있으나 이메일만 있고 폴더ID 없음 | source=own, configured=false |
| EC-03 | 삭제 직후 동시 조회(경합) | 최종 상태 source=none, configured=false 일관 유지 |
| EC-04 | 가입 시 own 보장 중 예외 발생 | 회원가입은 성공(비차단), 경고 로그 기록 |

## 6. 데이터 격리 검증
| ID | 항목 | 기대 결과 |
|---|---|---|
| DS-01 | USER_LEVEL A법인 사용자가 B법인 Drive 설정 조회 시도 | 접근 차단(guard + entityId 스코프) |
| DS-02 | A법인 own 미설정 시 B법인/글로벌 fallback 노출 여부 | 노출되지 않음 |
| DS-03 | 관리자 조회(`/admin/total-users`)와 엔티티 조회(`/entity-settings/drive`) 응답 차이 | 관리자 집계는 전체 관점, 엔티티 조회는 own-only |

## 7. 실행 결과 (Staging 실측)
- 실행 일시: 2026-04-05 01:21~01:33 (UTC 기준)
- 실행 환경: staging (`https://stg-ama.amoeba.site`)
- 실행자: AI Agent (GitHub Copilot)

### 7.1 테스트 데이터
- 대상 법인: `f3fd2994-94ae-42c4-b1d8-726a590690f6` / code=`VN8137`
- 검증 계정 이메일: `drive.own.1775352099@example.com`
- 초대 토큰: `drv-own-1775352099`

### 7.2 API 실측 결과
| 시나리오 | 호출 | 실측 응답 | 판정 |
|---|---|---|---|
| 신규 가입 | `POST /api/v1/invitations/token/{token}/accept` | HTTP 201, `success=true`, `status=ACTIVE`, `userId=8ef807ca-57bb-4406-8685-e3ee35d41572` | PASS |
| 삭제 전 own 상태 | `GET /api/v1/entity-settings/drive` | HTTP 200, `configured=true`, `source=own`, `impersonateEmail=pm@amoeba.group`, `billingRootFolderId=1T3L2c...` | PASS |
| 삭제 실행 | `DELETE /api/v1/entity-settings/drive` | HTTP 200, `configured=false`, `source=none`, email/folder null | PASS |
| 삭제 후 own 상태 | `GET /api/v1/entity-settings/drive` | HTTP 200, `configured=false`, `source=none` | PASS |
| 삭제 후 shared-drives | `GET /api/v1/drive/shared-drives` | HTTP 200, `data=[]` | PASS |
| 삭제 후 folders | `GET /api/v1/drive/folders` | HTTP 200, `data=[]` | PASS |
| 삭제 후 status (1차) | `GET /api/v1/drive/status` | HTTP 200, `configured=true` | FAIL |
| 삭제 후 status (2차, 패치 후) | `GET /api/v1/drive/status` | HTTP 200, `configured=false` | PASS |

### 7.3 DB 실측 증적
| 항목 | SQL 실측값 | 판정 |
|---|---|---|
| 초대 상태 | `invite_status=ACCEPTED` | PASS |
| 신규 사용자 상태 | `ACTIVE|MASTER|USER_LEVEL` | PASS |
| 삭제 후 own settings 개수 | `drive_settings_count=0` | PASS |
| 삭제 후 active folder 개수 | `drive_folders_active=0` | PASS |

### 7.4 관찰 이슈
- 이슈 ID: `OBS-DRIVE-STATUS-001`
- 내용: own 설정 삭제 후 `/entity-settings/drive`는 `configured=false`로 정상 전환되지만, `/drive/status`는 1차 측정에서 `configured=true`를 반환함.
- 원인: `/drive/status`가 fallback 가능한 조회를 사용해 `configured`를 계산하던 로직.
- 조치: `DriveController.getStatus()`를 own-only 조회(`getEntityOwnSettings`) 기준으로 수정 후 staging 재배포/재측정.
- 현재 상태: 해소(2차 측정 PASS).

## 8. 완료 기준
1. 삭제 후 configured=false 전환이 staging에서 재현된다.
2. `/drive`에서 fallback 미발생이 staging에서 재현된다.
3. 신규 가입 1건에서 own 보장 로직이 동작한다.
4. USER_LEVEL 데이터 격리 위반이 없다.
5. `/drive/status`가 own 설정 삭제 후 `configured=false`를 반환한다.
