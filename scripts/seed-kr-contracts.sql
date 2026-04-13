-- ============================================================
-- 한국법인(KR01) 계약 데이터 마이그레이션
-- 작업일: 2026-02-18
-- 원본: reference/Amoeba Korea_계약 관리 - Contract Management.xlsx
-- ============================================================

\set kr_ent_id '7ab1e7ca-513c-43d2-9209-f01233e37661'

-- ============================================================
-- 1. 누락 파트너 추가 (3건)
-- ============================================================

-- 가비아씨엔에스
INSERT INTO amb_bil_partners (ent_id, ptn_code, ptn_type, ptn_company_name, ptn_company_name_local, ptn_country, ptn_default_currency)
SELECT :'kr_ent_id', 'GBC', 'CLIENT', 'Gabia CNS', '(주) 가비아씨엔에스', 'KR', 'KRW'
WHERE NOT EXISTS (SELECT 1 FROM amb_bil_partners WHERE ent_id = :'kr_ent_id' AND ptn_code = 'GBC');

-- 위사
INSERT INTO amb_bil_partners (ent_id, ptn_code, ptn_type, ptn_company_name, ptn_company_name_local, ptn_country, ptn_default_currency)
SELECT :'kr_ent_id', 'WSA', 'CLIENT', 'Wisa Co., Ltd', '(주) 위사', 'KR', 'KRW'
WHERE NOT EXISTS (SELECT 1 FROM amb_bil_partners WHERE ent_id = :'kr_ent_id' AND ptn_code = 'WSA');

-- ADAM ASSOCIATION (총무)
INSERT INTO amb_bil_partners (ent_id, ptn_code, ptn_type, ptn_company_name, ptn_country, ptn_default_currency)
SELECT :'kr_ent_id', 'ADM', 'GENERAL_AFFAIRS', 'ADAM ASSOCIATION', 'VN', 'USD'
WHERE NOT EXISTS (SELECT 1 FROM amb_bil_partners WHERE ent_id = :'kr_ent_id' AND ptn_code = 'ADM');

-- 확인
SELECT ptn_code, ptn_company_name, ptn_type FROM amb_bil_partners
WHERE ent_id = :'kr_ent_id' ORDER BY ptn_code;

-- ============================================================
-- 2. RECEIVABLE (매출) 계약 12건
-- ============================================================

-- R01: Tech BPO - amoeba co.,ltd (AMBVN) - Happy Talk Basic Contract
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_auto_renew, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'TECH_BPO', 'SERVICE',
  'Basic Contract For Request Work (Happy Talk)',
  '2025-08-01', '2026-07-31', 3000.00, 'USD', 'ACTIVE', true, 'MONTHLY',
  '3,000 USD/month. 계약서: (AMB KR x AMB VN) Basic Contract_250801_signed.pdf, SOW: ambvn x amoebacompany_SOW(20250801)_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'AMBVN';

-- R02: SI Dev - 일상의감동 (ERM) - 링크맘 API 구축
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'SI_DEV', 'PROJECT',
  '링크맘서비스 - 두손 스낵아일랜드 연동 API 서버 구축',
  '2023-11-20', '2024-03-20', 36000000.00, 'KRW', 'LIQUIDATED',
  '선금 10,800,000원 + 잔금 10,800,000원 + 3차 14,400,000원 = 36,000,000원. 계약서: [링크맘+Amoeba] API 구축 용역계약서_20231120_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'ERM';

-- R03: SI Dev - Red Beauty (RDB) - Arria Online Brand site
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'SI_DEV', 'PROJECT',
  'Arria Online Brand site 구축',
  '2025-04-10', '2025-06-25', 10875.00, 'USD', 'LIQUIDATED',
  '선금 5,437.5 USD + 잔금 5,437.5 USD = 10,875 USD (VAT: 0%). 계약서: (AMB KR) Red beauty contract_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'RDB';

-- R04: SI Dev - IVY ENTERPRISE (IVY) - Etleé Online Brand site
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'SI_DEV', 'PROJECT',
  'Etleé Online Brand site 구축',
  '2025-08-18', '2025-10-18', 9700.00, 'USD', 'LIQUIDATED',
  '선금 4,850 USD + 잔금 4,850 USD = 9,700 USD (VAT: 0%). 계약서: ambKR_etlee_contract_20250826_scan-A.pdf, ambKR_etlee_contract_20250826_scan-B.pdf, (AMBKR) Etlee Service Contract_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'IVY';

