import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationService } from '../../notification/service/notification.service';
import { NotificationSseService } from '../../notification/service/notification-sse.service';
import { ClientGuard } from '../guard/client.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Client Notifications')
@ApiBearerAuth()
@UseGuards(ClientGuard)
@Controller('client/notifications')
export class ClientNotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationSseService: NotificationSseService,
  ) {}

  @Get()
  @ApiOperation({ summary: '클라이언트 알림 목록' })
  async getNotifications(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_read') isRead?: string,
  ) {
    const result = await this.notificationService.findByRecipient(
      user.userId,
      user.entityId!,
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
      },
    );
    return { success: true, data: result, timestamp: new Date().toISOString() };
  }

  @Get('unread-count')
  @ApiOperation({ summary: '클라이언트 미읽음 알림 수' })
  async getUnreadCount(@CurrentUser() user: UserPayload) {
    const count = await this.notificationService.getUnreadCount(
      user.userId,
      user.entityId!,
    );
    return { success: true, data: { count }, timestamp: new Date().toISOString() };
  }

  @Sse('stream')
  @ApiOperation({ summary: '클라이언트 실시간 알림 스트림 (SSE)' })
  stream(@CurrentUser() user: UserPayload): Observable<MessageEvent> {
    return this.notificationSseService.subscribe(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '클라이언트 알림 읽음 처리' })
  async markAsRead(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    await this.notificationService.markAsRead(id, user.userId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Patch('read-all')
  @ApiOperation({ summary: '클라이언트 전체 알림 읽음 처리' })
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    await this.notificationService.markAllAsRead(
      user.userId,
      user.entityId!,
    );
    return { success: true, timestamp: new Date().toISOString() };
  }
}
