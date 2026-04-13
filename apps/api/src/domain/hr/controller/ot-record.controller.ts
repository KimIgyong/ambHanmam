import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OtRecordService } from '../service/ot-record.service';
import { CreateOtRecordRequest } from '../dto/request/create-ot-record.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Overtime')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/overtime')
export class OtRecordController {
  constructor(private readonly otRecordService: OtRecordService) {}

  @Get()
  @ApiOperation({ summary: '월별 초과근무 목록' })
  async getMonthlyOtRecords(
    @Req() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const data = await this.otRecordService.getMonthlyOtRecords(req.entityId, y, m);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '초과근무 등록' })
  async createOtRecord(@Req() req: any, @Body() request: CreateOtRecordRequest) {
    const data = await this.otRecordService.createOtRecord(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '초과근무 수정' })
  async updateOtRecord(
    @Req() req: any,
    @Param('id') id: string,
    @Body() request: Partial<CreateOtRecordRequest>,
  ) {
    const data = await this.otRecordService.updateOtRecord(req.entityId, id, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '초과근무 삭제' })
  async deleteOtRecord(@Req() req: any, @Param('id') id: string) {
    await this.otRecordService.deleteOtRecord(req.entityId, id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }

  @Patch(':id/approve')
  @UseGuards(ManagerGuard)
  @ApiOperation({ summary: '초과근무 승인/반려' })
  async approveOtRecord(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Req() req: any,
  ) {
    const userId = req.user?.userId || '';
    const data = await this.otRecordService.approveOtRecord(req.entityId, id, userId, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
