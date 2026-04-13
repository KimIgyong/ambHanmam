import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_kms_doc_base_categories')
@Index('idx_dbc_code', ['entId', 'dbcCode'], { unique: true, where: '"dbc_is_active" = TRUE' })
export class DocBaseCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dbc_id' })
  dbcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'dbc_code', length: 50 })
  dbcCode: string; // 'COMPANY_IDENTITY' | 'CORE_VALUES' | 'KPI_DASHBOARD' | ...

  @Column({ name: 'dbc_name', length: 200 })
  dbcName: string;

  @Column({ name: 'dbc_name_kr', length: 200, nullable: true })
  dbcNameKr: string;

  @Column({ name: 'dbc_description', type: 'text', nullable: true })
  dbcDescription: string;

  @Column({ name: 'dbc_field_schema', type: 'jsonb' })
  dbcFieldSchema: any; // [{ field, type, required, label, schema? }]

  @Column({ name: 'dbc_data_source', length: 30, default: 'MANUAL' })
  dbcDataSource: string; // 'MANUAL' | 'BILLING_MODULE' | 'HR_MODULE' | 'PROJECT_MODULE' | 'GOOGLE_DRIVE' | 'AI_EXTRACTED' | 'DDD'

  @Column({ name: 'dbc_confidentiality', length: 20, default: 'INTERNAL' })
  dbcConfidentiality: string; // 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'

  @Column({ name: 'dbc_display_order', type: 'int', default: 0 })
  dbcDisplayOrder: number;

  @Column({ name: 'dbc_is_active', default: true })
  dbcIsActive: boolean;

  @CreateDateColumn({ name: 'dbc_created_at' })
  dbcCreatedAt: Date;

  @UpdateDateColumn({ name: 'dbc_updated_at' })
  dbcUpdatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
