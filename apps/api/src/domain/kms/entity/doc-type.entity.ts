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

@Entity('amb_kms_doc_types')
@Index('idx_dtp_code', ['entId', 'dtpCode'], { unique: true, where: '"dtp_is_active" = TRUE' })
export class DocTypeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dtp_id' })
  dtpId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'dtp_code', length: 30 })
  dtpCode: string; // 'COMPANY_INTRO' | 'SERVICE_INTRO' | 'PRODUCT_INTRO' | 'STRATEGY_IR'

  @Column({ name: 'dtp_name', length: 200 })
  dtpName: string;

  @Column({ name: 'dtp_name_kr', length: 200, nullable: true })
  dtpNameKr: string;

  @Column({ name: 'dtp_description', type: 'text', nullable: true })
  dtpDescription: string;

  @Column({ name: 'dtp_section_template', type: 'jsonb', default: '[]' })
  dtpSectionTemplate: any; // [{ order, code, name, required }]

  @Column({ name: 'dtp_base_data_refs', type: 'jsonb', default: '[]' })
  dtpBaseDataRefs: string[]; // ["COMPANY_IDENTITY", "LEGAL_ENTITIES", ...]

  @Column({ name: 'dtp_inherits_from', type: 'uuid', nullable: true })
  dtpInheritsFrom: string;

  @Column({ name: 'dtp_is_active', default: true })
  dtpIsActive: boolean;

  @CreateDateColumn({ name: 'dtp_created_at' })
  dtpCreatedAt: Date;

  @UpdateDateColumn({ name: 'dtp_updated_at' })
  dtpUpdatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => DocTypeEntity, { nullable: true })
  @JoinColumn({ name: 'dtp_inherits_from' })
  parentType: DocTypeEntity;
}
