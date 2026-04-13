# 작업 완료 보고: ADMIN/USER 레벨 구분 강화 및 MASTER 역할 추가

- **작업일**: 2026-03-01
- **관련 요구사항**: `docs/analysis/REQ-ADMIN_USER레벨구분강화-MASTER역할추가-20260301.md`
- **작업 계획서**: `docs/plan/PLAN-ADMIN_USER레벨구분강화-MASTER역할추가-작업계획-20260301.md`
- **배포 상태**: 미배포 (로컬 개발 완료)

---

## 1. 구현 요약

ADMIN_LEVEL(SUPER_ADMIN, ADMIN)과 USER_LEVEL(MASTER, MANAGER, MEMBER, VIEWER) 간의 권한 체계를 강화하고, 법인(Entity) 자체 관리를 위한 **MASTER** 역할을 신규 도입하였습니다.

### 핵심 변경사항
- **MASTER 역할 신설**: USER_LEVEL 최고 등급(rank:4), 법인 내 멤버 초대/권한 설정/API Key/Drive/사용량 관리
- **Admin Module 격리**: AGENTS, SERVICE_MANAGEMENT, SITE_MANAGEMENT → ADMIN_LEVEL 전용
- **포탈 고객 브릿지**: 외부 포탈 고객 → 내부 사용자 계정 전환 API
- **AI 사용량 추적 시스템**: 건별 기록 + 일별 집계 + Quota 관리
- **Entity Settings UI**: MASTER/ADMIN 전용 법인 설정 사이드바 및 페이지

---

## 2. Phase별 구현 상세

### Phase 1: 타입 · 상수 · 유틸 기반 작업 ✅

| 파일 | 변경 내용 |
|------|----------|
| `packages/types/src/user-level.types.ts` | MASTER 역할 추가, VALID_LEVEL_ROLES 업데이트, JOIN_METHOD.PORTAL 추가 |
| `packages/types/src/permission.types.ts` | MASTER ROLE_DATA_SCOPE(OWN_ORG), 전체 MENU_PERMISSIONS에 MASTER 추가, entitySettings 메뉴 |
| `apps/api/src/global/guard/roles.guard.ts` | ROLE_HIERARCHY: MASTER:4, ADMIN:5, SUPER_ADMIN:6 |
| `apps/api/src/global/constant/menu-code.constant.ts` | ENTITY_* 5개 메뉴코드, MASTER DEFAULT_PERMISSIONS, MANAGER/MEMBER Admin Module 차단 |

### Phase 2: 데이터베이스 마이그레이션 ✅

| 파일 | 변경 내용 |
|------|----------|
| `sql/migration_master_role.sql` | 9개 섹션 단일 트랜잭션: amb_portal_user_mappings, MASTER 메뉴설정, MANAGER 접근차단, api_keys/drive_settings ent_id 추가, amb_ai_token_usage/entity_summary/entity_api_quotas 테이블 생성 |

### Phase 3: 백엔드 — 포탈 고객 조회 및 계정 전환 API ✅

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/portal-bridge/entity/portal-customer-readonly.entity.ts` | 포탈 고객 읽기 전용 엔티티 |
| `apps/api/src/domain/portal-bridge/entity/portal-user-mapping.entity.ts` | 포탈-내부 사용자 매핑 |
| `apps/api/src/domain/portal-bridge/dto/create-internal-account.request.ts` | 계정 생성 DTO |
| `apps/api/src/domain/portal-bridge/dto/portal-customer-query.request.ts` | 조회 쿼리 DTO |
| `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` | 고객 조회, 계정 생성, 매핑 관리 (5개 메서드) |
| `apps/api/src/domain/portal-bridge/controller/portal-bridge.controller.ts` | AdminOnly 5개 엔드포인트 |
| `apps/api/src/domain/portal-bridge/portal-bridge.module.ts` | 모듈 정의 |

### Phase 4: 백엔드 — MASTER 법인 설정 API ✅

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/auth/guard/own-entity.guard.ts` | ADMIN_LEVEL 바이패스, MASTER만 허용, 나머지 E1013 |
| `apps/api/src/domain/entity-settings/dto/invite-entity-member.request.ts` | 초대 DTO |
| `apps/api/src/domain/entity-settings/dto/set-entity-permission.request.ts` | 권한 설정 DTO |
| `apps/api/src/domain/entity-settings/service/entity-member.service.ts` | 멤버 관리 5개 메서드 |
| `apps/api/src/domain/entity-settings/service/entity-permission.service.ts` | 권한 관리 4개 메서드 |
| `apps/api/src/domain/entity-settings/controller/entity-member.controller.ts` | Auth+OwnEntityGuard 5개 엔드포인트 |
| `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts` | Auth+OwnEntityGuard 4개 엔드포인트 |

