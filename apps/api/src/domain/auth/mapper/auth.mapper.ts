import { UserEntity } from '../entity/user.entity';
import { UserResponse } from '../dto/response/auth.response';

export class AuthMapper {
  static toUserResponse(entity: UserEntity): UserResponse {
    return {
      userId: entity.usrId,
      email: entity.usrEmail,
      name: entity.usrName,
      unit: entity.usrUnit,
      role: entity.usrRole,
      companyEmail: entity.usrCompanyEmail || null,
      level: entity.usrLevelCode || 'USER_LEVEL',
      status: entity.usrStatus || 'ACTIVE',
      companyId: entity.usrCompanyId || undefined,
      isHq: entity.company?.entIsHq ?? false,
      mustChangePw: entity.usrMustChangePw ?? false,
      hasSignature: !!entity.usrSignatureImage,
      timezone: entity.usrTimezone || 'Asia/Ho_Chi_Minh',
      locale: entity.usrLocale || 'vi',
      createdAt: entity.usrCreatedAt.toISOString(),
    };
  }
}
