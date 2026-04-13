import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ContractEntity } from '../entity/contract.entity';
import { BillingDocumentEntity } from '../entity/document.entity';
import { PartnerEntity } from '../entity/partner.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

interface ContractSeed {
  partnerCode: string;
  direction: string;
  category: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  status: string;
  autoRenew: boolean;
  note: string;
  documents: { filename: string; type: string }[];
}

// ===== Client Sheet (RECEIVABLE) =====
const CLIENT_CONTRACTS: ContractSeed[] = [
  {
    partnerCode: 'CRM', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'FIXED',
    title: 'IT technology support: Apply Crema solution on the shopping malls',
    startDate: '2023-05-01', endDate: '2026-04-30', amount: 10000, currency: 'USD',
    status: 'ACTIVE', autoRenew: true,
    note: '10,000 USD/month → 7,000 USD/month from March 2024. 자동 연장',
    documents: [
      { filename: '(CREMA_Amoeba) 용역계약서.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Crema_Amoeba) 부속합의서_signed.pdf', type: 'APPENDIX' },
    ],
  },
  {
    partnerCode: 'UNC', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2023-06-01', endDate: '2024-05-30', amount: 2000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '계약종료합의서 체결 완료',
    documents: [
      { filename: '(UneedComms) 용역계약서_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'OMI', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2023-08-01', endDate: '2024-07-31', amount: 0, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '날인한 계약서에 서명과 인감이 누락됨. 회사 폐업.',
    documents: [
      { filename: '(Amoeba_OMIOS) 용역계약서_수령본.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'SSO', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2023-08-23', endDate: '2024-08-23', amount: 2300, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '',
    documents: [
      { filename: 'contract_for_SISOUL_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'AGG', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2023-09-15', endDate: '2024-09-15', amount: 11500, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '',
    documents: [
      { filename: '(Amoeba_AgileGrowth) 용역계약서_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'ADR', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW) - 1차',
    startDate: '2023-10-01', endDate: '2024-09-30', amount: 0, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '70USD/case, 매월 확인',
    documents: [
      { filename: '(Andar)용역표준계약서_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'DSN', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'FIXED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2023-11-01', endDate: '2025-08-29', amount: 3000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '3,000 USD/month → 1,500 USD/month from 5/2025. 계약종료: 29.08.2025',
    documents: [
      { filename: '용역표준계약서(기본계약_SOW)_Doosoun_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Doosoun x Amoeba) Contract Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'ADR', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'FIXED',
    title: '업무대행에 대한 기본계약서 (SOW) - 2차',
    startDate: '2024-03-01', endDate: '2026-02-28', amount: 3375, currency: 'USD',
    status: 'ACTIVE', autoRenew: false,
    note: '3,375 USD/month. 2026.02.28까지 연장',
    documents: [
      { filename: '용역표준계약서(기본계약_SOW)_Andar_240301.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Andar_Amoeba) 부속합의서_signed.pdf', type: 'APPENDIX' },
    ],
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'FIXED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2024-03-01', endDate: '2024-12-31', amount: 7000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '7,000 USD/month. 계약종료: 31.12.2024',
    documents: [
      { filename: '용역표준계약서(기본계약_SOW)_IVY_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_IVYUSA) The minutes of acceptance_IVY operation maintenance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'AMBKR', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2024-03-21', endDate: '2026-03-21', amount: 30000, currency: 'USD',
    status: 'ACTIVE', autoRenew: true,
    note: '자동 연장. 다양한 SOW 단위 작업.',
    documents: [
      { filename: 'Basic Contract_for_amoebacompany_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  // === SI Dev ===
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVYUSA Marketplace platform establishment',
    startDate: '2024-12-10', endDate: '2025-05-10', amount: 103000, currency: 'USD',
    status: 'ACTIVE', autoRenew: false,
    note: '선금 50% + 중도금 30% + 잔금 20%',
    documents: [
      { filename: '(amb_IVYUSA) IMP contract_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'AMBP', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'FIXED',
    title: '업무대행에 대한 기본계약서 (SOW)',
    startDate: '2024-08-14', endDate: '2025-08-14', amount: 14500, currency: 'USD',
    status: 'ACTIVE', autoRenew: false,
    note: '',
    documents: [
      { filename: 'amoebapartners basic contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(AMB Partners) The minutes of acceptance_SOW 240814.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVY USA platform - IVY Beautizen Feature improvement, 2nd development',
    startDate: '2024-08-15', endDate: '2024-12-31', amount: 15000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '계약종료: 12.12.2024',
    documents: [
      { filename: 'Amoeba_IVYUSA_beautizen_contract_2nd development_amb signed (재체결).pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_IVYUSA) The minutes of acceptance_Beautizen_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'IVE', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVY USA platform - Prosumer community IVY Roundtable 2nd development',
    startDate: '2024-07-01', endDate: '2024-10-31', amount: 35000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '계약종료: 11.12.2024',
    documents: [
      { filename: 'Amoeba_IVYUSA_prosumer_contract_2nd development_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_IVYUSA) The minutes of acceptance_Roundtable_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVY USA platform Version 2.0 구축',
    startDate: '2023-05-01', endDate: '2023-12-31', amount: 150000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.02.2024',
    documents: [
      { filename: '(Amoeba_IVY USA) IVY 2.0 계약_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_IVYUSA) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'DED', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Vivace brand website 구축',
    startDate: '2023-05-01', endDate: '2023-10-31', amount: 50000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.02.2024',
    documents: [
      { filename: '(Amoeba_IVY USA) IVY Vivace 계약_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Daedo) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'IVE', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVY USA platform - Prosumer community IVY Roundtable 구축',
    startDate: '2023-07-01', endDate: '2023-10-31', amount: 35000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.02.2024',
    documents: [
      { filename: '(Amoeba_IVY USA) IVY Roundtable Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_IVY ENTERPRISE) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SMK', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Develop Super Call for Driver App',
    startDate: '2023-07-15', endDate: '2023-11-25', amount: 33000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.03.2024',
    documents: [
      { filename: 'SmartKiosk_amoeba_DevContract_20230714_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_SmartKiosk) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'ECM', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Cafe24 상품 관리 설정 자동화 App 개발',
    startDate: '2023-07-05', endDate: '2023-10-04', amount: 32000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.03.2024',
    documents: [
      { filename: '(Amoeba_EchoMarketing) Service Contract 230705_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_EchoMarketing) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SVN', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Serveone 복지몰 구축',
    startDate: '2023-09-18', endDate: '2024-03-20', amount: 1004000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 30.05.2024',
    documents: [
      { filename: '(Serveone Viet Nam_Amoeba) 용역계약서_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Serveone) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SPH', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: '아메바산딜샵 사이트 개발',
    startDate: '2023-09-04', endDate: '2023-10-30', amount: 280000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 15.01.2024',
    documents: [
      { filename: 'Song Phuong_amb_DevContract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Song Phuong) The Minutes of Acceptence_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
      { filename: '(Amoeba_Song Phuong) Appendix of Software Service Contract_signed.pdf', type: 'APPENDIX' },
    ],
  },
  {
    partnerCode: 'KOI', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: '루벤티스 COVAS 홈페이지 구축',
    startDate: '2023-10-23', endDate: '2024-01-22', amount: 26000000, currency: 'KRW',
    status: 'LIQUIDATED', autoRenew: false,
    note: '달러로 결제',
    documents: [
      { filename: 'TalkFile_용역계약서_베트남_AMOEBA_소스개발_241114.pdf.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_COVAS) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'AMBKR', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'amoeba Talk development',
    startDate: '2023-11-08', endDate: '2024-03-07', amount: 34500, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 13.12.2024',
    documents: [
      { filename: '(Amoeba Company) Software Service Contract_Amoeba Talk Dev_amb signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(AMBVN_AMBKR) The minutes of acceptance_ambTalk_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'AMBKR', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'amoeba Shop upgrade',
    startDate: '2023-12-01', endDate: '2024-03-07', amount: 35000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 12.12.2024',
    documents: [
      { filename: '(Amoeba Company) Software Service Contract_amoebashop dev_amb signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(AMBVN_AMBKR) The minutes of acceptance_ambshop_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'BDT', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'SAN DEAL Korea SHOP shopping mall platform development',
    startDate: '2023-12-01', endDate: '2024-01-31', amount: 12000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.11.2024',
    documents: [
      { filename: 'SAN DEAL SHOP 구축_소프트웨어 용역 계약서_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Bridgetec) Contract Acceptance And Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'FDN', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'rankingdak.com 베트남 쇼핑몰 구축',
    startDate: '2024-01-25', endDate: '2024-04-25', amount: 312960000, currency: 'VND',
    status: 'DRAFT', autoRenew: false,
    note: 'Pending 상태',
    documents: [],
  },
  {
    partnerCode: 'CNT', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Website building',
    startDate: '2024-11-01', endDate: '2024-12-31', amount: 367335000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 27.12.2024',
    documents: [
      { filename: '(Connectable) Software Service Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Connectable) Contract Acceptance and Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'CRH', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Create website',
    startDate: '2024-11-01', endDate: '2024-12-31', amount: 6750000, currency: 'KRW',
    status: 'ACTIVE', autoRenew: false,
    note: '인수인계 날짜 확인',
    documents: [
      { filename: '(Crosshub) Service Contract_241101_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'GYB', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Gyeongbuk Vietnam online and offline sale channels establishment',
    startDate: '2025-06-15', endDate: '2025-12-15', amount: 685300000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '+ 175,000,000 VND upon project completion',
    documents: [
      { filename: '(amb_Gyeongbuk) Service Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'BLM', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'HappyTalk Backend platform migration',
    startDate: '2025-07-01', endDate: '2025-12-31', amount: 5000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false,
    note: '5000 USD/month. 계약종료: 31.10.2025',
    documents: [
      { filename: '2_(Blumn AI_Amoeba) Service Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '3-1_보안에 관한 특약서_날인.pdf', type: 'OTHER' },
      { filename: '(Blumn AI x Amoeba) Contract Acceptance And Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'IMP function improvement and maintenance',
    startDate: '2025-08-19', endDate: '2026-04-19', amount: 96000, currency: 'USD',
    status: 'ACTIVE', autoRenew: false,
    note: '10,667 USD/month',
    documents: [
      { filename: '(amb_IVYUSA) IMP contract 2차_v4-2_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  // === Maintenance ===
  {
    partnerCode: 'DSN', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'FIXED',
    title: '자동발주시스템(AOS) 유지보수',
    startDate: '2023-05-01', endDate: '2024-12-31', amount: 50000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 31.12.2024',
    documents: [
      { filename: '(AOS) 용역계약서 _20230501.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Doosoun) Contract Acceptance And Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  // === Consulting ===
  {
    partnerCode: 'EZW', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting',
    startDate: '2023-05-10', endDate: '2024-04-30', amount: 0, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 30.09.2023',
    documents: [
      { filename: 'consulting_contract_amoeba_ezwebpia_231005.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Ezwebpia)_Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'MTC', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting / Incubating',
    startDate: '2023-06-01', endDate: '2024-04-30', amount: 0, currency: 'VND',
    status: 'EXPIRED', autoRenew: false,
    note: '8월부터 계약 종료 완료',
    documents: [
      { filename: 'consulting_contract_amoeba_Meta Crew (20230601).pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'SBS_C', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting',
    startDate: '2023-05-01', endDate: '2024-04-30', amount: 20000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '20,000,000 VND/month. 계약종료: 30.09.2023',
    documents: [
      { filename: 'consulting_contract_amoeba_SBS 20230501.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_SBS) Consulting Contract Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SMB', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting',
    startDate: '2023-05-01', endDate: '2024-04-30', amount: 20000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '20,000,000 VND/month. 계약종료: 29.12.2023',
    documents: [
      { filename: 'consulting_contract_amoeba_SMD2BOX.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_SMD2BOX)_Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'OZS', direction: 'RECEIVABLE', category: 'OTHER', type: 'MILESTONE',
    title: 'Market research and design consulting for "erpia" global version',
    startDate: '2023-06-26', endDate: '2023-12-31', amount: 130000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 19.01.2024',
    documents: [
      { filename: '(OneZero_Amoeba) Service Contract_signed (재체결).pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(One Zero) Contract Acceptence And Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'ITV', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting',
    startDate: '2023-10-01', endDate: '2024-09-30', amount: 20000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '20,000,000 VND/month. 계약종료: 29.12.2023',
    documents: [
      { filename: '(Amoeba_INT) Management Consulting Contract _231001.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_INT)_Liquidation Minutes_231229_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'GFP', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: 'Consulting',
    startDate: '2023-12-11', endDate: '2025-12-31', amount: 6000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '6,000,000 VND/month. 2025.12.31까지 연장',
    documents: [
      { filename: 'Hợp đồng consulting Giftpop_20231211_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Giftpop_Amoeba) Appendix of Consulting Contract.pdf', type: 'APPENDIX' },
      { filename: '(Giftpop_Amoeba) Appendix of Consulting Contract_02.pdf', type: 'APPENDIX' },
      { filename: '(Giftpop_Amoeba) Appendix of Contract_250630_signed.pdf', type: 'APPENDIX' },
    ],
  },
  // === Coway (관리) ===
  {
    partnerCode: 'CWY', direction: 'RECEIVABLE', category: 'OTHER', type: 'FIXED',
    title: '쇼핑웹사이트 운영관리 (계약1)',
    startDate: '2023-05-08', endDate: '2023-10-31', amount: 35250000, currency: 'VND',
    status: 'TERMINATED', autoRenew: false,
    note: '계약종료: 15.05.2023. TERMINATION AGREEMENT 체결',
    documents: [
      { filename: '20230508_Amoeba_Coway_Maintenance Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Coway) TERMINATION AGREEMENT_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
];

// ===== Outsourcing Sheet (PAYABLE) =====
const OUTSOURCING_CONTRACTS: ContractSeed[] = [
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVYUSA Vivace Brand site 구축',
    startDate: '2023-05-15', endDate: '2023-07-14', amount: 59000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 31.07.2023',
    documents: [
      { filename: '[표준계약서]Service_Contract_SBS_Vivace.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_SBS)_Liquidation Minutes_IVY Vivace_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'TECH_BPO', type: 'FIXED',
    title: 'Apply Crema solution on the shopping malls',
    startDate: '2023-05-01', endDate: '2024-04-30', amount: 20000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '20,000,000 VND/month. 계약종료: 31.10.2023',
    documents: [
      { filename: 'SBS_Crema 외주용역계약.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(SBS_Amoeba) Contract Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: 'Apply Crema solution and Design & Publish work (Monthly report)',
    startDate: '2023-07-01', endDate: '2024-06-30', amount: 0, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '매월 확인. 계약종료: 01.09.2023',
    documents: [
      { filename: 'SBS_외주용역계약_Outsourcing Service Contract_230701.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(SBS_Amoeba) Contract Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'PLN', direction: 'PAYABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'Super Call app 개발 (1차)',
    startDate: '2023-08-23', endDate: '2023-11-10', amount: 236768000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 20.11.2023',
    documents: [
      { filename: 'CONTRACT AMOEBA-PLUSN 23.08.23_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_PlusN Soft)_Liquidation Minutes_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'INT', direction: 'PAYABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: 'Apply Crema solution and Design & Publish work (Monthly report)',
    startDate: '2023-09-01', endDate: '2024-08-31', amount: 0, currency: 'VND',
    status: 'EXPIRED', autoRenew: false,
    note: '매월 확인. 계약종료: 31.07.2024',
    documents: [
      { filename: '(AMB_INT) 용역표준계약서1_Service_Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_INT)_Liquidation Minutes_(Monthly report 230901).pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'INT', direction: 'PAYABLE', category: 'TECH_BPO', type: 'FIXED',
    title: 'Apply Crema solution on the shopping malls (Fixed cost)',
    startDate: '2023-11-01', endDate: '2024-04-30', amount: 20000000, currency: 'VND',
    status: 'EXPIRED', autoRenew: false,
    note: '20,000,000 VND/month. 2025.04.30까지 연장. 계약종료: 31.08.2024',
    documents: [
      { filename: 'INT_Crema 외주용역계약(20231101)_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_INT) Appendix of Contract_signed.pdf', type: 'APPENDIX' },
      { filename: '(Amoeba_INT)_Liquidation Minutes_(Fixed cost 231101).pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'PLN', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Super Call app 개발 (2차)',
    startDate: '2023-11-13', endDate: '2023-12-12', amount: 118384000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 29.01.2024',
    documents: [
      { filename: 'CONTRACT AMOEBA-PLUSN 13.11.23_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_PlusN Soft)_Liquidation Minutes 2_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'SAN DEAL SHOP site design',
    startDate: '2024-01-01', endDate: '2024-02-15', amount: 48840000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 06.06.2024',
    documents: [
      { filename: '[표준계약서]Service_Contract_SBS_Sandealshop_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(SBS_Amoeba) The minutes of acceptance_240717.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'TFN', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'V-members Mobile application development',
    startDate: '2024-03-01', endDate: '2024-03-29', amount: 84656400, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 05.08.2024',
    documents: [
      { filename: 'CONTRACT AMOEBA-Tech Fashion_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_TechFashion) The minutes of acceptance_Vmember_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'GFP', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'Gateway integration with POS system',
    startDate: '2024-05-01', endDate: '2024-07-31', amount: 150000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 23.10.2024',
    documents: [
      { filename: '[표준계약서]Service_Contract_Giftpop (20240501)_재체결.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_Giftpop) The minutes of acceptance_Gateway.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'TFN', direction: 'PAYABLE', category: 'SI_DEV', type: 'MILESTONE',
    title: 'IVY USA application development',
    startDate: '2024-05-29', endDate: '2024-06-05', amount: 7372124, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 12.12.2024',
    documents: [
      { filename: 'TechFashion_IVY_USA contract_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(Amoeba_TechFashion) The minutes of acceptance_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  // 2025 SBS contracts
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'TECH_BPO', type: 'AD_HOC',
    title: 'Apply Crema + Andar publishing + Social Bean design',
    startDate: '2025-01-13', endDate: '2025-02-28', amount: 76713100, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 28.02.2025',
    documents: [
      { filename: '(Amoeba_SBS) Service Contract_250113_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(SBS) Contract Acceptance and Liquidation Minutes_SC250113.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'SI_DEV', type: 'FIXED',
    title: 'IVY Marketplace platform design renewal',
    startDate: '2025-01-20', endDate: '2025-02-20', amount: 50000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false,
    note: '계약종료: 20.02.2025',
    documents: [
      { filename: '(SBS_Amoeba) Service contract (IMP design renewal).pdf', type: 'SIGNED_CONTRACT' },
      { filename: '(SBS_Amoeba) The minutes of acceptance_IMP design renewal_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: 'Apply Crema solution and Design & Publish work (Monthly report) 2025',
    startDate: '2025-02-01', endDate: '2026-01-31', amount: 30000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '30,000,000 VND/month',
    documents: [
      { filename: '(AMB_SBS) Service Contract (Monthy Report)_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'SBS', direction: 'PAYABLE', category: 'TECH_BPO', type: 'FIXED',
    title: 'Apply Crema solution on the shopping malls (Fixed cost) 2025',
    startDate: '2025-01-31', endDate: '2026-01-31', amount: 20000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '20,000,000 VND/month',
    documents: [
      { filename: '(AMB_SBS) Service Contract (Fixed cost)_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'BNK', direction: 'PAYABLE', category: 'MARKETING', type: 'FIXED',
    title: 'Marketing Service Contract',
    startDate: '2025-02-01', endDate: '2026-01-31', amount: 15000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '15,000,000 VND/month (VAT included)',
    documents: [
      { filename: '(BNK) Marketing Service Contract_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'INT', direction: 'PAYABLE', category: 'TECH_BPO', type: 'FIXED',
    title: 'Apply Crema solution on the shopping malls (Fixed cost) 2025',
    startDate: '2025-04-01', endDate: '2026-03-31', amount: 20000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '20,000,000 VND/month',
    documents: [
      { filename: '(AMB_INT) Service Contract (Fixed cost2025)_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'INT', direction: 'PAYABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: 'Apply Crema solution and Design & Publish work (Monthly report) 2025',
    startDate: '2025-04-01', endDate: '2026-03-31', amount: 30000000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '30,000,000 VND/month',
    documents: [
      { filename: '(AMB_INT) Service Contract (Monthy Report2025)_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'BNK', direction: 'PAYABLE', category: 'MARKETING', type: 'MILESTONE',
    title: 'Marketing Service Contract (GV market)',
    startDate: '2025-06-20', endDate: '2025-11-30', amount: 264550000, currency: 'VND',
    status: 'ACTIVE', autoRenew: false,
    note: '',
    documents: [
      { filename: '(AMB-BNK) GV market Contract_250620_signed.pdf', type: 'SIGNED_CONTRACT' },
    ],
  },
  {
    partnerCode: 'AMBKR', direction: 'PAYABLE', category: 'TECH_BPO', type: 'USAGE_BASED',
    title: 'Basic Contract For Request Work',
    startDate: '2025-08-01', endDate: '2026-07-31', amount: 3000, currency: 'USD',
    status: 'ACTIVE', autoRenew: false,
    note: 'SOW 기반. SOW 01.08.2025: 3000 USD',
    documents: [
      { filename: '(AMB KR x AMB VN) Basic Contract_250801_signed.pdf', type: 'SIGNED_CONTRACT' },
      { filename: 'ambvn x amoebacompany_SOW(20250801)_signed.pdf', type: 'SOW' },
      { filename: '(AMBKR_AMBVN) The minutes of acceptance_SOW20250801_signed.pdf', type: 'ACCEPTANCE_MINUTES' },
    ],
  },
];

const ALL_CONTRACTS = [...CLIENT_CONTRACTS, ...OUTSOURCING_CONTRACTS];

// ===== KR01 Contracts (from Excel: Amoeba Korea_계약 관리) =====
interface KrContractSeed {
  partnerCode: string;
  direction: string;
  category: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  status: string;
  autoRenew: boolean;
  billingPeriod: string | null;
  note: string;
}

const KR_CONTRACTS: KrContractSeed[] = [
  // --- RECEIVABLE (매출) 12건 ---
  {
    partnerCode: 'AMBVN', direction: 'RECEIVABLE', category: 'TECH_BPO', type: 'SERVICE',
    title: 'Basic Contract For Request Work (Happy Talk)',
    startDate: '2025-08-01', endDate: '2026-07-31', amount: 3000, currency: 'USD',
    status: 'ACTIVE', autoRenew: true, billingPeriod: 'MONTHLY',
    note: '3,000 USD/month. 계약서: (AMB KR x AMB VN) Basic Contract_250801_signed.pdf',
  },
  {
    partnerCode: 'ERM', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'PROJECT',
    title: '링크맘서비스 - 두손 스낵아일랜드 연동 API 서버 구축',
    startDate: '2023-11-20', endDate: '2024-03-20', amount: 36000000, currency: 'KRW',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '선금 10,800,000원 + 잔금 10,800,000원 + 3차 14,400,000원 = 36,000,000원',
  },
  {
    partnerCode: 'RDB', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'Arria Online Brand site 구축',
    startDate: '2025-04-10', endDate: '2025-06-25', amount: 10875, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '선금 5,437.5 USD + 잔금 5,437.5 USD = 10,875 USD (VAT: 0%)',
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'Etleé Online Brand site 구축',
    startDate: '2025-08-18', endDate: '2025-10-18', amount: 9700, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '선금 4,850 USD + 잔금 4,850 USD = 9,700 USD (VAT: 0%)',
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'RoundTable Survey Plugin 변경 개발',
    startDate: '2025-10-28', endDate: '2025-11-28', amount: 1500, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '1,500 USD (VAT: 0%)',
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'Shopify 기반 웹사이트(ivyusa.com) - Roundtable 회원 로그인 통합',
    startDate: '2025-11-11', endDate: '2025-12-11', amount: 2375, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '2,375 USD (VAT: 0%)',
  },
  {
    partnerCode: 'GBC', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'SERVICE',
    title: '가비아씨엔에스 API 서버 설계 구축 및 유지보수',
    startDate: '2024-07-01', endDate: '2024-12-31', amount: 5000000, currency: 'KRW',
    status: 'EXPIRED', autoRenew: false, billingPeriod: 'MONTHLY',
    note: '5,000,000원/월 (VAT 별도). 월말에 세금계산서 발행',
  },
  {
    partnerCode: 'ERM', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'SERVICE',
    title: '링크맘 API 서버 유지보수 및 서비스 개발 지원 (2024)',
    startDate: '2024-05-01', endDate: '2025-04-30', amount: 2300000, currency: 'KRW',
    status: 'EXPIRED', autoRenew: false, billingPeriod: 'MONTHLY',
    note: '2,300,000원/월 (VAT 별도). 월말에 세금계산서 발행',
  },
  {
    partnerCode: 'WSA', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'SERVICE',
    title: '위사 API 서버 설계 구축 및 유지보수',
    startDate: '2023-12-01', endDate: '2024-11-30', amount: 4500000, currency: 'KRW',
    status: 'EXPIRED', autoRenew: false, billingPeriod: 'MONTHLY',
    note: '4,500,000원/월 (VAT 별도). 매월 1일에 세금계산서 발행',
  },
  {
    partnerCode: 'ERM', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'SERVICE',
    title: '링크맘 API 서버 유지보수 및 서비스 개발 지원 (2025)',
    startDate: '2025-05-01', endDate: '2026-04-30', amount: 1125000, currency: 'KRW',
    status: 'ACTIVE', autoRenew: false, billingPeriod: 'MONTHLY',
    note: '1,125,000원/월 (VAT 별도)',
  },
  {
    partnerCode: 'IVY', direction: 'RECEIVABLE', category: 'MAINTENANCE', type: 'SERVICE',
    title: 'RoundTable 연간 유지보수',
    startDate: '2025-11-03', endDate: '2026-11-02', amount: 5000, currency: 'USD',
    status: 'ACTIVE', autoRenew: false, billingPeriod: 'YEARLY',
    note: '5,000 USD (VAT: 0%)',
  },
  {
    partnerCode: 'SVN', direction: 'RECEIVABLE', category: 'OTHER', type: 'PROJECT',
    title: 'Amoeba Talk Service',
    startDate: '2024-08-09', endDate: '2025-01-08', amount: 500, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '500 USD',
  },
  // --- PAYABLE (매입) 7건 ---
  {
    partnerCode: 'CRL', direction: 'PAYABLE', category: 'TECH_BPO', type: 'SERVICE',
    title: '업무대행에 대한 기본계약서 (SOW) - Creative Lab',
    startDate: '2024-08-01', endDate: '2025-01-31', amount: 9000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '2024.08.12~2024.10.12: 9,000 USD',
  },
  {
    partnerCode: 'TFN', direction: 'PAYABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'Amoeba Diary App 개발',
    startDate: '2024-06-18', endDate: '2024-07-17', amount: 2812, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '선금 1,406 USD + 잔금 1,406 USD = 2,812 USD',
  },
  {
    partnerCode: 'AMBVN', direction: 'PAYABLE', category: 'TECH_BPO', type: 'SERVICE',
    title: '업무대행에 대한 기본계약서 (SOW) - amoeba co.,ltd',
    startDate: '2024-03-21', endDate: '2025-03-20', amount: 55000, currency: 'USD',
    status: 'EXPIRED', autoRenew: false, billingPeriod: 'MONTHLY',
    note: 'SOW 다건 합계 55,000 USD',
  },
  {
    partnerCode: 'AMBVN', direction: 'PAYABLE', category: 'SI_DEV', type: 'PROJECT',
    title: '아메바샵 업그레이드',
    startDate: '2023-12-01', endDate: '2024-03-31', amount: 34500, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '34,500 USD',
  },
  {
    partnerCode: 'AMBVN', direction: 'PAYABLE', category: 'SI_DEV', type: 'PROJECT',
    title: 'amoeba Talk 소프트웨어 개발',
    startDate: '2023-11-08', endDate: '2024-03-31', amount: 35000, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '35,000 USD',
  },
  {
    partnerCode: 'BNK', direction: 'PAYABLE', category: 'MARKETING', type: 'PROJECT',
    title: '광고홍보 콘텐츠 기획 및 제작',
    startDate: '2024-11-05', endDate: '2025-01-31', amount: 120000000, currency: 'VND',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '120,000,000 VND',
  },
  {
    partnerCode: 'ADM', direction: 'PAYABLE', category: 'OTHER', type: 'PROJECT',
    title: 'Consulting services related to transfering capital contribution',
    startDate: '2023-11-14', endDate: '2023-12-14', amount: 2500, currency: 'USD',
    status: 'LIQUIDATED', autoRenew: false, billingPeriod: null,
    note: '2,500 USD',
  },
];

// KR01 누락 파트너 3건
const KR_MISSING_PARTNERS = [
  { code: 'GBC', type: 'CLIENT', name: 'Gabia CNS', localName: '(주) 가비아씨엔에스', country: 'KR', currency: 'KRW' },
  { code: 'WSA', type: 'CLIENT', name: 'Wisa Co., Ltd', localName: '(주) 위사', country: 'KR', currency: 'KRW' },
  { code: 'ADM', type: 'GENERAL_AFFAIRS', name: 'ADAM ASSOCIATION', localName: null, country: 'VN', currency: 'USD' },
];

@Injectable()
export class ContractSeedService implements OnModuleInit {
  private readonly logger = new Logger(ContractSeedService.name);

  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepo: Repository<ContractEntity>,
    @InjectRepository(BillingDocumentEntity)
    private readonly documentRepo: Repository<BillingDocumentEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  async onModuleInit() {
    await this.seedContracts();
  }

  private async seedContracts() {
    const partnerCount = await this.partnerRepo.count();
    if (partnerCount === 0) {
      this.logger.warn('No partners found, skipping contract seed');
      return;
    }

    await this.seedVnContracts();
    await this.seedKrContracts();
  }

  private async seedVnContracts() {
    const vnEntity = await this.entityRepo.findOne({ where: { entCode: 'VN01' } });
    if (!vnEntity) {
      this.logger.warn('VN01 entity not found, skipping VN contract seed');
      return;
    }

    const vnCount = await this.contractRepo.count({ where: { entId: vnEntity.entId } });
    if (vnCount >= ALL_CONTRACTS.length) {
      this.logger.log('VN01 contracts already seeded, skipping.');
      return;
    }

    this.logger.log('Seeding VN01 billing contracts from Excel data...');

    let contractCount = 0;
    let docCount = 0;

    for (const seed of ALL_CONTRACTS) {
      // Skip if contract with same title already exists
      const existing = await this.contractRepo.findOne({
        where: { entId: vnEntity.entId, ctrTitle: seed.title },
      });
      if (existing) continue;

      const partner = await this.partnerRepo.findOne({
        where: { entId: vnEntity.entId, ptnCode: seed.partnerCode },
      });

      if (!partner) {
        this.logger.warn(`Partner ${seed.partnerCode} not found, skipping contract: ${seed.title}`);
        continue;
      }

      const contract = this.contractRepo.create({
        entId: vnEntity.entId,
        ptnId: partner.ptnId,
        ctrDirection: seed.direction,
        ctrCategory: seed.category,
        ctrType: seed.type,
        ctrTitle: seed.title,
        ctrStartDate: seed.startDate,
        ctrEndDate: seed.endDate,
        ctrAmount: seed.amount,
        ctrCurrency: seed.currency,
        ctrStatus: seed.status,
        ctrAutoRenew: seed.autoRenew,
        ctrNote: seed.note || null,
      } as DeepPartial<ContractEntity>);

      const savedContract: ContractEntity = await this.contractRepo.save(contract as ContractEntity);
      contractCount++;

      // Create billing documents for contract files
      for (const doc of seed.documents) {
        const document = this.documentRepo.create({
          entId: vnEntity.entId,
          docRefType: 'CONTRACT',
          docRefId: savedContract.ctrId,
          docType: doc.type,
          docFilename: doc.filename,
        } as DeepPartial<BillingDocumentEntity>);
        await this.documentRepo.save(document);
        docCount++;
      }
    }

    this.logger.log(`Seeded VN01: ${contractCount} contracts and ${docCount} documents`);
  }

  private async seedKrContracts() {
    const krEntity = await this.entityRepo.findOne({ where: { entCode: 'KR01' } });
    if (!krEntity) {
      this.logger.warn('KR01 entity not found, skipping KR contract seed');
      return;
    }

    const krCount = await this.contractRepo.count({ where: { entId: krEntity.entId } });
    if (krCount >= KR_CONTRACTS.length) {
      this.logger.log('KR01 contracts already seeded, skipping.');
      return;
    }

    // Seed missing partners first
    for (const mp of KR_MISSING_PARTNERS) {
      const exists = await this.partnerRepo.findOne({
        where: { entId: krEntity.entId, ptnCode: mp.code },
      });
      if (!exists) {
        const partner = this.partnerRepo.create({
          entId: krEntity.entId,
          ptnCode: mp.code,
          ptnType: mp.type,
          ptnCompanyName: mp.name,
          ptnCompanyNameLocal: mp.localName,
          ptnCountry: mp.country,
          ptnDefaultCurrency: mp.currency,
        } as DeepPartial<PartnerEntity>);
        await this.partnerRepo.save(partner);
        this.logger.log(`Added KR01 partner: ${mp.code} (${mp.name})`);
      }
    }

    this.logger.log('Seeding KR01 billing contracts from Excel data...');

    let contractCount = 0;

    for (const seed of KR_CONTRACTS) {
      // Skip if contract with same title already exists
      const existing = await this.contractRepo.findOne({
        where: { entId: krEntity.entId, ctrTitle: seed.title },
      });
      if (existing) continue;

      const partner = await this.partnerRepo.findOne({
        where: { entId: krEntity.entId, ptnCode: seed.partnerCode },
      });

      if (!partner) {
        this.logger.warn(`KR Partner ${seed.partnerCode} not found, skipping: ${seed.title}`);
        continue;
      }

      const contract = this.contractRepo.create({
        entId: krEntity.entId,
        ptnId: partner.ptnId,
        ctrDirection: seed.direction,
        ctrCategory: seed.category,
        ctrType: seed.type,
        ctrTitle: seed.title,
        ctrStartDate: seed.startDate,
        ctrEndDate: seed.endDate,
        ctrAmount: seed.amount,
        ctrCurrency: seed.currency,
        ctrStatus: seed.status,
        ctrAutoRenew: seed.autoRenew,
        ctrBillingPeriod: seed.billingPeriod,
        ctrNote: seed.note || null,
      } as DeepPartial<ContractEntity>);

      await this.contractRepo.save(contract);
      contractCount++;
    }

    this.logger.log(`Seeded KR01: ${contractCount} contracts`);
  }
}
