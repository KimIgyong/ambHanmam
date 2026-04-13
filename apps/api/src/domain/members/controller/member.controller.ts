import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberService } from '../service/member.service';
import { UpdateMemberRoleRequest } from '../dto/request/update-member-role.request';
import { AssignEntityRoleRequest } from '../dto/request/assign-entity-role.request';
import { RolesGuard } from '../../../global/guard/roles.guard';
import { AdminLevelGuard } from '../../../global/guard/admin-level.guard';
import { Roles } from '../../../global/decorator/roles.decorator';
import { EmployeeService } from '../../hr/service/employee.service';
import { EntityGuard } from '../../hr/guard/entity.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@ApiTags('Members')
@Controller('members')
@UseGuards(EntityGuard, RolesGuard)
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly employeeService: EmployeeService,
  ) {}

  @Get()
  @Roles('MEMBER')
  @ApiOperation({ summary: 'List members' })
  findAll(@Req() req: any) {
    return this.memberService.findAll(req.entityId);
  }

  @Get(':id')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Get member detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberService.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update member role' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberRoleRequest,
  ) {
    return this.memberService.updateRole(id, dto.role);
  }

  @Post(':id/entity-roles')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign entity role to member' })
  assignEntityRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignEntityRoleRequest,
  ) {
    return this.memberService.assignEntityRole(id, dto.entity_id, dto.role);
  }

  @Delete(':id/entity-roles/:eurId')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove entity role from member' })
  removeEntityRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('eurId', ParseUUIDPipe) eurId: string,
  ) {
    return this.memberService.removeEntityRole(id, eurId);
  }

  @Patch(':id/company-email')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update member company email' })
  updateCompanyEmail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { company_email: string | null },
  ) {
    return this.memberService.updateCompanyEmail(id, dto.company_email);
  }

  @Patch(':id/name')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update member name' })
  updateName(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name: string },
  ) {
    return this.memberService.updateName(id, dto.name);
  }

  @Patch(':id/job-title')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update member job title' })
  updateJobTitle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { job_title: string },
  ) {
    return this.memberService.updateJobTitle(id, dto.job_title);
  }

  @Get(':id/available-employees')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Get available employees for linking' })
  async getAvailableEmployees(@Param('id', ParseUUIDPipe) id: string) {
    const member = await this.memberService.findOne(id);
    const entityIds = member.entityRoles.map((er) => er.entityId);
    const data = await this.employeeService.getAvailableEmployees(entityIds);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── 승인/거부/상태 관리 ──

  @Get('pending/list')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List pending users awaiting approval' })
  findPending() {
    return this.memberService.findPending();
  }

  @Put(':id/approve')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve a pending user' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.approve(id, user.userId);
  }

  @Put(':id/reject')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject a pending user' })
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberService.reject(id);
  }

  @Patch(':id/level-code')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user level code (ADMIN_LEVEL | USER_LEVEL)' })
  updateLevelCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { level_code: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.memberService.updateLevelCode(id, body.level_code, { role: user.role, level: user.level! });
  }

  @Delete(':id')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete member (soft delete)' })
  deleteMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberService.deleteMember(id);
  }

  @Patch(':id/reset-password')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reset member password (admin only)' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { new_password: string },
  ) {
    return this.memberService.resetPassword(id, body.new_password);
  }

  @Put(':id/status')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user status (ACTIVE, INACTIVE, SUSPENDED)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.memberService.updateStatus(id, body.status);
  }

  @Patch(':id/unlock')
  @UseGuards(AdminLevelGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Unlock a locked account (reset failed login count)' })
  unlockAccount(@Param('id', ParseUUIDPipe) id: string) {
    return this.memberService.unlockAccount(id);
  }
}
