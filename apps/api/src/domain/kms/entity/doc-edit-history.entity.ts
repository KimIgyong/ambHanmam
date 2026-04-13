import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { DocGeneratedEntity } from './doc-generated.entity';

@Entity('amb_kms_doc_edit_history')
@Index('idx_deh_document', ['dgnId', 'dehCreatedAt'])
export class DocEditHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'deh_id' })
  dehId: string;

  @Column({ name: 'dgn_id', type: 'uuid' })
  dgnId: string;

  @Column({ name: 'deh_action', length: 20 })
  dehAction: string; // 'GENERATED' | 'DOWNLOADED' | 'RE_UPLOADED' | 'DIFF_ANALYZED' | 'BASE_DATA_UPDATED' | 'REVIEWED' | 'APPROVED' | 'FINALIZED'

  @Column({ name: 'deh_uploaded_file_id', length: 200, nullable: true })
  dehUploadedFileId: string;

  @Column({ name: 'deh_diff_result', type: 'jsonb', nullable: true })
  dehDiffResult: any; // { sections_changed, data_updates_suggested, structural_changes }

  @Column({ name: 'deh_base_data_updates', type: 'jsonb', nullable: true })
  dehBaseDataUpdates: any; // Accepted base data updates from diff

  @Column({ name: 'deh_user_id', type: 'uuid' })
  dehUserId: string;

  @Column({ name: 'deh_notes', type: 'text', nullable: true })
  dehNotes: string;

  @CreateDateColumn({ name: 'deh_created_at' })
  dehCreatedAt: Date;

  // Relations
  @ManyToOne(() => DocGeneratedEntity, (d) => d.editHistory)
  @JoinColumn({ name: 'dgn_id' })
  document: DocGeneratedEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'deh_user_id' })
  user: UserEntity;
}
