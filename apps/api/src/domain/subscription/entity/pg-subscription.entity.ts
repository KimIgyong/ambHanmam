import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubSubscriptionEntity } from './sub-subscription.entity';

@Entity('amb_pg_subscriptions')
@Index('idx_amb_pg_subscriptions_ent_id', ['ent_id'])
@Index('idx_amb_pg_subscriptions_polar_id', ['pgs_polar_subscription_id'])
export class PgSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  pgs_id: string;

  @Column({ type: 'uuid' })
  ent_id: string;

  @Column({ type: 'uuid' })
  sbn_id: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  pgs_polar_subscription_id: string;

  @Column({ type: 'varchar', length: 200 })
  pgs_polar_customer_id: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pgs_polar_product_id: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pgs_polar_price_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  pgs_status: string;

  @Column({ type: 'timestamptz', nullable: true })
  pgs_current_period_start: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  pgs_current_period_end: Date | null;

  @Column({ type: 'boolean', default: false })
  pgs_is_cancel_at_period_end: boolean;

  @Column({ type: 'jsonb', nullable: true })
  pgs_raw_data: Record<string, unknown> | null;

  @CreateDateColumn()
  pgs_created_at: Date;

  @UpdateDateColumn()
  pgs_updated_at: Date;

  // ── Relations ─────────────────────────────────────────
  @ManyToOne(() => SubSubscriptionEntity)
  @JoinColumn({ name: 'sbn_id' })
  subscription: SubSubscriptionEntity;
}
