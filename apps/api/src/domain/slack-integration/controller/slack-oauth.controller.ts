import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SlackOAuthService } from '../service/slack-oauth.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { Public } from '../../../global/decorator/public.decorator';

@ApiTags('Slack Integration - OAuth')
@Controller('slack/oauth')
export class SlackOAuthController {
  private readonly logger = new Logger(SlackOAuthController.name);

  constructor(
    private readonly oauthService: SlackOAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('install')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slack OAuth 설치 시작 → Slack authorize URL로 redirect' })
  async install(
    @CurrentUser() user: UserPayload,
    @Query('entity_id') entityId: string,
    @Res() res: Response,
  ) {
    const entId = entityId || user.entityId!;
    const clientId = await this.oauthService.getSlackKey('SLACK_CLIENT_ID', entId);
    if (!clientId) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      return res.redirect(`${frontendUrl}/entity-settings/slack-integration?error=${encodeURIComponent('Slack App is not configured. Please set Client ID in Slack settings.')}`);
    }
    const url = await this.oauthService.getInstallUrl(entId, user.userId);
    res.redirect(url);
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Slack OAuth 콜백 (Slack에서 redirect)' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.oauthService.handleCallback(code, state);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      res.redirect(`${frontendUrl}/entity-settings/slack-integration?connected=true&team=${encodeURIComponent(result.teamName)}`);
    } catch (error) {
      this.logger.error(`Slack OAuth callback failed: ${error.message}`);
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      res.redirect(`${frontendUrl}/entity-settings/slack-integration?error=${encodeURIComponent(error.message)}`);
    }
  }
}
