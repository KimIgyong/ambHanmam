import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_sub_plan_addons')
export class SubPlanAddonEntity {
  @PrimaryGeneratedColumn('uuid')
  pla_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  pla_addon_key: string;

  @Column({ type: 'varchar', length: 100 })
  pla_label_i18n_key: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pla_value_free: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  pla_value_basic: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pla_unit: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  pla_price: string | null;

  @Column({ type: 'int', default: 0 })
  pla_sort_order: number;

  @Column({ type: 'boolean', default: true })
  pla_is_active: boolean;

  @CreateDateColumn()
  pla_created_at: Date;

  @UpdateDateColumn()
  pla_updated_at: Date;
}
