import { UnitEntity } from '../entity/unit.entity';
import { UnitResponse } from '@amb/types';

export class UnitMapper {
  static toResponse(entity: UnitEntity): UnitResponse {
    return {
      unitId: entity.untId,
      entityId: entity.entId,
      name: entity.untName,
      nameLocal: entity.untNameLocal || null,
      parentId: entity.untParentId || null,
      level: entity.untLevel,
      isActive: entity.untIsActive,
      children: entity.children?.map(UnitMapper.toResponse),
      createdAt: entity.untCreatedAt?.toISOString(),
      updatedAt: entity.untUpdatedAt?.toISOString(),
    };
  }
}
