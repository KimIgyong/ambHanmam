import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
  Index,
} from 'typeorm';

@Entity('amb_entity_menu_configs')
@Unique('uq_entity_menu_config_ent_menu', ['entId', 'emcMenuCode'])
@Index('idx_entity_menu_config_ent_sort', ['entId', 'emcSortOrder'])
export class EntityMenuConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'emc_id' })
  emcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'emc_menu_code', length: 50 })
  emcMenuCode: string;

  @Column({ name: 'emc_category', length: 30 })
  emcCategory: string;

  @Column({ name: 'emc_sort_order', type: 'int' })
  emcSortOrder: number;

  @Column({ name: 'emc_visible', type: 'boolean', default: true })
  emcVisible: boolean;

  @UpdateDateColumn({ name: 'emc_updated_at' })
  emcUpdatedAt: Date;

  @Column({ name: 'emc_updated_by', type: 'uuid', nullable: true })
  emcUpdatedBy: string | null;
}
