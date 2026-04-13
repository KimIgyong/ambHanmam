import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SiteErrorLogEntity } from '../entity/site-error-log.entity';

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /password["']?\s*[:=]\s*["'][^"']+["']/gi,
  /token["']?\s*[:=]\s*["'][^"']+["']/gi,
  /api[_-]?key["']?\s*[:=]\s*["'][^"']+["']/gi,
  /secret["']?\s*[:=]\s*["'][^"']+["']/gi,
];

function sanitizeStackTrace(stack: string | undefined | null): string | null {
  if (!stack) return null;
  let sanitized = stack.substring(0, 5000);
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

@Injectable()
export class SiteErrorService {
  private readonly logger = new Logger(SiteErrorService.name);

  constructor(
    @InjectRepository(SiteErrorLogEntity)
    private readonly repo: Repository<SiteErrorLogEntity>,
  ) {}

  async create(data: {
    source: string;
    app: string;
    userId?: string | null;
    userEmail?: string | null;
    userLevel?: string | null;
    entityId?: string | null;
    pageUrl?: string | null;
    apiEndpoint?: string | null;
    httpMethod?: string | null;
    httpStatus?: number | null;
    errorCode?: string | null;
    errorMessage: string;
    stackTrace?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<SiteErrorLogEntity> {
    const entity = this.repo.create({
      selSource: data.source,
      selApp: data.app,
      selUsrId: data.userId || null,
      selUsrEmail: data.userEmail || null,
      selUsrLevel: data.userLevel || null,
      selEntId: data.entityId || null,
      selPageUrl: data.pageUrl || null,
      selApiEndpoint: data.apiEndpoint || null,
      selHttpMethod: data.httpMethod || null,
      selHttpStatus: data.httpStatus || null,
      selErrorCode: data.errorCode || null,
      selErrorMessage: (data.errorMessage || 'Unknown error').substring(0, 5000),
      selStackTrace: sanitizeStackTrace(data.stackTrace),
      selUserAgent: data.userAgent ? data.userAgent.substring(0, 500) : null,
      selIpAddress: data.ipAddress || null,
      selStatus: 'OPEN',
    });
    return this.repo.save(entity);
  }

  async findAll(params: {
    source?: string;
    app?: string;
    usrLevel?: string;
    status?: string;
    httpStatus?: number;
    errorCode?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);

    const qb = this.repo
      .createQueryBuilder('e')
      .orderBy('e.selCreatedAt', 'DESC');

    if (params.source) qb.andWhere('e.selSource = :source', { source: params.source });
    if (params.app) qb.andWhere('e.selApp = :app', { app: params.app });
    if (params.usrLevel) qb.andWhere('e.selUsrLevel = :usrLevel', { usrLevel: params.usrLevel });
    if (params.status) qb.andWhere('e.selStatus = :status', { status: params.status });
    if (params.httpStatus) qb.andWhere('e.selHttpStatus = :httpStatus', { httpStatus: params.httpStatus });
    if (params.errorCode) qb.andWhere('e.selErrorCode = :errorCode', { errorCode: params.errorCode });

    if (params.dateFrom) {
      qb.andWhere('e.selCreatedAt >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      qb.andWhere('e.selCreatedAt <= :dateTo', { dateTo: `${params.dateTo} 23:59:59` });
    }

    if (params.search) {
      qb.andWhere(
        '(e.selErrorMessage ILIKE :search OR e.selUsrEmail ILIKE :search OR e.selPageUrl ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [todayCount, weekCount, bySource, byLevel, openCount] = await Promise.all([
      this.repo.count({ where: { selCreatedAt: LessThan(now) as any } }).then(() =>
        this.repo
          .createQueryBuilder('e')
          .where('e.selCreatedAt >= :start', { start: todayStart })
          .getCount(),
      ),
      this.repo
        .createQueryBuilder('e')
        .where('e.selCreatedAt >= :start', { start: weekStart })
        .getCount(),
      this.repo
        .createQueryBuilder('e')
        .select('e.selSource', 'source')
        .addSelect('COUNT(*)', 'count')
        .where('e.selCreatedAt >= :start', { start: weekStart })
        .groupBy('e.selSource')
        .getRawMany(),
      this.repo
        .createQueryBuilder('e')
        .select('e.selUsrLevel', 'level')
        .addSelect('COUNT(*)', 'count')
        .where('e.selCreatedAt >= :start', { start: weekStart })
        .groupBy('e.selUsrLevel')
        .getRawMany(),
      this.repo.count({ where: { selStatus: 'OPEN' } }),
    ]);

    return { todayCount, weekCount, bySource, byLevel, openCount };
  }

  async updateStatus(id: string, status: string, resolvedBy: string) {
    const update: Partial<SiteErrorLogEntity> = { selStatus: status };
    if (status === 'RESOLVED' || status === 'IGNORED') {
      update.selResolvedBy = resolvedBy;
      update.selResolvedAt = new Date();
    }
    await this.repo.update(id, update);
    return this.repo.findOneBy({ selId: id });
  }

  /** 90일 이상 된 에러 로그 정리 (매일 새벽 3시) */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('selCreatedAt < :cutoff', { cutoff })
      .execute();
    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} old site error logs`);
    }
  }
}
