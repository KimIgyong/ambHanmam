import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { PartnerEntity } from '../entity/partner.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

interface PartnerSeed {
  code: string;
  type: string;
  companyName: string;
  companyNameLocal?: string;
  country?: string;
  currency: string;
}

const VN_CLIENTS: PartnerSeed[] = [
  { code: 'CRM', type: 'CLIENT', companyName: 'Crema Inc.', companyNameLocal: '주식회사 크리마', country: 'KR', currency: 'USD' },
  { code: 'UNC', type: 'CLIENT', companyName: 'Uneedcomms', companyNameLocal: '유니드컴즈', country: 'KR', currency: 'USD' },
  { code: 'OMI', type: 'CLIENT', companyName: 'OMIOS', country: 'KR', currency: 'USD' },
  { code: 'SSO', type: 'CLIENT', companyName: 'SISOUL Co., Ltd', companyNameLocal: '시솔지주', country: 'KR', currency: 'USD' },
  { code: 'AGG', type: 'CLIENT', companyName: 'Agile Growth', country: 'KR', currency: 'USD' },
  { code: 'ADR', type: 'CLIENT', companyName: 'Andar Co., Ltd', companyNameLocal: '안다르', country: 'KR', currency: 'USD' },
  { code: 'DSN', type: 'CLIENT', companyName: 'Doosoun CNI', companyNameLocal: '두순씨앤아이', country: 'KR', currency: 'USD' },
  { code: 'IVY', type: 'CLIENT', companyName: 'AST Systems / IVY USA', country: 'US', currency: 'USD' },
  { code: 'AMBKR', type: 'PARTNER', companyName: 'Amoeba Company Co., Ltd', companyNameLocal: '아메바컴퍼니주식회사', country: 'KR', currency: 'USD' },
  { code: 'AMBP', type: 'AFFILIATE', companyName: 'amoebapartners ltd', currency: 'USD' },
  { code: 'DED', type: 'CLIENT', companyName: 'DAE DO, INC', country: 'US', currency: 'USD' },
  { code: 'IVE', type: 'CLIENT', companyName: 'IVY ENTERPRISES, INC.', country: 'US', currency: 'USD' },
  { code: 'SMK', type: 'CLIENT', companyName: 'Smart Kiosk', country: 'VN', currency: 'USD' },
  { code: 'ECM', type: 'CLIENT', companyName: 'EchoMarketing', country: 'KR', currency: 'USD' },
  { code: 'SVN', type: 'CLIENT', companyName: 'Serveone', companyNameLocal: '서브원', country: 'KR', currency: 'VND' },
  { code: 'SPH', type: 'CLIENT', companyName: 'Song Phuong', country: 'VN', currency: 'VND' },
  { code: 'KOI', type: 'CLIENT', companyName: 'Korea IT Business Promotion Association (KOIPA)', companyNameLocal: '한국IT사업진흥협회', country: 'KR', currency: 'KRW' },
  { code: 'BDT', type: 'CLIENT', companyName: 'BRIDGETEC CORP', country: 'KR', currency: 'USD' },
  { code: 'FDN', type: 'CLIENT', companyName: 'FOODNAMOO', companyNameLocal: '푸드나무', country: 'VN', currency: 'VND' },
  { code: 'CNT', type: 'CLIENT', companyName: 'Connectable', country: 'KR', currency: 'VND' },
  { code: 'CRH', type: 'CLIENT', companyName: 'Crosshub Inc.', country: 'KR', currency: 'KRW' },
  { code: 'GYB', type: 'CLIENT', companyName: 'Gyeongbuk', companyNameLocal: '경북', country: 'KR', currency: 'VND' },
  { code: 'BLM', type: 'CLIENT', companyName: 'Blumn AI', currency: 'USD' },
  { code: 'SCB', type: 'CLIENT', companyName: 'SocialBean Inc.', companyNameLocal: '소셜빈', country: 'KR', currency: 'USD' },
  { code: 'CWY', type: 'CLIENT', companyName: 'Coway Co., Ltd', companyNameLocal: '코웨이', country: 'KR', currency: 'VND' },
  { code: 'EZW', type: 'CLIENT', companyName: 'Ezwebpia / Gaxago', country: 'KR', currency: 'VND' },
  { code: 'MTC', type: 'CLIENT', companyName: 'TDI / Meta Crew', country: 'KR', currency: 'VND' },
  { code: 'SMB', type: 'CLIENT', companyName: 'SMD2BOX / SAMJU Trade Company', companyNameLocal: '삼주무역', country: 'KR', currency: 'VND' },
  { code: 'OZS', type: 'CLIENT', companyName: 'OneZeroSoft', country: 'KR', currency: 'USD' },
  { code: 'ITV', type: 'CLIENT', companyName: 'INT Vision Co., Ltd', country: 'VN', currency: 'VND' },
  { code: 'KSQ', type: 'CLIENT', companyName: 'KSQUARE COMMS. INC.', country: 'KR', currency: 'USD' },
  { code: 'NWD', type: 'CLIENT', companyName: 'NEWDEA', country: 'KR', currency: 'USD' },
  { code: 'YJP', type: 'CLIENT', companyName: 'YUJINPRODUCT', companyNameLocal: '유진프로덕트', country: 'KR', currency: 'VND' },
  { code: 'SBS_C', type: 'CLIENT', companyName: 'SBS (Consulting)', country: 'VN', currency: 'VND' },
];

