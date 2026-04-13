import { SetMetadata, applyDecorators, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { LevelRoleGuard } from '../guard/level-role.guard';

export const LEVELS_KEY = 'levels';
export const ROLES_KEY = 'roles';

/** 레벨 제한 */
export const RequireLevels = (...levels: string[]) =>
  SetMetadata(LEVELS_KEY, levels);

/** 역할 제한 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * 인증 + 상태 검증 (ACTIVE + 비밀번호 변경 완료)
 * LevelRoleGuard가 상태/비밀번호 검증 수행
 */
export const Auth = () =>
  applyDecorators(UseGuards(JwtAuthGuard, LevelRoleGuard));

/** 어드민 전용 (ADMIN_LEVEL 소속) */
export const AdminOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireLevels('ADMIN_LEVEL'),
  );

/** MASTER 이상 (MASTER + ADMIN_LEVEL) */
export const MasterOrAdmin = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireRoles('MASTER', 'ADMIN', 'SUPER_ADMIN'),
  );

/** 특정 역할 필요 */
export const RequireAuth = (...roles: string[]) =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireRoles(...roles),
  );

/** 파트너 전용 (PARTNER_LEVEL 소속) */
export const PartnerOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireLevels('PARTNER_LEVEL'),
  );

/** 파트너 어드민 전용 (PARTNER_LEVEL + PARTNER_ADMIN 역할) */
export const PartnerAdminOnly = () =>
  applyDecorators(
    UseGuards(JwtAuthGuard, LevelRoleGuard),
    RequireLevels('PARTNER_LEVEL'),
    RequireRoles('PARTNER_ADMIN'),
  );

/**
 * 비밀번호 변경 전/승인대기 상태에서도 허용
 * JwtAuthGuard만 적용 (LevelRoleGuard 미적용)
 */
export const AuthAllowPending = () =>
  applyDecorators(UseGuards(JwtAuthGuard));

/**
 * 현재 사용자 정보 추출 데코레이터
 * 기존 @CurrentUser()와 호환성 유지
 */
export const CurrentUserFromAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
