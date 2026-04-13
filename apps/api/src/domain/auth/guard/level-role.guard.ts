import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LEVELS_KEY, ROLES_KEY } from '../decorator/auth.decorator';

/**
 * 레벨/역할 기반 접근 제어 가드
 * - JwtAuthGuard 이후에 적용
 * - PENDING/SUSPENDED/INACTIVE 상태 차단
 * - 비밀번호 변경 필요 사용자 차단
 * - 필요 레벨/역할 메타데이터 기반 필터링
 */
@Injectable()
export class LevelRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevels = this.reflector.getAllAndOverride<string[]>(LEVELS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 레벨/역할 제한이 없으면 상태 검증만 수행
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('E1008');

    // ACTIVE가 아닌 경우 차단 (PENDING 포함)
    if (user.status === 'WITHDRAWN') {
      throw new ForbiddenException('E1002');
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('E1003');
    }
    if (user.status === 'INACTIVE') {
      throw new ForbiddenException('E1004');
    }
    if (user.status === 'PENDING') {
      throw new ForbiddenException('E1010');
    }

    // 비밀번호 변경 필요 사용자 차단
    if (user.mustChangePw) {
      throw new ForbiddenException('E1011');
    }

    if (!requiredLevels && !requiredRoles) return true;

    // 레벨 검증
    if (requiredLevels && !requiredLevels.includes(user.level)) {
      throw new ForbiddenException('E1012');
    }

    // 역할 검증
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('E1013');
    }

    return true;
  }
}
