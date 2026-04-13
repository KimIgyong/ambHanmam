import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { ExpenseForecastReportEntity } from './expense-forecast-report.entity';

export type ForecastItemType = 'RECURRING' | 'MANUAL';

@Entity('amb_expense_forecast_items')
@Index(['efrId'])
export class ExpenseForecastItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'efi_id' })
  efiId: string;

  @Column({ name: 'efr_id' })
  efrId: string;

  @Column({ name: 'efi_type', length: 20 })
  efiType: ForecastItemType;

  @Column({ name: 'exr_id', type: 'uuid', nullable: true })
  exrId: string | null;

  @Column({ name: 'efi_title', length: 200 })
  efiTitle: string;

  @Column({ name: 'efi_category', type: 'varchar', length: 50, nullable: true })
  efiCategory: string | null;

  @Column({ name: 'efi_prev_amount', type: 'decimal', precision: 18, scale: 2, nullable: true })
  efiPrevAmount: number | null;

  @Column({ name: 'efi_amount', type: 'decimal', precision: 18, scale: 2 })
  efiAmount: number;

  @Column({ name: 'efi_currency', length: 10, default: 'VND' })
  efiCurrency: string;

  @Column({ name: 'efi_note', type: 'text', nullable: true })
  efiNote: string | null;

  @Column({ name: 'efi_sort_order', type: 'int', default: 0 })
  efiSortOrder: number;

  @Column({ name: 'efi_quantity', type: 'int', default: 1 })
  efiQuantity: number;

  @CreateDateColumn({ name: 'efi_created_at' })
  efiCreatedAt: Date;

  @UpdateDateColumn({ name: 'efi_updated_at' })
  efiUpdatedAt: Date;

  // Relations
  @ManyToOne(() => ExpenseForecastReportEntity, (report) => report.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'efr_id' })
  report: ExpenseForecastReportEntity;
}
