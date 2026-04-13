# REQ-PortalSubscriptionPayment-20260406
# Portal 구독 플랜 선택 및 멀티 결제 게이트웨이

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **요청자** | 관리자 |
| **요청일** | 2026-04-06 |
| **우선순위** | High |
| **대상 앱** | portal-web, api (주), portal-api (보조) |

### 핵심 요구사항
1. **Portal 내 플랜 선택/결제 페이지**: 로그인된 고객 포탈(`/portal/subscriptions`) 레이아웃에서 플랜 비교·선택·결제까지 가능한 페이지 필요
2. **멀티 결제 게이트웨이(PG)**: 기본 Polar + 국가별 로컬 PG 선택 가능
   - **Polar**: 글로벌 기본 (Stripe 기반, 모든 국가)
   - **토스페이먼츠 (Toss Payments)**: 한국 사용자 선택 가능
   - **메가페이 (MegaPay/VNPAY)**: 베트남 사용자 선택 가능

---

## 2. AS-IS 현황 분석

### 2.1 프론트엔드 (portal-web)

| 파일 | 현 상태 |
|------|---------|
| `pages/portal/SubscriptionsPage.tsx` | 구독 목록 표시 + 빈 상태 시 "Browse Plans" → `/pricing`(공개 페이지) 이동 |
| `pages/public/PricingPage.tsx` | FREE/BASIC/PREMIUM 비교 카드, FAQ, 비교 테이블 (비로그인 공개 페이지) |
| `pages/portal/BillingPage.tsx` | 빈 상태 플레이스홀더 |
| `router/index.tsx` | `/portal/subscriptions` → SubscriptionsPage (플랜 선택 sub-route 없음) |

**문제점**:
- "Browse Plans" 클릭 시 포탈 레이아웃을 벗어나 공개 `/pricing`으로 이동
- 포탈 내에서 플랜 선택 → 결제까지 이어지는 플로우가 없음
- 결제 게이트웨이 선택 UI 없음

### 2.2 백엔드 (api)

| 엔드포인트 | 현 상태 |
|-----------|---------|
| `POST /subscriptions/checkout` | Polar 전용 checkout URL 생성 |
| `POST /subscriptions/tokens/purchase` | Polar 전용 토큰 추가 구매 |
| `POST /subscriptions/storage/purchase` | Polar 전용 스토리지 추가 구매 |
| `POST /webhooks/polar` | Polar webhook 수신·처리 |

**결제 흐름 (현재 Polar Only)**:
1. 프론트 → `POST /subscriptions/checkout` (plan_code, user_count, billing_cycle)
2. 백엔드 → Polar API `POST /checkouts/custom/` → checkoutUrl 반환
3. 프론트 → Polar hosted checkout 페이지로 리다이렉트
4. 결제 완료 → Polar webhook → 백엔드 상태 갱신

**PolarService 구현**:
- `createCheckout()`: Polar `/checkouts/custom/` API 호출
- `verifyWebhookSignature()`: HMAC-SHA256 서명 검증
- Config: `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PRODUCT_{plan}_{cycle}`

### 2.3 DB 스키마 (결제 관련)

| 테이블 | 용도 | 비고 |
|--------|------|------|
| `amb_sub_plans` | FREE/BASIC/PREMIUM 플랜 정의 | 가격, 토큰, 스토리지 정책 |
| `amb_sub_subscriptions` | 법인별 구독 정보 | ent_id로 격리, status 관리 |
| `amb_pg_subscriptions` | PG 연동 정보 | **Polar 전용** (pgs_polar_subscription_id 등) |
| `amb_pg_webhook_events` | 웹훅 이벤트 로그 | 멱등성 체크용 |

### 2.4 국가별 결제 인프라 현황

| PG | 상태 | 비고 |
|----|------|------|
| **Polar** | ✅ 구현 완료 | 글로벌 Stripe 기반, 카드/PayPal 지원 |
| **토스페이먼츠** | ❌ 미구현 | 한국: 카드, 계좌이체, 가상계좌, 간편결제 |
| **MegaPay(VNPAY)** | ❌ 미구현 | 베트남: QR코드, ATM 카드, 국제카드, 전자지갑 |

---

## 3. TO-BE 요구사항

### 3.1 Portal 내 플랜 선택 페이지

**위치**: `/portal/subscriptions/plans` (PortalLayout 내부)

