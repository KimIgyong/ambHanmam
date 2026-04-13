import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { CmsMenuEntity } from '../entity/cms-menu.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CmsPageContentEntity } from '../entity/cms-page-content.entity';
import { CmsSectionEntity } from '../entity/cms-section.entity';
import { CmsPostCategoryEntity } from '../entity/cms-post-category.entity';
import { CmsSiteConfigService } from './cms-site-config.service';

const DEFAULT_CMS_MENUS = [
  { nameEn: 'Home', nameKo: '홈', slug: 'home', pageType: 'LANDING', sortOrder: 0 },
  { nameEn: 'About', nameKo: '소개', slug: 'about', pageType: 'STATIC', sortOrder: 1 },
  { nameEn: 'Services', nameKo: '서비스', slug: 'services', pageType: 'SERVICE_INFO', sortOrder: 2 },
  { nameEn: 'Blog', nameKo: '블로그', slug: 'blog', pageType: 'BLOG', sortOrder: 3 },
  { nameEn: 'News', nameKo: '뉴스', slug: 'news', pageType: 'BOARD', sortOrder: 4 },
  { nameEn: 'Contact', nameKo: '연락처', slug: 'contact', pageType: 'SUBSCRIPTION', sortOrder: 5 },
];

const DEFAULT_SECTIONS: Record<string, Array<{ type: string; contentEn: Record<string, any> }>> = {
  LANDING: [
    { type: 'HERO', contentEn: { title: 'Welcome', subtitle: '', ctaText: 'Get Started', ctaLink: '' } },
    { type: 'FEATURES', contentEn: { items: [] } },
    { type: 'CTA', contentEn: { title: 'Ready to start?', buttonText: 'Contact Us', buttonLink: '' } },
  ],
  SERVICE_INFO: [
    { type: 'HERO', contentEn: { title: 'Service', subtitle: '', ctaText: 'Learn More', ctaLink: '' } },
    { type: 'FEATURES', contentEn: { items: [] } },
    { type: 'FAQ', contentEn: { items: [] } },
    { type: 'CTA', contentEn: { title: 'Get Started', buttonText: 'Sign Up', buttonLink: '' } },
  ],
};

@Injectable()
export class CmsSeedService implements OnModuleInit {
  private readonly logger = new Logger(CmsSeedService.name);

  constructor(
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    @InjectRepository(CmsMenuEntity)
    private readonly menuRepo: Repository<CmsMenuEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
    @InjectRepository(CmsPageContentEntity)
    private readonly contentRepo: Repository<CmsPageContentEntity>,
    @InjectRepository(CmsSectionEntity)
    private readonly sectionRepo: Repository<CmsSectionEntity>,
    @InjectRepository(CmsPostCategoryEntity)
    private readonly categoryRepo: Repository<CmsPostCategoryEntity>,
    private readonly siteConfigService: CmsSiteConfigService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultMenus();
    await this.seedDefaultSiteConfig();
  }

  private async seedDefaultMenus() {
    const entities = await this.entityRepo.find();
    if (entities.length === 0) {
      this.logger.log('No entities found, skipping CMS seed.');
      return;
    }

    for (const ent of entities) {
      const existingCount = await this.menuRepo.count({ where: { entId: ent.entId } });
      if (existingCount > 0) {
        continue;
      }

      this.logger.log(`Seeding default CMS menus for entity: ${ent.entName} (${ent.entId})`);
      let created = 0;

      for (const menuDef of DEFAULT_CMS_MENUS) {
        await this.createMenuWithPage(ent.entId, menuDef);
        created++;
      }

      this.logger.log(`Created ${created} default CMS menus for entity: ${ent.entName}`);
    }
  }

  private async createMenuWithPage(
    entId: string,
    def: { nameEn: string; nameKo: string; slug: string; pageType: string; sortOrder: number },
  ) {
    // Create menu
    const menu = this.menuRepo.create({
      entId,
      cmnNameEn: def.nameEn,
      cmnNameKo: def.nameKo,
      cmnSlug: def.slug,
      cmnSortOrder: def.sortOrder,
    });
    await this.menuRepo.save(menu);

    // Create page
    const page = this.pageRepo.create({
      entId,
      cmnId: menu.cmnId,
      cmpType: def.pageType,
      cmpTitle: def.nameEn,
      cmpSlug: def.slug,
      cmpStatus: 'PUBLISHED',
      cmpPublishedAt: new Date(),
      cmpConfig: {},
    });
    await this.pageRepo.save(page);

    // Create default content (EN)
    const content = this.contentRepo.create({
      cmpId: page.cmpId,
      cpcLang: 'en',
    });
    await this.contentRepo.save(content);

    // Create default sections for LANDING/SERVICE_INFO
    const defaultSections = DEFAULT_SECTIONS[def.pageType];
    if (defaultSections) {
      for (let i = 0; i < defaultSections.length; i++) {
        const sec = this.sectionRepo.create({
          cmpId: page.cmpId,
          cmsType: defaultSections[i].type,
          cmsSortOrder: i,
          cmsContentEn: defaultSections[i].contentEn,
        });
        await this.sectionRepo.save(sec);
      }
    }

    // Create default category for BOARD/BLOG
    if (def.pageType === 'BOARD' || def.pageType === 'BLOG') {
      const cat = this.categoryRepo.create({
        cmpId: page.cmpId,
        cpgName: 'General',
        cpgSortOrder: 0,
      });
      await this.categoryRepo.save(cat);
    }
  }