### Phase 5: 백엔드 — 기존 코드 수정 ✅

| 파일 | 변경 내용 |
|------|----------|
| `apps/api/src/domain/auth/decorator/auth.decorator.ts` | MasterOrAdmin 데코레이터 추가 |

### Phase 5B: 백엔드 — 법인별 API Key / Drive / AI 사용량 / Quota ✅

| 파일 | 설명 |
|------|------|
| `apps/api/src/domain/settings/entity/api-key.entity.ts` | `entId` 컬럼 + HrEntityEntity 관계 추가 |
| `apps/api/src/domain/settings/entity/drive-settings.entity.ts` | `entId` 컬럼 + HrEntityEntity 관계 추가 |
| `apps/api/src/domain/settings/service/api-key.service.ts` | `getDecryptedKey(provider, entityId?)` 법인 우선 조회, `findByEntity()`, `createForEntity()` |
| `apps/api/src/domain/ai-usage/entity/ai-token-usage.entity.ts` | 건별 사용 이력 (amb_ai_token_usage) |
| `apps/api/src/domain/ai-usage/entity/ai-token-entity-summary.entity.ts` | 법인별 일별 집계 (amb_ai_token_entity_summary) |
| `apps/api/src/domain/ai-usage/entity/entity-api-quota.entity.ts` | 법인 Quota (amb_entity_api_quotas) |
| `apps/api/src/domain/ai-usage/service/ai-usage.service.ts` | recordUsage, checkQuota 등 7개 메서드 |
| `apps/api/src/domain/ai-usage/interceptor/api-quota.interceptor.ts` | 일일/월간 한도 WARN/BLOCK |
| `apps/api/src/domain/ai-usage/ai-usage.module.ts` | 모듈 정의 |
| `apps/api/src/domain/entity-settings/controller/entity-api-key.controller.ts` | 법인 API Key CRUD 4개 엔드포인트 |
| `apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts` | 법인 Drive 설정 2개 엔드포인트 |
| `apps/api/src/domain/entity-settings/controller/entity-usage.controller.ts` | 사용량 조회 + Quota 설정 5개 엔드포인트 |
| `apps/api/src/domain/entity-settings/entity-settings.module.ts` | AiUsageModule 연결, 신규 컨트롤러 등록 |
| `apps/api/src/app.module.ts` | AiUsageModule + 3개 엔티티 등록 |

### Phase 5C: 백엔드 — Admin Module 분리 ✅

| 파일 | 변경 내용 |
|------|----------|
| `apps/api/src/global/constant/menu-code.constant.ts` | `MENU_CATEGORY`, `ADMIN_MODULE_CODES` 상수 추가 |
| `apps/api/src/domain/settings/service/menu-permission.service.ts` | USER_LEVEL에서 ADMIN_MODULE_CODES 자동 필터 (이중 검증) |

### Phase 6: 프론트엔드 — 타입 및 Store 업데이트 ✅

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/domain/auth/store/auth.store.ts` | `isMaster()`, `isMasterOrAdmin()` 헬퍼 메서드 |
| `apps/web/src/locales/en/settings.json` | MASTER: "Master" |
| `apps/web/src/locales/ko/settings.json` | MASTER: "마스터" |
| `apps/web/src/locales/vi/settings.json` | MASTER: "Quản lý pháp nhân" |
| `apps/web/src/locales/en/entitySettings.json` | 신규 번역 파일 (EN) |
| `apps/web/src/locales/ko/entitySettings.json` | 신규 번역 파일 (KO) |
| `apps/web/src/locales/vi/entitySettings.json` | 신규 번역 파일 (VI) |
| `apps/web/src/i18n.ts` | entitySettings 네임스페이스 등록 |

### Phase 7: 프론트엔드 — 가드 및 라우팅 업데이트 ✅

| 파일 | 설명 |
|------|------|
| `apps/web/src/components/common/EntitySettingsGuard.tsx` | MASTER/ADMIN 접근 가드 |
| `apps/web/src/router/index.tsx` | entity-settings 6개 + portal-bridge 1개 라우트 추가 |
| `apps/web/src/layouts/MainLayout.tsx` | Entity Settings 사이드바 메뉴, ENTITY_ 메뉴 메인 사이드바 필터링 |

### Phase 8: 프론트엔드 — ADMIN 포탈 고객 관리 페이지 ✅

| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx` | 포탈 고객 관리 페이지 (검색/필터 UI) |

