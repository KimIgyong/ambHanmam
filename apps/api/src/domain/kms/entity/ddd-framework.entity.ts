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
import { DddDashboardEntity } from './ddd-dashboard.entity';
import { DddMetricEntity } from './ddd-metric.entity';

@Entity('amb_kms_ddd_frameworks')
export class DddFrameworkEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'fwk_id' })
  fwkId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'fwk_name', length: 100 })
  fwkName: string; // '5A Matrix', 'OKR', 'BSC'

  @Column({ name: 'fwk_description', type: 'text', nullable: true })
  fwkDescription: string;

  @Column({ name: 'fwk_template', type: 'jsonb' })
  fwkTemplate: any;
  // {
  //   stages: [{ key, label: { en, ko }, icon, color, order }],
  //   gauges: [{ key, label: { en, ko }, weight }],
  //   strategy_steps: ["Build", "Launch", "Scale", "Diversify"]
  // }

  @Column({ name: 'fwk_version', length: 20, default: '1.0.0' })
  fwkVersion: string;

  @Column({ name: 'fwk_is_active', default: true })
  fwkIsActive: boolean;

  @Column({ name: 'fwk_created_by', type: 'uuid', nullable: true })
  fwkCreatedBy: string;

  @CreateDateColumn({ name: 'fwk_created_at' })
  fwkCreatedAt: Date;

  @UpdateDateColumn({ name: 'fwk_updated_at' })
  fwkUpdatedAt: Date;

  @DeleteDateColumn({ name: 'fwk_deleted_at' })
  fwkDeletedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'fwk_created_by' })
  createdByUser: UserEntity;

  @OneToMany(() => DddDashboardEntity, (d) => d.framework)
  dashboards: DddDashboardEntity[];

  @OneToMany(() => DddMetricEntity, (m) => m.framework)
  metrics: DddMetricEntity[];
}
