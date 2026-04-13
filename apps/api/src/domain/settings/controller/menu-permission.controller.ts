import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MenuPermissionService } from '../service/menu-permission.service';
import { UserMenuPermissionService } from '../service/user-menu-permission.service';
import { MenuGroupPermissionService } from '../service/menu-group-permission.service';
import { UpdateMenuPermissionsRequest } from '../dto/request/update-menu-permissions.request';
import { UpdateMenuGroupPermissionsRequest } from '../dto/request/update-menu-group-permissions.request';
import { SetUserPermissionsRequest } from '../dto/request/set-user-permission.request';
import { AdminGuard } from '../guard/admin.guard';
import {
  CurrentUser,
  UserPayload,
} from '../../../global/decorator/current-user.decorator';

@Controller('settings/permissions')
export class MenuPermissionController {
  constructor(
    private readonly menuPermissionService: MenuPermissionService,
    private readonly userMenuPermissionService: UserMenuPermissionService,
    private readonly menuGroupPermissionService: MenuGroupPermissionService,
  ) {}

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.menuPermissionService.findAll();
  }

  @Put()
  @UseGuards(AdminGuard)
  bulkUpdate(@Body() dto: UpdateMenuPermissionsRequest) {
    return this.menuPermissionService.bulkUpdate(dto);
  }

  @Get('me')
  getMyMenus(
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') headerEntityId?: string,
    @Query('entity_id') queryEntityId?: string,
  ) {
    const entityId = queryEntityId || headerEntityId;
    return this.menuPermissionService.getMyMenus(user.userId, user.role, entityId);
  }

  // ── 사용자별 권한 API ──

  @Get('users')
  @UseGuards(AdminGuard)
  getAllUserPermissions() {
    return this.userMenuPermissionService.findAll();
  }

  @Get('users/:userId')
  @UseGuards(AdminGuard)
  getUserPermissions(@Param('userId') userId: string) {
    return this.userMenuPermissionService.findByUserId(userId);
  }

  @Put('users/:userId')
  @UseGuards(AdminGuard)
  setUserPermissions(
    @Param('userId') userId: string,
    @Body() dto: SetUserPermissionsRequest,
    @CurrentUser() user: UserPayload,
  ) {
    return this.userMenuPermissionService.setPermissions(userId, dto, user.userId);
  }

  @Delete('users/:userId/:menuCode')
  @UseGuards(AdminGuard)
  removeUserPermission(
    @Param('userId') userId: string,
    @Param('menuCode') menuCode: string,
  ) {
    return this.userMenuPermissionService.removePermission(userId, menuCode);
  }

  // ── 그룹별 권한 API ──

  @Get('groups')
  @UseGuards(AdminGuard)
  getAllGroupPermissions() {
    return this.menuGroupPermissionService.findAll();
  }

  @Put('groups')
  @UseGuards(AdminGuard)
  bulkUpdateGroupPermissions(@Body() dto: UpdateMenuGroupPermissionsRequest) {
    return this.menuGroupPermissionService.bulkUpdate(dto);
  }
}
