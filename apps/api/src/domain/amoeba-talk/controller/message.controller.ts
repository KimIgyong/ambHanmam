import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Sse, HttpCode, HttpStatus,
  UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { MessageService } from '../service/message.service';
import { MessageTranslateService } from '../service/message-translate.service';
import { TalkSseService } from '../service/talk-sse.service';
import { ChannelService } from '../service/channel.service';
import { SendMessageRequest } from '../dto/request/send-message.request';
import { UpdateMessageRequest } from '../dto/request/update-message.request';
import { ReactMessageRequest } from '../dto/request/react-message.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SLACK_OUTBOUND_EVENTS, SlackOutboundMessageEvent } from '../../slack-integration/event/slack-outbound.event';

@ApiTags('Lobby Chat - Messages')
@ApiBearerAuth()
@Controller('talk/channels/:channelId/messages')
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly messageTranslateService: MessageTranslateService,
    private readonly sseService: TalkSseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get('pinned')
  @ApiOperation({ summary: '채널의 핀된 메시지 목록' })
  async getPinnedMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageService.getPinnedMessages(channelId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':messageId/readers')
  @ApiOperation({ summary: '메시지 읽은 사람 목록' })
  async getMessageReaders(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageService.getMessageReaders(channelId, messageId, user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('search')
  @ApiOperation({ summary: '채널 내 메시지 검색' })
  async searchMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
    @Query('q') query: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messageService.searchMessages(
      channelId,
      user.userId,
      query,
      cursor,
      limit ? parseInt(limit, 10) : 20,
    );
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get()
  @ApiOperation({ summary: '메시지 목록 조회 (커서 기반 페이지네이션)' })
  async getMessages(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.messageService.getMessages(
      channelId,
      user.userId,
      cursor,
      limit ? parseInt(limit, 10) : 50,
    );
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({ summary: '메시지 전송 (파일 첨부 지원)' })
  async sendMessage(
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageRequest,
    @CurrentUser() user: UserPayload,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const data = await this.messageService.sendMessage(channelId, dto, user.userId, files);

    this.sseService.emit({
      channelId,
      type: 'message:new',
      data,
    });

    // Slack outbound event (fire-and-forget via EventEmitter2)
    this.eventEmitter.emit(SLACK_OUTBOUND_EVENTS.MESSAGE_CREATED, {
      channelId,
      messageId: data.id,
      content: data.content,
      senderName: data.senderName,
      parentId: data.parentMessage?.id,
    } as SlackOutboundMessageEvent);

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':messageId')
  @ApiOperation({ summary: '메시지 수정' })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateMessageRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageService.updateMessage(messageId, dto, user.userId);

    this.sseService.emit({
      channelId,
      type: 'message:update',
      data,
    });

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '메시지 삭제 (모두에게)' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.messageService.deleteMessage(messageId, user.userId);

    this.sseService.emit({
      channelId,
      type: 'message:delete',
      data: { messageId },
    });
  }

  @Post(':messageId/hide')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '메시지 숨기기 (나만)' })
  async hideMessage(
    @Param('messageId') messageId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
  ) {
    await this.messageService.hideMessage(messageId, user.userId);
  }

  @Post(':messageId/react')
  @ApiOperation({ summary: '메시지 리액션 토글 (Like/Good Job/Sad)' })
  async reactMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ReactMessageRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageService.toggleReaction(messageId, dto.type, user.userId);

    this.sseService.emit({
      channelId,
      type: 'message:reaction',
      data: { messageId, reactions: data },
    });

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':messageId/pin')
  @ApiOperation({ summary: '메시지 핀 토글 (고정/해제)' })
  async toggleMessagePin(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageService.toggleMessagePin(channelId, messageId, user.userId);

    this.sseService.emit({
      channelId,
      type: 'message:pin',
      data,
    });

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':messageId/translate')
  @ApiOperation({ summary: 'AI 메시지 번역' })
  async translateMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body('target_lang') targetLang: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageTranslateService.translateMessage(
      channelId,
      messageId,
      targetLang,
      user.userId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':messageId/translate-and-post')
  @ApiOperation({ summary: '번역 후 대화에 기록 (타인 메시지 번역)' })
  async translateAndPost(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body('target_lang') targetLang: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageTranslateService.translateAndPost(
      channelId,
      messageId,
      targetLang,
      user.userId,
    );

    this.sseService.emit({
      channelId,
      type: 'message:new',
      data,
    });

    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':messageId/translations')
  @ApiOperation({ summary: '메시지 번역 목록 조회' })
  async getTranslations(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.messageTranslateService.getTranslations(
      channelId,
      messageId,
      user.userId,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('typing')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '타이핑 인디케이터 전송' })
  async typing(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
  ) {
    this.sseService.emit({
      channelId,
      type: 'typing',
      data: { userId: user.userId, userName: (user as any).name || 'Unknown' },
    });
  }
}

@ApiTags('Lobby Chat - SSE')
@ApiBearerAuth()
@Controller('talk/channels/:channelId')
export class TalkSseController {
  constructor(
    private readonly sseService: TalkSseService,
    private readonly channelService: ChannelService,
  ) {}

  @Sse('events')
  @ApiOperation({ summary: '채널 실시간 이벤트 스트림 (SSE)' })
  async sse(
    @Param('channelId') channelId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<Observable<MessageEvent>> {
    await this.channelService.assertChannelMember(channelId, user.userId);
    return this.sseService.subscribe(channelId);
  }
}
