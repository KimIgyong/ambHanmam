# 작업 계획서 - 초대 회원가입 화면 Entity명 노출

- 문서번호: PLAN-초대회원가입Entity명노출-작업계획-20260311
- 작성일: 2026-03-11
- 기반 분석서: `docs/analysis/REQ-초대회원가입Entity명노출-20260311.md`

## 1. 구현 목표

- 회원가입 초대 화면에서 대상 Entity명을 명확히 표시
- API/타입/UI를 일관되게 확장

## 2. 단계별 구현 계획

### Phase 1. Backend 응답 확장
- 파일: `apps/api/src/domain/invitation/service/invitation.service.ts`
- 작업:
  - `validateToken()`에서 `invCompanyId` 기반으로 법인 조회
  - 응답에 `entityName` 추가
  - 기존 호환을 위해 기존 필드 유지

### Phase 2. 공유 타입 업데이트
- 파일: `packages/types/src/domain.types.ts`
- 작업:
  - `InvitationValidationResponse`에 `entityName` 등 확장 필드 추가

### Phase 3. Frontend UI 반영
- 파일: `apps/web/src/domain/auth/pages/RegisterPage.tsx`
- 작업:
  - invitation 데이터에 `entityName` 저장
  - `entityName` 존재 시 폼 상단 노출 박스 표시
  - unit 매핑 호환 강화(`unit || department`)

### Phase 4. i18n 키 추가
- 파일:
  - `apps/web/src/locales/ko/auth.json`
  - `apps/web/src/locales/en/auth.json`
  - `apps/web/src/locales/vi/auth.json`
- 작업:
  - `auth.invitedEntityLabel` 추가

### Phase 5. 검증
- 웹 빌드 또는 타입체크 수행
- 토큰 URL 진입 시 Entity명 노출 확인
