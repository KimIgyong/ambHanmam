import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserPayload } from '../decorator/current-user.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user || user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException({
        errorCode: 'E1006',
        message: 'SUPER_ADMIN role required',
      });
    }

    return true;
  }
}
