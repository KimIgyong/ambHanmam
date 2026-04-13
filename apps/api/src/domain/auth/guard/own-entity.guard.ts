import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { UserPayload } from '../../../global/decorator/current-user.decorator';

/**
 * 법인 범위 제한 가드
 * - ADMIN_LEVEL: 모든 법인 접근 가능 (바이패스)
 * - USER_LEVEL + MASTER: 자신의 법인만 접근 가능
 * - 그 외 USER_LEVEL: 거부
 */
@Injectable()
export class OwnEntityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) {
      throw new ForbiddenException('E1008');
    }

    // ADMIN_LEVEL은 모든 법인 접근 가능
    if (user.level === 'ADMIN_LEVEL') return true;

    // USER_LEVEL + MASTER만 통과
    if (user.role !== 'MASTER') {
      throw new ForbiddenException('E1013');
    }

    return true;
  }
}
