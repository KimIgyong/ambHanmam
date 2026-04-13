import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { REQUIRE_ACCESS_KEY } from '../../../global/decorator/require-access.decorator';
import { AccessControlService } from '../service/access-control.service';

const PERMISSION_LEVELS: Record<string, number> = {
  VIEW: 1,
  COMMENT: 2,
  EDIT: 3,
  ADMIN: 4,
};

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) {
      throw new ForbiddenException('Authentication required.');
    }

    // Extract work item ID from route params
    const workItemId = request.params?.id || request.params?.workItemId;
    if (!workItemId) {
      throw new ForbiddenException('Work item ID required.');
    }

    const result = await this.accessControlService.canAccess(
      user.userId,
      workItemId,
      user.role,
    );

    if (!result.allowed) {
      throw new ForbiddenException('Access denied to this work item.');
    }

    // Check permission level
    const userLevel = PERMISSION_LEVELS[result.permission || ''] || 0;
    const requiredLevel = PERMISSION_LEVELS[requiredPermission] || 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Insufficient permission. Required: ${requiredPermission}, has: ${result.permission}`,
      );
    }

    // Attach access info to request
    request.accessPermission = result.permission;
    return true;
  }
}