| 기능 | 설명 |
|------|------|
| 플랜 비교 카드 | FREE/BASIC/PREMIUM 3단 카드 (공개 PricingPage 디자인 기반, 포탈 레이아웃 대응) |
| 현재 플랜 표시 | 사용자의 현재 구독 플랜을 "Current Plan" 뱃지로 표시 |
| 업그레이드/다운그레이드 | 현재 플랜과 비교하여 활성화할 CTA 결정 |
| 사용자 수 선택 | Basic/Premium 선택 시 슬라이더/입력으로 유저 수 설정 (min~max) |
| 결제 주기 선택 | 월간/연간 토글 (연간 시 할인 표시) |
| **결제 게이트웨이 선택** | Polar(기본) / 토스페이먼츠(한국) / MegaPay(베트남) 라디오 버튼 |
| 결제 진행 | 선택된 PG로 checkout URL 생성 후 리다이렉트 |

### 3.2 멀티 PG 아키텍처

#### PG 선택 로직
```
사용자 국가 == 'KR'  → 기본값: 토스페이먼츠 (Polar 선택 가능)
사용자 국가 == 'VN'  → 기본값: MegaPay (Polar 선택 가능)
기타 국가            → Polar만 사용 (선택지 없음)
```

#### Backend PG Provider 추상화

```
PaymentGatewayInterface
  ├── PolarGateway      (기존 PolarService 리팩토링)
  ├── TossGateway       (신규)
  └── MegaPayGateway    (신규)
```

| 메서드 | 설명 |
|--------|------|
| `createCheckout()` | 결제 페이지 URL 생성 |
| `verifyWebhook()` | 웹훅 서명 검증 |
| `cancelSubscription()` | 구독 해지 |
| `getPaymentStatus()` | 결제 상태 조회 |

#### PG별 결제 플로우

**Polar (기존)**:
- Hosted checkout → redirect → webhook 수신

**토스페이먼츠**:
- 프론트에서 Toss SDK 로드 → `requestPayment()` → 인증 완료 → 서버 `confirm` API → webhook 수신
- 승인키 기반 Server-to-Server 결제 확인 필수

**MegaPay (VNPAY)**:
- 서버에서 결제 URL 생성 → redirect → return URL로 결과 수신 → IPN(webhook) 검증
- HMAC-SHA512 서명

### 3.3 DB 변경 요구

#### `amb_pg_subscriptions` 테이블 확장

기존 Polar 전용 → 멀티 PG 지원 필요:

| 신규 컬럼 | 타입 | 설명 |
|-----------|------|------|
| `pgs_provider` | VARCHAR(20) | PG 식별자: `POLAR`, `TOSS`, `MEGAPAY` |
| `pgs_provider_subscription_id` | VARCHAR(200) | PG별 구독 ID (기존 polar_subscription_id 대체) |
| `pgs_provider_customer_id` | VARCHAR(200) | PG별 고객 ID |
| `pgs_provider_order_id` | VARCHAR(200) | PG별 주문 ID |

#### 신규 테이블: `amb_pg_payments` (결제 이력)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `pgp_id` | UUID | PK |
| `ent_id` | UUID | 법인 ID |
| `sbn_id` | UUID | 구독 ID |
| `pgp_provider` | VARCHAR(20) | POLAR, TOSS, MEGAPAY |
| `pgp_provider_payment_id` | VARCHAR(200) | PG별 결제 고유 ID |
| `pgp_order_id` | VARCHAR(100) | 내부 주문 ID |
| `pgp_amount` | NUMERIC(12,2) | 결제 금액 |
| `pgp_currency` | VARCHAR(3) | 통화 (USD, KRW, VND) |
| `pgp_status` | VARCHAR(20) | PENDING, PAID, FAILED, REFUNDED |
| `pgp_method` | VARCHAR(50) | 결제 수단 (card, bank_transfer 등) |
| `pgp_raw_data` | JSONB | PG 원본 응답 |
| `pgp_created_at` | TIMESTAMPTZ | 생성일 |

### 3.4 환경 변수 추가

```bash
# Toss Payments
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
TOSS_WEBHOOK_SECRET=...

# MegaPay (VNPAY)
MEGAPAY_TMN_CODE=...
MEGAPAY_HASH_SECRET=...
MEGAPAY_API_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
MEGAPAY_RETURN_URL=...
```

