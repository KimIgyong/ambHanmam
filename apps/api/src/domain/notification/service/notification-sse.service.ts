import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationResponse } from '../mapper/notification.mapper';

export interface NotificationSseEvent {
  recipientId: string;
  notification: NotificationResponse;
}

@Injectable()
export class NotificationSseService {
  private readonly logger = new Logger(NotificationSseService.name);
  private readonly events$ = new Subject<NotificationSseEvent>();

  /**
   * 알림 이벤트 발행 (서버 → SSE)
   */
  emit(recipientId: string, notification: NotificationResponse): void {
    this.logger.debug(
      `Emitting notification to user ${recipientId}: ${notification.ntfType}`,
    );
    this.events$.next({ recipientId, notification });
  }

  /**
   * 여러 수신자에게 알림 발행
   */
  emitToMany(
    recipientIds: string[],
    notifications: NotificationResponse[],
  ): void {
    for (let i = 0; i < recipientIds.length; i++) {
      this.emit(recipientIds[i], notifications[i]);
    }
  }

  /**
   * 특정 사용자의 알림 스트림 구독
   */
  subscribe(userId: string): Observable<MessageEvent> {
    this.logger.log(`User ${userId} subscribed to notification stream`);

    return this.events$.pipe(
      filter((event) => event.recipientId === userId),
      map(
        (event) =>
          ({
            data: JSON.stringify(event.notification),
          }) as MessageEvent,
      ),
    );
  }
}
