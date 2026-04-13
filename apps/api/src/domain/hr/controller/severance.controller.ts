import {
  Controller, Get, Post, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeveranceService } from '../service/severance.service';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Severance')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/severance')
export class SeveranceController {
  constructor(private readonly severanceService: SeveranceService) {}

  @Get('calculate/:empId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '퇴직금 시뮬레이션' })
  async calculateSeverance(
    @Req() req: any,
    @Param('empId') empId: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.severanceService.calculateSeverance(req.entityId, empId, endDate);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('confirm/:empId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '퇴직금 확정 (직원 상태 → RESIGNED)' })
  async confirmSeverance(@Req() req: any, @Param('empId') empId: string) {
    await this.severanceService.confirmSeverance(req.entityId, empId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
