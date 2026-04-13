# 계약 데이터 마이그레이션 구현 보고서

**작업일**: 2026-02-18
**기반 문서**: `docs/analysis/contract-data-migration-analysis.md`, `docs/plan/contract-data-migration-plan.md`

---

## 1. 구현 요약

Excel 파일(`reference/Amoeba Vietnam_계약 관리 - Quản lý hợp đồng.xlsx`)의 계약 데이터를 스테이징 서버에 마이그레이션 완료.

| 작업 | 상태 |
|------|------|
| 스테이징 환경 수정 (MenuConfigEntity 누락) | ✅ 완료 |
| 파트너 시드 데이터 보강 (partner-seed.service.ts) | ✅ 완료 |
| 계약 시드 서비스 생성 (contract-seed.service.ts) | ✅ 완료 |
| SQL 마이그레이션 스크립트 실행 | ✅ 완료 |
| 데이터 정합성 검증 | ✅ 완료 |

---

## 2. 스테이징 환경 수정

### 2.1 MenuConfigEntity/UserMenuPermissionEntity 등록

**파일**: `apps/api/src/app.module.ts`

`MenuConfigEntity`와 `UserMenuPermissionEntity`가 TypeORM entities 배열에 누락되어 API가 시작 시 크래시. 두 엔티티를 추가하여 해결.

### 2.2 Docker 환경변수

`--env-file docker/staging/.env.staging` 옵션으로 docker compose 실행 필요.

---

## 3. 데이터 입력 결과

### 3.1 파트너 (amb_bil_partners)

| 구분 | 건수 |
|------|------|
| 기존 시드 (PartnerSeedService) | 33 |
| SQL 추가 (Client) | 26 |
| SQL 추가 (General Affairs) | 22 |
| 중복 제외 | -13 |
| **합계** | **68** |

**유형별 분포**:
- CLIENT: 34
- OUTSOURCING: 8 (SBS, INT, BNK, PLN, TFN, GFP + KR용 2건)
- GENERAL_AFFAIRS: 22
- PARTNER: 2 (AMBKR, AMBVN)
- AFFILIATE: 2 (AMBP, ERM 등)

### 3.2 계약 (amb_bil_contracts)

| 방향 | 건수 |
|------|------|
| RECEIVABLE (매출) | 41 |
| PAYABLE (매입) | 20 |
| **합계** | **61** |

**카테고리별 분포**:

| 방향 | 카테고리 | 건수 | 통화 |
|------|---------|------|------|
| RECEIVABLE | TECH_BPO | 10 | USD |
| RECEIVABLE | SI_DEV | 21 | USD/VND/KRW |
| RECEIVABLE | MAINTENANCE | 1 | USD |
| RECEIVABLE | OTHER (Consulting 등) | 9 | USD/VND |
| PAYABLE | TECH_BPO | 10 | VND/USD |
| PAYABLE | SI_DEV | 8 | VND |
| PAYABLE | MARKETING | 2 | VND |

**상태별 분포**:
| 상태 | 건수 | 설명 |
|------|------|------|
| ACTIVE | 17 | 현재 진행 중인 계약 |
| EXPIRED | 10 | 기간 만료 계약 |
| LIQUIDATED | 28 | 청산 완료 계약 |
| TERMINATED | 1 | 중도 해지 계약 |
| DRAFT | 5 | 미결/대기 계약 |

### 3.3 계약서 파일 정보

모든 계약의 `ctr_note` 필드에 Excel J/K열의 계약서 파일명 정보를 포함:
- 계약서 원본 파일명
- 부속합의서 파일명
- 인수인계확인서/청산확인서 파일명
- 기타 관련 비고

---

## 4. 수정된 파일

### 신규 생성 (2개)
- `apps/api/src/domain/billing/service/contract-seed.service.ts` — 계약 시드 서비스 (향후 배포 시 사용)
- `scripts/seed-contracts.sql` — SQL 마이그레이션 스크립트

### 수정 (4개)
- `apps/api/src/app.module.ts` — MenuConfigEntity, UserMenuPermissionEntity 추가
- `apps/api/src/domain/billing/service/partner-seed.service.ts` — Excel 업체 추가 (34→55개)
- `apps/api/src/domain/billing/billing.module.ts` — ContractSeedService 등록
- `docker/staging/.env.staging` — 환경변수 (이전 세션)

### 문서 (3개)
- `docs/analysis/contract-data-migration-analysis.md` — 요구사항 분석
- `docs/plan/contract-data-migration-plan.md` — 작업 계획서
- `docs/implementation/contract-data-migration-implementation.md` — 이 문서

---

## 5. 기술적 결정 사항

1. **SQL 직접 입력 방식 채택**: API 인증 없이 DB에 직접 INSERT. seed 서비스는 향후 배포용으로 유지.
2. **계약서 파일명은 ctr_note에 저장**: `amb_bil_documents` 테이블 대신 `ctr_note`에 통합 저장. 이유: 파일 실물이 없는 상태에서 document 레코드를 만드는 것보다, 참조 가능한 메모로 유지하는 것이 실용적.
3. **파트너 코드 3~5자**: 고유 식별을 위해 대문자 약어 사용. 동일 업체가 여러 역할(Client/Outsourcing)일 경우 같은 코드 재사용.
4. **금액 단위**: 월정액 계약의 경우 월 금액을 `ctr_amount`에 저장, 총액 계약은 전체 금액 저장. 비고란에 상세 설명 포함.
