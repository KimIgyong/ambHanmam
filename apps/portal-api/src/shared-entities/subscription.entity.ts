import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { SvcClientEntity } from './client.entity';
import { SvcServiceEntity } from './service.entity';
import { SvcPlanEntity } from './service-plan.entity';

@Entity('amb_svc_subscriptions')
export class SvcSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sub_id' })
  subId: string;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'svc_id', type: 'uuid' })
  svcId: string;

  @Column({ name: 'spl_id', type: 'uuid', nullable: true })
  splId: string;

  @Column({ name: 'sub_status', length: 20, default: 'ACTIVE' })
  subStatus: string;

  @Column({ name: 'sub_start_date', type: 'date' })
  subStartDate: string;

  @Column({ name: 'sub_end_date', type: 'date', nullable: true })
  subEndDate: string;

  @Column({ name: 'sub_trial_end_date', type: 'date', nullable: true })
  subTrialEndDate: string;

  @Column({ name: 'sub_billing_cycle', length: 20, nullable: true })
  subBillingCycle: string;

  @Column({ name: 'sub_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  subPrice: number;

  @Column({ name: 'sub_currency', length: 3, default: 'USD' })
  subCurrency: string;

  @Column({ name: 'sub_discount_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  subDiscountRate: number;

  @Column({ name: 'sub_max_users', type: 'int', nullable: true })
  subMaxUsers: number;

  @Column({ name: 'sub_actual_users', type: 'int', default: 0 })
  subActualUsers: number;

  @Column({ name: 'sub_contract_id', type: 'uuid', nullable: true })
  subContractId: string;

  @Column({ name: 'sub_auto_renew', type: 'boolean', default: true })
  subAutoRenew: boolean;

  @Column({ name: 'sub_cancelled_at', type: 'timestamp', nullable: true })
  subCancelledAt: Date;

  @Column({ name: 'sub_cancellation_reason', type: 'text', nullable: true })
  subCancellationReason: string;

  @Column({ name: 'sub_note', type: 'text', nullable: true })
  subNote: string;

  @Column({ name: 'sub_stripe_subscription_id', length: 50, nullable: true })
  subStripeSubscriptionId: string;

  @Column({ name: 'sub_stripe_price_id', length: 50, nullable: true })
  subStripePriceId: string;

  @Column({ name: 'sub_current_period_start', type: 'timestamptz', nullable: true })
  subCurrentPeriodStart: Date;

  @Column({ name: 'sub_current_period_end', type: 'timestamptz', nullable: true })
  subCurrentPeriodEnd: Date;

  @Column({ name: 'sub_cancel_at_period_end', type: 'boolean', default: false })
  subCancelAtPeriodEnd: boolean;

  @CreateDateColumn({ name: 'sub_created_at' })
  subCreatedAt: Date;

  @UpdateDateColumn({ name: 'sub_updated_at' })
  subUpdatedAt: Date;

  @DeleteDateColumn({ name: 'sub_deleted_at' })
  subDeletedAt: Date;

  @ManyToOne(() => SvcClientEntity)
  @JoinColumn({ name: 'cli_id' })
  client: SvcClientEntity;

  @ManyToOne(() => SvcServiceEntity)
  @JoinColumn({ name: 'svc_id' })
  service: SvcServiceEntity;

  @ManyToOne(() => SvcPlanEntity)
  @JoinColumn({ name: 'spl_id' })
  plan: SvcPlanEntity;
}
