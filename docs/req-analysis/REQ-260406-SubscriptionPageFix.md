# REQ-SubscriptionPageFix-20260406
# 구독 설정 페이지 가격플랜 탭 추가 및 데이터 초기화 — 요구사항 분석서

## 1. 요구사항 요약

`https://stg-ama.amoeba.site/entity-settings/subscription` 페이지에서 발견된 4가지 이슈를 해결한다:

| # | 요구사항 | 우선순위 |
|---|---------|---------|
| R1 | 가격플랜(Pricing) 탭 추가 — 플랜 비교/업그레이드 UI | 높음 |
| R2 | 구독 플랜 탭 — 구독 미존재 시 FREE 자동 생성 + 업그레이드 시 결제 방식 선택 모달 | 높음 |
| R3 | 토큰 탭 — 에러 해결 (구독/토큰 데이터 미존재 시 graceful 처리) | 높음 |
| R4 | 스토리지 탭 — "구독 데이터 로드에 실패했습니다" 해결 | 높음 |
| R5 | 기존 모든 법인에 FREE 구독 데이터 일괄 생성 | 높음 |

---

## 2. AS-IS 현황 분석

### 2.1 프론트엔드 현황

**SubscriptionPage** (`apps/web/src/domain/subscription/pages/SubscriptionPage.tsx`)
- 3개 탭: Plan / Tokens / Storage
- 가격플랜(Pricing) 비교 탭 없음

**PlanSection** (`apps/web/src/domain/subscription/components/PlanSection.tsx`)
- `GET /api/v1/subscriptions` 호출 → 구독 없으면 `data: null` 반환
- `subscription === null` → "활성 구독이 없습니다. FREE 플랜으로 시작하세요." + 업그레이드 BASIC 버튼
- 업그레이드 버튼 클릭 시 **직접 Polar checkout** 호출 (결제 방식 선택 없음)
- 결제 방식 선택 모달 없음

**TokenSection** (`apps/web/src/domain/subscription/components/TokenSection.tsx`)
- `GET /api/v1/subscriptions/tokens` 호출
- 구독 미존재 시 토큰 월렛도 0건 → `wallets: []` 반환 → `totalBalance: 0` 표시됨
- **에러 원인**: 토큰 구매 등 특정 기능에서 구독 ID 필요 → `sbn_id` 없어서 에러 발생 가능

**StorageSection** (`apps/web/src/domain/subscription/components/StorageSection.tsx`)
- `GET /api/v1/subscriptions/storage` 호출
- 구독 미존재 → `SubStorageQuotaEntity` 없음 → `data: null` 반환
- `!storage` → "구독 데이터 로드에 실패했습니다" 메시지 표시

### 2.2 백엔드 현황

**Subscription Controller** (`apps/api/src/domain/subscription/controller/subscription.controller.ts`)
- `GET /subscriptions/plans` — 플랜 목록 조회, **`@Public()` 데코레이터 누락** → 글로벌 JwtAuthGuard에 의해 401 반환
- `GET /subscriptions` — 구독 조회, 없으면 `{ success: true, data: null }` 반환
- `GET /subscriptions/tokens` — 토큰 조회, 구독 없으면 빈 배열
- `GET /subscriptions/storage` — 스토리지 조회, 없으면 `{ success: true, data: null }`

**Subscription Service** (`apps/api/src/domain/subscription/service/subscription.service.ts`)
- `createFreeSubscription(entId)` 메서드 존재 — FREE 구독 + 스토리지 + BASE 토큰 일괄 생성
- 그러나 **자동 호출되는 곳이 없음** — 수동으로 호출해야만 FREE 구독이 생성됨

### 2.3 스테이징 DB 현황

| 테이블 | 건수 | 비고 |
|--------|------|------|
| `amb_sub_plans` | 3건 | FREE/BASIC/PREMIUM 시드 완료 |
| `amb_sub_subscriptions` | **0건** | 구독 레코드 없음 |
| `amb_sub_token_wallets` | **0건** | 토큰 월렛 없음 |
| `amb_sub_storage_quotas` | **0건** | 스토리지 쿼터 없음 |
| `amb_users` (활성 법인) | 10+개 | 다수의 법인(company_id) 존재 |

### 2.4 근본 원인

1. **FREE 구독 자동 생성 미연결**: 법인 생성 시점이나 첫 접속 시 `createFreeSubscription()` 호출이 없음
2. **`GET /plans` 인증 이슈**: 글로벌 JwtAuthGuard 때문에 `@Public()` 없으면 401
3. **프론트 에러 핸들링 부족**: 구독 미존재 시 토큰/스토리지 탭이 에러 대신 안내 표시해야 함
4. **결제 방식 미분리**: Polar 직접 호출만 존재, PG 선택 레이어 없음

---

## 3. TO-BE 요구사항

### R1. 가격플랜(Pricing) 탭 추가

| 항목 | 내용 |
|------|------|
| 탭 | 기존 3탭(Plan/Tokens/Storage) 앞에 "가격플랜" (Pricing) 탭 추가 → 4탭 구조 |
| UI | 3개 플랜 카드 (FREE / BASIC / PREMIUM) 가로 나열 |
| 현재 플랜 표시 | 사용 중인 플랜에 "Current Plan" 뱃지 |
| 업그레이드 | FREE → BASIC 업그레이드 CTA 버튼 |
| 데이터 소스 | `GET /api/v1/subscriptions/plans` (공개 API) |
| 플랜 카드 내용 | 가격, 토큰(1회/월), 스토리지, 최대 사용자 수 |

