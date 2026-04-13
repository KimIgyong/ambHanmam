import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { PartnerAppEntity } from './partner-app.entity';

@Unique('UQ_partner_app_install', ['papId', 'paiEntityId'])
@Entity('amb_partner_app_installs')
export class PartnerAppInstallEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pai_id' })
  paiId: string;

  @Column({ name: 'pap_id', type: 'uuid' })
  papId: string;

  @ManyToOne(() => PartnerAppEntity, { nullable: false })
  @JoinColumn({ name: 'pap_id' })
  app: PartnerAppEntity;

  @Column({ name: 'ent_id', type: 'uuid' })
  paiEntityId: string;

  @Column({ name: 'pai_installed_by', type: 'uuid' })
  paiInstalledBy: string;

  @Column({ name: 'pai_is_active', type: 'boolean', default: true })
  paiIsActive: boolean;

  @Column({ name: 'pai_allowed_roles', type: 'text', nullable: true, default: null })
  paiAllowedRoles: string | null;

  @Column({ name: 'pai_sort_order', type: 'int', default: 0 })
  paiSortOrder: number;

  @Column({ name: 'pai_approved_scopes', type: 'text', array: true, default: '{}' })
  paiApprovedScopes: string[];

  @CreateDateColumn({ name: 'pai_installed_at' })
  paiInstalledAt: Date;
}
