import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CmsPageContentEntity } from '../entity/cms-page-content.entity';
import { UpdatePageRequest } from '../dto/request/update-page.request';
import { SavePageContentRequest } from '../dto/request/save-page-content.request';
import { CmsPageMapper } from '../mapper/cms-page.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class CmsPageService {
  constructor(
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
    @InjectRepository(CmsPageContentEntity)
    private readonly contentRepo: Repository<CmsPageContentEntity>,
  ) {}

  async getPages(entId: string, filters?: { type?: string; status?: string; search?: string }) {
    const qb = this.pageRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.menu', 'menu')
      .where('p.ent_id = :entId', { entId })
      .orderBy('menu.cmn_sort_order', 'ASC');

    if (filters?.type) qb.andWhere('p.cmp_type = :type', { type: filters.type });
    if (filters?.status) qb.andWhere('p.cmp_status = :status', { status: filters.status });
    if (filters?.search) {
      qb.andWhere('(p.cmp_title ILIKE :search OR p.cmp_slug ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const pages = await qb.getMany();
    return pages.map((p) => CmsPageMapper.toListResponse(p));
  }

  async getPageById(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({
      where: { cmpId: pageId, entId },
      relations: ['menu', 'contents', 'sections', 'categories'],
    });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    return CmsPageMapper.toResponse(page);
  }

  async updatePage(pageId: string, entId: string, dto: UpdatePageRequest) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    if (dto.title !== undefined) page.cmpTitle = dto.title;
    if (dto.description !== undefined) page.cmpDescription = dto.description;
    if (dto.og_image !== undefined) page.cmpOgImage = dto.og_image;
    if (dto.seo_keywords !== undefined) page.cmpSeoKeywords = dto.seo_keywords;
    if (dto.config !== undefined) page.cmpConfig = dto.config;

    await this.pageRepo.save(page);
    return this.getPageById(pageId, entId);
  }

  async saveContent(pageId: string, lang: string, entId: string, dto: SavePageContentRequest) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    let content = await this.contentRepo.findOne({
      where: { cmpId: pageId, cpcLang: lang },
    });

    if (!content) {
      content = this.contentRepo.create({ cmpId: pageId, cpcLang: lang });
    }

    if (dto.content !== undefined) content.cpcContent = dto.content;
    if (dto.sections_json !== undefined) content.cpcSectionsJson = dto.sections_json;

    await this.contentRepo.save(content);
    return {
      id: content.cpcId,
      lang: content.cpcLang,
      content: content.cpcContent,
      sectionsJson: content.cpcSectionsJson,
      updatedAt: content.cpcUpdatedAt?.toISOString(),
    };
  }

  async getPageBySlug(slug: string, entId: string) {
    // Try with entity filter first, then fallback to any entity
    let page = await this.pageRepo.findOne({
      where: { cmpSlug: slug, entId, cmpStatus: 'PUBLISHED' },
      relations: ['menu', 'contents', 'sections'],
    });
    if (!page) {
      page = await this.pageRepo.findOne({
        where: { cmpSlug: slug, cmpStatus: 'PUBLISHED' },
        relations: ['menu', 'contents', 'sections'],
      });
    }
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    return CmsPageMapper.toResponse(page);
  }
}
