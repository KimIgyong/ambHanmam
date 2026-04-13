-- Contract Data Migration Script
-- Source: reference/Amoeba Vietnam_계약 관리 - Quản lý hợp đồng.xlsx
-- Date: 2026-02-18

-- VN01 Entity ID
\set vn_ent_id '1388e0d8-725a-451c-9397-4c8a9e994081'

-- ============================================
-- 1. INSERT MISSING PARTNERS
-- ============================================

-- Client partners missing from seed
INSERT INTO amb_bil_partners (ptn_id, ent_id, ptn_code, ptn_type, ptn_company_name, ptn_company_name_local, ptn_country, ptn_default_currency, ptn_status, ptn_created_at, ptn_updated_at)
SELECT gen_random_uuid(), :'vn_ent_id', v.code, v.type, v.name, v.name_local, v.country, v.currency, 'ACTIVE', NOW(), NOW()
FROM (VALUES
  ('UNC', 'CLIENT', 'Uneedcomms', '유니드컴즈', 'KR', 'USD'),
  ('OMI', 'CLIENT', 'OMIOS', NULL, 'KR', 'USD'),
  ('SSO', 'CLIENT', 'SISOUL Co., Ltd', '시솔지주', 'KR', 'USD'),
  ('AGG', 'CLIENT', 'Agile Growth', NULL, 'KR', 'USD'),
  ('DED', 'CLIENT', 'DAE DO, INC', NULL, 'US', 'USD'),
  ('IVE', 'CLIENT', 'IVY ENTERPRISES, INC.', NULL, 'US', 'USD'),
  ('SMK', 'CLIENT', 'Smart Kiosk', NULL, 'VN', 'USD'),
  ('ECM', 'CLIENT', 'EchoMarketing', NULL, 'KR', 'USD'),
  ('SVN2', 'CLIENT', 'Serveone Viet Nam', '서브원', 'KR', 'VND'),
  ('SPH', 'CLIENT', 'Song Phuong', NULL, 'VN', 'VND'),
  ('KOI', 'CLIENT', 'KOIPA', '한국IT사업진흥협회', 'KR', 'KRW'),
  ('BDT', 'CLIENT', 'BRIDGETEC CORP', NULL, 'KR', 'USD'),
  ('FDN', 'CLIENT', 'FOODNAMOO', '푸드나무', 'VN', 'VND'),
  ('CNT', 'CLIENT', 'Connectable', NULL, 'KR', 'VND'),
  ('CRH', 'CLIENT', 'Crosshub Inc.', NULL, 'KR', 'KRW'),
  ('GYB', 'CLIENT', 'Gyeongbuk', '경북', 'KR', 'VND'),
  ('CWY', 'CLIENT', 'Coway Co., Ltd', '코웨이', 'KR', 'VND'),
  ('EZW', 'CLIENT', 'Ezwebpia / Gaxago', NULL, 'KR', 'VND'),
  ('MTC', 'CLIENT', 'TDI / Meta Crew', NULL, 'KR', 'VND'),
  ('SMB', 'CLIENT', 'SMD2BOX / SAMJU Trade', '삼주무역', 'KR', 'VND'),
  ('OZS', 'CLIENT', 'OneZeroSoft', NULL, 'KR', 'USD'),
  ('ITV', 'CLIENT', 'INT Vision Co., Ltd', NULL, 'VN', 'VND'),
  ('KSQ', 'CLIENT', 'KSQUARE COMMS. INC.', NULL, 'KR', 'USD'),
  ('NWD', 'CLIENT', 'NEWDEA', NULL, 'KR', 'USD'),
  ('YJP', 'CLIENT', 'YUJINPRODUCT', '유진프로덕트', 'KR', 'VND'),
  ('SBS_C', 'CLIENT', 'SBS (Consulting)', NULL, 'VN', 'VND')
) AS v(code, type, name, name_local, country, currency)
WHERE NOT EXISTS (
  SELECT 1 FROM amb_bil_partners p WHERE p.ent_id = :'vn_ent_id' AND p.ptn_code = v.code
);