### Phase 9-11: 프론트엔드 — Entity Settings / Admin Module 사이드바 ✅

| 파일 | 설명 |
|------|------|
| `apps/web/src/domain/entity-settings/pages/EntitySettingsPage.tsx` | 법인 설정 대시보드 (카드 네비게이션) |

---

## 3. 변경 파일 전체 목록

### 수정 파일 (17개)
| # | 파일 경로 |
|---|----------|
| 1 | `packages/types/src/user-level.types.ts` |
| 2 | `packages/types/src/permission.types.ts` |
| 3 | `apps/api/src/global/guard/roles.guard.ts` |
| 4 | `apps/api/src/global/constant/menu-code.constant.ts` |
| 5 | `apps/api/src/domain/auth/decorator/auth.decorator.ts` |
| 6 | `apps/api/src/domain/settings/entity/api-key.entity.ts` |
| 7 | `apps/api/src/domain/settings/entity/drive-settings.entity.ts` |
| 8 | `apps/api/src/domain/settings/service/api-key.service.ts` |
| 9 | `apps/api/src/domain/settings/service/menu-permission.service.ts` |
| 10 | `apps/api/src/app.module.ts` |
| 11 | `apps/web/src/domain/auth/store/auth.store.ts` |
| 12 | `apps/web/src/i18n.ts` |
| 13 | `apps/web/src/layouts/MainLayout.tsx` |
| 14 | `apps/web/src/router/index.tsx` |
| 15 | `apps/web/src/locales/en/settings.json` |
| 16 | `apps/web/src/locales/ko/settings.json` |
| 17 | `apps/web/src/locales/vi/settings.json` |

### 신규 파일 (33개)
| # | 파일 경로 |
|---|----------|
| 1 | `sql/migration_master_role.sql` |
| 2 | `apps/api/src/domain/portal-bridge/entity/portal-customer-readonly.entity.ts` |
| 3 | `apps/api/src/domain/portal-bridge/entity/portal-user-mapping.entity.ts` |
| 4 | `apps/api/src/domain/portal-bridge/dto/create-internal-account.request.ts` |
| 5 | `apps/api/src/domain/portal-bridge/dto/portal-customer-query.request.ts` |
| 6 | `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` |
| 7 | `apps/api/src/domain/portal-bridge/controller/portal-bridge.controller.ts` |
| 8 | `apps/api/src/domain/portal-bridge/portal-bridge.module.ts` |
| 9 | `apps/api/src/domain/auth/guard/own-entity.guard.ts` |
| 10 | `apps/api/src/domain/entity-settings/dto/invite-entity-member.request.ts` |
| 11 | `apps/api/src/domain/entity-settings/dto/set-entity-permission.request.ts` |
| 12 | `apps/api/src/domain/entity-settings/service/entity-member.service.ts` |
| 13 | `apps/api/src/domain/entity-settings/service/entity-permission.service.ts` |
| 14 | `apps/api/src/domain/entity-settings/controller/entity-member.controller.ts` |
| 15 | `apps/api/src/domain/entity-settings/controller/entity-permission.controller.ts` |
| 16 | `apps/api/src/domain/entity-settings/controller/entity-api-key.controller.ts` |
| 17 | `apps/api/src/domain/entity-settings/controller/entity-drive.controller.ts` |
| 18 | `apps/api/src/domain/entity-settings/controller/entity-usage.controller.ts` |
| 19 | `apps/api/src/domain/entity-settings/entity-settings.module.ts` |
| 20 | `apps/api/src/domain/ai-usage/entity/ai-token-usage.entity.ts` |
| 21 | `apps/api/src/domain/ai-usage/entity/ai-token-entity-summary.entity.ts` |
| 22 | `apps/api/src/domain/ai-usage/entity/entity-api-quota.entity.ts` |
| 23 | `apps/api/src/domain/ai-usage/service/ai-usage.service.ts` |
| 24 | `apps/api/src/domain/ai-usage/interceptor/api-quota.interceptor.ts` |
| 25 | `apps/api/src/domain/ai-usage/ai-usage.module.ts` |
| 26 | `apps/web/src/components/common/EntitySettingsGuard.tsx` |
| 27 | `apps/web/src/domain/entity-settings/pages/EntitySettingsPage.tsx` |
| 28 | `apps/web/src/domain/portal-bridge/pages/PortalCustomerPage.tsx` |
| 29 | `apps/web/src/locales/en/entitySettings.json` |
| 30 | `apps/web/src/locales/ko/entitySettings.json` |
| 31 | `apps/web/src/locales/vi/entitySettings.json` |
| 32 | `docs/analysis/REQ-ADMIN_USER레벨구분강화-MASTER역할추가-20260301.md` |
| 33 | `docs/plan/PLAN-ADMIN_USER레벨구분강화-MASTER역할추가-작업계획-20260301.md` |

