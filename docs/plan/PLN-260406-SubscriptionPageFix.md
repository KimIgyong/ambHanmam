# PLAN-SubscriptionPageFix-작업계획-20260406
# 구독 설정 페이지 가격플랜 탭 추가 및 데이터 초기화 — 작업계획서

## 1. 시스템 개발 현황 분석

### 현재 구현 상태

| 영역 | 상태 | 파일 |
|------|------|------|
| SubscriptionPage 탭 구조 | ✅ 3탭 (Plan/Tokens/Storage) | `apps/web/src/domain/subscription/pages/SubscriptionPage.tsx` |
| PlanSection | ✅ 구독 현황 표시 + 업그레이드 버튼 | `apps/web/src/domain/subscription/components/PlanSection.tsx` |
| TokenSection | ✅ 토큰 잔액 표시 + 구매 | `apps/web/src/domain/subscription/components/TokenSection.tsx` |
| StorageSection | ✅ 스토리지 현황 + 구매 | `apps/web/src/domain/subscription/components/StorageSection.tsx` |
| 구독 API | ✅ CRUD + checkout | `apps/api/src/domain/subscription/controller/subscription.controller.ts` |
| `GET /plans` | ✅ 존재, ❌ `@Public()` 누락 | 위 컨트롤러 L45-50 |
| `createFreeSubscription()` | ✅ 존재, ❌ 자동 호출 없음 | `apps/api/src/domain/subscription/service/subscription.service.ts` |
| 구독 시드 데이터 | ✅ 3개 플랜 시드 완료 | `sql/002-seed-plans.sql` |
| 구독 레코드 | ❌ 0건 (모든 법인) | DB 확인 완료 |
| useSubscription 훅 | ✅ 완전 구현 | `apps/web/src/domain/subscription/hooks/useSubscription.ts` |
| subscription.service(FE) | ✅ API 클라이언트 완비 | `apps/web/src/domain/subscription/service/subscription.service.ts` |
| i18n (subscription ns) | ✅ ko/en/vi 등록됨 | `apps/web/src/locales/{ko,en,vi}/subscription.json` |
| 결제 방식 선택 모달 | ❌ 없음 | — |
| 가격플랜 탭 | ❌ 없음 | — |

---

## 2. 단계별 구현 계획

### Phase 1: 백엔드 수정 (자동 FREE 생성 + `@Public()`)

**목표**: 구독 조회 시 없으면 자동으로 FREE 구독을 생성하고, 플랜 목록 API를 공개한다.

#### 1-1. `GET /subscriptions` — 자동 FREE 구독 생성

**변경 파일**: `apps/api/src/domain/subscription/controller/subscription.controller.ts`

```typescript
// AS-IS
const subscription = await this.subscriptionService.getSubscription(entityId);
if (!subscription) {
  return { success: true, data: null };
}

// TO-BE
let subscription = await this.subscriptionService.getSubscription(entityId);
if (!subscription) {
  subscription = await this.subscriptionService.createFreeSubscription(entityId);
}
```

**사이드 임팩트**:
- 첫 호출 시 DB 트랜잭션 발생 (구독 + 스토리지 + 토큰 3건 INSERT)
- UNIQUE(ent_id) 제약으로 동시 요청 시 한 건만 성공, 다른 건은 기존 구독 조회로 fallback
- 기존 PlanSection의 `!subscription` 분기가 더 이상 발생하지 않음

#### 1-2. `GET /subscriptions/plans` — `@Public()` 추가

**변경 파일**: `apps/api/src/domain/subscription/controller/subscription.controller.ts`

```typescript
@Get('plans')
@Public()  // 추가
@ApiOperation({ summary: '활성 플랜 목록 조회' })
async getPlans() { ... }
```

---

### Phase 2: 프론트엔드 — 가격플랜(Pricing) 탭 추가

**목표**: 4탭 구조에 Pricing 탭을 첫 번째로 추가하고, 플랜 비교 카드를 표시한다.

#### 2-1. PricingSection 컴포넌트 신규

**신규 파일**: `apps/web/src/domain/subscription/components/PricingSection.tsx`

| 섹션 | 내용 |
|------|------|
| 플랜 카드 (3열) | FREE / BASIC / PREMIUM 가로 나열 |
| 현재 플랜 뱃지 | 사용 중인 플랜에 "Current Plan" 뱃지 표시 |
| 플랜 상세 | 가격, 토큰(1회+월), 스토리지, 최대 사용자 |
| 업그레이드 CTA | FREE→BASIC 업그레이드 버튼 |
| 데이터 소스 | `GET /api/v1/subscriptions/plans` (React Query) |

#### 2-2. SubscriptionPage 탭 구조 수정

**변경 파일**: `apps/web/src/domain/subscription/pages/SubscriptionPage.tsx`

