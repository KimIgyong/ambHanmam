import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';

@Injectable()
export class ManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'MASTER' && user.role !== 'MANAGER')) {
      throw new ForbiddenException(ERROR_CODE.FORBIDDEN.message);
    }

    return true;
  }
}
