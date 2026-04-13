import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, Inject, forwardRef, Logger,
} from '@nestjs/common';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityService } from '../service/entity.service';

@Injectable()
export class EntityGuard implements CanActivate {
  private readonly logger = new Logger(EntityGuard.name);

  constructor(
    @Inject(forwardRef(() => EntityService))
    private readonly entityService: EntityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) {
      this.logger.warn(`[EntityGuard] No user on request: ${request.method} ${request.url}`);
      throw new ForbiddenException('Authentication required.');
    }

    // ADMIN group users bypass entity guard — they can access all entities
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      const entityId = this.extractEntityId(request);
      if (entityId) {
        request.entityId = entityId;
        request.entityRole = 'SYSTEM_ADMIN';
      }
      return true;
    }

    const entityId = this.extractEntityId(request);
    if (!entityId) {
      this.logger.warn(
        `[EntityGuard] Missing X-Entity-Id: ${request.method} ${request.url} | user=${user.email}(${user.role})`,
      );
      throw new ForbiddenException('Entity context required. Set X-Entity-Id header.');
    }

    const role = await this.entityService.getUserEntityRole(user.userId, entityId);
    if (!role) {
      this.logger.warn(
        `[EntityGuard] No role for entity: ${request.method} ${request.url} | user=${user.email} entityId=${entityId}`,
      );
      throw new ForbiddenException('No access to this entity.');
    }

    request.entityId = entityId;
    request.entityRole = role.eurRole;
    return true;
  }

  private extractEntityId(request: any): string | null {
    return (
      request.headers['x-entity-id'] ||
      request.query?.entityId ||
      null
    );
  }
}
