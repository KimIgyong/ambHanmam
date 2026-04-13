import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentTranslationEntity } from './entity/content-translation.entity';
import { TranslationHistoryEntity } from './entity/translation-history.entity';
import { TranslationGlossaryEntity } from './entity/translation-glossary.entity';
import { TranslationUsageEntity } from './entity/translation-usage.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { MeetingNoteEntity } from '../meeting-notes/entity/meeting-note.entity';
import { NoticeEntity } from '../notices/entity/notice.entity';
import { IssueEntity } from '../issues/entity/issue.entity';
import { IssueCommentEntity } from '../issues/entity/issue-comment.entity';
import { ProjectEntity } from '../project/entity/project.entity';
import { PartnerEntity } from '../billing/entity/partner.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { TodayReportEntity } from '../today/entity/today-report.entity';
import { DailyMissionEntity } from '../today/entity/daily-mission.entity';
import { TranslationService } from './service/translation.service';
import { GlossaryService } from './service/glossary.service';
import { TranslationController } from './controller/translation.controller';
import { GlossaryController } from './controller/glossary.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ContentTranslationEntity,
      TranslationHistoryEntity,
      TranslationGlossaryEntity,
      TranslationUsageEntity,
      TodoEntity,
      MeetingNoteEntity,
      NoticeEntity,
      IssueEntity,
      IssueCommentEntity,
      ProjectEntity,
      PartnerEntity,
      SvcClientEntity,
      TodayReportEntity,
      DailyMissionEntity,
    ]),
  ],
  providers: [TranslationService, GlossaryService],
  controllers: [TranslationController, GlossaryController],
  exports: [TranslationService],
})
export class TranslationModule {}
