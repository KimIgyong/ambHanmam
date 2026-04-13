import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';

@Entity('amb_meeting_note_todos')
@Unique(['mtnId', 'tdoId'])
export class MeetingNoteTodoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnt_id' })
  mntId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'tdo_id', type: 'uuid' })
  tdoId: string;

  @CreateDateColumn({ name: 'mnt_created_at' })
  mntCreatedAt: Date;

  @ManyToOne(() => MeetingNoteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => TodoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tdo_id' })
  todo: TodoEntity;
}
