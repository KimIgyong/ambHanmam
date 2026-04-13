import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AiTokenUsageEntity } from '../entity/ai-token-usage.entity';
import { AiTokenEntitySummaryEntity } from '../entity/ai-token-entity-summary.entity';
import { EntityApiQuotaEntity } from '../entity/entity-api-quota.entity';
import { EntityAiConfigEntity } from '../../entity-settings/entity/entity-ai-config.entity';

export interface RecordUsageDto {
  entId: string;
  usrId: string;
  cvsId?: string;
  sourceType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  keySource: 'ENTITY' | 'SHARED';
}

export interface QuotaCheckResult {
  allowed: boolean;
  action?: 'WARN' | 'BLOCK';
  dailyUsed?: number;
  dailyLimit?: number;
  monthlyUsed?: number;
  monthlyLimit?: number;
  dailyPercent?: number;
  monthlyPercent?: number;
}

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @InjectRepository(AiTokenUsageEntity)
    private readonly usageRepo: Repository<AiTokenUsageEntity>,
    @InjectRepository(AiTokenEntitySummaryEntity)
    private readonly summaryRepo: Repository<AiTokenEntitySummaryEntity>,
    @InjectRepository(EntityApiQuotaEntity)
    private readonly quotaRepo: Repository<EntityApiQuotaEntity>,
    @InjectRepository(EntityAiConfigEntity)
    private readonly aiConfigRepo: Repository<EntityAiConfigEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** 건별 사용량 기록 + 일별 집계 UPSERT */
  async recordUsage(dto: RecordUsageDto): Promise<void> {
    // 1. 건별 기록 INSERT
    await this.usageRepo.save(
      this.usageRepo.create({
        entId: dto.entId,
        usrId: dto.usrId,
        cvsId: dto.cvsId || undefined,
        atuSourceType: dto.sourceType,
        atuModel: dto.model,
        atuInputTokens: dto.inputTokens,
        atuOutputTokens: dto.outputTokens,
        atuTotalTokens: dto.totalTokens,
        atuKeySource: dto.keySource,
      }),
    );

    // 2. 일별 집계 UPSERT (raw query로 누적 보장)
    const today = new Date().toISOString().slice(0, 10);
    await this.summaryRepo.query(
      `INSERT INTO amb_ai_token_entity_summary (ats_id, ent_id, ats_date, ats_total_tokens, ats_input_tokens, ats_output_tokens, ats_request_count)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 1)
       ON CONFLICT (ent_id, ats_date) DO UPDATE SET
         ats_total_tokens = amb_ai_token_entity_summary.ats_total_tokens + EXCLUDED.ats_total_tokens,
         ats_input_tokens = amb_ai_token_entity_summary.ats_input_tokens + EXCLUDED.ats_input_tokens,
         ats_output_tokens = amb_ai_token_entity_summary.ats_output_tokens + EXCLUDED.ats_output_tokens,
         ats_request_count = amb_ai_token_entity_summary.ats_request_count + 1`,
      [dto.entId, today, dto.totalTokens, dto.inputTokens, dto.outputTokens],
    ).catch((e) => this.logger.error('Failed to upsert entity summary', e.message));

    // 3. 구독 토큰 지갑 차감 이벤트 발행 (fire-and-forget)
    this.eventEmitter.emit('ai-usage.recorded', {
      entId: dto.entId,
      totalTokens: dto.totalTokens,
      sourceType: dto.sourceType,
      model: dto.model,
    });
  }

  /** 법인 일일 사용량 조회 */
  async getEntityDailyUsage(entityId: string, date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const summary = await this.summaryRepo.findOne({
      where: { entId: entityId, atsDate: targetDate as any },
    });

    return {
      date: targetDate,
      totalTokens: Number(summary?.atsTotalTokens ?? 0),
      inputTokens: Number(summary?.atsInputTokens ?? 0),
      outputTokens: Number(summary?.atsOutputTokens ?? 0),
      requestCount: summary?.atsRequestCount ?? 0,
    };
  }

  /** 법인 월간 사용량 조회 */
  async getEntityMonthlyUsage(entityId: string, yearMonth?: string) {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const startDate = `${ym}-01`;
    const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

    const result = await this.summaryRepo
      .createQueryBuilder('s')
      .select('SUM(s.ats_total_tokens)', 'totalTokens')
      .addSelect('SUM(s.ats_input_tokens)', 'inputTokens')
      .addSelect('SUM(s.ats_output_tokens)', 'outputTokens')
      .addSelect('SUM(s.ats_request_count)', 'requestCount')
      .where('s.ent_id = :entityId', { entityId })
      .andWhere('s.ats_date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return {
      yearMonth: ym,
      totalTokens: Number(result?.totalTokens ?? 0),
      inputTokens: Number(result?.inputTokens ?? 0),
      outputTokens: Number(result?.outputTokens ?? 0),
      requestCount: Number(result?.requestCount ?? 0),
    };
  }

  /** 법인 일별 사용량 이력 (월 단위) */
  async getEntityDailyHistory(entityId: string, yearMonth?: string) {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const startDate = `${ym}-01`;
    const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

    const rows = await this.summaryRepo.find({
      where: {
        entId: entityId,
        atsDate: Between(startDate as any, endDate as any),
      },
      order: { atsDate: 'ASC' },
    });

    return {
      yearMonth: ym,
      days: rows.map((r) => ({
        date: typeof r.atsDate === 'string' ? r.atsDate : (r.atsDate as Date).toISOString().slice(0, 10),
        totalTokens: Number(r.atsTotalTokens),
        inputTokens: Number(r.atsInputTokens),
        outputTokens: Number(r.atsOutputTokens),
        requestCount: Number(r.atsRequestCount),
      })),
    };
  }

  /** amb_entity_ai_configs에서 법인 AI 한도 조회 */
  private async getEntityAiLimits(entityId: string): Promise<{ dailyLimit: number; monthlyLimit: number } | null> {
    const config = await this.aiConfigRepo.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });
    if (!config || !config.eacIsActive) return null;
    const daily = Number(config.eacDailyTokenLimit ?? 0);
    const monthly = Number(config.eacMonthlyTokenLimit ?? 0);
    // 둘 다 0이면 제한 없음
    if (daily === 0 && monthly === 0) return null;
    return { dailyLimit: daily, monthlyLimit: monthly };
  }

  /** 법인 사용량 요약 (현재 일/월 + Quota 상태) */
  async getEntityUsageSummary(entityId: string) {
    const daily = await this.getEntityDailyUsage(entityId);
    const monthly = await this.getEntityMonthlyUsage(entityId);
    const limits = await this.getEntityAiLimits(entityId);

    const dailyPercent = limits && limits.dailyLimit > 0
      ? (daily.totalTokens / limits.dailyLimit) * 100
      : null;
    const monthlyPercent = limits && limits.monthlyLimit > 0
      ? (monthly.totalTokens / limits.monthlyLimit) * 100
      : null;

    // 일간/월간 중 더 높은 사용률로 quotaStage 결정
    const maxPercent = Math.max(dailyPercent ?? 0, monthlyPercent ?? 0);
    const hasAnyLimit = dailyPercent !== null || monthlyPercent !== null;

    return {
      daily,
      monthly,
      quota: limits
        ? {
            dailyLimit: limits.dailyLimit,
            monthlyLimit: limits.monthlyLimit,
            actionOnExceed: 'BLOCK',
          }
        : null,
      warnings: {
        dailyPercent: dailyPercent !== null ? Math.round(dailyPercent * 100) / 100 : null,
        monthlyPercent: monthlyPercent !== null ? Math.round(monthlyPercent * 100) / 100 : null,
        dailyWarning: dailyPercent !== null && dailyPercent >= 80,
        dailyCritical: dailyPercent !== null && dailyPercent >= 95,
        monthlyWarning: monthlyPercent !== null && monthlyPercent >= 80,
        monthlyCritical: monthlyPercent !== null && monthlyPercent >= 95,
        // 잔량 기반 3단계 경고
        monthlyRemaining: monthlyPercent !== null ? Math.round((100 - monthlyPercent) * 100) / 100 : null,
        quotaStage: hasAnyLimit ? this.getQuotaStage(maxPercent) : 'NORMAL',
      },
    };
  }

  /** 잔량 기반 3단계: NORMAL > CAUTION(≤10%) > WARNING(≤5%) > SUSPENDED(0%) */
  private getQuotaStage(usagePercent: number | null): 'NORMAL' | 'CAUTION' | 'WARNING' | 'SUSPENDED' {
    if (usagePercent === null) return 'NORMAL';
    const remaining = 100 - usagePercent;
    if (remaining <= 0) return 'SUSPENDED';
    if (remaining <= 5) return 'WARNING';
    if (remaining <= 10) return 'CAUTION';
    return 'NORMAL';
  }

  /** 사용자별 사용량 조회 */
  async getUserUsage(userId: string, entityId: string, startDate: string, endDate: string) {
    const usages = await this.usageRepo
      .createQueryBuilder('u')
      .select('u.atu_source_type', 'sourceType')
      .addSelect('SUM(u.atu_total_tokens)', 'totalTokens')
      .addSelect('SUM(u.atu_input_tokens)', 'inputTokens')
      .addSelect('SUM(u.atu_output_tokens)', 'outputTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('u.usr_id = :userId', { userId })
      .andWhere('u.ent_id = :entityId', { entityId })
      .andWhere('u.atu_created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('u.atu_source_type')
      .getRawMany();

    return usages.map((u) => ({
      sourceType: u.sourceType,
      totalTokens: Number(u.totalTokens ?? 0),
      inputTokens: Number(u.inputTokens ?? 0),
      outputTokens: Number(u.outputTokens ?? 0),
      requestCount: Number(u.requestCount ?? 0),
    }));
  }

  /** 전체 법인 사용량 (ADMIN용) */
  async getAllEntitiesUsage(yearMonth?: string) {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const startDate = `${ym}-01`;
    const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

    const results = await this.summaryRepo
      .createQueryBuilder('s')
      .select('s.ent_id', 'entityId')
      .addSelect('SUM(s.ats_total_tokens)', 'totalTokens')
      .addSelect('SUM(s.ats_input_tokens)', 'inputTokens')
      .addSelect('SUM(s.ats_output_tokens)', 'outputTokens')
      .addSelect('SUM(s.ats_request_count)', 'requestCount')
      .where('s.ats_date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('s.ent_id')
      .getRawMany();

    return results.map((r) => ({
      entityId: r.entityId,
      totalTokens: Number(r.totalTokens ?? 0),
      inputTokens: Number(r.inputTokens ?? 0),
      outputTokens: Number(r.outputTokens ?? 0),
      requestCount: Number(r.requestCount ?? 0),
    }));
  }

  /** Quota 초과 여부 확인 (amb_entity_ai_configs 기반) */
  async checkQuota(entityId: string): Promise<QuotaCheckResult> {
    const limits = await this.getEntityAiLimits(entityId);
    if (!limits) return { allowed: true };

    const daily = await this.getEntityDailyUsage(entityId);
    const monthly = await this.getEntityMonthlyUsage(entityId);

    const dailyLimit = limits.dailyLimit > 0 ? limits.dailyLimit : undefined;
    const monthlyLimit = limits.monthlyLimit > 0 ? limits.monthlyLimit : undefined;

    const dailyExceeded = dailyLimit !== undefined && daily.totalTokens >= dailyLimit;
    const monthlyExceeded = monthlyLimit !== undefined && monthly.totalTokens >= monthlyLimit;

    const dailyPercent = dailyLimit ? (daily.totalTokens / dailyLimit) * 100 : 0;
    const monthlyPercent = monthlyLimit ? (monthly.totalTokens / monthlyLimit) * 100 : 0;

    if (dailyExceeded || monthlyExceeded) {
      return {
        allowed: false,
        action: 'BLOCK',
        dailyUsed: daily.totalTokens,
        dailyLimit,
        monthlyUsed: monthly.totalTokens,
        monthlyLimit,
        dailyPercent,
        monthlyPercent,
      };
    }

    return {
      allowed: true,
      action: undefined,
      dailyUsed: daily.totalTokens,
      dailyLimit,
      monthlyUsed: monthly.totalTokens,
      monthlyLimit,
      dailyPercent,
      monthlyPercent,
    };
  }

  /**
   * summary 테이블을 usage 건별 데이터로부터 재집계
   * (기존 UPSERT 버그로 인한 불일치 복구용)
   */
  async rebuildSummary(entityId: string): Promise<{ rebuilt: number }> {
    // 해당 법인의 기존 summary 삭제
    await this.summaryRepo.delete({ entId: entityId });

    // usage 테이블에서 일별 집계 후 INSERT
    const rows: { date: string; total: string; input: string; output: string; cnt: string }[] =
      await this.usageRepo.query(
        `SELECT atu_created_at::date AS date,
                SUM(atu_total_tokens) AS total,
                SUM(atu_input_tokens) AS input,
                SUM(atu_output_tokens) AS output,
                COUNT(*) AS cnt
         FROM amb_ai_token_usage
         WHERE ent_id = $1
         GROUP BY atu_created_at::date
         ORDER BY date`,
        [entityId],
      );

    for (const r of rows) {
      await this.summaryRepo.save(
        this.summaryRepo.create({
          entId: entityId,
          atsDate: r.date as any,
          atsTotalTokens: Number(r.total),
          atsInputTokens: Number(r.input),
          atsOutputTokens: Number(r.output),
          atsRequestCount: Number(r.cnt),
        }),
      );
    }

    return { rebuilt: rows.length };
  }

  /** Quota 설정 조회 */
  async getQuota(entityId: string) {
    return this.quotaRepo.findOne({ where: { entId: entityId } });
  }

  /** Quota 설정 저장 (ADMIN) */
  async setQuota(
    entityId: string,
    dto: { daily_token_limit?: number; monthly_token_limit?: number; action_on_exceed?: string },
    userId: string,
  ) {
    let quota = await this.quotaRepo.findOne({ where: { entId: entityId } });

    if (!quota) {
      quota = this.quotaRepo.create({ entId: entityId });
    }

    if (dto.daily_token_limit !== undefined) {
      quota.eaqDailyTokenLimit = dto.daily_token_limit;
    }
    if (dto.monthly_token_limit !== undefined) {
      quota.eaqMonthlyTokenLimit = dto.monthly_token_limit;
    }
    if (dto.action_on_exceed !== undefined) {
      quota.eaqActionOnExceed = dto.action_on_exceed;
    }
    quota.eaqUpdatedBy = userId;

    return this.quotaRepo.save(quota);
  }
}