-- R05: SI Dev - IVY ENTERPRISE (IVY) - RoundTable Survey Plugin 변경
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'SI_DEV', 'PROJECT',
  'RoundTable Survey Plugin 변경 개발',
  '2025-10-28', '2025-11-28', 1500.00, 'USD', 'LIQUIDATED',
  '1,500 USD (VAT: 0%). 계약서: (AMB KR x IVY) Service Contract_Roundtable_Survey tool 변경 개발.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'IVY';

-- R06: SI Dev - IVY ENTERPRISE (IVY) - Shopify 회원 연동
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'SI_DEV', 'PROJECT',
  'Shopify 기반 웹사이트(ivyusa.com) - Roundtable 회원 로그인 통합',
  '2025-11-11', '2025-12-11', 2375.00, 'USD', 'LIQUIDATED',
  '2,375 USD (VAT: 0%). 계약서: (AMB KR x IVY) 업무대행에 대한 기본계약서_Shopify 회원 연동 (Roundtable).pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'IVY';

-- R07: Maintenance - 가비아씨엔에스 (GBC) - API 서버 유지보수
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'MAINTENANCE', 'SERVICE',
  '가비아씨엔에스 API 서버 설계 구축 및 유지보수',
  '2024-07-01', '2024-12-31', 5000000.00, 'KRW', 'EXPIRED', 'MONTHLY',
  '5,000,000원/월 (VAT 별도). 월말에 세금계산서 발행. 계약서: 가비아_아메바_용역계약서 (최종_20240701).pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'GBC';

-- R08: Maintenance - 일상의감동 (ERM) - 링크맘 유지보수 2024
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'MAINTENANCE', 'SERVICE',
  '링크맘 API 서버 유지보수 및 서비스 개발 지원 (2024)',
  '2024-05-01', '2025-04-30', 2300000.00, 'KRW', 'EXPIRED', 'MONTHLY',
  '2,300,000원/월 (VAT 별도). 월말에 세금계산서 발행. 계약서: 일상의감동+아메바컴퍼니_용역표준계약서(기본계약+SOW)_20240422.docx'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'ERM';

-- R09: Maintenance - 위사 (WSA) - API 서버 유지보수
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'MAINTENANCE', 'SERVICE',
  '위사 API 서버 설계 구축 및 유지보수',
  '2023-12-01', '2024-11-30', 4500000.00, 'KRW', 'EXPIRED', 'MONTHLY',
  '4,500,000원/월 (VAT 별도). 매월 1일에 세금계산서 발행. 계약서: 위사_아메바_용역계약서 (20231127)_final.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'WSA';

-- R10: Maintenance - 일상의감동 (ERM) - 링크맘 유지보수 2025
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'MAINTENANCE', 'SERVICE',
  '링크맘 API 서버 유지보수 및 서비스 개발 지원 (2025)',
  '2025-05-01', '2026-04-30', 1125000.00, 'KRW', 'ACTIVE', 'MONTHLY',
  '1,125,000원/월 (VAT 별도). 계약서: 일상의감동+아메바컴퍼니_용역표준계약서(기본계약+SOW)_202504_v1.docx'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'ERM';

-- R11: Maintenance - IVY ENTERPRISE (IVY) - RoundTable 연간 유지보수
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'MAINTENANCE', 'SERVICE',
  'RoundTable 연간 유지보수',
  '2025-11-03', '2026-11-02', 5000.00, 'USD', 'ACTIVE', 'YEARLY',
  '5,000 USD (VAT: 0%). 계약서: (AMB KR x IVY) 업무대행에 대한 기본계약서_Roundtable 연간 유지보수.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'IVY';

-- R12: Other - Serveone (SVN) - Amoeba Talk service
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'RECEIVABLE', 'OTHER', 'PROJECT',
  'Amoeba Talk Service',
  '2024-08-09', '2025-01-08', 500.00, 'USD', 'LIQUIDATED',
  '500 USD. 계약서: 20240809_Serveone-Amoeba_AmoebaTalk Service contract_signed.pdf. 인수인계: (Serveone_AMB company) Contract Acceptance Minutes_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'SVN';

-- ============================================================
-- 3. PAYABLE (매입) 계약 6건
-- ============================================================

-- P01: TECH_BPO - Creative Lab (CRL) - 업무대행 기본계약서
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'TECH_BPO', 'SERVICE',
  '업무대행에 대한 기본계약서 (SOW) - Creative Lab',
  '2024-08-01', '2025-01-31', 9000.00, 'USD', 'LIQUIDATED',
  '2024.08.12~2024.10.12: 9,000 USD. 베트남 계약서 원본 보관 중. 계약서: 20240801_CreavtiveLab-Amoeba_Basic Contract_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'CRL';

