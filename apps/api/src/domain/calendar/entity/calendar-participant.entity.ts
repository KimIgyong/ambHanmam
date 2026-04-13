import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_calendar_participants')
@Unique(['calId', 'usrId'])
@Index(['usrId', 'clpResponseStatus'])
export class CalendarParticipantEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'clp_id' })
  clpId: string;

  @Column({ name: 'cal_id', type: 'uuid' })
  calId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'clp_response_status', type: 'varchar', length: 20, default: 'NONE' })
  clpResponseStatus: string;

  @Column({ name: 'clp_responded_at', type: 'timestamptz', nullable: true })
  clpRespondedAt: Date | null;

  @Column({ name: 'clp_invited_by', type: 'uuid' })
  clpInvitedBy: string;

  @CreateDateColumn({ name: 'clp_created_at' })
  clpCreatedAt: Date;

  // Relations
  @ManyToOne(() => CalendarEntity, (s) => s.participants)
  @JoinColumn({ name: 'cal_id' })
  calendar: CalendarEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'clp_invited_by' })
  invitedByUser: UserEntity;
}
