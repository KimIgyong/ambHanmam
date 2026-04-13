import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CmsPageEntity } from '../entity/cms-page.entity';
import { CmsPageContentEntity } from '../entity/cms-page-content.entity';
import { CmsPageVersionEntity } from '../entity/cms-page-version.entity';
import { CmsSectionEntity } from '../entity/cms-section.entity';
import { PublishPageRequest } from '../dto/request/publish-page.request';
import { CmsPageMapper } from '../mapper/cms-page.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { randomUUID } from 'crypto';

@Injectable()
export class CmsPublishService {
  constructor(
    @InjectRepository(CmsPageEntity)
    private readonly pageRepo: Repository<CmsPageEntity>,
    @InjectRepository(CmsPageContentEntity)
    private readonly contentRepo: Repository<CmsPageContentEntity>,
    @InjectRepository(CmsPageVersionEntity)
    private readonly versionRepo: Repository<CmsPageVersionEntity>,
    @InjectRepository(CmsSectionEntity)
    private readonly sectionRepo: Repository<CmsSectionEntity>,
  ) {}

  async publishPage(pageId: string, entId: string, userId: string, dto: PublishPageRequest) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
    if (page.cmpStatus === 'ARCHIVED') {
      throw new BadRequestException(ERROR_CODE.CMS_PAGE_ALREADY_ARCHIVED);
    }

    // Get current contents + sections for snapshot
    const contents = await this.contentRepo.find({ where: { cmpId: pageId } });
    const sections = await this.sectionRepo.find({
      where: { cmpId: pageId },
      order: { cmsSortOrder: 'ASC' },
    });

    if (contents.length === 0 && sections.length === 0) {
      throw new BadRequestException(ERROR_CODE.CMS_PAGE_CONTENT_EMPTY);
    }

    // Create version snapshot
    const nextVersion = page.cmpCurrentVersion + 1;
    const snapshot = {
      contents: contents.map((c) => ({
        lang: c.cpcLang,
        content: c.cpcContent,
        sectionsJson: c.cpcSectionsJson,
      })),
      sections: sections.map((s) => ({
        type: s.cmsType,
        sortOrder: s.cmsSortOrder,
        config: s.cmsConfig,
        contentEn: s.cmsContentEn,
        contentKo: s.cmsContentKo,
        isVisible: s.cmsIsVisible,
      })),
      config: page.cmpConfig,
    };

    const version = this.versionRepo.create({
      cmpId: pageId,
      cpvVersion: nextVersion,
      cpvSnapshot: snapshot,
      cpvPublishedBy: userId,
      cpvNote: dto.note || null,
    });
    await this.versionRepo.save(version);

    // Update page status
    page.cmpStatus = 'PUBLISHED';
    page.cmpPublishedAt = new Date();
    page.cmpPublishedBy = userId;
    page.cmpCurrentVersion = nextVersion;
    await this.pageRepo.save(page);

    return CmsPageMapper.toVersionResponse(version);
  }

  async unpublishPage(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    page.cmpStatus = 'DRAFT';
    await this.pageRepo.save(page);
    return { success: true };
  }

  async getVersions(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    const versions = await this.versionRepo.find({
      where: { cmpId: pageId },
      order: { cpvVersion: 'DESC' },
    });
    return versions.map((v) => CmsPageMapper.toVersionResponse(v));
  }

  async rollbackToVersion(pageId: string, versionId: string, entId: string, userId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    const version = await this.versionRepo.findOne({ where: { cpvId: versionId, cmpId: pageId } });
    if (!version) throw new NotFoundException(ERROR_CODE.CMS_VERSION_NOT_FOUND);

    const snapshot = version.cpvSnapshot as any;

    // Restore contents
    await this.contentRepo.delete({ cmpId: pageId });
    if (snapshot.contents) {
      for (const c of snapshot.contents) {
        const content = this.contentRepo.create({
          cmpId: pageId,
          cpcLang: c.lang,
          cpcContent: c.content,
          cpcSectionsJson: c.sectionsJson,
        });
        await this.contentRepo.save(content);
      }
    }

    // Restore sections
    await this.sectionRepo.delete({ cmpId: pageId });
    if (snapshot.sections) {
      for (const s of snapshot.sections) {
        const section = this.sectionRepo.create({
          cmpId: pageId,
          cmsType: s.type,
          cmsSortOrder: s.sortOrder,
          cmsConfig: s.config,
          cmsContentEn: s.contentEn,
          cmsContentKo: s.contentKo,
          cmsIsVisible: s.isVisible,
        });
        await this.sectionRepo.save(section);
      }
    }

    // Restore config
    if (snapshot.config) {
      page.cmpConfig = snapshot.config;
    }

    // Auto-publish as new version
    return this.publishPage(pageId, entId, userId, {
      note: `Rollback to v${version.cpvVersion}`,
    });
  }

  async createPreviewToken(pageId: string, entId: string) {
    const page = await this.pageRepo.findOne({ where: { cmpId: pageId, entId } });
    if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);

    // Simple token: pageId + timestamp + random, expires in 24h
    const token = Buffer.from(JSON.stringify({
      pageId,
      exp: Date.now() + 24 * 60 * 60 * 1000,
      nonce: randomUUID(),
    })).toString('base64url');

    return { token, expiresIn: '24h' };
  }

  async getPreviewContent(token: string) {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
      if (payload.exp < Date.now()) {
        throw new BadRequestException(ERROR_CODE.CMS_PREVIEW_TOKEN_EXPIRED);
      }
      const page = await this.pageRepo.findOne({
        where: { cmpId: payload.pageId },
        relations: ['menu', 'contents', 'sections'],
      });
      if (!page) throw new NotFoundException(ERROR_CODE.CMS_PAGE_NOT_FOUND);
      return CmsPageMapper.toResponse(page);
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) throw e;
      throw new BadRequestException(ERROR_CODE.CMS_PREVIEW_TOKEN_EXPIRED);
    }
  }
}
