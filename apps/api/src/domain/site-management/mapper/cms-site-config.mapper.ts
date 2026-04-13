import { CmsSiteConfigEntity } from '../entity/cms-site-config.entity';

export class CmsSiteConfigMapper {
  static toResponse(entity: CmsSiteConfigEntity) {
    return {
      id: entity.cscId,
      entityId: entity.entId,
      key: entity.cscKey,
      value: entity.cscValue,
      version: entity.cscVersion,
      publishedAt: entity.cscPublishedAt,
      publishedBy: entity.cscPublishedBy,
      createdAt: entity.cscCreatedAt,
      updatedAt: entity.cscUpdatedAt,
      updatedBy: entity.cscUpdatedBy,
    };
  }

  static toPublicResponse(entity: CmsSiteConfigEntity) {
    return {
      key: entity.cscKey,
      value: entity.cscValue,
      version: entity.cscVersion,
      publishedAt: entity.cscPublishedAt,
    };
  }
}
