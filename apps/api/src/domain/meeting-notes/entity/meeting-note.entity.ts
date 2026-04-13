import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { MeetingNoteProjectEntity } from './meeting-note-project.entity';
import { MeetingNoteParticipantEntity } from './meeting-note-participant.entity';
import { MeetingNoteIssueEntity } from './meeting-note-issue.entity';
import { MeetingNoteCommentEntity } from './meeting-note-comment.entity';
import { MeetingNoteRatingEntity } from './meeting-note-rating.entity';
import { MeetingNoteFolderEntity } from './meeting-note-folder.entity';
import { MeetingNoteTodoEntity } from './meeting-note-todo.entity';
import { NoteLinkEntity } from './note-link.entity';

@Entity('amb_meeting_notes')
export class MeetingNoteEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mtn_id' })
  mtnId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'mtn_title', length: 200 })
  mtnTitle: string;

  @Column({ name: 'mtn_content', type: 'text' })
  mtnContent: string;

  @Column({ name: 'mtn_type', type: 'varchar', length: 20, default: 'MEMO' })
  mtnType: string;

  @Column({ name: 'mtn_meeting_date', type: 'date' })
  mtnMeetingDate: Date;

  @Column({ name: 'mtn_visibility', length: 20, default: 'PRIVATE' })
  mtnVisibility: string;

  @Column({ name: 'mtn_unit', type: 'varchar', length: 30, nullable: true })
  mtnUnit: string | null;

  @Column({ name: 'mtn_cell_id', type: 'uuid', nullable: true })
  mtnCellId: string | null;

  @Column({ name: 'mtn_original_lang', type: 'varchar', length: 5, default: 'ko' })
  mtnOriginalLang: string;

  @Column({ name: 'mtn_assignee_id', type: 'uuid', nullable: true })
  mtnAssigneeId: string | null;

  @Column({ name: 'mtn_folder_id', type: 'uuid', nullable: true })
  mtnFolderId: string | null;

  @CreateDateColumn({ name: 'mtn_created_at' })
  mtnCreatedAt: Date;

  @UpdateDateColumn({ name: 'mtn_updated_at' })
  mtnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'mtn_deleted_at' })
  mtnDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'mtn_assignee_id' })
  assignee: UserEntity | null;

  @ManyToOne(() => MeetingNoteFolderEntity, { nullable: true })
  @JoinColumn({ name: 'mtn_folder_id' })
  folder: MeetingNoteFolderEntity | null;

  @OneToMany(() => MeetingNoteProjectEntity, (p) => p.meetingNote)
  projects: MeetingNoteProjectEntity[];

  @OneToMany(() => MeetingNoteParticipantEntity, (p) => p.meetingNote)
  participants: MeetingNoteParticipantEntity[];

  @OneToMany(() => MeetingNoteIssueEntity, (i) => i.meetingNote)
  issues: MeetingNoteIssueEntity[];

  @OneToMany(() => MeetingNoteCommentEntity, (c) => c.meetingNote)
  comments: MeetingNoteCommentEntity[];

  @OneToMany(() => MeetingNoteRatingEntity, (r) => r.meetingNote)
  ratings: MeetingNoteRatingEntity[];

  @OneToMany(() => MeetingNoteTodoEntity, (t) => t.meetingNote)
  todos: MeetingNoteTodoEntity[];

  @OneToMany(() => NoteLinkEntity, (l) => l.sourceNote)
  outgoingLinks: NoteLinkEntity[];

  @Column({ name: 'mtn_search_vector', type: 'tsvector', select: false, nullable: true })
  mtnSearchVector: string | null;
}
