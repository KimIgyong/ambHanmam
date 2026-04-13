import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { OAuthAuthorizationCodeEntity } from '../entity/oauth-authorization-code.entity';
import { OAuthTokenEntity } from '../entity/oauth-token.entity';
import { OpenApiLogEntity } from '../entity/open-api-log.entity';
import { OAuthClientService } from './oauth-client.service';
import { PartnerAppEntity } from '../../partner-app/entity/partner-app.entity';
import { TokenResponseDto } from '../dto/token.response';
import { OAuthTokenContext } from '../interface/oauth-context.interface';
import { areValidScopes } from '../interface/oauth-scope';

const AUTH_CODE_TTL_MS = 10 * 60 * 1000; // 10분
const ACCESS_TOKEN_TTL = '1h';
const ACCESS_TOKEN_TTL_SEC = 3600;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

@Injectable()
export class OAuthService {
  private readonly jwtSecret: string;

  constructor(
    @InjectRepository(OAuthAuthorizationCodeEntity)
    private readonly codeRepo: Repository<OAuthAuthorizationCodeEntity>,
    @InjectRepository(OAuthTokenEntity)
    private readonly tokenRepo: Repository<OAuthTokenEntity>,
    @InjectRepository(OpenApiLogEntity)
    private readonly logRepo: Repository<OpenApiLogEntity>,
    private readonly clientService: OAuthClientService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET')!;
  }

  // ─── Authorization Code ─────────────────────────────────────

  /** 인가 코드 생성 */
  async createAuthorizationCode(params: {
    app: PartnerAppEntity;
    userId: string;
    entityId: string;
    scopes: string[];
    redirectUri: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
    state?: string;
  }): Promise<string> {
    const code = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_MS);

    await this.codeRepo.save({
      oacCode: code,
      papId: params.app.papId,
      usrId: params.userId,
      entId: params.entityId,
      oacScopes: params.scopes,
      oacRedirectUri: params.redirectUri,
      oacCodeChallenge: params.codeChallenge || null,
      oacCodeChallengeMethod: params.codeChallengeMethod || 'S256',
      oacState: params.state || null,
      oacExpiresAt: expiresAt,
    });

