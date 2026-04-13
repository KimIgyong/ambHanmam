import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { DddDashboardEntity } from './ddd-dashboard.entity';

@Entity('amb_kms_ddd_gauge_scores')
@Unique('uq_gsc_dashboard_period_dimension', ['ddbId', 'gscPeriod', 'gscDimension'])
export class DddGaugeScoreEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'gsc_id' })
  gscId: string;

  @Column({ name: 'ddb_id', type: 'uuid' })
  ddbId: string;

  @Column({ name: 'gsc_period', length: 20 })
  gscPeriod: string; // '2026-Q1'

  @Column({ name: 'gsc_dimension', length: 50 })
  gscDimension: string; // 'process' | 'capability' | 'quality'

  @Column({ name: 'gsc_score', type: 'decimal', precision: 5, scale: 2 })
  gscScore: number; // 0.0 ~ 100.0

  @Column({ name: 'gsc_prev_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  gscPrevScore: number;

  @Column({ name: 'gsc_details', type: 'jsonb', nullable: true })
  gscDetails: any; // Per-item scores within the dimension

  @Column({ name: 'gsc_assessed_by', length: 20, default: 'AI' })
  gscAssessedBy: string; // 'AI' | 'MANAGER' | 'SELF'

  @CreateDateColumn({ name: 'gsc_created_at' })
  gscCreatedAt: Date;

  // Relations
  @ManyToOne(() => DddDashboardEntity, (d) => d.gaugeScores)
  @JoinColumn({ name: 'ddb_id' })
  dashboard: DddDashboardEntity;
}
