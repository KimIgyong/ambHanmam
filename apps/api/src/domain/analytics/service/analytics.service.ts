import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SiteEventLogEntity } from '../entity/site-event-log.entity';
import { SiteSettingsEntity } from '../../settings/entity/site-settings.entity';
import { LoginHistoryEntity } from '../../entity-settings/entity/login-history.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CreateSiteEventRequest } from '../dto/request/create-site-event.request';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(SiteEventLogEntity)
    private readonly eventLogRepo: Repository<SiteEventLogEntity>,
    @InjectRepository(SiteSettingsEntity)
    private readonly siteSettingsRepo: Repository<SiteSettingsEntity>,
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepo: Repository<LoginHistoryEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  // ── GA Settings ──

  async getGaSettings(): Promise<{ portalGaMeasurementId: string | null; appGaMeasurementId: string | null }> {
    const entities = await this.entityRepo.find({ order: { entCode: 'ASC' } });
    if (entities.length === 0) return { portalGaMeasurementId: null, appGaMeasurementId: null };
    const settings = await this.siteSettingsRepo.findOne({ where: { entId: entities[0].entId } });
    return {
      portalGaMeasurementId: settings?.stsGaMeasurementId ?? null,
      appGaMeasurementId: settings?.stsAppGaMeasurementId ?? null,
    };
  }

  async updateGaSettings(
    data: { portal_ga_measurement_id?: string; app_ga_measurement_id?: string },
    userId: string,
  ) {
    // 포털 GA 설정은 첫번째 entity의 site_settings에 저장
    const entities = await this.entityRepo.find({ order: { entCode: 'ASC' } });
    if (entities.length === 0) return { success: true };

    const firstEntId = entities[0].entId;
    let settings = await this.siteSettingsRepo.findOne({ where: { entId: firstEntId } });
    if (!settings) {
      settings = this.siteSettingsRepo.create({ entId: firstEntId });
    }

    if (data.portal_ga_measurement_id !== undefined) {
      settings.stsGaMeasurementId = data.portal_ga_measurement_id || null;
    }
    if (data.app_ga_measurement_id !== undefined) {
      settings.stsAppGaMeasurementId = data.app_ga_measurement_id || null;
    }
    settings.stsUpdatedBy = userId;

    await this.siteSettingsRepo.save(settings);
    return { success: true };
  }

  // ── Event Logging ──

  async recordEvent(
    dto: CreateSiteEventRequest,
    ip?: string,
    userAgent?: string,
    userId?: string,
  ): Promise<void> {
    const entity = this.eventLogRepo.create({
      selSite: dto.site,
      selEventType: dto.event_type,
      selEntityId: dto.entity_id || null,
      selUserId: userId || null,
      selPagePath: dto.page_path || null,
      selReferrer: dto.referrer || null,
      selIpAddress: ip || null,
      selUserAgent: userAgent ? userAgent.substring(0, 500) : null,
      selMetadata: dto.metadata || {},
    });

    await this.eventLogRepo.save(entity).catch((err) => {
      this.logger.warn(`Event log save failed: ${err.message}`);
    });
  }

  // ── Portal Statistics ──

  async getPortalSummary(startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    const [pageViews, logins, registerVisits, subscriptions, amaNavigations] = await Promise.all([
      this.eventLogRepo.count({
        where: { selSite: 'portal', selEventType: 'page_view', selCreatedAt: Between(start, end) },
      }),
      this.eventLogRepo.count({
        where: { selSite: 'portal', selEventType: 'login', selCreatedAt: Between(start, end) },
      }),
      this.eventLogRepo.count({
        where: { selSite: 'portal', selEventType: 'register_visit', selCreatedAt: Between(start, end) },
      }),
      this.eventLogRepo.count({
        where: { selSite: 'portal', selEventType: 'subscription', selCreatedAt: Between(start, end) },
      }),
      this.eventLogRepo.count({
        where: { selSite: 'portal', selEventType: 'ama_navigation', selCreatedAt: Between(start, end) },
      }),
    ]);

    return { pageViews, logins, registerVisits, subscriptions, amaNavigations };
  }

  async getPortalVisitorTrend(startDate: string, endDate: string) {
    const result = await this.eventLogRepo
      .createQueryBuilder('e')
      .select("DATE(e.sel_created_at AT TIME ZONE 'UTC')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.sel_site = :site', { site: 'portal' })
      .andWhere('e.sel_event_type = :type', { type: 'page_view' })
      .andWhere('e.sel_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .groupBy("DATE(e.sel_created_at AT TIME ZONE 'UTC')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  async getPortalReferrers(startDate: string, endDate: string) {
    const result = await this.eventLogRepo
      .createQueryBuilder('e')
      .select('e.sel_referrer', 'referrer')
      .addSelect('COUNT(*)', 'count')
      .where('e.sel_site = :site', { site: 'portal' })
      .andWhere('e.sel_event_type = :type', { type: 'page_view' })
      .andWhere('e.sel_referrer IS NOT NULL')
      .andWhere('e.sel_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .groupBy('e.sel_referrer')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    return result.map((r) => ({ referrer: r.referrer || 'Direct', count: Number(r.count) }));
  }

  async getPortalTrafficSources(startDate: string, endDate: string) {
    const start = startDate + 'T00:00:00Z';
    const end = endDate + 'T23:59:59.999Z';

    const result = await this.eventLogRepo
      .createQueryBuilder('e')
      .select('e.sel_referrer', 'referrer')
      .addSelect('COUNT(*)', 'count')
      .where('e.sel_site = :site', { site: 'portal' })
      .andWhere('e.sel_event_type = :type', { type: 'page_view' })
      .andWhere('e.sel_created_at BETWEEN :start AND :end', { start, end })
      .groupBy('e.sel_referrer')
      .getRawMany();

    const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'yandex', 'naver', 'daum', 'coccoc', 'sogou'];
    const socialNetworks = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'reddit', 'zalo', 't.co'];

    let direct = 0;
    let search = 0;
    let social = 0;
    let referral = 0;
    const searchDetails: Record<string, number> = {};
    const socialDetails: Record<string, number> = {};
    const referralDetails: Record<string, number> = {};

    for (const row of result) {
      const count = Number(row.count);
      const ref = (row.referrer || '').toLowerCase().trim();

      if (!ref) {
        direct += count;
        continue;
      }

      const matchedEngine = searchEngines.find((e) => ref.includes(e));
      if (matchedEngine) {
        search += count;
        searchDetails[matchedEngine] = (searchDetails[matchedEngine] || 0) + count;
        continue;
      }

      const matchedSocial = socialNetworks.find((s) => ref.includes(s));
      if (matchedSocial) {
        social += count;
        const name = matchedSocial === 't.co' ? 'twitter' : matchedSocial;
        socialDetails[name] = (socialDetails[name] || 0) + count;
        continue;
      }

      referral += count;
      try {
        const hostname = ref.startsWith('http') ? new URL(ref).hostname : ref;
        referralDetails[hostname] = (referralDetails[hostname] || 0) + count;
      } catch {
        referralDetails[ref] = (referralDetails[ref] || 0) + count;
      }
    }

    const toSorted = (obj: Record<string, number>) =>
      Object.entries(obj)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return {
      summary: [
        { channel: 'direct', count: direct },
        { channel: 'search', count: search },
        { channel: 'social', count: social },
        { channel: 'referral', count: referral },
      ],
      total: direct + search + social + referral,
      searchDetails: toSorted(searchDetails),
      socialDetails: toSorted(socialDetails),
      referralDetails: toSorted(referralDetails),
    };
  }

  async getPortalPages(startDate: string, endDate: string) {
    const result = await this.eventLogRepo
      .createQueryBuilder('e')
      .select('e.sel_page_path', 'pagePath')
      .addSelect('COUNT(*)', 'count')
      .where('e.sel_site = :site', { site: 'portal' })
      .andWhere('e.sel_event_type = :type', { type: 'page_view' })
      .andWhere('e.sel_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .groupBy('e.sel_page_path')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    return result.map((r) => ({ pagePath: r.pagePath || '/', count: Number(r.count) }));
  }

  // ── App Statistics ──

  async getAppSummary(startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    // 앱 로그인은 기존 amb_login_histories 테이블 활용
    const [totalLogins, activeEntities, totalVisitors] = await Promise.all([
      this.loginHistoryRepo.count({
        where: { lghCreatedAt: Between(start, end) },
      }),
      this.loginHistoryRepo
        .createQueryBuilder('lh')
        .select('COUNT(DISTINCT lh.ent_id)', 'count')
        .where('lh.lgh_created_at BETWEEN :start AND :end', { start, end })
        .andWhere('lh.ent_id IS NOT NULL')
        .getRawOne()
        .then((r) => Number(r?.count ?? 0)),
      this.loginHistoryRepo
        .createQueryBuilder('lh')
        .select('COUNT(DISTINCT lh.usr_id)', 'count')
        .where('lh.lgh_created_at BETWEEN :start AND :end', { start, end })
        .getRawOne()
        .then((r) => Number(r?.count ?? 0)),
    ]);

    return { totalLogins, activeEntities, totalVisitors };
  }

  async getAppVisitorTrend(startDate: string, endDate: string) {
    const result = await this.loginHistoryRepo
      .createQueryBuilder('lh')
      .select("DATE(lh.lgh_created_at AT TIME ZONE 'UTC')", 'date')
      .addSelect('COUNT(*)', 'loginCount')
      .addSelect('COUNT(DISTINCT lh.usr_id)', 'visitorCount')
      .where('lh.lgh_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .groupBy("DATE(lh.lgh_created_at AT TIME ZONE 'UTC')")
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      date: r.date,
      loginCount: Number(r.loginCount),
      visitorCount: Number(r.visitorCount),
    }));
  }

  async getAppEntityLogins(startDate: string, endDate: string) {
    const result = await this.loginHistoryRepo
      .createQueryBuilder('lh')
      .select('lh.ent_id', 'entityId')
      .addSelect('COUNT(*)', 'loginCount')
      .addSelect('COUNT(DISTINCT lh.usr_id)', 'userCount')
      .where('lh.lgh_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .andWhere('lh.ent_id IS NOT NULL')
      .groupBy('lh.ent_id')
      .orderBy('"loginCount"', 'DESC')
      .getRawMany();

    // Entity 이름 매핑
    const entityIds = result.map((r) => r.entityId).filter(Boolean);
    const entities = entityIds.length
      ? await this.entityRepo
          .createQueryBuilder('e')
          .whereInIds(entityIds)
          .getMany()
      : [];
    const entityMap = new Map(entities.map((e) => [e.entId, e]));

    // 각 entity의 전체 사용자 수
    const totalUsers = entityIds.length
      ? await this.userRepo
          .createQueryBuilder('u')
          .select('u.usr_company_id', 'entityId')
          .addSelect('COUNT(*)', 'total')
          .where('u.usr_company_id IN (:...ids)', { ids: entityIds })
          .andWhere("u.usr_status NOT IN ('WITHDRAWN', 'SUSPENDED')")
          .groupBy('u.usr_company_id')
          .getRawMany()
      : [];
    const totalMap = new Map(totalUsers.map((t) => [t.entityId, Number(t.total)]));

    return result.map((r) => {
      const ent = entityMap.get(r.entityId);
      const total = totalMap.get(r.entityId) || 0;
      const activeUsers = Number(r.userCount);
      return {
        entityId: r.entityId,
        entityCode: ent?.entCode ?? '',
        entityName: ent?.entName ?? '',
        loginCount: Number(r.loginCount),
        userCount: activeUsers,
        totalUsers: total,
        activeRate: total > 0 ? Math.round((activeUsers / total) * 1000) / 10 : 0,
      };
    });
  }

  async getAppHourlyPattern(startDate: string, endDate: string) {
    const result = await this.loginHistoryRepo
      .createQueryBuilder('lh')
      .select("EXTRACT(HOUR FROM lh.lgh_created_at AT TIME ZONE 'UTC')", 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('lh.lgh_created_at BETWEEN :start AND :end', {
        start: startDate + 'T00:00:00Z',
        end: endDate + 'T23:59:59.999Z',
      })
      .groupBy("EXTRACT(HOUR FROM lh.lgh_created_at AT TIME ZONE 'UTC')")
      .orderBy('hour', 'ASC')
      .getRawMany();

    // 0~23시 전체 배열 반환
    const hourMap = new Map(result.map((r) => [Number(r.hour), Number(r.count)]));
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourMap.get(i) || 0,
    }));
  }
}