```typescript
// AS-IS: 3탭
const tabs = [
  { key: 'plan', ...},
  { key: 'tokens', ...},
  { key: 'storage', ...},
];

// TO-BE: 4탭 (Pricing 최상단)
const tabs = [
  { key: 'pricing', label: t('subscription:pricing.title'), icon: Tag },
  { key: 'plan', ...},
  { key: 'tokens', ...},
  { key: 'storage', ...},
];
```

기본 active 탭: `'pricing'`

#### 2-3. usePlans 훅 + API 클라이언트 확장

**변경 파일**:
- `apps/web/src/domain/subscription/hooks/useSubscription.ts` — `usePlans()` 훅 추가
- `apps/web/src/domain/subscription/service/subscription.service.ts` — `getPlans()` 메서드 추가

```typescript
// hooks
export const usePlans = () =>
  useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: subscriptionService.getPlans,
    staleTime: 1000 * 60 * 10,
  });

// service
getPlans: () =>
  apiClient
    .get<{ success: boolean; data: PlanData[] }>('/subscriptions/plans')
    .then((r) => r.data.data),
```

---

### Phase 3: 결제 방식 선택 모달

**목표**: 업그레이드 버튼 클릭 시 PG 선택 모달을 표시한다.

#### 3-1. PaymentMethodModal 컴포넌트

**신규 파일**: `apps/web/src/domain/subscription/components/PaymentMethodModal.tsx`

| 항목 | 내용 |
|------|------|
| 트리거 | PricingSection/PlanSection의 "Upgrade" 버튼 |
| 레이아웃 | 모달 다이얼로그 (backdrop + centered) |
| 옵션 3개 | Polar ✅ 활성 / 토스페이먼츠 🔒 준비 중 / MegaPay 🔒 준비 중 |
| Polar 선택 | 기존 checkout 흐름 (새 탭에서 Polar 결제) |
| Toss/MegaPay | 비활성 + "Coming Soon" 라벨 |
| 닫기 | X 버튼 또는 backdrop 클릭 |

#### 3-2. PricingSection/PlanSection에 모달 연동

**변경 파일**:
- `apps/web/src/domain/subscription/components/PricingSection.tsx` — 업그레이드 버튼 → 모달 열기
- `apps/web/src/domain/subscription/components/PlanSection.tsx` — 업그레이드 버튼 → 모달 열기

---

### Phase 4: i18n 키 추가

**변경 파일**: `apps/web/src/locales/{ko,en,vi}/subscription.json`

추가 키:

```json
{
  "pricing": {
    "title": "Pricing Plans",
    "currentPlan": "Current Plan", 
    "upgradeBtn": "Upgrade to {plan}",
    "freeTier": "Free forever",
    "perUserMonth": "per user/month",
    "features": "Features",
    "tokenOnetime": "One-time Tokens",
    "tokenMonthly": "Monthly Tokens/User",
    "storageBase": "Base Storage",
    "storageMax": "Max Storage",
    "maxUsers": "Max Users",
    "comingSoon": "Coming Soon"
  },
  "payment": {
    "selectMethod": "Select Payment Method",
    "polar": "Polar (Credit Card / PayPal)",
    "polarDesc": "Global payment gateway",
    "toss": "Toss Payments",
    "tossDesc": "Korean payment gateway (Card / Bank Transfer)",
    "megapay": "MegaPay (VNPAY)",
    "megapayDesc": "Vietnamese payment gateway (QR / ATM / E-Wallet)",
    "proceed": "Proceed to Payment",
    "comingSoon": "Coming Soon"
  }
}
```

---

### Phase 5: 기존 법인 FREE 구독 데이터 일괄 생성

**목표**: 스테이징/프로덕션 DB에 모든 기존 법인에 FREE 구독 레코드를 생성한다.

#### 5-1. 마이그레이션 SQL

**신규 파일**: `sql/004-seed-free-subscriptions.sql`

