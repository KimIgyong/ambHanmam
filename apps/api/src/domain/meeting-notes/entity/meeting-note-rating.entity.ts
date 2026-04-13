import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique, Check,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_meeting_note_ratings')
@Unique(['mtnId', 'usrId'])
@Check('"mnr_rating" >= 1 AND "mnr_rating" <= 5')
export class MeetingNoteRatingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnr_id' })
  mnrId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'mnr_rating', type: 'smallint' })
  mnrRating: number;

  @CreateDateColumn({ name: 'mnr_created_at' })
  mnrCreatedAt: Date;

  @UpdateDateColumn({ name: 'mnr_updated_at' })
  mnrUpdatedAt: Date;

  @ManyToOne(() => MeetingNoteEntity, (n) => n.ratings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