---

## 4. 갭 분석

| 영역 | AS-IS | TO-BE | Gap |
|------|-------|-------|-----|
| **프론트 플랜 선택** | 포탈 외부(`/pricing`) 공개 페이지 | 포탈 내부(`/portal/subscriptions/plans`) | 신규 Portal 페이지 필요 |
| **결제 게이트웨이** | Polar 단일 | Polar + Toss + MegaPay 선택 | PG 추상화 레이어 + 2개 PG 신규 연동 |
| **결제 수단 선택 UI** | 없음 | 국가별 기본값 + 수동 선택 | 프론트 PG 선택 컴포넌트 필요 |
| **PG 결제 이력** | 웹훅 이벤트 로그만 | 결제 이력 테이블 + 이력 조회 | `amb_pg_payments` 테이블 + 서비스 |
| **토스 SDK** | 없음 | 프론트 SDK 로드 + 결제 인증 | @tosspayments/tosspayments-sdk |
| **MegaPay** | 없음 | 서버 결제 URL 생성 + redirect | VNPAY API 연동 |
| **통화** | USD 전제 | USD + KRW + VND | 통화별 금액 환산 또는 플랜별 통화 설정 |

---

## 5. 사용자 플로우

### 5.1 포탈 내 플랜 업그레이드 플로우

```
[Portal Subscriptions Page]
  └─ "Browse Plans" 클릭
      │
      ▼
[/portal/subscriptions/plans]
  ├─ 현재 플랜: "Current" 뱃지
  ├─ 업그레이드 대상: 플랜 카드 활성
  ├─ 사용자 수 입력 (6~49)
  ├─ 결제 주기 선택 (월간/연간)
  └─ "Upgrade" 클릭
      │
      ▼
[결제 게이트웨이 선택 모달]
  ├─ 국가가 KR → 토스페이먼츠 기본 선택 (Polar 선택 가능)
  ├─ 국가가 VN → MegaPay 기본 선택 (Polar 선택 가능)
  └─ 기타 → Polar 자동 (모달 스킵)
      │
      ▼
[PG별 결제 처리]
  ├─ Polar: checkoutUrl redirect → 외부 결제 → redirect back
  ├─ Toss: SDK 결제창 호출 → 인증 → 서버 confirm → 결과
  └─ MegaPay: paymentUrl redirect → 외부 결제 → return URL
      │
      ▼
[/portal/subscriptions?checkout=success]
  └─ 성공 배너 표시 + 구독 목록 갱신
```

### 5.2 토큰/스토리지 추가 구매 플로우

```
[AMA Settings > 구독 관리]
  └─ "토큰 추가" 또는 "스토리지 추가" 클릭
      │
      ▼
[수량 입력 + PG 선택]
  └─ 결제 진행 (위 플로우와 동일)
```

---

## 6. 기술 제약사항

### 6.1 토스페이먼츠
- **프론트 SDK 필수**: 결제창은 프론트에서 호출 (서버 리다이렉트 방식 불가)
- **Server-to-Server Confirm**: 인증 완료 후 백엔드에서 `POST /confirm` API 호출 필수
- **테스트 모드**: `test_` 접두어 키 사용 (테스트 결제 → 자동 취소)
- **구독결제**: 빌링키 발급 → 정기 결제 방식 (initial + recurring)

### 6.2 MegaPay (VNPAY)
- **서버 리다이렉트 방식**: 결제 URL을 서버에서 생성하여 사용자를 리다이렉트
- **VND 통화**: 소수점 없음 (정수 VND 단위)
- **IPN (Instant Payment Notification)**: 별도 IPN URL로 결제 결과 수신
- **HMAC-SHA512**: 요청·응답 서명 방식

### 6.3 공통 제약
- **스테이징/프로덕션 DB**: TypeORM synchronize 비활성화 → 수동 SQL 마이그레이션 필수
- **환경 변수 보안**: PG 시크릿 키는 `.env.*`로 관리, Git 커밋 금지
- **멱등성**: 중복 결제 방지를 위해 order_id 기반 멱등성 보장 필수
- **CORS**: 토스 SDK는 프론트에서 직접 호출하므로 CORS 이슈 없음 (3rd-party SDK)
- **VND 금액 환산**: $2/user 기준 VND 환산 가격 별도 설정 필요 (환율 변동 대응)
