import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { DocTypeEntity } from './doc-type.entity';
import { DocEditHistoryEntity } from './doc-edit-history.entity';

@Entity('amb_kms_doc_generated')
@Index('idx_dgn_type', ['entId', 'dtpId', 'dgnStatus'])
@Index('idx_dgn_status', ['dgnStatus', 'dgnUpdatedAt'])
export class DocGeneratedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dgn_id' })
  dgnId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'dtp_id', type: 'uuid' })
  dtpId: string;

  @Column({ name: 'dgn_title', length: 300 })
  dgnTitle: string;

  @Column({ name: 'dgn_language', length: 5, default: 'en' })
  dgnLanguage: string; // 'en' | 'ko' | 'vi'

  @Column({ name: 'dgn_audience_type', length: 30, default: 'GENERAL' })
  dgnAudienceType: string; // 'GENERAL' | 'CLIENT' | 'INVESTOR' | 'PARTNER' | 'GOVERNMENT'

  @Column({ name: 'dgn_status', length: 20, default: 'DRAFT' })
  dgnStatus: string; // 'DRAFT' | 'REVIEW' | 'APPROVED' | 'FINALIZED' | 'OUTDATED' | 'ARCHIVED'

  @Column({ name: 'dgn_version', type: 'int', default: 1 })
  dgnVersion: number;

  @Column({ name: 'dgn_sections_config', type: 'jsonb' })
  dgnSectionsConfig: any; // Selected sections and order

  @Column({ name: 'dgn_data_snapshot', type: 'jsonb' })
  dgnDataSnapshot: any; // Snapshot of all base data used

  @Column({ name: 'dgn_ai_model', length: 50, nullable: true })
  dgnAiModel: string;

  @Column({ name: 'dgn_ai_prompt_hash', length: 64, nullable: true })
  dgnAiPromptHash: string;

  @Column({ name: 'dgn_drive_file_id', length: 200, nullable: true })
  dgnDriveFileId: string;

  @Column({ name: 'dgn_drive_url', length: 500, nullable: true })
  dgnDriveUrl: string;

  @Column({ name: 'dgn_file_format', length: 10, default: 'pptx' })
  dgnFileFormat: string; // 'pptx' | 'docx' | 'pdf' | 'gslides' | 'gdocs'

  @Column({ name: 'dgn_file_size_bytes', type: 'bigint', nullable: true })
  dgnFileSizeBytes: number;

  @Column({ name: 'dgn_generated_by', type: 'uuid' })
  dgnGeneratedBy: string;

  @Column({ name: 'dgn_reviewed_by', type: 'uuid', nullable: true })
  dgnReviewedBy: string;

  @Column({ name: 'dgn_reviewed_at', type: 'timestamp', nullable: true })
  dgnReviewedAt: Date;

  @Column({ name: 'dgn_finalized_by', type: 'uuid', nullable: true })
  dgnFinalizedBy: string;

  @Column({ name: 'dgn_finalized_at', type: 'timestamp', nullable: true })
  dgnFinalizedAt: Date;

  @Column({ name: 'dgn_is_deleted', default: false })
  dgnIsDeleted: boolean;

  @CreateDateColumn({ name: 'dgn_created_at' })
  dgnCreatedAt: Date;

  @UpdateDateColumn({ name: 'dgn_updated_at' })
  dgnUpdatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => DocTypeEntity)
  @JoinColumn({ name: 'dtp_id' })
  docType: DocTypeEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dgn_generated_by' })
  generatedByUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dgn_reviewed_by' })
  reviewedByUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dgn_finalized_by' })
  finalizedByUser: UserEntity;

  @OneToMany(() => DocEditHistoryEntity, (h) => h.document)
  editHistory: DocEditHistoryEntity[];
}
