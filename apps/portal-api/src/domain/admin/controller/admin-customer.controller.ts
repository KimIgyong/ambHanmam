import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { AdminDashboardService } from '../service/admin-dashboard.service';
import { PortalJwtAuthGuard } from '../../auth/guard/portal-jwt-auth.guard';

@Controller('portal/admin/customers')
export class AdminCustomerController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  @UseGuards(PortalJwtAuthGuard)
  getCustomerList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.dashboardService.getCustomerList(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get(':id')
  @UseGuards(PortalJwtAuthGuard)
  async getCustomerDetail(@Param('id') id: string) {
    const detail = await this.dashboardService.getCustomerDetail(id);
    if (!detail) throw new NotFoundException('Customer not found');
    return detail;
  }
}
