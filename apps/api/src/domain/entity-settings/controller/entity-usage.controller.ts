import {
  Controller,
  Get,
  Put,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Auth, AdminOnly } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { AiUsageService } from '../../ai-usage/service/ai-usage.service';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings')
export class EntityUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  @Get('usage')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityUsageSummary(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.aiUsageService.getEntityUsageSummary(entityId);
    return { success: true, data };
  }

  @Get('usage/monthly')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityMonthlyUsage(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Query('year_month') yearMonth?: string,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.aiUsageService.getEntityMonthlyUsage(entityId, yearMonth);
    return { success: true, data };
  }

  @Get('usage/daily-history')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityDailyHistory(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Query('year_month') yearMonth?: string,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.aiUsageService.getEntityDailyHistory(entityId, yearMonth);
    return { success: true, data };
  }

  @Get('usage/users')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getUserUsage(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
    @Query('user_id') userId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const now = new Date();
    const start = startDate || `${now.toISOString().slice(0, 7)}-01`;
    const end = endDate || now.toISOString().slice(0, 10);
    const data = await this.aiUsageService.getUserUsage(userId || '', entityId, start, end);
    return { success: true, data };
  }

  @Get('quota')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityQuota(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const quota = await this.aiUsageService.getQuota(entityId);
    return {
      success: true,
      data: quota
        ? {
            dailyTokenLimit: Number(quota.eaqDailyTokenLimit),
            monthlyTokenLimit: Number(quota.eaqMonthlyTokenLimit),
            actionOnExceed: quota.eaqActionOnExceed,
          }
        : null,
    };
  }

  @Put('quota')
  @AdminOnly()
  async setEntityQuota(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: { daily_token_limit?: number; monthly_token_limit?: number; action_on_exceed?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.aiUsageService.setQuota(entityId, dto, user.userId);
    return { success: true, data };
  }

  @Post('usage/rebuild-summary')
  @AdminOnly()
  async rebuildSummary(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const result = await this.aiUsageService.rebuildSummary(entityId);
    return { success: true, data: result };
  }
}
