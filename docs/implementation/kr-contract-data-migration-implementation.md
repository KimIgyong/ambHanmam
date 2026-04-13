# 한국법인(KR01) 계약 데이터 마이그레이션 구현 보고서

**작업일**: 2026-02-18
**기반 문서**: `docs/analysis/kr-contract-data-migration-analysis.md`, `docs/plan/kr-contract-data-migration-plan.md`

---

## 1. 구현 요약

Excel 파일(`reference/Amoeba Korea_계약 관리 - Contract Management.xlsx`)의 계약 데이터를 스테이징 서버에 마이그레이션 완료.

| 작업 | 상태 |
|------|------|
| 누락 파트너 추가 (3건) | ✅ 완료 |
| partner-seed.service.ts 업데이트 | ✅ 완료 |
| SQL 마이그레이션 스크립트 작성/실행 | ✅ 완료 |
| 데이터 정합성 검증 | ✅ 완료 |

---

## 2. 데이터 입력 결과

### 2.1 파트너 (amb_bil_partners)

| 구분 | 건수 |
|------|------|
| 기존 시드 (PartnerSeedService) | 13 |
| SQL 추가 (GBC, WSA, ADM) | 3 |
| **합계** | **16** |

**유형별 분포**:
- CLIENT: 10 (ERM, IVY, SVN, DYC, MJC, HYJ, GNS, NST, RDB, GBC, WSA)
- PARTNER: 1 (AMBVN)
- OUTSOURCING: 3 (CRL, BNK, TFN)
- GENERAL_AFFAIRS: 1 (ADM)

### 2.2 계약 (amb_bil_contracts)

| 방향 | 건수 |
|------|------|
| RECEIVABLE (매출) | 12 |
| PAYABLE (매입) | 7 |
| **합계** | **19** |

**카테고리별 분포**:

| 방향 | 카테고리 | 건수 |
|------|---------|------|
| RECEIVABLE | TECH_BPO | 1 |
| RECEIVABLE | SI_DEV | 5 |
| RECEIVABLE | MAINTENANCE | 5 |
| RECEIVABLE | OTHER | 1 |
| PAYABLE | TECH_BPO | 2 |
| PAYABLE | SI_DEV | 3 |
| PAYABLE | MARKETING | 1 |
| PAYABLE | OTHER | 1 |

**상태별 분포**:

| 상태 | 건수 | 설명 |
|------|------|------|
| ACTIVE | 3 | 현재 진행 중 (Happy Talk BPO, 링크맘 유지보수 2025, RT 유지보수) |
| EXPIRED | 4 | 기간 만료 (유지보수 계약 3건, AMBVN SOW 기본계약) |
| LIQUIDATED | 12 | 완료/청산 (SI 프로젝트 + 단기 계약) |

### 2.3 통화별 분포

| 통화 | 건수 | 비고 |
|------|------|------|
| USD | 12 | 주요 거래 통화 |
| KRW | 6 | 국내 거래 |
| VND | 1 | BNK 광고홍보 |

---

## 3. 수정된 파일

### 신규 생성 (1개)
- `scripts/seed-kr-contracts.sql` — KR01 SQL 마이그레이션 스크립트

### 수정 (1개)
- `apps/api/src/domain/billing/service/partner-seed.service.ts` — KR_CLIENTS에 GBC/WSA 추가, KR_GA 배열 신규 생성

### 문서 (4개)
- `docs/analysis/kr-contract-data-migration-analysis.md` — 요구사항 분석
- `docs/plan/kr-contract-data-migration-plan.md` — 작업 계획서
- `docs/implementation/kr-contract-data-migration-implementation.md` — 이 문서
- `docs/test/kr-contract-data-migration-test.md` — 테스트 보고서

---

## 4. 기술적 결정 사항

1. **VN 마이그레이션과 동일한 SQL 직접 입력 방식** 채택
2. **계약서 파일명은 `ctr_note`에 통합 저장**: Excel K열(계약서 사본)과 관련 정보 포함
3. **단건 계약의 종료일**: 체결일 + 1개월로 추정 설정 (IVY Survey Plugin, Shopify 연동, ADM 총무)
4. **월정액 금액**: `ctr_amount`에 월 금액 저장, `ctr_billing_period = 'MONTHLY'`
5. **AMBVN SOW 기본계약**: 5회 결제 합계 55,000 USD를 `ctr_amount`에 저장, 결제 내역은 note에 기록
6. **RoundTable 연간 유지보수**: `ctr_billing_period = 'YEARLY'`, 1년 기간 설정 (2025.11~2026.11)

---

## 5. VN 마이그레이션과의 비교

| 항목 | VN01 | KR01 |
|------|------|------|
| 파트너 | 68 | 16 |
| 계약 | 61 | 19 |
| RECEIVABLE | 41 | 12 |
| PAYABLE | 20 | 7 |
| 주요 통화 | USD/VND | USD/KRW |
| ACTIVE 계약 | 7 | 3 |
