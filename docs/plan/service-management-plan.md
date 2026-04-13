# 서비스 관리 모듈 구현 작업계획서

> **작성일**: 2026-02-18
> **참조**: `reference/amoeba_service_user_management_require.md`, `docs/analysis/service-management-analysis.md`

---

## 구현 개요

| 항목 | 내용 |
|------|------|
| DB 테이블 | 7개 신규 |
| 에러 코드 | E22001~E22012 (12개) |
| 메뉴 코드 | SERVICE_MANAGEMENT |
| API 컨트롤러 | 3개 (서비스/고객/구독) |
| 프론트엔드 페이지 | 8개 (레이아웃 포함) |

---

## Step 1: 상수/타입 수정 (3 파일)

### 1-1. `error-code.constant.ts` — E22xxx 12개 추가
### 1-2. `menu-code.constant.ts` — SERVICE_MANAGEMENT 추가 + DEFAULT_PERMISSIONS
### 1-3. `domain.types.ts` — 응답 인터페이스 추가

| 인터페이스 | 설명 |
|-----------|------|
| SvcServiceResponse | 서비스 카탈로그 |
| SvcPlanResponse | 서비스 플랜 |
| SvcClientResponse | 고객사 |
| SvcClientContactResponse | 고객 담당자 |
| SvcSubscriptionResponse | 구독 |
| SvcSubscriptionHistoryResponse | 구독 이력 |
| SvcClientNoteResponse | 고객 메모 |

---

## Step 2: 백엔드 엔티티 7개 (신규)

| # | 파일 | 테이블 | prefix |
|---|------|--------|--------|
| 1 | `entity/service.entity.ts` | amb_svc_services | svc_ |
| 2 | `entity/service-plan.entity.ts` | amb_svc_plans | spl_ |
| 3 | `entity/client.entity.ts` | amb_svc_clients | cli_ |
| 4 | `entity/client-contact.entity.ts` | amb_svc_client_contacts | ctc_ |
| 5 | `entity/subscription.entity.ts` | amb_svc_subscriptions | sub_ |
| 6 | `entity/subscription-history.entity.ts` | amb_svc_subscription_history | sbh_ |
| 7 | `entity/client-note.entity.ts` | amb_svc_client_notes | cnt_ |

패턴: `PartnerEntity` 참조 — `@Entity`, `@PrimaryGeneratedColumn('uuid')`, `@DeleteDateColumn`

---

## Step 3: DTO 9개 (신규)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `dto/request/create-service.request.ts` | 서비스 등록 |
| 2 | `dto/request/update-service.request.ts` | 서비스 수정 |
| 3 | `dto/request/create-plan.request.ts` | 플랜 생성 |
| 4 | `dto/request/update-plan.request.ts` | 플랜 수정 |
| 5 | `dto/request/create-client.request.ts` | 고객사 등록 |
| 6 | `dto/request/update-client.request.ts` | 고객사 수정 |
| 7 | `dto/request/create-subscription.request.ts` | 구독 등록 |
| 8 | `dto/request/update-subscription.request.ts` | 구독 수정 |
| 9 | `dto/request/create-client-note.request.ts` | 메모 작성 |

패턴: `CreatePartnerRequest` 참조 — snake_case, class-validator

---

## Step 4: 매퍼 3개 (신규)

| # | 파일 | 대상 |
|---|------|------|
| 1 | `mapper/service.mapper.ts` | Service + Plan |
| 2 | `mapper/client.mapper.ts` | Client + Contact + Note |
| 3 | `mapper/subscription.mapper.ts` | Subscription + History |

패턴: `PartnerMapper` 참조 — static toResponse()

---

## Step 5: 서비스 3개 (신규)

| # | 파일 | 책임 |
|---|------|------|
| 1 | `service/service-catalog.service.ts` | 서비스 CRUD + 플랜 CRUD + 통계 |
| 2 | `service/client.service.ts` | 고객사 CRUD + 담당자 + 메모 + 코드 자동생성 |
| 3 | `service/subscription.service.ts` | 구독 CRUD + 상태 전이 + 이력 자동 기록 |