---

## 4. API 엔드포인트 요약

### Portal Bridge (AdminOnly)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/portal-bridge/customers` | 포탈 고객 목록 |
| GET | `/api/v1/portal-bridge/customers/:pctId` | 포탈 고객 상세 |
| POST | `/api/v1/portal-bridge/customers/:pctId/create-account` | 내부 계정 생성 |
| GET | `/api/v1/portal-bridge/mappings` | 매핑 목록 |
| PATCH | `/api/v1/portal-bridge/mappings/:pumId/revoke` | 매핑 해제 |

### Entity Settings (Auth + OwnEntityGuard)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/entity-settings/members` | 법인 멤버 목록 |
| POST | `/api/v1/entity-settings/members/invite` | 멤버 초대 |
| GET | `/api/v1/entity-settings/invitations` | 초대 목록 |
| PATCH | `/api/v1/entity-settings/invitations/:id/cancel` | 초대 취소 |
| POST | `/api/v1/entity-settings/invitations/:id/resend` | 초대 재발송 |
| GET | `/api/v1/entity-settings/permissions/available-menus` | 설정 가능 메뉴 |
| GET | `/api/v1/entity-settings/permissions/users/:userId` | 사용자 권한 |
| PUT | `/api/v1/entity-settings/permissions/users/:userId` | 권한 설정 |
| DELETE | `/api/v1/entity-settings/permissions/users/:userId/:menuCode` | 권한 삭제 |
| GET | `/api/v1/entity-settings/api-keys` | 법인 API Key 목록 |
| POST | `/api/v1/entity-settings/api-keys` | 법인 API Key 등록 |
| PATCH | `/api/v1/entity-settings/api-keys/:id` | API Key 수정 |
| DELETE | `/api/v1/entity-settings/api-keys/:id` | API Key 삭제 |
| GET | `/api/v1/entity-settings/drive` | Drive 설정 조회 |
| PUT | `/api/v1/entity-settings/drive` | Drive 설정 저장 |
| GET | `/api/v1/entity-settings/usage` | 사용량 요약 |
| GET | `/api/v1/entity-settings/usage/monthly` | 월간 사용량 |
| GET | `/api/v1/entity-settings/usage/users` | 사용자별 사용량 |
| GET | `/api/v1/entity-settings/quota` | Quota 조회 |
| PUT | `/api/v1/entity-settings/quota` | Quota 설정 (AdminOnly) |

---

## 5. 타입 검증 결과

| 대상 | 결과 |
|------|------|
| `packages/types` (tsc --noEmit) | 에러 0개 |
| `apps/api` (신규 파일) | 에러 0개 |
| `apps/web` (tsc --noEmit) | 에러 0개 |

> 참고: apps/api 전체에는 기존 모듈(acl, billing 등)의 사전 존재 타입 에러가 있으나 이번 작업과 무관

---

## 6. 배포 전 필요 작업

1. **DB 마이그레이션 실행**: `sql/migration_master_role.sql` 을 스테이징 DB에서 실행
2. **5B-5 사용량 기록 연동**: base-agent.service.ts 등 AI 호출점에 recordUsage 호출 추가 (점진적 적용 가능)
3. **통합 테스트**: 포탈 고객 API, MASTER 초대 플로우, Quota 초과 시나리오
4. **프론트엔드 세부 페이지**: EntityMemberPage, EntityPermissionPage 등 상세 UI 구현

---

## 7. 미해결 항목

| # | 항목 | 우선순위 | 설명 |
|---|------|---------|------|
| 1 | AI 사용량 기록 연동 (5B-5) | 중 | BaseAgentService가 abstract이므로 하위 클래스 전체 수정 필요. 점진적 적용 권장 |
| 2 | Entity Settings 세부 페이지 | 중 | EntityMemberPage, EntityPermissionPage 본격 구현 (현재 placeholder) |
| 3 | PortalCustomerPage 상세 UI | 중 | API 연동 + 계정 생성 모달 구현 |
| 4 | ClaudeService 법인별 키 해석 | 낮 | ensureClient()에 entityId 파라미터 추가 (현재 서비스 레벨에서 처리) |
