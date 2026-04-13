# 계약 데이터 마이그레이션 작업 계획서

**작업일**: 2026-02-18
**기반 문서**: `docs/analysis/contract-data-migration-analysis.md`

---

## 1. 작업 목표

Excel 파일(`reference/Amoeba Vietnam_계약 관리 - Quản lý hợp đồng.xlsx`)의 계약 데이터를 스테이징 서버의 거래처 관리 시스템에 마이그레이션한다.

---

## 2. 작업 단계

### Phase 1: 스테이징 환경 준비

| 단계 | 작업 | 상태 |
|------|------|------|
| 1-1 | MenuConfigEntity/UserMenuPermissionEntity 누락 수정 | ✅ 완료 |
| 1-2 | 스테이징 재빌드 및 API 정상 확인 | 🔄 진행 중 |
| 1-3 | Entity ID (HrEntity) 확인/생성 | ⬜ 대기 |

### Phase 2: 데이터 마이그레이션 스크립트 작성

| 단계 | 작업 | 설명 |
|------|------|------|
| 2-1 | Partner 데이터 생성 스크립트 | 55개+ 업체를 Partner로 등록 |
| 2-2 | Contract 데이터 생성 스크립트 | Client + Outsourcing + 총무 계약 등록 |
| 2-3 | BillingDocument 데이터 생성 스크립트 | 계약서 파일명을 Document로 등록 |
| 2-4 | SOW 데이터 생성 스크립트 | SOW 시트에서 SOW 레코드 등록 |

### Phase 3: 스크립트 실행 및 검증

| 단계 | 작업 |
|------|------|
| 3-1 | 스테이징 API를 통해 데이터 입력 |
| 3-2 | 데이터 정합성 검증 (건수, 필드값) |
| 3-3 | 웹 UI에서 거래처/계약 목록 확인 |

### Phase 4: 문서화

| 단계 | 작업 |
|------|------|
| 4-1 | 구현 기록 작성 (`docs/implementation/`) |
| 4-2 | 테스트 결과 작성 (`docs/test/`) |

---

## 3. 기술 구현 방법

### 3.1 데이터 입력 방식: SQL 직접 삽입

스테이징 API가 인증(JWT) 필요하므로, PostgreSQL에 직접 SQL INSERT로 데이터를 입력한다.

```bash
docker exec amb-postgres-staging psql -U amb_user -d db_amb -f /path/to/seed.sql
```

### 3.2 데이터 생성 순서

1. **Entity** 확인 (HrEntity 존재 여부)
2. **Partner** 생성 (55개+ 업체)
3. **Contract** 생성 (Partner ID 참조)
4. **BillingDocument** 생성 (Contract ID 참조)
5. **SOW** 생성 (Contract ID 참조)

### 3.3 SQL 스크립트 구조

```sql
-- 1. Entity ID 확인
SELECT ent_id FROM amb_hr_entities WHERE ent_name LIKE '%Amoeba%Vietnam%';

-- 2. Partners
INSERT INTO amb_bil_partners (ptn_id, ent_id, ptn_code, ptn_type, ...)
VALUES (gen_random_uuid(), :ent_id, 'CRM', 'CLIENT', ...);

-- 3. Contracts
INSERT INTO amb_bil_contracts (ctr_id, ent_id, ptn_id, ctr_direction, ...)
VALUES (gen_random_uuid(), :ent_id,
  (SELECT ptn_id FROM amb_bil_partners WHERE ptn_code = 'CRM'),
  'RECEIVABLE', ...);

-- 4. Documents
INSERT INTO amb_bil_documents (doc_id, ent_id, doc_ref_type, doc_ref_id, ...)
VALUES (gen_random_uuid(), :ent_id, 'CONTRACT',
  (SELECT ctr_id FROM amb_bil_contracts WHERE ctr_title = '...'),
  'SIGNED_CONTRACT', '(CREMA_Amoeba) 용역계약서.pdf');
```

---

## 4. 데이터 매핑 상세

### 4.1 Partner 생성 규칙

- `ptnCode`: 대문자 약어 3~5자 (고유)
- `ptnType`: 시트에 따라 자동 결정
  - Client 시트 → CLIENT (Amoeba Company는 AFFILIATE)
  - Outsourcing 시트 → OUTSOURCING
  - 총무 시트 → GENERAL_AFFAIRS
- `ptnCompanyName`: 영문명 (없으면 원본 그대로)
- `ptnCompanyNameLocal`: 한국어/베트남어명
- `ptnDefaultCurrency`: 주로 사용하는 통화
- `ptnStatus`: ACTIVE

### 4.2 Contract 생성 규칙

- `ctrDirection`: Client=RECEIVABLE, Outsourcing=PAYABLE, 총무=PAYABLE
- `ctrCategory`: Excel A열 매핑
  - Tech BPO → TECH_BPO
  - SI 개발/Dev → SI_DEV
  - Maintenance → MAINTENANCE
  - 관리/Consulting/총무 → OTHER
- `ctrType`: 계약 유형 추론
  - 월정액 (USD/month) → FIXED
  - 선금+잔금 → MILESTONE
  - SOW 기반 → USAGE_BASED
  - 일회성 → AD_HOC
- `ctrStatus`: F열 + Note 종합
  - Signed + 기간 내 → ACTIVE
  - Signed + 계약종료 → EXPIRED
  - Pending → DRAFT
  - Liquidation 있음 → LIQUIDATED
- `ctrNote`: J열 계약서 파일명 + O열 비고 통합

### 4.3 Document 생성 규칙

J/K열의 파일명을 분석하여 docType 자동 분류:
- `*계약서*`, `*contract*` → SIGNED_CONTRACT
- `*부속합의서*`, `*Appendix*`, `*Annex*` → APPENDIX
- `*SOW*`, `*Statement of Work*` → SOW
- `*minutes of acceptance*`, `*Liquidation*`, `*nghiệm thu*` → ACCEPTANCE_MINUTES
- 기타 → OTHER

---

## 5. 예상 데이터 건수

| 대상 | 건수 |
|------|------|
| Partner | ~55개 |
| Contract (Client) | ~46건 |
| Contract (Outsourcing) | ~24건 |
| Contract (총무) | ~44건 |
| BillingDocument | ~150건+ |
| SOW | ~30건 |

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Entity ID 미존재 | 전체 작업 불가 | seed 데이터로 Entity 생성 |
| 동일 업체 다중 시트 출현 | Partner 중복 | 코드 기반 중복 체크 |
| 금액 파싱 실패 | 계약금 누락 | 0으로 설정 후 수동 보정 |
| 날짜 형식 불일치 | 기간 오류 | 다중 포맷 파서 적용 |
