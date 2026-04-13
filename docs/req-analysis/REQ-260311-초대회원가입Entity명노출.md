# 요구사항 분석서 - 초대 회원가입 화면 Entity명 노출

- 문서번호: REQ-초대회원가입Entity명노출-20260311
- 작성일: 2026-03-11
- 요청 배경: 초대 링크를 통해 회원가입하는 사용자가 어떤 법인(Entity)에 등록되는지 화면에서 인지하기 어려움

## 1. AS-IS

- 경로: `/register?invitation_token={token}`
- `RegisterPage`에서 토큰 검증 API(`/api/v1/invitations/validate/:token`)를 호출해 이메일/권한/부서 정보를 로딩
- 현재 UI는 이메일/부서 중심이며 초대 대상 Entity명은 표시하지 않음
- 백엔드 validate 응답에도 Entity명 필드가 없어 프론트 단독으로 표시가 어려움

## 2. TO-BE

- 초대 회원가입 화면에서 초대 대상 Entity명을 명확히 노출
- 토큰 검증 응답에 `entityName` 필드 제공
- 프론트는 `entityName` 존재 시 폼 상단에 강조 박스로 표시

## 3. 갭 분석

- 데이터 갭: validate 응답에 Entity명 부재
- UI 갭: 사용자가 소속 대상 법인을 시각적으로 확인할 컴포넌트 부재
- i18n 갭: Entity 노출 라벨 번역 키 부재

## 4. 사용자 플로우

1. 초대 링크 접속
2. 토큰 검증 성공
3. 화면 상단에서 "초대된 법인" 확인
4. 이름/비밀번호 입력 후 가입

## 5. 기술 제약 및 고려사항

- 기존 API 호환성을 위해 validate 응답 기존 필드 유지
- 법인 없는 초대(`companyId = null`)는 Entity 박스 미표시
- i18n 규칙 준수: UI 문자열 하드코딩 금지, 번역 키 사용
