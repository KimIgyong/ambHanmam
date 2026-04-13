import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { AttendanceService } from '../service/attendance.service';
import { AttendancePolicyService } from '../service/attendance-policy.service';
import { CreateAttendanceRequest } from '../dto/request/create-attendance.request';
import { UpdateAttendanceRequest } from '../dto/request/update-attendance.request';
import { AmendAttendanceRequest } from '../dto/request/amend-attendance.request';
import { UpsertAttendancePolicyRequest } from '../dto/request/upsert-attendance-policy.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('attendances')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly policyService: AttendancePolicyService,
  ) {}

  @Get('team')
  @ApiOperation({ summary: 'Get all team members attendances by date range' })
  async getTeamAttendances(
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Req() req?: any,
  ) {
    const data = await this.attendanceService.getTeamAttendances(
      dateFrom,
      dateTo,
      req?.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('policy')
  @ApiOperation({ summary: 'Get attendance policy for current entity' })
  async getPolicy(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.policyService.getPolicy(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('policy')
  @ApiOperation({ summary: 'Update attendance policy (MASTER only)' })
  async upsertPolicy(
    @Body() request: UpsertAttendancePolicyRequest,
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('MASTER 권한이 필요합니다.');
    }
    const data = await this.policyService.upsertPolicy(req.entityId, request);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: 'Get my attendances by date range' })
  async getAttendances(
    @CurrentUser() user: UserPayload,
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Req() req?: any,
  ) {
    const data = await this.attendanceService.getAttendances(
      user.userId,
      dateFrom,
      dateTo,
      req?.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Create attendances (bulk)' })
  async createAttendances(
    @Body() request: CreateAttendanceRequest,
    @CurrentUser() user: UserPayload,
    @Req() req?: any,
  ) {
    const data = await this.attendanceService.createAttendances(
      request,
      user.userId,
      req?.entityId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('members')
  @ApiOperation({ summary: 'Update attendance member visibility/order (MASTER only)' })
  async updateAttendanceMembers(
    @Body() body: { members: Array<{ user_id: string; hidden: boolean; order: number | null }> },
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('MASTER 권한이 필요합니다.');
    }
    const data = await this.attendanceService.updateAttendanceMembers(req.entityId, body.members);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attendance' })
  async updateAttendance(
    @Param('id') id: string,
    @Body() request: UpdateAttendanceRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.attendanceService.updateAttendance(
      id,
      request,
      user.userId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attendance' })
  async deleteAttendance(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.attendanceService.deleteAttendance(id, user.userId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve or reject an unscheduled attendance (MASTER only)' })
  async approveAttendance(
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
    @CurrentUser() user: UserPayload,
  ) {
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('MASTER 권한이 필요합니다.');
    }
    const data = await this.attendanceService.approveAttendance(id, user.userId, body.status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending attendance approvals (MASTER only)' })
  async getPendingAttendances(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('MASTER 권한이 필요합니다.');
    }
    const data = await this.attendanceService.getPendingAttendances(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('members')
  @ApiOperation({ summary: 'Get attendance member visibility/order settings' })
  async getAttendanceMembers(
    @CurrentUser() user: UserPayload,
    @Req() req: any,
  ) {
    const data = await this.attendanceService.getAttendanceMembers(req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/amendments')
  @ApiOperation({ summary: 'Get amendment history for an attendance record' })
  async getAmendments(
    @Param('id') id: string,
  ) {
    const data = await this.attendanceService.getAmendments(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/amend')
  @ApiOperation({ summary: 'Amend an attendance record (MASTER/MANAGER only)' })
  async amendAttendance(
    @Param('id') id: string,
    @Body() request: AmendAttendanceRequest,
    @CurrentUser() user: UserPayload,
  ) {
    if (user.role !== 'MASTER' && user.role !== 'MANAGER') {
      throw new ForbiddenException('MASTER 또는 MANAGER 권한이 필요합니다.');
    }
    const data = await this.attendanceService.amendAttendance(id, request, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
