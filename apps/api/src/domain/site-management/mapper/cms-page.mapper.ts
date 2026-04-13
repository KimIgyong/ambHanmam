import { CmsPageEntity } from '../entity/cms-page.entity';

export class CmsPageMapper {
  static toResponse(entity: CmsPageEntity) {
    return {
      id: entity.cmpId,
      menuId: entity.cmnId,
      type: entity.cmpType,
      title: entity.cmpTitle,
      slug: entity.cmpSlug,
      description: entity.cmpDescription,
      ogImage: entity.cmpOgImage,
      seoKeywords: entity.cmpSeoKeywords,
      status: entity.cmpStatus,
      publishedAt: entity.cmpPublishedAt?.toISOString() || null,
      publishedBy: entity.cmpPublishedBy,
      currentVersion: entity.cmpCurrentVersion,
      config: entity.cmpConfig,
      contents: entity.contents?.map((c) => ({
        id: c.cpcId,
        lang: c.cpcLang,
        content: c.cpcContent,
        sectionsJson: c.cpcSectionsJson,
        updatedAt: c.cpcUpdatedAt?.toISOString(),
      })) || [],
      sections: entity.sections?.sort((a, b) => a.cmsSortOrder - b.cmsSortOrder)
        .filter(s => s.cmsIsVisible)
        .map(s => ({
          id: s.cmsId,
          type: s.cmsType,
          sortOrder: s.cmsSortOrder,
          config: s.cmsConfig,
          contentEn: s.cmsContentEn,
          contentKo: s.cmsContentKo,
          isVisible: s.cmsIsVisible,
        })) || [],
      menu: entity.menu ? {
        id: entity.menu.cmnId,
        nameEn: entity.menu.cmnNameEn,
        nameKo: entity.menu.cmnNameKo,
        slug: entity.menu.cmnSlug,
      } : null,
      createdAt: entity.cmpCreatedAt?.toISOString(),
      updatedAt: entity.cmpUpdatedAt?.toISOString(),
    };
  }

  static toListResponse(entity: CmsPageEntity) {
    return {
      id: entity.cmpId,
      menuId: entity.cmnId,
      type: entity.cmpType,
      title: entity.cmpTitle,
      slug: entity.cmpSlug,
      status: entity.cmpStatus,
      publishedAt: entity.cmpPublishedAt?.toISOString() || null,
      currentVersion: entity.cmpCurrentVersion,
      menu: entity.menu ? {
        nameEn: entity.menu.cmnNameEn,
        nameKo: entity.menu.cmnNameKo,
        slug: entity.menu.cmnSlug,
        icon: entity.menu.cmnIcon,
      } : null,
      updatedAt: entity.cmpUpdatedAt?.toISOString(),
    };
  }

  static toVersionResponse(version: any) {
    return {
      id: version.cpvId,
      version: version.cpvVersion,
      publishedBy: version.cpvPublishedBy,
      publishedAt: version.cpvPublishedAt?.toISOString(),
      note: version.cpvNote,
    };
  }
}
