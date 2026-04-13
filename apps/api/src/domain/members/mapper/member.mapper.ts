import { UserEntity } from '../../auth/entity/user.entity';

export class MemberMapper {
  static toResponse(
    entity: UserEntity,
    cells: { cellId: string; name: string }[] = [],
  ) {
    return {
      userId: entity.usrId,
      email: entity.usrEmail,
      name: entity.usrName,
      unit: entity.usrUnit,
      role: entity.usrRole,
      levelCode: entity.usrLevelCode || 'USER_LEVEL',
      status: entity.usrStatus,
      cells,
      createdAt: entity.usrCreatedAt.toISOString(),
      failedLoginCount: entity.usrFailedLoginCount ?? 0,
      lockedUntil: entity.usrLockedUntil ? entity.usrLockedUntil.toISOString() : null,
    };
  }

  static toDetailResponse(
    entity: UserEntity,
    cells: { cellId: string; name: string }[] = [],
    entityRoles: {
      eurId: string;
      entityId: string;
      entityCode: string;
      entityName: string;
      role: string;
      status: string;
    }[] = [],
    unitRoles: {
      uurId: string;
      unitId: string;
      unitName: string;
      role: string;
      isPrimary: boolean;
      entityCode: string;
      entityName: string;
    }[] = [],
    hrEmployees: {
      employeeId: string;
      entityCode: string;
      employeeCode: string;
      fullName: string;
      department: string;
      position: string;
      status: string;
    }[] = [],
    memberCells: {
      cellId: string;
      name: string;
      entityCode: string | null;
      entityName: string | null;
    }[] = [],
  ) {
    return {
      ...this.toResponse(entity, cells),
      companyEmail: entity.usrCompanyEmail || null,
      jobTitle: entity.usrJobTitle || null,
      memberCells,
      entityRoles,
      unitRoles,
      hrEmployees,
    };
  }
}
