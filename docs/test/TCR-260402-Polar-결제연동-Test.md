# Test Cases
## Polar 결제 연동 Test

- 문서 ID: TC-Polar-결제연동-Test-20260402
- 작성일: 2026-04-02
- 연계 문서:
  - `docs/analysis/REQ-Polar-결제연동-20260402.md`
  - `docs/plan/PLAN-Polar-결제연동-작업계획-20260402.md`

---

## 1. 단위 테스트 케이스

### TC-UNIT-001 Checkout 세션 생성
- 입력: `POST /api/v1/polar/checkout` (service, plan_tier, billing_cycle, success_url)
- 기대결과: checkout URL과 checkout ID가 반환된다.
- 검증항목: 요청 필드 유효성, 응답 포맷, metadata 반영

### TC-UNIT-002 Add-on Checkout 생성
- 입력: `POST /api/v1/polar/addon-checkout` (addon_type, quantity)
- 기대결과: add-on 결제 URL이 반환된다.
- 검증항목: add-on 유형 매핑, 수량 검증, 단가 계산

### TC-UNIT-003 Webhook 서명 검증 성공
- 입력: 유효 signature 헤더 + webhook payload
- 기대결과: 이벤트 처리 로직이 실행된다.
- 검증항목: signature 검증 함수, 처리 상태 저장

### TC-UNIT-004 Webhook 서명 검증 실패
- 입력: 잘못된 signature 헤더
- 기대결과: 403 반환, 데이터 변경 없음
- 검증항목: 보안 차단, 로그 기록

### TC-UNIT-005 Webhook 멱등 처리
- 입력: 동일 event ID를 2회 전송
- 기대결과: 1회만 처리되고 2회차는 skip
- 검증항목: `amb_pol_webhook_events` unique 처리

### TC-UNIT-006 subscription.active 처리
- 입력: `subscription.active` 이벤트
- 기대결과: 구독 상태 active 반영, 프로비저닝 이벤트 발생
- 검증항목: 구독 테이블 상태값, 후속 이벤트 발행

### TC-UNIT-007 subscription.revoked 처리
- 입력: `subscription.revoked` 이벤트
- 기대결과: 서비스 비활성화 플래그 설정
- 검증항목: 디프로비저닝 실행 여부, grace 처리

### TC-UNIT-008 order.paid 처리
- 입력: `order.paid` 이벤트
- 기대결과: 주문/인보이스 동기화, add-on 후처리 실행
- 검증항목: order 저장, 금액/통화 정합성

### TC-UNIT-009 AI 토큰 선충전 처리
- 입력: `order.paid` + addon_type=AI_TOKEN_TOPUP
- 기대결과: 엔티티 토큰 잔액 증가
- 검증항목: 잔액 증가량, 중복 적립 방지

### TC-UNIT-010 Customer Portal 세션 생성
- 입력: `POST /api/v1/polar/customer-portal`
- 기대결과: customer portal redirect URL 반환
- 검증항목: customer 식별자 매핑, URL 생성 성공

---

## 2. 통합 테스트 시나리오

### TC-INT-001 신규 구독 End-to-End
1. `www`에서 TALK Pro 월간 선택
2. checkout API 호출
3. Polar 결제 완료
4. webhook(`subscription.active`, `order.paid`) 수신

기대결과:
1. 내부 구독 상태 active
2. 계약/키/서비스 계정 프로비저닝 완료
3. 성공 URL 리다이렉트 정상

### TC-INT-002 인앱 Add-on 결제 End-to-End
1. `talk`에서 Extra Seats 5개 구매
2. add-on checkout 호출
3. 결제 완료 후 서비스 페이지 복귀

기대결과:
1. add-on 주문 반영
2. 좌석 수/한도 즉시 증가

### TC-INT-003 구독 취소 및 기간말 만료
1. customer portal에서 cancel 요청
2. webhook(`subscription.canceled`) 수신

기대결과:
1. 즉시 차단되지 않고 기간말 만료 예약
2. 만료 시점에 디프로비저닝 트리거

### TC-INT-004 구독 폐기(revoked)
1. webhook(`subscription.revoked`) 수신

기대결과:
1. API key 비활성화
2. 대상 서비스 계정 suspended
3. 운영 로그에 사유 기록

### TC-INT-005 재가입 복원
1. 만료 후 30일 내 재구독

기대결과:
1. 이전 설정/연결 정보 복원
2. 신규 중복 계정 생성 없음

---

## 3. 엣지 케이스

### TC-EDGE-001 webhook 순서 역전
- 시나리오: `order.paid`가 `subscription.created`보다 먼저 도착
- 기대결과: 보류/재시도로 정합성 유지

### TC-EDGE-002 webhook 재전송 폭주
- 시나리오: 동일 이벤트 다중 재전송
- 기대결과: 멱등 처리로 데이터 1회만 반영

### TC-EDGE-003 metadata 누락
- 시나리오: service metadata 누락 이벤트
- 기대결과: 기본 안전경로 처리 + 운영 경고 로그

### TC-EDGE-004 금액 불일치
- 시나리오: 주문 금액과 내부 기대 금액 불일치
- 기대결과: 실패 처리 및 운영자 알림

### TC-EDGE-005 알 수 없는 이벤트 타입
- 시나리오: 미지원 webhook event 수신
- 기대결과: 200 ack + no-op + 이벤트 로깅

---

## 4. 권한/격리 검증

### TC-SEC-001 Entity 격리
- 시나리오: 타 `ent_id` 구독 정보를 조회 시도
- 기대결과: 접근 차단

### TC-SEC-002 관리자 범위 확인
- 시나리오: ADMIN/SUPER_ADMIN 조회 API
- 기대결과: 정책 범위 내 조회 허용, audit 로그 기록

### TC-SEC-003 Webhook 공개 엔드포인트 보안
- 시나리오: 비정상 payload 대량 전송
- 기대결과: signature 실패 차단, 처리 비용 최소화

---

## 5. 운영 검증 체크리스트

1. Staging Polar product/price ID 매핑 확인
2. 환경변수(`POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`) 주입 확인
3. webhook endpoint 공개/방화벽 정책 확인
4. 장애 시 수동 재처리(runbook) 확인
5. 회계 인보이스 동기화 리포트 확인
