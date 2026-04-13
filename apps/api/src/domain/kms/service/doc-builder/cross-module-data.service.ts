import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DocBaseDataEntity } from '../../entity/doc-base-data.entity';
import { DocBaseDataHistoryEntity } from '../../entity/doc-base-data-history.entity';
import { DocBaseCategoryEntity } from '../../entity/doc-base-category.entity';

export interface ModuleSyncResult {
  module: string;
  categories: { code: string; action: 'CREATED' | 'UPDATED' | 'SKIPPED'; fieldCount: number }[];
  syncedAt: string;
}

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CrossModuleDataService {
  private readonly logger = new Logger(CrossModuleDataService.name);

  constructor(
    @InjectRepository(DocBaseDataEntity)
    private readonly baseDataRepository: Repository<DocBaseDataEntity>,
    @InjectRepository(DocBaseDataHistoryEntity)
    private readonly historyRepository: Repository<DocBaseDataHistoryEntity>,
    @InjectRepository(DocBaseCategoryEntity)
    private readonly categoryRepository: Repository<DocBaseCategoryEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Sync Billing module data → DocBuilder base data
   */
  async syncBilling(entityId: string, userId?: string): Promise<ModuleSyncResult> {
    const uid = userId || SYSTEM_USER_ID;
    const categories: ModuleSyncResult['categories'] = [];

    try {
      // 1. Client Portfolio from Partners
      const clientData = await this.collectClientPortfolio(entityId);
      if (clientData) {
        const result = await this.upsertCategory(entityId, 'CLIENT_PORTFOLIO', clientData, uid);
        categories.push(result);
      }

      // 2. Revenue Statistics from Invoices
      const revenueData = await this.collectRevenueStats(entityId);
      if (revenueData) {
        const result = await this.upsertCategory(entityId, 'REVENUE_METRICS', revenueData, uid);
        categories.push(result);
      }

      // 3. Contract Statistics
      const contractData = await this.collectContractStats(entityId);
      if (contractData) {
        const result = await this.upsertCategory(entityId, 'CONTRACT_OVERVIEW', contractData, uid);
        categories.push(result);
      }
    } catch (err) {
      this.logger.error(`Billing sync failed for entity ${entityId}`, err);
    }

    return { module: 'BILLING', categories, syncedAt: new Date().toISOString() };
  }

  /**
   * Sync HR module data → DocBuilder base data
   */
  async syncHr(entityId: string, userId?: string): Promise<ModuleSyncResult> {
    const uid = userId || SYSTEM_USER_ID;
    const categories: ModuleSyncResult['categories'] = [];

    try {
      // Team Composition data
      const teamData = await this.collectTeamComposition(entityId);
      if (teamData) {
        const result = await this.upsertCategory(entityId, 'TEAM_TALENT', teamData, uid);
        categories.push(result);
      }
    } catch (err) {
      this.logger.error(`HR sync failed for entity ${entityId}`, err);
    }

    return { module: 'HR', categories, syncedAt: new Date().toISOString() };
  }

  /**
   * Get sync status for all modules
   */
  async getSyncStatus(entityId: string): Promise<{
    ddd: { lastSyncAt: string | null; categoriesCount: number };
    billing: { lastSyncAt: string | null; categoriesCount: number };
    hr: { lastSyncAt: string | null; categoriesCount: number };
  }> {
    const getDddStatus = async () => {
      const dddCategories = await this.baseDataRepository
        .createQueryBuilder('d')
        .leftJoin('d.category', 'c')
        .where('d.entId = :entityId', { entityId })
        .andWhere('d.dbdIsCurrent = true')
        .andWhere('d.dbdUpdateSource = :src', { src: 'DDD_SYNC' })
        .orderBy('d.dbdUpdatedAt', 'DESC')
        .getMany();

      return {
        lastSyncAt: dddCategories[0]?.dbdUpdatedAt?.toISOString() || null,
        categoriesCount: dddCategories.length,
      };
    };

    const getModuleStatus = async (source: string) => {
      const records = await this.baseDataRepository
        .createQueryBuilder('d')
        .where('d.entId = :entityId', { entityId })
        .andWhere('d.dbdIsCurrent = true')
        .andWhere('d.dbdUpdateSource = :src', { src: `${source}_SYNC` })
        .orderBy('d.dbdUpdatedAt', 'DESC')
        .getMany();

      return {
        lastSyncAt: records[0]?.dbdUpdatedAt?.toISOString() || null,
        categoriesCount: records.length,
      };
    };

    const [ddd, billing, hr] = await Promise.all([
      getDddStatus(),
      getModuleStatus('BILLING'),
      getModuleStatus('HR'),
    ]);

    return { ddd, billing, hr };
  }

  // ===== Billing Data Collectors =====

  private async collectClientPortfolio(entityId: string): Promise<any | null> {
    try {
      // Active partners count
      const partners = await this.dataSource
        .createQueryBuilder()
        .select('COUNT(*)', 'total')
        .addSelect(`COUNT(CASE WHEN ptn_status = 'ACTIVE' THEN 1 END)`, 'active')
        .addSelect(`COUNT(DISTINCT ptn_country)`, 'countries')
        .from('amb_bil_partners', 'p')
        .where('p.ent_id = :entityId', { entityId })
        .andWhere('p.ptn_deleted_at IS NULL')
        .getRawOne();

      if (!partners || parseInt(partners.total) === 0) return null;

      // Country distribution
      const countryDist = await this.dataSource
        .createQueryBuilder()
        .select('ptn_country', 'country')
        .addSelect('COUNT(*)', 'count')
        .from('amb_bil_partners', 'p')
        .where('p.ent_id = :entityId', { entityId })
        .andWhere('p.ptn_deleted_at IS NULL')
        .andWhere(`p.ptn_status = 'ACTIVE'`)
        .groupBy('ptn_country')
        .orderBy('count', 'DESC')
        .getRawMany();

      return {
        total_partners: parseInt(partners.total),
        active_partners: parseInt(partners.active),
        countries: parseInt(partners.countries),
        country_distribution: countryDist.map((c) => ({
          country: c.country || 'Unknown',
          count: parseInt(c.count),
        })),
      };
    } catch (err) {
      this.logger.warn('Client portfolio collection failed', err);
      return null;
    }
  }

  private async collectRevenueStats(entityId: string): Promise<any | null> {
    try {
      const stats = await this.dataSource
        .createQueryBuilder()
        .select(`TO_CHAR(inv_issue_date, 'YYYY-MM')`, 'month')
        .addSelect('SUM(inv_total_amount)', 'revenue')
        .addSelect('COUNT(*)', 'invoice_count')
        .from('amb_bil_invoices', 'i')
        .where('i.ent_id = :entityId', { entityId })
        .andWhere('i.inv_deleted_at IS NULL')
        .andWhere(`i.inv_issue_date >= NOW() - INTERVAL '12 months'`)
        .groupBy(`TO_CHAR(inv_issue_date, 'YYYY-MM')`)
        .orderBy('month', 'ASC')
        .getRawMany();

      if (stats.length === 0) return null;

      return {
        monthly_revenue: stats.map((s) => ({
          month: s.month,
          revenue: parseFloat(s.revenue) || 0,
          invoice_count: parseInt(s.invoice_count),
        })),
        period: `Last 12 months`,
      };
    } catch (err) {
      this.logger.warn('Revenue stats collection failed', err);
      return null;
    }
  }

  private async collectContractStats(entityId: string): Promise<any | null> {
    try {
      const stats = await this.dataSource
        .createQueryBuilder()
        .select('COUNT(*)', 'total')
        .addSelect(`COUNT(CASE WHEN ctr_status = 'ACTIVE' THEN 1 END)`, 'active')
        .addSelect('AVG(EXTRACT(EPOCH FROM (ctr_end_date - ctr_start_date)) / 86400)', 'avg_days')
        .from('amb_bil_contracts', 'c')
        .where('c.ent_id = :entityId', { entityId })
        .andWhere('c.ctr_deleted_at IS NULL')
        .getRawOne();

      if (!stats || parseInt(stats.total) === 0) return null;

      // Category distribution
      const catDist = await this.dataSource
        .createQueryBuilder()
        .select('ctr_category', 'category')
        .addSelect('COUNT(*)', 'count')
        .from('amb_bil_contracts', 'c')
        .where('c.ent_id = :entityId', { entityId })
        .andWhere('c.ctr_deleted_at IS NULL')
        .groupBy('ctr_category')
        .orderBy('count', 'DESC')
        .getRawMany();

      return {
        total_contracts: parseInt(stats.total),
        active_contracts: parseInt(stats.active),
        avg_duration_days: Math.round(parseFloat(stats.avg_days) || 0),
        category_distribution: catDist.map((c) => ({
          category: c.category || 'Unknown',
          count: parseInt(c.count),
        })),
      };
    } catch (err) {
      this.logger.warn('Contract stats collection failed', err);
      return null;
    }
  }

  // ===== HR Data Collectors =====

  private async collectTeamComposition(entityId: string): Promise<any | null> {
    try {
      // Total employees by department
      const deptStats = await this.dataSource
        .createQueryBuilder()
        .select('emp_department', 'department')
        .addSelect('COUNT(*)', 'count')
        .from('amb_hr_employees', 'e')
        .where('e.ent_id = :entityId', { entityId })
        .andWhere('e.emp_deleted_at IS NULL')
        .andWhere(`e.emp_status = 'ACTIVE'`)
        .groupBy('emp_department')
        .orderBy('count', 'DESC')
        .getRawMany();

      if (deptStats.length === 0) return null;

      const totalCount = deptStats.reduce((sum, d) => sum + parseInt(d.count), 0);

      // Country distribution (KR/VN)
      const countryStats = await this.dataSource
        .createQueryBuilder()
        .select('emp_nationality', 'nationality')
        .addSelect('COUNT(*)', 'count')
        .from('amb_hr_employees', 'e')
        .where('e.ent_id = :entityId', { entityId })
        .andWhere('e.emp_deleted_at IS NULL')
        .andWhere(`e.emp_status = 'ACTIVE'`)
        .groupBy('emp_nationality')
        .orderBy('count', 'DESC')
        .getRawMany();

      return {
        total_employees: totalCount,
        department_breakdown: deptStats.map((d) => ({
          department: d.department || 'Unknown',
          count: parseInt(d.count),
        })),
        nationality_breakdown: countryStats.map((c) => ({
          nationality: c.nationality || 'Unknown',
          count: parseInt(c.count),
        })),
      };
    } catch (err) {
      this.logger.warn('Team composition collection failed', err);
      return null;
    }
  }

  // ===== Shared Upsert =====

  private async upsertCategory(
    entityId: string,
    categoryCode: string,
    data: any,
    userId: string,
  ): Promise<{ code: string; action: 'CREATED' | 'UPDATED' | 'SKIPPED'; fieldCount: number }> {
    const category = await this.categoryRepository.findOne({
      where: { entId: entityId, dbcCode: categoryCode, dbcIsActive: true },
    });

    if (!category) {
      return { code: categoryCode, action: 'SKIPPED', fieldCount: 0 };
    }

    const existing = await this.baseDataRepository.findOne({
      where: { dbcId: category.dbcId, entId: entityId, dbdLanguage: 'en', dbdIsCurrent: true },
    });

    const source = categoryCode.startsWith('CLIENT') || categoryCode.startsWith('REVENUE') || categoryCode.startsWith('CONTRACT')
      ? 'BILLING_SYNC' : 'HR_SYNC';

    if (existing) {
      const history = this.historyRepository.create({
        dbdId: existing.dbdId,
        dbhVersion: existing.dbdVersion,
        dbhData: existing.dbdData,
        dbhChangeReason: `${source} auto-sync`,
        dbhChangedBy: userId,
      });
      await this.historyRepository.save(history);

      existing.dbdData = data;
      existing.dbdVersion += 1;
      existing.dbdUpdatedBy = userId;
      existing.dbdUpdateSource = 'MODULE_SYNC';
      existing.dbdFreshnessAt = new Date();
      await this.baseDataRepository.save(existing);

      return { code: categoryCode, action: 'UPDATED', fieldCount: Object.keys(data).length };
    } else {
      const entity = this.baseDataRepository.create({
        dbcId: category.dbcId,
        entId: entityId,
        dbdLanguage: 'en',
        dbdData: data,
        dbdVersion: 1,
        dbdIsCurrent: true,
        dbdUpdatedBy: userId,
        dbdUpdateSource: 'MODULE_SYNC',
      });
      await this.baseDataRepository.save(entity);

      return { code: categoryCode, action: 'CREATED', fieldCount: Object.keys(data).length };
    }
  }
}
