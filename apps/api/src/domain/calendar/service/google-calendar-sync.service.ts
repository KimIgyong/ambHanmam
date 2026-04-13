import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarEntity } from '../entity/calendar.entity';

/**
 * Google Calendar Sync Service (FR-SCH-050~054)
 * MVP: 내부 → Google 단방향 동기화
 *
 * Phase 1 구현: 서비스 뼈대 + 상태 관리
 * Phase 2 (추후): 실제 Google Calendar API 연동
 */
@Injectable()
export class GoogleCalendarSyncService {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);
  private static readonly MAX_RETRY = 3;

  constructor(
    @InjectRepository(CalendarEntity)
    private readonly calendarRepo: Repository<CalendarEntity>,
  ) {}

  /**
   * Google 계정 연결 (FR-SCH-050)
   * OAuth 2.0 토큰 저장
   */
  async connectGoogle(userId: string, _authCode: string) {
    // TODO: Google OAuth 2.0 token exchange
    // TODO: 토큰을 사용자별로 안전하게 저장
    this.logger.log(`[GoogleSync] User ${userId} Google account connection requested`);
    return {
      connected: false,
      message: 'Google Calendar integration is not yet configured. Will be available in Phase 4.',
    };
  }

  /**
   * Google 계정 연결 해제
   */
  async disconnectGoogle(userId: string) {
    // TODO: 토큰 삭제 및 상태 업데이트
    this.logger.log(`[GoogleSync] User ${userId} Google account disconnection requested`);

    // 해당 사용자의 모든 일정 sync_status를 DISCONNECTED로 변경
    await this.calendarRepo
      .createQueryBuilder()
      .update()
      .set({ calSyncStatus: 'DISCONNECTED' })
      .where('usrId = :userId', { userId })
      .andWhere("calSyncStatus != 'NOT_SYNCED'")
      .execute();

    return { disconnected: true };
  }

  /**
   * 일정 → Google Calendar 동기화 (FR-SCH-051)
   * 생성/수정 시 호출
   */
  async pushToGoogle(calendar: CalendarEntity): Promise<void> {
    if (!this.isGoogleConnected(calendar.usrId)) {
      return; // Google 미연결 시 무시
    }

    this.logger.log(`[GoogleSync] Pushing calendar ${calendar.calId} to Google Calendar`);

    let retryCount = 0;
    while (retryCount < GoogleCalendarSyncService.MAX_RETRY) {
      try {
        // TODO: 실제 Google Calendar API 호출
        // const event = await this.googleCalendarApi.events.insert({...});
        // calendar.calGoogleEventId = event.id;
        calendar.calSyncStatus = 'SYNCED';
        calendar.calSyncAt = new Date();
        await this.calendarRepo.save(calendar);
        return;
      } catch (error) {
        retryCount++;
        this.logger.warn(
          `[GoogleSync] Retry ${retryCount}/${GoogleCalendarSyncService.MAX_RETRY} for calendar ${calendar.calId}`,
        );
        // Exponential backoff
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    // All retries failed (FR-SCH-054)
    calendar.calSyncStatus = 'SYNC_FAILED';
    await this.calendarRepo.save(calendar);
    this.logger.error(`[GoogleSync] Failed to sync calendar ${calendar.calId} after ${GoogleCalendarSyncService.MAX_RETRY} retries`);
  }

  /**
   * Google Calendar 이벤트 삭제 (FR-SCH-052)
   */
  async deleteFromGoogle(calendar: CalendarEntity): Promise<void> {
    if (!calendar.calGoogleEventId) return;

    this.logger.log(`[GoogleSync] Deleting Google event ${calendar.calGoogleEventId}`);

    try {
      // TODO: 실제 Google Calendar API 호출
      // await this.googleCalendarApi.events.delete({eventId: calendar.calGoogleEventId});
      calendar.calGoogleEventId = null;
      calendar.calSyncStatus = 'NOT_SYNCED';
      calendar.calSyncAt = null;
      await this.calendarRepo.save(calendar);
    } catch (error) {
      this.logger.error(`[GoogleSync] Failed to delete Google event`, error);
    }
  }

  /**
   * 수동 동기화 트리거 (FR-SCH-053)
   */
  async manualSync(calId: string): Promise<{ synced: boolean; status: string }> {
    const calendar = await this.calendarRepo.findOne({ where: { calId } });
    if (!calendar) return { synced: false, status: 'NOT_FOUND' };

    await this.pushToGoogle(calendar);

    return {
      synced: calendar.calSyncStatus === 'SYNCED',
      status: calendar.calSyncStatus,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isGoogleConnected(_userId: string): boolean {
    // TODO: 사용자별 Google OAuth 토큰 존재 여부 확인
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
