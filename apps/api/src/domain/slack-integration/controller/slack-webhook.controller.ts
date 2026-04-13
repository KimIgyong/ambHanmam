import { Controller, Post, Req, Body, HttpCode, Logger, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../../global/decorator/public.decorator';
import { SlackEventService } from '../service/slack-event.service';

@ApiTags('Slack Integration - Webhook')
@Controller('webhooks/slack')
export class SlackWebhookController {
  private readonly logger = new Logger(SlackWebhookController.name);

  constructor(private readonly slackEventService: SlackEventService) {}

  @Public()
  @Post('events')
  @HttpCode(200)
  @ApiOperation({ summary: 'Slack Events API 수신 엔드포인트' })
  async handleEvents(@Req() req: Request, @Body() body: any) {
    // 1. URL Verification (Slack이 최초 등록 시 보내는 challenge)
    if (body.type === 'url_verification') {
      return { challenge: body.challenge };
    }

    // 2. 서명 검증
    try {
      this.slackEventService.verifySignature(req);
    } catch (error) {
      this.logger.warn(`Slack signature verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Slack signature');
    }

    // 3. 비동기 처리 (즉시 200 응답, Slack 3초 타임아웃 준수)
    this.slackEventService.processEvent(body).catch((err) => {
      this.logger.error(`Slack event processing failed: ${err.message}`, err.stack);
    });

    return { ok: true };
  }
}
