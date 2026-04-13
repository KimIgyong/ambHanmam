import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CmsStatsService } from '../service/cms-stats.service';

@Controller('cms/stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CmsStatsController {
  constructor(private readonly statsService: CmsStatsService) {}

  @Get('entities')
  async getEntityStats() {
    const data = await this.statsService.getEntityStats();
    return { success: true, data };
  }
}
