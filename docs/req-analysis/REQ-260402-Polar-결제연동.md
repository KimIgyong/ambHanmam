# Requirements Analysis (요구사항 분석서)
## Polar 결제 연동 (AMA Ecosystem)

- 문서 ID: REQ-Polar-결제연동-20260402
- 작성일: 2026-04-02
- 기준 문서: reference/polar-payment-requirements.md
- 대상 시스템: `apps/api` (AMA 백엔드 허브), `apps/web` (관리/결제 UI), 외부 도메인 연동(`www/talk/campaign/apps`)

---

## 1. Requirement Summary (요구사항 요약)

Polar.sh를 결제 인프라 표준으로 도입하여, AMA 생태계 전 서비스에 대해 다음을 지원한다.

1. 구독 결제: 서비스/플랜/주기(월/연) 기반 Checkout
2. 부가 결제: 좌석, 연동, 호스팅, 메시징, AI 토큰 선충전/사용량 과금
3. 단일 Webhook: 결제 이벤트 수신/검증/멱등 처리
4. 프로비저닝: 구독 활성화 시 계약/키/서비스 계정 자동 생성
5. 고객 포탈: 구독/청구서/결제수단 조회 및 관리
6. 생명주기: 업그레이드/다운그레이드/취소/재활성화 정책 반영

핵심 아키텍처 결정:
- Polar Organization 1개
- Polar 직접 연동 지점은 `ama.amoeba.site` 백엔드 1곳
- 타 도메인은 내부 API 호출 구조

---

## 2. AS-IS Current State (현행 분석)

### 2.1 Existing Payment Stack

현재 코드베이스는 `payment-gateway` 도메인 중심의 MegaPay 연동이 구현되어 있다.

1. 백엔드 모듈: `apps/api/src/domain/payment-gateway/*`
2. 관리 API: `/api/v1/payment-gateway/configs`, `/payments`, `/callback`, `/ipn`
3. 핵심 엔티티:
- `amb_pg_configs` (`PgConfigEntity`)
- `amb_pg_transactions` (`PgTransactionEntity`)
- `amb_ai_quota_products`, `amb_ai_quota_topups`
4. 사용량/충전 이벤트: `payment.success` 기반 AI quota topup 처리

### 2.2 Current Web/Portal Behavior

1. 웹 관리자 설정 화면 존재: `PaymentGatewaySettingsPage`
2. 관리자 트랜잭션 조회/환불 훅 존재
3. AI 토큰 구매 모달 존재 (`QuotaPurchaseModal`) - 결제링크 방식
4. Portal API는 별도 게이트웨이 라우팅 구조(VNPAY/VNPTEPAY/TOSS + Stripe fallback)

### 2.3 Gaps Against Polar Requirements

기준 문서 대비 현재 미구현 항목:

1. Polar SDK 기반 Checkout/Customer Portal API 없음
2. `/api/v1/polar/*` 전용 컨트롤러/서비스/엔티티 없음
3. Polar Webhook 서명 검증 및 이벤트 멱등 테이블 없음
4. 서비스별 메타데이터 라우팅(`metadata.service`) 없음
5. 구독 활성화/취소/폐기 기반 프로비저닝 파이프라인 없음
6. 구독/인보이스 동기화의 Polar 스키마 없음
7. 다중 도메인(`www/talk/campaign/apps`)에서의 내부 호출 계약 미정의

---

## 3. TO-BE Requirements (목표 요구사항)

### 3.1 Polar Integration Hub

`apps/api`에 Polar 전용 도메인 신설:

1. Checkout 생성 API: `POST /api/v1/polar/checkout`
2. Add-on Checkout API: `POST /api/v1/polar/addon-checkout`
3. Webhook 수신 API: `POST /api/v1/polar/webhook`
4. Customer Portal 세션 API: `POST /api/v1/polar/customer-portal`

### 3.2 Subscription & Add-on Billing

1. 플랜 구독: Starter/Pro/Enterprise, 월/연
2. Add-on: extra seats/integration/hosting/messaging/AI token
3. Trial/Discount 정책 반영(14일 무료 체험, 연간 할인, 번들 할인)

