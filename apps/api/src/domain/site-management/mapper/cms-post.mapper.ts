import { CmsPostEntity } from '../entity/cms-post.entity';

export class CmsPostMapper {
  static toResponse(entity: CmsPostEntity) {
    return {
      id: entity.cptId,
      pageId: entity.cmpId,
      categoryId: entity.cpgId,
      title: entity.cptTitle,
      content: entity.cptContent,
      authorId: entity.cptAuthorId,
      isPinned: entity.cptIsPinned,
      viewCount: entity.cptViewCount,
      featuredImage: entity.cptFeaturedImage,
      tags: entity.cptTags,
      status: entity.cptStatus,
      publishedAt: entity.cptPublishedAt?.toISOString() || null,
      category: entity.category ? {
        id: entity.category.cpgId,
        name: entity.category.cpgName,
      } : null,
      attachments: entity.attachments?.map((a) => ({
        id: a.cpaId,
        fileName: a.cpaFileName,
        fileUrl: a.cpaFileUrl,
        fileSize: a.cpaFileSize,
        mimeType: a.cpaMimeType,
      })) || [],
      createdAt: entity.cptCreatedAt?.toISOString(),
      updatedAt: entity.cptUpdatedAt?.toISOString(),
    };
  }

  static toListResponse(entity: CmsPostEntity) {
    return {
      id: entity.cptId,
      pageId: entity.cmpId,
      title: entity.cptTitle,
      authorId: entity.cptAuthorId,
      isPinned: entity.cptIsPinned,
      viewCount: entity.cptViewCount,
      featuredImage: entity.cptFeaturedImage,
      tags: entity.cptTags,
      status: entity.cptStatus,
      category: entity.category ? {
        id: entity.category.cpgId,
        name: entity.category.cpgName,
      } : null,
      publishedAt: entity.cptPublishedAt?.toISOString() || null,
      createdAt: entity.cptCreatedAt?.toISOString(),
    };
  }
}
