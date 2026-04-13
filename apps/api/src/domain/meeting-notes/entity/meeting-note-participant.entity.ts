import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_meeting_note_participants')
@Unique(['mtnId', 'usrId'])
export class MeetingNoteParticipantEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnpt_id' })
  mnptId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @ManyToOne(() => MeetingNoteEntity, (n) => n.participants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