-- General Affairs partners missing
INSERT INTO amb_bil_partners (ptn_id, ent_id, ptn_code, ptn_type, ptn_company_name, ptn_country, ptn_default_currency, ptn_status, ptn_created_at, ptn_updated_at)
SELECT gen_random_uuid(), :'vn_ent_id', v.code, 'GENERAL_AFFAIRS', v.name, v.country, v.currency, 'ACTIVE', NOW(), NOW()
FROM (VALUES
  ('PVR', 'Park View Residence', 'VN', 'VND'),
  ('KNC', 'Startup Consulting Co.', 'VN', 'VND'),
  ('VNS', 'VINASUN CORP.', 'VN', 'VND'),
  ('ADM', 'ADAM ASSOCIATION Company', 'VN', 'VND'),
  ('ONS', 'One Step', 'VN', 'VND'),
  ('PNM', 'Phuong Nam Technology', 'VN', 'VND'),
  ('VNP', 'VNPT', 'VN', 'VND'),
  ('MOR', 'MOR', 'VN', 'VND'),
  ('BTF', 'Beetsoft', 'VN', 'VND'),
  ('MPS', 'mPOS / VI MO TECHNOLOGY', 'VN', 'VND'),
  ('NIC', 'NICE', 'KR', 'VND'),
  ('SCM', 'Sacombank', 'VN', 'VND'),
  ('DHL', 'DHL', 'VN', 'VND'),
  ('MBI', 'MBI Solution (HappyTalk)', 'KR', 'KRW'),
  ('LVN', 'Long Van System Solution', 'VN', 'VND'),
  ('HRZ', 'Horizon Real Estate', 'VN', 'VND'),
  ('TDC', 'TRADICONS', 'VN', 'VND'),
  ('PHN', 'PHUC NGUYEN MECHANICAL', 'VN', 'VND'),
  ('TSH', 'The Spring House', 'VN', 'VND'),
  ('APX', 'APEXLAW VIETNAM', 'VN', 'VND'),
  ('MTB', 'Mat Bao', 'VN', 'VND'),
  ('HCC', 'Hydraulic Construction Corp No.4', 'VN', 'VND')
) AS v(code, name, country, currency)
WHERE NOT EXISTS (
  SELECT 1 FROM amb_bil_partners p WHERE p.ent_id = :'vn_ent_id' AND p.ptn_code = v.code
);

-- ============================================
-- 2. INSERT CONTRACTS (Client - RECEIVABLE)
-- ============================================

