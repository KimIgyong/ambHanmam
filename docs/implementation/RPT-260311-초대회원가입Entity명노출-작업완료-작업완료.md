# 작업 완료 보고 - 초대 회원가입 화면 Entity명 노출

- 문서번호: RPT-초대회원가입Entity명노출-작업완료보고-20260311
- 작성일: 2026-03-11
- 관련 분석서: `docs/analysis/REQ-초대회원가입Entity명노출-20260311.md`
- 관련 계획서: `docs/plan/PLAN-초대회원가입Entity명노출-작업계획-20260311.md`

## 1. 구현 요약

초대 링크 기반 회원가입 화면에서 사용자가 등록 대상 법인(Entity)을 명확히 인지할 수 있도록, 토큰 검증 응답에 `entityName`을 추가하고 화면 상단에 노출 UI를 반영했다.

## 2. 변경 파일

### Backend
- `apps/api/src/domain/invitation/service/invitation.service.ts`
  - `validateToken()` 응답에 `entityName` 추가
  - 기존 호환을 위해 `unit` 필드도 유지

### Shared Types
- `packages/types/src/domain.types.ts`
  - `InvitationValidationResponse` 확장 (`entityName` 포함)

### Frontend
- `apps/web/src/domain/auth/pages/RegisterPage.tsx`
  - invitation 데이터에 `entityName` 저장
  - 폼 상단에 Entity 정보 박스 렌더링
  - unit 매핑 보강 (`unit || department`)

### i18n
- `apps/web/src/locales/ko/auth.json`
- `apps/web/src/locales/en/auth.json`
- `apps/web/src/locales/vi/auth.json`
  - `auth.invitedEntityLabel` 추가

## 3. 기대 효과

- 초대 수신자는 가입 전 본인의 가입 대상 Entity를 즉시 확인 가능
- 잘못된 법인 가입 혼선을 예방
- 기존 초대/가입 플로우와 API 호환성 유지

## 4. 검증

- 빌드 검증:
  - 명령: `npm run -w @amb/web build`
  - 결과: 성공 (TypeScript/Vite 빌드 통과)
- 정적 에러 확인:
  - 대상: `RegisterPage.tsx`, `invitation.service.ts`, `domain.types.ts`
  - 결과: 에러 없음
- 기능 확인 포인트:
  - `/register?invitation_token=...` 진입 시 `entityName` 존재하면 상단 정보 박스 노출
  - `entityName` 없으면 정보 박스 미노출
