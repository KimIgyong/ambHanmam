import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Own entities
import { IssueRatingEntity } from './entity/issue-rating.entity';
import { TodoRatingEntity } from './entity/todo-rating.entity';
import { CommentRatingEntity } from './entity/comment-rating.entity';
import { ActivityWeightConfigEntity } from './entity/activity-weight-config.entity';
import { DailyActivityStatEntity } from './entity/daily-activity-stat.entity';

// External entities for stats aggregation
import { IssueEntity } from '../issues/entity/issue.entity';
import { TodoEntity } from '../todo/entity/todo.entity';
import { MeetingNoteEntity } from '../meeting-notes/entity/meeting-note.entity';
import { IssueCommentEntity } from '../issues/entity/issue-comment.entity';
import { TodoCommentEntity } from '../todo/entity/todo-comment.entity';
import { MeetingNoteCommentEntity } from '../meeting-notes/entity/meeting-note-comment.entity';
import { TalkMessageEntity } from '../amoeba-talk/entity/talk-message.entity';
import { MeetingNoteRatingEntity } from '../meeting-notes/entity/meeting-note-rating.entity';
import { TalkReactionEntity } from '../amoeba-talk/entity/talk-reaction.entity';
import { IssueStatusLogEntity } from '../issues/entity/issue-status-log.entity';
import { IssueCommentReactionEntity } from '../issues/entity/issue-comment-reaction.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { UserEntity } from '../auth/entity/user.entity';

// Services
import { ContentRatingService } from './service/content-rating.service';
import { ActivityWeightService } from './service/activity-weight.service';
import { ActivityStatsService } from './service/activity-stats.service';
import { ActivitySnapshotService } from './service/activity-snapshot.service';

// Controllers
import { ContentRatingController } from './controller/content-rating.controller';
import { ActivityWeightController } from './controller/activity-weight.controller';
import { ActivityStatsController } from './controller/activity-stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Own entities
      IssueRatingEntity,
      TodoRatingEntity,
      CommentRatingEntity,
      ActivityWeightConfigEntity,
      DailyActivityStatEntity,
      // External entities
      IssueEntity,
      TodoEntity,
      MeetingNoteEntity,
      IssueCommentEntity,
      TodoCommentEntity,
      MeetingNoteCommentEntity,
      TalkMessageEntity,
      MeetingNoteRatingEntity,
      TalkReactionEntity,
      IssueStatusLogEntity,
      IssueCommentReactionEntity,
      HrEntityEntity,
      UserEntity,
    ]),
  ],
  controllers: [
    ContentRatingController,
    ActivityWeightController,
    ActivityStatsController,
  ],
  providers: [
    ContentRatingService,
    ActivityWeightService,
    ActivityStatsService,
    ActivitySnapshotService,
  ],
  exports: [
    ContentRatingService,
    ActivityWeightService,
    ActivityStatsService,
  ],
})
export class ActivityIndexModule {}
