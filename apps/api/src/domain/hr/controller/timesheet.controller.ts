import {
  Controller, Get, Put, Query, Body, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimesheetService } from '../service/timesheet.service';
import { UpsertTimesheetRequest } from '../dto/request/upsert-timesheet.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Timesheet')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/timesheet')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Get()
  @ApiOperation({ summary: '월간 근태 전체 조회' })
  async getMonthlyTimesheet(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const data = await this.timesheetService.getMonthlyTimesheet(req.entityId, y, m);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('batch')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '근태 일괄 저장 (upsert)' })
  async batchUpsert(@Req() req: any, @Body() request: UpsertTimesheetRequest) {
    const count = await this.timesheetService.batchUpsert(req.entityId, request);
    return { success: true, data: { updatedCount: count }, timestamp: new Date().toISOString() };
  }
}
