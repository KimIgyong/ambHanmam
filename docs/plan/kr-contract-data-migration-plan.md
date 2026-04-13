# 한국법인(KR01) 계약 데이터 마이그레이션 계획

**작업일**: 2026-02-18
**기반 문서**: `docs/analysis/kr-contract-data-migration-analysis.md`

---

## 1. 작업 범위

- 파트너 3개 추가 (가비아씨엔에스, 위사, ADAM ASSOCIATION)
- 계약 19건 등록 (RECEIVABLE 12 + PAYABLE 6 + 총무 1)
- partner-seed.service.ts 업데이트 (향후 배포용)
- SQL 스크립트로 스테이징 DB 직접 입력

---

## 2. 작업 단계

### Phase 1: 파트너 데이터 보강
1. `partner-seed.service.ts`의 `KR_CLIENTS`에 GBC(가비아씨엔에스), WSA(위사) 추가
2. `KR_GA` 배열 신규 생성 → ADM(ADAM ASSOCIATION) 추가
3. SQL로 스테이징 DB에 누락 파트너 3건 INSERT

### Phase 2: 계약 데이터 입력
1. SQL 스크립트 `scripts/seed-kr-contracts.sql` 생성
2. RECEIVABLE 12건 INSERT
3. PAYABLE 6건 INSERT
4. 총무 1건 INSERT
5. 계약서 파일 정보는 `ctr_note`에 통합 저장

### Phase 3: 데이터 검증
1. 파트너-계약 참조 무결성
2. 상태값 유효성
3. 날짜 일관성
4. 방향/카테고리별 건수 확인

### Phase 4: 문서화
1. 구현 보고서 작성
2. 테스트 보고서 작성

---

## 3. 상태 결정 기준

| 계약 | 기간 | 상태 | 근거 |
|------|------|------|------|
| Happy Talk BPO | ~2026.07 | ACTIVE | 진행 중 |
| 링크맘 API 구축 | ~2024.03 | LIQUIDATED | SI 프로젝트 완료 |
| Arria Brand site | ~2025.06 | LIQUIDATED | SI 프로젝트 완료 |
| Etleé Brand site | ~2025.10 | LIQUIDATED | SI 프로젝트 완료 |
| RT Survey Plugin | 2025.10 단건 | LIQUIDATED | 단건 완료 |
| Shopify 회원 연동 | 2025.11 단건 | LIQUIDATED | 단건 완료 |
| 가비아 유지보수 | ~2024.12 | EXPIRED | 기간 만료 |
| 링크맘 유지보수 2024 | ~2025.04 | EXPIRED | 기간 만료 |
| 위사 유지보수 | ~2024.11 | EXPIRED | 기간 만료 |
| 링크맘 유지보수 2025 | ~2026.04 | ACTIVE | 진행 중 |
| RT 연간 유지보수 | 2025.11~ | ACTIVE | 진행 중 |
| Serveone Talk | ~2025.01 | LIQUIDATED | 완료 |
| CRL 업무대행 | ~2025.01 | LIQUIDATED | 완료 |
| TFN Diary App | ~2024.07 | LIQUIDATED | 완료 |
| AMBVN SOW 기본계약 | ~2025.03 | EXPIRED | 기간 만료 |
| AMBVN 아메바샵 | ~2024.03 | LIQUIDATED | 완료 |
| AMBVN Talk 개발 | ~2024.03 | LIQUIDATED | 완료 |
| BNK 광고홍보 | ~2025.01 | LIQUIDATED | 완료 |
| ADM 총무 컨설팅 | 2023.11 단건 | LIQUIDATED | 완료 |

---

## 4. 기술적 결정

1. **VN 마이그레이션과 동일한 SQL 직접 입력 방식** 채택
2. **계약서 파일명은 `ctr_note`에 저장** (실물 파일 없이 Document 레코드 미생성)
3. **단건 계약의 종료일**: 체결일 + 1개월로 설정
4. **월정액 금액**: `ctr_amount`에 월 금액 저장, `ctr_billing_period = 'MONTHLY'`
5. **SOW 기본계약**: 총 결제 합계를 `ctr_amount`에 저장, 개별 결제 내역은 note에 기록
