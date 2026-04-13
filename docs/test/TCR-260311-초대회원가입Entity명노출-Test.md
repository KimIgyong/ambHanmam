# 테스트 케이스 - 초대 회원가입 화면 Entity명 노출

- 문서번호: TC-초대회원가입Entity명노출-Test-20260311
- 작성일: 2026-03-11

## 1. 단위 테스트 관점

### TC-01 validateToken 응답 Entity명 포함
- 사전조건: `inv_company_id`가 있는 PENDING 초대 토큰 존재
- 입력: `GET /api/v1/invitations/validate/{token}`
- 기대결과:
  - `success=true`
  - `data.entityName` 값 존재

### TC-02 validateToken 응답 호환성 유지
- 사전조건: 유효한 초대 토큰 존재
- 입력: 동일
- 기대결과:
  - 기존 필드(`email`, `role`, `unit` 등) 유지

## 2. 통합 테스트 시나리오

### TC-11 초대 회원가입 화면 Entity명 표시
- 사전조건: 스테이징 초대 링크 존재
- 절차:
  1. `/register?invitation_token=...` 접속
  2. 화면 로딩 완료 대기
- 기대결과:
  - 상단 정보 박스에 "초대된 법인" 라벨과 법인명 노출

### TC-12 법인 없는 초대 처리
- 사전조건: `companyId` 없는 토큰
- 절차: 동일
- 기대결과:
  - Entity 정보 박스 비노출
  - 기존 가입 플로우 정상

## 3. 엣지 케이스

### TC-21 만료/취소 토큰
- 기대결과: 기존 에러 메시지 노출, Entity 박스 미노출

### TC-22 엔티티명 null
- 기대결과: Entity 박스 미노출, 폼 정상 동작
