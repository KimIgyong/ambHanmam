import {
  Controller, Get, Put, Delete, Query, Body, Param, UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Auth } from '../../auth/decorator/auth.decorator';
import { OwnEntityGuard } from '../../auth/guard/own-entity.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityPermissionService } from '../service/entity-permission.service';
import { SetEntityPermissionRequest } from '../dto/set-entity-permission.request';
import { SetUnitPermissionRequest } from '../dto/set-unit-permission.request';
import { SetCellPermissionRequest } from '../dto/set-cell-permission.request';
import { SetEntityMenuConfigRequest } from '../dto/set-entity-menu-config.request';
import { resolveEntityId } from '../util/resolve-entity-id';

@Controller('entity-settings/permissions')
export class EntityPermissionController {
  constructor(private readonly permissionService: EntityPermissionService) {}

  @Get('available-menus')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getAvailableMenus() {
    const data = await this.permissionService.getAvailableMenus();
    return { success: true, data };
  }

  @Get('menu-config')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getEntityMenuConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getEntityMenuConfig(entityId, user);
    return { success: true, data };
  }

  @Put('menu-config')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async setEntityMenuConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: SetEntityMenuConfigRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.setEntityMenuConfig(entityId, dto, user);
    return { success: true, data };
  }

  @Delete('menu-config')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async resetEntityMenuConfig(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.resetEntityMenuConfig(entityId, user);
    return { success: true, data };
  }

  // ─── Unit (부서) ───

  @Get('units')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getUnits(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getUnits(entityId, user);
    return { success: true, data };
  }

  @Get('units/:unitName')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getUnitPermissions(
    @Param('unitName') unitName: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getUnitPermissions(
      decodeURIComponent(unitName),
      entityId,
      user,
    );
    return { success: true, data };
  }

  @Put('units/:unitName')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async setUnitPermissions(
    @Param('unitName') unitName: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: SetUnitPermissionRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.setUnitPermissions(
      decodeURIComponent(unitName),
      entityId,
      dto,
      user,
    );
    return { success: true, data };
  }

  // ─── Cell (그룹) ───

  @Get('cells')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getCells(
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getCells(entityId, user);
    return { success: true, data };
  }

  @Get('cells/:cellId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getCellPermissions(
    @Param('cellId', ParseUUIDPipe) cellId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getCellPermissions(cellId, entityId, user);
    return { success: true, data };
  }

  @Put('cells/:cellId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async setCellPermissions(
    @Param('cellId', ParseUUIDPipe) cellId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: SetCellPermissionRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.setCellPermissions(cellId, entityId, dto, user);
    return { success: true, data };
  }

  // ─── Individual (개인) ───

  @Get('users/:userId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async getMemberPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.getMemberPermissions(userId, entityId, user);
    return { success: true, data };
  }

  @Put('users/:userId')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async setMemberPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @Body() dto: SetEntityPermissionRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.setMemberPermissions(userId, entityId, dto, user);
    return { success: true, data };
  }

  @Delete('users/:userId/:menuCode')
  @Auth()
  @UseGuards(OwnEntityGuard)
  async removeMemberPermission(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('menuCode') menuCode: string,
    @Query('entity_id') queryEntityId: string | undefined,
    @CurrentUser() user: UserPayload,
  ) {
    const entityId = resolveEntityId(queryEntityId, user);
    const data = await this.permissionService.removeMemberPermission(userId, menuCode, entityId, user);
    return { success: true, data };
  }
}
