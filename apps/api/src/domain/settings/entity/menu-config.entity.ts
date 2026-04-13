import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_menu_config')
export class MenuConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mcf_id' })
  mcfId: string;

  @Column({ name: 'mcf_menu_code', length: 50, unique: true })
  mcfMenuCode: string;

  @Column({ name: 'mcf_label_key', length: 100 })
  mcfLabelKey: string;

  @Column({ name: 'mcf_icon', length: 50 })
  mcfIcon: string;

  @Column({ name: 'mcf_path', length: 200 })
  mcfPath: string;

  @Column({ name: 'mcf_category', length: 30 })
  mcfCategory: string;

  @Column({ name: 'mcf_enabled', default: true })
  mcfEnabled: boolean;

  @Column({ name: 'mcf_sort_order', type: 'int', default: 0 })
  mcfSortOrder: number;

  @UpdateDateColumn({ name: 'mcf_updated_at' })
  mcfUpdatedAt: Date;

  @Column({ name: 'mcf_updated_by', type: 'uuid', nullable: true })
  mcfUpdatedBy: string | null;
}
