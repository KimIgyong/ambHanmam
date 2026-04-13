import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';

@Entity('amb_calendar_notifications')
export class CalendarNotificationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cln_id' })
  clnId: string;

  @Column({ name: 'cal_id', type: 'uuid' })
  calId: string;

  @Column({ name: 'cln_reminder_type', type: 'varchar', length: 20 })
  clnReminderType: string;

  @Column({ name: 'cln_custom_minutes', type: 'int', nullable: true })
  clnCustomMinutes: number | null;

  @Column({ name: 'cln_channels', type: 'jsonb', default: '["TALK"]' })
  clnChannels: string[];

  @CreateDateColumn({ name: 'cln_created_at' })
  clnCreatedAt: Date;

  // Relation
  @ManyToOne(() => CalendarEntity, (s) => s.notifications)
  @JoinColumn({ name: 'cal_id' })
  calendar: CalendarEntity;
}
