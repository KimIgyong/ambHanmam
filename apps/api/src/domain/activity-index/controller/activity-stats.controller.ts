import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { ActivityStatsService } from '../service/activity-stats.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';

@Controller('entity-settings/activity-stats')
export class ActivityStatsController {
  constructor(private readonly statsService: ActivityStatsService) {}

  @Get('summary')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getSummary(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('cell_id') cellId: string | undefined,
    @Query('sort_by') sortBy: string | undefined,
    @Query('sort_order') sortOrder: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.statsService.getMemberStats(
      entityId,
      startDate,
      endDate,
      cellId,
      sortBy || 'total_score',
      sortOrder || 'desc',
    );
    return { success: true, data };
  }

  @Get('my-engagement')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMyEngagement(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.statsService.getMyEngagement(entityId, user.userId);
    return { success: true, data };
  }

  @Get('my-yesterday')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMyYesterday(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.statsService.getMyYesterdayActivity(entityId, user.userId);
    return { success: true, data };
  }

  @Get(':userId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getUserDetail(
    @Query('entity_id') queryEntityId: string | undefined,
    @Param('userId') userId: string,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.statsService.getUserDailyStats(entityId, userId, startDate, endDate);
    return { success: true, data };
  }

  @Post('aggregate')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async triggerAggregate(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body('date') date: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const count = await this.statsService.aggregateDate(entityId, date);
    return { success: true, data: { aggregated: count } };
  }
}
