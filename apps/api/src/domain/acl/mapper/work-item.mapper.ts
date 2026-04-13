import { WorkItemEntity } from '../entity/work-item.entity';
import { WorkItemResponse, WorkItemType, WorkItemVisibility } from '@amb/types';

export class WorkItemMapper {
  static toResponse(entity: WorkItemEntity): WorkItemResponse {
    return {
      workItemId: entity.witId,
      entityId: entity.entId,
      type: entity.witType as WorkItemType,
      title: entity.witTitle,
      ownerId: entity.witOwnerId,
      ownerName: entity.owner?.usrName || '',
      visibility: entity.witVisibility as WorkItemVisibility,
      module: entity.witModule || null,
      refId: entity.witRefId || null,
      createdAt: entity.witCreatedAt?.toISOString(),
      updatedAt: entity.witUpdatedAt?.toISOString(),
    };
  }
}
