import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_content_translations')
@Unique('UQ_translation_source_target', ['trnSourceType', 'trnSourceId', 'trnSourceField', 'trnTargetLang'])
export class ContentTranslationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'trn_id' })
  trnId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'trn_source_type', type: 'varchar', length: 30 })
  trnSourceType: string;

  @Column({ name: 'trn_source_id', type: 'uuid' })
  trnSourceId: string;

  @Column({ name: 'trn_source_field', type: 'varchar', length: 50 })
  trnSourceField: string;

  @Column({ name: 'trn_source_lang', type: 'varchar', length: 5 })
  trnSourceLang: string;

  @Column({ name: 'trn_target_lang', type: 'varchar', length: 5 })
  trnTargetLang: string;

  @Column({ name: 'trn_content', type: 'text' })
  trnContent: string;

  @Column({ name: 'trn_source_hash', type: 'varchar', length: 64, nullable: true })
  trnSourceHash: string | null;

  @Column({ name: 'trn_method', type: 'varchar', length: 20, default: 'AI' })
  trnMethod: string;

  @Column({ name: 'trn_confidence', type: 'decimal', precision: 3, scale: 2, nullable: true })
  trnConfidence: number | null;

  @Column({ name: 'trn_is_stale', type: 'boolean', default: false })
  trnIsStale: boolean;

  @Column({ name: 'trn_is_locked', type: 'boolean', default: false })
  trnIsLocked: boolean;

  @Column({ name: 'trn_locked_by', type: 'uuid', nullable: true })
  trnLockedBy: string | null;

  @Column({ name: 'trn_locked_at', type: 'timestamp', nullable: true })
  trnLockedAt: Date | null;

  @Column({ name: 'trn_translated_by', type: 'uuid' })
  trnTranslatedBy: string;

  @Column({ name: 'trn_last_edited_by', type: 'uuid', nullable: true })
  trnLastEditedBy: string | null;

  @Column({ name: 'trn_last_edited_at', type: 'timestamp', nullable: true })
  trnLastEditedAt: Date | null;

  @Column({ name: 'trn_version', type: 'integer', default: 1 })
  trnVersion: number;

  @Column({ name: 'trn_is_deleted', type: 'boolean', default: false })
  trnIsDeleted: boolean;

  @Column({ name: 'trn_deleted_at', type: 'timestamp', nullable: true })
  trnDeletedAt: Date | null;

  @CreateDateColumn({ name: 'trn_created_at' })
  trnCreatedAt: Date;

  @UpdateDateColumn({ name: 'trn_updated_at' })
  trnUpdatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'trn_translated_by' })
  translatedByUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'trn_last_edited_by' })
  lastEditedByUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'trn_locked_by' })
  lockedByUser: UserEntity;
}
