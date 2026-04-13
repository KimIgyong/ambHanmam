import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationService } from '../service/notification.service';
import { NotificationSseService } from '../service/notification-sse.service';
import { GetNotificationsRequest } from '../dto/request/get-notifications.request';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), EntityGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationSseService: NotificationSseService,
  ) {}

  @Get()
  @ApiOperation({ summary: '알림 목록 조회' })
  async getNotifications(
    @CurrentUser() user: UserPayload,
    @Query() query: GetNotificationsRequest,
    @Req() req: any,
  ) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;

    return this.notificationService.findByRecipient(
      user.userId,
      req.entityId,
      {
        page,
        limit,
        isRead: query.is_read !== undefined ? query.is_read === 'true' : undefined,
        resourceType: query.resource_type,
      },
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: '미읽음 알림 수' })
  async getUnreadCount(@CurrentUser() user: UserPayload, @Req() req: any) {
    const count = await this.notificationService.getUnreadCount(
      user.userId,
      req.entityId,
    );
    return { count };
  }

  @Sse('stream')
  @ApiOperation({ summary: '실시간 알림 스트림 (SSE)' })
  stream(@CurrentUser() user: UserPayload): Observable<MessageEvent> {
    return this.notificationSseService.subscribe(user.userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  async markAsRead(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
  ) {
    await this.notificationService.markAsRead(id, user.userId);
    return { success: true };
  }

  @Patch('read-all')
  @ApiOperation({ summary: '전체 알림 읽음 처리' })
  async markAllAsRead(@CurrentUser() user: UserPayload, @Req() req: any) {
    await this.notificationService.markAllAsRead(
      user.userId,
      req.entityId,
    );
    return { success: true };
  }
}
