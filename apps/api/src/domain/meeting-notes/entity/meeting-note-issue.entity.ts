import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';

@Entity('amb_meeting_note_issues')
@Unique(['mtnId', 'issId'])
export class MeetingNoteIssueEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mni_id' })
  mniId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'iss_id', type: 'uuid' })
  issId: string;

  @ManyToOne(() => MeetingNoteEntity, (n) => n.issues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => IssueEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;
}
