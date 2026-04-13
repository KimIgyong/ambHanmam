import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, JwtFromRequestFunction } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { JwtPayload } from '../interface/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly udrRepository: Repository<UserUnitRoleEntity>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    const cookieExtractor: JwtFromRequestFunction = (req: Request) =>
      req?.cookies?.access_token || null;
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    // Verify user still exists in DB
    const user = await this.userRepository.findOne({
      where: { usrId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    // Verify tokenVersion to allow immediate token revocation
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.usrTokenVersion) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    // Build base payload from JWT claims (trusted, signed by server)
    const result: UserPayload = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || user.usrRole,
      level: payload.level || user.usrLevelCode,
      status: payload.status || user.usrStatus,
      companyId: payload.companyId || user.usrCompanyId || undefined,
      isHq: payload.isHq ?? false,
      mustChangePw: payload.mustChangePw ?? user.usrMustChangePw ?? false,
      // USER_LEVEL은 JWT에 entityId 포함
      entityId: payload.entityId || undefined,
      cliId: payload.cliId || user.usrCliId || undefined,
      partnerId: payload.partnerId || user.usrPartnerId || undefined,
      timezone: payload.timezone || 'Asia/Ho_Chi_Minh',
    };

    // Enrich with department role from DB (optional, may not exist)
    // CLIENT_LEVEL / PARTNER_LEVEL 사용자는 부서 역할 조회 불필요
    if (result.level !== 'CLIENT_LEVEL' && result.level !== 'PARTNER_LEVEL') {
      try {
      let primaryRole = await this.udrRepository.findOne({
        where: { usrId: user.usrId, uurIsPrimary: true, uurEndedAt: IsNull() },
        relations: ['unit'],
      });

      if (!primaryRole) {
        primaryRole = await this.udrRepository.findOne({
          where: { usrId: user.usrId, uurEndedAt: IsNull() },
          relations: ['unit'],
          order: { uurCreatedAt: 'ASC' },
        });
      }

      if (primaryRole) {
        result.departmentId = primaryRole.untId;
        result.departmentRole = primaryRole.uurRole;
        // JWT에 entityId가 없으면 부서 소속 기반으로 설정
        if (!result.entityId) {
          result.entityId = primaryRole.unit?.entId;
        }
      }
    } catch {
      // Table may not exist yet during migration; silently continue
    }
    }

    return result;
  }
}
