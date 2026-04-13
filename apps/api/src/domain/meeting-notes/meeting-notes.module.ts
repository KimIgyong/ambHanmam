import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingNoteEntity } from './entity/meeting-note.entity';
import { MeetingNoteProjectEntity } from './entity/meeting-note-project.entity';
import { MeetingNoteParticipantEntity } from './entity/meeting-note-participant.entity';
import { MeetingNoteIssueEntity } from './entity/meeting-note-issue.entity';
import { MeetingNoteCommentEntity } from './entity/meeting-note-comment.entity';
import { MeetingNoteRatingEntity } from './entity/meeting-note-rating.entity';
import { MeetingNoteFolderEntity } from './entity/meeting-note-folder.entity';
import { NoteLinkEntity } from './entity/note-link.entity';
import { MeetingNoteTodoEntity } from './entity/meeting-note-todo.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { MeetingNoteService } from './service/meeting-note.service';
import { NoteLinkService } from './service/note-link.service';
import { MeetingNoteController } from './controller/meeting-note.controller';
import { HrModule } from '../hr/hr.module';
import { TranslationModule } from '../translation/translation.module';
import { MembersModule } from '../members/members.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingNoteEntity,
      MeetingNoteProjectEntity,
      MeetingNoteParticipantEntity,
      MeetingNoteIssueEntity,
      MeetingNoteCommentEntity,
      MeetingNoteRatingEntity,
      MeetingNoteFolderEntity,
      NoteLinkEntity,
      MeetingNoteTodoEntity,
      UserEntity,
    ]),
    HrModule,
    TranslationModule,
    MembersModule,
    IssuesModule,
  ],
  controllers: [MeetingNoteController],
  providers: [MeetingNoteService, NoteLinkService],
  exports: [MeetingNoteService],
})
export class MeetingNotesModule {}
