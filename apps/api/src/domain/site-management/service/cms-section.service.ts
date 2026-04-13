import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsSectionEntity } from '../entity/cms-section.entity';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CreateSectionRequest } from '../dto/request/create-section.request';
import { UpdateSectionRequest } from '../dto/request/update-section.request';
import { ReorderSectionRequest } from '../dto/request/reorder-section.request';
import { CmsSectionMapper } from '../mapper/cms-section.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CmsSectionService {
  constructor(
    @InjectRepository(CmsSectionEntity)
    private readonly sectionRepo: Repository<CmsSectionEntity>,
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
  ) {}

  async getSections(pageId: string, entId: string) {
    await this.validatePage(pageId, entId);
    const sections = await this.sectionRepo.find({
      where: { cmpId: pageId },
      order: { cmsSortOrder: 'ASC' },
    });
    return sections.map((s) => CmsSectionMapper.toResponse(s));
  }

  async createSection(pageId: string, entId: string, dto: CreateSectionRequest) {
    await this.validatePage(pageId, entId);

    const maxSort = await this.sectionRepo
      .createQueryBuilder('s')
      .select('MAX(s.cms_sort_order)', 'max')
      .where('s.cmp_id = :pageId', { pageId })
      .getRawOne();

    const section = this.sectionRepo.create({
      cmpId: pageId,
      cmsType: dto.type,
      cmsSortOrder: (maxSort?.max || 0) + 1,
      cmsConfig: dto.config || {},
      cmsContentEn: dto.content_en || {},
      cmsContentKo: dto.content_ko || null,
      cmsIsVisible: dto.is_visible !== false,
    });
    await this.sectionRepo.save(section);
    return CmsSectionMapper.toResponse(section);
  }

  async updateSection(sectionId: string, dto: UpdateSectionRequest) {
    const section = await this.sectionRepo.findOne({ where: { cmsId: sectionId } });
    if (!section) throw new NotFoundException(ERROR_CODE.CMS_SECTION_NOT_FOUND);

    if (dto.config !== undefined) section.cmsConfig = dto.config;
    if (dto.content_en !== undefined) section.cmsContentEn = dto.content_en;
    if (dto.content_ko !== undefined) section.cmsContentKo = dto.content_ko;
    if (dto.is_visible !== undefined) section.cmsIsVisible = dto.is_visible;

    await this.sectionRepo.save(section);
    return CmsSectionMapper.toResponse(section);
  }

  async reorderSections(pageId: string, entId: string, dto: ReorderSectionRequest) {
    await this.validatePage(pageId, entId);
    for (const item of dto.items) {
      await this.sectionRepo.update({ cmsId: item.id }, { cmsSortOrder: item.sort_order });
    }
    return this.getSections(pageId, entId);
  }

  async deleteSection(sectionId: string) {
    const section = await this.sectionRepo.findOne({ where: { cmsId: sectionId } });
    if (!section) throw new NotFoundException(ERROR_CODE.CMS_SECTION_NOT_FOUND);
    await this.sectionRepo.remove(section);
  }

  private async validatePage(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    return page;
  }
}