  private async seedDefaultSiteConfig() {
    const entities = await this.entityRepo.find();
    for (const ent of entities) {
      await this.siteConfigService.seedIfNotExists(ent.entId, 'HEADER', {
        logo: { text: 'amoeba', height: 28, linkUrl: '/' },
        style: { position: 'fixed', height: 64, borderBottom: true },
        navigation: { source: 'CMS_MENUS', maxDepth: 2 },
        actions: [
          { type: 'LANGUAGE_SWITCHER' },
          { type: 'CTA_BUTTON', label: { en: 'Get Started Free', ko: '무료 시작하기', vi: 'Bắt đầu miễn phí' }, url: '/register', variant: 'primary' },
        ],
        landingOverride: { enabled: true, transparentOnTop: true, solidOnScroll: true, scrollThreshold: 40 },
      });

      await this.siteConfigService.seedIfNotExists(ent.entId, 'FOOTER', {
        layout: 'COLUMNS',
        logo: { text: 'amoeba', height: 28 },
        description: { en: 'Developing the simplest solutions for business expansion and online customer acquisition.', ko: '비즈니스 확장과 온라인 고객 창출을 위한 가장 간단하고 저렴한 솔루션을 개발합니다.', vi: 'Phát triển giải pháp đơn giản nhất cho mở rộng kinh doanh và thu hút khách hàng.' },
        columns: [
          { title: { en: 'Products', ko: 'Products', vi: 'Sản phẩm' }, links: [
            { label: { en: 'Amoeba Order' }, url: '#' },
            { label: { en: 'Amoeba Talk' }, url: '#' },
            { label: { en: 'Biz Package' }, url: '#' },
            { label: { en: 'Amoeba KMS' }, url: '#' },
            { label: { en: 'Pricing', ko: '요금제', vi: 'Bảng giá' }, url: '/page/pricing' },
          ]},
          { title: { en: 'Company', ko: 'Company', vi: 'Công ty' }, links: [
            { label: { en: 'About Us', ko: '회사소개', vi: 'Giới thiệu' }, url: '#' },
            { label: { en: 'Careers', ko: '채용', vi: 'Tuyển dụng' }, url: '#' },
            { label: { en: 'Blog', ko: '블로그', vi: 'Blog' }, url: '#' },
            { label: { en: 'Partners', ko: '파트너', vi: 'Đối tác' }, url: '#' },
            { label: { en: 'Contact Us', ko: '문의하기', vi: 'Liên hệ' }, url: '#' },
          ]},
          { title: { en: 'Support', ko: 'Support', vi: 'Hỗ trợ' }, links: [
            { label: { en: 'Help Center', ko: '도움말 센터', vi: 'Trung tâm Trợ giúp' }, url: '#' },
            { label: { en: 'API Docs', ko: 'API 문서', vi: 'Tài liệu API' }, url: '#' },
            { label: { en: 'Service Status', ko: '서비스 상태', vi: 'Trạng thái' }, url: '#' },
            { label: { en: 'Community', ko: '커뮤니티', vi: 'Cộng đồng' }, url: '#' },
          ]},
        ],
        social: [
          { platform: 'linkedin', url: '#' },
          { platform: 'facebook', url: '#' },
          { platform: 'instagram', url: '#' },
        ],
        bottomBar: {
          copyright: { en: 'Amoeba Company. All rights reserved.', ko: '아메바컴퍼니. All rights reserved.', vi: 'Công ty Amoeba. Đã đăng ký bản quyền.' },
          links: [
            { label: { en: 'Terms of Service', ko: '이용약관', vi: 'Điều khoản' }, url: '#' },
            { label: { en: 'Privacy Policy', ko: '개인정보처리방침', vi: 'Bảo mật' }, url: '#' },
            { label: { en: 'SLA' }, url: '#' },
          ],
        },
      });

      await this.siteConfigService.seedIfNotExists(ent.entId, 'SITE_META', {
        siteName: 'Amoeba',
        defaultLang: 'en',
        favicon: '/favicon.ico',
      });
    }
  }
}
