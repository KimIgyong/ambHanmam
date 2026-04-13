import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { DddFrameworkEntity } from './ddd-framework.entity';
import { DddSnapshotEntity } from './ddd-snapshot.entity';
import { DddGaugeScoreEntity } from './ddd-gauge-score.entity';
import { DddAiInsightEntity } from './ddd-ai-insight.entity';

@Entity('amb_kms_ddd_dashboards')
export class DddDashboardEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ddb_id' })
  ddbId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'fwk_id', type: 'uuid' })
  fwkId: string;

  @Column({ name: 'ddb_name', length: 200 })
  ddbName: string; // 'amoeba Platform 5A Dashboard'

  @Column({ name: 'ddb_scope', length: 50 })
  ddbScope: string; // 'ENTITY' | 'SERVICE' | 'PROJECT'

  @Column({ name: 'ddb_scope_id', type: 'uuid', nullable: true })
  ddbScopeId: string; // service/project ID (null = entity-wide)

  @Column({ name: 'ddb_period_type', length: 20, default: 'QUARTER' })
  ddbPeriodType: string; // 'MONTH' | 'QUARTER' | 'YEAR'

  @Column({ name: 'ddb_config', type: 'jsonb', nullable: true })
  ddbConfig: any; // Dashboard-specific custom settings

  @Column({ name: 'ddb_strategy_step', type: 'int', default: 1 })
  ddbStrategyStep: number; // Current strategy position (1~6)

  @Column({ name: 'ddb_is_active', default: true })
  ddbIsActive: boolean;

  @Column({ name: 'ddb_created_by', type: 'uuid', nullable: true })
  ddbCreatedBy: string;

  @CreateDateColumn({ name: 'ddb_created_at' })
  ddbCreatedAt: Date;

  @UpdateDateColumn({ name: 'ddb_updated_at' })
  ddbUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ddb_deleted_at' })
  ddbDeletedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => DddFrameworkEntity, (f) => f.dashboards)
  @JoinColumn({ name: 'fwk_id' })
  framework: DddFrameworkEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ddb_created_by' })
  createdByUser: UserEntity;

  @OneToMany(() => DddSnapshotEntity, (s) => s.dashboard)
  snapshots: DddSnapshotEntity[];

  @OneToMany(() => DddGaugeScoreEntity, (g) => g.dashboard)
  gaugeScores: DddGaugeScoreEntity[];

  @OneToMany(() => DddAiInsightEntity, (i) => i.dashboard)
  insights: DddAiInsightEntity[];
}
