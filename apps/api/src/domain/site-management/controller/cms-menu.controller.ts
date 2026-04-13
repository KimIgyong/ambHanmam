import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CmsMenuService } from '../service/cms-menu.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { CreateMenuRequest } from '../dto/request/create-menu.request';
import { UpdateMenuRequest } from '../dto/request/update-menu.request';
import { ReorderMenuRequest } from '../dto/request/reorder-menu.request';

@Controller('cms/menus')
@UseGuards(JwtAuthGuard, ManagerGuard)
export class CmsMenuController {
  constructor(private readonly menuService: CmsMenuService) {}

  @Get()
  async getMenuTree(@Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.menuService.getMenuTree(entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  async createMenu(@Body() dto: CreateMenuRequest, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.menuService.createMenuWithPage(entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put(':id')
  async updateMenu(@Param('id') id: string, @Body() dto: UpdateMenuRequest, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.menuService.updateMenu(id, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('reorder')
  async reorderMenus(@Body() dto: ReorderMenuRequest, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.menuService.reorderMenus(entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteMenu(@Param('id') id: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    await this.menuService.deleteMenu(id, entId);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
