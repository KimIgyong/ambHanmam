# PLAN-260406 — Pricing 페이지 개편 작업 계획

## 1. 시스템 개발 현황 분석

### 대상 파일
| 파일 | 상태 | 변경 내용 |
|------|------|----------|
| `apps/portal-web/src/pages/public/PricingPage.tsx` | 전면 개편 | 6개 신규 섹션 추가, 비교표 데이터 갱신 |
| `apps/portal-web/src/locales/ko/common.json` | pricing 키 업데이트 | 신규 섹션 번역 키 추가 |
| `apps/portal-web/src/locales/en/common.json` | pricing 키 업데이트 | 신규 섹션 번역 키 추가 |
| `apps/portal-web/src/locales/vi/common.json` | pricing 키 업데이트 | 신규 섹션 번역 키 추가 |

### 현재 PricingPage 구조 (280줄)
- Hero → Plan Cards(3) → Comparison Table(11행) → FAQ(5) → CTA

## 2. 단계별 구현 계획

### Step 1: 번역 파일 업데이트 (ko → en → vi)
신규 i18n 키 추가:
- `pricing.comparison.*` — 메인 비교표 12행+ (token_reset, storage_cap, storage_base 등)
- `pricing.basic_tiers.*` — BASIC 구간별 상세 테이블
- `pricing.annual.*` — 연간 할인 비교
- `pricing.referral.*` — 레퍼럴 보상
- `pricing.storage_policy.*` — 스토리지 정책
- `pricing.addon.*` — ADD-ON 단가
- `pricing.premium_cases.*` — Premium 견적 케이스

### Step 2: PricingPage.tsx 전면 개편
페이지 섹션 순서:
1. Hero Header (기존 유지)
2. Plan Cards (데이터 갱신)
3. 메인 비교표 (12행 상세)
4. BASIC 구간별 요금 상세
5. 연간 할인 비교
6. ADD-ON 단가
7. 스토리지 정책
8. 레퍼럴 보상
9. Premium 견적 배너
10. FAQ (기존 + 업데이트)
11. Bottom CTA (기존 유지)

### Step 3: 빌드 검증
- `npm run build --workspace=apps/portal-web`

## 3. 사이드 임팩트 분석
- **API/DB 변경 없음** — 순수 프론트엔드 변경
- **다른 페이지 영향 없음** — PricingPage는 독립 페이지
- **번역 키 하위 호환** — 기존 키 유지하면서 신규 키 추가
- **반응형 고려** — TailwindCSS 반응형 클래스 필수

## 4. DB 마이그레이션
없음