```sql
-- 기존 법인에 FREE 구독 일괄 생성
-- 실행 전 amb_sub_plans에 FREE 플랜이 있어야 함

WITH free_plan AS (
  SELECT pln_id, pln_storage_base_gb, pln_storage_max_gb, pln_token_onetime, pln_free_user_count
  FROM amb_sub_plans WHERE pln_code = 'FREE' AND pln_is_active = true LIMIT 1
),
entities AS (
  SELECT DISTINCT usr_company_id AS ent_id
  FROM amb_users
  WHERE usr_deleted_at IS NULL
    AND usr_company_id IS NOT NULL
    AND usr_company_id NOT IN (SELECT ent_id FROM amb_sub_subscriptions)
),
inserted_subs AS (
  INSERT INTO amb_sub_subscriptions (sbn_id, ent_id, pln_id, sbn_status, sbn_billing_cycle, sbn_user_count, sbn_paid_user_count)
  SELECT gen_random_uuid(), e.ent_id, fp.pln_id, 'ACTIVE', 'MONTHLY', fp.pln_free_user_count, 0
  FROM entities e, free_plan fp
  RETURNING sbn_id, ent_id
),
inserted_quotas AS (
  INSERT INTO amb_sub_storage_quotas (sqt_id, ent_id, sbn_id, sqt_base_gb, sqt_max_gb)
  SELECT gen_random_uuid(), s.ent_id, s.sbn_id, fp.pln_storage_base_gb, fp.pln_storage_max_gb
  FROM inserted_subs s, free_plan fp
  RETURNING ent_id, sbn_id
)
INSERT INTO amb_sub_token_wallets (tkw_id, ent_id, sbn_id, tkw_token_type, tkw_balance, tkw_lifetime_granted)
SELECT gen_random_uuid(), s.ent_id, s.sbn_id, 'BASE', fp.pln_token_onetime, fp.pln_token_onetime
FROM inserted_subs s, free_plan fp;
```

#### 5-2. 실행 방법

```bash
# 스테이징
ssh amb-staging "docker exec -i amb-postgres-staging psql -U amb_user -d db_amb" < sql/004-seed-free-subscriptions.sql

# 프로덕션 (스테이징 검증 후)
ssh amoeba-shop "docker exec -i amb-postgres-production psql -U amb_user -d db_amb" < sql/004-seed-free-subscriptions.sql
```

---

## 3. 변경 파일 목록

| 구분 | 파일 | 변경 유형 | Phase |
|------|------|----------|-------|
| BE | `subscription.controller.ts` | 수정 (`@Public()` + 자동 FREE 생성) | 1 |
| FE | `PricingSection.tsx` | **신규** (가격플랜 카드) | 2 |
| FE | `SubscriptionPage.tsx` | 수정 (4탭 구조) | 2 |
| FE | `useSubscription.ts` | 수정 (`usePlans` 훅 추가) | 2 |
| FE | `subscription.service.ts` | 수정 (`getPlans` + types) | 2 |
| FE | `PaymentMethodModal.tsx` | **신규** (PG 선택 모달) | 3 |
| FE | `PricingSection.tsx` | 수정 (모달 연동) | 3 |
| FE | `PlanSection.tsx` | 수정 (모달 연동) | 3 |
| i18n | `locales/{ko,en,vi}/subscription.json` | 수정 (pricing/payment 키) | 4 |
| SQL | `004-seed-free-subscriptions.sql` | **신규** (마이그레이션) | 5 |

---

## 4. 사이드 임팩트 분석

| 영향 범위 | 분석 | 대응 |
|-----------|------|------|
| **기존 PlanSection `!subscription` 분기** | 자동 FREE 생성 후 더 이상 null이 되지 않음 | UX 개선 (에러 없이 항상 데이터 표시) |
| **토큰/스토리지 에러** | 자동 FREE 생성으로 데이터 보장 | 에러 상태가 사라짐 |
| **기존 Polar checkout** | 동작 변경 없음 (모달에서 Polar 선택 시 동일 흐름) | 에러 없음 |
| **동시 요청** | UNIQUE(ent_id) 제약 + try-catch로 중복 방지 | 조회 fallback |
| **포탈 PlansPage** | `GET /plans`에 `@Public()` 추가 → 포탈에서도 인증 없이 접근 가능 | 오히려 개선 |
| **기존 테스트** | subscription.service.spec.ts 영향 없음 (createFreeSubscription 기존 메서드) | — |

---

## 5. DB 마이그레이션

### 스테이징 실행 대상

```sql
-- 004-seed-free-subscriptions.sql
-- 기존 법인에 FREE 구독 + 토큰 + 스토리지 일괄 생성
```

### 실행 시점
- Phase 1 백엔드 배포와 동시에 실행
- Phase 1 배포 후에는 새로운 법인 접근 시 API에서 자동 생성되므로 추가 SQL 불필요

---

## 6. 구현 우선순위 및 순서

| 순서 | Phase | 설명 | 의존성 |
|------|-------|------|--------|
| 1 | **Phase 1** | 백엔드: 자동 FREE + @Public | 없음 |
| 2 | **Phase 5** | DB: 기존 법인 FREE 구독 시드 | Phase 1과 동시 |
| 3 | **Phase 2** | 프론트: PricingSection + 4탭 | Phase 1 |
| 4 | **Phase 4** | i18n 키 추가 | Phase 2와 동시 |
| 5 | **Phase 3** | 프론트: 결제 방식 선택 모달 | Phase 2 |

> **Phase 1 + 5만 완료해도 토큰/스토리지 에러 해결됨**
> Phase 2 + 3으로 가격플랜 탭 + 결제 선택 UI 완성
