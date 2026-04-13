import { CellEntity } from '../entity/cell.entity';
import { CellMemberSummary } from '@amb/types';

export class CellMapper {
  static toResponse(
    entity: CellEntity,
    memberCount: number = 0,
    members: CellMemberSummary[] = [],
  ) {
    return {
      cellId: entity.celId,
      name: entity.celName,
      description: entity.celDescription,
      entityId: entity.entId || null,
      entityCode: entity.hrEntity?.entCode || null,
      entityName: entity.hrEntity?.entName || null,
      memberCount,
      members,
      createdAt: entity.celCreatedAt.toISOString(),
      updatedAt: entity.celUpdatedAt.toISOString(),
    };
  }
}
