import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from '../service/admin-dashboard.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';

// TODO: Replace with proper admin guard (role-based)
// For now, uses portal JWT guard — in production, add admin role check

@Controller('portal/admin')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('dashboard')
  @UseGuards(PortalJwtAuthGuard)
  getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('payments/by-gateway')
  @UseGuards(PortalJwtAuthGuard)
  getPaymentsByGateway(
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.dashboardService.getPaymentsByGateway(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
