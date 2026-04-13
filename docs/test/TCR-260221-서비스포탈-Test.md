# TC-서비스포탈-Test-20260221

## 1. 빌드 테스트

### TC-BUILD-01: portal-api TypeScript 컴파일
- **명령**: `npx tsc --noEmit -p apps/portal-api/tsconfig.json`
- **기대 결과**: 에러 없이 종료
- **결과**: PASS

### TC-BUILD-02: portal-api NestJS 빌드
- **명령**: `npx turbo run build --filter=@amb/portal-api --force`
- **기대 결과**: webpack 정상 컴파일
- **결과**: PASS (webpack 5.97.1, 593ms)

### TC-BUILD-03: portal-web TypeScript 컴파일
- **명령**: `npx tsc -b apps/portal-web/tsconfig.json`
- **기대 결과**: 에러 없이 종료
- **결과**: PASS

### TC-BUILD-04: portal-web Vite 빌드
- **명령**: `npx turbo run build --filter=@amb/portal-web --force`
- **기대 결과**: Vite 정상 빌드
- **결과**: PASS (1654 modules, 1.76s)

### TC-BUILD-05: 기존 내부 앱(web) 빌드 비파괴 확인
- **명령**: `npx turbo run build --filter=@amb/web --force`
- **기대 결과**: 기존 앱 빌드 성공 (엔티티 확장이 기존 빌드에 영향 없음)
- **결과**: PASS (2251 modules, 4.49s)

### TC-BUILD-06: 전체 모노레포 빌드
- **명령**: `npx turbo run build --force`
- **기대 결과**: 4/4 패키지 빌드 성공
- **결과**: PASS (15.057s)

---

## 2. 엔티티/스키마 테스트

### TC-ENTITY-01: 기존 엔티티 확장 — 호환성
- **대상 파일**:
  - `apps/api/src/domain/service-management/entity/service-plan.entity.ts` (+5 컬럼)
  - `apps/api/src/domain/service-management/entity/subscription.entity.ts` (+5 컬럼)
  - `apps/api/src/domain/service-management/entity/client.entity.ts` (+3 컬럼)
  - `apps/api/src/domain/billing/entity/partner.entity.ts` (+2 컬럼)
  - `apps/api/src/domain/billing/entity/contract.entity.ts` (+1 컬럼)
  - `apps/api/src/domain/billing/entity/invoice.entity.ts` (+2 컬럼)
- **검증 방법**: 모든 추가 컬럼이 `nullable: true` 이므로 기존 데이터/코드에 영향 없음
- **결과**: PASS (빌드로 확인)

### TC-ENTITY-02: portal-api shared-entities 동기화
- **대상 파일**: `apps/portal-api/src/shared-entities/` (7개 파일)
- **검증**: 기존 API 엔티티와 동일한 DB 테이블 참조, 추가 컬럼 동기화 완료
- **결과**: PASS

### TC-ENTITY-03: PortalCustomerEntity nullable 필드 타입
- **대상**: `apps/portal-api/src/domain/auth/entity/portal-customer.entity.ts`
- **검증**: nullable 컬럼에 `?` 옵셔널 마킹이 TypeORM + TypeScript strict 모드에서 호환
- **결과**: PASS

---

## 3. API 엔드포인트 테스트 케이스

### TC-API-01: POST /portal/auth/register
- **입력**: `{ email, password, name, company_name?, phone?, country? }`
- **정상**: 201 — 고객 + 클라이언트 레코드 생성, 이메일 인증 토큰 발급
- **중복 이메일**: 409 ConflictException
- **유효성 실패**: 400 (email 형식, password 8자 미만)
- **Throttle**: 5회/분 제한

### TC-API-02: GET /portal/auth/verify-email?token=xxx
- **정상 토큰**: 200 — `{ verified: true }`, `pctEmailVerified` = true
- **만료 토큰**: 400 BadRequestException
- **잘못된 토큰**: 400 BadRequestException

### TC-API-03: POST /portal/auth/login
- **정상**: 200 — `{ accessToken, refreshToken, customer }` 반환
- **잘못된 비밀번호**: 401 UnauthorizedException
- **비활성 계정**: 401 UnauthorizedException
- **Throttle**: 10회/분 제한

