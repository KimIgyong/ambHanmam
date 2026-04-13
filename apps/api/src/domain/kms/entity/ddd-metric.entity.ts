import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DddFrameworkEntity } from './ddd-framework.entity';
import { DddSnapshotEntity } from './ddd-snapshot.entity';

@Entity('amb_kms_ddd_metrics')
export class DddMetricEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'met_id' })
  metId: string;

  @Column({ name: 'fwk_id', type: 'uuid' })
  fwkId: string;

  @Column({ name: 'met_stage', length: 50 })
  metStage: string; // 'advertise' | 'acquisition' | 'activation' | 'accelerate' | 'advocate'

  @Column({ name: 'met_key', length: 100 })
  metKey: string; // 'cost_per_lead' | 'conversion_rate' | ...

  @Column({ name: 'met_label', type: 'jsonb' })
  metLabel: any; // { en: "Cost per Lead", ko: "리드당 비용" }

  @Column({ name: 'met_unit', length: 20, nullable: true })
  metUnit: string; // '$' | '%' | '건' | 'VND'

  @Column({ name: 'met_direction', length: 10, default: 'UP' })
  metDirection: string; // 'UP' (higher is better) | 'DOWN' (lower is better)

  @Column({ name: 'met_data_source', length: 50, nullable: true })
  metDataSource: string; // 'BILLING' | 'HR' | 'SERVICE' | 'PROJECT' | 'MANUAL' | 'API'

  @Column({ name: 'met_query_config', type: 'jsonb', nullable: true })
  metQueryConfig: any;
  // {
  //   source: "BILLING",
  //   table: "amb_bil_contracts",
  //   aggregation: "COUNT",
  //   filter: { status: "ACTIVE" },
  //   period_field: "ctr_start_date"
  // }

  @Column({ name: 'met_order', type: 'int', default: 0 })
  metOrder: number;

  @Column({ name: 'met_is_primary', default: false })
  metIsPrimary: boolean; // Primary KPI for 5A summary view

  @CreateDateColumn({ name: 'met_created_at' })
  metCreatedAt: Date;

  // Relations
  @ManyToOne(() => DddFrameworkEntity, (f) => f.metrics)
  @JoinColumn({ name: 'fwk_id' })
  framework: DddFrameworkEntity;

  @OneToMany(() => DddSnapshotEntity, (s) => s.metric)
  snapshots: DddSnapshotEntity[];
}
