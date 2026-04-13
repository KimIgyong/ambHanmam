import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { WorkStatisticsService } from '../service/work-statistics.service';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings')
export class WorkStatisticsController {
  constructor(private readonly workStatisticsService: WorkStatisticsService) {}

  @Get('work-statistics/overview')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getOverview(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.workStatisticsService.getOverview(entityId, startDate, endDate);
    return { success: true, data };
  }

  @Get('work-statistics/members')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMembers(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.workStatisticsService.getMemberActivities(entityId, startDate, endDate);
    return { success: true, data };
  }

  @Get('work-statistics/login-history')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getLoginHistory(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.workStatisticsService.getLoginHistory(entityId, startDate, endDate);
    return { success: true, data };
  }

  @Get('work-statistics/api-usage')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getApiUsage(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.workStatisticsService.getApiUsageByMember(entityId, startDate, endDate);
    return { success: true, data };
  }

  @Get('work-statistics/menu-usage')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMenuUsage(
    @Query('entity_id') queryEntityId: string | undefined,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.workStatisticsService.getMenuUsage(entityId, startDate, endDate);
    return { success: true, data };
  }

  @Post('work-statistics/page-view')
  @Auth()
  async recordPageView(
    @Body() body: { path: string; menu_code?: string },
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = user.entityId;
    if (entityId) {
      await this.workStatisticsService.recordPageView(
        user.userId,
        entityId,
        body.path,
        body.menu_code,
      );
    }
    return { success: true };
  }
}
