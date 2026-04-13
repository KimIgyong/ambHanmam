import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { UserPayload } from '../decorator/current-user.decorator';
import { ERROR_CODE } from '../constant/error-code.constant';

const ROLE_HIERARCHY: Record<string, number> = {
  CLIENT_MEMBER: 0,
  CLIENT_ADMIN: 0,
  PARTNER_MEMBER: 0,
  PARTNER_ADMIN: 0,
  VIEWER: 1,
  MEMBER: 2,
  MANAGER: 3,
  MASTER: 4,
  ADMIN: 5,
  SUPER_ADMIN: 6,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) {
      throw new ForbiddenException(ERROR_CODE.FORBIDDEN.message);
    }

    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((r) => ROLE_HIERARCHY[r] || 0),
    );

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException(ERROR_CODE.INSUFFICIENT_ROLE.message);
    }

    return true;
  }
}
