import { ProjectComponentResponse } from '@amb/types';
import { ProjectComponentEntity } from '../entity/project-component.entity';

export class ComponentMapper {
  static toResponse(entity: ProjectComponentEntity, issueCount = 0): ProjectComponentResponse {
    return {
      componentId: entity.cmpId,
      entityId: entity.entId,
      projectId: entity.pjtId,
      title: entity.cmpTitle,
      description: entity.cmpDescription || null,
      color: entity.cmpColor || null,
      ownerId: entity.cmpOwnerId || null,
      ownerName: entity.owner?.usrName || null,
      createdBy: entity.cmpCreatedBy,
      createdByName: entity.createdByUser?.usrName || '',
      issueCount,
      createdAt: entity.cmpCreatedAt.toISOString(),
      updatedAt: entity.cmpUpdatedAt.toISOString(),
    };
  }
}