    return code;
  }

  // ─── Token Exchange ──────────────────────────────────────────

  /** authorization_code → token 교환 */
  async exchangeCode(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<TokenResponseDto> {
    // 1) 클라이언트 검증
    const app = await this.clientService.validateClient(params.clientId, params.clientSecret);

    // 2) 인가 코드 조회
    const authCode = await this.codeRepo.findOne({
      where: { oacCode: params.code },
    });
    if (!authCode) {
      throw new BadRequestException('invalid_grant');
    }

    // 3) 만료 확인
    if (authCode.oacExpiresAt < new Date()) {
      throw new BadRequestException('invalid_grant');
    }

    // 4) 이미 사용된 코드 확인
    if (authCode.oacUsedAt) {
      // 코드 재사용 → 해당 앱의 모든 토큰 폐기 (보안)
      await this.revokeAllTokensForApp(authCode.papId, authCode.usrId);
      throw new BadRequestException('invalid_grant');
    }

    // 5) 리다이렉트 URI 일치 확인
    if (authCode.oacRedirectUri !== params.redirectUri) {
      throw new BadRequestException('invalid_grant');
    }

    // 6) 앱 ID 일치 확인
    if (authCode.papId !== app.papId) {
      throw new BadRequestException('invalid_grant');
    }

    // 7) PKCE 검증
    if (authCode.oacCodeChallenge) {
      if (!params.codeVerifier) {
        throw new BadRequestException('invalid_grant');
      }
      const challenge = this.generateCodeChallenge(params.codeVerifier);
      if (!crypto.timingSafeEqual(
        Buffer.from(challenge),
        Buffer.from(authCode.oacCodeChallenge),
      )) {
        throw new BadRequestException('invalid_grant');
      }
    }

    // 8) 코드 사용 처리
    await this.codeRepo.update(authCode.oacId, { oacUsedAt: new Date() });

    // 9) 토큰 발급
    return this.issueTokenPair(
      app.papId,
      authCode.usrId!,
      authCode.entId!,
      authCode.oacScopes,
      app.papClientId!,
    );
  }

  /** refresh_token → 새 토큰 발급 */
  async refreshToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
  }): Promise<TokenResponseDto> {
    // 1) 클라이언트 검증
    const app = await this.clientService.validateClient(params.clientId, params.clientSecret);

    // 2) refresh token 해시로 검색
    const tokenHash = this.hashToken(params.refreshToken);
    const tokenRecord = await this.tokenRepo.findOne({
      where: { oatRefreshTokenHash: tokenHash },
    });
    if (!tokenRecord) {
      throw new BadRequestException('invalid_grant');
    }

    // 3) 앱 매칭 확인
    if (tokenRecord.papId !== app.papId) {
      throw new BadRequestException('invalid_grant');
    }

    // 4) 폐기 여부 확인
    if (tokenRecord.oatRevokedAt) {
      throw new BadRequestException('invalid_grant');
    }

    // 5) refresh 만료 확인
    if (tokenRecord.oatRefreshExpiresAt && tokenRecord.oatRefreshExpiresAt < new Date()) {
      throw new BadRequestException('invalid_grant');
    }

    // 6) 기존 토큰 폐기 (rotation)
    await this.tokenRepo.update(tokenRecord.oatId, { oatRevokedAt: new Date() });

    // 7) 새 토큰 발급
    return this.issueTokenPair(
      tokenRecord.papId,
      tokenRecord.usrId!,
      tokenRecord.entId!,
      tokenRecord.oatScopes,
      app.papClientId!,
    );
  }

  // ─── Token Validation ────────────────────────────────────────

  /** access_token 검증 → OAuthTokenContext */
  async validateAccessToken(accessToken: string): Promise<OAuthTokenContext> {
    // 1) JWT 검증
    let payload: any;
    try {
      payload = this.jwtService.verify(accessToken, { secret: this.jwtSecret });
    } catch {
      throw new UnauthorizedException('invalid_token');
    }

    // 2) type 확인
    if (payload.type !== 'oauth_access') {
      throw new UnauthorizedException('invalid_token');
    }

    // 3) DB에서 폐기 여부 확인
    const tokenHash = this.hashToken(accessToken);
    const tokenRecord = await this.tokenRepo.findOne({
      where: { oatAccessTokenHash: tokenHash },
    });

    if (!tokenRecord || tokenRecord.oatRevokedAt) {
      throw new UnauthorizedException('invalid_token');
    }

    return {
      userId: payload.sub,
      entityId: payload.ent,
      clientId: payload.cid,
      appId: payload.aid,
      scopes: payload.scp || [],
    };
  }

  // ─── Revocation ──────────────────────────────────────────────

  /** 토큰 폐기 (access 또는 refresh) */
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);

    // access_token_hash OR refresh_token_hash로 검색
    const record = await this.tokenRepo
      .createQueryBuilder('t')
      .where('t.oatAccessTokenHash = :hash', { hash: tokenHash })
      .orWhere('t.oatRefreshTokenHash = :hash', { hash: tokenHash })
      .getOne();

    if (record && !record.oatRevokedAt) {
      await this.tokenRepo.update(record.oatId, { oatRevokedAt: new Date() });
    }
  }

  /** 앱의 모든 토큰 폐기 */
  async revokeAllTokensForApp(appId: string, userId: string): Promise<void> {
    await this.tokenRepo
      .createQueryBuilder()
      .update()
      .set({ oatRevokedAt: new Date() })
      .where('papId = :appId', { appId })
      .andWhere('usrId = :userId', { userId })
      .andWhere('oatRevokedAt IS NULL')
      .execute();
  }

  // ─── API Logging ─────────────────────────────────────────────

  /** Open API 호출 로그 기록 */
  async logApiCall(params: {
    appId: string;
    userId: string;
    entityId: string;
    method: string;
    path: string;
    statusCode: number;
    ip: string;
    userAgent?: string;
    durationMs: number;
  }): Promise<void> {
    await this.logRepo.save({
      papId: params.appId,
      usrId: params.userId,
      entId: params.entityId,
      oalMethod: params.method,
      oalPath: params.path,
      oalStatusCode: params.statusCode,
      oalIp: params.ip,
      oalUserAgent: params.userAgent || null,
      oalDurationMs: params.durationMs,
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────

  private async issueTokenPair(
    appId: string,
    userId: string,
    entityId: string,
    scopes: string[],
    clientId: string,
  ): Promise<TokenResponseDto> {
    // Access Token (JWT)
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        ent: entityId,
        aid: appId,
        cid: clientId,
        scp: scopes,
        type: 'oauth_access',
      },
      { secret: this.jwtSecret, expiresIn: ACCESS_TOKEN_TTL },
    );

    // Refresh Token (opaque)
    const refreshToken = scopes.includes('offline_access')
      ? crypto.randomBytes(48).toString('hex')
      : undefined;

    // DB에 토큰 기록 저장
    const now = new Date();
    await this.tokenRepo.save({
      papId: appId,
      usrId: userId,
      entId: entityId,
      oatAccessTokenHash: this.hashToken(accessToken),
      oatRefreshTokenHash: refreshToken ? this.hashToken(refreshToken) : null,
      oatScopes: scopes,
      oatExpiresAt: new Date(now.getTime() + ACCESS_TOKEN_TTL_SEC * 1000),
      oatRefreshExpiresAt: refreshToken
        ? new Date(now.getTime() + REFRESH_TOKEN_TTL_MS)
        : null,
    });

    const response = new TokenResponseDto();
    response.access_token = accessToken;
    response.token_type = 'Bearer';
    response.expires_in = ACCESS_TOKEN_TTL_SEC;
    response.scope = scopes.join(' ');
    if (refreshToken) {
      response.refresh_token = refreshToken;
    }
    return response;
  }

  /** PKCE S256 code_challenge 생성 */
  private generateCodeChallenge(codeVerifier: string): string {
    return crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
  }

  /** 토큰 → SHA-256 hash (DB 저장/비교용) */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** 요청 scope와 앱 등록 scope의 교집합 반환 */
  computeGrantedScopes(
    requestedScopes: string[],
    appScopes: string[],
    installApprovedScopes?: string[],
  ): string[] {
    let granted = requestedScopes.filter((s) => appScopes.includes(s));
    if (installApprovedScopes && installApprovedScopes.length > 0) {
      granted = granted.filter((s) => installApprovedScopes.includes(s));
    }
    if (!areValidScopes(granted)) {
      throw new BadRequestException('invalid_scope');
    }
    return granted;
  }
}
