import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, OneToMany, Unique,
} from 'typeorm';
import { ExpenseForecastItemEntity } from './expense-forecast-item.entity';

@Entity('amb_expense_forecast_reports')
@Index(['entId', 'efrYear', 'efrMonth'])
@Unique(['entId', 'efrYear', 'efrMonth'])
export class ExpenseForecastReportEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'efr_id' })
  efrId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'efr_year', type: 'int' })
  efrYear: number;

  @Column({ name: 'efr_month', type: 'int' })
  efrMonth: number;

  @Column({ name: 'efr_title', type: 'varchar', length: 200, nullable: true })
  efrTitle: string | null;

  @Column({ name: 'efr_note', type: 'text', nullable: true })
  efrNote: string | null;

  @Column({ name: 'efr_creator_id' })
  efrCreatorId: string;

  @Column({ name: 'efr_total_vnd', type: 'decimal', precision: 18, scale: 2, default: 0 })
  efrTotalVnd: number;

  @Column({ name: 'efr_total_usd', type: 'decimal', precision: 18, scale: 2, default: 0 })
  efrTotalUsd: number;

  @Column({ name: 'efr_total_krw', type: 'decimal', precision: 18, scale: 2, default: 0 })
  efrTotalKrw: number;

  @Column({ name: 'efr_status', type: 'varchar', length: 20, default: 'DRAFT' })
  efrStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED';

  @CreateDateColumn({ name: 'efr_created_at' })
  efrCreatedAt: Date;

  @UpdateDateColumn({ name: 'efr_updated_at' })
  efrUpdatedAt: Date;

  // Relations
  @OneToMany(() => ExpenseForecastItemEntity, (item) => item.report, { cascade: true })
  items: ExpenseForecastItemEntity[];
}
