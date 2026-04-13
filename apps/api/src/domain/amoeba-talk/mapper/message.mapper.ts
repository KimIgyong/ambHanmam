import { TalkMessageEntity } from '../entity/talk-message.entity';
import { TalkAttachmentEntity } from '../entity/talk-attachment.entity';
import { TalkMessageResponse, TalkReactionSummary, TalkParentMessageSummary, TalkAttachmentResponse } from '@amb/types';

export class MessageMapper {
  static toMessageResponse(
    entity: TalkMessageEntity,
    senderName?: string,
    reactions?: TalkReactionSummary[],
    readCount?: number,
    parentMessage?: TalkParentMessageSummary | null,
    attachments?: TalkAttachmentEntity[],
    mentions?: { userId: string; userName: string }[],
    pinnedByName?: string | null,
    replyCount?: number,
  ): TalkMessageResponse {
    return {
      id: entity.msgId,
      channelId: entity.chnId,
      senderId: entity.usrId,
      senderName: senderName || 'Unknown',
      content: entity.msgContent,
      type: entity.msgType as TalkMessageResponse['type'],
      parentId: entity.msgParentId || null,
      parentMessage: parentMessage ?? null,
      reactions: reactions ?? [],
      readCount: readCount ?? 0,
      attachments: attachments?.map(MessageMapper.toAttachmentResponse) ?? [],
      mentions: mentions ?? [],
      isPinned: entity.msgIsPinned || false,
      pinnedAt: entity.msgPinnedAt?.toISOString() || null,
      pinnedByName: pinnedByName ?? null,
      isEdited: entity.msgUpdatedAt.getTime() - entity.msgCreatedAt.getTime() > 1000,
      replyCount: replyCount ?? 0,
      createdAt: entity.msgCreatedAt.toISOString(),
      updatedAt: entity.msgUpdatedAt.toISOString(),
    };
  }

  static toAttachmentResponse(att: TalkAttachmentEntity): TalkAttachmentResponse {
    return {
      id: att.tatId,
      originalName: att.tatOriginalName,
      fileSize: att.tatFileSize,
      mimeType: att.tatMimeType,
      downloadUrl: `/api/v1/files/${att.tatStoredName}`,
    };
  }
}
