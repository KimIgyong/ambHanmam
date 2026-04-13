import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { UsageService } from '../service/usage.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';

/**
 * Usage reporting API for portal customers
 */
@Controller('portal/usage')
export class UsageReportController {
  constructor(private readonly usageService: UsageService) {}

  @Get('summary')
  @UseGuards(PortalJwtAuthGuard)
  async getUsageSummary(
    @Request() req: { user: { customerId: string } },
    @Query('subscription_id') subscriptionId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.usageService.getUsageSummary(
      req.user.customerId,
      subscriptionId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('subscriptions/:id/current')
  @UseGuards(PortalJwtAuthGuard)
  async getCurrentPeriodUsage(@Param('id') subscriptionId: string) {
    return this.usageService.getCurrentPeriodUsage(subscriptionId);
  }
}
