import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { ExpenseRequestEntity } from './expense-request.entity';

@Entity('amb_expense_request_items')
@Index(['exrId'])
export class ExpenseRequestItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eri_id' })
  eriId: string;

  @Column({ name: 'exr_id' })
  exrId: string;

  @Column({ name: 'eri_name', length: 200 })
  eriName: string;

  @Column({ name: 'eri_quantity', type: 'decimal', precision: 10, scale: 2, default: 1 })
  eriQuantity: number;

  @Column({ name: 'eri_unit_price', type: 'decimal', precision: 18, scale: 2 })
  eriUnitPrice: number;

  @Column({ name: 'eri_tax_amount', type: 'decimal', precision: 18, scale: 2, default: 0 })
  eriTaxAmount: number;

  @Column({ name: 'eri_currency', length: 10, default: 'VND' })
  eriCurrency: string;

  @Column({ name: 'eri_note', type: 'text', nullable: true })
  eriNote: string | null;

  @Column({ name: 'eri_sort_order', type: 'int', default: 0 })
  eriSortOrder: number;

  @CreateDateColumn({ name: 'eri_created_at' })
  eriCreatedAt: Date;

  @UpdateDateColumn({ name: 'eri_updated_at' })
  eriUpdatedAt: Date;

  // Relations
  @ManyToOne(() => ExpenseRequestEntity, (req) => req.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exr_id' })
  request: ExpenseRequestEntity;
}
