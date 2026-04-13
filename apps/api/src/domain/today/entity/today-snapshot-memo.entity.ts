import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_today_snapshot_memos')
export class TodaySnapshotMemoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'smo_id' })
  smoId: string;

  @Column({ name: 'snp_id', type: 'uuid' })
  snpId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'smo_content', type: 'text' })
  smoContent: string;

  @Column({ name: 'smo_order', type: 'smallint', default: 0 })
  smoOrder: number;

  @CreateDateColumn({ name: 'smo_created_at' })
  smoCreatedAt: Date;

  @UpdateDateColumn({ name: 'smo_updated_at' })
  smoUpdatedAt: Date;

  @DeleteDateColumn({ name: 'smo_deleted_at' })
  smoDeletedAt: Date | null;
}