패턴: `PartnerService` 참조 — QueryBuilder, ERROR_CODE, EntityGuard

---

## Step 6: 컨트롤러 3개 (신규)

| # | 파일 | Base Path | 엔드포인트 수 |
|---|------|-----------|-------------|
| 1 | `controller/service-catalog.controller.ts` | /service/services | 10 |
| 2 | `controller/client.controller.ts` | /service/clients | 14 |
| 3 | `controller/subscription.controller.ts` | /service/subscriptions | 10 |

패턴: `PartnerController` 참조 — @UseGuards(EntityGuard)

---

## Step 7: 모듈 등록 (2 파일)

### 7-1. `service/service.module.ts` — 신규
### 7-2. `app.module.ts` — ServiceModule import + 7개 엔티티 등록
### 7-3. `menu-config.service.ts` — DEFAULT_MENU_CONFIGS에 SERVICE_MANAGEMENT 추가

---

## Step 8: 프론트엔드 i18n (3 파일)

| # | 파일 |
|---|------|
| 1 | `locales/en/service.json` |
| 2 | `locales/ko/service.json` |
| 3 | `locales/vi/service.json` |

+ `i18n.ts` 수정 (service 네임스페이스 등록)

---

## Step 9: 프론트엔드 API 서비스 + 훅

| # | 파일 | 설명 |
|---|------|------|
| 1 | `service/service-catalog.service.ts` | 서비스/플랜 API |
| 2 | `service/client.service.ts` | 고객 API |
| 3 | `service/subscription.service.ts` | 구독 API |
| 4 | `hooks/useServiceCatalog.ts` | 서비스 CRUD 훅 |
| 5 | `hooks/useClient.ts` | 고객 CRUD 훅 |
| 6 | `hooks/useSubscription.ts` | 구독 CRUD 훅 |

---

## Step 10: 프론트엔드 페이지 + 라우터

| # | 파일 | 라우트 |
|---|------|--------|
| 1 | `pages/ServiceLayout.tsx` | /service |
| 2 | `pages/ServiceDashboardPage.tsx` | /service/dashboard |
| 3 | `pages/ServiceListPage.tsx` | /service/services |
| 4 | `pages/ServiceDetailPage.tsx` | /service/services/:id |
| 5 | `pages/ClientListPage.tsx` | /service/clients |
| 6 | `pages/ClientDetailPage.tsx` | /service/clients/:id, /service/clients/new |
| 7 | `pages/SubscriptionListPage.tsx` | /service/subscriptions |
| 8 | `pages/SubscriptionDetailPage.tsx` | /service/subscriptions/:id |

+ `router/index.tsx` 수정 (/service/* 라우트 추가)
+ `MainLayout.tsx` — ICON_MAP에 서비스 아이콘 추가

---

## 파일 총괄

| 구분 | 신규 | 수정 | 합계 |
|------|------|------|------|
| BE 상수/타입 | 0 | 3 | 3 |
| BE 엔티티 | 7 | 0 | 7 |
| BE DTO | 9 | 0 | 9 |
| BE 매퍼 | 3 | 0 | 3 |
| BE 서비스 | 3 | 0 | 3 |
| BE 컨트롤러 | 3 | 0 | 3 |
| BE 모듈 | 1 | 2 | 3 |
| FE i18n | 3 | 1 | 4 |
| FE 서비스/훅 | 6 | 0 | 6 |
| FE 페이지 | 8 | 0 | 8 |
| FE 라우터/레이아웃 | 0 | 2 | 2 |
| **합계** | **43** | **8** | **51** |

---

## 검증

1. `npm run dev:api` → 7개 테이블 자동 생성 확인
2. `POST /service/services` → 서비스 등록 + 플랜 추가
3. `POST /service/clients` → 고객사 등록 (코드 자동생성)
4. `POST /service/subscriptions` → 구독 등록 + 이력 자동 기록
5. 구독 상태 전이 (cancel/suspend/resume/renew)
6. 프론트엔드 페이지 로딩 + CRUD 동작
7. `npm run build` 전체 빌드 성공
