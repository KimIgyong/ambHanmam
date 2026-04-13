import { Injectable } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';

interface TalkEvent {
  channelId: string;
  type: 'message:new' | 'message:update' | 'message:delete' | 'message:reaction' | 'message:pin' | 'channel:read' | 'channel:archive' | 'channel:unarchive' | 'member:join' | 'member:leave' | 'typing';
  data: unknown;
}

interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline';
}

@Injectable()
export class TalkSseService {
  private readonly events$ = new Subject<TalkEvent>();
  private readonly presence$ = new Subject<PresenceEvent>();

  emit(event: TalkEvent): void {
    this.events$.next(event);
  }

  subscribe(channelId: string): Observable<MessageEvent> {
    return this.events$.pipe(
      filter((e) => e.channelId === channelId),
      map(
        (e) =>
          ({
            data: JSON.stringify({ type: e.type, data: e.data }),
          }) as MessageEvent,
      ),
    );
  }

  emitPresence(userId: string, status: 'online' | 'offline'): void {
    this.presence$.next({ userId, status });
  }

  subscribePresence(): Observable<MessageEvent> {
    return this.presence$.pipe(
      map(
        (e) =>
          ({
            data: JSON.stringify({ type: 'presence:update', data: e }),
          }) as MessageEvent,
      ),
    );
  }
}
