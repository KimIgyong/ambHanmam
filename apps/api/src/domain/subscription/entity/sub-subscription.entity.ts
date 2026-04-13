import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BillingCycle, SubscriptionStatus } from './subscription.enums';
import { SubPlanEntity } from './sub-plan.entity';
import { SubTokenWalletEntity } from './sub-token-wallet.entity';
import { SubStorageQuotaEntity } from './sub-storage-quota.entity';

@Entity('amb_sub_subscriptions')
@Index('idx_amb_sub_subscriptions_ent_id', ['ent_id'])
@Index('idx_amb_sub_subscriptions_status', ['sbn_status'])
export class SubSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  sbn_id: string;

  @Column({ type: 'uuid' })
  ent_id: string;

  @Column({ type: 'uuid' })
  pln_id: string;

  @Column({ type: 'varchar', length: 20, default: SubscriptionStatus.ACTIVE })
  sbn_status: SubscriptionStatus;

  @Column({ type: 'varchar', length: 10, default: BillingCycle.MONTHLY })
  sbn_billing_cycle: BillingCycle;

  @Column({ type: 'int', default: 5 })
  sbn_user_count: number;

  @Column({ type: 'int', default: 0 })
  sbn_paid_user_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  sbn_current_period_start: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sbn_current_period_end: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sbn_trial_end_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sbn_cancelled_at: Date | null;

  @Column({ type: 'boolean', default: false })
  sbn_is_cancel_scheduled: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sbn_pg_subscription_id: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  sbn_pg_customer_id: string | null;

  @CreateDateColumn()
  sbn_created_at: Date;

  @UpdateDateColumn()
  sbn_updated_at: Date;

  @DeleteDateColumn()
  sbn_deleted_at: Date | null;

  // ── Relations ─────────────────────────────────────────
  @ManyToOne(() => SubPlanEntity, (p) => p.subscriptions)
  @JoinColumn({ name: 'pln_id' })
  plan: SubPlanEntity;

  @OneToMany(() => SubTokenWalletEntity, (w) => w.subscription)
  tokenWallets: SubTokenWalletEntity[];

  @OneToOne(() => SubStorageQuotaEntity, (q) => q.subscription)
  storageQuota: SubStorageQuotaEntity;
}
