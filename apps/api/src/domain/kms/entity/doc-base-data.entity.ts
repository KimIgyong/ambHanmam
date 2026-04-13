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
import { DocBaseCategoryEntity } from './doc-base-category.entity';
import { DocBaseDataHistoryEntity } from './doc-base-data-history.entity';

@Entity('amb_kms_doc_base_data')
@Index('idx_dbd_category', ['dbcId', 'dbdLanguage'], { where: '"dbd_is_current" = TRUE' })
@Index('idx_dbd_freshness', ['dbdFreshnessAt'], { where: '"dbd_is_current" = TRUE' })
export class DocBaseDataEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dbd_id' })
  dbdId: string;

  @Column({ name: 'dbc_id', type: 'uuid' })
  dbcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'dbd_language', length: 5, default: 'en' })
  dbdLanguage: string; // 'en' | 'ko' | 'vi'

  @Column({ name: 'dbd_data', type: 'jsonb' })
  dbdData: any; // Field values matching category schema

  @Column({ name: 'dbd_version', type: 'int', default: 1 })
  dbdVersion: number;

  @Column({ name: 'dbd_is_current', default: true })
  dbdIsCurrent: boolean;

  @Column({ name: 'dbd_updated_by', type: 'uuid' })
  dbdUpdatedBy: string;

  @Column({ name: 'dbd_update_source', length: 30, default: 'MANUAL' })
  dbdUpdateSource: string; // 'MANUAL' | 'AI_EXTRACTED' | 'MODULE_SYNC' | 'UPLOAD_DIFF' | 'DDD_SYNC'

  @Column({ name: 'dbd_freshness_at', type: 'timestamp', default: () => 'NOW()' })
  dbdFreshnessAt: Date;

  @CreateDateColumn({ name: 'dbd_created_at' })
  dbdCreatedAt: Date;

  @UpdateDateColumn({ name: 'dbd_updated_at' })
  dbdUpdatedAt: Date;

  // Relations
  @ManyToOne(() => DocBaseCategoryEntity)
  @JoinColumn({ name: 'dbc_id' })
  category: DocBaseCategoryEntity;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dbd_updated_by' })
  updatedByUser: UserEntity;

  @OneToMany(() => DocBaseDataHistoryEntity, (h) => h.baseData)
  history: DocBaseDataHistoryEntity[];
}
