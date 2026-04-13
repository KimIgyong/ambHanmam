import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { DddDashboardEntity } from './ddd-dashboard.entity';
import { DddMetricEntity } from './ddd-metric.entity';

@Entity('amb_kms_ddd_snapshots')
@Unique('uq_snp_dashboard_metric_period', ['ddbId', 'metId', 'snpPeriod'])
export class DddSnapshotEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'snp_id' })
  snpId: string;

  @Column({ name: 'ddb_id', type: 'uuid' })
  ddbId: string;

  @Column({ name: 'met_id', type: 'uuid' })
  metId: string;

  @Column({ name: 'snp_period', length: 20 })
  snpPeriod: string; // '2026-Q1' | '2026-01'

  @Column({ name: 'snp_value', type: 'decimal', precision: 18, scale: 4, nullable: true })
  snpValue: number;

  @Column({ name: 'snp_prev_value', type: 'decimal', precision: 18, scale: 4, nullable: true })
  snpPrevValue: number;

  @Column({ name: 'snp_change_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  snpChangeRate: number; // % change

  @Column({ name: 'snp_target', type: 'decimal', precision: 18, scale: 4, nullable: true })
  snpTarget: number;

  @Column({ name: 'snp_status', length: 20, default: 'ON_TRACK' })
  snpStatus: string; // 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'

  @Column({ name: 'snp_source_type', length: 20, default: 'AUTO' })
  snpSourceType: string; // 'AUTO' | 'MANUAL' | 'AI_ESTIMATED'

  @Column({ name: 'snp_annotation', type: 'text', nullable: true })
  snpAnnotation: string; // External variable memo (e.g., "Vietnam lockdown")

  @Column({ name: 'snp_raw_data', type: 'jsonb', nullable: true })
  snpRawData: any; // Detailed data for charts (monthly breakdown, etc.)

  @CreateDateColumn({ name: 'snp_created_at' })
  snpCreatedAt: Date;

  @Column({ name: 'snp_created_by', type: 'uuid', nullable: true })
  snpCreatedBy: string;

  // Relations
  @ManyToOne(() => DddDashboardEntity, (d) => d.snapshots)
  @JoinColumn({ name: 'ddb_id' })
  dashboard: DddDashboardEntity;

  @ManyToOne(() => DddMetricEntity, (m) => m.snapshots)
  @JoinColumn({ name: 'met_id' })
  metric: DddMetricEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'snp_created_by' })
  createdByUser: UserEntity;
}
