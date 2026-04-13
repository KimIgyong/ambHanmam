import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnitService } from '../service/unit.service';
import { UserUnitRoleService } from '../service/user-unit-role.service';
import { HierarchyService } from '../service/hierarchy.service';
import { CreateUnitRequest } from '../dto/request/create-unit.request';
import { UpdateUnitRequest } from '../dto/request/update-unit.request';
import { AssignUserUnitRoleRequest } from '../dto/request/assign-user-unit-role.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { Roles } from '../../../global/decorator/roles.decorator';
import { RolesGuard } from '../../../global/guard/roles.guard';

@Controller('units')
@UseGuards(AuthGuard('jwt'))
export class UnitController {
  constructor(
    private readonly unitService: UnitService,
    private readonly userDeptRoleService: UserUnitRoleService,
    private readonly hierarchyService: HierarchyService,
  ) {}

  @Get('tree')
  async getUnitTree(@Req() req: any) {
    const entityId = req.headers['x-entity-id'] || req.query?.entityId;
    return {
      success: true,
      data: await this.unitService.getUnitTree(entityId),
    };
  }

  @Get()
  async getAllUnits(@Req() req: any) {
    const entityId = req.headers['x-entity-id'] || req.query?.entityId;
    return {
      success: true,
      data: await this.unitService.getAllUnits(entityId),
    };
  }

  @Get(':id')
  async getUnit(@Param('id') id: string) {
    return {
      success: true,
      data: await this.unitService.getUnitById(id),
    };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async createUnit(
    @Body() dto: CreateUnitRequest,
    @Req() req: any,
  ) {
    const entityId = req.headers['x-entity-id'] || req.query?.entityId;
    return {
      success: true,
      data: await this.unitService.createUnit(dto, entityId),
    };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updateUnit(
    @Param('id') id: string,
    @Body() dto: UpdateUnitRequest,
  ) {
    return {
      success: true,
      data: await this.unitService.updateUnit(id, dto),
    };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteUnit(@Param('id') id: string) {
    await this.unitService.deleteUnit(id);
    return { success: true };
  }

  // User-Department Role endpoints
  @Get(':id/members')
  async getUnitMembers(@Param('id') id: string) {
    return {
      success: true,
      data: await this.userDeptRoleService.getByUnit(id),
    };
  }

  @Post('roles')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async assignUserRole(@Body() dto: AssignUserUnitRoleRequest) {
    return {
      success: true,
      data: await this.userDeptRoleService.assignRole(dto),
    };
  }

  @Put('roles/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return {
      success: true,
      data: await this.userDeptRoleService.updateRole(id, role),
    };
  }

  @Delete('roles/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  async removeUserRole(@Param('id') id: string) {
    await this.userDeptRoleService.removeRole(id);
    return { success: true };
  }

  // Hierarchy endpoints
  @Get('hierarchy/visible-users')
  async getVisibleUsers(@CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.hierarchyService.getVisibleUsers(user.userId),
    };
  }

  @Get('hierarchy/subordinates')
  async getSubordinates(@CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.hierarchyService.getSubordinates(user.userId),
    };
  }

  @Get('user/:userId/roles')
  async getUserRoles(@Param('userId') userId: string) {
    return {
      success: true,
      data: await this.userDeptRoleService.getByUser(userId),
    };
  }

  @Get('my/roles')
  async getMyRoles(@CurrentUser() user: UserPayload) {
    return {
      success: true,
      data: await this.userDeptRoleService.getByUser(user.userId),
    };
  }
}
