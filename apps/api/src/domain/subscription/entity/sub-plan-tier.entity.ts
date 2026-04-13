import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubPlanEntity } from './sub-plan.entity';

@Entity('amb_sub_plan_tiers')
export class SubPlanTierEntity {
  @PrimaryGeneratedColumn('uuid')
  plt_id: string;

  @Column({ type: 'uuid' })
  pln_id: string;

  @Column({ type: 'int' })
  plt_tier_number: number;

  @Column({ type: 'int' })
  plt_users_min: number;

  @Column({ type: 'int' })
  plt_users_max: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  plt_monthly_price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  plt_annual_price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  plt_savings: number;

  @Column({ type: 'int' })
  plt_tokens_monthly: number;

  @Column({ type: 'int', default: 0 })
  plt_sort_order: number;

  @Column({ type: 'boolean', default: true })
  plt_is_active: boolean;

  @CreateDateColumn()
  plt_created_at: Date;

  @UpdateDateColumn()
  plt_updated_at: Date;

  // ── Relations ─────────────────────────────────────────
  @ManyToOne(() => SubPlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pln_id' })
  plan: SubPlanEntity;
}
