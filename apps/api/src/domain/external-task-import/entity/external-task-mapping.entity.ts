import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { EntityCustomAppEntity } from '../../entity-settings/entity/entity-custom-app.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_external_task_mappings')
@Unique(['entId', 'etmProvider', 'etmExternalId'])
@Index(['entId', 'etmProvider'])
@Index(['issId'])
export class ExternalTaskMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'etm_id' })
  etmId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'eca_id', type: 'uuid' })
  ecaId: string;

  @Column({ name: 'etm_provider', type: 'varchar', length: 20 })
  etmProvider: string;

  @Column({ name: 'etm_external_id', type: 'varchar', length: 100 })
  etmExternalId: string;

  @Column({ name: 'etm_external_url', type: 'text', nullable: true })
  etmExternalUrl: string | null;

  @Column({ name: 'etm_external_project', type: 'varchar', length: 200, nullable: true })
  etmExternalProject: string | null;

  @Column({ name: 'etm_external_group', type: 'varchar', length: 200, nullable: true })
  etmExternalGroup: string | null;

  @Column({ name: 'iss_id', type: 'uuid' })
  issId: string;

  @Column({ name: 'etm_imported_by', type: 'uuid' })
  etmImportedBy: string;

  @Column({ name: 'etm_imported_at', type: 'timestamptz', default: () => 'NOW()' })
  etmImportedAt: Date;

  @CreateDateColumn({ name: 'etm_created_at' })
  etmCreatedAt: Date;

  // ── Relations ──

  @ManyToOne(() => HrEntityEntity, { nullable: false })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => EntityCustomAppEntity, { nullable: false })
  @JoinColumn({ name: 'eca_id' })
  customApp: EntityCustomAppEntity;

  @ManyToOne(() => IssueEntity, { nullable: false })
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: 'etm_imported_by' })
  importedBy: UserEntity;
}
