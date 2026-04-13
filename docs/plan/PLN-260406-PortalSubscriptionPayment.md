# PLAN-PortalSubscriptionPayment-작업계획-20260406
# Portal 구독 플랜 선택 및 멀티 결제 게이트웨이 - 작업계획서

## 1. 시스템 개발 현황 분석

### 1.1 기존 구현 현황

| 영역 | 구현 상태 | 파일 |
|------|----------|------|
| **구독 플랜 정의** | ✅ 완료 | `sub-plan.entity.ts`, seed SQL (FREE/BASIC/PREMIUM) |
| **구독 관리 서비스** | ✅ 완료 | `subscription.service.ts` (create, upgrade checkout, cancel) |
| **Polar 결제** | ✅ 완료 | `polar.service.ts` (checkout, webhook verify) |
| **Polar 웹훅** | ✅ 완료 | `polar-webhook.controller.ts` (subscription/order events) |
| **토큰 지갑** | ✅ 완료 | `token-wallet.service.ts` (BASE/ADDON/REFERRAL) |
| **스토리지 쿼터** | ✅ 완료 | `storage-quota.service.ts` (base + addon) |
| **Portal 구독 목록** | ✅ 완료 | `SubscriptionsPage.tsx` (목록, 빈 상태, 상태 뱃지) |
| **Portal 플랜 비교** | ❌ 없음 | 로그인 포탈 내 존재하지 않음 |
| **PG 선택** | ❌ 없음 | Polar 하드코딩 |
| **Toss Payments** | ❌ 없음 | 미연동 |
| **MegaPay(VNPAY)** | ❌ 없음 | 미연동 |

### 1.2 의존성 분석

```
Portal PlansPage (신규)
  └─ POST /subscriptions/checkout (기존, PG 파라미터 추가)
      └─ PaymentGatewayFactory (신규)
          ├─ PolarGateway (기존 PolarService 래핑)
          ├─ TossGateway (신규)
          └─ MegaPayGateway (신규)
              └─ Webhook Controllers (기존 Polar + 신규 Toss, MegaPay)
```

---

## 2. 단계별 구현 계획

### Phase 1: Portal 플랜 선택 페이지 (Polar 전용)
> 기존 Polar 결제만으로 동작하는 포탈 내 플랜 선택·결제 페이지

**목표**: `/portal/subscriptions/plans`에서 플랜 비교 → 선택 → Polar 결제까지 완결

#### 1-1. Backend: 플랜 목록 API

**신규 엔드포인트**: `GET /subscriptions/plans`

```typescript
// 응답: 활성 플랜 목록 (정렬순)
[
  { planId, code, name, tier, pricePerUser, tokenOnetime, tokenPerUserMonthly,
    storageBaseGb, storageMaxGb, maxUsers, minUsers, freeUserCount,
    isAnnualAvailable, annualFreeMonths, ... }
]
```

**변경 파일**:
- `apps/api/src/domain/subscription/controller/subscription.controller.ts` — 엔드포인트 추가
- `apps/api/src/domain/subscription/service/subscription.service.ts` — `getPlans()` 메서드
- `apps/api/src/domain/subscription/dto/response/subscription.response.ts` — `PlanResponse` DTO

#### 1-2. Backend: Checkout 요청에 success_url 동적 처리

현재 `createUpgradeCheckout`에서 `successUrl`이 파라미터로 전달됨.
→ 프론트에서 `success_url`을 `{portalUrl}/portal/subscriptions?checkout=success`로 전달하도록.

**변경 파일**:
- `apps/api/src/domain/subscription/dto/request/subscription.request.ts` — `success_url` 필드 추가

#### 1-3. Frontend: Portal Plans Page

**신규 파일**: `apps/portal-web/src/pages/portal/PlansPage.tsx`

