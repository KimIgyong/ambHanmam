import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('amb_today_snapshots')
export class TodaySnapshotEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'snp_id' })
  snpId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'msn_id', type: 'uuid' })
  msnId: string;

  @Column({ name: 'snp_date', type: 'date' })
  snpDate: string;

  @Column({ name: 'snp_title', type: 'varchar', length: 100 })
  snpTitle: string;

  @Column({ name: 'snp_data', type: 'jsonb', default: '{}' })
  snpData: Record<string, any>;

  @Column({ name: 'snp_captured_at', type: 'timestamp', default: () => 'NOW()' })
  snpCapturedAt: Date;

  @CreateDateColumn({ name: 'snp_created_at' })
  snpCreatedAt: Date;
}
