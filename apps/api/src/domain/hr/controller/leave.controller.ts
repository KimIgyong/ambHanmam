import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from '../service/leave.service';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { EntityGuard } from '../guard/entity.guard';

@ApiTags('HR - Leave')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('hr/leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  @ApiOperation({ summary: '연차 잔여 목록' })
  async getLeaveBalances(@Req() req: any, @Query('year') year: string) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const data = await this.leaveService.getLeaveBalances(req.entityId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':empId')
  @ApiOperation({ summary: '직원별 연차 상세' })
  async getEmployeeLeaveBalance(
    @Req() req: any,
    @Param('empId') empId: string,
    @Query('year') year: string,
  ) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const data = await this.leaveService.getEmployeeLeaveBalance(req.entityId, empId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('recalculate')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연차 재계산' })
  async recalculateLeave(@Req() req: any, @Query('year') year: string) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const data = await this.leaveService.recalculateLeave(req.entityId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':empId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '연차 잔여 수정' })
  async updateLeaveBalance(
    @Req() req: any,
    @Param('empId') empId: string,
    @Query('year') year: string,
    @Body() body: {
      entitlement?: number;
      used?: number;
      carry_forward?: number;
      ot_converted?: number;
    },
  ) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const data = await this.leaveService.updateLeaveBalance(req.entityId, empId, y, body);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
