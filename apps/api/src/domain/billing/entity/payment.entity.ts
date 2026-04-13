import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { InvoiceEntity } from './invoice.entity';

@Entity('amb_bil_payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pay_id' })
  payId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'inv_id', type: 'uuid' })
  invId: string;

  @Column({ name: 'pay_amount', type: 'decimal', precision: 15, scale: 2 })
  payAmount: number;

  @Column({ name: 'pay_currency', length: 3 })
  payCurrency: string;

  @Column({ name: 'pay_date', type: 'date' })
  payDate: string;

  @Column({ name: 'pay_method', length: 30, default: 'BANK_TRANSFER' })
  payMethod: string; // BANK_TRANSFER | CASH | CHECK | CARD | OTHER

  @Column({ name: 'pay_reference', length: 100, nullable: true })
  payReference: string;

  @Column({ name: 'pay_note', type: 'text', nullable: true })
  payNote: string;

  @CreateDateColumn({ name: 'pay_created_at' })
  payCreatedAt: Date;

  @UpdateDateColumn({ name: 'pay_updated_at' })
  payUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pay_deleted_at' })
  payDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => InvoiceEntity)
  @JoinColumn({ name: 'inv_id' })
  invoice: InvoiceEntity;
}
