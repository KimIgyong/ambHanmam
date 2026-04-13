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
import { DocTypeEntity } from './doc-type.entity';

@Entity('amb_kms_doc_templates')
@Index('idx_dtl_type', ['entId', 'dtpId'], { where: '"dtl_is_active" = TRUE' })
export class DocTemplateEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dtl_id' })
  dtlId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'dtp_id', type: 'uuid' })
  dtpId: string;

  @Column({ name: 'dtl_name', length: 200 })
  dtlName: string;

  @Column({ name: 'dtl_description', type: 'text', nullable: true })
  dtlDescription: string;

  @Column({ name: 'dtl_file_format', length: 10 })
  dtlFileFormat: string; // 'pptx' | 'docx'

  @Column({ name: 'dtl_template_file_id', length: 200, nullable: true })
  dtlTemplateFileId: string;

  @Column({ name: 'dtl_brand_config', type: 'jsonb', nullable: true })
  dtlBrandConfig: any; // { primary_color, secondary_color, font_heading, font_body, logo_placement, footer_text }

  @Column({ name: 'dtl_section_layout', type: 'jsonb', nullable: true })
  dtlSectionLayout: any; // Per-section layout configs

  @Column({ name: 'dtl_is_default', default: false })
  dtlIsDefault: boolean;

  @Column({ name: 'dtl_is_active', default: true })
  dtlIsActive: boolean;

  @CreateDateColumn({ name: 'dtl_created_at' })
  dtlCreatedAt: Date;

  @UpdateDateColumn({ name: 'dtl_updated_at' })
  dtlUpdatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => DocTypeEntity)
  @JoinColumn({ name: 'dtp_id' })
  docType: DocTypeEntity;
}
