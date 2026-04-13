import { NotificationEntity } from '../entity/notification.entity';

export interface NotificationResponse {
  ntfId: string;
  ntfType: string;
  ntfTitle: string;
  ntfMessage: string | null;
  ntfRecipientId: string;
  ntfSenderId: string;
  senderName?: string;
  ntfResourceType: string;
  ntfResourceId: string;
  ntfIsRead: boolean;
  ntfReadAt: string | null;
  entId: string;
  ntfCreatedAt: string;
}

export class NotificationMapper {
  static toResponse(entity: NotificationEntity): NotificationResponse {
    return {
      ntfId: entity.ntfId,
      ntfType: entity.ntfType,
      ntfTitle: entity.ntfTitle,
      ntfMessage: entity.ntfMessage,
      ntfRecipientId: entity.ntfRecipientId,
      ntfSenderId: entity.ntfSenderId,
      senderName: entity.sender?.usrName ?? undefined,
      ntfResourceType: entity.ntfResourceType,
      ntfResourceId: entity.ntfResourceId,
      ntfIsRead: entity.ntfIsRead,
      ntfReadAt: entity.ntfReadAt?.toISOString() ?? null,
      entId: entity.entId,
      ntfCreatedAt: entity.ntfCreatedAt?.toISOString(),
    };
  }

  static toResponseList(entities: NotificationEntity[]): NotificationResponse[] {
    return entities.map((e) => NotificationMapper.toResponse(e));
  }
}