### 3.3 Webhook & Idempotency

1. Polar 서명 검증 실패 시 403
2. 이벤트 ID 저장 기반 멱등 처리
3. `subscription.active/canceled/revoked`, `order.paid`, `subscription.past_due` 처리

### 3.4 Provisioning Pipeline

1. 구독 활성화 시 파트너/계약/API Key/서비스 계정 생성
2. 취소/폐기 시 비활성화/유예/복구 정책 실행
3. AI token top-up, usage meter 동기화

### 3.5 Customer Experience

1. `www`에서 구독 시작 및 결제 성공 리다이렉트
2. 각 서비스 인앱 업그레이드 버튼 제공
3. 구독/청구서/결제수단/토큰잔액 조회

---

## 4. Gap Analysis (갭 분석)

### 4.1 Domain Gap

1. AS-IS는 MegaPay 중심 결제 트랜잭션 모델
2. TO-BE는 구독/이벤트/프로비저닝 중심 모델

결론: 기존 `payment-gateway`를 확장하기보다 `polar` 하위 도메인 분리를 권장

### 4.2 Data Gap

필요 신규 스키마(기준 문서 기반):

1. Polar subscription/order/customer/event 저장 테이블
2. webhook event id 멱등 테이블
3. service/addon metadata 매핑 테이블

주의: staging/production은 synchronize 비활성 -> 수동 SQL 필수

### 4.3 API Contract Gap

1. 내부 서비스 호출 규격(도메인별 successUrl/cancelUrl/metadata) 부재
2. 고객 포탈 진입 토큰/세션 발급 흐름 미정

### 4.4 Operational Gap

1. 실패 재처리(dunning) 규칙 미정
2. 운영 대시보드(구독 상태, 과금 이벤트 추적) 미흡

---

## 5. User Flow (사용자 플로우)

### 5.1 New Subscription

1. 사용자 `www` 가격 페이지에서 서비스/플랜 선택
2. `www -> ama` Checkout 세션 생성 요청
3. Polar 호스팅 결제 페이지 이동
4. 결제 성공 후 서비스 성공 URL로 복귀
5. Polar webhook 수신 후 구독 활성화/프로비저닝 실행

### 5.2 In-App Add-on Purchase

1. `talk/campaign/ama`에서 Add-on 구매 클릭
2. `ama`에 add-on checkout 요청
3. 결제 완료 후 원래 서비스 설정 페이지 복귀
4. `order.paid` webhook 처리 후 수량/잔액 반영

### 5.3 Cancellation / Re-activation

1. 고객 포탈에서 취소 요청
2. 기간말 만료 예약(`cancel_at_period_end`) 반영
3. 만료 후 유예기간 종료 시 디프로비저닝
4. 30일 내 재가입 시 기존 설정 복원

---

## 6. Technical Constraints (기술 제약사항)

1. 외부 결제 보안
- Webhook 서명 검증/재전송 대응/멱등성 필수

2. 멀티 도메인 구조
- Polar 직접 호출은 `ama` 백엔드만 허용
- 다른 도메인은 내부 API 연동만 허용

3. 데이터 격리
- Entity 범위(`ent_id`) 보존 필수
- 사용자/법인 매핑 오류 시 타 법인 과금 리스크

4. 운영/배포
- DB 변경은 staging/production 수동 SQL 적용
- env에 Polar 토큰/웹훅 시크릿 분리 관리

5. 기존 결제 시스템 공존
- MegaPay/Portal PG와 단계적 공존 전략 필요
- 점진적 전환(서비스별 feature flag) 권장

---

## 7. Feasibility & Recommendation (구현 가능성 및 권고)

구현 가능성: 높음 (단계적 이행 전제)

권고:
1. Phase 1: Polar 도메인 신설 + Checkout/Webhook 최소 기능
2. Phase 2: 구독/인보이스 동기화 + 프로비저닝 자동화
3. Phase 3: Usage meter(메시징/AI 토큰) + dunning + 운영대시보드
4. 기존 MegaPay는 단기 공존 후 서비스 단위로 점진 전환
