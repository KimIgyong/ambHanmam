import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { ExpenseRequestEntity } from './expense-request.entity';

export type ExecutionMethod = 'CARD' | 'CASH' | 'TRANSFER' | 'OTHER';
export type ReceiptType = 'RECEIPT' | 'TAX_INVOICE' | 'NONE';

@Entity('amb_expense_executions')
@Index(['exrId'])
@Index(['exdExecutedAt'])
export class ExpenseExecutionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'exd_id' })
  exdId: string;

  @Column({ name: 'exr_id' })
  exrId: string;

  @Column({ name: 'exd_executed_at', type: 'date' })
  exdExecutedAt: string;

  @Column({ name: 'exd_method', length: 20 })
  exdMethod: ExecutionMethod;

  @Column({ name: 'exd_method_note', type: 'varchar', length: 200, nullable: true })
  exdMethodNote: string | null;

  @Column({ name: 'exd_amount', type: 'decimal', precision: 18, scale: 2 })
  exdAmount: number;

  @Column({ name: 'exd_currency', length: 10 })
  exdCurrency: string;

  @Column({ name: 'exd_receipt_type', length: 20, default: 'NONE' })
  exdReceiptType: ReceiptType;

  @Column({ name: 'exd_receipt_number', type: 'varchar', length: 200, nullable: true })
  exdReceiptNumber: string | null;

  @Column({ name: 'exd_receipt_file_name', type: 'varchar', length: 500, nullable: true })
  exdReceiptFileName: string | null;

  @Column({ name: 'exd_receipt_file_size', type: 'bigint', nullable: true })
  exdReceiptFileSize: number | null;

  @Column({ name: 'exd_receipt_mime_type', type: 'varchar', length: 100, nullable: true })
  exdReceiptMimeType: string | null;

  @Column({ name: 'exd_receipt_storage_key', type: 'varchar', length: 1000, nullable: true })
  exdReceiptStorageKey: string | null;

  @Column({ name: 'exd_receipt_link_url', type: 'text', nullable: true })
  exdReceiptLinkUrl: string | null;

  @Column({ name: 'exd_note', type: 'text', nullable: true })
  exdNote: string | null;

  @Column({ name: 'exd_executor_id' })
  exdExecutorId: string;

  @CreateDateColumn({ name: 'exd_created_at' })
  exdCreatedAt: Date;

  @UpdateDateColumn({ name: 'exd_updated_at' })
  exdUpdatedAt: Date;

  // Relations
  @ManyToOne(() => ExpenseRequestEntity, (req) => req.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exr_id' })
  request: ExpenseRequestEntity;
}
