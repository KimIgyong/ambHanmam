import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CmsMenuEntity } from '../entity/cms-menu.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CmsPageContentEntity } from '../entity/cms-page-content.entity';
import { CmsSectionEntity } from '../entity/cms-section.entity';
import { CmsPostCategoryEntity } from '../entity/cms-post-category.entity';
import { CreateMenuRequest } from '../dto/request/create-menu.request';
import { UpdateMenuRequest } from '../dto/request/update-menu.request';
import { ReorderMenuRequest } from '../dto/request/reorder-menu.request';
import { CmsMenuMapper } from '../mapper/cms-menu.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

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
export class CmsMenuService {
  constructor(
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
  ) {}

  async getMenuTree(entId: string) {
    const menus = await this.menuRepo.find({
      where: { entId },
      relations: ['page'],
      order: { cmnSortOrder: 'ASC' },
    });
    return CmsMenuMapper.toTreeResponse(menus);
  }

  async getAllMenuTree() {
    const menus = await this.menuRepo.find({
      relations: ['page'],
      order: { cmnSortOrder: 'ASC' },
    });
    // Deduplicate by slug — keep the one whose page is PUBLISHED
    const bySlug = new Map<string, CmsMenuEntity>();
    for (const m of menus) {
      const prev = bySlug.get(m.cmnSlug);
      if (!prev || (m.page?.cmpStatus === 'PUBLISHED' && prev.page?.cmpStatus !== 'PUBLISHED')) {
        bySlug.set(m.cmnSlug, m);
      }
    }
    return CmsMenuMapper.toTreeResponse(Array.from(bySlug.values()));
  }

  async createMenuWithPage(entId: string, dto: CreateMenuRequest) {
    // Check slug uniqueness
    const existing = await this.menuRepo.findOne({
      where: { entId, cmnSlug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(ERROR_CODE.CMS_MENU_SLUG_DUPLICATE);
    }

    // Validate parent
    if (dto.parent_id) {
      const parent = await this.menuRepo.findOne({ where: { cmnId: dto.parent_id, entId } });
      if (!parent) {
        throw new BadRequestException(ERROR_CODE.CMS_MENU_INVALID_PARENT);
      }
    }

    // Get max sort_order
    const maxSort = await this.menuRepo
      .createQueryBuilder('m')
      .select('MAX(m.cmn_sort_order)', 'max')
      .where('m.ent_id = :entId', { entId })
      .andWhere(dto.parent_id ? 'm.cmn_parent_id = :parentId' : 'm.cmn_parent_id IS NULL', { parentId: dto.parent_id })
      .getRawOne();

    // Create menu
    const menu = this.menuRepo.create({
      entId,
      cmnParentId: dto.parent_id || null,
      cmnNameEn: dto.name_en,
      cmnNameKo: dto.name_ko || null,
      cmnSlug: dto.slug,
      cmnIcon: dto.icon || null,
      cmnType: dto.menu_type || 'INTERNAL',
      cmnExternalUrl: dto.external_url || null,
      cmnSortOrder: (maxSort?.max || 0) + 1,
    });
    await this.menuRepo.save(menu);

    // Create page
    const page = this.pageRepo.create({
      entId,
      cmnId: menu.cmnId,
      cmpType: dto.page_type,
      cmpTitle: dto.name_en,
      cmpSlug: dto.slug,
      cmpConfig: dto.page_config || {},
    });
    await this.pageRepo.save(page);

    // Create default content (EN)
    const content = this.contentRepo.create({
      cmpId: page.cmpId,
      cpcLang: 'en',
    });
    await this.contentRepo.save(content);

    // Create default sections for LANDING/SERVICE_INFO
    const defaultSections = DEFAULT_SECTIONS[dto.page_type];
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
    if (dto.page_type === 'BOARD' || dto.page_type === 'BLOG') {
      const cat = this.categoryRepo.create({
        cmpId: page.cmpId,
        cpgName: 'General',
        cpgSortOrder: 0,
      });
      await this.categoryRepo.save(cat);
    }

    menu.page = page;
    return CmsMenuMapper.toResponse(menu);
  }

  async updateMenu(menuId: string, entId: string, dto: UpdateMenuRequest) {
    const menu = await this.menuRepo.findOne({ where: { cmnId: menuId, entId } });
    if (!menu) throw new NotFoundException(ERROR_CODE.CMS_MENU_NOT_FOUND);

    if (dto.name_en !== undefined) menu.cmnNameEn = dto.name_en;
    if (dto.name_ko !== undefined) menu.cmnNameKo = dto.name_ko;
    if (dto.icon !== undefined) menu.cmnIcon = dto.icon;
    if (dto.is_visible !== undefined) menu.cmnIsVisible = dto.is_visible;
    if (dto.menu_type !== undefined) menu.cmnType = dto.menu_type;
    if (dto.external_url !== undefined) menu.cmnExternalUrl = dto.external_url;

    await this.menuRepo.save(menu);
    const updated = await this.menuRepo.findOne({ where: { cmnId: menuId }, relations: ['page'] });
    return CmsMenuMapper.toResponse(updated!);
  }

  async reorderMenus(entId: string, dto: ReorderMenuRequest) {
    for (const item of dto.items) {
      await this.menuRepo.update(
        { cmnId: item.id, entId },
        { cmnSortOrder: item.sort_order, cmnParentId: item.parent_id ?? undefined },
      );
    }
    return this.getMenuTree(entId);
  }

  async deleteMenu(menuId: string, entId: string) {
    const menu = await this.menuRepo.findOne({ where: { cmnId: menuId, entId } });
    if (!menu) throw new NotFoundException(ERROR_CODE.CMS_MENU_NOT_FOUND);

    const children = await this.menuRepo.count({ where: { cmnParentId: menuId, entId } });
    if (children > 0) {
      throw new BadRequestException(ERROR_CODE.CMS_MENU_HAS_CHILDREN);
    }

    // Soft delete page
    await this.pageRepo.softDelete({ cmnId: menuId });
    // Soft delete menu
    await this.menuRepo.softDelete({ cmnId: menuId });
  }
}