### TC-API-04: POST /portal/auth/refresh
- **정상**: 200 — 새 토큰 쌍 반환
- **만료 토큰**: 401 UnauthorizedException

### TC-API-05: POST /portal/auth/forgot-password
- **존재하는 이메일**: 200 — `{ sent: true }`, 리셋 토큰 생성
- **없는 이메일**: 200 — `{ sent: true }` (이메일 열거 방지)
- **Throttle**: 3회/분 제한

### TC-API-06: POST /portal/auth/reset-password
- **정상 토큰**: 200 — 비밀번호 변경, 토큰 무효화
- **만료 토큰**: 400 BadRequestException

### TC-API-07: GET /portal/auth/me (인증 필요)
- **정상 JWT**: 200 — 프로필 정보 반환
- **없는/만료 JWT**: 401 UnauthorizedException

### TC-API-08: GET /portal/services
- **정상**: 200 — 활성 서비스 목록 + 플랜 (공개 API, 인증 불필요)
- **데이터**: `svcStatus = 'ACTIVE'`, `splIsActive = true` 조건 필터링

### TC-API-09: GET /portal/services/:code
- **존재하는 코드**: 200 — 서비스 상세 + 플랜
- **없는 코드**: 404 NotFoundException

### TC-API-10: POST /portal/stripe/checkout (인증 필요)
- **정상**: 200 — `{ sessionId, url }` (Stripe Checkout URL)
- **Stripe 미설정 플랜**: 400 BadRequestException

### TC-API-11: POST /portal/stripe/billing-portal (인증 필요)
- **정상**: 200 — `{ url }` (Stripe Billing Portal URL)

