import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InvoiceEntity } from './invoice.entity';

@Entity('amb_bil_invoice_items')
export class InvoiceItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'itm_id' })
  itmId: string;

  @Column({ name: 'inv_id' })
  invId: string;

  @Column({ name: 'itm_seq', type: 'int' })
  itmSeq: number;

  @Column({ name: 'itm_description', length: 500 })
  itmDescription: string;

  @Column({ name: 'itm_quantity', type: 'decimal', precision: 10, scale: 2, default: 1 })
  itmQuantity: number;

  @Column({ name: 'itm_unit_price', type: 'decimal', precision: 15, scale: 2 })
  itmUnitPrice: number;

  @Column({ name: 'itm_amount', type: 'decimal', precision: 15, scale: 2 })
  itmAmount: number;

  @ManyToOne(() => InvoiceEntity, (inv) => inv.items)
  @JoinColumn({ name: 'inv_id' })
  invoice: InvoiceEntity;
}
