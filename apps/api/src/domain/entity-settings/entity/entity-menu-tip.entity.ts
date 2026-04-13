import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('amb_entity_menu_tips')
export class EntityMenuTipEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'emt_id' })
  emtId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'emt_menu_code', type: 'varchar', length: 50 })
  emtMenuCode: string;

  @Column({ name: 'emt_title', type: 'varchar', length: 200, nullable: true })
  emtTitle: string | null;

  @Column({ name: 'emt_content', type: 'text', nullable: true })
  emtContent: string | null;

  @Column({ name: 'emt_is_active', type: 'boolean', default: true })
  emtIsActive: boolean;

  @Column({ name: 'emt_sort_order', type: 'int', default: 0 })
  emtSortOrder: number;

  @CreateDateColumn({ name: 'emt_created_at' })
  emtCreatedAt: Date;

  @UpdateDateColumn({ name: 'emt_updated_at' })
  emtUpdatedAt: Date;
}
