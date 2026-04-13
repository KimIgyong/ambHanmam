import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TalkSseService } from './talk-sse.service';

interface PresenceEntry {
  lastHeartbeat: Date;
  status: 'online' | 'offline';
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly presenceMap = new Map<string, PresenceEntry>();

  constructor(private readonly sseService: TalkSseService) {}

  heartbeat(userId: string): void {
    const existing = this.presenceMap.get(userId);
    const wasOffline = !existing || existing.status === 'offline';

    this.presenceMap.set(userId, {
      lastHeartbeat: new Date(),
      status: 'online',
    });

    if (wasOffline) {
      this.sseService.emitPresence(userId, 'online');
    }
  }

  getUserStatus(userId: string): 'online' | 'offline' {
    return this.presenceMap.get(userId)?.status ?? 'offline';
  }

  getStatus(userIds: string[]): Record<string, 'online' | 'offline'> {
    const result: Record<string, 'online' | 'offline'> = {};
    for (const uid of userIds) {
      result[uid] = this.getUserStatus(uid);
    }
    return result;
  }

  @Cron('*/30 * * * * *')
  checkIdleUsers(): void {
    const now = Date.now();
    const idleThreshold = 60_000; // 60초

    for (const [userId, entry] of this.presenceMap.entries()) {
      if (
        entry.status === 'online' &&
        now - entry.lastHeartbeat.getTime() > idleThreshold
      ) {
        entry.status = 'offline';
        this.sseService.emitPresence(userId, 'offline');
        this.logger.debug(`User ${userId} went offline (idle)`);
      }
    }
  }
}
