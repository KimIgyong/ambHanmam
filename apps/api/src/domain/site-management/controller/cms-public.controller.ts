import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../../global/decorator/public.decorator';
import { CmsMenuService } from '../service/cms-menu.service';
import { CmsPageService } from '../service/cms-page.service';
import { CmsPostService } from '../service/cms-post.service';
import { CmsSubscriberService } from '../service/cms-subscriber.service';
import { CmsPublishService } from '../service/cms-publish.service';
import { CmsSiteConfigService } from '../service/cms-site-config.service';
import { SubscribeRequest } from '../dto/request/subscribe.request';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Public()
@Controller('cms/public')
export class CmsPublicController {
  constructor(
    private readonly menuService: CmsMenuService,
    private readonly pageService: CmsPageService,
    private readonly postService: CmsPostService,
    private readonly subscriberService: CmsSubscriberService,
    private readonly publishService: CmsPublishService,
    private readonly siteConfigService: CmsSiteConfigService,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
  ) {}

  private async resolveEntityId(entityId?: string): Promise<string> {
    if (entityId) return entityId;
    const first = await this.entityRepo.findOne({ where: {}, order: { entCode: 'ASC' } });
    if (!first) throw new NotFoundException('No entity found');
    return first.entId;
  }

  @Get('menus')
  async getPublicMenus(@Query('entity_id') entityId?: string) {
    // If entity_id specified, filter by it; otherwise return all entities' menus (deduplicated)
    const data = entityId
      ? await this.menuService.getMenuTree(entityId)
      : await this.menuService.getAllMenuTree();
    // Filter to visible only
    const visible = data.filter((m: any) => m.isVisible);
    return { success: true, data: visible, timestamp: new Date().toISOString() };
  }

  @Get('pages/:slug')
  async getPublicPage(@Param('slug') slug: string, @Query('entity_id') entityId?: string) {
    const resolvedId = await this.resolveEntityId(entityId);
    const data = await this.pageService.getPageBySlug(slug, resolvedId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('pages/:slug/posts')
  async getPublicPosts(
    @Param('slug') slug: string,
    @Query('entity_id') entityId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Find PUBLISHED page directly — entity fallback for cross-entity pages
    let pageEntity = entityId
      ? await this.pageRepo.findOne({ where: { cmpSlug: slug, entId: entityId, cmpStatus: 'PUBLISHED' } })
      : null;
    if (!pageEntity) {
      pageEntity = await this.pageRepo.findOne({ where: { cmpSlug: slug, cmpStatus: 'PUBLISHED' } });
    }
    if (!pageEntity) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    const data = await this.postService.getPosts(pageEntity.cmpId, pageEntity.entId, {
      status: 'PUBLISHED',
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('posts/:id')
  async getPublicPost(@Param('id') id: string) {
    await this.postService.incrementViewCount(id);
    const data = await this.postService.getPostById(id);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('pages/:slug/subscribe')
  async subscribe(
    @Param('slug') slug: string,
    @Body() dto: SubscribeRequest,
    @Query('entity_id') entityId?: string,
  ) {
    let pageEntity = entityId
      ? await this.pageRepo.findOne({ where: { cmpSlug: slug, entId: entityId, cmpStatus: 'PUBLISHED' } })
      : null;
    if (!pageEntity) {
      pageEntity = await this.pageRepo.findOne({ where: { cmpSlug: slug, cmpStatus: 'PUBLISHED' } });
    }
    if (!pageEntity) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    const data = await this.subscriberService.subscribe(pageEntity.cmpId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('preview/:token')
  async getPreview(@Param('token') token: string) {
    const data = await this.publishService.getPreviewContent(token);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 발행된 사이트 설정 통합 조회 (HEADER + FOOTER + SITE_META) */
  @Get('site-config')
  async getPublicSiteConfig(@Query('entity_id') entityId?: string) {
    const resolvedId = await this.resolveEntityId(entityId);
    const data = await this.siteConfigService.getPublicConfig(resolvedId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  /** 발행된 특정 설정 조회 */
  @Get('site-config/:key')
  async getPublicSiteConfigByKey(
    @Param('key') key: string,
    @Query('entity_id') entityId?: string,
  ) {
    const resolvedId = await this.resolveEntityId(entityId);
    const data = await this.siteConfigService.getPublicConfigByKey(resolvedId, key);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