-- Helper: create contracts using partner code lookup
-- Tech BPO contracts
INSERT INTO amb_bil_contracts (ctr_id, ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_auto_renew, ctr_note, ctr_created_at, ctr_updated_at)
SELECT gen_random_uuid(), :'vn_ent_id', p.ptn_id, v.direction, v.category, v.ctype, v.title, v.start_date::date, v.end_date::date, v.amount, v.currency, v.status, v.auto_renew, v.note, NOW(), NOW()
FROM (VALUES
  -- Tech BPO
  ('CRM', 'RECEIVABLE', 'TECH_BPO', 'FIXED', 'IT technology support: Apply Crema solution on the shopping malls', '2023-05-01', '2026-04-30', 10000, 'USD', 'ACTIVE', true, '10,000 USD/month → 7,000 USD/month from March 2024. 자동 연장. 계약서: (CREMA_Amoeba) 용역계약서.pdf, 부속합의서: (Crema_Amoeba) 부속합의서_signed.pdf'),
  ('UNC', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행에 대한 기본계약서 (SOW)', '2023-06-01', '2024-05-30', 2000, 'USD', 'EXPIRED', false, '계약종료합의서 체결 완료. 계약서: (UneedComms) 용역계약서_signed.pdf'),
  ('OMI', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행에 대한 기본계약서 (SOW)', '2023-08-01', '2024-07-31', 0, 'USD', 'EXPIRED', false, '날인한 계약서에 서명과 인감이 누락됨. 회사 폐업. 계약서: (Amoeba_OMIOS) 용역계약서_수령본.pdf'),
  ('SSO', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행에 대한 기본계약서 (SOW)', '2023-08-23', '2024-08-23', 2300, 'USD', 'EXPIRED', false, '계약서: contract_for_SISOUL_signed.pdf'),
  ('AGG', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행에 대한 기본계약서 (SOW)', '2023-09-15', '2024-09-15', 11500, 'USD', 'EXPIRED', false, '계약서: (Amoeba_AgileGrowth) 용역계약서_signed.pdf'),
  ('ADR', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행 기본계약서 (SOW) - 1차', '2023-10-01', '2024-09-30', 0, 'USD', 'EXPIRED', false, '70USD/case 매월확인. 계약서: (Andar)용역표준계약서_signed.pdf'),
  ('DSN', 'RECEIVABLE', 'TECH_BPO', 'FIXED', '업무대행에 대한 기본계약서 (SOW)', '2023-11-01', '2025-08-29', 3000, 'USD', 'EXPIRED', false, '3,000→1,500 USD/month. 계약종료:29.08.2025. 계약서: 용역표준계약서(기본계약_SOW)_Doosoun_signed.pdf, 청산: (Doosoun x Amoeba) Contract Liquidation Minutes_signed.pdf'),
  ('ADR', 'RECEIVABLE', 'TECH_BPO', 'FIXED', '업무대행 기본계약서 (SOW) - 2차', '2024-03-01', '2026-02-28', 3375, 'USD', 'ACTIVE', false, '3,375 USD/month. 계약서: 용역표준계약서(기본계약_SOW)_Andar_240301.pdf, 부속합의서: (Andar_Amoeba) 부속합의서_signed.pdf'),
  ('IVY', 'RECEIVABLE', 'TECH_BPO', 'FIXED', '업무대행에 대한 기본계약서 (SOW)', '2024-03-01', '2024-12-31', 7000, 'USD', 'EXPIRED', false, '7,000 USD/month. 계약종료:31.12.2024. 계약서: 용역표준계약서(기본계약_SOW)_IVY_signed.pdf'),
  ('AMBKR', 'RECEIVABLE', 'TECH_BPO', 'USAGE_BASED', '업무대행에 대한 기본계약서 (SOW)', '2024-03-21', '2026-03-21', 30000, 'USD', 'ACTIVE', true, '자동 연장. 계약서: Basic Contract_for_amoebacompany_signed.pdf'),
  -- SI Dev
  ('IVY', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'IVYUSA Marketplace platform establishment', '2024-12-10', '2025-05-10', 103000, 'USD', 'ACTIVE', false, '선금50%+중도금30%+잔금20%. 계약서: (amb_IVYUSA) IMP contract_signed.pdf'),
  ('AMBP', 'RECEIVABLE', 'SI_DEV', 'FIXED', '업무대행에 대한 기본계약서 (SOW)', '2024-08-14', '2025-08-14', 14500, 'USD', 'ACTIVE', false, '계약서: amoebapartners basic contract_signed.pdf'),
  ('IVY', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'IVY Beautizen Feature improvement 2nd dev', '2024-08-15', '2024-12-31', 15000, 'USD', 'EXPIRED', false, '계약종료:12.12.2024. 계약서: Amoeba_IVYUSA_beautizen_contract_2nd development_amb signed.pdf'),
  ('IVE', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'IVY Roundtable 2nd development', '2024-07-01', '2024-10-31', 35000, 'USD', 'EXPIRED', false, '계약종료:11.12.2024. 계약서: Amoeba_IVYUSA_prosumer_contract_2nd development_signed.pdf'),
  ('IVY', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'IVY USA platform Version 2.0 구축', '2023-05-01', '2023-12-31', 150000, 'USD', 'LIQUIDATED', false, '계약종료:29.02.2024. 계약서: (Amoeba_IVY USA) IVY 2.0 계약_signed.pdf'),
  ('DED', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Vivace brand website 구축', '2023-05-01', '2023-10-31', 50000, 'USD', 'LIQUIDATED', false, '계약종료:29.02.2024. 계약서: (Amoeba_IVY USA) IVY Vivace 계약_signed.pdf'),
  ('IVE', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'IVY Roundtable 구축', '2023-07-01', '2023-10-31', 35000, 'USD', 'LIQUIDATED', false, '계약종료:29.02.2024. 계약서: (Amoeba_IVY USA) IVY Roundtable Contract_signed.pdf'),
  ('SMK', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Super Call for Driver App 개발', '2023-07-15', '2023-11-25', 33000, 'USD', 'LIQUIDATED', false, '계약종료:29.03.2024. 계약서: SmartKiosk_amoeba_DevContract_20230714_signed.pdf'),
  ('ECM', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Cafe24 상품관리 자동화 App 개발', '2023-07-05', '2023-10-04', 32000, 'USD', 'LIQUIDATED', false, '계약종료:29.03.2024. 계약서: (Amoeba_EchoMarketing) Service Contract 230705_signed.pdf'),
  ('SVN2', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Serveone 복지몰 구축', '2023-09-18', '2024-03-20', 1004000000, 'VND', 'LIQUIDATED', false, '계약종료:30.05.2024. 계약서: (Serveone Viet Nam_Amoeba) 용역계약서_signed.pdf'),
  ('SPH', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', '아메바산딜샵 사이트 개발', '2023-09-04', '2023-10-30', 280000000, 'VND', 'LIQUIDATED', false, '계약종료:15.01.2024. 계약서: Song Phuong_amb_DevContract_signed.pdf'),
  ('KOI', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', '루벤티스 COVAS 홈페이지 구축', '2023-10-23', '2024-01-22', 26000000, 'KRW', 'LIQUIDATED', false, '달러 결제. 계약서: TalkFile_용역계약서_베트남_AMOEBA_소스개발_241114.pdf'),
  ('AMBKR', 'RECEIVABLE', 'SI_DEV', 'FIXED', 'amoeba Talk development', '2023-11-08', '2024-03-07', 34500, 'USD', 'LIQUIDATED', false, '계약종료:13.12.2024. 계약서: (Amoeba Company) Software Service Contract_Amoeba Talk Dev_amb signed.pdf'),
  ('AMBKR', 'RECEIVABLE', 'SI_DEV', 'FIXED', 'amoeba Shop upgrade', '2023-12-01', '2024-03-07', 35000, 'USD', 'LIQUIDATED', false, '계약종료:12.12.2024. 계약서: (Amoeba Company) Software Service Contract_amoebashop dev_amb signed.pdf'),
  ('BDT', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'SAN DEAL Korea SHOP 구축', '2023-12-01', '2024-01-31', 12000, 'USD', 'LIQUIDATED', false, '계약종료:29.11.2024. 계약서: SAN DEAL SHOP 구축_소프트웨어 용역 계약서_signed.pdf'),
  ('FDN', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'rankingdak.com 베트남 쇼핑몰 구축', '2024-01-25', '2024-04-25', 312960000, 'VND', 'DRAFT', false, 'Pending 상태'),
  ('CNT', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Website building', '2024-11-01', '2024-12-31', 367335000, 'VND', 'LIQUIDATED', false, '계약종료:27.12.2024. 계약서: (Connectable) Software Service Contract_signed.pdf'),
  ('CRH', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Create website', '2024-11-01', '2024-12-31', 6750000, 'KRW', 'ACTIVE', false, '인수인계 확인. 계약서: (Crosshub) Service Contract_241101_signed.pdf'),
  ('GYB', 'RECEIVABLE', 'SI_DEV', 'MILESTONE', 'Gyeongbuk VN online/offline sale channels', '2025-06-15', '2025-12-15', 685300000, 'VND', 'ACTIVE', false, '+175M VND upon completion. 계약서: (amb_Gyeongbuk) Service Contract_signed.pdf'),
  ('BLM', 'RECEIVABLE', 'SI_DEV', 'FIXED', 'HappyTalk Backend platform migration', '2025-07-01', '2025-12-31', 5000, 'USD', 'EXPIRED', false, '5000USD/month. 종료:31.10.2025. 계약서: 2_(Blumn AI_Amoeba) Service Contract_signed.pdf'),
  ('IVY', 'RECEIVABLE', 'SI_DEV', 'FIXED', 'IMP function improvement and maintenance', '2025-08-19', '2026-04-19', 96000, 'USD', 'ACTIVE', false, '10,667 USD/month. 계약서: (amb_IVYUSA) IMP contract 2차_v4-2_signed.pdf'),
  -- Maintenance
  ('DSN', 'RECEIVABLE', 'MAINTENANCE', 'FIXED', '자동발주시스템(AOS) 유지보수', '2023-05-01', '2024-12-31', 50000, 'USD', 'LIQUIDATED', false, '계약종료:31.12.2024. 계약서: (AOS) 용역계약서_20230501.pdf'),
  -- Consulting/Other
  ('EZW', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting', '2023-05-10', '2024-04-30', 0, 'VND', 'LIQUIDATED', false, '계약종료:30.09.2023. 계약서: consulting_contract_amoeba_ezwebpia_231005.pdf'),
  ('MTC', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting / Incubating', '2023-06-01', '2024-04-30', 0, 'VND', 'EXPIRED', false, '8월부터 종료. 계약서: consulting_contract_amoeba_Meta Crew (20230601).pdf'),
  ('SBS_C', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting', '2023-05-01', '2024-04-30', 20000000, 'VND', 'LIQUIDATED', false, '20M VND/month. 종료:30.09.2023. 계약서: consulting_contract_amoeba_SBS 20230501.pdf'),
  ('SMB', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting', '2023-05-01', '2024-04-30', 20000000, 'VND', 'LIQUIDATED', false, '20M VND/month. 종료:29.12.2023. 계약서: consulting_contract_amoeba_SMD2BOX.pdf'),
  ('OZS', 'RECEIVABLE', 'OTHER', 'MILESTONE', 'Market research/design consulting erpia global', '2023-06-26', '2023-12-31', 130000, 'USD', 'LIQUIDATED', false, '종료:19.01.2024. 계약서: (OneZero_Amoeba) Service Contract_signed (재체결).pdf'),
  ('ITV', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting', '2023-10-01', '2024-09-30', 20000000, 'VND', 'LIQUIDATED', false, '20M VND/month. 종료:29.12.2023. 계약서: (Amoeba_INT) Management Consulting Contract_231001.pdf'),
  ('GFP', 'RECEIVABLE', 'OTHER', 'FIXED', 'Consulting', '2023-12-11', '2025-12-31', 6000000, 'VND', 'ACTIVE', false, '6M VND/month. 계약서: Hợp đồng consulting Giftpop_20231211_signed.pdf'),
  ('CWY', 'RECEIVABLE', 'OTHER', 'FIXED', '쇼핑웹사이트 운영관리 (1차)', '2023-05-08', '2023-10-31', 35250000, 'VND', 'TERMINATED', false, '종료:15.05.2023. TERMINATION AGREEMENT. 계약서: 20230508_Amoeba_Coway_Maintenance Contract_signed.pdf'),
  ('KSQ', 'RECEIVABLE', 'OTHER', 'FIXED', 'Marketing analysis solutions', '2023-10-25', '2024-01-25', 30000, 'USD', 'DRAFT', false, 'Pending. 계약+인보이스 송부:2023.10.31')
) AS v(pcode, direction, category, ctype, title, start_date, end_date, amount, currency, status, auto_renew, note)
JOIN amb_bil_partners p ON p.ptn_code = v.pcode AND p.ent_id = :'vn_ent_id';

-- ============================================
-- 3. INSERT CONTRACTS (Outsourcing - PAYABLE)
-- ============================================

INSERT INTO amb_bil_contracts (ctr_id, ent_id, ptn_id, ctr_direction, ctr_category, ctr_type, ctr_title, ctr_start_date, ctr_end_date, ctr_amount, ctr_currency, ctr_status, ctr_auto_renew, ctr_note, ctr_created_at, ctr_updated_at)
SELECT gen_random_uuid(), :'vn_ent_id', p.ptn_id, v.direction, v.category, v.ctype, v.title, v.start_date::date, v.end_date::date, v.amount, v.currency, v.status, false, v.note, NOW(), NOW()
FROM (VALUES
  ('SBS', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'IVYUSA Vivace Brand site 구축', '2023-05-15', '2023-07-14', 59000000, 'VND', 'LIQUIDATED', '종료:31.07.2023. 계약서: [표준계약서]Service_Contract_SBS_Vivace.pdf'),
  ('SBS', 'PAYABLE', 'TECH_BPO', 'FIXED', 'Apply Crema solution on shopping malls', '2023-05-01', '2024-04-30', 20000000, 'VND', 'LIQUIDATED', '20M VND/month. 종료:31.10.2023. 계약서: SBS_Crema 외주용역계약.pdf'),
  ('SBS', 'PAYABLE', 'TECH_BPO', 'USAGE_BASED', 'Crema + Design & Publish (Monthly report)', '2023-07-01', '2024-06-30', 0, 'VND', 'LIQUIDATED', '매월 확인. 종료:01.09.2023. 계약서: SBS_외주용역계약_230701.pdf'),
  ('PLN', 'PAYABLE', 'SI_DEV', 'FIXED', 'Super Call app 개발 (1차)', '2023-08-23', '2023-11-10', 236768000, 'VND', 'LIQUIDATED', '종료:20.11.2023. 계약서: CONTRACT AMOEBA-PLUSN 23.08.23_signed.pdf'),
  ('INT', 'PAYABLE', 'TECH_BPO', 'USAGE_BASED', 'Crema + Design & Publish (Monthly report)', '2023-09-01', '2024-08-31', 0, 'VND', 'EXPIRED', '종료:31.07.2024. 계약서: (AMB_INT) 용역표준계약서1_Service_Contract_signed.pdf'),
  ('INT', 'PAYABLE', 'TECH_BPO', 'FIXED', 'Crema solution (Fixed cost)', '2023-11-01', '2024-04-30', 20000000, 'VND', 'EXPIRED', '20M VND/month. 종료:31.08.2024. 계약서: INT_Crema 외주용역계약(20231101)_signed.pdf'),
  ('PLN', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'Super Call app 개발 (2차)', '2023-11-13', '2023-12-12', 118384000, 'VND', 'LIQUIDATED', '종료:29.01.2024. 계약서: CONTRACT AMOEBA-PLUSN 13.11.23_signed.pdf'),
  ('SBS', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'SAN DEAL SHOP site design', '2024-01-01', '2024-02-15', 48840000, 'VND', 'LIQUIDATED', '종료:06.06.2024. 계약서: [표준계약서]Service_Contract_SBS_Sandealshop_signed.pdf'),
  ('TFN', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'V-members Mobile app development', '2024-03-01', '2024-03-29', 84656400, 'VND', 'LIQUIDATED', '종료:05.08.2024. 계약서: CONTRACT AMOEBA-Tech Fashion_signed.pdf'),
  ('GFP', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'Gateway POS system integration', '2024-05-01', '2024-07-31', 150000000, 'VND', 'LIQUIDATED', '종료:23.10.2024. 계약서: [표준계약서]Service_Contract_Giftpop (20240501)_재체결.pdf'),
  ('TFN', 'PAYABLE', 'SI_DEV', 'MILESTONE', 'IVY USA application development', '2024-05-29', '2024-06-05', 7372124, 'VND', 'LIQUIDATED', '종료:12.12.2024. 계약서: TechFashion_IVY_USA contract_signed.pdf'),
  ('SBS', 'PAYABLE', 'TECH_BPO', 'AD_HOC', 'Crema+Andar publishing+SocialBean design', '2025-01-13', '2025-02-28', 76713100, 'VND', 'LIQUIDATED', '종료:28.02.2025. 계약서: (Amoeba_SBS) Service Contract_250113_signed.pdf'),
  ('SBS', 'PAYABLE', 'SI_DEV', 'FIXED', 'IVY Marketplace platform design renewal', '2025-01-20', '2025-02-20', 50000000, 'VND', 'LIQUIDATED', '종료:20.02.2025. 계약서: (SBS_Amoeba) Service contract (IMP design renewal).pdf'),
  ('SBS', 'PAYABLE', 'TECH_BPO', 'USAGE_BASED', 'Crema + Design & Publish (Monthly) 2025', '2025-02-01', '2026-01-31', 30000000, 'VND', 'ACTIVE', '30M VND/month. 계약서: (AMB_SBS) Service Contract (Monthy Report)_signed.pdf'),
  ('SBS', 'PAYABLE', 'TECH_BPO', 'FIXED', 'Crema solution (Fixed cost) 2025', '2025-01-31', '2026-01-31', 20000000, 'VND', 'ACTIVE', '20M VND/month. 계약서: (AMB_SBS) Service Contract (Fixed cost)_signed.pdf'),
  ('BNK', 'PAYABLE', 'MARKETING', 'FIXED', 'Marketing Service Contract', '2025-02-01', '2026-01-31', 15000000, 'VND', 'ACTIVE', '15M VND/month. 계약서: (BNK) Marketing Service Contract_signed.pdf'),
  ('INT', 'PAYABLE', 'TECH_BPO', 'FIXED', 'Crema solution (Fixed cost) 2025', '2025-04-01', '2026-03-31', 20000000, 'VND', 'ACTIVE', '20M VND/month. 계약서: (AMB_INT) Service Contract (Fixed cost2025)_signed.pdf'),
  ('INT', 'PAYABLE', 'TECH_BPO', 'USAGE_BASED', 'Crema + Design & Publish (Monthly) 2025', '2025-04-01', '2026-03-31', 30000000, 'VND', 'ACTIVE', '30M VND/month. 계약서: (AMB_INT) Service Contract (Monthy Report2025)_signed.pdf'),
  ('BNK', 'PAYABLE', 'MARKETING', 'MILESTONE', 'Marketing (GV market)', '2025-06-20', '2025-11-30', 264550000, 'VND', 'ACTIVE', '계약서: (AMB-BNK) GV market Contract_250620_signed.pdf'),
  ('AMBKR', 'PAYABLE', 'TECH_BPO', 'USAGE_BASED', 'Basic Contract For Request Work', '2025-08-01', '2026-07-31', 3000, 'USD', 'ACTIVE', 'SOW 기반. 계약서: (AMB KR x AMB VN) Basic Contract_250801_signed.pdf')
) AS v(pcode, direction, category, ctype, title, start_date, end_date, amount, currency, status, note)
JOIN amb_bil_partners p ON p.ptn_code = v.pcode AND p.ent_id = :'vn_ent_id';

-- ============================================
-- 4. SUMMARY
-- ============================================
SELECT 'Partners' as entity, COUNT(*) as count FROM amb_bil_partners WHERE ent_id = :'vn_ent_id'
UNION ALL
SELECT 'Contracts', COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'vn_ent_id'
UNION ALL
SELECT 'Contracts (RECEIVABLE)', COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'vn_ent_id' AND ctr_direction = 'RECEIVABLE'
UNION ALL
SELECT 'Contracts (PAYABLE)', COUNT(*) FROM amb_bil_contracts WHERE ent_id = :'vn_ent_id' AND ctr_direction = 'PAYABLE';
