# Work Plan (작업 계획서)
## Polar 결제 연동 작업계획

- 문서 ID: PLAN-Polar-결제연동-작업계획-20260402
- 작성일: 2026-04-02
- 연계 분석서: docs/analysis/REQ-Polar-결제연동-20260402.md
- 기준 문서: reference/polar-payment-requirements.md

---

## 1. System Baseline (시스템 개발 현황 분석 기반)

현재 결제 시스템은 다음과 같다.

1. Internal API: MegaPay 중심 `payment-gateway` 모듈 운영
2. Portal API: VNPAY/VNPTEPAY/TOSS provider 라우팅 운영
3. 웹 관리자 화면: PG 설정/트랜잭션/AI quota 구매 UI 존재
4. AI quota top-up 이벤트 연동 존재 (`payment.success`)

Polar 요구사항 수용 시 핵심 변화:

1. 결제 단건 트랜잭션 모델 -> 구독 생명주기 모델 확장
2. callback/ipn 중심 -> webhook event-sourcing + idempotency 강화
3. 서비스별 산발 연동 -> `ama` 백엔드 허브 단일화

---

## 2. Phase-by-Phase Implementation Plan (단계별 구현 계획)

### Phase 1. Polar Foundation (P0)

목표:
1. Polar SDK 연동 기반 기본 구조 확보
2. Checkout + Webhook 최소 경로 구현

