import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { CmsSectionService } from '../service/cms-section.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { CreateSectionRequest } from '../dto/request/create-section.request';
import { UpdateSectionRequest } from '../dto/request/update-section.request';
import { ReorderSectionRequest } from '../dto/request/reorder-section.request';

@Controller('cms')
@UseGuards(JwtAuthGuard, ManagerGuard)
export class CmsSectionController {
  constructor(private readonly sectionService: CmsSectionService) {}

  @Get('pages/:pageId/sections')
  async getSections(@Param('pageId') pageId: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.sectionService.getSections(pageId, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('pages/:pageId/sections')
  async createSection(
    @Param('pageId') pageId: string,
    @Body() dto: CreateSectionRequest,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.sectionService.createSection(pageId, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put('sections/:id')
  async updateSection(@Param('id') id: string, @Body() dto: UpdateSectionRequest) {
    const data = await this.sectionService.updateSection(id, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch('pages/:pageId/sections/reorder')
  async reorderSections(
    @Param('pageId') pageId: string,
    @Body() dto: ReorderSectionRequest,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.sectionService.reorderSections(pageId, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    await this.sectionService.deleteSection(id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
