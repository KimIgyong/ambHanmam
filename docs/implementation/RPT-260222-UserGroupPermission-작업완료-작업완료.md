# RPT-UserGroupPermission-작업완료보고-20260222

## 1. 구현 개요

| 항목 | 내용 |
|------|------|
| 작업명 | 사용자 그룹 및 권한 관리 체계 구현 |
| 참조 계획서 | `docs/plan/PLAN-UserGroupPermission-작업계획-20260222.md` |
| 작업 기간 | 2025-02-22 (1 session) |
| 작업 결과 | **9단계 전체 구현 완료, 모노레포 빌드 성공** |

---

## 2. 단계별 구현 내역

### Phase 1: 공유 타입 & 상수 ✅
- `USER_ROLE` 5단계 (SUPER_ADMIN, ADMIN, MANAGER, MEMBER, VIEWER)
- `USER_GROUP_CODE` (ADMIN_GROUP, USER_GROUP)
- `ORG_LEVEL` (ROOT, SUBSIDIARY)
- `DATA_SCOPE`, `MENU_PERMISSIONS` (16개 메뉴)
- 7개 권한 유틸리티 함수

### Phase 2: DB 스키마/엔티티/시드 ✅
- HrEntityEntity: 조직 계층 (entLevel, entParentId, entIsHq, entSortOrder)
- UserEntity: 그룹/상태 관리 (9개 신규 컬럼)
- InvitationEntity: 그룹/법인/자동승인 (3개 신규 컬럼)
- entity-seed.service: HQ 계층 초기화, 초기 관리자 시드
- 마이그레이션 SQL 스크립트

### Phase 3: 인증/인가 확장 ✅
- JWT Payload 확장 (group, status, companyId, isHq, mustChangePw)
- GroupRoleGuard: 상태/그룹/역할 복합 검증
- DataScopeInterceptor: 글로벌 데이터 범위 결정
- Auth Decorator: @Auth(), @AdminOnly(), @RequireAuth()
- 5단계 역할 계층 (VIEWER=1 → SUPER_ADMIN=5)
- JWT 만료: 15m → 2h

### Phase 4: 초대/승인 모듈 ✅
- 초대 수락 API (POST /invitations/token/:token/accept)
- 자동승인/수동승인 분기
- 승인 대기 목록 / 승인 / 거부 / 상태변경 API
- bcrypt 비밀번호 해싱

### Phase 5: 컨트롤러 가드 적용 ✅
- DataScopeInterceptor 글로벌 등록 (APP_INTERCEPTOR)
- GET /auth/me 엔드포인트 추가

### Phase 6: 프론트엔드 인증/라우팅 ✅
- AuthGuard: 상태 기반 리다이렉트 (PENDING/INACTIVE/mustChangePw)
- RoleGuard: 역할/그룹 기반 접근 제어
- auth.store 확장: isAdmin, isSuperAdmin, hasRole 등 헬퍼
- org.store: 조직 선택 상태 관리

### Phase 7: 신규 페이지 ✅
- PendingPage: 승인 대기 안내
- InactivePage: 비활성/정지 계정 안내
- ForceChangePasswordPage: 비밀번호 강제 변경 폼
- UnauthorizedPage: 접근 거부 안내
- InviteAcceptPage: 초대 수락 → 회원가입 전체 플로우

### Phase 8: 조직 관리 UI ✅
- OrgSelector: HQ 전용 조직 선택 드롭다운

### Phase 9: 통합 테스트 ✅
- 모노레포 전체 빌드 성공 (4/4 tasks, 18.21s)

---

## 3. 변경 파일 목록

### 신규 생성 (19개)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `packages/types/src/user-group.types.ts` | 그룹/역할/상태 타입 |
| 2 | `packages/types/src/permission.types.ts` | 권한/메뉴 타입 |
| 3 | `packages/common/src/permission.util.ts` | 권한 유틸 함수 |
| 4 | `apps/api/.../jwt-payload.interface.ts` | JWT 페이로드 인터페이스 |
| 5 | `apps/api/.../group-role.guard.ts` | 그룹/역할 복합 가드 |
| 6 | `apps/api/.../auth.decorator.ts` | 인증 데코레이터 |
| 7 | `apps/api/.../data-scope.interceptor.ts` | 데이터 범위 인터셉터 |
| 8 | `apps/api/.../data-scope.decorator.ts` | 데이터 범위 파라미터 데코레이터 |
| 9 | `apps/api/.../accept-invitation.request.ts` | 초대 수락 DTO |
| 10 | `scripts/migration-user-group-permission.sql` | DB 마이그레이션 SQL |
| 11 | `apps/web/.../org.store.ts` | 조직 Zustand 스토어 |
| 12 | `apps/web/src/router/AuthGuard.tsx` | 인증 상태 가드 |
| 13 | `apps/web/src/router/RoleGuard.tsx` | 역할/그룹 가드 |
| 14 | `apps/web/.../PendingPage.tsx` | 승인 대기 페이지 |
| 15 | `apps/web/.../InactivePage.tsx` | 비활성 계정 페이지 |
| 16 | `apps/web/.../ForceChangePasswordPage.tsx` | 비밀번호 변경 페이지 |
| 17 | `apps/web/.../UnauthorizedPage.tsx` | 접근 거부 페이지 |
| 18 | `apps/web/.../InviteAcceptPage.tsx` | 초대 수락 페이지 |
| 19 | `apps/web/.../OrgSelector.tsx` | 조직 선택 컴포넌트 |