### TC-API-12: POST /portal/stripe/webhook
- **유효한 Stripe 서명**: 200 — 이벤트 처리
- **잘못된 서명**: 400 BadRequestException
- **처리 이벤트 목록**:
  - `checkout.session.completed`
  - `customer.subscription.created/updated/deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

### TC-API-13: GET /portal/subscriptions (인증 필요)
- **구독 있음**: 200 — 구독 목록 (서비스/플랜 정보 포함)
- **구독 없음**: 200 — 빈 배열

### TC-API-14: GET /portal/subscriptions/:id (인증 필요)
- **본인 구독**: 200 — 상세 정보
- **타인 구독**: 404 NotFoundException

---

## 4. 프론트엔드 테스트 케이스

### TC-FE-01: 랜딩 페이지 렌더링
- **URL**: `/`
- **확인**: Hero 섹션, 서비스 3개 카드, CTA 버튼, i18n 3개 언어 전환

### TC-FE-02: 요금제 페이지
- **URL**: `/pricing`
- **확인**: API에서 서비스 목록 로딩, 플랜별 가격 카드, 통화 포맷, 무료 체험 버튼 → `/register` 링크

### TC-FE-03: 서비스 상세 페이지
- **URL**: `/services/TALK`
- **확인**: 서비스명 (다국어), 설명, 플랜 카드, 웹사이트 링크
- **404**: `/services/INVALID` → "Service Not Found" 표시

### TC-FE-04: 회원가입 페이지
- **URL**: `/register`
- **확인**: 폼 필드 (이름*, 이메일*, 비밀번호*, 회사명, 전화번호, 국가)
- **유효성 검사**: zod 스키마 (이메일 형식, 비밀번호 8자)
- **성공**: → `/verify-email-sent` 리다이렉트

### TC-FE-05: 로그인 페이지
- **URL**: `/login`
- **확인**: 이메일/비밀번호 입력, 비밀번호 표시/숨김 토글
- **성공**: → `/portal` 리다이렉트, zustand 스토어에 토큰 저장

### TC-FE-06: 비밀번호 찾기
- **URL**: `/forgot-password`
- **확인**: 이메일 입력, "링크 발송" 성공 화면 전환

### TC-FE-07: 비밀번호 재설정
- **URL**: `/reset-password?token=xxx`
- **확인**: 새 비밀번호 + 확인 입력, 불일치 오류, 성공 → 로그인 링크
- **토큰 없음**: "Invalid or Missing Token" 표시

### TC-FE-08: 이메일 인증 결과
- **URL**: `/verify-email?token=xxx`
- **확인**: 로딩 → 성공/실패 화면 전환

### TC-FE-09: 포탈 레이아웃 — 인증 가드
- **미인증**: `/portal` 접근 → `/login` 리다이렉트
- **인증**: 사이드바 메뉴 4개 (대시보드, 구독, 결제, 설정)
- **모바일**: 하단 네비게이션 바

### TC-FE-10: 포탈 대시보드
- **URL**: `/portal`
- **확인**: 환영 메시지 (이름), 이메일 미인증 경고, 통계 카드, 빠른 작업 링크

### TC-FE-11: 구독 관리 페이지
- **URL**: `/portal/subscriptions`
- **빈 상태**: "No Active Subscriptions" + "Browse Plans" 버튼
- **구독 있음**: 상태 아이콘 (ACTIVE/TRIAL/SUSPENDED/CANCELLED), 가격, 서비스명

### TC-FE-12: 반응형 디자인
- **PublicLayout**: 모바일 햄버거 메뉴 (`sm:hidden`), 데스크톱 일반 네비
- **PortalLayout**: 모바일 하단 탭, 데스크톱 사이드바
- **LandingPage**: CTA 버튼 세로 정렬 (모바일), 가로 정렬 (데스크톱)

### TC-FE-13: Auth Store 영속성
- **확인**: zustand + localStorage persist
- **새로고침**: 토큰 유지, API 헤더 자동 설정
- **401 인터셉터**: 자동 refresh → 실패 시 logout

### TC-FE-14: i18n — 3개 언어 완전 커버리지
- **EN/KO/VI**: `common.json` 키 수 일치 (~160개 키)
- **누락 키 없음**: 모든 `t()` 호출이 번역 파일에 존재

### TC-FE-15: 사용량 페이지
- **URL**: `/portal/usage`
- **빈 상태**: "No Usage Data" + 설명 텍스트
- **데이터 있음**: 메트릭별 카드 (이름, 수량, 금액, 미니 차트)
- **구독 선택**: 드롭다운으로 구독별 사용량 필터링

---

## 5. Phase 6-7 API 엔드포인트 테스트 케이스

### TC-API-15: POST /portal/usage/record (내부 API)
- **입력**: `{ subscriptionId, clientId, serviceId, metric, quantity, unitPrice, periodStart, periodEnd }`
- **정상**: 201 — 사용량 레코드 생성, Stripe 동기화 (구독에 Stripe ID 있을 경우)
- **Stripe 동기화 실패**: 201 — 로컬 레코드는 저장, Stripe 동기화 에러 로깅

### TC-API-16: POST /portal/usage/record/batch (내부 API)
- **입력**: `{ records: UsageRecord[] }`
- **정상**: 201 — 다수 레코드 일괄 생성

### TC-API-17: GET /portal/usage/summary (인증 필요)
- **쿼리**: `?startDate=2026-01-01&endDate=2026-01-31`
- **정상**: 200 — 메트릭별 사용량 요약 (수량, 금액, 기간별 내역)
- **데이터 없음**: 200 — 빈 배열

### TC-API-18: GET /portal/usage/subscriptions/:id/current (인증 필요)
- **정상**: 200 — 현재 기간 사용량 상세
- **타인 구독**: 404 NotFoundException

### TC-API-19: POST /portal/payments/create (인증 필요)
- **입력**: `{ subscriptionId, amount, currency, country?, gateway? }`
- **정상**: 200 — `{ paymentUrl, transactionId }` (게이트웨이별 결제 URL)
- **게이트웨이 라우팅**: VN/VND → VNPay, KR/KRW → TossPayments, 기본 → Stripe
- **미지원 게이트웨이**: 400 BadRequestException

### TC-API-20: GET /portal/payments/callback/:gateway
- **VNPay 콜백**: `?vnp_ResponseCode=00` → 결제 성공 처리, 포탈 리다이렉트
- **VNPay 서명 불일치**: 400 BadRequestException
- **VNPTePay 콜백**: 유사 처리
- **Toss 콜백**: `?paymentKey=xxx&orderId=xxx&amount=xxx` → confirmPayment API 호출

### TC-API-21: GET /portal/payments/history (인증 필요)
- **정상**: 200 — 결제 내역 목록 (게이트웨이, 상태, 금액, 통화)
- **빈 상태**: 200 — 빈 배열

### TC-API-22: GET /portal/payments/gateways (인증 필요)
- **입력**: `?country=VN&currency=VND`
- **정상**: 200 — 사용 가능 게이트웨이 목록 (`[VNPAY, VNPTEPAY]`)

### TC-API-23: GET /portal/admin/dashboard
- **정상**: 200 — 대시보드 통계 (고객 수, 구독 수, 결제 수, 30일 매출)

### TC-API-24: GET /portal/admin/customers
- **쿼리**: `?page=1&limit=20&search=keyword`
- **정상**: 200 — 페이지네이션 + 검색 결과

### TC-API-25: GET /portal/admin/customers/:id
- **존재하는 ID**: 200 — 고객 상세 + 구독 + 결제 내역
- **없는 ID**: 404 NotFoundException

### TC-API-26: GET /portal/admin/payments/by-gateway
- **정상**: 200 — 게이트웨이별 결제 통계

---

## 6. Payment Gateway 통합 테스트

### TC-PG-01: VNPay — 결제 URL 생성
- **조건**: VNPAY_TMN_CODE, VNPAY_HASH_SECRET 설정
- **확인**: HMAC-SHA512 서명, 파라미터 정렬, VND 금액 ×100 변환
- **URL 형식**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_...&vnp_SecureHash=...`