const VN_OUTSOURCING: PartnerSeed[] = [
  { code: 'SBS', type: 'OUTSOURCING', companyName: 'SBS', country: 'VN', currency: 'VND' },
  { code: 'INT', type: 'OUTSOURCING', companyName: 'INT VISION CO., LTD', country: 'VN', currency: 'VND' },
  { code: 'BNK', type: 'OUTSOURCING', companyName: 'Brand New K', country: 'VN', currency: 'VND' },
  { code: 'PLN', type: 'OUTSOURCING', companyName: 'PlusN Soft', country: 'VN', currency: 'VND' },
  { code: 'TFN', type: 'OUTSOURCING', companyName: 'Tech Fashion', country: 'VN', currency: 'VND' },
  { code: 'GFP', type: 'OUTSOURCING', companyName: 'M12 Plus (Giftpop)', country: 'VN', currency: 'VND' },
];

const VN_GA: PartnerSeed[] = [
  { code: 'PVR', type: 'GENERAL_AFFAIRS', companyName: 'Park View Residence', country: 'VN', currency: 'VND' },
  { code: 'KNC', type: 'GENERAL_AFFAIRS', companyName: 'Công ty TNHH Tư vấn khởi nghiệp', country: 'VN', currency: 'VND' },
  { code: 'VNS', type: 'GENERAL_AFFAIRS', companyName: 'VINASUN CORP.', country: 'VN', currency: 'VND' },
  { code: 'CLH', type: 'GENERAL_AFFAIRS', companyName: 'Cleanhouse Vietnam', country: 'VN', currency: 'VND' },
  { code: 'ADM', type: 'GENERAL_AFFAIRS', companyName: 'ADAM ASSOCIATION Company Limited', country: 'VN', currency: 'VND' },
  { code: 'MGZ', type: 'GENERAL_AFFAIRS', companyName: 'Megazone Vietnam', country: 'VN', currency: 'USD' },
  { code: 'ONS', type: 'GENERAL_AFFAIRS', companyName: 'One Step', country: 'VN', currency: 'VND' },
  { code: 'PNM', type: 'GENERAL_AFFAIRS', companyName: 'Phương Nam Technology', country: 'VN', currency: 'VND' },
  { code: 'GRB', type: 'GENERAL_AFFAIRS', companyName: 'Grab', country: 'VN', currency: 'VND' },
  { code: 'SMD', type: 'GENERAL_AFFAIRS', companyName: 'SAMDO', country: 'VN', currency: 'VND' },
  { code: 'FPT', type: 'GENERAL_AFFAIRS', companyName: 'FPT', country: 'VN', currency: 'VND' },
  { code: 'VNP', type: 'GENERAL_AFFAIRS', companyName: 'VNPT', country: 'VN', currency: 'VND' },
  { code: 'MOR', type: 'GENERAL_AFFAIRS', companyName: 'MOR', country: 'VN', currency: 'VND' },
  { code: 'APT', type: 'GENERAL_AFFAIRS', companyName: 'AP Tower', country: 'VN', currency: 'VND' },
  { code: 'BTF', type: 'GENERAL_AFFAIRS', companyName: 'Beetsoft', country: 'VN', currency: 'VND' },
  { code: 'MPS', type: 'GENERAL_AFFAIRS', companyName: 'mPOS / VI MO TECHNOLOGY', country: 'VN', currency: 'VND' },
  { code: 'NIC', type: 'GENERAL_AFFAIRS', companyName: 'NICE', country: 'KR', currency: 'VND' },
  { code: 'SCM', type: 'GENERAL_AFFAIRS', companyName: 'Sacombank', country: 'VN', currency: 'VND' },
  { code: 'DHL', type: 'GENERAL_AFFAIRS', companyName: 'DHL', country: 'VN', currency: 'VND' },
  { code: 'MBI', type: 'GENERAL_AFFAIRS', companyName: 'MBI Solution Inc. (HappyTalk)', country: 'KR', currency: 'KRW' },
  { code: 'LVN', type: 'GENERAL_AFFAIRS', companyName: 'Long Van System Solution JSC', country: 'VN', currency: 'VND' },
  { code: 'HRZ', type: 'GENERAL_AFFAIRS', companyName: 'Horizon Real Estate Management', country: 'VN', currency: 'VND' },
  { code: 'TDC', type: 'GENERAL_AFFAIRS', companyName: 'TRADICONS', country: 'VN', currency: 'VND' },
  { code: 'PHN', type: 'GENERAL_AFFAIRS', companyName: 'PHUC NGUYEN MECHANICAL', country: 'VN', currency: 'VND' },
  { code: 'TSH', type: 'GENERAL_AFFAIRS', companyName: 'The Spring House', country: 'VN', currency: 'VND' },
  { code: 'APX', type: 'GENERAL_AFFAIRS', companyName: 'APEXLAW VIETNAM', country: 'VN', currency: 'VND' },
  { code: 'MTB', type: 'GENERAL_AFFAIRS', companyName: 'Mắt Bão', country: 'VN', currency: 'VND' },
  { code: 'HCC', type: 'GENERAL_AFFAIRS', companyName: 'Hydraulic Construction Corporation No.4', country: 'VN', currency: 'VND' },
];