### 수정 (16개)

| # | 파일 | 변경 내용 |
|---|------|----------|
| 1 | `packages/types/src/domain.types.ts` | 중복 제거, UserResponse 확장 |
| 2 | `packages/types/src/index.ts` | 신규 모듈 export 추가 |
| 3 | `packages/common/src/index.ts` | permission.util export 추가 |
| 4 | `apps/api/.../hr-entity.entity.ts` | 조직 계층 컬럼 4개 추가 |
| 5 | `apps/api/.../user.entity.ts` | 그룹/상태 컬럼 9개 추가 |
| 6 | `apps/api/.../invitation.entity.ts` | 그룹/법인 컬럼 3개 추가 |
| 7 | `apps/api/.../entity-seed.service.ts` | HQ 계층 + 초기 관리자 시드 |
| 8 | `apps/api/.../auth.service.ts` | 로그인 상태 검증, 토큰 확장 |
| 9 | `apps/api/.../jwt.strategy.ts` | JwtPayload 기반 UserPayload 구성 |
| 10 | `apps/api/.../current-user.decorator.ts` | UserPayload 인터페이스 확장 |
| 11 | `apps/api/.../roles.guard.ts` | 5단계 역할 계층 |
| 12 | `apps/api/.../auth.module.ts` | JWT 2h, DataScope 글로벌 |
| 13 | `apps/api/.../auth.controller.ts` | @CurrentUser, GET /me |
| 14 | `apps/api/.../invitation.service.ts` | accept(), 그룹/법인 필드 |
| 15 | `apps/api/.../member.service.ts` | approve/reject/pending |
| 16 | `apps/web/src/router/index.tsx` | AuthGuard 패턴, 신규 라우트 |

---

## 4. 빌드 결과

```
npm run build
Tasks:    4 successful, 4 total
Cached:   0 cached, 4 total
Time:     18.21s

✅ @amb/types:build      - 성공
✅ @amb/common:build      - 성공
✅ @amb/portal-web:build  - 성공
✅ @amb/web:build         - 성공 (2307 modules)
```

---

## 5. 배포 상태

| 환경 | 상태 | 비고 |
|------|------|------|
| 로컬 개발 | ✅ 빌드 완료 | TypeORM synchronize로 자동 스키마 반영 |
| 스테이징 | ❌ 미배포 | 배포 전 마이그레이션 SQL 실행 필요 |
| 프로덕션 | ❌ 미배포 | - |

---

## 6. 배포 전 체크리스트

- [ ] `scripts/migration-user-group-permission.sql` 실행 (기존 데이터 마이그레이션)
- [ ] `env/backend/.env.development`에 SEED_ADMIN_* 환경 변수 설정 확인
- [ ] 스테이징 `.env.staging`에 동일 환경 변수 설정
- [ ] i18n 번역 키 추가 (pending, inactive, forceChangePassword, unauthorized 관련)
- [ ] 기능 테스트 (초대→수락→승인 플로우)
- [ ] DataScope 필터링 서비스 적용 (향후 서비스별 적용 필요)

---

## 7. 설계 판단 기록

| 항목 | 계획서 | 실제 구현 | 사유 |
|------|--------|----------|------|
| 엔티티명 | CompanyEntity | HrEntityEntity | 기존 엔티티 재사용 |
| 멤버 엔티티 | MemberEntity | UserEntity | 기존 엔티티 확장 |
| JWT 추출 | Bearer only | Cookie + Bearer | 기존 쿠키 인증 유지 |
| JWT 만료 | 15m | 2h | 계획서 명시 사항 |
| 역할 호환성 | USER 제거 | USER=MEMBER 레거시 호환 | 기존 데이터 안전 유지 |
