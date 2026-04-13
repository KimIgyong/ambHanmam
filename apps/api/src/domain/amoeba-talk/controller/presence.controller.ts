import { Controller, Post, Get, Query, Sse, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PresenceService } from '../service/presence.service';
import { TalkSseService } from '../service/talk-sse.service';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Lobby Chat - Presence')
@ApiBearerAuth()
@Controller('talk/presence')
export class PresenceController {
  constructor(
    private readonly presenceService: PresenceService,
    private readonly sseService: TalkSseService,
  ) {}

  @Post('heartbeat')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Presence 하트비트 전송' })
  heartbeat(@CurrentUser() user: UserPayload): void {
    this.presenceService.heartbeat(user.userId);
  }

  @Get('status')
  @ApiOperation({ summary: '사용자 온라인 상태 조회' })
  getStatus(@Query('user_ids') userIds: string) {
    const ids = userIds ? userIds.split(',').filter(Boolean) : [];
    const data = this.presenceService.getStatus(ids);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Sse('events')
  @ApiOperation({ summary: '전역 Presence SSE 스트림' })
  events(): Observable<MessageEvent> {
    return this.sseService.subscribePresence();
  }
}
