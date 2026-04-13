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
import { DocBaseDataEntity } from './doc-base-data.entity';

@Entity('amb_kms_doc_base_data_history')
@Index('idx_dbh_data', ['dbdId', 'dbhVersion'])
export class DocBaseDataHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dbh_id' })
  dbhId: string;

  @Column({ name: 'dbd_id', type: 'uuid' })
  dbdId: string;

  @Column({ name: 'dbh_version', type: 'int' })
  dbhVersion: number;

  @Column({ name: 'dbh_data', type: 'jsonb' })
  dbhData: any; // Snapshot of data at this version

  @Column({ name: 'dbh_change_reason', type: 'text', nullable: true })
  dbhChangeReason: string;

  @Column({ name: 'dbh_diff_summary', type: 'text', nullable: true })
  dbhDiffSummary: string; // AI-generated diff description

  @Column({ name: 'dbh_changed_by', type: 'uuid' })
  dbhChangedBy: string;

  @CreateDateColumn({ name: 'dbh_created_at' })
  dbhCreatedAt: Date;

  // Relations
  @ManyToOne(() => DocBaseDataEntity, (d) => d.history)
  @JoinColumn({ name: 'dbd_id' })
  baseData: DocBaseDataEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'dbh_changed_by' })
  changedByUser: UserEntity;
}
