import { ConversationEntity } from '../entity/conversation.entity';
import { MessageEntity } from '../entity/message.entity';
import {
  ConversationResponse,
  ConversationDetailResponse,
  MessageResponse,
  AdminConversationResponse,
  AdminConversationDetailResponse,
  AdminTimelineMessageResponse,
} from '../dto/response/chat.response';

export class ChatMapper {
  static toConversationResponse(entity: ConversationEntity): ConversationResponse {
    return {
      conversationId: entity.cvsId,
      userId: entity.usrId,
      unit: entity.cvsUnit,
      title: entity.cvsTitle,
      messageCount: entity.cvsMessageCount,
      createdAt: entity.cvsCreatedAt.toISOString(),
      updatedAt: entity.cvsUpdatedAt.toISOString(),
    };
  }

  static toMessageResponse(entity: MessageEntity): MessageResponse {
    return {
      messageId: entity.msgId,
      conversationId: entity.cvsId,
      role: entity.msgRole,
      content: entity.msgContent,
      tokenCount: entity.msgTokenCount,
      order: entity.msgOrder,
      createdAt: entity.msgCreatedAt.toISOString(),
    };
  }

  static toConversationDetailResponse(
    entity: ConversationEntity,
    messages: MessageEntity[],
  ): ConversationDetailResponse {
    return {
      ...ChatMapper.toConversationResponse(entity),
      messages: messages.map(ChatMapper.toMessageResponse),
    };
  }

  static toAdminConversationResponse(entity: ConversationEntity): AdminConversationResponse {
    return {
      ...ChatMapper.toConversationResponse(entity),
      userName: entity.user?.usrName || '',
      userEmail: entity.user?.usrEmail || '',
      entityId: entity.entId || null,
      entityCode: entity.hrEntity?.entCode || '',
      entityName: entity.hrEntity?.entName || '',
    };
  }

  static toAdminConversationDetailResponse(
    entity: ConversationEntity,
    messages: MessageEntity[],
  ): AdminConversationDetailResponse {
    return {
      ...ChatMapper.toConversationDetailResponse(entity, messages),
      userName: entity.user?.usrName || '',
      userEmail: entity.user?.usrEmail || '',
      entityId: entity.entId || null,
      entityCode: entity.hrEntity?.entCode || '',
      entityName: entity.hrEntity?.entName || '',
    };
  }

  static toAdminTimelineMessageResponse(entity: MessageEntity): AdminTimelineMessageResponse {
    return {
      ...ChatMapper.toMessageResponse(entity),
      userName: entity.conversation?.user?.usrName || '',
      userEmail: entity.conversation?.user?.usrEmail || '',
      unit: entity.conversation?.cvsUnit || '',
      title: entity.conversation?.cvsTitle || '',
      entityId: entity.conversation?.entId || null,
      entityCode: entity.conversation?.hrEntity?.entCode || '',
      entityName: entity.conversation?.hrEntity?.entName || '',
    };
  }
}
