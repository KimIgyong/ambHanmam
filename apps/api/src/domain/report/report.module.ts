import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkReportEntity } from './entity/work-report.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { TodoStatusLogEntity } from '../todo/entity/todo-status-log.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { IssueStatusLogEntity } from '../issues/entity/issue-status-log.entity';
import { DailyMissionEntity } from '../today/entity/daily-mission.entity';
import { TodayReportEntity } from '../today/entity/today-report.entity';
import { ReportAggregatorService } from './service/report-aggregator.service';
import { ReportAiService } from './service/report-ai.service';
import { ReportController } from './controller/report.controller';
import { ClaudeModule } from '../../infrastructure/external/claude/claude.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkReportEntity,
      TodoEntity,
      TodoStatusLogEntity,
      IssueEntity,
      IssueStatusLogEntity,
      DailyMissionEntity,
      TodayReportEntity,
    ]),
    ClaudeModule,
  ],
  controllers: [ReportController],
  providers: [ReportAggregatorService, ReportAiService],
  exports: [ReportAggregatorService, ReportAiService],
})
export class ReportModule {}
