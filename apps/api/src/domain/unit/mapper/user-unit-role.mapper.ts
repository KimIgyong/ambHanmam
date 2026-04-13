import { UserUnitRoleEntity } from '../entity/user-unit-role.entity';
import { UserUnitRoleResponse, UnitRole } from '@amb/types';

export class UserUnitRoleMapper {
  static toResponse(entity: UserUnitRoleEntity): UserUnitRoleResponse {
    return {
      id: entity.uurId,
      userId: entity.usrId,
      userName: entity.user?.usrName || '',
      userEmail: entity.user?.usrEmail || '',
      unitId: entity.untId,
      unitName: entity.unit?.untName || '',
      role: entity.uurRole as UnitRole,
      isPrimary: entity.uurIsPrimary,
      startedAt: entity.uurStartedAt?.toISOString?.() || new Date().toISOString(),
      endedAt: entity.uurEndedAt?.toISOString?.() || null,
    };
  }
}
