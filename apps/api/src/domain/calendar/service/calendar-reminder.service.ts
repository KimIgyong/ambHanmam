import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { CalendarEntity } from '../entity/calendar.entity';
import { CalendarNotificationEntity } from '../entity/calendar-notification.entity';
import { CalendarParticipantEntity } from '../entity/calendar-participant.entity';

/**
 * Calendar Reminder Service (FR-SCH-030~035)
 * - Cron으로 리마인더 발송 시각 도래한 일정을 체크
 * - 수신 대상: 주최자 + ACCEPTED/TENTATIVE 참여자
 * - 채널: TALK (아메바톡 내부 알림) + EMAIL (선택)
 */
@Injectable()
export class CalendarReminderService {
  private readonly logger = new Logger(CalendarReminderService.name);

  /** 리마인더 타입 → 분 (minutes) 변환 */
  private static readonly REMINDER_MINUTES: Record<string, number> = {
    '5MIN': 5,
    '10MIN': 10,
    '30MIN': 30,
    '1HOUR': 60,
    '1DAY': 1440,
  };

  constructor(
    @InjectRepository(CalendarEntity)
    private readonly calendarRepo: Repository<CalendarEntity>,
    @InjectRepository(CalendarNotificationEntity)
    private readonly notificationRepo: Repository<CalendarNotificationEntity>,
    @InjectRepository(CalendarParticipantEntity)
    private readonly participantRepo: Repository<CalendarParticipantEntity>,
  ) {}

  /**
   * 매 5분마다 리마인더 발송 체크
   * 일정 시작 N분 전에 해당하는 알림을 찾아 발송
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processReminders() {
    const now = new Date();
    this.logger.debug(`[Reminder] Checking reminders at ${now.toISOString()}`);

    try {
      // 향후 24시간 이내 시작하는 일정 중 알림 설정이 있는 것
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const calendars = await this.calendarRepo
        .createQueryBuilder('s')
        .innerJoinAndSelect('s.notifications', 'n')
        .leftJoinAndSelect('s.participants', 'p')
        .where('s.calDeletedAt IS NULL')
        .andWhere('s.calStartAt > :now', { now: now.toISOString() })
        .andWhere('s.calStartAt <= :cutoff', { cutoff: cutoff.toISOString() })
        .andWhere("n.clnReminderType != 'NONE'")
        .getMany();

      for (const calendar of calendars) {
        for (const notif of calendar.notifications) {
          const reminderMinutes = this.getReminderMinutes(notif);
          if (reminderMinutes === null) continue;

          const triggerTime = new Date(calendar.calStartAt.getTime() - reminderMinutes * 60 * 1000);

          // Check if now is within the trigger window (±3 minutes)
          const diff = Math.abs(now.getTime() - triggerTime.getTime());
          if (diff <= 3 * 60 * 1000) {
            await this.sendReminder(calendar, notif);
          }
        }
      }
    } catch (error) {
      this.logger.error('[Reminder] Error processing reminders', error);
    }
  }

  /**
   * 참여자 초대 시 즉시 알림 발송 (FR-SCH-032)
   * Controller/Service에서 직접 호출
   */
  async sendInvitationNotification(
    calendar: CalendarEntity,
    participantUserIds: string[],
  ) {
    this.logger.log(
      `[Invitation] Sending invitation for calendar "${calendar.calTitle}" to ${participantUserIds.length} users`,
    );

    // TODO: 아메바톡 내부 알림 API 호출
    // TODO: 이메일 알림 발송 (SMTP)
    // 현재는 로그만 기록
    for (const uid of participantUserIds) {
      this.logger.log(`  → Invitation notification to user ${uid}`);
    }
  }

  private getReminderMinutes(notif: CalendarNotificationEntity): number | null {
    if (notif.clnReminderType === 'CUSTOM') {
      return notif.clnCustomMinutes ?? null;
    }
    return CalendarReminderService.REMINDER_MINUTES[notif.clnReminderType] ?? null;
  }

  private async sendReminder(
    calendar: CalendarEntity,
    notif: CalendarNotificationEntity,
  ) {
    // Collect recipients: owner + ACCEPTED/TENTATIVE participants (FR-SCH-031)
    const recipientIds: string[] = [calendar.usrId];

    if (calendar.participants?.length) {
      const activeParticipants = calendar.participants.filter(
        (p) => p.clpResponseStatus === 'ACCEPTED' || p.clpResponseStatus === 'TENTATIVE',
      );
      recipientIds.push(...activeParticipants.map((p) => p.usrId));
    }

    const uniqueRecipients = [...new Set(recipientIds)];
    const channels = notif.clnChannels || ['TALK'];

    this.logger.log(
      `[Reminder] Calendar "${calendar.calTitle}" (${calendar.calId}) → ${uniqueRecipients.length} recipients via ${channels.join(',')}`,
    );

    // TODO: 실제 아메바톡 알림 서비스 연동
    // TODO: 실제 이메일 발송 서비스 연동
    // Placeholder for now
    for (const uid of uniqueRecipients) {
      if (channels.includes('TALK')) {
        this.logger.debug(`  → TALK reminder to user ${uid}`);
      }
      if (channels.includes('EMAIL')) {
        this.logger.debug(`  → EMAIL reminder to user ${uid}`);
      }
    }
  }
}
