import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from '../todo/entity/todo.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { AttendanceEntity } from '../attendance/entity/attendance.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { CellEntity } from '../members/entity/cell.entity';
import { EmployeeEntity } from '../hr/entity/employee.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { TodayReportEntity } from './entity/today-report.entity';
import { DailyMissionEntity } from './entity/daily-mission.entity';
import { TodaySnapshotEntity } from './entity/today-snapshot.entity';
import { TodaySnapshotMemoEntity } from './entity/today-snapshot-memo.entity';
import { CalendarEntity } from '../calendar/entity/calendar.entity';
import { TodayService } from './service/today.service';
import { MissionService } from './service/mission.service';
import { SnapshotService } from './service/snapshot.service';
import { SnapshotMemoService } from './service/snapshot-memo.service';
import { DailyNoteService } from './service/daily-note.service';
import { TodayController } from './controller/today.controller';
import { HrModule } from '../hr/hr.module';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';
import { MeetingNotesModule } from '../meeting-notes/meeting-notes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TodoEntity, IssueEntity, AttendanceEntity, EntityUserRoleEntity, UserUnitRoleEntity, UnitEntity, UserCellEntity, CellEntity,
      EmployeeEntity, UserEntity, TodayReportEntity,
      DailyMissionEntity, TodaySnapshotEntity, TodaySnapshotMemoEntity,
      CalendarEntity,
    ]),
    HrModule,
    ClaudeModule,
    MeetingNotesModule,
  ],
  controllers: [TodayController],
  providers: [TodayService, MissionService, SnapshotService, SnapshotMemoService, DailyNoteService],
})
export class TodayModule {}