-- P02: SI_DEV - Tech Fashion (TFN) - Amoeba Diary App
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'SI_DEV', 'PROJECT',
  'Amoeba Diary App 개발',
  '2024-06-18', '2024-07-17', 2812.00, 'USD', 'LIQUIDATED',
  '선금 1,406 USD + 잔금 1,406 USD = 2,812 USD. 베트남 계약서 원본 보관 중. 계약서: TechFashion_Amoeba Diary dev contract_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'TFN';

-- P03: TECH_BPO - amoeba co.,ltd (AMBVN) - 업무대행 기본계약서 (SOW 다건)
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_billing_period, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'TECH_BPO', 'SERVICE',
  '업무대행에 대한 기본계약서 (SOW) - amoeba co.,ltd',
  '2024-03-21', '2025-03-20', 55000.00, 'USD', 'EXPIRED', 'MONTHLY',
  'SOW 결제 내역: 2024.03~06: 30,000 USD / 2024.06: 10,000 USD / 2024.08~09: 7,000 USD / 2024.09~10: 5,000 USD / 2024.11~12: 3,000 USD = 합계 55,000 USD. 계약서: Basic Contract_for_amoebacompany_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'AMBVN';

-- P04: SI_DEV - amoeba co.,ltd (AMBVN) - 아메바샵 업그레이드
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'SI_DEV', 'PROJECT',
  '아메바샵 업그레이드',
  '2023-12-01', '2024-03-31', 34500.00, 'USD', 'LIQUIDATED',
  '34,500 USD. 계약서: (Amoeba Company) Software Service Contract_amoebashop dev_amb signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'AMBVN';

-- P05: SI_DEV - amoeba co.,ltd (AMBVN) - amoeba Talk 개발
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'SI_DEV', 'PROJECT',
  'amoeba Talk 소프트웨어 개발',
  '2023-11-08', '2024-03-31', 35000.00, 'USD', 'LIQUIDATED',
  '35,000 USD. 계약서: (Amoeba Company) Software Service Contract_Amoeba Talk Dev_amb signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'AMBVN';

-- P06: MARKETING - Brand New K (BNK) - 광고홍보 콘텐츠
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'MARKETING', 'PROJECT',
  '광고홍보 콘텐츠 기획 및 제작',
  '2024-11-05', '2025-01-31', 120000000.00, 'VND', 'LIQUIDATED',
  '120,000,000 VND. 베트남 계약서 원본 보관 중. 계약서: Amoeba_Brand New K_Service contract_signed.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'BNK';

-- ============================================================
-- 4. 총무 계약 1건
-- ============================================================

-- GA01: OTHER - ADAM ASSOCIATION (ADM) - Consulting
INSERT INTO amb_bil_contracts (ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_note)
SELECT :'kr_ent_id', p.ptn_id, 'PAYABLE', 'OTHER', 'PROJECT',
  'Consulting services related to transfering capital contribution',
  '2023-11-14', '2023-12-14', 2500.00, 'USD', 'LIQUIDATED',
  '2,500 USD. 계약서: ★ RA_AMOEBA_AA_transfer capital contribution.pdf'
FROM amb_bil_partners p WHERE p.ent_id = :'kr_ent_id' AND p.ptn_code = 'ADM';

-- ============================================================
-- 5. 검증 쿼리
-- ============================================================

SELECT '== 파트너 현황 ==' AS info;
SELECT COUNT(*) AS total_partners FROM amb_bil_partners WHERE ent_id = :'kr_ent_id';

SELECT '== 계약 현황 ==' AS info;
SELECT COUNT(*) AS total_contracts FROM amb_bil_contracts WHERE ent_id = :'kr_ent_id';

SELECT '== 방향별 분류 ==' AS info;
SELECT ctr_direction, COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'kr_ent_id' GROUP BY ctr_direction ORDER BY ctr_direction;

SELECT '== 카테고리별 분류 ==' AS info;
SELECT ctr_direction, ctr_category, COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'kr_ent_id' GROUP BY ctr_direction, ctr_category ORDER BY ctr_direction, ctr_category;

SELECT '== 상태별 분류 ==' AS info;
SELECT ctr_status, COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'kr_ent_id' GROUP BY ctr_status ORDER BY ctr_status;
