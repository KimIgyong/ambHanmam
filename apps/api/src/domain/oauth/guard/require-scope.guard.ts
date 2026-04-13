import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OAUTH_SCOPES_KEY } from '../decorator/oauth.decorator';
import { OAuthTokenContext } from '../interface/oauth-context.interface';

/**
 * OAuth Scope 검증 가드
 * - @RequireScope('assets:read') 등으로 지정한 scope와 토큰 scope 비교
 * - OAuthTokenGuard 이후에 실행되어야 함
 */
@Injectable()
export class RequireScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      OAUTH_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes || requiredScopes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const oauthContext: OAuthTokenContext = request.oauthContext;
    if (!oauthContext) {
      throw new ForbiddenException('insufficient_scope');
    }

    const hasScope = requiredScopes.every((scope) =>
      oauthContext.scopes.includes(scope),
    );
    if (!hasScope) {
      throw new ForbiddenException('insufficient_scope');
    }

    return true;
  }
}
