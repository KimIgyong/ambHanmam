import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DddFrameworkEntity } from '../entity/ddd-framework.entity';
import { DddMetricEntity } from '../entity/ddd-metric.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { KmsTagEntity } from '../entity/kms-tag.entity';

interface SeedMetric {
  stage: string;
  key: string;
  label: { en: string; ko: string };
  unit: string;
  direction: string;
  dataSource: string;
  isPrimary: boolean;
  order: number;
  queryConfig?: any;
}

@Injectable()
export class DddFrameworkSeedService implements OnModuleInit {
  private readonly logger = new Logger(DddFrameworkSeedService.name);

  constructor(
    @InjectRepository(DddFrameworkEntity)
    private readonly frameworkRepository: Repository<DddFrameworkEntity>,
    @InjectRepository(DddMetricEntity)
    private readonly metricRepository: Repository<DddMetricEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
    @InjectRepository(KmsTagEntity)
    private readonly tagRepository: Repository<KmsTagEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedIfEmpty();
    } catch (err) {
      this.logger.warn('DDD framework seed skipped (tables may not exist yet)', err?.message);
    }
  }

  private async seedIfEmpty(): Promise<void> {
    const count = await this.frameworkRepository.count();
    if (count > 0) {
      this.logger.log('DDD frameworks already exist, skipping seed');
      return;
    }

    const entities = await this.entityRepository.find();
    if (entities.length === 0) {
      this.logger.warn('No entities found, skipping DDD framework seed');
      return;
    }

    for (const entity of entities) {
      await this.seedForEntity(entity.entId);
    }
    this.logger.log(`Seeded DDD frameworks for ${entities.length} entities`);
  }

  async seedForEntity(entityId: string): Promise<void> {
    const framework = await this.createFramework(entityId);
    await this.createMetrics(framework.fwkId);
    await this.create5ATags(entityId);
  }

  /**
   * Create 5A Stage tags for KMS tagging system.
   */
  private async create5ATags(entityId: string): Promise<void> {
    const stageTags = [
      { name: '#Advertise', display: 'Advertise', nameLocal: '광고/노출', color: '#3B82F6' },
      { name: '#Acquisition', display: 'Acquisition', nameLocal: '가입/전환', color: '#10B981' },
      { name: '#Activation', display: 'Activation', nameLocal: '활성화', color: '#F59E0B' },
      { name: '#Accelerate', display: 'Accelerate', nameLocal: '성장/가속', color: '#EF4444' },
      { name: '#Advocate', display: 'Advocate', nameLocal: '옹호/추천', color: '#8B5CF6' },
    ];

    for (const tagData of stageTags) {
      const exists = await this.tagRepository.findOne({
        where: { entId: entityId, tagName: tagData.name },
      });
      if (exists) continue;

      const tag = this.tagRepository.create({
        entId: entityId,
        tagName: tagData.name,
        tagDisplay: tagData.display,
        tagNameLocal: tagData.nameLocal,
        tagLevel: 1, // Domain level
        tagColor: tagData.color,
        tagIsSystem: true,
      } as Partial<KmsTagEntity>);

      try {
        await this.tagRepository.save(tag);
      } catch {
        // Ignore duplicate tag errors
      }
    }
  }

  private async createFramework(entityId: string): Promise<DddFrameworkEntity> {
    const entity = this.frameworkRepository.create({
      entId: entityId,
      fwkName: '5A Matrix',
      fwkDescription: 'amoeba company 2.0 Data-Driven Decision Framework based on Philip Kotler 5A Marketing Framework',
      fwkTemplate: {
        stages: [
          { key: 'advertise', label: { en: 'Advertise', ko: '광고/노출' }, icon: 'megaphone', color: '#3B82F6', order: 1, generalized: 'Lead Generation' },
          { key: 'acquisition', label: { en: 'Acquisition', ko: '가입/전환' }, icon: 'user-plus', color: '#10B981', order: 2, generalized: 'Client Acquisition' },
          { key: 'activation', label: { en: 'Activation', ko: '활성화' }, icon: 'zap', color: '#F59E0B', order: 3, generalized: 'Service Activation' },
          { key: 'accelerate', label: { en: 'Accelerate', ko: '성장/가속' }, icon: 'trending-up', color: '#EF4444', order: 4, generalized: 'Revenue Growth' },
          { key: 'advocate', label: { en: 'Advocate', ko: '옹호/추천' }, icon: 'heart', color: '#8B5CF6', order: 5, generalized: 'Client Advocacy' },
        ],
        gauges: [
          { key: 'process', label: { en: 'Process Maturity', ko: '프로세스 성숙도' }, weight: 0.3 },
          { key: 'capability', label: { en: 'Team Capability', ko: '팀 역량' }, weight: 0.4 },
          { key: 'quality', label: { en: 'Delivery Quality', ko: '산출물 품질' }, weight: 0.3 },
        ],
        strategy_steps: [
          { key: 'build', label: { en: 'Build', ko: '기반 구축' }, order: 1 },
          { key: 'launch', label: { en: 'Launch', ko: '시장 진입' }, order: 2 },
          { key: 'scale', label: { en: 'Scale', ko: '성장 가속' }, order: 3 },
          { key: 'diversify', label: { en: 'Diversify', ko: '다각화' }, order: 4 },
        ],
        service_mapping: {
          'DX/SI': { a1: 'RFP 참여 건수', a2: '수주율', a3: '킥오프 완료', a4: '마일스톤 달성률', a5: '레퍼런스 제공' },
          'Tech BPO': { a1: '파트너 소개', a2: '계약 전환율', a3: 'SLA 달성 시작', a4: '인력 증원', a5: '재계약율' },
          'Consulting': { a1: '세미나/웹비나', a2: '상담 전환율', a3: '진단 보고서', a4: 'ROI 실현', a5: '케이스 스터디' },
          'Platform': { a1: 'SEO/광고 유입', a2: '가입 전환율', a3: '첫 주문 발생', a4: 'GMV 성장률', a5: 'NPS/리뷰' },
        },
      },
      fwkVersion: '1.0.0',
    });
    return this.frameworkRepository.save(entity);
  }

  private async createMetrics(frameworkId: string): Promise<void> {
    const metrics = this.getMetrics();
    for (const m of metrics) {
      const entity = this.metricRepository.create({
        fwkId: frameworkId,
        metStage: m.stage,
        metKey: m.key,
        metLabel: m.label,
        metUnit: m.unit,
        metDirection: m.direction,
        metDataSource: m.dataSource,
        metIsPrimary: m.isPrimary,
        metOrder: m.order,
        metQueryConfig: m.queryConfig || null,
      });
      await this.metricRepository.save(entity);
    }
  }

  private getMetrics(): SeedMetric[] {
    return [
      // A1: Advertise — Lead Generation
      {
        stage: 'advertise', key: 'cost_per_lead', isPrimary: true, order: 1,
        label: { en: 'Cost per Lead', ko: '리드당 비용' },
        unit: '$', direction: 'DOWN', dataSource: 'MANUAL',
      },
      {
        stage: 'advertise', key: 'lead_count', isPrimary: false, order: 2,
        label: { en: 'Lead Count', ko: '리드 건수' },
        unit: '건', direction: 'UP', dataSource: 'SERVICE',
        queryConfig: { source: 'SERVICE', table: 'amb_svc_clients', aggregation: 'COUNT', filter: { status: 'NEW' }, period_field: 'cli_created_at' },
      },
      {
        stage: 'advertise', key: 'channel_distribution', isPrimary: false, order: 3,
        label: { en: 'Channel Distribution', ko: '채널별 유입 비율' },
        unit: '%', direction: 'UP', dataSource: 'MANUAL',
      },

      // A2: Acquisition — Client Acquisition
      {
        stage: 'acquisition', key: 'conversion_rate', isPrimary: true, order: 1,
        label: { en: 'Contract Conversion Rate', ko: '계약 전환율' },
        unit: '%', direction: 'UP', dataSource: 'BILLING',
        queryConfig: { source: 'BILLING', table: 'amb_bil_contracts', aggregation: 'RATIO', numerator: { status: 'ACTIVE' }, denominator: { status: ['DRAFT', 'ACTIVE', 'EXPIRED'] }, period_field: 'ctr_start_date' },
      },
      {
        stage: 'acquisition', key: 'new_contracts', isPrimary: false, order: 2,
        label: { en: 'New Contracts', ko: '신규 계약 건수' },
        unit: '건', direction: 'UP', dataSource: 'BILLING',
        queryConfig: { source: 'BILLING', table: 'amb_bil_contracts', aggregation: 'COUNT', filter: { status: 'ACTIVE' }, period_field: 'ctr_start_date' },
      },
      {
        stage: 'acquisition', key: 'pipeline_value', isPrimary: false, order: 3,
        label: { en: 'Pipeline Value', ko: '파이프라인 가치' },
        unit: '$', direction: 'UP', dataSource: 'BILLING',
        queryConfig: { source: 'BILLING', table: 'amb_bil_contracts', aggregation: 'SUM', field: 'ctr_amount', filter: { status: ['DRAFT', 'ACTIVE'] }, period_field: 'ctr_start_date' },
      },

      // A3: Activation — Service Activation
      {
        stage: 'activation', key: 'sla_fulfillment', isPrimary: true, order: 1,
        label: { en: 'SLA Fulfillment Rate', ko: 'SLA 충족률' },
        unit: '%', direction: 'UP', dataSource: 'SERVICE',
      },
      {
        stage: 'activation', key: 'kickoff_completed', isPrimary: false, order: 2,
        label: { en: 'Kickoff Completed', ko: '킥오프 완료 건' },
        unit: '건', direction: 'UP', dataSource: 'PROJECT',
        queryConfig: { source: 'PROJECT', table: 'amb_prj_projects', aggregation: 'COUNT', filter: { status: 'ACTIVE' }, period_field: 'prj_start_date' },
      },
      {
        stage: 'activation', key: 'first_delivery', isPrimary: false, order: 3,
        label: { en: 'First Delivery Count', ko: '첫 딜리버리 건' },
        unit: '건', direction: 'UP', dataSource: 'PROJECT',
      },

      // A4: Accelerate — Revenue Growth
      {
        stage: 'accelerate', key: 'revenue_growth_rate', isPrimary: true, order: 1,
        label: { en: 'Revenue Growth Rate (QoQ)', ko: '매출 성장률(QoQ)' },
        unit: '%', direction: 'UP', dataSource: 'BILLING',
        queryConfig: { source: 'BILLING', table: 'amb_bil_invoices', aggregation: 'SUM_QOQ', field: 'inv_total_amount', period_field: 'inv_issue_date' },
      },
      {
        stage: 'accelerate', key: 'cross_sell_count', isPrimary: false, order: 2,
        label: { en: 'Cross-sell Count', ko: '크로스셀 건수' },
        unit: '건', direction: 'UP', dataSource: 'BILLING',
      },
      {
        stage: 'accelerate', key: 'utilization_rate', isPrimary: false, order: 3,
        label: { en: 'Resource Utilization Rate', ko: '인력 가동률' },
        unit: '%', direction: 'UP', dataSource: 'HR',
        queryConfig: { source: 'HR', table: 'amb_hr_timesheets', aggregation: 'RATIO', numerator: 'total_hours', denominator: 'available_hours' },
      },

      // A5: Advocate — Client Advocacy
      {
        stage: 'advocate', key: 'renewal_rate', isPrimary: true, order: 1,
        label: { en: 'Contract Renewal Rate', ko: '재계약률' },
        unit: '%', direction: 'UP', dataSource: 'BILLING',
      },
      {
        stage: 'advocate', key: 'nps', isPrimary: false, order: 2,
        label: { en: 'Net Promoter Score', ko: 'NPS' },
        unit: '', direction: 'UP', dataSource: 'MANUAL',
      },
      {
        stage: 'advocate', key: 'referral_count', isPrimary: false, order: 3,
        label: { en: 'Referral Count', ko: '레퍼럴 건수' },
        unit: '건', direction: 'UP', dataSource: 'MANUAL',
      },
    ];
  }
}
