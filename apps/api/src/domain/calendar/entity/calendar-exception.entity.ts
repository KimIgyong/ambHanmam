import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CalendarEntity } from './calendar.entity';

@Entity('amb_calendar_exceptions')
export class CalendarExceptionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cle_id' })
  cleId: string;

  @Column({ name: 'cal_id', type: 'uuid' })
  calId: string;

  @Column({ name: 'cle_original_date', type: 'date' })
  cleOriginalDate: Date;

  @Column({ name: 'cle_exception_type', type: 'varchar', length: 20 })
  cleExceptionType: string;

  @Column({ name: 'cle_new_start_at', type: 'timestamptz', nullable: true })
  cleNewStartAt: Date | null;

  @Column({ name: 'cle_new_end_at', type: 'timestamptz', nullable: true })
  cleNewEndAt: Date | null;

  @CreateDateColumn({ name: 'cle_created_at' })
  cleCreatedAt: Date;

  // Relation
  @ManyToOne(() => CalendarEntity, (s) => s.exceptions)
  @JoinColumn({ name: 'cal_id' })
  calendar: CalendarEntity;
}
