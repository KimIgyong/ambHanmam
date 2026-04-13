# VN01 Drive shared-drives 미노출 원인 분석 및 해결방안 (2026-04-05)

## 1. 이슈 요약
- 사용자 관찰
  - stg-ama.amoeba.site/entity-settings/drive 에서 VN01 설정은 정상
  - configured=true, source=own, billingRootFolderId=1T3L2cRN0bvMZRhXnRoAbVRBkzb2S8n1y, billingRootFolderName=ambCoWork
- 프로덕션 API 관찰
  - /api/v1/drive/shared-drives 응답이 빈 배열 ([])
  - /api/v1/drive 루트 호출 시 data:null 형태 응답 확인

## 2. 사실 확인 결과
### 2.1 /api/v1/drive 루트 응답
- /api/v1/drive 는 유효한 라우트가 아님
- 실제 응답: 404 + { success:false, data:null, error:{ message:"Cannot GET /api/v1/drive" } }
- 결론: data:null은 드라이브 데이터 없음이 아니라 잘못된 엔드포인트 호출 결과

### 2.2 shared-drives 빈 배열 원인
DriveService.listSharedDrives(entityId) 로직은 다음 순서로 동작함.
1) 엔티티 설정 조회
2) source가 own이고 billingRootFolderId가 있을 때만 진행
3) billingRootFolderId로 driveId를 조회 (getDriveIdByFileId)
4) 전체 shared drive 목록에서 drive.id === driveId 인 항목만 반환

검증 결과:
- VN01 billingRootFolderId(1T3L2cRN0bvMZRhXnRoAbVRBkzb2S8n1y)에 대해 Google files.get(fields=driveId) 결과가 {} (driveId 없음)
- 따라서 필터 대상 driveId가 null이 되어 shared-drives는 [] 반환

즉, 현재 설정값은 폴더 ID이며, shared drive ID로 직접 매핑되지 않아 shared-drives가 비는 구조임.

### 2.3 /drive 화면에서 폴더 노출과 shared-drives의 관계
- /drive 화면의 실제 폴더 노출 기준은 /api/v1/drive/folders
- 백엔드에는 own 설정 기반 fallback(설정 폴더를 가상 등록 폴더로 반환) 로직이 존재
- 따라서 shared-drives가 []여도 folders가 정상이라면 화면은 폴더를 표시할 수 있어야 함

## 3. 근본 원인 정리
1) API 의미 혼선
- shared-drives는 Shared Drive 목록 API이고, 설정된 billingRootFolderId(폴더 ID)와 1:1 동일 개념이 아님

2) 데이터 모델 불일치
- 화면 기대: 설정된 billingRootFolderName(ambCoWork)이 shared-drives에서 보여야 함
- 서버 구현: shared drive ID 기반 필터링만 수행
- 결과: 폴더 ID에서 driveId를 얻지 못하는 경우 항상 []

3) 잘못된 진단 신호
- /api/v1/drive(data:null)를 드라이브 데이터 미존재로 해석하면 오판 발생
- 실제로는 잘못된 라우트 호출(404)

## 4. 해결방안
### 방안 A (권장, 단기)
- 화면/운영 기준을 folders API로 통일
- /drive에서 폴더 노출 판단은 /api/v1/drive/folders 결과를 단일 기준으로 사용
- shared-drives는 등록 모달의 보조 목록으로만 사용

기대효과:
- 현재 구조와 가장 일관됨
- shared drive ID 해석 실패와 무관하게 VN01 폴더 노출 안정화

### 방안 B (요구사항 반영형, 중기)
- shared-drives API 보강
- getDriveIdByFileId 결과가 null이어도 settings의 billingRootFolderId/billingRootFolderName을 fallback 항목으로 반환
- 즉, shared-drives를 "선택 가능한 루트 리소스 목록" 개념으로 확장

주의:
- API 의미가 Shared Drive 목록에서 혼합 목록으로 바뀌므로 프론트/문서 동시 정비 필요

### 방안 C (운영 가시성 강화)
- Drive API 디버그 로그 강화
  - effectiveEntityId
  - settings.source, billingRootFolderId
  - resolved driveId
  - shared-drives 최종 개수
- 운영 중 원인 추적 시간을 단축

## 5. 즉시 실행 권고안
1) 운영/테스트 체크 시 /api/v1/drive 루트 사용 금지
   - status, folders, shared-drives 개별 엔드포인트로 확인
2) 사용자 체감 문제(폴더 미노출) 확인은 folders 응답을 기준으로 판정
3) shared-drives 빈 배열은 현재 구현상 발생 가능한 정상 케이스로 분류
4) 제품 요구가 "설정 폴더를 shared-drives에서도 반드시 보여야 함"이라면 방안 B로 API 명세 변경 진행

## 6. 검증 체크리스트
- VN01 USER_LEVEL 계정으로 /api/v1/drive/status = configured:true
- VN01 USER_LEVEL 계정으로 /api/v1/drive/folders 에 ambCoWork 포함
- /api/v1/drive/shared-drives 빈 배열이어도 /drive 화면 폴더 노출 정상 여부 확인
- /api/v1/drive 루트는 404로 처리되는지 확인

## 7. 결론
- shared-drives 미노출의 핵심 원인은 "폴더 ID를 shared drive ID로 해석하는 현재 필터 구조"와 "API 의미 혼선"임.
- 사용자 화면 안정성 기준은 shared-drives가 아니라 folders 응답이어야 함.
- 요구사항에 따라 shared-drives 의미를 확장할지(방안 B), 현행 의미를 유지하고 folders 중심으로 운영할지(방안 A) 결정이 필요함.
