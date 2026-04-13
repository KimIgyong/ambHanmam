import { CmsSubscriberEntity } from '../entity/cms-subscriber.entity';

export class CmsSubscriberMapper {
  static toResponse(entity: CmsSubscriberEntity) {
    return {
      id: entity.csbId,
      pageId: entity.cmpId,
      email: entity.csbEmail,
      name: entity.csbName,
      isVerified: entity.csbIsVerified,
      subscribedAt: entity.csbSubscribedAt?.toISOString(),
      unsubscribedAt: entity.csbUnsubscribedAt?.toISOString() || null,
    };
  }
}
