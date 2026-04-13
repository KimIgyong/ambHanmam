import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEntity } from './entity/calendar.entity';
import { CalendarRecurrenceEntity } from './entity/calendar-recurrence.entity';
import { CalendarExceptionEntity } from './entity/calendar-exception.entity';
import { CalendarParticipantEntity } from './entity/calendar-participant.entity';
import { CalendarNotificationEntity } from './entity/calendar-notification.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { HrModule } from '../hr/hr.module';
import { CalendarService } from './service/calendar.service';
import { CalendarReminderService } from './service/calendar-reminder.service';
import { CalendarAiService } from './service/calendar-ai.service';
import { GoogleCalendarSyncService } from './service/google-calendar-sync.service';
import { CalendarController } from './controller/calendar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CalendarEntity,
      CalendarRecurrenceEntity,
      CalendarExceptionEntity,
      CalendarParticipantEntity,
      CalendarNotificationEntity,
      UserEntity,
      UnitEntity,
      UserUnitRoleEntity,
      UserCellEntity,
    ]),
    HrModule,
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    CalendarReminderService,
    CalendarAiService,
    GoogleCalendarSyncService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
