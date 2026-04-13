import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPayload } from '../decorator/current-user.decorator';
import { ERROR_CODE } from '../constant/error-code.constant';

/**
 * ADMIN_LEVEL 소속 사용자만 접근 허용하는 가드.
 * EntityGuard 이후에 적용하여 level 검증을 수행한다.
 */
@Injectable()
export class AdminLevelGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user || user.level !== 'ADMIN_LEVEL') {
      throw new ForbiddenException(ERROR_CODE.INSUFFICIENT_ROLE.message);
    }

    return true;
  }
}
