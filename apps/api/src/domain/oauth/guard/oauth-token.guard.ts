import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from '../service/oauth.service';

/**
 * OAuth Bearer Token 가드
 * - Authorization: Bearer {token} 헤더에서 토큰 추출
 * - 검증 성공 시 request.oauthContext에 OAuthTokenContext 주입
 */
@Injectable()
export class OAuthTokenGuard implements CanActivate {
  constructor(private readonly oauthService: OAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('missing_token');
    }
    const token = authHeader.slice(7);
    const oauthContext = await this.oauthService.validateAccessToken(token);
    request.oauthContext = oauthContext;
    return true;
  }
}
