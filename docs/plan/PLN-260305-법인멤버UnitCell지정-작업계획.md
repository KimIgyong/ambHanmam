# PLAN-법인멤버UnitCell지정-작업계획-20260305

## 작업 계획서

### 1단계: 백엔드 - Holding Unit 자동 생성
- `EntitySeedService.seedEntities()` 끝에 각 법인 Holding Unit 자동 생성
- `UnitService.deleteUnit()`에 Holding 삭제 방지 로직

### 2단계: 백엔드 - 초대/등록 시 Holding 자동 배정
- `InvitationService.accept()`에서 Holding Unit 자동 배정
- `AuthService.register()`에서 동일 로직

### 3단계: 백엔드 - Unit/Cell 변경 API
- `EntityMemberService`에 changeMemberUnit, addMemberCell, removeMemberCell 추가
- `EntityMemberController`에 PUT/POST/DELETE 엔드포인트 추가
- `EntitySettingsModule`에 의존성 등록

### 4단계: 프론트엔드
- `entity-settings.service.ts`에 API 메서드/타입 추가
- `useEntitySettings.ts`에 훅 추가
- `EntityMemberPage.tsx` MemberDetailModal UI 개선
- i18n 키 추가 (en/ko/vi)

### 사이드 임팩트 분석
- `usrUnit` VARCHAR 필드 유지 + Unit 변경 시 동기화 → 기존 코드 영향 없음
- Holding Unit sort_order=9999로 목록 맨 뒤 배치
- 기존 초대 플로우에 UserUnitRole 생성 추가 → 기존 초대 기능 정상 동작