const KR_CLIENTS: PartnerSeed[] = [
  { code: 'ERM', type: 'CLIENT', companyName: 'Ermore Inc.', companyNameLocal: '주식회사 에르모어 (일상의감동)', country: 'KR', currency: 'KRW' },
  { code: 'IVY', type: 'CLIENT', companyName: 'IVY Enterprise, INC', country: 'US', currency: 'USD' },
  { code: 'SVN', type: 'CLIENT', companyName: 'Serveone', country: 'KR', currency: 'USD' },
  { code: 'DYC', type: 'CLIENT', companyName: 'Dayu Cosmetic', companyNameLocal: '다유코스메틱', country: 'KR', currency: 'KRW' },
  { code: 'MJC', type: 'CLIENT', companyName: 'Mijin Cosmetics Co., Ltd', companyNameLocal: '주식회사 미진화장품', country: 'KR', currency: 'KRW' },
  { code: 'HYJ', type: 'CLIENT', companyName: 'Hanyang Confectionery', companyNameLocal: '한양제과', country: 'KR', currency: 'KRW' },
  { code: 'GNS', type: 'CLIENT', companyName: 'GNS Co., Ltd', companyNameLocal: '주식회사 지엔에스', country: 'KR', currency: 'KRW' },
  { code: 'NST', type: 'CLIENT', companyName: 'Neast Co., Ltd', companyNameLocal: '주식회사 엔이스트', country: 'KR', currency: 'KRW' },
  { code: 'RDB', type: 'CLIENT', companyName: 'Red Beauty', currency: 'USD' },
  { code: 'GBC', type: 'CLIENT', companyName: 'Gabia CNS', companyNameLocal: '(주) 가비아씨엔에스', country: 'KR', currency: 'KRW' },
  { code: 'WSA', type: 'CLIENT', companyName: 'Wisa Co., Ltd', companyNameLocal: '(주) 위사', country: 'KR', currency: 'KRW' },
];

const KR_OUTSOURCING: PartnerSeed[] = [
  { code: 'AMBVN', type: 'PARTNER', companyName: 'amoeba co.,ltd', companyNameLocal: 'AMOEBA CO., LTD', country: 'VN', currency: 'USD' },
  { code: 'CRL', type: 'OUTSOURCING', companyName: 'Creative Lab', country: 'VN', currency: 'USD' },
  { code: 'BNK', type: 'OUTSOURCING', companyName: 'Brand New K', country: 'VN', currency: 'VND' },
  { code: 'TFN', type: 'OUTSOURCING', companyName: 'Tech Fashion', country: 'VN', currency: 'VND' },
];

const KR_GA: PartnerSeed[] = [
  { code: 'ADM', type: 'GENERAL_AFFAIRS', companyName: 'ADAM ASSOCIATION', country: 'VN', currency: 'USD' },
];

@Injectable()
export class PartnerSeedService implements OnModuleInit {
  private readonly logger = new Logger(PartnerSeedService.name);

  constructor(
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  async onModuleInit() {
    await this.seedPartners();
  }

  private async seedPartners() {
    const count = await this.partnerRepo.count();
    if (count > 0) return;

    const vnEntity = await this.entityRepo.findOne({ where: { entCode: 'VN01' } });
    const krEntity = await this.entityRepo.findOne({ where: { entCode: 'KR01' } });

    if (!vnEntity || !krEntity) {
      this.logger.warn('Entities VN01/KR01 not found, skipping partner seed');
      return;
    }

    this.logger.log('Seeding billing partners...');

    const allSeeds: { entityId: string; seeds: PartnerSeed[] }[] = [
      { entityId: vnEntity.entId, seeds: [...VN_CLIENTS, ...VN_OUTSOURCING, ...VN_GA] },
      { entityId: krEntity.entId, seeds: [...KR_CLIENTS, ...KR_OUTSOURCING, ...KR_GA] },
    ];

    let total = 0;
    for (const { entityId, seeds } of allSeeds) {
      const entities = seeds.map((s) =>
        this.partnerRepo.create({
          entId: entityId,
          ptnCode: s.code,
          ptnType: s.type,
          ptnCompanyName: s.companyName,
          ptnCompanyNameLocal: s.companyNameLocal || null,
          ptnCountry: s.country || null,
          ptnDefaultCurrency: s.currency,
        } as DeepPartial<PartnerEntity>),
      );
      await this.partnerRepo.save(entities as PartnerEntity[]);
      total += entities.length;
    }

    this.logger.log(`Seeded ${total} billing partners (VN: ${VN_CLIENTS.length + VN_OUTSOURCING.length + VN_GA.length}, KR: ${KR_CLIENTS.length + KR_OUTSOURCING.length + KR_GA.length})`);
  }
}
