import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('amb_menu_unit_permissions')
@Unique(['mupMenuCode', 'mupUnitName', 'entId'])
export class MenuUnitPermissionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mup_id' })
  mupId: string;

  @Column({ name: 'mup_menu_code', type: 'varchar', length: 50 })
  mupMenuCode: string;

  @Column({ name: 'mup_unit_name', type: 'varchar', length: 30 })
  mupUnitName: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'mup_accessible', type: 'boolean', default: true })
  mupAccessible: boolean;

  @CreateDateColumn({ name: 'mup_created_at' })
  mupCreatedAt: Date;

  @UpdateDateColumn({ name: 'mup_updated_at' })
  mupUpdatedAt: Date;
}
