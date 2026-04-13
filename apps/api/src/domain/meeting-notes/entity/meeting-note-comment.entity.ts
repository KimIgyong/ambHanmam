import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_meeting_note_comments')
export class MeetingNoteCommentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnc_id' })
  mncId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'mnc_author_id', type: 'uuid' })
  mncAuthorId: string;

  @Column({ name: 'mnc_content', type: 'text' })
  mncContent: string;

  @Column({ name: 'mnc_parent_id', type: 'uuid', nullable: true })
  mncParentId: string | null;

  @CreateDateColumn({ name: 'mnc_created_at' })
  mncCreatedAt: Date;

  @UpdateDateColumn({ name: 'mnc_updated_at' })
  mncUpdatedAt: Date;

  @DeleteDateColumn({ name: 'mnc_deleted_at' })
  mncDeletedAt: Date;

  @ManyToOne(() => MeetingNoteEntity, (n) => n.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'mnc_author_id' })
  author: UserEntity;

  @ManyToOne(() => MeetingNoteCommentEntity, (c) => c.replies, { nullable: true })
  @JoinColumn({ name: 'mnc_parent_id' })
  parent: MeetingNoteCommentEntity;

  @OneToMany(() => MeetingNoteCommentEntity, (c) => c.parent)
  replies: MeetingNoteCommentEntity[];
}
