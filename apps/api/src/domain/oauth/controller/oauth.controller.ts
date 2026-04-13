import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Auth } from '../../auth/decorator/auth.decorator';
import { CurrentUser } from '../../../global/decorator/current-user.decorator';
import { Public } from '../../../global/decorator/public.decorator';
import { OAuthService } from '../service/oauth.service';
import { OAuthClientService } from '../service/oauth-client.service';
import { AuthorizeRequestDto } from '../dto/authorize.request';
import { ConsentRequestDto } from '../dto/consent.request';
import { TokenRequestDto } from '../dto/token.request';
import { isValidScope } from '../interface/oauth-scope';

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly clientService: OAuthClientService,
  ) {}

  /**
   * GET /api/v1/oauth/authorize
   * 인가 요청 → 동의 페이지에 필요한 정보 반환
   * 로그인된 사용자만 접근 가능
   */
  @Get('authorize')
  @Auth()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async authorize(
    @Query() dto: AuthorizeRequestDto,
    @CurrentUser() user: any,
  ) {
    // 1) 클라이언트 검증
    const app = await this.clientService.validateClientById(dto.client_id);

    // 2) redirect_uri 검증
    if (!this.clientService.validateRedirectUri(app, dto.redirect_uri)) {
      throw new BadRequestException('invalid_redirect_uri');
    }

    // 3) response_type 확인
    if (dto.response_type !== 'code') {
      throw new BadRequestException('unsupported_response_type');
    }

    // 4) scope 파싱/검증
    const requestedScopes = dto.scope ? dto.scope.split(' ').filter(Boolean) : [];
    for (const s of requestedScopes) {
      if (!isValidScope(s)) {
        throw new BadRequestException(`invalid_scope: ${s}`);
      }
    }

    // 5) 설치 여부 확인
    const install = await this.clientService.findInstall(app.papId, user.entityId);

    // 6) 사용 가능한 scope 계산
    const grantableScopes = this.oauthService.computeGrantedScopes(
      requestedScopes,
      app.papScopes,
      install?.paiApprovedScopes,
    );

    return {
      success: true,
      data: {
        app: {
          id: app.papId,
          name: app.papName,
          icon: app.papIcon,
          description: app.papDescription,
        },
        requestedScopes,
        grantableScopes,
        state: dto.state || null,
        installed: !!install,
      },
    };
  }

  /**
   * POST /api/v1/oauth/authorize/consent
   * 사용자 동의 → 인가 코드 발급 → redirect_uri로 리다이렉트
   */
  @Post('authorize/consent')
  @Auth()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async consent(
    @Body() dto: ConsentRequestDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    // 1) 클라이언트 검증
    const app = await this.clientService.validateClientById(dto.client_id);

    // 2) redirect_uri 검증
    if (!this.clientService.validateRedirectUri(app, dto.redirect_uri)) {
      throw new BadRequestException('invalid_redirect_uri');
    }

    // 3) scope 파싱/검증
    const approvedScopes = dto.scope ? dto.scope.split(' ').filter(Boolean) : [];
    const grantedScopes = this.oauthService.computeGrantedScopes(
      approvedScopes,
      app.papScopes,
    );

    // 4) 인가 코드 생성
    const code = await this.oauthService.createAuthorizationCode({
      app,
      userId: user.userId,
      entityId: user.entityId,
      scopes: grantedScopes,
      redirectUri: dto.redirect_uri,
      codeChallenge: dto.code_challenge,
      codeChallengeMethod: dto.code_challenge_method,
      state: dto.state,
    });

    // 5) redirect_uri로 리다이렉트 (query: code, state)
    const redirectUrl = new URL(dto.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (dto.state) {
      redirectUrl.searchParams.set('state', dto.state);
    }

    return res.json({
      success: true,
      data: {
        redirect_uri: redirectUrl.toString(),
        code,
        state: dto.state || null,
      },
    });
  }

  /**
   * POST /api/v1/oauth/token
   * 토큰 교환 (Public - client_secret로 인증)
   * grant_type: authorization_code | refresh_token
   */
  @Post('token')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async token(@Body() dto: TokenRequestDto) {
    if (dto.grant_type === 'authorization_code') {
      if (!dto.code || !dto.client_id || !dto.client_secret || !dto.redirect_uri) {
        throw new BadRequestException('invalid_request');
      }
      const result = await this.oauthService.exchangeCode({
        code: dto.code,
        clientId: dto.client_id,
        clientSecret: dto.client_secret,
        redirectUri: dto.redirect_uri,
        codeVerifier: dto.code_verifier,
      });
      return { success: true, data: result };
    }

    if (dto.grant_type === 'refresh_token') {
      if (!dto.refresh_token || !dto.client_id || !dto.client_secret) {
        throw new BadRequestException('invalid_request');
      }
      const result = await this.oauthService.refreshToken({
        refreshToken: dto.refresh_token,
        clientId: dto.client_id,
        clientSecret: dto.client_secret,
      });
      return { success: true, data: result };
    }

    throw new BadRequestException('unsupported_grant_type');
  }

  /**
   * POST /api/v1/oauth/revoke
   * 토큰 폐기 (Public - RFC 7009)
   */
  @Post('revoke')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async revoke(@Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('invalid_request');
    }
    await this.oauthService.revokeToken(token);
    return { success: true };
  }

  /**
   * GET /api/v1/oauth/userinfo
   * OAuth 토큰으로 사용자 정보 조회
   */
  @Get('userinfo')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async userinfo(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new BadRequestException('invalid_token');
    }
    const token = authHeader.slice(7);
    const ctx = await this.oauthService.validateAccessToken(token);

    return {
      success: true,
      data: {
        sub: ctx.userId,
        entity_id: ctx.entityId,
        client_id: ctx.clientId,
        scopes: ctx.scopes,
      },
    };
  }
}
