import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { CalendarRecurrenceEntity } from './calendar-recurrence.entity';
import { CalendarExceptionEntity } from './calendar-exception.entity';
import { CalendarParticipantEntity } from './calendar-participant.entity';
import { CalendarNotificationEntity } from './calendar-notification.entity';

@Entity('amb_calendars')
@Index(['usrId', 'calDeletedAt'])
@Index(['entId', 'calVisibility', 'calDeletedAt'])
@Index(['calStartAt', 'calEndAt'])
export class CalendarEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cal_id' })
  calId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ name: 'cal_title', type: 'varchar', length: 300 })
  calTitle: string;

  @Column({ name: 'cal_description', type: 'text', nullable: true })
  calDescription: string | null;

  @Column({ name: 'cal_start_at', type: 'timestamptz' })
  calStartAt: Date;

  @Column({ name: 'cal_end_at', type: 'timestamptz' })
  calEndAt: Date;

  @Column({ name: 'cal_is_all_day', type: 'boolean', default: false })
  calIsAllDay: boolean;

  @Column({ name: 'cal_location', type: 'varchar', length: 500, nullable: true })
  calLocation: string | null;

  @Column({ name: 'cal_category', type: 'varchar', length: 20, default: 'WORK' })
  calCategory: string;

  @Column({ name: 'cal_visibility', type: 'varchar', length: 20, default: 'PRIVATE' })
  calVisibility: string;

  @Column({ name: 'cal_color', type: 'varchar', length: 7, nullable: true })
  calColor: string | null;

  @Column({ name: 'cal_recurrence_type', type: 'varchar', length: 10, default: 'NONE' })
  calRecurrenceType: string;

  @Column({ name: 'cal_google_event_id', type: 'varchar', length: 255, nullable: true })
  calGoogleEventId: string | null;

  @Column({ name: 'cal_sync_status', type: 'varchar', length: 20, default: 'NOT_SYNCED' })
  calSyncStatus: string;

  @Column({ name: 'cal_sync_at', type: 'timestamptz', nullable: true })
  calSyncAt: Date | null;

  @CreateDateColumn({ name: 'cal_created_at' })
  calCreatedAt: Date;

  @UpdateDateColumn({ name: 'cal_updated_at' })
  calUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cal_deleted_at' })
  calDeletedAt: Date | null;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  owner: UserEntity;

  @OneToOne(() => CalendarRecurrenceEntity, (r) => r.calendar, { cascade: true })
  recurrence: CalendarRecurrenceEntity;

  @OneToMany(() => CalendarExceptionEntity, (e) => e.calendar, { cascade: true })
  exceptions: CalendarExceptionEntity[];

  @OneToMany(() => CalendarParticipantEntity, (p) => p.calendar, { cascade: true })
  participants: CalendarParticipantEntity[];

  @OneToMany(() => CalendarNotificationEntity, (n) => n.calendar, { cascade: true })
  notifications: CalendarNotificationEntity[];
}