| 섹션 | 내용 |
|------|------|
| 헤더 | "Choose Your Plan" 타이틀 |
| 현재 구독 상태 | 현재 플랜·상태를 배너로 표시 |
| 플랜 카드 3개 | FREE/BASIC/PREMIUM, 현재 플랜에 "Current" 뱃지 |
| 셋팅 패널 | Basic 선택 시: 사용자 수 입력 + 월간/연간 토글 |
| 금액 계산 | (유저수 - freeUserCount) × pricePerUser × billingMultiplier |
| CTA 버튼 | "Upgrade to Basic" → POST /subscriptions/checkout → Polar redirect |

**변경 파일**:
- `apps/portal-web/src/pages/portal/PlansPage.tsx` — 신규
- `apps/portal-web/src/router/index.tsx` — `/portal/subscriptions/plans` 라우트 추가
- `apps/portal-web/src/pages/portal/SubscriptionsPage.tsx` — "Browse Plans" 링크를 `/portal/subscriptions/plans`로 변경
- `apps/portal-web/src/locales/{ko,en,vi}/common.json` — 플랜 선택 관련 i18n 키

**사이드 임팩트**: 없음. 신규 페이지 추가만, 기존 SubscriptionsPage 링크 경로만 변경.

---

### Phase 2: PG 추상화 레이어 (Payment Gateway Factory)
> 멀티 PG를 지원하기 위한 백엔드 인터페이스 구조

#### 2-1. Payment Gateway Interface

**신규 파일**: `apps/api/src/domain/subscription/gateway/payment-gateway.interface.ts`

```typescript
export enum PaymentProvider {
  POLAR = 'POLAR',
  TOSS = 'TOSS',
  MEGAPAY = 'MEGAPAY',
}

export interface CheckoutParams {
  entId: string;
  userEmail: string;
  planCode: string;
  userCount: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  successUrl: string;
  cancelUrl?: string;
  currency: string;
  amount: number;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;          // Polar, MegaPay: redirect URL
  clientPayload?: unknown;      // Toss: SDK 인증에 필요한 payload
  requiresClientAuth?: boolean; // Toss: true → 프론트에서 SDK 호출 필요
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  verifyWebhook(headers: Record<string, string>, rawBody: Buffer): void;
  confirmPayment?(paymentKey: string, orderId: string, amount: number): Promise<unknown>; // Toss only
}
```

#### 2-2. Payment Gateway Factory

**신규 파일**: `apps/api/src/domain/subscription/gateway/payment-gateway.factory.ts`

```typescript
@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly polarGateway: PolarGateway,
    private readonly tossGateway: TossGateway,
    private readonly megaPayGateway: MegaPayGateway,
  ) {}

  getGateway(provider: PaymentProvider): PaymentGateway {
    switch (provider) {
      case PaymentProvider.POLAR: return this.polarGateway;
      case PaymentProvider.TOSS: return this.tossGateway;
      case PaymentProvider.MEGAPAY: return this.megaPayGateway;
    }
  }
}
```

#### 2-3. PolarGateway (기존 PolarService 래핑)

**신규 파일**: `apps/api/src/domain/subscription/gateway/polar.gateway.ts`
- 기존 `PolarService`를 `PaymentGateway` 인터페이스로 래핑
- `PolarService`는 그대로 유지 (Polar API 호출 로직)

**변경 파일**:
- `apps/api/src/domain/subscription/service/subscription.service.ts` — `PolarService` 직접 호출 → `PaymentGatewayFactory` 사용
- `apps/api/src/domain/subscription/controller/subscription.controller.ts` — checkout 요청에 `provider` 파라미터 추가
- `apps/api/src/domain/subscription/dto/request/subscription.request.ts` — `provider` 필드 추가

**사이드 임팩트**:
- 기존 Polar 전용 checkout 호출 경로가 Factory 경유로 변경
- 기존 webhook 컨트롤러는 변경 없음 (PG별로 별도 엔드포인트 운영)
- 기존 테스트 5개 (subscription.service.spec.ts 등) 수정 필요 (Factory mock)

---

### Phase 3: 토스페이먼츠 연동
> 한국 사용자를 위한 토스페이먼츠 결제 연동

#### 3-1. Backend: TossGateway

**신규 파일**: `apps/api/src/domain/subscription/gateway/toss.gateway.ts`

