import { ProjectEpicResponse } from '@amb/types';
import { ProjectEpicEntity } from '../entity/project-epic.entity';

export class EpicMapper {
  static toResponse(entity: ProjectEpicEntity, issueCount = 0, doneIssueCount = 0): ProjectEpicResponse {
    return {
      epicId: entity.epcId,
      entityId: entity.entId,
      projectId: entity.pjtId,
      title: entity.epcTitle,
      description: entity.epcDescription || null,
      status: entity.epcStatus as ProjectEpicResponse['status'],
      color: entity.epcColor || null,
      startDate: entity.epcStartDate || null,
      dueDate: entity.epcDueDate || null,
      createdBy: entity.epcCreatedBy,
      createdByName: entity.createdByUser?.usrName || '',
      issueCount,
      doneIssueCount,
      createdAt: entity.epcCreatedAt.toISOString(),
      updatedAt: entity.epcUpdatedAt.toISOString(),
    };
  }
}
