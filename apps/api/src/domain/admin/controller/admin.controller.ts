import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminLevelGuard } from '../../../global/guard/admin-level.guard';
import { SuperAdminGuard } from '../../../global/guard/super-admin.guard';
import { AdminService } from '../service/admin.service';
import { UpdateEntityRequest } from '../../hr/dto/request/update-entity.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { DriveSettingsService } from '../../settings/service/drive-settings.service';
import { UpdateDriveSettingsRequest } from '../../settings/dto/request/update-drive-settings.request';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdatePartnerUserDto } from '../dto/update-partner-user.dto';
import { PermanentDeleteUserRequest } from '../dto/permanent-delete-user.request';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(AdminLevelGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly driveSettingsService: DriveSettingsService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (no entity filter)' })
  findAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('entity_id') entity_id?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.findAllUsers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      entity_id,
      status,
      role,
    });
  }

  @Get('entity-user-roles')
  @ApiOperation({ summary: 'List all entity-user roles' })
  findAllEntityUserRoles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('entity_id') entity_id?: string,
  ) {
    return this.adminService.findAllEntityUserRoles({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      entity_id,
    });
  }

  @Get('unit-user-roles')
  @ApiOperation({ summary: 'List all unit-user roles' })
  findAllUnitUserRoles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('unit_id') unit_id?: string,
  ) {
    return this.adminService.findAllUnitUserRoles({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      unit_id,
    });
  }

  @Delete('unit-user-roles/:uurId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a unit-user role' })
  deleteUnitUserRole(@Param('uurId', ParseUUIDPipe) uurId: string) {
    return this.adminService.deleteUnitUserRole(uurId);
  }

  @Get('entities')
  @ApiOperation({ summary: 'List all entities with master user and member count' })
  findAllEntities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAllEntities({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get('entities/:entityId')
  @ApiOperation({ summary: 'Get entity detail with members and org info' })
  getEntityDetail(@Param('entityId', ParseUUIDPipe) entityId: string) {
    return this.adminService.getEntityDetail(entityId);
  }

  @Patch('entities/:entityId')
  @ApiOperation({ summary: 'Update entity basic information' })
  updateEntity(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() body: UpdateEntityRequest,
  ) {
    return this.adminService.updateEntity(entityId, body);
  }

  @Get('entities/:entityId/members')
  @ApiOperation({ summary: 'List entity members with user info' })
  getEntityMembers(@Param('entityId', ParseUUIDPipe) entityId: string) {
    return this.adminService.getEntityMembers(entityId);
  }

  @Get('entities/:entityId/service-usage')
  @ApiOperation({ summary: 'Get entity service subscription usage' })
  getEntityServiceUsage(@Param('entityId', ParseUUIDPipe) entityId: string) {
    return this.adminService.getEntityServiceUsage(entityId);
  }

  @Get('entities/:entityId/ai-usage')
  @ApiOperation({ summary: 'Get entity AI token usage summary' })
  getEntityAiUsage(@Param('entityId', ParseUUIDPipe) entityId: string) {
    return this.adminService.getEntityAiUsage(entityId);
  }

  /* ──── All Entities Drive Settings ──── */

  @Get('entities-drive-settings')
  @ApiOperation({ summary: 'List all entities with their drive settings' })
  getAllEntitiesDriveSettings() {
    return this.adminService.getAllEntitiesDriveSettings();
  }

  @Put('entities/:entityId/drive-settings')
  @ApiOperation({ summary: 'Update drive settings for a specific entity' })
  updateEntityDriveSettings(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: UpdateDriveSettingsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.driveSettingsService.updateSettings(dto, user.userId, entityId);
  }

  @Delete('entities/:entityId/drive-settings')
  @ApiOperation({ summary: 'Delete drive settings for a specific entity' })
  deleteEntityDriveSettings(
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.driveSettingsService.deleteEntitySettings(entityId);
  }

  /* ──── All Entities AI Configs ──── */

  @Get('entities-ai-configs')
  @ApiOperation({ summary: 'List all entities with their AI configurations' })
  getAllEntitiesAiConfigs() {
    return this.adminService.getAllEntitiesAiConfigs();
  }

  @Put('entities/:entityId/ai-config')
  @ApiOperation({ summary: 'Update AI config for a specific entity' })
  updateEntityAiConfig(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() body: {
      provider?: string;
      use_shared_key?: boolean;
      daily_token_limit?: number;
      monthly_token_limit?: number;
      is_active?: boolean;
    },
  ) {
    return this.adminService.updateEntityAiConfig(entityId, body);
  }

  /* ──── Admin Users (ADMIN_LEVEL) ──── */

  @Get('admin-users')
  @ApiOperation({ summary: 'List admin-level users' })
  findAdminUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.findAdminUsers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get('admin-users/:id')
  @ApiOperation({ summary: 'Get admin user detail' })
  getAdminUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getAdminUser(id);
  }

  @Post('admin-users')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create admin user (SUPER_ADMIN only)' })
  createAdminUser(@Body() dto: CreateAdminUserDto) {
    return this.adminService.createAdminUser(dto);
  }

  @Patch('admin-users/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update admin user (SUPER_ADMIN only)' })
  updateAdminUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.updateAdminUser(id, dto, user);
  }

  @Post('admin-users/:id/reset-password')
  @ApiOperation({ summary: 'Reset admin user password' })
  resetAdminPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.resetAdminPassword(id, user);
  }

  @Delete('admin-users/:id')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete admin user (SUPER_ADMIN only)' })
  deleteAdminUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.deleteAdminUser(id, user);
  }

  /* ──── Partner Users (PARTNER_LEVEL) ──── */

  @Get('partner-users')
  @ApiOperation({ summary: 'List partner-level users' })
  findPartnerUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('partner_id') partner_id?: string,
  ) {
    return this.adminService.findPartnerUsers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      partner_id,
    });
  }

  @Get('partner-users/:id')
  @ApiOperation({ summary: 'Get partner user detail' })
  getPartnerUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getPartnerUser(id);
  }

  @Patch('partner-users/:id')
  @ApiOperation({ summary: 'Update partner user' })
  updatePartnerUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartnerUserDto,
  ) {
    return this.adminService.updatePartnerUser(id, dto);
  }

  @Post('partner-users/:id/reset-password')
  @ApiOperation({ summary: 'Reset partner user password' })
  resetPartnerPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resetPartnerPassword(id);
  }

  @Delete('partner-users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete partner user' })
  deletePartnerUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deletePartnerUser(id);
  }

  /* ──── Partner Invitations ──── */

  @Get('partner-invitations')
  @ApiOperation({ summary: 'List partner invitations' })
  findPartnerInvitations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('partner_id') partner_id?: string,
  ) {
    return this.adminService.findPartnerInvitations({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
      partner_id,
    });
  }

  @Post('partner-invitations/:id/resend')
  @ApiOperation({ summary: 'Resend partner invitation' })
  resendPartnerInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.resendPartnerInvitation(id, user.userId);
  }

  @Post('partner-invitations/:id/cancel')
  @ApiOperation({ summary: 'Cancel partner invitation' })
  cancelPartnerInvitation(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.cancelPartnerInvitation(id);
  }

  /* ──── User Deletion Preview & Permanent Delete ──── */

  @Get('users/:userId/deletion-preview')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Preview user deletion impact (SUPER_ADMIN only)' })
  getUserDeletionPreview(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.adminService.getUserDeletionPreview(userId);
  }

  @Delete('users/:userId/permanent')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a user (SUPER_ADMIN only)' })
  deleteUserPermanent(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: PermanentDeleteUserRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.adminService.deleteUserPermanent(
      userId,
      body.level,
      body.confirm_email,
      user.userId,
    );
  }
}
