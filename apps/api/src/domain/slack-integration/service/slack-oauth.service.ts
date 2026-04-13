import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { SlackApiService } from './slack-api.service';
import { SlackWorkspaceConfigEntity } from '../entity/slack-workspace-config.entity';
import { CryptoService } from '../../settings/service/crypto.service';
import { ApiKeyService } from '../../settings/service/api-key.service';

@Injectable()
export class SlackOAuthService {
  private readonly logger = new Logger(SlackOAuthService.name);

  constructor(
    @InjectRepository(SlackWorkspaceConfigEntity)
    private readonly workspaceRepo: Repository<SlackWorkspaceConfigEntity>,
    private readonly slackApi: SlackApiService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async getInstallUrl(entityId: string, userId: string): Promise<string> {
    const state = this.jwtService.sign(
      { entityId, userId },
      { expiresIn: '10m' },
    );
    const clientId = await this.getSlackKey('SLACK_CLIENT_ID', entityId);
    const redirectUri = this.configService.get<string>('SLACK_OAUTH_REDIRECT_URI', '');
    const scopes = 'channels:history,channels:read,channels:join,chat:write,users:read,users:read.email';

    return `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
  }

  async handleCallback(code: string, state: string): Promise<{ teamName: string }> {
    // Verify state JWT
    const payload = this.jwtService.verify(state);
    const { entityId, userId } = payload;

    // Exchange code for bot token (DB 키 사용)
    const redirectUri = this.configService.get<string>('SLACK_OAUTH_REDIRECT_URI', '');
    const clientId = await this.getSlackKey('SLACK_CLIENT_ID', entityId);
    const clientSecret = await this.getSlackKey('SLACK_CLIENT_SECRET', entityId);
    const result = await this.slackApi.oauthAccess(code, redirectUri, clientId, clientSecret);

    if (!result.ok) {
      throw new Error(`Slack OAuth failed: ${result.error}`);
    }

    // Check duplicate workspace connection
    const existing = await this.workspaceRepo.findOne({
      where: { entId: entityId, swcTeamId: result.team.id, swcDeletedAt: IsNull() },
    });
    if (existing) {
      // Update existing connection
      const tokenEnc = this.cryptoService.encrypt(result.access_token);
      existing.swcBotTokenEnc = tokenEnc.encrypted;
      existing.swcBotTokenIv = tokenEnc.iv;
      existing.swcBotTokenTag = tokenEnc.tag;
      existing.swcBotUserId = result.bot_user_id;
      existing.swcTeamName = result.team.name;
      existing.swcIsActive = true;
      existing.swcConnectedAt = new Date();
      existing.swcConnectedBy = userId;
      await this.workspaceRepo.save(existing);
      return { teamName: result.team.name };
    }

    // Encrypt bot token
    const tokenEnc = this.cryptoService.encrypt(result.access_token);

    // Encrypt signing secret (stored per-workspace for multi-app support)
    const signingSecret = await this.getSlackKey('SLACK_SIGNING_SECRET', entityId);
    const signingEnc = this.cryptoService.encrypt(signingSecret);

    // Save workspace config
    await this.workspaceRepo.save({
      entId: entityId,
      swcTeamId: result.team.id,
      swcTeamName: result.team.name,
      swcBotTokenEnc: tokenEnc.encrypted,
      swcBotTokenIv: tokenEnc.iv,
      swcBotTokenTag: tokenEnc.tag,
      swcBotUserId: result.bot_user_id,
      swcAppId: result.app_id || null,
      swcSigningSecretEnc: signingEnc.encrypted,
      swcSigningSecretIv: signingEnc.iv,
      swcSigningSecretTag: signingEnc.tag,
      swcIsActive: true,
      swcConnectedAt: new Date(),
      swcConnectedBy: userId,
    });

    this.logger.log(`Slack workspace connected: ${result.team.name} (${result.team.id}) for entity ${entityId}`);
    return { teamName: result.team.name };
  }

  /** DB api_keys → 환경변수 fallback 순으로 Slack 키 조회 */
  async getSlackKey(provider: string, entityId?: string): Promise<string> {
    const dbKey = await this.apiKeyService.getDecryptedKey(provider, entityId);
    if (dbKey) return dbKey;
    // 환경변수 fallback
    return this.configService.get<string>(provider, '');
  }
}
