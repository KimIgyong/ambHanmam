import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from '../service/analytics.service';
import { CreateSiteEventRequest } from '../dto/request/create-site-event.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';
import { Request } from 'express';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── GA Settings (Admin only) ──

  @Get('settings')
  @UseGuards(AdminGuard)
  getGaSettings() {
    return this.analyticsService.getGaSettings();
  }

  @Put('settings')
  @UseGuards(AdminGuard)
  updateGaSettings(
    @Body() dto: { portal_ga_measurement_id?: string; app_ga_measurement_id?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.analyticsService.updateGaSettings(dto, user.userId);
  }

  // ── Event Logging ──

  @Post('events')
  async recordEvent(
    @Body() dto: CreateSiteEventRequest,
    @Req() req: Request,
    @CurrentUser() user: UserPayload,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'];
    await this.analyticsService.recordEvent(dto, ip, userAgent, user?.userId);
    return { success: true };
  }

  // ── Portal Statistics (Admin only) ──

  @Get('portal/summary')
  @UseGuards(AdminGuard)
  getPortalSummary(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getPortalSummary(startDate, endDate);
  }

  @Get('portal/visitors')
  @UseGuards(AdminGuard)
  getPortalVisitorTrend(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getPortalVisitorTrend(startDate, endDate);
  }

  @Get('portal/referrers')
  @UseGuards(AdminGuard)
  getPortalReferrers(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getPortalReferrers(startDate, endDate);
  }

  @Get('portal/pages')
  @UseGuards(AdminGuard)
  getPortalPages(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getPortalPages(startDate, endDate);
  }

  @Get('portal/traffic-sources')
  @UseGuards(AdminGuard)
  getPortalTrafficSources(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getPortalTrafficSources(startDate, endDate);
  }

  // ── App Statistics (Admin only) ──

  @Get('app/summary')
  @UseGuards(AdminGuard)
  getAppSummary(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getAppSummary(startDate, endDate);
  }

  @Get('app/visitors')
  @UseGuards(AdminGuard)
  getAppVisitorTrend(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getAppVisitorTrend(startDate, endDate);
  }

  @Get('app/entity-logins')
  @UseGuards(AdminGuard)
  getAppEntityLogins(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getAppEntityLogins(startDate, endDate);
  }

  @Get('app/hourly-pattern')
  @UseGuards(AdminGuard)
  getAppHourlyPattern(
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
  ) {
    return this.analyticsService.getAppHourlyPattern(startDate, endDate);
  }
}
