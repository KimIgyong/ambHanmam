import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsMenuEntity } from './entity/cms-menu.entity';
import { CmsPageEntity } from './entity/cms-page.entity';
import { CmsPageContentEntity } from './entity/cms-page-content.entity';
import { CmsPageVersionEntity } from './entity/cms-page-version.entity';
import { CmsSectionEntity } from './entity/cms-section.entity';
import { CmsPostEntity } from './entity/cms-post.entity';
import { CmsPostCategoryEntity } from './entity/cms-post-category.entity';
import { CmsPostAttachmentEntity } from './entity/cms-post-attachment.entity';
import { CmsSubscriberEntity } from './entity/cms-subscriber.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { CmsMenuService } from './service/cms-menu.service';
import { CmsPageService } from './service/cms-page.service';
import { CmsPublishService } from './service/cms-publish.service';
import { CmsSectionService } from './service/cms-section.service';
import { CmsPostService } from './service/cms-post.service';
import { CmsSubscriberService } from './service/cms-subscriber.service';
import { CmsSeedService } from './service/cms-seed.service';
import { CmsMenuController } from './controller/cms-menu.controller';
import { CmsPageController } from './controller/cms-page.controller';
import { CmsSectionController } from './controller/cms-section.controller';
import { CmsPostController } from './controller/cms-post.controller';
import { CmsSubscriberController } from './controller/cms-subscriber.controller';
import { CmsPublicController } from './controller/cms-public.controller';
import { CmsSiteConfigEntity } from './entity/cms-site-config.entity';
import { CmsSiteConfigService } from './service/cms-site-config.service';
import { CmsSiteConfigController } from './controller/cms-site-config.controller';
import { CmsStatsController } from './controller/cms-stats.controller';
import { CmsStatsService } from './service/cms-stats.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CmsMenuEntity,
      CmsPageEntity,
      CmsPageContentEntity,
      CmsPageVersionEntity,
      CmsSectionEntity,
      CmsPostEntity,
      CmsPostCategoryEntity,
      CmsPostAttachmentEntity,
      CmsSubscriberEntity,
      CmsSiteConfigEntity,
      HrEntityEntity,
    ]),
  ],
  controllers: [
    CmsMenuController,
    CmsPageController,
    CmsSectionController,
    CmsPostController,
    CmsSubscriberController,
    CmsPublicController,
    CmsSiteConfigController,
    CmsStatsController,
  ],
  providers: [
    CmsMenuService,
    CmsPageService,
    CmsPublishService,
    CmsSectionService,
    CmsPostService,
    CmsSubscriberService,
    CmsSeedService,
    CmsSiteConfigService,
    CmsStatsService,
  ],
  exports: [CmsMenuService, CmsPageService, CmsSiteConfigService],
})
export class SiteManagementModule {}
