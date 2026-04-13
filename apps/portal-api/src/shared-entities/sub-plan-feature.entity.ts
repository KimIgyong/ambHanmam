import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('amb_sub_plan_features')
export class SubPlanFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  plf_id: string;

  @Column({ length: 60, unique: true })
  plf_feature_key: string;

  @Column({ length: 120 })
  plf_label_i18n_key: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  plf_value_free: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  plf_value_basic: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  plf_value_premium: string | null;

  @Column({ type: 'boolean', default: false })
  plf_is_check: boolean;

  @Column({ type: 'boolean', default: false })
  plf_highlight: boolean;

  @Column({ type: 'int', default: 0 })
  plf_sort_order: number;

  @Column({ type: 'boolean', default: true })
  plf_is_active: boolean;

  @CreateDateColumn()
  plf_created_at: Date;

  @UpdateDateColumn()
  plf_updated_at: Date;
}
