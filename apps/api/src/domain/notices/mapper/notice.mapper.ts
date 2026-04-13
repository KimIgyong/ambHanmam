import { NoticeResponse, NoticeAttachmentResponse } from '@amb/types';
import { NoticeEntity } from '../entity/notice.entity';

export class NoticeMapper {
  static toResponse(entity: NoticeEntity): NoticeResponse {
    const attachments: NoticeAttachmentResponse[] = (entity.attachments || []).map((nta) => ({
      attachmentId: nta.ntaId,
      originalName: nta.ntaOriginalName,
      fileSize: nta.ntaFileSize,
      mimeType: nta.ntaMimeType,
      url: `/api/v1/files/${nta.ntaStoredName}`,
    }));

    return {
      noticeId: entity.ntcId,
      authorId: entity.usrId,
      authorName: entity.user?.usrName || '',
      title: entity.ntcTitle,
      content: entity.ntcContent,
      visibility: entity.ntcVisibility as NoticeResponse['visibility'],
      unit: entity.ntcUnit || null,
      isPinned: entity.ntcIsPinned,
      viewCount: entity.ntcViewCount,
      attachments,
      originalLang: entity.ntcOriginalLang || 'ko',
      createdAt: entity.ntcCreatedAt.toISOString(),
      updatedAt: entity.ntcUpdatedAt.toISOString(),
    };
  }
}