### R2. 업그레이드 결제 방식 선택 모달

| 항목 | 내용 |
|------|------|
| 트리거 | "Upgrade to BASIC" 버튼 클릭 시 |
| UI | 모달 다이얼로그 — 결제 수단 선택 |
| 옵션 | Polar (기본, 글로벌), 토스페이먼츠 (한국), MegaPay (베트남) |
| PG 미구현 시 | Toss/MegaPay 선택 시 "준비 중" 안내, Polar만 실제 동작 |
| 기본 동작 | Polar 선택 → 기존 checkout 흐름 유지 (새 탭에서 Polar 결제 페이지) |

### R3. 구독 첫 접근 시 FREE 자동 생성

| 항목 | 내용 |
|------|------|
| 시점 | `GET /subscriptions` 호출 시 구독 미존재 → 자동으로 FREE 구독 생성 |
| 생성 내용 | 구독(ACTIVE, FREE) + 스토리지 쿼터(1GB) + BASE 토큰 월렛(50,000) |
| 결과 | 프론트에서 항상 유효한 구독 데이터 수신 → 토큰/스토리지 에러 해결 |
| 기존 법인 | 마이그레이션 SQL로 모든 기존 법인에 FREE 구독 일괄 생성 |

### R4. 토큰/스토리지 에러 개선

| 항목 | 내용 |
|------|------|
| 토큰 탭 | 구독 미존재 시 에러 대신 "FREE 구독을 시작하면 50,000 토큰이 지급됩니다" 안내 |
| 스토리지 탭 | 구독 미존재 시 "FREE 구독을 시작하면 1GB 스토리지가 제공됩니다" 안내 |
| R3 구현 후 | 실질적으로 이 상태가 발생하지 않게 됨 (자동 생성으로 해결) |

### R5. `GET /subscriptions/plans` 인증 수정

| 항목 | 내용 |
|------|------|
| 변경 | `@Public()` 데코레이터 추가하여 인증 없이 접근 가능 |
| 사유 | 가격플랜 탭은 로그인 전 공개 정보, portal PlansPage에서도 사용 |

---

## 4. 갭 분석

| # | 항목 | AS-IS | TO-BE | 갭 |
|---|------|-------|-------|----|
| 1 | 탭 구조 | 3탭 (Plan/Tokens/Storage) | 4탭 (Pricing/Plan/Tokens/Storage) | 프론트 코드 수정 |
| 2 | 플랜 목록 API | `GET /plans` 존재, `@Public()` 누락 | `@Public()` 추가 | 백엔드 1줄 수정 |
| 3 | 결제 선택 | Polar 직접 호출 | 모달로 PG 선택 후 결제 | 프론트 모달 신규 |
| 4 | FREE 자동 생성 | 수동만 (호출 코드 없음) | 구독 조회 시 자동 생성 | 백엔드 로직 수정 |
| 5 | 기존 법인 데이터 | subscriptions 0건 | 모든 법인 FREE 구독 | DB 마이그레이션 |
| 6 | 토큰 에러 | 구독 없으면 에러 가능 | graceful 안내 메시지 | 프론트 에러 처리 |
| 7 | 스토리지 에러 | "로드 실패" 표시 | graceful 안내 메시지 | 프론트 에러 처리 |

---

## 5. 사용자 플로우

### 플로우 1: 가격플랜 탭 → 업그레이드

```
1. 사용자가 /entity-settings/subscription 접속
2. "Pricing" 탭 (기본 활성) → 3개 플랜 카드 표시
3. 현재 FREE 플랜 → "Current Plan" 뱃지
4. "Upgrade to BASIC" 클릭
5. 결제 방식 선택 모달 열림
   ├─ Polar 선택 → 새 탭에서 Polar checkout
   ├─ 토스페이먼츠 → "준비 중" 안내
   └─ MegaPay → "준비 중" 안내
6. Polar 결제 완료 → 구독 ACTIVE(BASIC)으로 갱신
```

### 플로우 2: 첫 접속 (구독 미존재)

```
1. 사용자가 /entity-settings/subscription 첫 접속
2. GET /subscriptions → 구독 없음 감지
3. 자동으로 createFreeSubscription(entId) 호출
4. FREE 구독 + 스토리지(1GB) + 토큰(50,000) 자동 생성
5. 생성된 구독 데이터 반환
6. 프론트에서 정상 표시 (에러 없음)
```

---

## 6. 기술 제약사항

| 제약 | 설명 | 대응 |
|------|------|------|
| 글로벌 JwtAuthGuard | `GET /plans`에 `@Public()` 필수 | 데코레이터 추가 |
| DB synchronize 비활성 | 스테이징/프로덕션 수동 SQL 필수 | 마이그레이션 SQL 준비 |
| Toss/MegaPay 미구현 | Phase 2-4 (작업계획서 참조) 미완료 | 모달에서 "준비 중" 표시 |
| 법인 식별 | `amb_users.usr_company_id`가 entity ID | 기존 패턴 준수 |
| 동시성 | 자동 FREE 생성 시 duplicate 방지 | UNIQUE(ent_id) 제약 + try-catch |