### TC-PG-02: VNPay — 콜백 서명 검증
- **정상 서명**: 결제 상태 업데이트, 포탈 리다이렉트
- **변조 서명**: 400 — "Invalid VNPay signature"

### TC-PG-03: VNPTePay — 결제 URL 생성
- **조건**: VNPTEPAY_MERCHANT_ID, VNPTEPAY_SECRET_KEY 설정
- **확인**: HMAC-SHA256 서명, 필수 파라미터 포함

### TC-PG-04: VNPTePay — 콜백 검증
- **정상**: 결제 성공/실패 처리
- **서명 불일치**: 400 에러

### TC-PG-05: TossPayments — 결제 URL 생성
- **조건**: TOSS_CLIENT_KEY, TOSS_SECRET_KEY 설정
- **확인**: 클라이언트 키 포함 결제 위젯 URL

### TC-PG-06: TossPayments — 결제 확인 (confirm)
- **정상**: POST /v1/payments/confirm → 결제 완료 상태 업데이트
- **실패**: TossPayments 에러코드 → 에러 저장

### TC-PG-07: 게이트웨이 자동 라우팅
- **VN 국가 + VND 통화**: VNPay 우선 선택
- **KR 국가 + KRW 통화**: TossPayments 우선 선택
- **US 국가 + USD 통화**: Stripe 글로벌 폴백
- **명시적 gateway 파라미터**: 지정된 게이트웨이 사용

---

## 7. 테스트 결과 요약

| 범주 | 항목 수 | 통과 | 실패 | 비고 |
|------|---------|------|------|------|
| 빌드 테스트 | 6 | 6 | 0 | 전체 모노레포 빌드 성공 |
| 엔티티/스키마 | 3 | 3 | 0 | nullable 호환성 확인 |
| API 엔드포인트 (Phase 1-5) | 14 | - | - | 런타임 테스트 필요 |
| API 엔드포인트 (Phase 6-7) | 12 | - | - | 런타임 테스트 필요 |
| 프론트엔드 | 15 | - | - | 브라우저 테스트 필요 |
| Payment Gateway 통합 | 7 | - | - | PG 키 설정 후 테스트 필요 |
| **합계** | **57** | **9** | **0** | |

### 빌드 테스트 실행 결과
- portal-api: webpack `1183ms` 컴파일 성공
- portal-web: vite `1.69s`, 1655 modules 빌드 성공
- 전체: 2/2 패키지 빌드 성공 (5.219s)

### API/FE 테스트 참고
- API 엔드포인트 테스트는 PostgreSQL DB 연결이 필요하므로 staging 배포 후 실행
- 프론트엔드 테스트는 `npm run dev:portal` 후 Chrome DevTools에서 확인
- PG 통합 테스트는 각 게이트웨이별 sandbox 키 설정 후 실행:
  - VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`
  - VNPTePay: `VNPTEPAY_MERCHANT_ID`, `VNPTEPAY_SECRET_KEY`
  - TossPayments: `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
