import { CmsMenuEntity } from '../entity/cms-menu.entity';

export class CmsMenuMapper {
  static toResponse(entity: CmsMenuEntity): any {
    return {
      id: entity.cmnId,
      parentId: entity.cmnParentId,
      nameEn: entity.cmnNameEn,
      nameKo: entity.cmnNameKo,
      slug: entity.cmnSlug,
      icon: entity.cmnIcon,
      type: entity.cmnType,
      externalUrl: entity.cmnExternalUrl,
      sortOrder: entity.cmnSortOrder,
      isVisible: entity.cmnIsVisible,
      page: entity.page ? {
        id: entity.page.cmpId,
        type: entity.page.cmpType,
        title: entity.page.cmpTitle,
        slug: entity.page.cmpSlug,
        status: entity.page.cmpStatus,
      } : null,
      children: entity.children?.map((c) => CmsMenuMapper.toResponse(c)) || [],
      createdAt: entity.cmnCreatedAt?.toISOString(),
      updatedAt: entity.cmnUpdatedAt?.toISOString(),
    };
  }

  static toTreeResponse(entities: CmsMenuEntity[]) {
    const roots = entities.filter((e) => !e.cmnParentId);
    return roots
      .sort((a, b) => a.cmnSortOrder - b.cmnSortOrder)
      .map((root) => {
        root.children = entities
          .filter((e) => e.cmnParentId === root.cmnId)
          .sort((a, b) => a.cmnSortOrder - b.cmnSortOrder);
        return CmsMenuMapper.toResponse(root);
      });
  }
}
