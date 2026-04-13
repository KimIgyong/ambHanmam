import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocTypeEntity } from '../entity/doc-type.entity';
import { DocBaseCategoryEntity } from '../entity/doc-base-category.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

interface SeedDocType {
  code: string;
  name: string;
  nameKr: string;
  description: string;
  inheritsFromCode?: string;
  sectionTemplate: any[];
  baseDataRefs: string[];
}

interface SeedCategory {
  code: string;
  name: string;
  nameKr: string;
  description: string;
  fieldSchema: any[];
  dataSource: string;
  confidentiality: string;
  displayOrder: number;
}

@Injectable()
export class DocBuilderSeedService implements OnModuleInit {
  private readonly logger = new Logger(DocBuilderSeedService.name);

  constructor(
    @InjectRepository(DocTypeEntity)
    private readonly docTypeRepository: Repository<DocTypeEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedIfEmpty();
    } catch (err) {
      this.logger.warn('DocBuilder seed skipped (tables may not exist yet)', err?.message);
    }
  }

  private async seedIfEmpty(): Promise<void> {
    const count = await this.docTypeRepository.count();
    if (count > 0) {
      this.logger.log('DocBuilder types already exist, skipping seed');
      return;
    }

    const entities = await this.entityRepository.find();
    if (entities.length === 0) {
      this.logger.warn('No entities found, skipping DocBuilder seed');
      return;
    }

    for (const entity of entities) {
      await this.seedForEntity(entity.entId);
    }
    this.logger.log(`Seeded DocBuilder data for ${entities.length} entities`);
  }

  async seedForEntity(entityId: string): Promise<void> {
    await this.seedDocTypes(entityId);
    await this.seedCategories(entityId);
  }

  private async seedDocTypes(entityId: string): Promise<void> {
    const types = this.getDocTypes();

    // First pass: create types without inheritance
    const typeMap = new Map<string, string>();
    for (const t of types) {
      const entity = this.docTypeRepository.create({
        entId: entityId,
        dtpCode: t.code,
        dtpName: t.name,
        dtpNameKr: t.nameKr,
        dtpDescription: t.description,
        dtpSectionTemplate: t.sectionTemplate,
        dtpBaseDataRefs: t.baseDataRefs,
      });
      const saved = await this.docTypeRepository.save(entity);
      typeMap.set(t.code, saved.dtpId);
    }

    // Second pass: set inheritance
    for (const t of types) {
      if (t.inheritsFromCode) {
        const parentId = typeMap.get(t.inheritsFromCode);
        if (parentId) {
          await this.docTypeRepository.update(
            { dtpId: typeMap.get(t.code) },
            { dtpInheritsFrom: parentId },
          );
        }
      }
    }
  }

  private async seedCategories(entityId: string): Promise<void> {
    const categories = this.getCategories();
    for (const c of categories) {
      const entity = this.categoryRepository.create({
        entId: entityId,
        dbcCode: c.code,
        dbcName: c.name,
        dbcNameKr: c.nameKr,
        dbcDescription: c.description,
        dbcFieldSchema: c.fieldSchema,
        dbcDataSource: c.dataSource,
        dbcConfidentiality: c.confidentiality,
        dbcDisplayOrder: c.displayOrder,
      });
      await this.categoryRepository.save(entity);
    }
  }

  private getDocTypes(): SeedDocType[] {
    return [
      {
        code: 'COMPANY_INTRO',
        name: 'Company Introduction',
        nameKr: '회사소개서',
        description: 'Corporate profile for clients, partners, and government entities',
        sectionTemplate: [
          { order: 1, code: 'COVER', name: 'Cover Page', required: true },
          { order: 2, code: 'ABOUT', name: 'About Us', required: true },
          { order: 3, code: 'VISION', name: 'Vision & Mission', required: true },
          { order: 4, code: 'HISTORY', name: 'Company History', required: false },
          { order: 5, code: 'LEADERSHIP', name: 'Leadership Team', required: true },
          { order: 6, code: 'ORGANIZATION', name: 'Organization', required: false },
          { order: 7, code: 'SERVICES', name: 'Services Overview', required: true },
          { order: 8, code: 'CLIENTS', name: 'Client Portfolio', required: true },
          { order: 9, code: 'COMPETENCY', name: 'Core Competencies', required: true },
          { order: 10, code: 'CONTACT', name: 'Contact Information', required: true },
        ],
        baseDataRefs: ['COMPANY_IDENTITY', 'CORE_VALUES', 'LEGAL_ENTITIES', 'HISTORY', 'LEADERSHIP', 'ORGANIZATION', 'SERVICE_PORTFOLIO', 'COMPETITIVE_ADVANTAGE'],
      },
      {
        code: 'SERVICE_INTRO',
        name: 'Service Introduction',
        nameKr: '서비스소개서',
        description: 'Service-specific introduction for B2B clients',
        inheritsFromCode: 'COMPANY_INTRO',
        sectionTemplate: [
          { order: 1, code: 'COVER', name: 'Cover Page', required: true },
          { order: 2, code: 'ABOUT', name: 'About Us', required: true },
          { order: 3, code: 'SERVICE_DETAIL', name: 'Service Details', required: true },
          { order: 4, code: 'METHODOLOGY', name: 'Methodology', required: true },
          { order: 5, code: 'DELIVERY', name: 'Delivery Model', required: true },
          { order: 6, code: 'CASE_STUDIES', name: 'Case Studies', required: true },
          { order: 7, code: 'TECH_STACK', name: 'Technology Stack', required: false },
          { order: 8, code: 'QUALITY', name: 'Quality & SLA', required: true },
          { order: 9, code: 'PRICING', name: 'Pricing Overview', required: false },
          { order: 10, code: 'CONTACT', name: 'Contact Information', required: true },
        ],
        baseDataRefs: ['COMPANY_IDENTITY', 'SERVICE_PORTFOLIO', 'COMPETITIVE_ADVANTAGE', 'BUSINESS_MODEL', 'MARKETING_STRATEGY'],
      },
      {
        code: 'PRODUCT_INTRO',
        name: 'Product Introduction',
        nameKr: '제품소개서',
        description: 'Product-specific introduction for SaaS buyers',
        sectionTemplate: [
          { order: 1, code: 'COVER', name: 'Cover Page', required: true },
          { order: 2, code: 'PRODUCT_OVERVIEW', name: 'Product Overview', required: true },
          { order: 3, code: 'FEATURES', name: 'Key Features', required: true },
          { order: 4, code: 'ARCHITECTURE', name: 'Architecture', required: false },
          { order: 5, code: 'SCREENSHOTS', name: 'Screenshots & Demo', required: true },
          { order: 6, code: 'PRICING', name: 'Pricing Plans', required: true },
          { order: 7, code: 'INTEGRATION', name: 'Integration', required: false },
          { order: 8, code: 'TESTIMONIALS', name: 'Customer Testimonials', required: false },
          { order: 9, code: 'ROADMAP', name: 'Product Roadmap', required: false },
          { order: 10, code: 'CONTACT', name: 'Contact & Support', required: true },
        ],
        baseDataRefs: ['COMPANY_IDENTITY', 'PRODUCT_CATALOG', 'COMPETITIVE_ADVANTAGE'],
      },
      {
        code: 'STRATEGY_IR',
        name: 'Strategy / IR Document',
        nameKr: '전략소개서(IR)',
        description: 'Investor Relations document following Sequoia 10-topic framework',
        sectionTemplate: [
          { order: 1, code: 'COVER', name: 'Cover Page', required: true },
          { order: 2, code: 'PURPOSE', name: 'Company Purpose', required: true },
          { order: 3, code: 'PROBLEM', name: 'Problem', required: true },
          { order: 4, code: 'SOLUTION', name: 'Solution', required: true },
          { order: 5, code: 'WHY_NOW', name: 'Why Now', required: true },
          { order: 6, code: 'MARKET', name: 'Market Size', required: true },
          { order: 7, code: 'COMPETITION', name: 'Competition', required: true },
          { order: 8, code: 'PRODUCT', name: 'Product', required: true },
          { order: 9, code: 'BUSINESS_MODEL', name: 'Business Model', required: true },
          { order: 10, code: 'TEAM', name: 'Team', required: true },
          { order: 11, code: 'FINANCIALS', name: 'Financials', required: true },
          { order: 12, code: 'TRACTION', name: 'Traction & Metrics', required: true },
          { order: 13, code: 'GROWTH', name: 'Growth Strategy', required: true },
          { order: 14, code: 'FIVE_A_SUMMARY', name: '5A Matrix Summary', required: false },
          { order: 15, code: 'ASK', name: 'The Ask', required: true },
        ],
        baseDataRefs: [
          'COMPANY_IDENTITY', 'CORE_VALUES', 'LEGAL_ENTITIES', 'HISTORY', 'LEADERSHIP',
          'ORGANIZATION', 'SERVICE_PORTFOLIO', 'PRODUCT_CATALOG', 'FINANCIAL_SUMMARY',
          'MARKET_ANALYSIS', 'BUSINESS_MODEL', 'GROWTH_STRATEGY', 'EXECUTION_ROADMAP',
          'COMPETITIVE_ADVANTAGE', 'TEAM_TALENT', 'RISK_FACTORS', 'FUNDING_HISTORY',
          'KPI_DASHBOARD', 'OPERATIONAL_READINESS', '5A_INSIGHTS',
        ],
      },
    ];
  }

  private getCategories(): SeedCategory[] {
    return [
      {
        code: 'COMPANY_IDENTITY', name: 'Company Identity', nameKr: '회사 정체성',
        description: 'Core company information (name, founding, vision, mission)',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 1,
        fieldSchema: [
          { field: 'company_name_en', type: 'text', required: true, label: 'Company Name (EN)' },
          { field: 'company_name_kr', type: 'text', required: false, label: 'Company Name (KR)' },
          { field: 'tagline_en', type: 'text', required: false, label: 'Tagline (EN)' },
          { field: 'founding_date', type: 'date', required: true, label: 'Founding Date' },
          { field: 'vision_en', type: 'richtext', required: true, label: 'Vision (EN)' },
          { field: 'mission_en', type: 'richtext', required: true, label: 'Mission (EN)' },
          { field: 'core_philosophy', type: 'text', required: false, label: 'Core Philosophy' },
          { field: 'website', type: 'url', required: false, label: 'Website URL' },
        ],
      },
      {
        code: 'CORE_VALUES', name: 'Core Values', nameKr: '핵심 가치',
        description: 'Company core values and principles',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 2,
        fieldSchema: [
          { field: 'values', type: 'json_array', required: true, label: 'Core Values',
            schema: { name_en: 'text', name_kr: 'text', description_en: 'text' } },
        ],
      },
      {
        code: 'LEGAL_ENTITIES', name: 'Legal Entities', nameKr: '법인 정보',
        description: 'Legal entity registration and address details',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 3,
        fieldSchema: [
          { field: 'entities', type: 'json_array', required: true, label: 'Legal Entities',
            schema: { name: 'text', country: 'text', registration_number: 'text', address: 'text', representative: 'text', established: 'date' } },
        ],
      },
      {
        code: 'HISTORY', name: 'Company History', nameKr: '회사 연혁',
        description: 'Key milestones and timeline',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 4,
        fieldSchema: [
          { field: 'milestones', type: 'json_array', required: true, label: 'Milestones',
            schema: { year: 'number', month: 'number', event_en: 'text', event_kr: 'text' } },
        ],
      },
      {
        code: 'LEADERSHIP', name: 'Leadership Team', nameKr: '리더십 팀',
        description: 'Executive team and key personnel',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 5,
        fieldSchema: [
          { field: 'leaders', type: 'json_array', required: true, label: 'Leaders',
            schema: { name: 'text', title_en: 'text', title_kr: 'text', bio_en: 'text', photo_url: 'file' } },
        ],
      },
      {
        code: 'ORGANIZATION', name: 'Organization', nameKr: '조직 구조',
        description: 'Organization structure and headcount',
        dataSource: 'HR_MODULE', confidentiality: 'INTERNAL', displayOrder: 6,
        fieldSchema: [
          { field: 'total_headcount', type: 'number', required: true, label: 'Total Headcount' },
          { field: 'kr_headcount', type: 'number', required: false, label: 'KR Headcount' },
          { field: 'vn_headcount', type: 'number', required: false, label: 'VN Headcount' },
          { field: 'departments', type: 'json_array', required: false, label: 'Departments',
            schema: { name: 'text', headcount: 'number', location: 'text' } },
          { field: 'org_chart_url', type: 'file', required: false, label: 'Org Chart Image' },
        ],
      },
      {
        code: 'SERVICE_PORTFOLIO', name: 'Service Portfolio', nameKr: '서비스 포트폴리오',
        description: 'All service offerings and categories',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 7,
        fieldSchema: [
          { field: 'categories', type: 'json_array', required: true, label: 'Service Categories',
            schema: { code: 'text', name_en: 'text', name_kr: 'text', description_en: 'text', target_market: 'text' } },
        ],
      },
      {
        code: 'PRODUCT_CATALOG', name: 'Product Catalog', nameKr: '제품 카탈로그',
        description: 'SaaS products and platforms',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 8,
        fieldSchema: [
          { field: 'products', type: 'json_array', required: true, label: 'Products',
            schema: { name: 'text', description_en: 'text', tech_stack: 'text', status: 'text', url: 'url' } },
        ],
      },
      {
        code: 'COMPETITIVE_ADVANTAGE', name: 'Competitive Advantage', nameKr: '경쟁 우위',
        description: 'Unique selling points and differentiators',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 9,
        fieldSchema: [
          { field: 'advantages', type: 'json_array', required: true, label: 'Advantages',
            schema: { title_en: 'text', description_en: 'text', evidence: 'text' } },
        ],
      },
      {
        code: 'MARKET_ANALYSIS', name: 'Market Analysis', nameKr: '시장 분석',
        description: 'TAM/SAM/SOM and market positioning',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 10,
        fieldSchema: [
          { field: 'tam', type: 'text', required: false, label: 'TAM (Total Addressable Market)' },
          { field: 'sam', type: 'text', required: false, label: 'SAM (Serviceable Available Market)' },
          { field: 'som', type: 'text', required: false, label: 'SOM (Serviceable Obtainable Market)' },
          { field: 'positioning', type: 'richtext', required: false, label: 'Market Positioning' },
          { field: 'competitors', type: 'json_array', required: false, label: 'Key Competitors',
            schema: { name: 'text', strengths: 'text', weaknesses: 'text' } },
        ],
      },
      {
        code: 'BUSINESS_MODEL', name: 'Business Model', nameKr: '비즈니스 모델',
        description: 'Revenue model and pricing structure',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 11,
        fieldSchema: [
          { field: 'revenue_model', type: 'richtext', required: true, label: 'Revenue Model' },
          { field: 'pricing_structure', type: 'richtext', required: false, label: 'Pricing Structure' },
          { field: 'unit_economics', type: 'json', required: false, label: 'Unit Economics (LTV, CAC, etc.)' },
        ],
      },
      {
        code: 'FINANCIAL_SUMMARY', name: 'Financial Summary', nameKr: '재무 요약',
        description: 'Revenue, profit, and key financial metrics',
        dataSource: 'BILLING_MODULE', confidentiality: 'CONFIDENTIAL', displayOrder: 12,
        fieldSchema: [
          { field: 'annual_revenue', type: 'json_array', required: false, label: 'Annual Revenue',
            schema: { year: 'number', amount: 'number', currency: 'text' } },
          { field: 'monthly_revenue', type: 'json_array', required: false, label: 'Monthly Revenue',
            schema: { month: 'text', amount: 'number', currency: 'text' } },
          { field: 'profit_margin', type: 'number', required: false, label: 'Profit Margin (%)' },
          { field: 'key_metrics', type: 'json', required: false, label: 'Key Financial Metrics' },
        ],
      },
      {
        code: 'GROWTH_STRATEGY', name: 'Growth Strategy', nameKr: '성장 전략',
        description: 'Growth plan and strategic roadmap',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 13,
        fieldSchema: [
          { field: 'strategy_summary', type: 'richtext', required: true, label: 'Strategy Summary' },
          { field: 'growth_phases', type: 'json_array', required: false, label: 'Growth Phases',
            schema: { phase: 'text', period: 'text', goals: 'text' } },
          { field: 'current_phase', type: 'text', required: false, label: 'Current Phase' },
        ],
      },
      {
        code: 'EXECUTION_ROADMAP', name: 'Execution Roadmap', nameKr: '실행 로드맵',
        description: 'Detailed execution plan with timeline',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 14,
        fieldSchema: [
          { field: 'milestones', type: 'json_array', required: false, label: 'Execution Milestones',
            schema: { quarter: 'text', milestone: 'text', status: 'text' } },
        ],
      },
      {
        code: 'VIETNAM_LOCALIZATION', name: 'Vietnam Localization', nameKr: '베트남 현지화',
        description: 'Vietnam-specific operations and compliance',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 15,
        fieldSchema: [
          { field: 'vn_entity_info', type: 'json', required: false, label: 'VN Entity Info' },
          { field: 'localization_status', type: 'richtext', required: false, label: 'Localization Status' },
          { field: 'compliance', type: 'json_array', required: false, label: 'Compliance Items',
            schema: { item: 'text', status: 'text', notes: 'text' } },
        ],
      },
      {
        code: 'TEAM_TALENT', name: 'Team & Talent', nameKr: '팀 & 인재',
        description: 'Team composition and talent highlights for IR',
        dataSource: 'HR_MODULE', confidentiality: 'INTERNAL', displayOrder: 16,
        fieldSchema: [
          { field: 'team_highlights', type: 'richtext', required: false, label: 'Team Highlights' },
          { field: 'key_hires', type: 'json_array', required: false, label: 'Key Hires',
            schema: { name: 'text', role: 'text', background: 'text' } },
          { field: 'culture', type: 'richtext', required: false, label: 'Company Culture' },
        ],
      },
      {
        code: 'RISK_FACTORS', name: 'Risk Factors', nameKr: '리스크 요인',
        description: 'Key risk factors and mitigation strategies',
        dataSource: 'MANUAL', confidentiality: 'CONFIDENTIAL', displayOrder: 17,
        fieldSchema: [
          { field: 'risks', type: 'json_array', required: false, label: 'Risk Factors',
            schema: { category: 'text', risk: 'text', impact: 'text', mitigation: 'text' } },
        ],
      },
      {
        code: 'FUNDING_HISTORY', name: 'Funding History', nameKr: '투자 이력',
        description: 'Previous funding rounds and investor information',
        dataSource: 'MANUAL', confidentiality: 'CONFIDENTIAL', displayOrder: 18,
        fieldSchema: [
          { field: 'rounds', type: 'json_array', required: false, label: 'Funding Rounds',
            schema: { round: 'text', date: 'date', amount: 'number', currency: 'text', investors: 'text' } },
          { field: 'shareholder_structure', type: 'json', required: false, label: 'Shareholder Structure' },
        ],
      },
      {
        code: 'MARKETING_STRATEGY', name: 'Marketing Strategy', nameKr: '마케팅 전략',
        description: 'Go-to-market and marketing approach',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 19,
        fieldSchema: [
          { field: 'gtm_strategy', type: 'richtext', required: false, label: 'Go-to-Market Strategy' },
          { field: 'channels', type: 'json_array', required: false, label: 'Marketing Channels',
            schema: { channel: 'text', type: 'text', effectiveness: 'text' } },
        ],
      },
      {
        code: 'BRAND_ASSETS', name: 'Brand Assets', nameKr: '브랜드 자산',
        description: 'Brand guidelines, logos, and visual identity',
        dataSource: 'MANUAL', confidentiality: 'PUBLIC', displayOrder: 20,
        fieldSchema: [
          { field: 'primary_color', type: 'text', required: false, label: 'Primary Color (HEX)' },
          { field: 'secondary_color', type: 'text', required: false, label: 'Secondary Color (HEX)' },
          { field: 'font_heading', type: 'text', required: false, label: 'Heading Font' },
          { field: 'font_body', type: 'text', required: false, label: 'Body Font' },
          { field: 'logo_variants', type: 'json_array', required: false, label: 'Logo Variants',
            schema: { name: 'text', usage: 'text', file_url: 'file' } },
        ],
      },
      // ★ DDD 연동용 카테고리
      {
        code: 'KPI_DASHBOARD', name: 'KPI Dashboard', nameKr: 'KPI 대시보드',
        description: '5A Matrix KPI data auto-synced from DDD module',
        dataSource: 'DDD', confidentiality: 'INTERNAL', displayOrder: 21,
        fieldSchema: [
          { field: 'period', type: 'text', required: true, label: 'Snapshot Period' },
          { field: 'stages', type: 'json_array', required: true, label: '5A Stage KPIs',
            schema: { stage: 'text', primary_kpi_label: 'text', value: 'number', unit: 'text', change_rate: 'number', status: 'text' } },
          { field: 'summary', type: 'richtext', required: false, label: 'KPI Summary' },
        ],
      },
      {
        code: 'OPERATIONAL_READINESS', name: 'Operational Readiness', nameKr: '운영 성숙도',
        description: 'Operational Readiness Gauge scores from DDD module',
        dataSource: 'DDD', confidentiality: 'INTERNAL', displayOrder: 22,
        fieldSchema: [
          { field: 'total_score', type: 'number', required: true, label: 'Total Readiness Score (%)' },
          { field: 'process_score', type: 'number', required: false, label: 'Process Score' },
          { field: 'capability_score', type: 'number', required: false, label: 'Capability Score' },
          { field: 'quality_score', type: 'number', required: false, label: 'Quality Score' },
          { field: 'assessment_period', type: 'text', required: false, label: 'Assessment Period' },
        ],
      },
      {
        code: '5A_INSIGHTS', name: '5A AI Insights', nameKr: '5A AI 인사이트',
        description: 'Top AI insights from 5A Matrix analysis',
        dataSource: 'DDD', confidentiality: 'INTERNAL', displayOrder: 23,
        fieldSchema: [
          { field: 'insights', type: 'json_array', required: false, label: 'AI Insights',
            schema: { type: 'text', severity: 'text', title: 'text', content: 'text', stage: 'text' } },
          { field: 'generated_at', type: 'date', required: false, label: 'Generated At' },
        ],
      },
      {
        code: 'LEGAL_REGISTRATION', name: 'Legal Registration', nameKr: '법적 등록 문서',
        description: 'Business registration certificates and legal documents',
        dataSource: 'MANUAL', confidentiality: 'CONFIDENTIAL', displayOrder: 24,
        fieldSchema: [
          { field: 'documents', type: 'json_array', required: false, label: 'Legal Documents',
            schema: { type: 'text', name: 'text', number: 'text', issue_date: 'date', file_url: 'file' } },
        ],
      },
      {
        code: 'IR_FRAMEWORK', name: 'IR Framework', nameKr: 'IR 프레임워크',
        description: 'Sequoia 10-topic IR framework configuration',
        dataSource: 'MANUAL', confidentiality: 'INTERNAL', displayOrder: 25,
        fieldSchema: [
          { field: 'framework_type', type: 'text', required: true, label: 'Framework Type' },
          { field: 'tips', type: 'json_array', required: false, label: 'IR Tips',
            schema: { topic: 'text', tip: 'text', source: 'text' } },
        ],
      },
    ];
  }
}
