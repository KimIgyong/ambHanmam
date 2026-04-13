import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';

@Entity('amb_calendar_recurrences')
export class CalendarRecurrenceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'clr_id' })
  clrId: string;

  @Column({ name: 'cal_id', type: 'uuid', unique: true })
  calId: string;

  @Column({ name: 'clr_freq', type: 'varchar', length: 20 })
  clrFreq: string;

  @Column({ name: 'clr_interval', type: 'int', default: 1 })
  clrInterval: number;

  @Column({ name: 'clr_weekdays', type: 'smallint', nullable: true })
  clrWeekdays: number | null;

  @Column({ name: 'clr_month_day', type: 'int', nullable: true })
  clrMonthDay: number | null;

  @Column({ name: 'clr_end_type', type: 'varchar', length: 10 })
  clrEndType: string;

  @Column({ name: 'clr_end_date', type: 'date', nullable: true })
  clrEndDate: Date | null;

  @Column({ name: 'clr_count', type: 'int', nullable: true })
  clrCount: number | null;

  @CreateDateColumn({ name: 'clr_created_at' })
  clrCreatedAt: Date;

  // Relation
  @OneToOne(() => CalendarEntity, (s) => s.recurrence)
  @JoinColumn({ name: 'cal_id' })
  calendar: CalendarEntity;
}
