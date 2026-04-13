import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_external_import_logs')
export class ExternalImportLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eil_id' })
  eilId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'eca_id', type: 'uuid' })
  ecaId: string;

  @Column({ name: 'eil_provider', type: 'varchar', length: 20 })
  eilProvider: string;

  @Column({ name: 'eil_batch_id', type: 'uuid' })
  eilBatchId: string;

  @Column({ name: 'eil_project_name', type: 'varchar', length: 200, nullable: true })
  eilProjectName: string | null;

  @Column({ name: 'eil_group_name', type: 'varchar', length: 200, nullable: true })
  eilGroupName: string | null;

  @Column({ name: 'eil_total_count', type: 'int', default: 0 })
  eilTotalCount: number;

  @Column({ name: 'eil_imported_count', type: 'int', default: 0 })
  eilImportedCount: number;

  @Column({ name: 'eil_skipped_count', type: 'int', default: 0 })
  eilSkippedCount: number;

  @Column({ name: 'eil_failed_count', type: 'int', default: 0 })
  eilFailedCount: number;

  @Column({ name: 'eil_executed_by', type: 'uuid' })
  eilExecutedBy: string;

  @CreateDateColumn({ name: 'eil_created_at' })
  eilCreatedAt: Date;

  // ── Relations ──

  @ManyToOne(() => HrEntityEntity, { nullable: false })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'eil_executed_by' })
  executedBy: UserEntity;
}
