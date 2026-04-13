import { CmsSectionEntity } from '../entity/cms-section.entity';

export class CmsSectionMapper {
  static toResponse(entity: CmsSectionEntity) {
    return {
      id: entity.cmsId,
      pageId: entity.cmpId,
      type: entity.cmsType,
      sortOrder: entity.cmsSortOrder,
      config: entity.cmsConfig,
      contentEn: entity.cmsContentEn,
      contentKo: entity.cmsContentKo,
      isVisible: entity.cmsIsVisible,
      createdAt: entity.cmsCreatedAt?.toISOString(),
    };
  }
}
