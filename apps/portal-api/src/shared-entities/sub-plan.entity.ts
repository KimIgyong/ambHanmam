import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('amb_sub_plans')
export class SubPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  pln_id: string;

  @Column({ length: 20, unique: true })
  pln_code: string;

  @Column({ length: 100 })
  pln_name: string;

  @Column({ type: 'varchar', length: 20 })
  pln_tier: string;

  @Column({ type: 'numeric', precision: 10, scale: 4, default: 0 })
  pln_price_per_user: number;

  @Column({ type: 'int', default: 0 })
  pln_token_onetime: number;

  @Column({ type: 'int', default: 0 })
  pln_token_per_user_monthly: number;

  @Column({ type: 'int', default: 10000 })
  pln_token_addon_unit: number;

  @Column({ type: 'numeric', precision: 10, scale: 4, default: 1.0 })
  pln_token_addon_price: number;

  @Column({ type: 'boolean', default: false })
  pln_is_token_monthly_reset: boolean;

  @Column({ type: 'int', default: 1 })
  pln_storage_base_gb: number;

  @Column({ type: 'int', default: 1 })
  pln_storage_max_gb: number;

  @Column({ type: 'int', default: 0 })
  pln_storage_addon_unit_gb: number;

  @Column({ type: 'numeric', precision: 10, scale: 4, default: 1.0 })
  pln_storage_addon_price_gb: number;

  @Column({ type: 'int', default: 5 })
  pln_max_users: number;

  @Column({ type: 'int', default: 1 })
  pln_min_users: number;

  @Column({ type: 'int', default: 5 })
  pln_user_slot_size: number;

  @Column({ type: 'int', default: 5 })
  pln_free_user_count: number;

  @Column({ type: 'boolean', default: true })
  pln_is_referral_enabled: boolean;

  @Column({ type: 'int', default: 50000 })
  pln_referral_reward_tokens: number;

  @Column({ type: 'int', default: 10 })
  pln_referral_invite_required: number;

  @Column({ type: 'boolean', default: false })
  pln_is_annual_available: boolean;

  @Column({ type: 'int', default: 0 })
  pln_annual_free_months: number;

  @Column({ type: 'boolean', default: true })
  pln_is_active: boolean;

  @Column({ type: 'int', default: 0 })
  pln_sort_order: number;

  @CreateDateColumn()
  pln_created_at: Date;

  @UpdateDateColumn()
  pln_updated_at: Date;

  @DeleteDateColumn()
  pln_deleted_at: Date | null;
}
