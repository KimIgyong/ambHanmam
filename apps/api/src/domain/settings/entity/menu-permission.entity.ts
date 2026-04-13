import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('amb_menu_permissions')
@Unique(['mpmMenuCode', 'mpmRole'])
export class MenuPermissionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mpm_id' })
  mpmId: string;

  @Column({ name: 'mpm_menu_code', length: 50 })
  mpmMenuCode: string;

  @Column({ name: 'mpm_role', length: 20 })
  mpmRole: string;

  @Column({ name: 'mpm_accessible', default: true })
  mpmAccessible: boolean;

  @CreateDateColumn({ name: 'mpm_created_at' })
  mpmCreatedAt: Date;

  @UpdateDateColumn({ name: 'mpm_updated_at' })
  mpmUpdatedAt: Date;
}
