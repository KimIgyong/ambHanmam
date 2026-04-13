import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('amb_bil_payment_schedules')
export class PaymentScheduleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pms_id' })
  pmsId: string;

  @Column({ name: 'ctr_id', type: 'uuid' })
  ctrId: string;

  @Column({ name: 'pms_seq', type: 'int' })
  pmsSeq: number;

  @Column({ name: 'pms_billing_date', type: 'date' })
  pmsBillingDate: string;

  @Column({ name: 'pms_billing_period', length: 20, nullable: true })
  pmsBillingPeriod: string;

  @Column({ name: 'pms_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  pmsAmount: number;

  @Column({ name: 'pms_status', length: 20, default: 'PENDING' })
  pmsStatus: string;

  @CreateDateColumn({ name: 'pms_created_at' })
  pmsCreatedAt: Date;

  @UpdateDateColumn({ name: 'pms_updated_at' })
  pmsUpdatedAt: Date;

  @ManyToOne(() => ContractEntity, (c) => c.paymentSchedules)
  @JoinColumn({ name: 'ctr_id' })
  contract: ContractEntity;
}
