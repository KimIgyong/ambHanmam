import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { BankAccountEntity } from './bank-account.entity';

@Entity('amb_recurring_expenses')
export class RecurringExpenseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'rex_id' })
  rexId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'bac_id', type: 'uuid' })
  bacId: string;

  @Column({ name: 'rex_name', length: 200 })
  rexName: string;

  @Column({ name: 'rex_vendor', type: 'varchar', length: 300, nullable: true })
  rexVendor: string | null;

  @Column({ name: 'rex_amount', type: 'decimal', precision: 18, scale: 2 })
  rexAmount: number;

  @Column({ name: 'rex_currency', length: 10 })
  rexCurrency: string;

  @Column({ name: 'rex_day_of_month', type: 'integer' })
  rexDayOfMonth: number;

  @Column({ name: 'rex_category', type: 'varchar', length: 100, nullable: true })
  rexCategory: string | null;

  @Column({ name: 'rex_description', type: 'text', nullable: true })
  rexDescription: string | null;

  @Column({ name: 'rex_is_active', type: 'boolean', default: true })
  rexIsActive: boolean;

  @Column({ name: 'rex_start_date', type: 'date', nullable: true, default: null })
  rexStartDate: string | null;

  @Column({ name: 'rex_end_date', type: 'date', nullable: true, default: null })
  rexEndDate: string | null;

  @CreateDateColumn({ name: 'rex_created_at' })
  rexCreatedAt: Date;

  @UpdateDateColumn({ name: 'rex_updated_at' })
  rexUpdatedAt: Date;

  @DeleteDateColumn({ name: 'rex_deleted_at' })
  rexDeletedAt: Date | null;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bac_id' })
  bankAccount: BankAccountEntity;
}
