import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DddDashboardEntity } from './ddd-dashboard.entity';

@Entity('amb_kms_ddd_ai_insights')
export class DddAiInsightEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ais_id' })
  aisId: string;

  @Column({ name: 'ddb_id', type: 'uuid' })
  ddbId: string;

  @Column({ name: 'ais_period', length: 20 })
  aisPeriod: string; // '2026-Q1'

  @Column({ name: 'ais_type', length: 30 })
  aisType: string; // 'TREND' | 'ANOMALY' | 'RECOMMENDATION' | 'FORECAST'

  @Column({ name: 'ais_stage', length: 50, nullable: true })
  aisStage: string; // Related 5A stage (null = overall)

  @Column({ name: 'ais_severity', length: 20, default: 'INFO' })
  aisSeverity: string; // 'INFO' | 'WARNING' | 'CRITICAL'

  @Column({ name: 'ais_title', length: 300 })
  aisTitle: string;

  @Column({ name: 'ais_content', type: 'text' })
  aisContent: string; // AI analysis content (markdown)

  @Column({ name: 'ais_data_refs', type: 'jsonb', nullable: true })
  aisDataRefs: any; // Evidence data references

  @Column({ name: 'ais_action_items', type: 'jsonb', nullable: true })
  aisActionItems: any; // [{ action, priority, assignee }]

  @Column({ name: 'ais_is_read', default: false })
  aisIsRead: boolean;

  @Column({ name: 'ais_is_actioned', default: false })
  aisIsActioned: boolean;

  @CreateDateColumn({ name: 'ais_created_at' })
  aisCreatedAt: Date;

  // Relations
  @ManyToOne(() => DddDashboardEntity, (d) => d.insights)
  @JoinColumn({ name: 'ddb_id' })
  dashboard: DddDashboardEntity;
}
