import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';

@Entity('amb_asana_project_mappings')
export class AsanaProjectMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'apm_id' })
  apmId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'apm_asana_project_gid', type: 'varchar', length: 50 })
  apmAsanaProjectGid: string;

  @Column({ name: 'apm_asana_project_name', type: 'varchar', length: 200, nullable: true })
  apmAsanaProjectName: string | null;

  @Column({ name: 'apm_asana_workspace_gid', type: 'varchar', length: 50, nullable: true })
  apmAsanaWorkspaceGid: string | null;

  @Column({ name: 'pjt_id', type: 'uuid', nullable: true })
  pjtId: string | null;

  @Column({ name: 'apm_status', type: 'varchar', length: 20, default: 'ACTIVE' })
  apmStatus: string;

  @Column({ name: 'apm_last_synced_at', type: 'timestamp', nullable: true })
  apmLastSyncedAt: Date | null;

  @CreateDateColumn({ name: 'apm_created_at' })
  apmCreatedAt: Date;

  @UpdateDateColumn({ name: 'apm_updated_at' })
  apmUpdatedAt: Date;

  @DeleteDateColumn({ name: 'apm_deleted_at' })
  apmDeletedAt: Date | null;
}
