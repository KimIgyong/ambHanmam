import { TalkChannelEntity } from '../entity/talk-channel.entity';
import { TalkChannelMemberEntity } from '../entity/talk-channel-member.entity';
import { TalkMessageEntity } from '../entity/talk-message.entity';
import { TalkAttachmentEntity } from '../entity/talk-attachment.entity';
import { TalkChannelResponse, TalkChannelMemberResponse, TalkMessageResponse } from '@amb/types';
import { MessageMapper } from './message.mapper';

export class ChannelMapper {
  static toChannelResponse(
    entity: TalkChannelEntity,
    memberCount: number,
    unreadCount: number,
    lastMessage: TalkMessageEntity | null,
    createdByName: string | null,
    isPinned?: boolean,
    dmPartnerUserId?: string | null,
    lastMessageSenderName?: string | null,
    lastMessageMentions?: { userId: string; userName: string }[],
    isMuted?: boolean,
    lastMessageAttachments?: TalkAttachmentEntity[],
  ): TalkChannelResponse {
    return {
      id: entity.chnId,
      name: entity.chnName,
      type: entity.chnType as TalkChannelResponse['type'],
      description: entity.chnDescription || null,
      entityId: entity.entId,
      createdBy: entity.chnCreatedBy,
      createdByName,
      memberCount,
      unreadCount,
      lastMessage: lastMessage
        ? MessageMapper.toMessageResponse(lastMessage, lastMessageSenderName || undefined, undefined, undefined, undefined, lastMessageAttachments, lastMessageMentions)
        : null,
      isPinned: isPinned || false,
      isMuted: isMuted || false,
      dmPartnerUserId: dmPartnerUserId || null,
      archivedAt: entity.chnArchivedAt ? entity.chnArchivedAt.toISOString() : null,
      createdAt: entity.chnCreatedAt.toISOString(),
      updatedAt: entity.chnUpdatedAt.toISOString(),
    };
  }

  static toChannelMemberResponse(
    member: TalkChannelMemberEntity,
    userName: string,
  ): TalkChannelMemberResponse {
    return {
      id: member.chmId,
      userId: member.usrId,
      userName,
      role: member.chmRole as TalkChannelMemberResponse['role'],
      joinedAt: member.chmJoinedAt.toISOString(),
    };
  }
}
