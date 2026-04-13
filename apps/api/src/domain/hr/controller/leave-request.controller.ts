import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveRequestService } from '../service/leave-request.service';
import { CreateLeaveRequestRequest } from '../dto/request/create-leave-request.request';
import { RejectLeaveRequestRequest } from '../dto/request/reject-leave-request.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('HR - Leave Request')
@ApiBearerAuth()
@Controller('hr/leave-requests')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  // ─── 본인용 ───

  @Get('my/balance')
  @ApiOperation({ summary: '본인 연차 잔여 조회' })
  async getMyBalance(
    @CurrentUser() user: UserPayload,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.leaveRequestService.getMyLeaveBalance(user.userId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('my')
  @ApiOperation({ summary: '본인 휴가 신청 내역' })
  async getMyRequests(
    @CurrentUser() user: UserPayload,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const data = await this.leaveRequestService.getMyLeaveRequests(user.userId, y);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: '휴가 신청' })
  async createRequest(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateLeaveRequestRequest,
  ) {
    const data = await this.leaveRequestService.createLeaveRequest(
      user.userId,
      user.entityId || null,
      dto,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '휴가 신청 취소' })
  async cancelRequest(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    await this.leaveRequestService.cancelLeaveRequest(user.userId, id);
    return { success: true, timestamp: new Date().toISOString() };
  }

  // ─── 관리자용 ───

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '휴가 신청 목록 (관리자)' })
  async getRequests(
    @CurrentUser() user: UserPayload,
    @Query('status') status?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.leaveRequestService.getLeaveRequests(
      user.entityId || null,
      {
        status,
        year: year ? parseInt(year, 10) : undefined,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
    );
    return { success: true, ...data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/approve')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '휴가 승인' })
  async approveRequest(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    await this.leaveRequestService.approveLeaveRequest(id, user.userId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Patch(':id/reject')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: '휴가 반려' })
  async rejectRequest(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestRequest,
  ) {
    await this.leaveRequestService.rejectLeaveRequest(id, user.userId, dto.reason);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
