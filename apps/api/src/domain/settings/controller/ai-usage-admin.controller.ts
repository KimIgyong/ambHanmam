import { Controller, Get, Put, Param, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminOnly } from '../../auth/decorator/auth.decorator';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { AiUsageService } from '../../ai-usage/service/ai-usage.service';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Controller('settings/ai-usage')
export class AiUsageAdminController {
  constructor(
    private readonly aiUsageService: AiUsageService,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
  ) {}

  @Get('entities')
  @AdminOnly()
  async getAllEntitiesUsage(@Query('year_month') yearMonth?: string) {
    const usages = await this.aiUsageService.getAllEntitiesUsage(yearMonth);
    const entities = await this.entityRepo.find({ where: { entStatus: 'ACTIVE' } });
    const entityMap = new Map(entities.map((e) => [e.entId, e]));

    const data = usages.map((u) => {
      const entity = entityMap.get(u.entityId);
      return {
        ...u,
        entityName: entity?.entName || 'Unknown',
        entityCode: entity?.entCode || '',
      };
    });

    // 사용 기록이 없는 법인도 포함
    for (const entity of entities) {
      if (!usages.find((u) => u.entityId === entity.entId)) {
        data.push({
          entityId: entity.entId,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          requestCount: 0,
          entityName: entity.entName,
          entityCode: entity.entCode,
        });
      }
    }

    // Quota 정보도 함께 조회
    const withQuota = await Promise.all(
      data.map(async (d) => {
        const quota = await this.aiUsageService.getQuota(d.entityId);
        return {
          ...d,
          quota: quota
            ? {
                dailyTokenLimit: quota.eaqDailyTokenLimit ? Number(quota.eaqDailyTokenLimit) : null,
                monthlyTokenLimit: quota.eaqMonthlyTokenLimit ? Number(quota.eaqMonthlyTokenLimit) : null,
                actionOnExceed: quota.eaqActionOnExceed,
              }
            : null,
        };
      }),
    );

    return { success: true, data: withQuota };
  }

  @Get('entities/:entityId')
  @AdminOnly()
  async getEntityDetail(
    @Param('entityId') entityId: string,
    @Query('year_month') yearMonth?: string,
  ) {
    const summary = await this.aiUsageService.getEntityUsageSummary(entityId);
    const monthly = await this.aiUsageService.getEntityMonthlyUsage(entityId, yearMonth);
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });

    return {
      success: true,
      data: {
        entityName: entity?.entName || 'Unknown',
        entityCode: entity?.entCode || '',
        ...summary,
        monthlyDetail: monthly,
      },
    };
  }

  @Put('quota/:entityId')
  @AdminOnly()
  async setEntityQuota(
    @Param('entityId') entityId: string,
    @Body() dto: { daily_token_limit?: number | null; monthly_token_limit?: number | null; action_on_exceed?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.aiUsageService.setQuota(
      entityId,
      {
        daily_token_limit: dto.daily_token_limit ?? undefined,
        monthly_token_limit: dto.monthly_token_limit ?? undefined,
        action_on_exceed: dto.action_on_exceed,
      },
      user.userId,
    );
    return { success: true, data };
  }
}
