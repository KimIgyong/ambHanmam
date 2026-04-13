import { Controller, Get, Put, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { ManagerGuard } from '../../settings/guard/manager.guard';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CmsPageService } from '../service/cms-page.service';
import { resolveEntityId } from '../../entity-settings/util/resolve-entity-id';
import { CmsPublishService } from '../service/cms-publish.service';
import { UpdatePageRequest } from '../dto/request/update-page.request';
import { SavePageContentRequest } from '../dto/request/save-page-content.request';
import { PublishPageRequest } from '../dto/request/publish-page.request';

@Controller('cms/pages')
@UseGuards(JwtAuthGuard, ManagerGuard)
export class CmsPageController {
  constructor(
    private readonly pageService: CmsPageService,
    private readonly publishService: CmsPublishService,
  ) {}

  @Get()
  async getPages(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.pageService.getPages(entId, { type, status, search });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  async getPage(@Param('id') id: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.pageService.getPageById(id, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put(':id')
  async updatePage(@Param('id') id: string, @Body() dto: UpdatePageRequest, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.pageService.updatePage(id, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Put(':id/content/:lang')
  async saveContent(
    @Param('id') id: string,
    @Param('lang') lang: string,
    @Body() dto: SavePageContentRequest,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.pageService.saveContent(id, lang, entId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/publish')
  async publishPage(@Param('id') id: string, @Body() dto: PublishPageRequest, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const userId = req.user.userId;
    const data = await this.publishService.publishPage(id, entId, userId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/unpublish')
  async unpublishPage(@Param('id') id: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.publishService.unpublishPage(id, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.publishService.getVersions(id, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/rollback/:versionId')
  @UseGuards(AdminGuard)
  async rollback(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Req() req: any,
  ) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const userId = req.user.userId;
    const data = await this.publishService.rollbackToVersion(id, versionId, entId, userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/preview')
  async createPreview(@Param('id') id: string, @Req() req: any) {
    const entId = resolveEntityId(req.headers['x-entity-id'], req.user);
    const data = await this.publishService.createPreviewToken(id, entId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
