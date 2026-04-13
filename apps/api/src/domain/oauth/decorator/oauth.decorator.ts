import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OAuthTokenContext } from '../interface/oauth-context.interface';

/** 필요한 OAuth Scope를 메타데이터에 설정 */
export const OAUTH_SCOPES_KEY = 'oauth_required_scopes';
export const RequireScope = (...scopes: string[]) =>
  SetMetadata(OAUTH_SCOPES_KEY, scopes);

/** Request에서 OAuthTokenContext 추출 */
export const OAuthContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OAuthTokenContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.oauthContext;
  },
);