작업:
1. `apps/api/src/domain/polar/` 모듈 신설
2. `PolarModule`, `PolarController`, `PolarService` 생성
3. API 추가:
- `POST /api/v1/polar/checkout`
- `POST /api/v1/polar/addon-checkout`
- `POST /api/v1/polar/webhook`
4. Webhook 서명 검증 + event ID 멱등 처리
5. 환경변수 추가:
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_ORGANIZATION`

산출물:
1. Polar Checkout URL 발급 가능
2. webhook 수신/검증/중복방지 가능

사이드 임팩트:
1. 인증 가드 예외 처리(`/polar/webhook`) 보안 검증 필수
2. 기존 payment-gateway 모듈과 API 경로 충돌 방지

---

### Phase 2. Subscription Sync & Provisioning (P0)

목표:
1. 구독 상태를 내부 스키마와 동기화
2. 활성/취소/폐기 이벤트에 맞춰 자동 프로비저닝 수행

작업:
1. 신규 엔티티/리포지토리 구현:
- `amb_pol_subscriptions`
- `amb_pol_orders`
- `amb_pol_webhook_events`
- 필요 시 `amb_pol_customers`, `amb_pol_addon_usages`
2. 이벤트 핸들러 구현:
- `subscription.active`
- `subscription.canceled`
- `subscription.revoked`
- `order.paid`
3. 기존 도메인 연계:
- billing 계약/인보이스 동기화
- API Key 발급/비활성화 연계

산출물:
1. 구독 활성화 시 내부 계약/권한 자동 반영
2. 폐기 시 디프로비저닝 자동 반영

사이드 임팩트:
1. 잘못된 metadata 매핑 시 타 서비스 프로비저닝 오류 가능
2. 이벤트 순서 역전(out-of-order) 대응 필요

---

### Phase 3. Customer Portal & Domain Integration (P0/P1)

목표:
1. `www` 중심 고객 결제 UX 완성
2. `talk/campaign/apps` 인앱 업그레이드 연동

작업:
1. 웹 프론트 결제 진입 UI 및 성공/실패 라우트 정비
2. Polar Customer Portal session 발급 API 구현
3. 내부 서비스 호출 계약 문서화:
- service, plan_tier, billing_cycle, success_url, cancel_url
4. 권한/법인 컨텍스트 검증(엔티티 단위)

산출물:
1. 서비스별 구독/애드온 결제 플로우 동작
2. 고객 포탈에서 구독/청구서 관리 가능

사이드 임팩트:
1. 다중 도메인 CORS/redirect URL 검증 필요
2. 가격 정책 변경 시 상품 매핑 동기화 필요

---

### Phase 4. Usage Billing & Dunning (P1)

목표:
1. AI token/messages usage 기반 과금 자동화
2. 연체 및 알림 흐름 운영화

작업:
1. Meter event 전송 배치 구현
2. 80%/100% 사용량 알림(이메일/인앱)
3. `subscription.past_due` dunning 시나리오 구현
4. 운영 모니터링/재처리 도구 제공

산출물:
1. 사용량 과금 이벤트 정기 동기화
2. 연체/알림 운영 플로우 가시화

사이드 임팩트:
1. 배치 중복 전송/누락 방지 로직 필요
2. 비용 정산 검증 리포트 필요

---

## 3. Target File List (변경 대상 파일 목록)

### 3.1 Backend (예상)

1. `apps/api/src/domain/polar/polar.module.ts` (신규)
2. `apps/api/src/domain/polar/controller/polar.controller.ts` (신규)
3. `apps/api/src/domain/polar/service/polar.service.ts` (신규)
4. `apps/api/src/domain/polar/service/polar-webhook.service.ts` (신규)
5. `apps/api/src/domain/polar/entity/polar-subscription.entity.ts` (신규)
6. `apps/api/src/domain/polar/entity/polar-order.entity.ts` (신규)
7. `apps/api/src/domain/polar/entity/polar-webhook-event.entity.ts` (신규)
8. `apps/api/src/app.module.ts` (모듈 등록)
9. `apps/api/src/global/constant/error-code.constant.ts` (Polar 코드 추가)
10. `apps/api/src/domain/billing/*` (계약/인보이스 연동 시 수정)
11. `apps/api/src/domain/settings/service/api-key.service.ts` (프로비저닝 연계 시)

### 3.2 Frontend (예상)

1. `apps/web/src/domain/payment/*` (Polar 기반 checkout 훅/페이지 확장)
2. `apps/web/src/domain/settings/pages/PaymentGatewaySettingsPage.tsx` (Polar 관리 항목 추가 시)
3. `apps/web/src/router/index.tsx` (결제 성공/실패 라우트 점검)
4. `apps/web/src/locales/*/*.json` (결제 문구/i18n)

### 3.3 Infra/Config (예상)

1. `env/backend/.env.development` (Polar env 추가)
2. `docker/staging/.env.staging` (Polar env 추가)
3. `docker/production/.env.production` (Polar env 추가)

### 3.4 SQL

1. `sql/` 하위 Polar 스키마 생성 SQL 신규

---

## 4. Side Impact Analysis (사이드 임팩트 분석)

### 4.1 Functional Impact

1. 기존 MegaPay 운영 경로와 공존 기간 필요
2. 결제 결과 소스가 다원화되어 운영 모니터링 복잡도 증가

### 4.2 Security & Compliance

1. Webhook 위변조 방지(서명/타임윈도우/멱등) 필수
2. 토큰/시크릿 저장 시 암호화 및 노출 제한 필요

### 4.3 Data Isolation

1. 구독/주문/이벤트에 `ent_id` 매핑 강제
2. 관리자 조회 API도 엔티티 범위 정책 유지

### 4.4 Operational Risks

1. webhook 지연/중복/순서 역전 대응 실패 시 과금 불일치 발생
2. 프로비저닝 실패 시 수동 재처리 툴 필요

---

## 5. DB Migration Plan (DB 마이그레이션)

필요 여부: 필요 (신규 테이블)

예상 신규 테이블:
1. `amb_pol_subscriptions`
2. `amb_pol_orders`
3. `amb_pol_webhook_events`
4. 옵션: `amb_pol_customers`, `amb_pol_addon_usages`

주의사항:
1. staging/production은 TypeORM synchronize 비활성
2. 수동 SQL 선반영 후 코드 배포 순서 준수
3. 롤백 SQL 동시 준비

---

## 6. Validation & Rollout Plan (검증 및 배포 계획)

1. Build 검증
- `npm run -w @amb/api build`
- `npm run -w @amb/web build`

2. Integration 검증
- Checkout 생성/리다이렉트
- Webhook 서명 실패/성공
- 중복 webhook 재전송 멱등 처리
- subscription.active -> provisioning 반영
- order.paid -> invoice/token 반영

3. 배포 순서
1) Staging SQL 적용
2) Staging 앱 배포
3) 시나리오 검증
4) Production SQL 적용
5) Production 배포

---

## 7. Definition of Done (완료 기준)

1. `/api/v1/polar/checkout` 및 `/api/v1/polar/webhook` 정상 동작
2. webhook 서명 검증/멱등 처리 검증 완료
3. 구독 활성화/취소/폐기 시 내부 상태 동기화 완료
4. 최소 1개 서비스(예: TALK) end-to-end 결제 및 프로비저닝 성공
5. 운영 로그/모니터링 및 재처리 절차 문서화 완료
