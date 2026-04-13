import { HrEntityResponse, HrEntityUserRoleResponse } from '@amb/types';
import { HrEntityEntity } from '../entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../entity/entity-user-role.entity';

export class EntityMapper {
  static toResponse(entity: HrEntityEntity): HrEntityResponse {
    return {
      entityId: entity.entId,
      code: entity.entCode,
      name: entity.entName,
      nameEn: entity.entNameEn || null,
      country: entity.entCountry,
      currency: entity.entCurrency,
      registrationNo: entity.entRegNo || null,
      address: entity.entAddress || null,
      representative: entity.entRepresentative || null,
      payDay: entity.entPayDay,
      status: entity.entStatus,
      hasStamp: !!entity.entStampImage,
      emailDisplayName: entity.entEmailDisplayName || null,
      emailBrandColor: entity.entEmailBrandColor || null,
      emailLogoUrl: entity.entEmailLogoUrl || null,
    };
  }

  static toUserRoleResponse(entity: EntityUserRoleEntity): HrEntityUserRoleResponse {
    return {
      id: entity.eurId,
      entityId: entity.entId,
      userId: entity.usrId,
      role: entity.eurRole,
      status: entity.eurStatus,
    };
  }
}