```typescript
// 토스 결제 플로우:
// 1. createCheckout() → orderId + amount + clientPayload 반환 (SDK용)
// 2. 프론트에서 Toss SDK requestPayment() 호출
// 3. 인증 성공 → paymentKey + orderId + amount를 서버로 전달
// 4. confirmPayment() → POST https://api.tosspayments.com/v1/payments/confirm
// 5. 구독 상태 갱신
```

**API 엔드포인트**:

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `POST /subscriptions/checkout` | POST | provider=TOSS → SDK용 payload 반환 |
| `POST /webhooks/toss/confirm` | POST | 토스 결제 승인 (paymentKey, orderId, amount) |
| `POST /webhooks/toss` | POST | 토스 웹훅 수신 (가상계좌 입금 등) |

**변경 파일**:
- `apps/api/src/domain/subscription/gateway/toss.gateway.ts` — 신규
- `apps/api/src/domain/subscription/controller/toss-webhook.controller.ts` — 신규
- `apps/api/src/domain/subscription/subscription.module.ts` — TossGateway 등록

**환경 변수**: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`

#### 3-2. Frontend: Toss SDK 통합

**변경 파일**:
- `apps/portal-web/src/pages/portal/PlansPage.tsx` — PG 선택 UI + Toss SDK 결제 호출
- `apps/portal-web/package.json` — `@tosspayments/tosspayments-sdk` 의존성 추가
- `apps/portal-web/src/lib/toss.ts` — Toss SDK 초기화 헬퍼 (신규)

**Toss SDK 결제 플로우**:
```typescript
// 1. POST /subscriptions/checkout (provider: TOSS)
// → { clientPayload: { orderId, orderName, amount, customerEmail }, requiresClientAuth: true }

// 2. Toss SDK 호출
const tossPayments = await loadTossPayments(clientKey);
await tossPayments.requestPayment('카드', {
  orderId, orderName, amount, customerEmail,
  successUrl: '/portal/subscriptions/toss/success',
  failUrl: '/portal/subscriptions/toss/fail',
});

// 3. 인증 성공 → /portal/subscriptions/toss/success?paymentKey=...&orderId=...&amount=...
// 4. → POST /webhooks/toss/confirm { paymentKey, orderId, amount }
// 5. → 구독 활성화
```

**사이드 임팩트**:
- Toss SDK 패키지 추가 → portal-web 번들 크기 증가 (lazy load로 최소화)
- 새 라우트 `/portal/subscriptions/toss/success`, `/portal/subscriptions/toss/fail` 추가

---

### Phase 4: MegaPay(VNPAY) 연동
> 베트남 사용자를 위한 VNPAY 결제 연동

#### 4-1. Backend: MegaPayGateway

**신규 파일**: `apps/api/src/domain/subscription/gateway/megapay.gateway.ts`

```typescript
// VNPAY 결제 플로우:
// 1. createCheckout() → 서명된 결제 URL 생성
// 2. 사용자 redirect → VNPAY 결제 페이지
// 3. 결제 완료 → return URL로 redirect (vnp_ResponseCode 포함)
// 4. IPN (Instant Payment Notification) → 서버 검증
```

**API 엔드포인트**:

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `POST /subscriptions/checkout` | POST | provider=MEGAPAY → paymentUrl 반환 |
| `GET /webhooks/megapay/return` | GET | VNPAY 결제 완료 후 return URL |
| `GET /webhooks/megapay/ipn` | GET | VNPAY IPN 검증·처리 |

**변경 파일**:
- `apps/api/src/domain/subscription/gateway/megapay.gateway.ts` — 신규
- `apps/api/src/domain/subscription/controller/megapay-webhook.controller.ts` — 신규
- `apps/api/src/domain/subscription/subscription.module.ts` — MegaPayGateway 등록

**환경 변수**: `MEGAPAY_TMN_CODE`, `MEGAPAY_HASH_SECRET`, `MEGAPAY_API_URL`, `MEGAPAY_RETURN_URL`

#### 4-2. Frontend: MegaPay 지원

MegaPay는 Polar와 동일한 redirect 방식이므로 프론트 변경 최소화.

**변경 파일**:
- `apps/portal-web/src/pages/portal/PlansPage.tsx` — MEGAPAY 선택 시 checkoutUrl redirect
- `apps/portal-web/src/router/index.tsx` — MegaPay return 페이지 라우트 추가 (선택)

---

### Phase 5: DB 마이그레이션 및 PG 선택 UI 완성

#### 5-1. DB 마이그레이션

**신규 SQL**: `sql/003-add-payment-gateway-support.sql`

```sql
-- 1. amb_pg_subscriptions 테이블 확장
ALTER TABLE amb_pg_subscriptions
  ADD COLUMN IF NOT EXISTS pgs_provider VARCHAR(20) DEFAULT 'POLAR',
  ADD COLUMN IF NOT EXISTS pgs_provider_subscription_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS pgs_provider_customer_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS pgs_provider_order_id VARCHAR(200);

-- 2. 결제 이력 테이블
CREATE TABLE IF NOT EXISTS amb_pg_payments (
  pgp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id UUID NOT NULL,
  sbn_id UUID NOT NULL,
  pgp_provider VARCHAR(20) NOT NULL DEFAULT 'POLAR',
  pgp_provider_payment_id VARCHAR(200),
  pgp_order_id VARCHAR(100) NOT NULL,
  pgp_amount NUMERIC(12,2) NOT NULL,
  pgp_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  pgp_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  pgp_method VARCHAR(50),
  pgp_raw_data JSONB,
  pgp_paid_at TIMESTAMPTZ,
  pgp_created_at TIMESTAMPTZ DEFAULT NOW(),
  pgp_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_amb_pg_payments_ent_id ON amb_pg_payments(ent_id);
CREATE INDEX IF NOT EXISTS idx_amb_pg_payments_order_id ON amb_pg_payments(pgp_order_id);
```

#### 5-2. PG 선택 UI 컴포넌트

**신규 파일**: `apps/portal-web/src/components/PaymentGatewaySelector.tsx`

```
[결제 수단 선택]
┌─────────────────────────────────────┐
│ ○ Polar (Credit Card / PayPal)     │  ← 글로벌 기본
│ ● 토스페이먼츠 (카드/계좌이체)       │  ← 한국 사용자만 표시
│ ○ MegaPay (QR/ATM/E-Wallet)       │  ← 베트남 사용자만 표시
└─────────────────────────────────────┘
```

- 사용자 국가(JWT country 또는 브라우저 locale)에 따라 옵션 필터링
- 한국: Toss + Polar
- 베트남: MegaPay + Polar
- 기타: Polar만 (선택 UI 숨김)

---

## 3. 변경 파일 목록

### Phase 1: Portal 플랜 페이지

| 구분 | 파일 | 변경 유형 |
|------|------|----------|
| BE | `subscription.controller.ts` | 수정 (GET /plans 추가) |
| BE | `subscription.service.ts` | 수정 (getPlans 메서드) |
| BE | `subscription.response.ts` | 수정 (PlanResponse DTO) |
| BE | `subscription.request.ts` | 수정 (success_url 필드) |
| FE | `PlansPage.tsx` | **신규** |
| FE | `router/index.tsx` | 수정 (라우트 추가) |
| FE | `SubscriptionsPage.tsx` | 수정 (링크 변경) |
| FE | `locales/{ko,en,vi}/common.json` | 수정 (i18n 키) |

### Phase 2: PG 추상화

| 구분 | 파일 | 변경 유형 |
|------|------|----------|
| BE | `gateway/payment-gateway.interface.ts` | **신규** |
| BE | `gateway/payment-gateway.factory.ts` | **신규** |
| BE | `gateway/polar.gateway.ts` | **신규** |
| BE | `subscription.service.ts` | 수정 (Factory 사용) |
| BE | `subscription.controller.ts` | 수정 (provider 파라미터) |
| BE | `subscription.request.ts` | 수정 (provider 필드) |
| BE | `subscription.module.ts` | 수정 (Gateway 등록) |

### Phase 3: 토스페이먼츠

| 구분 | 파일 | 변경 유형 |
|------|------|----------|
| BE | `gateway/toss.gateway.ts` | **신규** |
| BE | `controller/toss-webhook.controller.ts` | **신규** |
| BE | `subscription.module.ts` | 수정 |
| FE | `lib/toss.ts` | **신규** |
| FE | `PlansPage.tsx` | 수정 (Toss SDK 호출) |
| FE | `router/index.tsx` | 수정 (success/fail 라우트) |
| FE | `package.json` | 수정 (SDK 의존성) |

### Phase 4: MegaPay

| 구분 | 파일 | 변경 유형 |
|------|------|----------|
| BE | `gateway/megapay.gateway.ts` | **신규** |
| BE | `controller/megapay-webhook.controller.ts` | **신규** |
| BE | `subscription.module.ts` | 수정 |
| FE | `PlansPage.tsx` | 수정 (MegaPay redirect) |

### Phase 5: DB + PG 선택 UI

| 구분 | 파일 | 변경 유형 |
|------|------|----------|
| SQL | `003-add-payment-gateway-support.sql` | **신규** |
| BE | `pg-payment.entity.ts` | **신규** |
| FE | `PaymentGatewaySelector.tsx` | **신규** |
| FE | `PlansPage.tsx` | 수정 (selector 통합) |

---

## 4. 사이드 임팩트 분석

| 영향 범위 | 분석 | 대응 |
|-----------|------|------|
| **기존 Polar 결제 흐름** | Phase 2에서 Factory 경유로 변경 | Polar 동작 동일 유지, 기존 webhook 변경 없음 |
| **기존 구독 데이터** | `amb_pg_subscriptions`에 `pgs_provider` 컬럼 추가 | DEFAULT 'POLAR'로 기존 데이터 호환 |
| **기존 테스트 (60개)** | subscription.service 테스트에서 PolarService mock → Factory mock | Phase 2에서 테스트 업데이트 |
| **portal-web 번들 크기** | Toss SDK 추가 (Phase 3) | 동적 import로 필요 시에만 로드 |
| **환경 변수** | Toss/MegaPay 키 추가 | 없으면 해당 PG 비활성 (graceful) |
| **AMA web 구독 관리** | 영향 없음 | AMA web은 백엔드 API만 호출, PG 선택은 portal 전용 |

---

## 5. DB 마이그레이션

### 스테이징/프로덕션 실행 필요 SQL

```sql
-- Phase 5 실행 (Phase 1~4 완료 후)
-- 스테이징:
docker exec amb-postgres-staging psql -U amb_user -d db_amb -f /path/to/003-add-payment-gateway-support.sql

-- 프로덕션:
docker exec amb-postgres-production psql -U amb_user -d db_amb -f /path/to/003-add-payment-gateway-support.sql
```

### 마이그레이션 순서
1. SQL 파일을 서버에 복사
2. SQL 실행 (테이블·컬럼 추가)
3. 코드 배포 (`deploy-staging.sh build && restart`)

---

## 6. 구현 우선순위 및 순서

| 순서 | Phase | 설명 | 의존성 |
|------|-------|------|--------|
| 1 | **Phase 1** | Portal 플랜 선택 + Polar 결제 | 없음 (독립) |
| 2 | **Phase 5-1** | DB 마이그레이션 (Phase 2~4 전에 실행) | Phase 1 |
| 3 | **Phase 2** | PG 추상화 레이어 | Phase 5-1 |
| 4 | **Phase 3** | 토스페이먼츠 연동 | Phase 2 |
| 5 | **Phase 4** | MegaPay 연동 | Phase 2 |
| 6 | **Phase 5-2** | PG 선택 UI 완성 | Phase 3 + Phase 4 |

> **Phase 1만 완료해도 서비스 가능** — 기존 Polar로 포탈 내 결제 동작.
> Phase 3, 4는 독립적으로 병렬 진행 가능.
